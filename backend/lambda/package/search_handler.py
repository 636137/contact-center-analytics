import json
import boto3
import numpy as np
import faiss

dynamodb = boto3.resource('dynamodb')
bedrock_client = boto3.client('bedrock-runtime')
s3_client = boto3.client('s3')

TABLE = dynamodb.Table('ContactCenterTranscripts')
BUCKET = 'cc-transcripts-1772246760'

def handler(event, context):
    body = json.loads(event['body'])
    query = body['query']
    k = body.get('k', 10)
    filters = body.get('filters', {})
    
    results = search_similar(query, k, filters)
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'results': results})
    }

def search_similar(query_text, k, filters):
    
    # Generate query embedding
    body_req = {"inputText": query_text, "dimensions": 768, "normalize": True}
    response = bedrock_client.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        body=json.dumps(body_req)
    )
    query_embedding = np.array(json.loads(response['Body'].read())['embedding'], dtype=np.float32)
    
    # Load FAISS index
    try:
        obj = s3_client.get_object(Bucket=BUCKET, Key='faiss/index.bin')
        index = faiss.deserialize_index(obj['Body'].read())
        
        obj = s3_client.get_object(Bucket=BUCKET, Key='faiss/id_map.json')
        id_map = json.loads(obj['Body'].read())
    except:
        return []
    
    # Search
    distances, indices = index.search(query_embedding.reshape(1, -1), min(k * 3, len(id_map)))
    
    # Get metadata and apply filters
    results = []
    for idx, distance in zip(indices[0], distances[0]):
        if idx >= len(id_map) or idx < 0:
            continue
        
        transcript_id = id_map[int(idx)]
        try:
            item = TABLE.get_item(Key={'transcript_id': transcript_id})['Item']
        except:
            continue
        
        # Apply filters
        if filters.get('minCsat') and item.get('csat', 0) < filters['minCsat']:
            continue
        if filters.get('fcr') is not None and item.get('fcr') != filters['fcr']:
            continue
        if filters.get('sentiment') and item.get('sentiment') != filters['sentiment']:
            continue
        
        results.append({
            'transcript_id': transcript_id,
            'distance': float(distance),
            'similarity': float(1 / (1 + distance)),
            'metadata': {
                'entity_name': item.get('entity_name'),
                'scenario': item.get('scenario'),
                'csat': item.get('csat'),
                'fcr': item.get('fcr'),
                'aht': item.get('aht'),
                'sentiment': item.get('sentiment'),
                'timestamp': item.get('timestamp')
            }
        })
        
        if len(results) >= k:
            break
    
    return results

import json
import boto3
import numpy as np
import faiss
from io import BytesIO

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
bedrock_client = boto3.client('bedrock-runtime')

BUCKET = 'cc-transcripts-1772246760'
TABLE = dynamodb.Table('ContactCenterTranscripts')
EMBEDDING_MODEL = 'amazon.titan-embed-text-v2:0'

def handler(event, context):
    """
    Index transcript to DynamoDB and S3 with FAISS
    """
    transcript_id = event['transcript_id']
    s3_key = event['s3_key']
    
    # Get transcript from S3
    obj = s3_client.get_object(Bucket=BUCKET, Key=s3_key)
    record = json.loads(obj['Body'].read())
    
    # Store metadata in DynamoDB
    TABLE.put_item(Item={
        'transcript_id': record['transcript_id'],
        'batch_id': record['batch_id'],
        'entity_name': record['entity_name'],
        'scenario': record['scenario'],
        'csat': record['metrics']['csat'],
        'fcr': record['metrics']['fcr'],
        'aht': record['metrics']['aht'],
        'sentiment': record['metrics']['sentiment'],
        'customer_id': record['customer_id'],
        'agent_id': record['agent_id'],
        'timestamp': record['timestamp'],
        's3_key': s3_key,
        'embedding_key': f"embeddings/{transcript_id}.npy"
    })
    
    # Store embedding as numpy array in S3
    embedding_array = np.array(record['embedding'], dtype=np.float32)
    buffer = BytesIO()
    np.save(buffer, embedding_array)
    buffer.seek(0)
    
    s3_client.put_object(
        Bucket=BUCKET,
        Key=f"embeddings/{transcript_id}.npy",
        Body=buffer.getvalue()
    )
    
    # Update FAISS index
    update_faiss_index(transcript_id, embedding_array)
    
    return {
        'statusCode': 200,
        'indexed': True,
        'transcript_id': transcript_id
    }

def update_faiss_index(transcript_id, embedding):
    """
    Update FAISS index with new embedding
    """
    try:
        # Load existing index
        obj = s3_client.get_object(Bucket=BUCKET, Key='faiss/index.bin')
        index = faiss.deserialize_index(obj['Body'].read())
        
        # Load ID mapping
        obj = s3_client.get_object(Bucket=BUCKET, Key='faiss/id_map.json')
        id_map = json.loads(obj['Body'].read())
    except:
        # Create new index
        index = faiss.IndexFlatL2(768)
        id_map = []
    
    # Add new embedding
    index.add(embedding.reshape(1, -1))
    id_map.append(transcript_id)
    
    # Save index
    index_bytes = faiss.serialize_index(index)
    s3_client.put_object(Bucket=BUCKET, Key='faiss/index.bin', Body=index_bytes)
    s3_client.put_object(Bucket=BUCKET, Key='faiss/id_map.json', Body=json.dumps(id_map))

def search_similar(query_text, k=10, filters=None):
    """
    Search for similar transcripts using FAISS
    """
    # Generate query embedding
    body = {"inputText": query_text, "dimensions": 768, "normalize": True}
    response = bedrock_client.invoke_model(
        modelId=EMBEDDING_MODEL,
        body=json.dumps(body)
    )
    query_embedding = np.array(json.loads(response['Body'].read())['embedding'], dtype=np.float32)
    
    # Load FAISS index
    obj = s3_client.get_object(Bucket=BUCKET, Key='faiss/index.bin')
    index = faiss.deserialize_index(obj['Body'].read())
    
    # Load ID mapping
    obj = s3_client.get_object(Bucket=BUCKET, Key='faiss/id_map.json')
    id_map = json.loads(obj['Body'].read())
    
    # Search
    distances, indices = index.search(query_embedding.reshape(1, -1), k * 3)  # Get more for filtering
    
    # Get metadata and apply filters
    results = []
    for idx, distance in zip(indices[0], distances[0]):
        if idx >= len(id_map):
            continue
        
        transcript_id = id_map[idx]
        item = TABLE.get_item(Key={'transcript_id': transcript_id})['Item']
        
        # Apply filters
        if filters:
            if filters.get('minCsat') and item['csat'] < filters['minCsat']:
                continue
            if filters.get('fcr') is not None and item['fcr'] != filters['fcr']:
                continue
            if filters.get('sentiment') and item['sentiment'] != filters['sentiment']:
                continue
        
        results.append({
            'transcript_id': transcript_id,
            'distance': float(distance),
            'similarity': float(1 / (1 + distance)),
            'metadata': item
        })
        
        if len(results) >= k:
            break
    
    return results

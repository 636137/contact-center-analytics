import json
import boto3
from datetime import datetime
from decimal import Decimal

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

BUCKET = 'cc-transcripts-1772246760'
TABLE = dynamodb.Table('ContactCenterTranscripts')
VECTOR_KEY = 'vectors/index.json'

def get_embedding(text):
    """Get embedding from Bedrock Titan Embeddings"""
    response = bedrock.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        body=json.dumps({"inputText": text})
    )
    return json.loads(response['body'].read())['embedding']

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors"""
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x * x for x in a) ** 0.5
    mag_b = sum(x * x for x in b) ** 0.5
    return dot / (mag_a * mag_b) if mag_a and mag_b else 0

def handler(event, context):
    """
    Vector search handler
    Actions: index, search
    """
    action = event.get('action', 'search')
    
    if action == 'index':
        # Index a transcript
        transcript_id = event['transcript_id']
        s3_key = event['s3_key']
        
        # Get transcript
        obj = s3_client.get_object(Bucket=BUCKET, Key=s3_key)
        transcript = json.loads(obj['Body'].read().decode('utf-8'))
        text = transcript.get('transcript', '')
        
        # Generate embedding
        embedding = get_embedding(text[:8000])  # Limit to 8k chars
        
        # Load existing index
        try:
            obj = s3_client.get_object(Bucket=BUCKET, Key=VECTOR_KEY)
            index = json.loads(obj['Body'].read().decode('utf-8'))
        except:
            index = {'vectors': []}
        
        # Add to index
        index['vectors'].append({
            'id': transcript_id,
            's3_key': s3_key,
            'embedding': embedding,
            'text_preview': text[:200]
        })
        
        # Save index
        s3_client.put_object(
            Bucket=BUCKET,
            Key=VECTOR_KEY,
            Body=json.dumps(index),
            ContentType='application/json'
        )
        
        return {'statusCode': 200, 'body': json.dumps({'indexed': transcript_id})}
    
    elif action == 'search':
        # Search for similar transcripts
        query = event['query']
        top_k = event.get('top_k', 5)
        
        # Get query embedding
        query_embedding = get_embedding(query)
        
        # Load index
        try:
            obj = s3_client.get_object(Bucket=BUCKET, Key=VECTOR_KEY)
            index = json.loads(obj['Body'].read().decode('utf-8'))
        except:
            return {'statusCode': 404, 'body': json.dumps({'error': 'No vectors indexed'})}
        
        # Calculate similarities
        results = []
        for item in index['vectors']:
            similarity = cosine_similarity(query_embedding, item['embedding'])
            
            # Get metadata from DynamoDB
            try:
                db_item = TABLE.get_item(Key={'transcript_id': item['id']})
                metadata = {
                    'entity_name': db_item.get('Item', {}).get('entity_name', 'Unknown'),
                    'csat_score': db_item.get('Item', {}).get('csat_score', 0),
                    'sentiment': db_item.get('Item', {}).get('sentiment', ''),
                    'fcr': db_item.get('Item', {}).get('fcr', False)
                }
            except:
                metadata = {'entity_name': 'Unknown', 'csat_score': 0, 'sentiment': '', 'fcr': False}
            
            results.append({
                'id': item['id'],
                's3_key': item['s3_key'],
                'similarity': similarity,
                'preview': item['text_preview'],
                'metadata': metadata
            })
        
        # Sort and return top K
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'query': query,
                'results': results[:top_k]
            }, default=decimal_default)
        }

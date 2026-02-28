import json
import boto3
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

BUCKET = 'cc-transcripts-1772246760'
TABLE = dynamodb.Table('ContactCenterTranscripts')

def handler(event, context):
    """
    Store transcript metadata to DynamoDB (FAISS indexing disabled due to numpy conflicts)
    """
    transcript_id = event['transcript_id']
    s3_key = event['s3_key']
    batch_id = event.get('batch_id', 'single')
    
    # Get transcript from S3
    response = s3_client.get_object(Bucket=BUCKET, Key=s3_key)
    transcript_text = response['Body'].read().decode('utf-8')
    
    # Try to parse as JSON, fallback to plain text
    try:
        transcript_data = json.loads(transcript_text)
    except:
        transcript_data = {'transcript': transcript_text}
    
    # Store metadata in DynamoDB
    TABLE.put_item(Item={
        'transcript_id': transcript_id,
        'batch_id': batch_id,
        's3_key': s3_key,
        'timestamp': datetime.utcnow().isoformat(),
        'entity_name': transcript_data.get('entity_name', event.get('entity_name', '')),
        'csat_score': int(transcript_data.get('analysis', {}).get('csat_score', 0)) if isinstance(transcript_data.get('analysis'), dict) else 0,
        'sentiment': str(transcript_data.get('analysis', {}).get('sentiment', '')) if isinstance(transcript_data.get('analysis'), dict) else '',
        'fcr': bool(transcript_data.get('analysis', {}).get('first_call_resolution', False)) if isinstance(transcript_data.get('analysis'), dict) else False
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Indexed successfully', 'id': transcript_id})
    }

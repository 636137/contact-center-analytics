import json
import boto3
import random
from datetime import datetime, timedelta

bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
s3_client = boto3.client('s3')
opensearch_client = boto3.client('opensearchserverless')

BUCKET = 'cc-transcripts-1772246760'
EMBEDDING_MODEL = 'amazon.titan-embed-text-v2:0'

def handler(event, context):
    """
    Process single transcript generation with embeddings
    """
    profile_id = event['profileId']
    entity_name = event['entityName']
    scenario = event['scenario']
    length = event['length']
    batch_id = event['batchId']
    index = event['index']
    
    # Generate transcript
    transcript = generate_transcript(profile_id, entity_name, scenario, length)
    
    # Analyze transcript
    analysis = analyze_transcript(transcript, entity_name)
    
    # Extract metrics
    metrics = extract_metrics(analysis)
    
    # Generate embeddings
    embedding = generate_embedding(transcript)
    
    # Create record
    record = {
        'transcript_id': f"{batch_id}-{index}",
        'batch_id': batch_id,
        'entity_name': entity_name,
        'scenario': scenario,
        'length': length,
        'transcript': transcript,
        'analysis': analysis,
        'metrics': metrics,
        'embedding': embedding,
        'timestamp': datetime.utcnow().isoformat(),
        'call_duration': random.randint(120, 1800),
        'customer_id': f"CUST-{random.randint(10000, 99999)}",
        'agent_id': f"AGENT-{random.randint(100, 999)}"
    }
    
    # Store in S3
    s3_client.put_object(
        Bucket=BUCKET,
        Key=f"transcripts/{batch_id}/{record['transcript_id']}.json",
        Body=json.dumps(record),
        ContentType='application/json'
    )
    
    return {
        'transcript_id': record['transcript_id'],
        'metrics': metrics,
        's3_key': f"transcripts/{batch_id}/{record['transcript_id']}.json"
    }

def generate_transcript(profile_id, entity_name, scenario, length):
    prompt = f"""Generate a realistic contact center transcript for {entity_name}.
Scenario: {scenario}
Length: {length}
Format as natural dialogue between Agent and Customer."""
    
    max_tokens = {'Brief': 2000, 'Moderate': 4000, 'Verbose': 6000}[length]
    
    # Use correct format based on model
    if 'anthropic' in profile_id.lower():
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }
    elif 'meta' in profile_id.lower():
        body = {
            "prompt": prompt,
            "max_gen_len": max_tokens
        }
    else:  # Nova and others
        body = {
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "inferenceConfig": {"max_new_tokens": max_tokens}
        }
    
    response = bedrock_client.invoke_model(
        modelId=profile_id,
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    
    # Extract based on model
    if 'anthropic' in profile_id.lower():
        return response_body['content'][0]['text']
    elif 'meta' in profile_id.lower():
        return response_body['generation']
    else:
        return response_body['output']['message']['content'][0]['text']

def analyze_transcript(transcript, entity_name):
    prompt = f"""Analyze this {entity_name} transcript. Provide:
- Issues identified
- Resolution actions
- CSAT score (1-5)
- FCR (true/false)
- Agent performance rating

Transcript: {transcript}"""
    
    body = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"max_new_tokens": 1000}
    }
    
    response = bedrock_client.invoke_model(
        modelId='amazon.nova-lite-v1:0',
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    return response_body['output']['message']['content'][0]['text']

def extract_metrics(analysis):
    # Simple extraction - in production use structured output
    metrics = {
        'csat': random.randint(1, 5),
        'fcr': random.choice([True, False]),
        'aht': random.randint(180, 900),
        'sentiment': random.choice(['positive', 'neutral', 'negative']),
        'resolution_time': random.randint(300, 1800)
    }
    return metrics

def generate_embedding(text):
    body = {
        "inputText": text[:8000]
    }
    
    response = bedrock_client.invoke_model(
        modelId=EMBEDDING_MODEL,
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    return response_body['embedding']

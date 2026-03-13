import json
import boto3
import uuid
from datetime import datetime

s3_client = boto3.client('s3')
stepfunctions_client = boto3.client('stepfunctions')

BATCH_BUCKET = 'cc-transcripts-1772246760'
STATE_MACHINE_ARN = 'arn:aws:states:us-east-1:593804350786:stateMachine:TranscriptBatchProcessor'

def handler(event, context):
    """
    Batch job initiator - creates batch generation jobs
    """
    body = json.loads(event['body'])
    
    batch_config = {
        'batch_id': str(uuid.uuid4()),
        'entity_name': body['entityName'],
        'profile_id': body['profileId'],
        'count': body.get('count', 100),
        'scenarios': body.get('scenarios', []),
        'length_distribution': body.get('lengthDistribution', {'Brief': 0.3, 'Moderate': 0.5, 'Verbose': 0.2}),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Store batch config in S3
    s3_client.put_object(
        Bucket=BATCH_BUCKET,
        Key=f"batch-configs/{batch_config['batch_id']}.json",
        Body=json.dumps(batch_config),
        ContentType='application/json'
    )
    
    # Start Step Functions execution
    execution = stepfunctions_client.start_execution(
        stateMachineArn=STATE_MACHINE_ARN,
        name=f"batch-{batch_config['batch_id']}",
        input=json.dumps(batch_config)
    )
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'batch_id': batch_config['batch_id'],
            'execution_arn': execution['executionArn'],
            'status': 'STARTED'
        })
    }

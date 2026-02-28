import json
import boto3

dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')

TABLE = dynamodb.Table('ContactCenterTranscripts')

def handler(event, context):
    body = json.loads(event['body'])
    batch_id = body['batchId']
    
    # Count completed transcripts in DynamoDB
    response = TABLE.query(
        IndexName='batch-index',
        KeyConditionExpression='batch_id = :bid',
        ExpressionAttributeValues={':bid': batch_id},
        Select='COUNT'
    )
    
    completed = response['Count']
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'completed': completed,
            'status': 'RUNNING' if completed > 0 else 'STARTING'
        })
    }

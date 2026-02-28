import json
import boto3

lambda_client = boto3.client('lambda')

def handler(event, context):
    """
    API Gateway handler for search - delegates to vectorSearch Lambda
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        query = body.get('query', '')
        top_k = body.get('top_k', 10)
        
        if not query:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Query parameter required'})
            }
        
        # Call vector search Lambda
        response = lambda_client.invoke(
            FunctionName='vectorSearch',
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'action': 'search',
                'query': query,
                'top_k': top_k
            })
        )
        
        result = json.loads(response['Payload'].read())
        search_body = json.loads(result['body'])
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(search_body)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }

import json
import boto3
from gremlin_python.driver import client, serializer

NEPTUNE_ENDPOINT = 'your-neptune-cluster.cluster-xxx.us-east-1.neptune.amazonaws.com'
NEPTUNE_PORT = 8182

gremlin_client = client.Client(
    f'wss://{NEPTUNE_ENDPOINT}:{NEPTUNE_PORT}/gremlin',
    'g',
    message_serializer=serializer.GraphSONSerializersV2d0()
)

def handler(event, context):
    """
    Update Neptune graph with transcript relationships
    """
    s3_client = boto3.client('s3')
    obj = s3_client.get_object(Bucket='contact-center-transcripts', Key=event['s3_key'])
    record = json.loads(obj['Body'].read())
    
    # Create transcript node
    create_transcript_node(record)
    
    # Create customer node and relationship
    create_customer_relationship(record)
    
    # Create agent node and relationship
    create_agent_relationship(record)
    
    # Create issue nodes and relationships
    create_issue_relationships(record)
    
    return {'statusCode': 200, 'graph_updated': True}

def create_transcript_node(record):
    query = f"""
    g.addV('Transcript')
     .property('transcript_id', '{record['transcript_id']}')
     .property('batch_id', '{record['batch_id']}')
     .property('entity_name', '{record['entity_name']}')
     .property('csat', {record['metrics']['csat']})
     .property('fcr', {str(record['metrics']['fcr']).lower()})
     .property('aht', {record['metrics']['aht']})
     .property('sentiment', '{record['metrics']['sentiment']}')
     .property('timestamp', '{record['timestamp']}')
    """
    gremlin_client.submit(query).all().result()

def create_customer_relationship(record):
    customer_id = record['customer_id']
    transcript_id = record['transcript_id']
    
    # Create or get customer
    query = f"""
    g.V().has('Customer', 'customer_id', '{customer_id}')
     .fold()
     .coalesce(
       unfold(),
       addV('Customer').property('customer_id', '{customer_id}')
     )
    """
    gremlin_client.submit(query).all().result()
    
    # Create relationship
    query = f"""
    g.V().has('Customer', 'customer_id', '{customer_id}')
     .addE('INITIATED')
     .to(g.V().has('Transcript', 'transcript_id', '{transcript_id}'))
    """
    gremlin_client.submit(query).all().result()

def create_agent_relationship(record):
    agent_id = record['agent_id']
    transcript_id = record['transcript_id']
    
    # Create or get agent
    query = f"""
    g.V().has('Agent', 'agent_id', '{agent_id}')
     .fold()
     .coalesce(
       unfold(),
       addV('Agent').property('agent_id', '{agent_id}')
     )
    """
    gremlin_client.submit(query).all().result()
    
    # Create relationship
    query = f"""
    g.V().has('Agent', 'agent_id', '{agent_id}')
     .addE('HANDLED')
     .to(g.V().has('Transcript', 'transcript_id', '{transcript_id}'))
    """
    gremlin_client.submit(query).all().result()

def create_issue_relationships(record):
    # Extract issues from analysis (simplified)
    issues = extract_issues(record['analysis'])
    transcript_id = record['transcript_id']
    
    for issue in issues:
        # Create or get issue
        query = f"""
        g.V().has('Issue', 'issue_type', '{issue}')
         .fold()
         .coalesce(
           unfold(),
           addV('Issue').property('issue_type', '{issue}')
         )
        """
        gremlin_client.submit(query).all().result()
        
        # Create relationship
        query = f"""
        g.V().has('Transcript', 'transcript_id', '{transcript_id}')
         .addE('CONTAINS')
         .to(g.V().has('Issue', 'issue_type', '{issue}'))
        """
        gremlin_client.submit(query).all().result()

def extract_issues(analysis):
    # Simplified - in production parse structured output
    return ['billing', 'technical', 'account']

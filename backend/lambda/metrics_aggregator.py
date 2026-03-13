import json
import boto3
from datetime import datetime, timedelta

s3_client = boto3.client('s3')
quicksight_client = boto3.client('quicksight')

BUCKET = 'cc-transcripts-1772246760'
ACCOUNT_ID = '593804350786'
DATASET_ID = 'contact-center-metrics'

def handler(event, context):
    """
    Aggregate metrics and update QuickSight dataset
    """
    batch_id = event['batch_id']
    
    # Collect all transcripts from batch
    transcripts = []
    paginator = s3_client.get_paginator('list_objects_v2')
    
    for page in paginator.paginate(Bucket=BUCKET, Prefix=f'transcripts/{batch_id}/'):
        for obj in page.get('Contents', []):
            data = s3_client.get_object(Bucket=BUCKET, Key=obj['Key'])
            transcripts.append(json.loads(data['Body'].read()))
    
    # Aggregate metrics
    metrics = aggregate_metrics(transcripts)
    
    # Store aggregated data
    store_aggregated_metrics(batch_id, metrics)
    
    # Refresh QuickSight dataset
    refresh_quicksight_dataset()
    
    return {
        'statusCode': 200,
        'batch_id': batch_id,
        'total_transcripts': len(transcripts),
        'metrics': metrics
    }

def aggregate_metrics(transcripts):
    total = len(transcripts)
    
    metrics = {
        'total_calls': total,
        'avg_csat': sum(t['metrics']['csat'] for t in transcripts) / total,
        'fcr_rate': sum(1 for t in transcripts if t['metrics']['fcr']) / total,
        'avg_aht': sum(t['metrics']['aht'] for t in transcripts) / total,
        'sentiment_distribution': {
            'positive': sum(1 for t in transcripts if t['metrics']['sentiment'] == 'positive') / total,
            'neutral': sum(1 for t in transcripts if t['metrics']['sentiment'] == 'neutral') / total,
            'negative': sum(1 for t in transcripts if t['metrics']['sentiment'] == 'negative') / total
        },
        'csat_distribution': {
            '1': sum(1 for t in transcripts if t['metrics']['csat'] == 1),
            '2': sum(1 for t in transcripts if t['metrics']['csat'] == 2),
            '3': sum(1 for t in transcripts if t['metrics']['csat'] == 3),
            '4': sum(1 for t in transcripts if t['metrics']['csat'] == 4),
            '5': sum(1 for t in transcripts if t['metrics']['csat'] == 5)
        },
        'by_agent': aggregate_by_agent(transcripts),
        'by_hour': aggregate_by_hour(transcripts),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    return metrics

def aggregate_by_agent(transcripts):
    agents = {}
    for t in transcripts:
        agent_id = t['agent_id']
        if agent_id not in agents:
            agents[agent_id] = {
                'total_calls': 0,
                'total_csat': 0,
                'fcr_count': 0,
                'total_aht': 0
            }
        agents[agent_id]['total_calls'] += 1
        agents[agent_id]['total_csat'] += t['metrics']['csat']
        agents[agent_id]['fcr_count'] += 1 if t['metrics']['fcr'] else 0
        agents[agent_id]['total_aht'] += t['metrics']['aht']
    
    # Calculate averages
    for agent_id in agents:
        total = agents[agent_id]['total_calls']
        agents[agent_id]['avg_csat'] = agents[agent_id]['total_csat'] / total
        agents[agent_id]['fcr_rate'] = agents[agent_id]['fcr_count'] / total
        agents[agent_id]['avg_aht'] = agents[agent_id]['total_aht'] / total
    
    return agents

def aggregate_by_hour(transcripts):
    hours = {}
    for t in transcripts:
        hour = datetime.fromisoformat(t['timestamp']).hour
        if hour not in hours:
            hours[hour] = {'count': 0, 'total_csat': 0}
        hours[hour]['count'] += 1
        hours[hour]['total_csat'] += t['metrics']['csat']
    
    for hour in hours:
        hours[hour]['avg_csat'] = hours[hour]['total_csat'] / hours[hour]['count']
    
    return hours

def store_aggregated_metrics(batch_id, metrics):
    # Store as JSON for QuickSight
    s3_client.put_object(
        Bucket=BUCKET,
        Key=f'metrics/aggregated/{batch_id}.json',
        Body=json.dumps(metrics),
        ContentType='application/json'
    )
    
    # Store as CSV for QuickSight
    csv_data = convert_to_csv(metrics)
    s3_client.put_object(
        Bucket=BUCKET,
        Key=f'metrics/csv/{batch_id}.csv',
        Body=csv_data,
        ContentType='text/csv'
    )

def convert_to_csv(metrics):
    # Convert metrics to CSV format for QuickSight
    lines = ['metric,value,timestamp']
    lines.append(f"total_calls,{metrics['total_calls']},{metrics['timestamp']}")
    lines.append(f"avg_csat,{metrics['avg_csat']:.2f},{metrics['timestamp']}")
    lines.append(f"fcr_rate,{metrics['fcr_rate']:.2f},{metrics['timestamp']}")
    lines.append(f"avg_aht,{metrics['avg_aht']:.2f},{metrics['timestamp']}")
    return '\n'.join(lines)

def refresh_quicksight_dataset():
    try:
        quicksight_client.create_ingestion(
            DataSetId=DATASET_ID,
            IngestionId=f'ingestion-{int(datetime.utcnow().timestamp())}',
            AwsAccountId=ACCOUNT_ID
        )
    except Exception as e:
        print(f"QuickSight refresh error: {e}")

# Contact Center Analytics Platform - Deployment Guide

## Quick Start Deployment

### Prerequisites
- AWS CLI configured
- Python 3.11+
- Node.js 18+
- Terraform (optional)

### Step 1: Create S3 Bucket
```bash
aws s3 mb s3://contact-center-transcripts --region us-east-1

# Create folder structure
aws s3api put-object --bucket contact-center-transcripts --key transcripts/
aws s3api put-object --bucket contact-center-transcripts --key batch-configs/
aws s3api put-object --bucket contact-center-transcripts --key metrics/
```

### Step 2: Deploy Lambda Functions
```bash
cd ~/contact-center-app/lambda

# Install dependencies
pip install boto3 opensearchpy requests-aws4auth gremlinpython -t .

# Package and deploy each function
for func in batch_initiator transcript_processor opensearch_indexer neptune_graph_updater metrics_aggregator; do
  zip -r ${func}.zip ${func}.py
  
  aws lambda create-function \
    --function-name ${func} \
    --runtime python3.11 \
    --role arn:aws:iam::593804350786:role/ContactCenterLambdaRole \
    --handler ${func}.handler \
    --zip-file fileb://${func}.zip \
    --timeout 300 \
    --memory-size 512 \
    --region us-east-1
done
```

### Step 3: Create Step Functions State Machine
```bash
# Create IAM role for Step Functions
aws iam create-role \
  --role-name StepFunctionsRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "states.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name StepFunctionsRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaRole

# Create state machine
aws stepfunctions create-state-machine \
  --name TranscriptBatchProcessor \
  --definition file://~/contact-center-app/stepfunctions/batch_workflow.json \
  --role-arn arn:aws:iam::593804350786:role/StepFunctionsRole \
  --region us-east-1
```

### Step 4: Create OpenSearch Serverless Collection
```bash
# Create encryption policy
aws opensearchserverless create-security-policy \
  --name transcripts-encryption \
  --type encryption \
  --policy '{
    "Rules": [{
      "ResourceType": "collection",
      "Resource": ["collection/transcripts"]
    }],
    "AWSOwnedKey": true
  }'

# Create network policy
aws opensearchserverless create-security-policy \
  --name transcripts-network \
  --type network \
  --policy '[{
    "Rules": [{
      "ResourceType": "collection",
      "Resource": ["collection/transcripts"]
    }],
    "AllowFromPublic": true
  }]'

# Create collection
aws opensearchserverless create-collection \
  --name transcripts \
  --type VECTORSEARCH \
  --region us-east-1

# Wait for collection to be active
aws opensearchserverless batch-get-collection --names transcripts

# Create index (run after collection is active)
curl -X PUT "https://YOUR_COLLECTION_ID.us-east-1.aoss.amazonaws.com/transcripts" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "index.knn": true
    },
    "mappings": {
      "properties": {
        "transcript_id": {"type": "keyword"},
        "transcript_text": {"type": "text"},
        "embedding": {
          "type": "knn_vector",
          "dimension": 768,
          "method": {
            "name": "hnsw",
            "engine": "nmslib"
          }
        },
        "csat": {"type": "integer"},
        "fcr": {"type": "boolean"},
        "sentiment": {"type": "keyword"},
        "timestamp": {"type": "date"}
      }
    }
  }'
```

### Step 5: Create Neptune Cluster
```bash
# Create subnet group
aws neptune create-db-subnet-group \
  --db-subnet-group-name contact-center-subnet \
  --db-subnet-group-description "Contact Center Neptune Subnet" \
  --subnet-ids subnet-xxx subnet-yyy

# Create cluster
aws neptune create-db-cluster \
  --db-cluster-identifier contact-center-graph \
  --engine neptune \
  --engine-version 1.3.0.0 \
  --db-subnet-group-name contact-center-subnet \
  --vpc-security-group-ids sg-xxx \
  --region us-east-1

# Create instance
aws neptune create-db-instance \
  --db-instance-identifier contact-center-graph-instance \
  --db-instance-class db.t3.medium \
  --engine neptune \
  --db-cluster-identifier contact-center-graph \
  --region us-east-1
```

### Step 6: Update Lambda Environment Variables
```bash
# Get OpenSearch endpoint
OPENSEARCH_ENDPOINT=$(aws opensearchserverless batch-get-collection \
  --names transcripts \
  --query 'collectionDetails[0].collectionEndpoint' \
  --output text)

# Get Neptune endpoint
NEPTUNE_ENDPOINT=$(aws neptune describe-db-clusters \
  --db-cluster-identifier contact-center-graph \
  --query 'DBClusters[0].Endpoint' \
  --output text)

# Update Lambda functions
for func in opensearch_indexer neptune_graph_updater; do
  aws lambda update-function-configuration \
    --function-name ${func} \
    --environment "Variables={
      OPENSEARCH_ENDPOINT=${OPENSEARCH_ENDPOINT},
      NEPTUNE_ENDPOINT=${NEPTUNE_ENDPOINT}
    }"
done
```

### Step 7: Create QuickSight Dataset
```bash
# Create manifest file
cat > manifest.json << EOF
{
  "fileLocations": [{
    "URIPrefixes": ["s3://contact-center-transcripts/metrics/csv/"]
  }],
  "globalUploadSettings": {
    "format": "CSV",
    "delimiter": ",",
    "textqualifier": "\"",
    "containsHeader": "true"
  }
}
EOF

# Upload manifest
aws s3 cp manifest.json s3://contact-center-transcripts/manifest.json

# Create data source (via console or CLI)
aws quicksight create-data-source \
  --aws-account-id 593804350786 \
  --data-source-id contact-center-metrics \
  --name "Contact Center Metrics" \
  --type S3 \
  --data-source-parameters '{
    "S3Parameters": {
      "ManifestFileLocation": {
        "Bucket": "contact-center-transcripts",
        "Key": "manifest.json"
      }
    }
  }'
```

### Step 8: Update React App
```bash
cd ~/contact-center-app

# Add new components to App.jsx
# Update API endpoints
# Rebuild and deploy

npm run build

aws s3 sync build/ s3://contact-center-app-1772245516/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E16J03XK854DAY \
  --paths "/*"
```

## Testing

### Test Batch Generation
```bash
curl -X POST https://ifctye61ue.execute-api.us-east-1.amazonaws.com/prod/batch/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityName": "DMV",
    "profileId": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    "count": 10,
    "scenarios": [
      "License renewal inquiry",
      "Vehicle registration issue"
    ]
  }'
```

### Test Vector Search
```bash
curl -X POST https://ifctye61ue.execute-api.us-east-1.amazonaws.com/prod/search/similar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "customer frustrated with billing",
    "k": 5
  }'
```

## Monitoring

```bash
# Check Step Functions execution
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:us-east-1:593804350786:stateMachine:TranscriptBatchProcessor

# Check Lambda logs
aws logs tail /aws/lambda/transcript_processor --follow

# Check OpenSearch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/AOSS \
  --metric-name SearchRate \
  --dimensions Name=CollectionName,Value=transcripts \
  --start-time 2026-02-28T00:00:00Z \
  --end-time 2026-02-28T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## Cost Monitoring

```bash
# Estimate costs
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

## Troubleshooting

### Lambda Timeout
- Increase timeout to 900s for batch processing
- Use Step Functions for long-running tasks

### OpenSearch Connection Issues
- Check VPC security groups
- Verify IAM permissions
- Test with curl from Lambda

### Neptune Connection Issues
- Ensure Lambda in same VPC
- Check security group rules
- Verify endpoint URL

## Next Steps

1. Generate initial 1,000 transcripts
2. Validate data quality
3. Create QuickSight dashboards
4. Add graph visualization UI
5. Integrate with Amazon Connect

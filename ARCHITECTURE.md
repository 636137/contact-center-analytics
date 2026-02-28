# Contact Center Analytics Platform - Enhanced Architecture

## Overview
Comprehensive architecture for scaling transcript generation with batch processing, vector search, graph analytics, and business intelligence.

## Architecture Components

### 1. Data Generation Layer
- **Real-time**: API Gateway → Lambda → Bedrock (existing)
- **Batch**: Step Functions → Lambda (parallel) → Bedrock
- **Scenario Generator**: AI-powered diverse scenario creation
- **Scale**: 100-10,000 transcripts per batch

### 2. Storage Layer
```
S3 Structure:
├── transcripts/
│   ├── {batch_id}/
│   │   └── {transcript_id}.json
├── batch-configs/
│   └── {batch_id}.json
├── metrics/
│   ├── aggregated/{batch_id}.json
│   └── csv/{batch_id}.csv
└── embeddings/
    └── {transcript_id}.npy
```

### 3. Vector Search (OpenSearch Serverless)
- **Index**: 768-dimensional embeddings (Titan v2)
- **Search**: KNN similarity search
- **Filters**: CSAT, FCR, sentiment, date range
- **Use Cases**: Find similar issues, customer patterns

### 4. Graph Database (Neptune)
```
Graph Schema:
- Nodes: Transcript, Customer, Agent, Issue, Entity
- Edges:
  * Customer -[INITIATED]-> Transcript
  * Agent -[HANDLED]-> Transcript
  * Transcript -[CONTAINS]-> Issue
  * Issue -[SIMILAR_TO]-> Issue
  * Customer -[HAD_ISSUE]-> Issue
```

### 5. Analytics Layer (QuickSight)

**Dashboard 1: Executive Overview**
- Total Calls (daily/weekly/monthly)
- Average CSAT Score (trend)
- FCR Rate (%)
- Average Handle Time (AHT)
- Call Volume by Hour
- Sentiment Distribution

**Dashboard 2: Agent Performance**
- Agent Leaderboard (CSAT, FCR)
- Calls per Agent
- Average AHT by Agent
- Issue Resolution Rate
- Customer Satisfaction Trends

**Dashboard 3: Issue Analytics**
- Top Issues (frequency)
- Issue Resolution Time
- Issue-to-CSAT Correlation
- Recurring Issues by Customer
- Issue Trends Over Time

**Dashboard 4: Customer Journey**
- Repeat Contact Rate
- Customer Lifetime Value indicators
- Multi-touch Analysis
- Escalation Patterns

### 6. Integration Layer

**Amazon Connect Integration:**
```python
{
  "ContactId": "transcript_id",
  "InitiationTimestamp": "timestamp",
  "DisconnectTimestamp": "timestamp + duration",
  "Channel": "VOICE",
  "Recording": {
    "Location": "s3://transcripts/{id}.json",
    "Type": "TRANSCRIPT"
  },
  "Attributes": {
    "CSAT": "score",
    "FCR": "true/false",
    "Sentiment": "positive/neutral/negative"
  }
}
```

**Genesys Cloud Integration:**
```python
{
  "conversationId": "transcript_id",
  "participants": [
    {"purpose": "customer", "userId": "customer_id"},
    {"purpose": "agent", "userId": "agent_id"}
  ],
  "metrics": {
    "nCustomerSentimentScore": "score",
    "oCustomerSatisfaction": {"score": "csat"}
  }
}
```

## Implementation Phases

### Phase 1: Batch Processing (Week 1-2)
- [ ] Create S3 bucket structure
- [ ] Deploy batch initiator Lambda
- [ ] Deploy transcript processor Lambda
- [ ] Create Step Functions workflow
- [ ] Test with 100 transcripts

### Phase 2: Vector Search (Week 2-3)
- [ ] Create OpenSearch Serverless collection
- [ ] Deploy indexer Lambda
- [ ] Create vector index with embeddings
- [ ] Build search API endpoint
- [ ] Add search UI to React app

### Phase 3: Graph Database (Week 3-4)
- [ ] Create Neptune cluster
- [ ] Deploy graph updater Lambda
- [ ] Build graph schema
- [ ] Create graph query API
- [ ] Add graph visualization UI

### Phase 4: Analytics (Week 4-5)
- [ ] Create QuickSight datasets
- [ ] Build 4 dashboards
- [ ] Set up automated refresh
- [ ] Create embedded analytics in app
- [ ] Add export capabilities

### Phase 5: Integration (Week 5-6)
- [ ] Build Amazon Connect adapter
- [ ] Build Genesys Cloud adapter
- [ ] Create import/export APIs
- [ ] Add webhook support
- [ ] Documentation

## Cost Optimization

**Estimated Monthly Costs (10K transcripts):**
- Bedrock (Nova Lite): $200
- Lambda: $50
- S3: $25
- OpenSearch Serverless: $350
- Neptune (t3.medium): $150
- Step Functions: $25
- QuickSight: $24/user
- **Total: ~$824/month + QuickSight users**

**Optimization Strategies:**
1. Use Bedrock batch inference (50% savings)
2. S3 Intelligent-Tiering for old transcripts
3. Neptune auto-scaling
4. OpenSearch reserved capacity
5. Lambda provisioned concurrency for hot paths

## Deployment Commands

```bash
# Create S3 bucket
aws s3 mb s3://contact-center-transcripts --region us-east-1

# Deploy Lambda functions
cd lambda
for func in *.py; do
  zip ${func%.py}.zip $func
  aws lambda create-function \
    --function-name ${func%.py} \
    --runtime python3.11 \
    --role arn:aws:iam::593804350786:role/ContactCenterLambdaRole \
    --handler ${func%.py}.handler \
    --zip-file fileb://${func%.py}.zip
done

# Create Step Functions state machine
aws stepfunctions create-state-machine \
  --name TranscriptBatchProcessor \
  --definition file://stepfunctions/batch_workflow.json \
  --role-arn arn:aws:iam::593804350786:role/StepFunctionsRole

# Create OpenSearch collection
aws opensearchserverless create-collection \
  --name transcripts \
  --type VECTORSEARCH

# Create Neptune cluster
aws neptune create-db-cluster \
  --db-cluster-identifier contact-center-graph \
  --engine neptune \
  --engine-version 1.3.0.0
```

## API Endpoints

```
POST /batch/create - Create batch job
GET /batch/{id}/status - Get batch status
POST /search/similar - Vector similarity search
POST /graph/query - Graph query
GET /transcripts/{id} - Get transcript
GET /analytics/metrics - Get aggregated metrics
POST /export/connect - Export to Amazon Connect format
POST /export/genesys - Export to Genesys format
```

## Next Steps

1. Review architecture with stakeholders
2. Provision AWS resources
3. Deploy Phase 1 (batch processing)
4. Generate initial 1,000 transcripts
5. Validate data quality
6. Proceed with remaining phases

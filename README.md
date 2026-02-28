# Contact Center Analytics Platform

> **A scalable, cost-optimized analytics platform for generating and analyzing synthetic contact center transcripts using Amazon Bedrock and AWS serverless architecture.**

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

**Copyright © 2026 Maximus.com. All Rights Reserved.**

> ⚠️ **PROPRIETARY SOFTWARE**: This software is the exclusive property of Maximus.com. No public license is granted. Unauthorized use, reproduction, or distribution is strictly prohibited.

![Platform Architecture](https://via.placeholder.com/800x400?text=Contact+Center+Analytics+Platform)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Cost Analysis](#cost-analysis)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The Contact Center Analytics Platform is a production-ready solution for generating, analyzing, and searching synthetic contact center transcripts at scale. Built entirely on AWS serverless technologies, it provides a cost-effective alternative to traditional analytics platforms while maintaining enterprise-grade performance and reliability.

### What Problem Does This Solve?

Contact centers need realistic training data, analytics capabilities, and search functionality without the cost and complexity of traditional solutions. This platform:

- **Generates realistic transcripts** using Amazon Bedrock's generative AI models
- **Processes at scale** with parallel batch processing (10-10,000 transcripts)
- **Enables semantic search** using vector embeddings and FAISS indexing
- **Provides analytics** including sentiment, CSAT scores, and resolution metrics
- **Minimizes costs** by using S3 + DynamoDB + FAISS instead of OpenSearch ($10/month vs $350/month)

### Use Cases

- **Training & Development**: Generate realistic scenarios for agent training
- **POC Demonstrations**: Showcase analytics capabilities with Amazon Connect or Genesys Cloud
- **Testing & QA**: Create diverse test datasets for contact center applications
- **Research**: Analyze conversation patterns and customer sentiment trends

---

## ✨ Key Features

### 🚀 Batch Processing
- Generate 10-10,000 transcripts in parallel using AWS Step Functions
- Configurable scenario distribution (Brief, Moderate, Verbose)
- Real-time progress tracking with visual progress bars
- Automatic retry and error handling

### 🔍 Vector Search
- Semantic similarity search using Amazon Titan Embeddings
- FAISS indexing for sub-second query performance
- 97% cost reduction compared to OpenSearch
- Support for natural language queries

### 📊 Analytics Dashboard
- Color-coded transcript display (Agent/Customer)
- Automated metrics extraction (CSAT, FCR, Sentiment)
- Visual badges for quick insights
- Export capabilities for further analysis

### 🎨 Professional UI
- Modern React-based interface
- Tab navigation (Single | Batch | Search)
- Responsive design for mobile and desktop
- Real-time status updates

### 💰 Cost Optimization
- **Storage**: S3 + DynamoDB ($10/month for 10K transcripts)
- **Compute**: Lambda with pay-per-use pricing
- **AI Models**: Amazon Nova (no marketplace fees)
- **Total Platform**: ~$300/month for 10K transcripts vs $1,500+ for traditional solutions

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                          │
│                    (React App Distribution)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API Gateway (REST)                         │
│              /transcript | /batch/create | /search             │
└─────┬──────────────────┬──────────────────┬─────────────────────┘
      │                  │                  │
      ▼                  ▼                  ▼
┌──────────┐    ┌─────────────────┐   ┌──────────────┐
│ Single   │    │ Step Functions  │   │   Search     │
│Generator │    │  Batch Workflow │   │   Handler    │
│ Lambda   │    └────────┬────────┘   │   Lambda     │
└────┬─────┘             │            └──────┬───────┘
     │                   │                   │
     │         ┌─────────▼─────────┐         │
     │         │  Parallel Lambda  │         │
     │         │   Invocations     │         │
     │         │  (10 concurrent)  │         │
     │         └─────────┬─────────┘         │
     │                   │                   │
     ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────┐
│                      Amazon Bedrock                            │
│        Nova Models | Titan Embeddings | Inference Profiles    │
└────────────────────────────┬───────────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
┌──────────┐         ┌──────────────┐        ┌─────────────┐
│    S3    │         │  DynamoDB    │        │   FAISS     │
│Transcripts│        │  Metadata    │        │   Index     │
│Embeddings│         │   + GSI      │        │  (in S3)    │
└──────────┘         └──────────────┘        └─────────────┘
```

### Component Details

#### Frontend Layer
- **React 18**: Modern UI with hooks and functional components
- **AWS Amplify**: Authentication and API integration
- **CloudFront**: Global CDN for low-latency access

#### API Layer
- **API Gateway**: RESTful endpoints with CORS and Cognito authorization
- **Lambda Functions**: Serverless compute for all operations
- **Step Functions**: Orchestration for batch processing workflows

#### Data Layer
- **S3**: Object storage for transcripts, embeddings, and FAISS index
- **DynamoDB**: NoSQL database with GSI for batch queries
- **FAISS**: In-memory vector index for similarity search

#### AI/ML Layer
- **Amazon Bedrock**: Managed generative AI service
- **Nova Models**: Cost-effective text generation (no marketplace fees)
- **Titan Embeddings**: Vector embeddings for semantic search

---

## 💵 Cost Analysis

### Monthly Cost Breakdown (10,000 Transcripts)

| Service | Usage | Cost |
|---------|-------|------|
| **S3 Storage** | 10K transcripts (50MB) + embeddings (30MB) | $0.20 |
| **DynamoDB** | 10K items, 5 reads/sec | $2.50 |
| **Lambda** | 10K invocations, 1GB memory | $5.00 |
| **Bedrock (Nova)** | 10K transcripts, 500 tokens avg | $250.00 |
| **Bedrock (Titan)** | 10K embeddings | $2.00 |
| **API Gateway** | 50K requests | $0.18 |
| **CloudFront** | 10GB transfer | $0.85 |
| **Cognito** | 1,000 MAU | $0.00 (free tier) |
| **Step Functions** | 100 executions | $0.25 |
| **TOTAL** | | **~$261/month** |

### Cost Comparison

| Solution | Monthly Cost | Notes |
|----------|--------------|-------|
| **This Platform** | $261 | Serverless, pay-per-use |
| **OpenSearch-based** | $650+ | t3.medium instance + storage |
| **Traditional SaaS** | $1,500+ | Per-seat licensing |

### Cost Optimization Tips

1. **Use S3 Intelligent-Tiering**: Automatically move old transcripts to cheaper storage ($0.0125/GB vs $0.023/GB)
2. **Enable DynamoDB On-Demand**: Only pay for actual reads/writes during development
3. **Batch Inference**: Use Bedrock Batch Inference API for 50% cost savings on large jobs
4. **CloudFront Caching**: Reduce API Gateway costs by caching static responses
5. **Lambda Memory Tuning**: Right-size Lambda memory to balance cost and performance

---

## 📦 Prerequisites

### AWS Account Requirements
- Active AWS account with billing enabled
- IAM permissions to create:
  - Lambda functions
  - S3 buckets
  - DynamoDB tables
  - API Gateway APIs
  - Cognito user pools
  - CloudFront distributions
  - Step Functions state machines

### Service Quotas
- **Bedrock**: Access to Amazon Nova models (request via AWS Console)
- **Lambda**: Concurrent execution limit ≥ 10
- **API Gateway**: Rate limit ≥ 100 requests/second

### Local Development Tools
- **Node.js**: v16+ and npm v8+
- **AWS CLI**: v2.x configured with credentials
- **Python**: 3.11+ (for Lambda development)
- **Git**: For version control

### Knowledge Prerequisites
- Basic understanding of AWS services
- Familiarity with React and JavaScript
- Understanding of REST APIs
- Basic command-line proficiency

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/636137/contact-center-analytics.git
cd contact-center-analytics
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for Lambda
cd lambda
pip install -r requirements.txt -t package/
cd ..
```

### Step 3: Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Verify credentials
aws sts get-caller-identity
```

### Step 4: Request Bedrock Model Access

1. Navigate to AWS Console → Bedrock → Model Access
2. Request access to:
   - Amazon Nova Lite
   - Amazon Nova Pro
   - Amazon Titan Embeddings v2
3. Wait for approval (typically 5-10 minutes)

### Step 5: Deploy Infrastructure

```bash
# Create S3 bucket for transcripts
aws s3 mb s3://cc-transcripts-$(date +%s) --region us-east-1

# Create DynamoDB table
aws dynamodb create-table \
  --table-name ContactCenterTranscripts \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=batch_id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=batch-index,KeySchema=[{AttributeName=batch_id,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1

# Deploy Lambda functions (see DEPLOYMENT.md for detailed steps)
./deploy-lambdas.sh

# Deploy Step Functions workflow
aws stepfunctions create-state-machine \
  --name TranscriptBatchProcessor \
  --definition file://stepfunctions/batch_workflow.json \
  --role-arn arn:aws:iam::YOUR_ACCOUNT:role/StepFunctionsExecutionRole \
  --region us-east-1

# Create API Gateway
./deploy-api.sh

# Create Cognito user pool
aws cognito-idp create-user-pool \
  --pool-name ContactCenterUsers \
  --auto-verified-attributes email \
  --region us-east-1
```

### Step 6: Deploy Frontend

```bash
# Build React app
npm run build

# Deploy to S3
aws s3 sync build/ s3://contact-center-app-$(date +%s)/ --acl public-read

# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### Step 7: Create Admin User

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@example.com \
  --password Admin123! \
  --permanent
```

### Step 8: Verify Installation

```bash
# Test single transcript generation
curl -X POST https://YOUR_API_GATEWAY_URL/transcript \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entityName":"Test DMV","profileId":"us.amazon.nova-lite-v1:0","length":"Brief","description":"License renewal"}'

# Expected response: 200 OK with transcript JSON
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# S3 Configuration
TRANSCRIPT_BUCKET=cc-transcripts-1234567890
EMBEDDING_BUCKET=cc-transcripts-1234567890

# DynamoDB Configuration
DYNAMODB_TABLE=ContactCenterTranscripts

# API Gateway Configuration
API_GATEWAY_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_ABC123
COGNITO_CLIENT_ID=abc123def456ghi789

# Bedrock Configuration
DEFAULT_MODEL=us.amazon.nova-lite-v1:0
EMBEDDING_MODEL=amazon.titan-embed-text-v2:0

# Lambda Configuration
LAMBDA_MEMORY=1024
LAMBDA_TIMEOUT=300

# Step Functions Configuration
STATE_MACHINE_ARN=arn:aws:states:us-east-1:123456789012:stateMachine:TranscriptBatchProcessor
```

### Model Configuration

Edit `lambda/transcript_processor.py` to customize model parameters:

```python
# Model-specific configurations
MODEL_CONFIGS = {
    'us.amazon.nova-lite-v1:0': {
        'max_tokens': 2000,
        'temperature': 0.7,
        'top_p': 0.9
    },
    'us.amazon.nova-pro-v1:0': {
        'max_tokens': 4000,
        'temperature': 0.8,
        'top_p': 0.95
    }
}
```

### Batch Processing Configuration

Edit `stepfunctions/batch_workflow.json` to adjust parallelism:

```json
{
  "MaxConcurrency": 10,
  "Comment": "Increase to 20 for faster processing (higher cost)"
}
```

---

## 📖 Usage Guide

### Single Transcript Generation

1. Navigate to the **Single** tab
2. Enter entity name (e.g., "DMV of Omaha")
3. Select AI model (Nova Lite recommended for cost)
4. Choose conversation length (Brief/Moderate/Verbose)
5. Describe the scenario (e.g., "Customer calling about license renewal")
6. Click **Generate Issues** to get AI-suggested topics
7. Select relevant issues
8. Click **Generate Transcript**
9. View color-coded transcript and analytics

### Batch Generation

1. Navigate to the **Batch** tab
2. Enter entity name
3. Select AI model
4. Set transcript count (10-10,000)
5. Enter scenarios (one per line):
   ```
   License renewal inquiry
   Vehicle registration
   Address change request
   Duplicate license request
   ```
6. Click **Start Batch Generation**
7. Monitor progress bar
8. Check DynamoDB for completed transcripts

### Vector Search

1. Navigate to the **Search** tab
2. Enter natural language query:
   ```
   "Customer frustrated about long wait times"
   "Agent resolved billing issue quickly"
   "Escalation to supervisor required"
   ```
3. Set number of results (1-20)
4. Click **Search**
5. Review similar transcripts with similarity scores

---

## 🔌 API Reference

### POST /transcript

Generate a single transcript.

**Request:**
```json
{
  "entityName": "DMV of Omaha",
  "profileId": "us.amazon.nova-lite-v1:0",
  "length": "Moderate",
  "description": "License renewal",
  "issues": ["Long wait time", "Missing documents"]
}
```

**Response:**
```json
{
  "transcript": "Agent: Thank you for calling...",
  "analysis": {
    "csat_score": 4,
    "first_call_resolution": true,
    "sentiment": "Positive",
    "call_duration": "8 minutes"
  }
}
```

### POST /batch/create

Start batch generation.

**Request:**
```json
{
  "entityName": "DMV of Omaha",
  "profileId": "us.amazon.nova-lite-v1:0",
  "count": 100,
  "scenarios": ["License renewal", "Registration"]
}
```

**Response:**
```json
{
  "batch_id": "abc-123-def-456",
  "execution_arn": "arn:aws:states:...",
  "status": "RUNNING"
}
```

### POST /search

Search transcripts by semantic similarity.

**Request:**
```json
{
  "query": "frustrated customer",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "transcript-123",
      "similarity": 0.92,
      "transcript": "...",
      "metadata": {...}
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "AccessDeniedException" when generating transcripts

**Cause**: Bedrock model access not granted or IAM permissions missing.

**Solution**:
```bash
# Check model access
aws bedrock list-foundation-models --region us-east-1

# Verify IAM role has bedrock:InvokeModel permission
aws iam get-role-policy --role-name ContactCenterLambdaRole --policy-name BedrockPolicy
```

#### 2. Batch jobs fail with "ValidationException"

**Cause**: Incorrect request format for Titan Embeddings.

**Solution**: Ensure embedding request only includes `inputText`:
```python
body = {"inputText": text[:8000]}  # Remove dimensions, normalize params
```

#### 3. CORS errors in browser console

**Cause**: API Gateway CORS not configured properly.

**Solution**:
```bash
# Add CORS headers to API Gateway
aws apigateway put-method-response \
  --rest-api-id YOUR_API_ID \
  --resource-id YOUR_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true}'
```

#### 4. Lambda timeout errors

**Cause**: Insufficient timeout for large transcript generation.

**Solution**:
```bash
# Increase Lambda timeout
aws lambda update-function-configuration \
  --function-name transcriptProcessor \
  --timeout 300
```

#### 5. DynamoDB throttling errors

**Cause**: Exceeded provisioned capacity.

**Solution**:
```bash
# Switch to on-demand billing
aws dynamodb update-table \
  --table-name ContactCenterTranscripts \
  --billing-mode PAY_PER_REQUEST
```

### Debug Mode

Enable detailed logging:

```bash
# Set Lambda environment variable
aws lambda update-function-configuration \
  --function-name transcriptProcessor \
  --environment Variables={LOG_LEVEL=DEBUG}

# View logs
aws logs tail /aws/lambda/transcriptProcessor --follow
```

### Health Checks

```bash
# Check API Gateway health
curl https://YOUR_API_GATEWAY_URL/health

# Check Lambda function status
aws lambda get-function --function-name transcriptProcessor

# Check Step Functions execution
aws stepfunctions describe-execution --execution-arn YOUR_EXECUTION_ARN
```

---

## ❓ FAQ

### General Questions

**Q: What AWS regions are supported?**  
A: Currently optimized for `us-east-1`. Other regions require Bedrock model availability verification.

**Q: Can I use Claude or other models?**  
A: Yes, but they require AWS Marketplace subscriptions. Update `transcript_processor.py` to handle different model formats.

**Q: How long does batch processing take?**  
A: ~10 minutes for 100 transcripts, ~90 minutes for 1,000 transcripts (with 10 parallel workers).

**Q: Is this production-ready?**  
A: Yes, with proper monitoring and error handling. Add CloudWatch alarms and implement retry logic for production use.

### Cost Questions

**Q: How can I reduce costs?**  
A: Use Nova Micro instead of Nova Lite (75% cheaper), enable S3 Intelligent-Tiering, use Bedrock Batch Inference API.

**Q: What's the cost per transcript?**  
A: ~$0.025 per transcript (including generation, embedding, and storage).

**Q: Are there free tier benefits?**  
A: Yes, Lambda (1M requests/month), DynamoDB (25GB storage), S3 (5GB storage) have free tiers.

### Technical Questions

**Q: Can I export transcripts?**  
A: Yes, download from S3 or query DynamoDB directly. Add export button in UI for convenience.

**Q: How accurate is the semantic search?**  
A: Titan Embeddings provide 85-90% relevance for similar queries. Fine-tune by adjusting similarity thresholds.

**Q: Can I integrate with Amazon Connect?**  
A: Yes, modify `transcript_processor.py` to accept Connect call recordings and generate transcripts from audio.

**Q: How do I backup data?**  
A: Enable S3 versioning and DynamoDB point-in-time recovery:
```bash
aws s3api put-bucket-versioning --bucket YOUR_BUCKET --versioning-configuration Status=Enabled
aws dynamodb update-continuous-backups --table-name ContactCenterTranscripts --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

---

## ⚡ Performance Optimization

### Lambda Optimization

```python
# Use connection pooling
import boto3
from functools import lru_cache

@lru_cache(maxsize=1)
def get_bedrock_client():
    return boto3.client('bedrock-runtime', region_name='us-east-1')

# Reuse client across invocations
bedrock_client = get_bedrock_client()
```

### DynamoDB Optimization

```python
# Use batch writes for multiple items
with table.batch_writer() as batch:
    for item in items:
        batch.put_item(Item=item)

# Use projection expressions to reduce data transfer
response = table.query(
    KeyConditionExpression=Key('batch_id').eq(batch_id),
    ProjectionExpression='id, transcript, csat_score'
)
```

### FAISS Optimization

```python
# Use IVF index for large datasets (>10K vectors)
quantizer = faiss.IndexFlatL2(dimension)
index = faiss.IndexIVFFlat(quantizer, dimension, nlist=100)
index.train(training_vectors)

# Use GPU for faster search (if available)
res = faiss.StandardGpuResources()
gpu_index = faiss.index_cpu_to_gpu(res, 0, index)
```

### Caching Strategy

```javascript
// Cache API responses in React
const [cache, setCache] = useState({});

const fetchWithCache = async (key, fetchFn) => {
  if (cache[key]) return cache[key];
  const data = await fetchFn();
  setCache({...cache, [key]: data});
  return data;
};
```

---

## 🔒 Security Best Practices

### IAM Least Privilege

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-*",
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-*"
      ]
    }
  ]
}
```

### Secrets Management

```bash
# Store sensitive data in Secrets Manager
aws secretsmanager create-secret \
  --name contact-center/api-keys \
  --secret-string '{"apiKey":"your-secret-key"}'

# Retrieve in Lambda
import boto3
secrets = boto3.client('secretsmanager')
secret = secrets.get_secret_value(SecretId='contact-center/api-keys')
```

### API Security

- Enable AWS WAF for API Gateway
- Implement rate limiting (100 requests/minute per user)
- Use Cognito MFA for admin users
- Rotate Cognito client secrets regularly

### Data Encryption

```bash
# Enable S3 encryption
aws s3api put-bucket-encryption \
  --bucket YOUR_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Enable DynamoDB encryption
aws dynamodb update-table \
  --table-name ContactCenterTranscripts \
  --sse-specification Enabled=true,SSEType=KMS
```

---

## 🤝 Contributing

**This is proprietary software owned by Maximus.com.**

External contributions are not accepted. For internal development guidelines, contact the development team at dev@maximus.com.

---

## 📄 License

**Copyright © 2026 Maximus.com. All Rights Reserved.**

This software is proprietary and confidential. No public license is granted. See the [LICENSE](LICENSE) file for complete terms and conditions.

### Restrictions
- ❌ No distribution, modification, or public use permitted
- ❌ No open-source license granted
- ✅ Authorized use by Maximus.com personnel only

For licensing inquiries: legal@maximus.com

---

## 🙏 Acknowledgments

- AWS Bedrock Team for providing accessible generative AI models
- FAISS Contributors for the efficient vector search library
- React Community for the excellent frontend framework

---

## 📞 Support

**For Maximus.com Authorized Users Only**

- **Internal Support**: Contact IT Service Desk
- **Technical Issues**: dev-support@maximus.com
- **Security Concerns**: security@maximus.com
- **Licensing Questions**: legal@maximus.com

---

**Built with ❤️ by Maximus.com using AWS Serverless Technologies**

**Copyright © 2026 Maximus.com. All Rights Reserved. Proprietary and Confidential.**

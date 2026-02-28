# Contact Center Transcript Generator - AWS Amplify

React application for generating and analyzing contact center transcripts using AWS Bedrock.

## Architecture

- **Frontend**: React app hosted on Amplify Hosting
- **Backend**: API Gateway + Lambda + Bedrock
- **Models**: Cross-region inference profiles for Claude, Llama, Nova

## Setup

### 1. Install Amplify CLI
```bash
npm install -g @aws-amplify/cli
amplify configure
```

### 2. Initialize Project
```bash
cd contact-center-app
npm install
```

### 3. Deploy Backend

#### Option A: Using CloudFormation
```bash
aws cloudformation create-stack \
  --stack-name contact-center-backend \
  --template-body file://amplify-backend.json \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

Get the API endpoint:
```bash
aws cloudformation describe-stacks \
  --stack-name contact-center-backend \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

#### Option B: Manual Lambda Setup
1. Create Lambda function with Python 3.11 runtime
2. Copy code from `amplify/backend/function/transcriptGenerator/index.py`
3. Add IAM permissions for Bedrock
4. Create API Gateway REST API
5. Connect POST /transcript to Lambda

### 4. Configure Frontend
Update `src/index.jsx` with your API endpoint:
```javascript
endpoint: 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod'
```

### 5. Run Locally
```bash
npm start
```

### 6. Deploy to Amplify Hosting
```bash
amplify init
amplify add hosting
amplify publish
```

## Features

- Select from available Bedrock inference profiles
- Dynamic issue generation based on scenario
- Real-time transcript generation
- Automated post-interaction analytics
- Clean, step-by-step UI

## API Operations

- `listProfiles` - Get available inference profiles
- `generateIssues` - Generate contextual additional issues
- `generateTranscript` - Create contact center transcript
- `analyzeTranscript` - Analyze with CSAT, FCR, agent performance

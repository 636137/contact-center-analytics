import json
import boto3

bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
bedrock_mgmt_client = boto3.client('bedrock', region_name='us-east-1')

def handler(event, context):
    body = json.loads(event['body'])
    operation = body.get('operation')
    
    if operation == 'listProfiles':
        return list_profiles()
    elif operation == 'generateIssues':
        return generate_issues(body['description'])
    elif operation == 'generateTranscript':
        return generate_transcript(body)
    elif operation == 'analyzeTranscript':
        return analyze_transcript(body)
    
    return {
        'statusCode': 400,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid operation'})
    }

def list_profiles():
    response = bedrock_mgmt_client.list_inference_profiles()
    
    # Filter to only Nova models (no marketplace required)
    profiles = [
        {
            'id': p['inferenceProfileId'],
            'name': p['inferenceProfileName']
        }
        for p in response['inferenceProfileSummaries']
        if p.get('status') == 'ACTIVE' 
        and p['type'] == 'SYSTEM_DEFINED'
        and 'nova' in p['inferenceProfileId'].lower()
    ]
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'profiles': profiles})
    }

def generate_issues(description):
    prompt = f"""Based on this contact center scenario: "{description}"

Generate exactly 3 relevant additional issues that could realistically occur in the same conversation. Return ONLY a JSON array of strings, nothing else.

Example format: ["issue 1", "issue 2", "issue 3"]"""

    body = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"max_new_tokens": 200}
    }
    
    response = bedrock_client.invoke_model(
        modelId='amazon.nova-lite-v1:0',
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    issues_text = response_body['output']['message']['content'][0]['text'].strip()
    
    start = issues_text.find('[')
    end = issues_text.rfind(']') + 1
    if start != -1 and end > start:
        issues = json.loads(issues_text[start:end])
    else:
        issues = []
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'issues': issues})
    }

def generate_transcript(data):
    profile_id = data['profileId']
    entity_name = data['entityName']
    length = data['length']
    description = data['description']
    additional_issues = data.get('additionalIssues', [])
    
    issues_text = ""
    if additional_issues:
        issues_text = f" The conversation should also include these additional issues: {', '.join(additional_issues)}."
    
    prompt = f"""Generate a realistic contact center transcript for {entity_name}. 

Scenario: {description}
Length: {length} (adjust conversation length accordingly){issues_text}

Create a natural conversation between a customer and a government service agent. Include:
- Realistic greetings and closings
- Natural dialogue flow
- Appropriate government service terminology
- Customer frustration or satisfaction as appropriate
- Agent troubleshooting steps

Format as:
Agent: [dialogue]
Customer: [dialogue]"""

    if 'anthropic' in profile_id.lower():
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000 if length == 'Brief' else 4000 if length == 'Moderate' else 6000,
            "messages": [{"role": "user", "content": prompt}]
        }
    elif 'meta' in profile_id.lower():
        body = {
            "prompt": prompt,
            "max_gen_len": 2000 if length == 'Brief' else 4000 if length == 'Moderate' else 6000
        }
    else:
        body = {
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "inferenceConfig": {
                "max_new_tokens": 2000 if length == 'Brief' else 4000 if length == 'Moderate' else 6000
            }
        }
    
    response = bedrock_client.invoke_model(
        modelId=profile_id,
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    
    if 'anthropic' in profile_id.lower():
        transcript = response_body['content'][0]['text']
    elif 'meta' in profile_id.lower():
        transcript = response_body['generation']
    else:
        transcript = response_body['output']['message']['content'][0]['text']
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'transcript': transcript})
    }

def analyze_transcript(data):
    transcript = data['transcript']
    entity_name = data['entityName']
    
    prompt = f"""Analyze this contact center transcript from {entity_name} and provide comprehensive Post Interaction Analytics.

TRANSCRIPT:
{transcript}

Provide a detailed analysis in the following format:

## ISSUES IDENTIFIED
- [List all customer issues, problems, or concerns raised]

## ACTIONS TO RESOLVE
- [List all actions taken by the agent to address the issues]

## OUTCOMES OF ACTIONS
- [List the results or outcomes of each action taken]

## PREDICTED CSAT
[Provide a predicted Customer Satisfaction score from 1-5 with brief justification]

## FCR (First Contact Resolution)
[State TRUE or FALSE with explanation]

## AGENT PERFORMANCE EVALUATION
- [Evaluate agent's communication skills, problem-solving, empathy, professionalism]

## OVERALL INTERACTION SUMMARY
[Provide a concise summary of the entire interaction]"""

    body = {
        "messages": [{"role": "user", "content": [{"text": prompt}]}],
        "inferenceConfig": {"max_new_tokens": 3000}
    }
    
    response = bedrock_client.invoke_model(
        modelId='amazon.nova-lite-v1:0',
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    analysis = response_body['output']['message']['content'][0]['text']
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'analysis': analysis})
    }

import json
import random

def handler(event, context):
    """
    Create batch items for parallel processing
    """
    batch_id = event['batch_id']
    entity_name = event['entity_name']
    profile_id = event['profile_id']
    scenarios = event['generated_scenarios']
    length_dist = event.get('length_distribution', {'Brief': 0.3, 'Moderate': 0.5, 'Verbose': 0.2})
    
    # Create batch items
    batches = []
    lengths = list(length_dist.keys())
    weights = list(length_dist.values())
    
    for i, scenario in enumerate(scenarios):
        length = random.choices(lengths, weights=weights)[0]
        
        batches.append({
            'batchId': batch_id,
            'index': i,
            'entityName': entity_name,
            'profileId': profile_id,
            'scenario': scenario,
            'length': length
        })
    
    return {
        **event,
        'batches': batches
    }

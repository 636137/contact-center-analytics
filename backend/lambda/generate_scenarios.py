import json
import random

def handler(event, context):
    """
    Generate diverse scenarios based on config
    """
    entity_name = event['entity_name']
    scenarios = event.get('scenarios', [])
    count = event['count']
    
    # If scenarios provided, distribute across them
    if scenarios:
        generated = []
        per_scenario = count // len(scenarios)
        remainder = count % len(scenarios)
        
        for i, scenario in enumerate(scenarios):
            scenario_count = per_scenario + (1 if i < remainder else 0)
            for _ in range(scenario_count):
                generated.append(scenario)
    else:
        # Generate default scenarios
        generated = [f"Customer inquiry #{i+1}" for i in range(count)]
    
    return {
        **event,
        'generated_scenarios': generated
    }

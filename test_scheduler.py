#!/usr/bin/env python3
"""
Test script for the school scheduler.
"""
import json
import sys
from index import handler

def test_scheduler(input_file):
    """Test the scheduler with the given input file."""
    print(f"Testing scheduler with {input_file}...")
    
    # Read the input file
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Call the handler function
    result = handler(data, None)
    
    # Parse the result
    status_code = result.get('statusCode')
    body = json.loads(result.get('body', '{}'))
    
    print(f"Status code: {status_code}")
    
    if status_code == 200:
        print("Successfully generated schedule!")
        solution = body.get('solution', {})
        
        # Print summary statistics
        total_assignments = 0
        class_subject_counts = {}
        
        for timeslot, assignments in solution.items():
            total_assignments += len(assignments)
            
            for assignment in assignments:
                class_id = assignment['class']
                subject = assignment['subject']
                
                if class_id not in class_subject_counts:
                    class_subject_counts[class_id] = {}
                
                if subject not in class_subject_counts[class_id]:
                    class_subject_counts[class_id][subject] = 0
                    
                class_subject_counts[class_id][subject] += 1
        
        print(f"Total assignments: {total_assignments}")
        print("\nClass-subject distribution:")
        for class_id in sorted(class_subject_counts.keys()):
            print(f"  {class_id}:")
            for subject in sorted(class_subject_counts[class_id].keys()):
                print(f"    {subject}: {class_subject_counts[class_id][subject]}")
                
        # Optional: save the solution to a file
        with open('solution.json', 'w') as f:
            json.dump(body, f, indent=2)
            print("\nSolution saved to solution.json")
    else:
        print("Failed to generate schedule:")
        print(f"Error: {body.get('error', 'Unknown error')}")
        
        if 'issues' in body:
            print("\nIdentified issues:")
            for i, issue in enumerate(body['issues']):
                print(f"\nIssue {i+1}:")
                print(f"  Type: {issue.get('type')}")
                print(f"  Explanation: {issue.get('explanation')}")
                
                for key, value in issue.items():
                    if key not in ['type', 'explanation']:
                        print(f"  {key}: {value}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = "example2.json"
        
    test_scheduler(input_file) 
import json

# Load the speech marks
with open('speech_marks.json', 'r') as f:
    lines = f.readlines()

# Parse all speech marks
speech_marks = []
for line in lines:
    if line.strip():
        speech_marks.append(json.loads(line))

print(f"Total words: {len(speech_marks)}")

# The timestamps should already be correct if they're continuously increasing
# Let's check if there are any backward jumps (indicating chunk resets)
issues = []
for i in range(1, len(speech_marks)):
    if speech_marks[i]['time'] < speech_marks[i-1]['time']:
        issues.append(i)
        print(f"Timestamp reset at word {i}: {speech_marks[i-1]['time']} -> {speech_marks[i]['time']}")

if issues:
    print(f"\nFound {len(issues)} timestamp resets - fixing...")
    
    # Fix the timestamps by adding cumulative offsets
    offset = 0
    for i in range(1, len(speech_marks)):
        if speech_marks[i]['time'] < speech_marks[i-1]['time']:
            # New chunk detected - add offset
            offset = speech_marks[i-1]['time']
        speech_marks[i]['time'] += offset
    
    # Save fixed version
    with open('speech_marks_fixed.json', 'w') as f:
        for mark in speech_marks:
            f.write(json.dumps(mark) + '\n')
    
    print(f"Fixed! Saved to speech_marks_fixed.json")
else:
    print("No issues found - timestamps are already continuous!")

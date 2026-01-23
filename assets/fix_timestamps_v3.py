import json

# Load original speech marks
with open('speech_marks.json', 'r') as f:
    lines = f.readlines()

speech_marks = []
for line in lines:
    if line.strip():
        speech_marks.append(json.loads(line))

print(f"Total words: {len(speech_marks)}")

# Find chunks and their durations
chunks = []
current_chunk = []
last_time = 0

for mark in speech_marks:
    if mark['time'] < last_time and current_chunk:
        # New chunk detected - save previous chunk
        chunk_duration = current_chunk[-1]['time']  # Last timestamp in chunk
        chunks.append({
            'marks': current_chunk,
            'duration': chunk_duration
        })
        current_chunk = [mark]
    else:
        current_chunk.append(mark)
    last_time = mark['time']

# Don't forget the last chunk
if current_chunk:
    chunk_duration = current_chunk[-1]['time']
    chunks.append({
        'marks': current_chunk,
        'duration': chunk_duration
    })

print(f"Found {len(chunks)} chunks")

# Rebuild with cumulative offsets
fixed_marks = []
cumulative_offset = 0

for i, chunk in enumerate(chunks):
    for mark in chunk['marks']:
        new_mark = mark.copy()
        new_mark['time'] = mark['time'] + cumulative_offset
        fixed_marks.append(new_mark)
    
    # Add this chunk's duration to the offset for next chunk
    cumulative_offset += chunk['duration']
    
    if i < 5 or i >= len(chunks) - 2:
        print(f"Chunk {i}: {len(chunk['marks'])} words, duration: {chunk['duration']}ms, cumulative: {cumulative_offset}ms")

# Save
with open('speech_marks_fixed_v3.json', 'w') as f:
    for mark in fixed_marks:
        f.write(json.dumps(mark) + '\n')

final_time = fixed_marks[-1]['time']
print(f"\nFixed! Final timestamp: {final_time}ms = {final_time/1000:.1f}s = {final_time/60000:.1f}min")
print(f"Audio duration: 150291s = 2505min")
print(f"Saved to speech_marks_fixed_v3.json")

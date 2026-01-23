import json

# Load the original speech marks
with open('speech_marks.json', 'r') as f:
    lines = f.readlines()

speech_marks = []
for line in lines:
    if line.strip():
        speech_marks.append(json.loads(line))

print(f"Total words: {len(speech_marks)}")

# Audio duration in milliseconds
AUDIO_DURATION_MS = 150291.108833 * 1000  # 150291 seconds

# Find chunk boundaries (where timestamps reset)
chunks = []
current_chunk = []
last_time = 0

for mark in speech_marks:
    if mark['time'] < last_time:
        # New chunk detected
        if current_chunk:
            chunks.append(current_chunk)
        current_chunk = [mark]
    else:
        current_chunk.append(mark)
    last_time = mark['time']

if current_chunk:
    chunks.append(current_chunk)

print(f"Found {len(chunks)} chunks")

# Recalculate timestamps by spreading evenly across audio duration
total_words = len(speech_marks)
time_per_word = AUDIO_DURATION_MS / total_words

fixed_marks = []
for i, mark in enumerate(speech_marks):
    new_mark = mark.copy()
    new_mark['time'] = int(i * time_per_word)
    fixed_marks.append(new_mark)

# Save fixed version
with open('speech_marks_fixed_v2.json', 'w') as f:
    for mark in fixed_marks:
        f.write(json.dumps(mark) + '\n')

print(f"Fixed! Distributed {total_words} words evenly across {AUDIO_DURATION_MS/1000:.1f} seconds")
print(f"Saved to speech_marks_fixed_v2.json")

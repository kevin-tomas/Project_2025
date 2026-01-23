import boto3
import json

polly = boto3.client('polly', region_name='us-east-1')

# Read your extracted text
with open('Project2025_extracted.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Use larger chunks (100k characters instead of 3k)
chunk_size = 100000
text_chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

print(f"Processing {len(text_chunks)} large chunks...")

all_speech_marks = []
audio_parts = []
cumulative_time = 0

for i, chunk in enumerate(text_chunks):
    print(f"Processing chunk {i+1}/{len(text_chunks)}...")
    
    # Get speech marks
    response_marks = polly.synthesize_speech(
        Text=chunk,
        OutputFormat='json',
        VoiceId='Matthew',
        SpeechMarkTypes=['word'],
        Engine='standard'
    )
    
    marks_text = response_marks['AudioStream'].read().decode('utf-8')
    
    # Parse and adjust timestamps
    chunk_marks = []
    for line in marks_text.strip().split('\n'):
        if line:
            mark = json.loads(line)
            mark['time'] += cumulative_time
            chunk_marks.append(mark)
            all_speech_marks.append(mark)
    
    # Get audio
    response_audio = polly.synthesize_speech(
        Text=chunk,
        OutputFormat='mp3',
        VoiceId='Matthew',
        Engine='standard'
    )
    
    audio_parts.append(response_audio['AudioStream'].read())
    
    # Update cumulative time based on last word's timestamp in this chunk
    if chunk_marks:
        cumulative_time = chunk_marks[-1]['time'] + 500  # Add 500ms buffer between chunks

print("Saving files...")

# Save speech marks
with open('speech_marks_single.json', 'w') as f:
    for mark in all_speech_marks:
        f.write(json.dumps(mark) + '\n')

# Save audio
with open('project2025_audio_single.mp3', 'wb') as f:
    for part in audio_parts:
        f.write(part)

print(f"✓ Done! Generated speech_marks_single.json and project2025_audio_single.mp3")
print(f"Total words: {len(all_speech_marks)}")
print(f"Final timestamp: {cumulative_time}ms = {cumulative_time/1000:.1f}s")

import boto3
import json
import os

polly = boto3.client('polly', region_name='us-east-1')

# Read your extracted text
with open('Project2025_extracted.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# 3000 character chunks
chunk_size = 3000
text_chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

print(f"Processing {len(text_chunks)} chunks...")

# Create output directory
os.makedirs('chunks', exist_ok=True)

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
    
    # Save speech marks for this chunk
    with open(f'chunks/chunk_{i:04d}_marks.json', 'w') as f:
        f.write(response_marks['AudioStream'].read().decode('utf-8'))
    
    # Get audio
    response_audio = polly.synthesize_speech(
        Text=chunk,
        OutputFormat='mp3',
        VoiceId='Matthew',
        Engine='standard'
    )
    
    # Save audio for this chunk
    with open(f'chunks/chunk_{i:04d}.mp3', 'wb') as f:
        f.write(response_audio['AudioStream'].read())

print(f"✓ Done! Generated {len(text_chunks)} chunk pairs in 'chunks/' folder")

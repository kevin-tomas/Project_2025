// Pages
const landingPage = document.getElementById('landingPage');
const viewerPage = document.getElementById('viewerPage');
const infoPage = document.getElementById('infoPage');

// Buttons
const enterBtn = document.getElementById('enterBtn');
const infoBtn = document.getElementById('infoBtn');
const backBtn = document.getElementById('backBtn');
const muteBtn = document.getElementById('muteBtn');
const clockTimeDisplay = document.getElementById('clockTime');

// Viewer elements
const audio = document.getElementById('audio');
const container = document.getElementById('container');
const currentTimeDisplay = document.getElementById('currentTime');

// State
let currentChunkIndex = 0;
let totalChunks = 798;
let speechMarks = [];
let currentWordIndex = 0;
let isPlaying = false;
let isMuted = false;
let checkInterval = null;
let cumulativeTime = 0;
let pendingHyphenatedWord = '';

// 24-hour sync configuration
const TOTAL_CONTENT_DURATION = 41 * 3600 + 1 * 60 + 51; // 41:01:51 in seconds
const SYNC_DURATION = 24 * 3600 - 10; // 23:59:50 (leaving 10s for silence before restart)
const BASE_SPEED = TOTAL_CONTENT_DURATION / SYNC_DURATION; // playback speed to compress to 23:59:50
const AVERAGE_CHUNK_DURATION = TOTAL_CONTENT_DURATION / totalChunks;

// Navigation
function showPage(pageToShow) {
    [landingPage, viewerPage, infoPage].forEach(page => {
        page.classList.remove('active');
    });
    pageToShow.classList.add('active');
    
    // Only prevent scrolling on landing and viewer pages
    if (pageToShow === infoPage) {
        document.body.classList.remove('no-scroll');
    } else {
        document.body.classList.add('no-scroll');
    }
}

enterBtn.addEventListener('click', async () => {
    showPage(viewerPage);
    // Initialize and autoplay
    setTimeout(async () => {
        await initializeToTimeOfDay();
        try {
            await audio.play();
            isPlaying = true;
            checkInterval = setInterval(checkWords, 16);
        } catch (err) {
            console.log('Autoplay blocked, user must click to start');
        }
    }, 100);
});

infoBtn.addEventListener('click', () => {
    showPage(infoPage);
});

backBtn.addEventListener('click', () => {
    showPage(viewerPage);
});

// Calculate position based on time of day
function getPositionFromTimeOfDay() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    
    const secondsSinceMidnight = (now - midnight) / 1000;
    const targetPosition = secondsSinceMidnight * BASE_SPEED;
    
    return targetPosition;
}

// Calculate which chunk and offset for a given position
function getChunkAndOffset(targetPosition) {
    const estimatedChunk = Math.floor(targetPosition / AVERAGE_CHUNK_DURATION);
    const offsetInChunk = targetPosition % AVERAGE_CHUNK_DURATION;
    
    return {
        chunkIndex: Math.min(estimatedChunk, totalChunks - 1),
        offset: offsetInChunk
    };
}

// Initialize to current time of day
async function initializeToTimeOfDay() {
    const targetPosition = getPositionFromTimeOfDay();
    const { chunkIndex, offset } = getChunkAndOffset(targetPosition);
    
    currentChunkIndex = chunkIndex;
    cumulativeTime = chunkIndex * AVERAGE_CHUNK_DURATION;
    
    await loadChunk(currentChunkIndex);
    
    audio.currentTime = offset;
    audio.playbackRate = BASE_SPEED;
    
    console.log(`Synced to time of day: chunk ${chunkIndex}, offset ${offset.toFixed(2)}s`);
}

// Load a chunk
async function loadChunk(index) {
    console.log(`Loading chunk ${index}...`);
    
    try {
        const response = await fetch(`assets/chunks/chunk_${String(index).padStart(4, '0')}_marks.json`);
        const text = await response.text();
        
        speechMarks = text.trim().split('\n')
            .filter(line => line.length > 0)
            .map(line => JSON.parse(line));
        
        audio.src = `assets/chunks/chunk_${String(index).padStart(4, '0')}.mp3`;
        audio.playbackRate = BASE_SPEED;
        
        currentWordIndex = 0;
        
        console.log(`Loaded chunk ${index}: ${speechMarks.length} words`);
    } catch (error) {
        console.error(`Error loading chunk ${index}:`, error);
    }
}

// Mute/Unmute
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    audio.muted = isMuted;
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
});

// Prevent keyboard controls on audio
audio.addEventListener('keydown', (e) => {
    e.preventDefault();
});

// Prevent spacebar and media keys from controlling audio
document.addEventListener('keydown', (e) => {
    // Prevent spacebar
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
    }
    // Prevent media keys (play/pause, etc)
    if (e.key === 'MediaPlayPause' || e.key === 'MediaPlay' || e.key === 'MediaPause') {
        e.preventDefault();
    }
});

// Update clock time
function updateClockTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    clockTimeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update clock every second
setInterval(updateClockTime, 1000);
updateClockTime(); // Initial call

// Check and update words
function checkWords() {
    const currentTime = audio.currentTime * 1000;
    
    while (currentWordIndex < speechMarks.length && 
           speechMarks[currentWordIndex].time <= currentTime) {
        showWord(speechMarks[currentWordIndex].value);
        currentWordIndex++;
    }
}

// Update time display with cumulative time
audio.addEventListener('timeupdate', () => {
    if (currentTimeDisplay) {
        const totalSeconds = cumulativeTime + audio.currentTime;
        currentTimeDisplay.textContent = formatTime(totalSeconds);
    }
});

// When chunk ends, load next chunk
audio.addEventListener('ended', async () => {
    console.log(`Chunk ${currentChunkIndex} ended`);
    
    cumulativeTime += audio.duration;
    currentChunkIndex++;
    
    if (currentChunkIndex < totalChunks) {
        await loadChunk(currentChunkIndex);
        if (isPlaying) {
            audio.play();
        }
    } else {
        console.log('All chunks complete! Waiting for midnight to restart...');
        if (checkInterval) clearInterval(checkInterval);
        container.innerHTML = '';
        
        // Calculate time until midnight (12:00 AM)
        const now = new Date();
        const nextRestart = new Date(now);
        nextRestart.setHours(24, 0, 0, 0); // This sets to next day's midnight
        
        const timeUntilRestart = nextRestart - now;
        
        console.log(`Restarting in ${(timeUntilRestart / 1000).toFixed(0)} seconds at midnight`);
        
        setTimeout(async () => {
            await initializeToTimeOfDay();
            audio.play();
            isPlaying = true;
            checkInterval = setInterval(checkWords, 16);
        }, timeUntilRestart);
    }
});

// Format seconds to MM:SS (or HH:MM:SS for long durations)
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showWord(word) {
    if (pendingHyphenatedWord) {
        word = pendingHyphenatedWord + word;
        pendingHyphenatedWord = '';
    }
    
    if (word.endsWith('-')) {
        pendingHyphenatedWord = word;
        return;
    }
    
    container.innerHTML = '';
    
    const wordEl = document.createElement('div');
    wordEl.className = 'word active';
    wordEl.textContent = word;
    container.appendChild(wordEl);
}
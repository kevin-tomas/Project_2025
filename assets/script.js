const audio = document.getElementById('audio');
const container = document.getElementById('container');
const speedSlider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedDisplay');
const playPauseBtn = document.getElementById('playPause');
const timeSlider = document.getElementById('timeSlider');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');

let speechMarks = [];
let currentWordIndex = 0;
let isPlaying = false;
let loopTimeout = null;
let checkInterval = null;
let lastSyncTime = 0;

// Load speech marks
fetch('assets/speech_marks_fixed_v3.json')
    .then(response => {
        if (!response.ok) throw new Error('File not found');
        return response.text();
    })
    .then(text => {
        speechMarks = text.trim().split('\n')
            .filter(line => line.length > 0)
            .map(line => JSON.parse(line));
        console.log(`Loaded ${speechMarks.length} words`);
    })
    .catch(error => {
        console.error('Error loading speech marks:', error);
        alert('Could not load speech marks file. Check the path!');
    });

// Play/Pause
playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        playPauseBtn.textContent = 'Play';
        if (checkInterval) clearInterval(checkInterval);
    } else {
        audio.play();
        isPlaying = true;
        playPauseBtn.textContent = 'Pause';
        checkInterval = setInterval(checkWords, 16);
    }
});

// Speed control
speedSlider.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    audio.playbackRate = speed;
    speedDisplay.textContent = speed.toFixed(1) + 'x';
});

// Check and update words with periodic re-sync
function checkWords() {
    const currentTime = audio.currentTime * 1000;
    
    // Re-sync every 5 minutes to prevent drift
    if (currentTime - lastSyncTime > 300000) { // 5 minutes = 300k ms
        console.log('Re-syncing at', currentTime);
        lastSyncTime = currentTime;
        
        // Find correct word index for current time
        currentWordIndex = 0;
        for (let i = 0; i < speechMarks.length; i++) {
            if (speechMarks[i].time > currentTime) {
                currentWordIndex = i;
                break;
            }
        }
    }
    
    while (currentWordIndex < speechMarks.length && 
           speechMarks[currentWordIndex].time <= currentTime) {
        showWord(speechMarks[currentWordIndex].value);
        currentWordIndex++;
    }
}

// Update timeline display
audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        timeSlider.value = percent;
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
    }
});

// Set total time when audio loads
audio.addEventListener('loadedmetadata', () => {
    totalTimeDisplay.textContent = formatTime(audio.duration);
    timeSlider.max = 100;
});

// Scrub through audio
timeSlider.addEventListener('input', (e) => {
    const percent = parseFloat(e.target.value);
    const newTime = (percent / 100) * audio.duration;
    audio.currentTime = newTime;
    
    container.innerHTML = '';
    
    const currentTimeMs = newTime * 1000;
    currentWordIndex = speechMarks.findIndex(mark => mark.time > currentTimeMs);
    
    if (currentWordIndex === -1) {
        currentWordIndex = speechMarks.length;
    }
    
    if (currentWordIndex > 0) {
        showWord(speechMarks[currentWordIndex - 1].value);
    }
    
    lastSyncTime = currentTimeMs;
});

// Loop with 20 second pause
audio.addEventListener('ended', () => {
    console.log('Audio ended, waiting 20 seconds...');
    currentWordIndex = 0;
    container.innerHTML = '';
    lastSyncTime = 0;
    if (checkInterval) clearInterval(checkInterval);
    
    loopTimeout = setTimeout(() => {
        audio.currentTime = 0;
        audio.play();
        isPlaying = true;
        checkInterval = setInterval(checkWords, 16);
    }, 20000);
});

// Format seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showWord(word) {
    container.innerHTML = '';
    
    const wordEl = document.createElement('div');
    wordEl.className = 'word active';
    wordEl.textContent = word;
    container.appendChild(wordEl);
}

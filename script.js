// Global variables
let video = null;
let stream = null;
let audioContext = null;
let oscillators = [];
let isPlaying = false;
let analyser = null;
let canvas = null;
let canvasCtx = null;
let faceDetectionModel = null;
let colorCanvas = null;
let colorCtx = null;
let currentMoodData = null;
let rhythmInterval = null;
let poseDetector = null;
let modelsLoaded = false;
let isScanning = false;
let scanningInterval = null;
let audioTrack = null; // Add this global variable
let ytPlayer = null; // YouTube IFrame player
let lastYouTubeVideo = null; // cache last fetched video for current mood
let bgCanvas, bgCtx; // animated background canvas
let particles = []; // dotted moving particles
let parallax = { x: 0, y: 0, tx: 0, ty: 0 };
let splashEl = null;
let moodHistory = [];

// Emotions mapping to music characteristics
const emotionToMusic = {
    happy: { tempo: 120, scale: 'major', color: '#FFD700', pattern: [1, 0, 1, 0, 1, 0, 1, 0] },
    sad: { tempo: 70, scale: 'minor', color: '#4169E1', pattern: [1, 0, 0, 0, 1, 0, 0, 0] },
    angry: { tempo: 140, scale: 'minor', color: '#FF0000', pattern: [1, 1, 1, 1, 1, 1, 1, 1] },
    surprised: { tempo: 100, scale: 'major', color: '#32CD32', pattern: [1, 0, 0, 1, 0, 0, 1, 0] },
    fearful: { tempo: 80, scale: 'minor', color: '#800080', pattern: [1, 0, 0, 0, 0, 0, 0, 0] },
    disgusted: { tempo: 90, scale: 'minor', color: '#006400', pattern: [1, 0, 1, 0, 0, 0, 1, 0] },
    neutral: { tempo: 100, scale: 'major', color: '#D3D3D3', pattern: [1, 0, 0, 0, 1, 0, 0, 0] }
};

// Color mapping to musical elements
const colorToMusic = {
    red: { frequency: 261.63, waveform: 'sawtooth' },      // C4
    blue: { frequency: 329.63, waveform: 'sine' },         // E4
    green: { frequency: 392.00, waveform: 'triangle' },    // G4
    yellow: { frequency: 523.25, waveform: 'square' },     // C5
    purple: { frequency: 220.00, waveform: 'sawtooth' },   // A3
    orange: { frequency: 293.66, waveform: 'square' },     // D4
    black: { frequency: 196.00, waveform: 'square' },      // G3
    white: { frequency: 440.00, waveform: 'sine' }         // A4
};

// Pose mapping to music characteristics
const poseToMusic = {
    'arms_up': { modifier: 1.5, description: 'Party Mode' },
    'slouching': { modifier: 0.7, description: 'Chill Mode' },
    'standing': { modifier: 1.0, description: 'Normal Mode' },
    'unknown': { modifier: 1.0, description: 'Unknown Pose' }
};

// Time of day mapping
const timeOfDay = {
    morning: { tempoModifier: 1.2, description: 'Morning Energy' },
    afternoon: { tempoModifier: 1.0, description: 'Afternoon Groove' },
    evening: { tempoModifier: 0.9, description: 'Evening Chill' },
    night: { tempoModifier: 0.8, description: 'Night Vibes' }
};

// Weather mapping
const weatherToMusic = {
    sunny: { key: 'major', description: 'Sunny Major' },
    rainy: { key: 'minor', description: 'Rainy Minor' },
    cloudy: { key: 'minor', description: 'Cloudy Minor' },
    stormy: { key: 'minor', description: 'Stormy Minor' }
};

// Musical scales
const scales = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10]
};

// DOM Elements
const startButton = document.getElementById('startButton');
const scanButton = document.getElementById('scanButton');
const continuousButton = document.getElementById('continuousButton');
const stopButton = document.getElementById('stopButton');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const testButton = document.getElementById('testButton');
const videoElement = document.getElementById('video');
const moodDisplay = document.getElementById('moodDisplay');
const emotionBars = document.getElementById('emotionBars');
const musicInfo = document.getElementById('musicInfo');
const visualizer = document.getElementById('visualizer');
const overlayCanvas = document.getElementById('overlay');
const overlayCtx = overlayCanvas.getContext('2d');
const loadingStatus = document.getElementById('loadingStatus');
const cameraStatus = document.getElementById('cameraStatus');
const modelStatus = document.getElementById('modelStatus');
const faceStatus = document.getElementById('faceStatus');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('visualizer');
    canvasCtx = canvas.getContext('2d');
    
    // Create a canvas for color analysis
    colorCanvas = document.createElement('canvas');
    colorCtx = colorCanvas.getContext('2d');
    
    // Set up event listeners
    startButton.addEventListener('click', startCamera);
    scanButton.addEventListener('click', scanMood);
    continuousButton.addEventListener('click', toggleContinuousScanning);
    stopButton.addEventListener('click', stopCamera);
    playButton.addEventListener('click', playMusic);
    pauseButton.addEventListener('click', pauseMusic);
    testButton.addEventListener('click', testFaceDetection);

    // Background canvas setup
    bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas) {
        bgCtx = bgCanvas.getContext('2d');
        const onResize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            bgCanvas.style.width = window.innerWidth + 'px';
            bgCanvas.style.height = window.innerHeight + 'px';
            bgCanvas.width = Math.floor(window.innerWidth * dpr);
            bgCanvas.height = Math.floor(window.innerHeight * dpr);
            bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        window.addEventListener('resize', onResize);
        onResize();
        startBackgroundAnimation();
    }

    // Parallax motion
    initParallax();

    // Splash screen
    splashEl = document.getElementById('splash');
    const enterBtn = document.getElementById('enterButton');
    if (enterBtn) {
        enterBtn.addEventListener('click', hideSplash);
    }
    if (splashEl) {
        // Click on background splash to dismiss
        splashEl.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'splash') hideSplash();
        });
        // Keyboard Enter to dismiss
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') hideSplash();
        });
        // Fallback auto-dismiss after 4s
        setTimeout(() => {
            if (splashEl && !splashEl.classList.contains('hidden')) hideSplash();
        }, 4000);
    }
    initFloatingWindows();
    
    // Initial diagnostic update
    updateDiagnostics();
    
    // Update diagnostics periodically
    setInterval(updateDiagnostics, 2000);
});

function hideSplash() {
    if (!splashEl) return;
    splashEl.classList.add('hidden');
    setTimeout(() => { if (splashEl) splashEl.style.display = 'none'; }, 650);
}

// Smooth animated blobs in the background
function startBackgroundAnimation() {
    if (!bgCtx) return;
    const blobs = createBlobs(12);
    particles = createParticles(140);
    let lastTime = 0;

    function frame(ts) {
        const dt = (ts - lastTime) / 1000 || 0.016;
        lastTime = ts;
        const W = window.innerWidth; const H = window.innerHeight;
        bgCtx.clearRect(0, 0, W, H);
        // soft gradient base
        const grad = bgCtx.createRadialGradient(
            W * 0.5, H * 0.5, 0,
            W * 0.5, H * 0.5, Math.max(W, H) * 0.7
        );
        grad.addColorStop(0, 'rgba(110,231,255,0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        bgCtx.fillStyle = grad;
        bgCtx.fillRect(0, 0, W, H);

        // animate blobs
        for (const b of blobs) {
            b.x += Math.cos(b.angle) * b.speed * dt;
            b.y += Math.sin(b.angle) * b.speed * dt;
            b.angle += b.turn * dt;
            wrap(b, W, H);
            drawBlob(b);
        }

        // animate dotted particles
        bgCtx.save();
        bgCtx.globalCompositeOperation = 'lighter';
        for (const p of particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.phase += p.twinkle * dt;
            wrap(p, W, H);
            drawParticle(p);
        }
        bgCtx.restore();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function createBlobs(n) {
        const arr = [];
        for (let i = 0; i < n; i++) {
            arr.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                r: 80 + Math.random() * 160,
                hue: 180 + Math.random() * 120,
                alpha: 0.08 + Math.random() * 0.08,
                speed: 20 + Math.random() * 40,
                angle: Math.random() * Math.PI * 2,
                turn: (Math.random() - 0.5) * 0.3
            });
        }
        return arr;
    }
    function wrap(b, W, H) {
        const r = b.r || 4;
        if (b.x < -r) b.x = W + r;
        if (b.x > W + r) b.x = -r;
        if (b.y < -r) b.y = H + r;
        if (b.y > H + r) b.y = -r;
    }
    function drawBlob(b) {
        const grad = bgCtx.createRadialGradient(b.x, b.y, b.r * 0.1, b.x, b.y, b.r);
        grad.addColorStop(0, `hsla(${b.hue}, 90%, 60%, ${b.alpha})`);
        grad.addColorStop(1, `hsla(${b.hue}, 90%, 60%, 0)`);
        bgCtx.fillStyle = grad;
        bgCtx.beginPath();
        bgCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        bgCtx.fill();
    }

    function createParticles(n) {
        const arr = [];
        for (let i = 0; i < n; i++) {
            const hue = Math.random() < 0.5 ? 195 + Math.random() * 20 : 260 + Math.random() * 20;
            arr.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                r: 1.1 + Math.random() * 1.4,
                hue,
                alpha: 0.35 + Math.random() * 0.45,
                vx: (Math.random() - 0.5) * 24,
                vy: (Math.random() - 0.5) * 24,
                twinkle: 2 + Math.random() * 3,
                phase: Math.random() * Math.PI * 2
            });
        }
        return arr;
    }

    function drawParticle(p) {
        // slight parallax depth
        const px = p.x + (parallax.x * 10);
        const py = p.y + (parallax.y * 10);
        const a = p.alpha * (0.75 + 0.25 * Math.sin(p.phase));
        bgCtx.fillStyle = `hsla(${p.hue}, 85%, 70%, ${a})`;
        bgCtx.beginPath();
        bgCtx.arc(px, py, p.r, 0, Math.PI * 2);
        bgCtx.fill();
    }
}

// Parallax background and container motion
function initParallax() {
    const orbs = document.querySelector('.bg-orbs');
    const grid = document.querySelector('.bg-grid');
    const radial = document.querySelector('.bg-radial');
    const container = document.querySelector('.container');

    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    function update() {
        parallax.x = lerp(parallax.x, parallax.tx, 0.06);
        parallax.y = lerp(parallax.y, parallax.ty, 0.06);
        const px = parallax.x;
        const py = parallax.y;

        if (orbs) orbs.style.transform = `translate(${px * 8}px, ${py * 8}px)`;
        if (grid) grid.style.transform = `translate(${px * 20}px, ${py * 20}px)`;
        if (radial) radial.style.transform = `translate(${px * 10}px, ${py * 10}px)`;
        if (container) container.style.transform = `translate(${px * 2}px, ${py * 2}px)`;
        requestAnimationFrame(update);
    }
    update();

    function handleMove(clientX, clientY) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (clientX - cx) / cx; // -1..1
        const dy = (clientY - cy) / cy; // -1..1
        parallax.tx = clamp(dx, -1, 1);
        parallax.ty = clamp(dy, -1, 1);
    }

    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('deviceorientation', (e) => {
        const x = e.gamma || 0; // left/right [-90..90]
        const y = e.beta || 0;  // front/back [-180..180]
        const nx = clamp(x / 45, -1, 1);
        const ny = clamp(y / 90, -1, 1);
        parallax.tx = nx;
        parallax.ty = ny;
    }, { passive: true });
}

// YouTube IFrame API callback
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player', {
        height: '0',
        width: '0',
        playerVars: { 'autoplay': 0, 'controls': 0 },
        events: {
            onReady: () => {},
            onStateChange: (e) => {
                // Tie visualization to YT playback state
                if (e.data === YT.PlayerState.PLAYING) {
                    isPlaying = true;
                    ensureAudioAnalyserForMedia();
                    visualize();
                } else if (e.data === YT.PlayerState.ENDED || e.data === YT.PlayerState.PAUSED) {
                    // keep analyser but stop isPlaying only when fully stopped
                    if (e.data !== YT.PlayerState.PAUSED) isPlaying = false;
                }
            }
        }
    });
};

// Start camera function
async function startCamera() {
    try {
        // Request camera with specific constraints for better compatibility
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }, 
            audio: false 
        });
        
        videoElement.srcObject = stream;
        video = videoElement;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                console.log('Video metadata loaded');
                resolve();
            };
            videoElement.onerror = (error) => {
                console.error('Video error:', error);
                reject(error);
            };
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Video loading timeout')), 10000);
        });
        
        hideSplash();
        
        // Enable buttons
        scanButton.disabled = false;
        continuousButton.disabled = false;
        stopButton.disabled = false;
        testButton.disabled = false;
        startButton.disabled = true;
        
        // Update camera status
        if (cameraStatus) {
            cameraStatus.textContent = 'Active';
            cameraStatus.style.color = 'var(--success)';
        }
        
        loadingStatus.textContent = 'Camera started, loading models...';
        
        // Load face detection model
        await loadFaceDetectionModel();
        
        // Load pose detection model
        await loadPoseDetectionModel();
        
        loadingStatus.textContent = 'Ready! You can now scan your mood.';
        console.log('Camera started successfully');
        
        // Start continuous scanning automatically
        if (modelsLoaded) {
            startContinuousScanning();
        }
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        moodDisplay.textContent = 'Error accessing camera: ' + error.message;
        
        // Provide helpful error messages
        if (error.name === 'NotAllowedError') {
            moodDisplay.textContent = 'Camera access denied. Please allow camera permissions and try again.';
        } else if (error.name === 'NotFoundError') {
            moodDisplay.textContent = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
            moodDisplay.textContent = 'Camera is in use by another application. Please close other camera apps and try again.';
        } else {
            moodDisplay.textContent = 'Error accessing camera: ' + error.message;
        }
    }
}

// Load face detection model
async function loadFaceDetectionModel() {
    try {
        moodDisplay.textContent = 'Loading face detection models...';
        loadingStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">Loading models...</span>';
        if (modelStatus) {
            modelStatus.textContent = 'Loading...';
            modelStatus.style.color = 'var(--warning)';
        }
        
        // Load Face-API.js models with progress tracking
        console.log('Loading face expression model...');
        moodDisplay.textContent = 'Loading face expression model...';
        await faceapi.nets.faceExpressionNet.loadFromUri('./models');
        
        console.log('Loading face landmark model...');
        moodDisplay.textContent = 'Loading face landmark model...';
        await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
        
        console.log('Loading face detection model...');
        moodDisplay.textContent = 'Loading face detection model...';
        await faceapi.nets.ssdMobilenetv1.loadFromUri('./models');
        
        console.log('Face detection models loaded successfully');
        moodDisplay.textContent = 'Face detection models loaded successfully!';
        loadingStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">Models loaded</span>';
        modelsLoaded = true;
        
        // Update model status
        if (modelStatus) {
            modelStatus.textContent = 'Loaded';
            modelStatus.style.color = 'var(--success)';
        }
        
        // Verify models are loaded
        if (!checkModelsLoaded()) {
            throw new Error('Models failed to load properly');
        }
        
        // Enable continuous scanning if camera is active
        if (video && video.readyState === 4) {
            startContinuousScanning();
        }
        
    } catch (error) {
        console.error('Error loading face detection models:', error);
        moodDisplay.textContent = 'Error loading models: ' + error.message;
        loadingStatus.innerHTML = '<span class="status-dot" style="background: var(--danger);"></span><span class="status-text">Model loading failed</span>';
        modelsLoaded = false;
        
        // Update model status
        if (modelStatus) {
            modelStatus.textContent = 'Failed';
            modelStatus.style.color = 'var(--danger)';
        }
    }
}

// Check if models are properly loaded
function checkModelsLoaded() {
    if (!faceapi.nets.faceExpressionNet.isLoaded) {
        console.log('Face expression model not loaded');
        return false;
    }
    if (!faceapi.nets.faceLandmark68Net.isLoaded) {
        console.log('Face landmark model not loaded');
        return false;
    }
    if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
        console.log('Face detection model not loaded');
        return false;
    }
    console.log('All models are loaded');
    return true;
}

// Load pose detection model
async function loadPoseDetectionModel() {
    try {
        moodDisplay.textContent = 'Loading pose detection model...';
        
        // Create pose detector
        poseDetector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        
        console.log('Pose detection model loaded successfully');
        moodDisplay.textContent = 'All models loaded successfully!';
    } catch (error) {
        console.error('Error loading pose detection model:', error);
        moodDisplay.textContent = 'Error loading pose model: ' + error.message;
        loadingStatus.textContent = 'Error loading pose detection model';
    }
}

// Stop camera function
function stopCamera() {
    // Stop continuous scanning
    stopContinuousScanning();
    
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
        stream = null;
        video = null;
    }
    
    // Disable buttons
    scanButton.disabled = true;
    continuousButton.disabled = true;
    stopButton.disabled = true;
    testButton.disabled = true;
    startButton.disabled = false;
    
    // Reset camera status
    if (cameraStatus) {
        cameraStatus.textContent = 'Not ready';
        cameraStatus.style.color = 'var(--danger)';
    }
    
    // Reset continuous scanning
    continuousScanning = false;
    continuousButton.textContent = 'Auto Scan: OFF';
    continuousButton.style.background = 'linear-gradient(to right, #00c3ff, #ffff1c)';
    
    // Stop music if playing
    if (isPlaying) {
        pauseMusic();
    }
    
    // Reset display
    moodDisplay.textContent = 'Camera stopped. Click "Start Camera" to begin.';
    loadingStatus.textContent = 'Ready to start';
    emotionBars.innerHTML = '';
    musicInfo.innerHTML = 'No music playing';
    modelsLoaded = false;
}

// Provide helpful tips for face detection issues
function showFaceDetectionTips() {
    const tips = [
        'Ensure your face is well-lit and clearly visible',
        'Position your face in the center of the camera frame',
        'Make sure you are not too close or too far from the camera',
        'Try removing glasses or hats if detection fails',
        'Check that your camera is not being used by another application',
        'Ensure good lighting - avoid backlighting or very dim conditions'
    ];
    
    const tipsHtml = tips.map(tip => `<li>${tip}</li>`).join('');
    moodDisplay.innerHTML = `
        <div style="text-align: left;">
            <p style="margin-bottom: 10px; color: var(--warning);">Face Detection Tips:</p>
            <ul style="text-align: left; margin-left: 20px; color: var(--muted); font-size: 0.9rem;">
                ${tipsHtml}
            </ul>
        </div>
    `;
}

// Test face detection function for debugging
async function testFaceDetection() {
    if (!video) {
        console.log('No video element');
        moodDisplay.textContent = 'No video element available';
        if (faceStatus) {
            faceStatus.textContent = 'No video';
            faceStatus.style.color = 'var(--danger)';
        }
        return false;
    }
    
    if (!checkModelsLoaded()) {
        console.log('Models not loaded');
        moodDisplay.textContent = 'Models not loaded yet';
        if (faceStatus) {
            faceStatus.textContent = 'Models not loaded';
            faceStatus.style.color = 'var(--danger)';
        }
        return false;
    }
    
    try {
        console.log('Testing face detection...');
        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('Video ready state:', video.readyState);
        
        moodDisplay.textContent = 'Testing face detection...';
        if (faceStatus) {
            faceStatus.textContent = 'Testing...';
            faceStatus.style.color = 'var(--warning)';
        }
        
        const detections = await faceapi.detectAllFaces(videoElement,
            new faceapi.SsdMobilenetv1Options({ 
                minConfidence: 0.1,  // Very low threshold for testing
                maxResults: 5
            }));
        
        console.log('Test detections found:', detections.length);
        
        if (detections.length > 0) {
            moodDisplay.textContent = `Face detection test successful! Found ${detections.length} face(s).`;
            console.log('Face detection test passed');
            if (faceStatus) {
                faceStatus.textContent = 'Working';
                faceStatus.style.color = 'var(--success)';
            }
            return true;
        } else {
            showFaceDetectionTips();
            console.log('Face detection test failed - no faces found');
            if (faceStatus) {
                faceStatus.textContent = 'No faces detected';
                faceStatus.style.color = 'var(--danger)';
            }
            return false;
        }
    } catch (error) {
        console.error('Test face detection error:', error);
        moodDisplay.textContent = 'Face detection test error: ' + error.message;
        if (faceStatus) {
            faceStatus.textContent = 'Error';
            faceStatus.style.color = 'var(--danger)';
        }
        return false;
    }
}

// Check camera status and provide debugging info
function checkCameraStatus() {
    if (!video) {
        console.log('No video element');
        return false;
    }
    
    const status = {
        videoElement: !!video,
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        paused: video.paused,
        ended: video.ended,
        currentTime: video.currentTime,
        duration: video.duration
    };
    
    console.log('Camera status:', status);
    
    if (status.readyState !== 4) {
        console.log('Video not ready - readyState:', status.readyState);
        return false;
    }
    
    if (status.videoWidth === 0 || status.videoHeight === 0) {
        console.log('Video dimensions are zero');
        return false;
    }
    
    if (status.paused || status.ended) {
        console.log('Video is paused or ended');
        return false;
    }
    
    console.log('Camera status OK');
    return true;
}

// Scan mood function
async function scanMood() {
    if (!video) {
        moodDisplay.textContent = 'Please start the camera first';
        return;
    }

    if (!modelsLoaded) {
        moodDisplay.textContent = 'Models are still loading, please wait...';
        return;
    }

    // Check camera status first
    if (!checkCameraStatus()) {
        moodDisplay.textContent = 'Camera not ready. Please ensure camera is working properly.';
        return;
    }

    // Ensure video is ready and playing
    if (video.readyState !== 4 || video.paused || video.ended) {
        moodDisplay.textContent = 'Camera not ready or not playing. Please wait a moment and ensure your webcam is active.';
        return;
    }

    isScanning = true;
    moodDisplay.textContent = 'Scanning... Please wait';
    try { document.querySelector('.video-container')?.classList.add('scanning'); } catch {}

    // Clear overlay canvas before scan
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    try {
        // Use video dimensions for detection
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        overlayCanvas.width = displaySize.width;
        overlayCanvas.height = displaySize.height;

        console.log('Video dimensions:', displaySize);
        console.log('Video ready state:', video.readyState);
        console.log('Video paused:', video.paused);
        console.log('Video ended:', video.ended);

        // Test face detection first
        const testResult = await testFaceDetection();
        if (!testResult) {
            moodDisplay.textContent = 'No face detected. Please ensure your face is well-lit, clearly visible to the camera, and positioned in the center of the frame.';
            console.log('Face detection test failed');
            return;
        }

        // Detect faces with lower confidence threshold and better error handling
        const detections = await faceapi.detectAllFaces(videoElement,
            new faceapi.SsdMobilenetv1Options({ 
                minConfidence: 0.3,  // Lower threshold for better detection
                maxResults: 1  // Limit to 1 face for performance
            }))
            .withFaceLandmarks()
            .withFaceExpressions();

        console.log('Face detections found:', detections.length);

        // Draw detections on overlay canvas
        if (detections.length > 0) {
            // Draw face box and landmarks for the first face
            const dims = faceapi.matchDimensions(overlayCanvas, displaySize, true);
            const resizedDetections = faceapi.resizeResults(detections, dims);

            resizedDetections.forEach(det => {
                faceapi.draw.drawDetections(overlayCanvas, [det]);
                faceapi.draw.drawFaceLandmarks(overlayCanvas, [det]);
            });
        } else {
            moodDisplay.textContent = 'No face detected. Please ensure your face is well-lit, clearly visible to the camera, and positioned in the center of the frame.';
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            
            // Add helpful debugging information
            console.log('No faces detected. Possible issues:');
            console.log('- Face not in frame');
            console.log('- Poor lighting');
            console.log('- Face too far from camera');
            console.log('- Camera not properly initialized');
            
            // Show helpful tips after a short delay
            setTimeout(() => {
                showFaceDetectionTips();
            }, 2000);
            
            return; // Exit early if no face detected
        }

        // Detect pose
        const pose = await detectPose();

        if (detections.length > 0) {
            // Get the first detected face
            const detection = detections[0];
            const expressions = detection.expressions;
            
            // Find the dominant emotion
            let dominantEmotion = 'neutral';
            let maxProbability = 0;

            Object.entries(detections[0].expressions).forEach(([emotion, probability]) => {
                if (probability > maxProbability) {
                    maxProbability = probability;
                    dominantEmotion = emotion;
                }
            });

            // Analyze clothing colors (less frequently for performance)
            const colors = await analyzeClothingColors();

            // Get time of day and weather
            const timeInfo = getTimeOfDay();
            const weatherInfo = getWeather();

            // Store current mood data
            currentMoodData = {
                emotion: dominantEmotion,
                expressions: detections[0].expressions,
                colors: colors,
                pose: pose,
                time: timeInfo,
                weather: weatherInfo
            };

            // Display the detected mood and colors
            displayMood(currentMoodData);

            // Update mood history window
            pushMoodHistory(currentMoodData);

            // Enable music controls
            playButton.disabled = false;
            pauseButton.disabled = false;

            console.log('Mood scanned:', dominantEmotion);
        } else {
            moodDisplay.textContent = 'No face detected. Please position yourself in front of the camera.';
        }
    } catch (error) {
        console.error('Error scanning mood:', error);
        moodDisplay.textContent = 'Error scanning mood: ' + error.message;
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    } finally {
        isScanning = false;
        try { document.querySelector('.video-container')?.classList.remove('scanning'); } catch {}
    }
}

// Start continuous scanning
function startContinuousScanning() {
    if (scanningInterval) {
        clearInterval(scanningInterval);
    }
    
    // Check if models are loaded before starting
    if (!checkModelsLoaded()) {
        console.log('Models not loaded, cannot start continuous scanning');
        return;
    }
    
    // Scan every 2 seconds for better performance
    scanningInterval = setInterval(() => {
        if (modelsLoaded && video && video.readyState === 4 && !isScanning) {
            // Additional check for video dimensions
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                scanMood();
            } else {
                console.log('Video not ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
            }
        }
    }, 2000);
}

// Stop continuous scanning
function stopContinuousScanning() {
    if (scanningInterval) {
        clearInterval(scanningInterval);
        scanningInterval = null;
    }
}

// Display detected mood
function displayMood(moodData) {
    // Display main emotion
    moodDisplay.textContent = `Detected Mood: ${moodData.emotion.charAt(0).toUpperCase() + moodData.emotion.slice(1)}`;
    
    // Display emotion percentages
    emotionBars.innerHTML = '';
    
    Object.entries(moodData.expressions).forEach(([emotion, probability]) => {
        const percentage = probability * 100;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'emotion-bar';
        
        const label = document.createElement('div');
        label.className = 'emotion-label';
        label.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        
        const meter = document.createElement('div');
        meter.className = 'emotion-meter';
        
        const level = document.createElement('div');
        level.className = 'emotion-level';
        level.style.width = `${percentage}%`;
        level.style.backgroundColor = emotionToMusic[emotion]?.color || '#FFFFFF';
        
        meter.appendChild(level);
        barContainer.appendChild(label);
        barContainer.appendChild(meter);
        emotionBars.appendChild(barContainer);
    });
    
    // Update music info
    const musicData = emotionToMusic[moodData.emotion];
    if (musicData) {
        musicInfo.innerHTML = `
            <p>Tempo: ${musicData.tempo} BPM</p>
            <p>Scale: ${musicData.scale}</p>
            <p>Color: <span style="color: ${musicData.color}">${musicData.color}</span></p>
        `;
    }
    
    // Display color information if available
    if (moodData.colors && moodData.colors.dominant) {
        const colorInfo = document.createElement('p');
        colorInfo.innerHTML = `Dominant Clothing Color: <span style="color: ${moodData.colors.dominant}">${moodData.colors.dominant}</span>`;
        musicInfo.appendChild(colorInfo);
    }
    
    // Display pose information if available
    if (moodData.pose) {
        const poseInfo = document.createElement('p');
        poseInfo.textContent = `Detected Pose: ${moodData.pose.type} (${moodData.pose.confidence.toFixed(2)})`;
        musicInfo.appendChild(poseInfo);
    }
    
    // Display time and weather information
    if (moodData.time) {
        const timeInfo = document.createElement('p');
        timeInfo.textContent = `Time of Day: ${moodData.time.description}`;
        musicInfo.appendChild(timeInfo);
    }
    
    if (moodData.weather) {
        const weatherInfo = document.createElement('p');
        weatherInfo.textContent = `Weather: ${moodData.weather.description}`;
        musicInfo.appendChild(weatherInfo);
    }
}

// Play music function
async function playMusic() {
    if (!currentMoodData) {
        musicInfo.textContent = 'Please scan your mood first';
        return;
    }

    stopMusic();

    // Try YouTube first
    const ytTrack = await fetchYouTubeTrack(currentMoodData.emotion);
    if (ytTrack && ytTrack.videoId) {
        const started = playYouTube(ytTrack);
        if (started) {
            const thumb = `https://i.ytimg.com/vi/${ytTrack.videoId}/hqdefault.jpg`;
            updateNowPlaying({
                source: 'YouTube',
                title: ytTrack.title,
                artist: ytTrack.artist,
                url: ytTrack.url,
                thumbnail: thumb
            });
            return;
        }
        // else fall through to other sources
    }

    // Fallback to Jamendo
    const jamendoTrack = await fetchJamendoTrack(currentMoodData.emotion);
    if (jamendoTrack && jamendoTrack.audio) {
        playAudioTrack(jamendoTrack);
        isPlaying = true;
        updateNowPlaying({
            source: 'Jamendo',
            title: jamendoTrack.title,
            artist: jamendoTrack.artist,
            url: jamendoTrack.url
        });
        return;
    }

    // Fallback to FMA
    const fmaTrack = await fetchRealMusicTrack(currentMoodData.emotion);
    if (fmaTrack && fmaTrack.audio) {
        playAudioTrack(fmaTrack);
        isPlaying = true;
        updateNowPlaying({
            source: 'FMA',
            title: fmaTrack.title,
            artist: fmaTrack.artist,
            url: fmaTrack.url
        });
        return;
    } else {
        musicInfo.innerHTML = `<p>No suitable real music found. Playing generated music instead.</p>`;
    }

    // Fallback to generated music
    createMusic(currentMoodData);
    isPlaying = true;
    visualize();
    console.log('Music playing');
}

// Fetch YouTube track from our server proxy
async function fetchYouTubeTrack(emotion) {
    try {
        // Reuse last video for same emotion to reduce calls
        if (lastYouTubeVideo && lastYouTubeVideo.emotion === emotion) {
            return lastYouTubeVideo;
        }
        // Invert the emotion for opposite mood music
        const oppositeEmotion = getOppositeEmotion(emotion);
        const resp = await fetch(`/.netlify/functions/api?emotion=${encodeURIComponent(oppositeEmotion)}`);
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && data.videoId) {
            lastYouTubeVideo = { ...data, emotion: oppositeEmotion };
            return lastYouTubeVideo;
        }
    } catch (err) {
        console.error('YouTube fetch error:', err);
    }
    return null;
}

// Get opposite emotion for mood inversion
function getOppositeEmotion(emotion) {
    const opposites = {
        happy: 'sad',
        sad: 'happy',
        angry: 'calm',
        surprised: 'chill',
        fearful: 'upbeat',
        disgusted: 'pleasant',
        neutral: 'energetic'
    };
    return opposites[emotion] || 'chill';
}

function playYouTube(track) {
    if (!ytPlayer || !window.YT || typeof ytPlayer.loadVideoById !== 'function') {
        return false;
    }
    // Stop any other audio
    if (audioTrack) {
        audioTrack.pause();
        audioTrack = null;
    }
    ytPlayer.loadVideoById(track.videoId);
    ytPlayer.playVideo();
    isPlaying = true;
    return true;
}

// Render a Now Playing card in the UI
function updateNowPlaying(info) {
    const { source, title, artist, url, thumbnail } = info;
    const container = document.getElementById('musicInfo');
    if (!container) return;
    const safeTitle = title || 'Unknown Title';
    const safeArtist = artist || 'Unknown Artist';
    const safeUrl = url || '#';
    const hasThumb = Boolean(thumbnail);
    container.innerHTML = `
      <div class="now-playing">
        <div class="np-art">
          ${hasThumb ? `<img src="${thumbnail}" alt="${safeTitle}">` : ''}
          <div class="np-badge">${source || 'Music'}</div>
        </div>
        <div class="np-meta">
          <div class="np-title">${safeTitle}</div>
          <div class="np-artist">${safeArtist}</div>
          ${url ? `<a class="np-link" href="${safeUrl}" target="_blank" rel="noopener">Open</a>` : ''}
        </div>
      </div>
    `;
    // Mirror to mini player
    const mini = document.getElementById('mini-player-content');
    if (mini) mini.innerHTML = container.innerHTML;
}

// Floating windows control
function initFloatingWindows() {
    const moodBtn = document.getElementById('toggleMoodWin');
    const playerBtn = document.getElementById('togglePlayerWin');
    const moodWin = document.getElementById('float-mood');
    const playerWin = document.getElementById('float-player');

    if (moodBtn && moodWin) moodBtn.onclick = () => moodWin.classList.toggle('hidden');
    if (playerBtn && playerWin) playerBtn.onclick = () => playerWin.classList.toggle('hidden');

    document.querySelectorAll('.win-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            const el = document.getElementById(target);
            if (el) el.classList.add('hidden');
        });
    });

    makeDraggable(moodWin, document.getElementById('float-mood-handle'));
    makeDraggable(playerWin, document.getElementById('float-player-handle'));
}

function makeDraggable(winEl, handleEl) {
    if (!winEl || !handleEl) return;
    let isDown = false, sx = 0, sy = 0, left = 0, top = 0;
    const onDown = (e) => {
        isDown = true;
        const rect = winEl.getBoundingClientRect();
        left = rect.left; top = rect.top;
        sx = (e.touches ? e.touches[0].clientX : e.clientX);
        sy = (e.touches ? e.touches[0].clientY : e.clientY);
        e.preventDefault();
    };
    const onMove = (e) => {
        if (!isDown) return;
        const cx = (e.touches ? e.touches[0].clientX : e.clientX);
        const cy = (e.touches ? e.touches[0].clientY : e.clientY);
        const dx = cx - sx; const dy = cy - sy;
        winEl.style.left = Math.max(10, Math.min(window.innerWidth - 40, left + dx)) + 'px';
        winEl.style.top = Math.max(10, Math.min(window.innerHeight - 40, top + dy)) + 'px';
    };
    const onUp = () => { isDown = false; };
    handleEl.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    handleEl.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
}

// Append to mood history list
function pushMoodHistory(moodData) {
    const entry = {
        time: new Date().toLocaleTimeString(),
        emotion: moodData.emotion,
        dominant: moodData.colors?.dominant || '#999999'
    };
    moodHistory.unshift(entry);
    if (moodHistory.length > 12) moodHistory.pop();
    const list = document.getElementById('moodHistory');
    if (!list) return;
    list.innerHTML = moodHistory.map(item => `
      <li>
        <span>${item.time}</span>
        <span style="display:inline-flex;align-items:center;gap:8px;">
          <i style="width:10px;height:10px;border-radius:999px;background:${item.dominant};display:inline-block;"></i>
          ${item.emotion}
        </span>
      </li>
    `).join('');
}

// Fetch real music track from Jamendo API
async function fetchJamendoTrack(emotion) {
    // Invert emotions for opposite mood music
    const oppositeEmotion = getOppositeEmotion(emotion);
    const emotionToTag = {
        happy: 'sad',
        sad: 'happy',
        angry: 'calm',
        surprised: 'chill',
        fearful: 'upbeat',
        disgusted: 'pleasant',
        neutral: 'energetic'
    };
    const tag = emotionToTag[oppositeEmotion] || 'chill';

    // Jamendo API endpoint (public demo key)
    const apiUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=6d7f8e6b&format=json&limit=1&tags=${tag}&audioformat=mp31`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data && data.results && data.results.length > 0) {
            const track = data.results[0];
            return {
                title: track.name,
                artist: track.artist_name,
                url: track.shareurl,
                audio: track.audio,
                thumbnail: track.image
            };
        }
    } catch (err) {
        console.error('Error fetching Jamendo track:', err);
    }
    return null;
}

// Stop all music
function stopMusic() {
    // Stop any existing oscillators
    oscillators.forEach(osc => {
        if (osc) {
            osc.stop();
        }
    });
    oscillators = [];
    
    // Clear any existing rhythm interval
    if (rhythmInterval) {
        clearInterval(rhythmInterval);
        rhythmInterval = null;
    }
    // Stop audio track if playing
    if (audioTrack) {
        audioTrack.pause();
        audioTrack.currentTime = 0;
        audioTrack = null;
    }
    // Stop YouTube if playing
    if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
        ytPlayer.stopVideo();
    }
}

// Pause music function
function pauseMusic() {
    stopMusic();
    isPlaying = false;
    
    console.log('Music paused');
}

// Fetch real music track from Free Music Archive API
async function fetchRealMusicTrack(emotion) {
    // Invert emotions for opposite mood music
    const oppositeEmotion = getOppositeEmotion(emotion);
    const emotionToGenre = {
        happy: 'blues',
        sad: 'pop',
        angry: 'ambient',
        surprised: 'classical',
        fearful: 'rock',
        disgusted: 'pop',
        neutral: 'electronic'
    };
    const genre = emotionToGenre[oppositeEmotion] || 'chill';

    // FMA API endpoint (no API key required for basic search)
    const apiUrl = `https://freemusicarchive.org/api/trackSearch?q=${genre}&limit=5`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data && data.aTracks && data.aTracks.length > 0) {
            // Find first track with a valid audio URL
            for (const track of data.aTracks) {
                if (track.track_listen_url) {
                    return {
                        title: track.track_title,
                        artist: track.artist_name,
                        url: track.track_url,
                        audio: track.track_listen_url,
                        thumbnail: track.track_image
                    };
                }
            }
        }
    } catch (err) {
        console.error('Error fetching FMA track:', err);
    }
    return null;
}

// Play audio track from FMA
function playAudioTrack(track) {
    if (audioTrack) {
        audioTrack.pause();
        audioTrack = null;
    }
    audioTrack = new Audio(track.audio);
    audioTrack.crossOrigin = "anonymous";
    audioTrack.oncanplay = () => {
        // Resume AudioContext for visualization if needed (autoplay policy)
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        audioTrack.play();
    };
    audioTrack.onerror = () => {
        musicInfo.innerHTML = `<p>Unable to play this track. Playing generated music instead.</p>`;
        createMusic(currentMoodData);
        isPlaying = true;
        visualize();
    };
    ensureAudioAnalyserForMedia(audioTrack);
}

// Create music based on all factors
function createMusic(moodData) {
    // Use opposite emotion for generated music
    const emotion = getOppositeEmotion(moodData.emotion);
    const colorCategory = moodData.colors?.category || 'unknown';
    const poseType = moodData.pose?.type || 'unknown';
    const timeInfo = moodData.time || getTimeOfDay();
    const weatherInfo = moodData.weather || getWeather();
    
    const musicData = emotionToMusic[emotion];
    const colorData = colorToMusic[colorCategory];
    const poseData = poseToMusic[poseType];
    const timeData = timeOfDay[timeInfo.type];
    const weatherData = weatherToMusic[weatherInfo.type];
    
    if (!musicData) return;
    
    // Adjust tempo based on pose and time of day
    let adjustedTempo = musicData.tempo;
    adjustedTempo *= (poseData?.modifier || 1.0);
    adjustedTempo *= (timeData?.tempoModifier || 1.0);
    
    // Adjust key based on weather
    const adjustedKey = weatherData?.key || musicData.scale;
    
    // Create rhythm pattern
    createRhythmPattern(adjustedTempo, musicData.pattern, colorData, adjustedKey);
}

// Create rhythm pattern
function createRhythmPattern(tempo, pattern, colorData, key) {
    const beatInterval = (60 / tempo) * 1000; // ms per beat
    let beatIndex = 0;
    
    rhythmInterval = setInterval(() => {
        if (pattern[beatIndex % pattern.length]) {
            playBeat(colorData, key);
        }
        beatIndex++;
    }, beatInterval);
}

// Play a single beat
function playBeat(colorData, key) {
    if (!audioContext) return;
    
    // Create oscillator for the beat
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set oscillator properties
    if (colorData) {
        oscillator.frequency.value = colorData.frequency;
        oscillator.type = colorData.waveform;
    } else {
        oscillator.frequency.value = 440; // Default A4
        oscillator.type = 'sine';
    }
    
    // Adjust frequency based on key
    if (key === 'minor') {
        oscillator.frequency.value *= 0.95; // Slightly lower for minor key
    }
    
    // Configure gain (volume) envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Start and stop oscillator
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
    
    // Store reference for cleanup
    oscillators.push(oscillator);
    
    // Remove reference after stopping
    oscillator.onended = () => {
        const index = oscillators.indexOf(oscillator);
        if (index !== -1) {
            oscillators.splice(index, 1);
        }
    };
}

// Visualize music function
function visualize() {
    if (!isPlaying) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    const draw = () => {
        if (!isPlaying) return;
        
        requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, ${255 - barHeight})`;
            canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
            
            x += barWidth + 1;
        }
    };
    
    draw();
}

// Ensure AudioContext/Analyser exist and connect a media element if provided
function ensureAudioAnalyserForMedia(mediaEl) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
    }
    if (mediaEl instanceof HTMLMediaElement) {
        try {
            const source = audioContext.createMediaElementSource(mediaEl);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
        } catch (e) {
            // Guard against connecting the same element multiple times
        }
    }
}

// Analyze clothing colors
async function analyzeClothingColors() {
    return new Promise((resolve) => {
        if (!video) {
            resolve({ dominant: '#000000', category: 'unknown' });
            return;
        }
        
        // Set canvas dimensions to match video
        colorCanvas.width = video.videoWidth;
        colorCanvas.height = video.videoHeight;
        
        // Draw the current video frame to the canvas
        colorCtx.drawImage(video, 0, 0, colorCanvas.width, colorCanvas.height);
        
        // Get image data from the lower portion (clothing area)
        const startY = Math.floor(colorCanvas.height * 0.6); // Start at 60% from top
        const height = Math.floor(colorCanvas.height * 0.4); // Analyze bottom 40%
        
        const imageData = colorCtx.getImageData(0, startY, colorCanvas.width, height);
        const data = imageData.data;
        
        // Simple color analysis - find dominant color
        const colorCounts = {};
        let maxCount = 0;
        let dominantColor = '#000000';
        
        // Sample every 10th pixel to reduce processing
        for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert RGB to hex
            const hex = rgbToHex(r, g, b);
            
            // Count color occurrences
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
            
            // Track dominant color
            if (colorCounts[hex] > maxCount) {
                maxCount = colorCounts[hex];
                dominantColor = hex;
            }
        }
        
        // Determine color category
        const colorCategory = getColorCategory(dominantColor);
        
        resolve({
            dominant: dominantColor,
            category: colorCategory
        });
    });
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Get color category based on hex value
function getColorCategory(hex) {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Simple color categorization
    if (r > 200 && g < 100 && b < 100) return 'red';
    if (r < 100 && g < 100 && b > 200) return 'blue';
    if (r < 100 && g > 200 && b < 100) return 'green';
    if (r > 200 && g > 200 && b < 100) return 'yellow';
    if (r > 150 && g < 100 && b > 150) return 'purple';
    if (r > 200 && g > 100 && b < 100) return 'orange';
    if (r < 50 && g < 50 && b < 50) return 'black';
    if (r > 200 && g > 200 && b > 200) return 'white';
    
    return 'unknown';
}

// Detect pose using TensorFlow.js
async function detectPose() {
    if (!poseDetector || !video) {
        return { type: 'unknown', confidence: 0 };
    }
    
    try {
        // Detect poses
        const poses = await poseDetector.estimatePoses(video);
        
        if (poses.length > 0) {
            const pose = poses[0];
            const keypoints = pose.keypoints;
            
            // Analyze pose to determine type
            const poseType = analyzePoseType(keypoints);
            
            return {
                type: poseType,
                confidence: pose.score
            };
        }
    } catch (error) {
        console.error('Error detecting pose:', error);
    }
    
    return { type: 'unknown', confidence: 0 };
}

// Analyze pose type based on keypoints
function analyzePoseType(keypoints) {
    // Find relevant keypoints
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
    const nose = keypoints.find(kp => kp.name === 'nose');
    
    if (!leftShoulder || !rightShoulder || !nose) {
        return 'unknown';
    }
    
    // Check if arms are up (shoulders higher than nose)
    if (leftShoulder.y < nose.y && rightShoulder.y < nose.y) {
        return 'arms_up';
    }
    
    // Check if slouching (shoulders lower than nose)
    if (leftShoulder.y > nose.y + 50 && rightShoulder.y > nose.y + 50) {
        return 'slouching';
    }
    
    return 'standing';
}

// Get time of day
function getTimeOfDay() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
        return { type: 'morning', description: 'Morning Energy' };
    } else if (hour >= 12 && hour < 17) {
        return { type: 'afternoon', description: 'Afternoon Groove' };
    } else if (hour >= 17 && hour < 21) {
        return { type: 'evening', description: 'Evening Chill' };
    } else {
        return { type: 'night', description: 'Night Vibes' };
    }
}

// Get weather (simulated)
function getWeather() {
    // In a real implementation, this would fetch from a weather API
    // For now, we'll simulate different weather conditions
    const conditions = ['sunny', 'rainy', 'cloudy', 'stormy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
        type: condition,
        description: condition.charAt(0).toUpperCase() + condition.slice(1) + ' Weather'
    };
}

// Toggle continuous scanning
let continuousScanning = false;

function toggleContinuousScanning() {
    if (!modelsLoaded || !video) {
        loadingStatus.textContent = 'Please start camera and wait for models to load first';
        return;
    }
    
    continuousScanning = !continuousScanning;
    
    if (continuousScanning) {
        continuousButton.textContent = 'Auto Scan: ON';
        continuousButton.style.background = 'linear-gradient(to right, #00ff00, #32cd32)';
        startContinuousScanning();
        loadingStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">Continuous scanning active</span>';
    } else {
        continuousButton.textContent = 'Auto Scan: OFF';
        continuousButton.style.background = 'linear-gradient(to right, #00c3ff, #ffff1c)';
        stopContinuousScanning();
        loadingStatus.innerHTML = '<span class="status-dot"></span><span class="status-text">Continuous scanning stopped</span>';
    }
}

// Update diagnostic status
function updateDiagnostics() {
    if (cameraStatus) {
        if (video && video.readyState === 4) {
            cameraStatus.textContent = 'Active';
            cameraStatus.style.color = 'var(--success)';
        } else {
            cameraStatus.textContent = 'Not ready';
            cameraStatus.style.color = 'var(--danger)';
        }
    }
    
    if (modelStatus) {
        if (checkModelsLoaded()) {
            modelStatus.textContent = 'Loaded';
            modelStatus.style.color = 'var(--success)';
        } else {
            modelStatus.textContent = 'Not loaded';
            modelStatus.style.color = 'var(--danger)';
        }
    }
    
    if (faceStatus) {
        if (modelsLoaded && video && video.readyState === 4) {
            faceStatus.textContent = 'Ready to test';
            faceStatus.style.color = 'var(--warning)';
        } else {
            faceStatus.textContent = 'Not ready';
            faceStatus.style.color = 'var(--danger)';
        }
    }
}
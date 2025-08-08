# Moodify 🎵

## Basic Details
**Team Name:** 
  "CodeCraft"  
**Team Members:**
- Team Lead: [Anirudh O V] - [Jyothi Engineering Colledge Thrissur]
- Member 2: [Anuja K] - [Jyothi Engineering Colledge Thrissur]

## Project Description
MoodTune Scanner is an AI-powered web application that detects your facial emotions through your camera and plays the **opposite** mood of music. When you're happy, it plays sad music. When you're sad, it plays happy music. It's the ultimate mood inversion machine for your hackathon!

## The Problem (that doesn't exist)
Ever felt like your music was just... too predictable? Too... *matching* your mood? We thought: what if we could create a system that deliberately plays the opposite of what you're feeling? Because sometimes you need a sad song when you're happy, or an upbeat track when you're down. It's like having a musical therapist that does the exact opposite of what you'd expect!

## The Solution (that nobody asked for)
We built a real-time emotion detection system using AI that scans your face, detects your mood, and then deliberately plays music that's the complete opposite. Happy face? Here's some melancholic blues. Sad face? Time for some energetic pop! It's the musical equivalent of wearing socks with sandals - technically wrong, but somehow it works.

## Technical Details

### Technologies/Components Used

**For Software:**
- **Languages:** JavaScript (ES6+), HTML5, CSS3
- **Frameworks:** Express.js (Node.js)
- **Libraries:** 
  - Face-API.js (facial emotion detection)
  - TensorFlow.js (pose detection)
  - YouTube IFrame API
  - ytmusic-api & yt-search (music fetching)
- **Tools:** 
  - WebRTC (camera access)
  - Web Audio API (audio visualization)
  - Canvas API (real-time graphics)


## Implementation

### For Software:

**Installation:**
```bash
git clone https://github.com/your-username/moodtune-scanner.git
cd moodtune-scanner
npm install
```

**Run:**
```bash
npm start
```
Then open `http://localhost:3000` in your browser.

## Project Documentation

### For Software:

**Screenshots:**

![Splash Screen](https://github.com/anuja014/Moodify/blob/main/splash_screen.jpeg)
*The premium splash screen with animated background elements and glassy UI*

![Mood Detection](screenshots/mood-detection.png)
*Real-time facial emotion detection with live camera feed and emotion bars*

![Music Player](https://github.com/anuja014/Moodify/blob/main/music_player.jpeg)
*Now Playing interface showing YouTube track with thumbnail and mood inversion logic*

**Diagrams:**

![Workflow](https://github.com/anuja014/Moodify/blob/main/Flowchart.png)
*Architecture showing camera → AI detection → mood inversion → music selection → playback*

## Project Demo

**Video:** [https://github.com/anuja014/Moodify/blob/main/WhatsApp%20Video%202025-08-09%20at%2002.28.29.mp4]
*Demonstrates the complete workflow from camera activation to mood detection to opposite music playback*

**Live Demo:** [https://bucolic-granita-4ebed8.netlify.app/]

## Team Contributions

**[Anirudh O V]:** Full-stack development, AI integration, UI/UX design, mood inversion logic  
**[Anuja K]:** Backend API development, YouTube integration, server optimization  

## Features

- 🎭 **Real-time Emotion Detection:** Uses Face-API.js to detect 7 different emotions
- 🎵 **Mood Inversion:** Plays opposite music to your detected mood
- 🎨 **Premium UI:** Glassy, animated interface with floating windows
- 📱 **Responsive Design:** Works on desktop and mobile devices
- 🎶 **Multiple Music Sources:** YouTube Music, Jamendo, Free Music Archive
- 📊 **Mood History:** Tracks your emotional journey over time
- 🎛️ **Mini Player:** Floating mini player for quick access
- ✨ **Smooth Animations:** Parallax effects, particle systems, and micro-interactions

## How It Works

1. **Camera Activation:** Grant camera permissions to start scanning
2. **Emotion Detection:** AI analyzes your facial expressions in real-time
3. **Mood Inversion:** System determines the opposite emotion
4. **Music Selection:** Fetches appropriate music from multiple sources
5. **Playback:** Streams the opposite mood music with visualization

## Mood Mapping

| Detected Mood | Plays Opposite |
|---------------|----------------|
| Happy 😊 | Sad/Blues 🎵 |
| Sad 😢 | Happy/Pop 🎵 |
| Angry 😠 | Calm/Ambient 🎵 |
| Surprised 😲 | Chill/Relaxing 🎵 |
| Fearful 😨 | Upbeat/Energetic 🎵 |
| Disgusted 🤢 | Pleasant/Nice 🎵 |
| Neutral 😐 | Electronic/Energetic 🎵 |

## Made with ❤ at TinkerHub Useless Projects

[![Static Badge](https://img.shields.io/badge/TinkerHub-Useless%20Projects-orange)](https://tinkerhub.org)

---

*Because sometimes the best solution is the one nobody asked for! 🎵✨*
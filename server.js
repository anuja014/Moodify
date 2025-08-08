const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// YouTube Music search proxy
// Uses the 'ytmusic-api' package on the server to avoid CORS and client auth issues
app.get('/api/youtube', async (req, res) => {
  try {
    const emotion = (req.query.emotion || '').toLowerCase();
    const userQuery = req.query.query;

    const emotionToQuery = {
      happy: 'happy upbeat pop song',
      sad: 'sad emotional chill song',
      angry: 'angry energetic rock song',
      surprised: 'surprising electronic upbeat song',
      fearful: 'dark ambient instrumental',
      disgusted: 'experimental electronic song',
      neutral: 'chill lo-fi instrumental'
    };

    const query = userQuery || emotionToQuery[emotion] || 'chill instrumental music';

    // Try YouTube Music API first
    try {
      const { YTMusic } = await import('ytmusic-api');
      const ytm = new YTMusic();
      await ytm.initialize();

      let results = await ytm.search(query, 'songs');
      if (!Array.isArray(results) || results.length === 0) {
        results = await ytm.search(query, 'videos');
      }

      if (Array.isArray(results) && results.length > 0) {
        const first = results[0];
        const videoId = first.videoId;
        const title = first.name || first.title || 'Unknown Title';
        const artist = (first.artists && first.artists[0] && first.artists[0].name) || first.artist || 'Unknown Artist';
        if (videoId) {
          return res.json({ videoId, title, artist, url: `https://www.youtube.com/watch?v=${videoId}` });
        }
      }
    } catch (e) {
      console.warn('YTMusic search failed, falling back to yt-search:', e && e.message ? e.message : e);
    }

    // Fallback: general YouTube search via yt-search
    try {
      const yts = require('yt-search');
      const r = await yts(query);
      const videos = (r && r.videos) || [];
      if (videos.length === 0) {
        return res.status(404).json({ error: 'No YouTube results found' });
      }
      const best = videos[0];
      return res.json({
        videoId: best.videoId,
        title: best.title,
        artist: best.author && best.author.name ? best.author.name : 'YouTube',
        url: best.url
      });
    } catch (e2) {
      console.error('yt-search fallback failed:', e2);
      return res.status(500).json({ error: 'Failed to fetch from YouTube', details: String(e2 && e2.message || e2) });
    }
  } catch (err) {
    console.error('YouTube API error:', err);
    return res.status(500).json({ error: 'Failed to fetch from YouTube', details: String(err && err.message || err) });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('MoodTune Scanner is ready to use!');
  console.log('Open your browser and navigate to http://localhost:3000 to start scanning your mood!');
});
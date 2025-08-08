const { YTMusic } = require('ytmusic-api');
const yts = require('yt-search');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const emotion = (event.queryStringParameters?.emotion || '').toLowerCase();
    const userQuery = event.queryStringParameters?.query;

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
          return {
            statusCode: 200,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoId, title, artist, url: `https://www.youtube.com/watch?v=${videoId}` })
          };
        }
      }
    } catch (e) {
      console.warn('YTMusic search failed, falling back to yt-search:', e && e.message ? e.message : e);
    }

    // Fallback: general YouTube search via yt-search
    try {
      const r = await yts(query);
      const videos = (r && r.videos) || [];
      if (videos.length === 0) {
        return {
          statusCode: 404,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'No YouTube results found' })
        };
      }
      const best = videos[0];
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId: best.videoId,
          title: best.title,
          artist: best.author && best.author.name ? best.author.name : 'YouTube',
          url: best.url
        })
      };
    } catch (e2) {
      console.error('yt-search fallback failed:', e2);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to fetch from YouTube', 
          details: String(e2 && e2.message || e2) 
        })
      };
    }
  } catch (err) {
    console.error('YouTube API error:', err);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch from YouTube', 
        details: String(err && err.message || err) 
      })
    };
  }
};

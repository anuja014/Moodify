# 🚀 Netlify Deployment Guide

This guide will help you deploy your MoodTune Scanner to Netlify.

## 📋 Prerequisites

1. **GitHub Account**: Make sure your code is pushed to a GitHub repository
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **Node.js**: Version 18 or higher (for local testing)

## 🛠️ Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Test the build**:
   ```bash
   npm run build
   ```

3. **Test locally** (optional):
   ```bash
   npm start
   ```

## 🌐 Deploy to Netlify

### Method 1: Deploy from Git (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `.` (root directory)
   - Click "Deploy site"

### Method 2: Manual Deploy

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Drag and drop**:
   - Go to [app.netlify.com](https://app.netlify.com)
   - Drag your project folder to the deploy area
   - Wait for deployment to complete

## ⚙️ Configuration

### Environment Variables (Optional)

You can set these in Netlify's site settings:

- `NODE_VERSION`: `18` (default)
- `NPM_FLAGS`: `--legacy-peer-deps` (if needed)

### Custom Domain (Optional)

1. Go to your site's settings in Netlify
2. Click "Domain management"
3. Add your custom domain
4. Follow the DNS configuration instructions

## 🔧 Troubleshooting

### Common Issues

1. **Build fails**:
   - Check that all files are committed to Git
   - Ensure `netlify.toml` is in the root directory
   - Verify all dependencies are in `package.json`

2. **Functions not working**:
   - Check the Netlify Functions tab in your site dashboard
   - Ensure `netlify/functions/package.json` exists
   - Verify the function path in `netlify.toml`

3. **Face detection not working**:
   - Ensure all model files are in the `models/` directory
   - Check browser console for errors
   - Verify camera permissions are granted

### Debug Steps

1. **Check build logs**:
   - Go to your site's "Deploys" tab
   - Click on the latest deploy
   - Check the build log for errors

2. **Test functions locally**:
   ```bash
   npx netlify-cli dev
   ```

3. **Check browser console**:
   - Open your deployed site
   - Open browser developer tools
   - Check for JavaScript errors

## 📁 File Structure

```
your-project/
├── index.html              # Main HTML file
├── script.js               # Main JavaScript
├── style.css               # Styles
├── package.json            # Dependencies
├── netlify.toml           # Netlify config
├── build.js               # Build script
├── models/                # AI models
│   ├── face_expression_model-weights_manifest.json
│   ├── face_landmark_68_model-weights_manifest.json
│   └── ssd_mobilenetv1_model-weights_manifest.json
└── netlify/
    └── functions/
        ├── api.js         # YouTube API function
        └── package.json   # Function dependencies
```

## 🎯 Features After Deployment

- ✅ Real-time face detection
- ✅ Emotion analysis
- ✅ YouTube music integration
- ✅ Responsive design
- ✅ Progressive web app features
- ✅ HTTPS enabled
- ✅ Global CDN

## 🔗 Your Live Site

Once deployed, your site will be available at:
`https://your-site-name.netlify.app`

## 📞 Support

If you encounter issues:

1. Check the [Netlify documentation](https://docs.netlify.com)
2. Review the build logs in your Netlify dashboard
3. Check browser console for JavaScript errors
4. Verify all files are properly committed to Git

---

**Happy Deploying! 🎉**

# 🚀 GitHub Pages Deployment Setup

This app is configured for automatic deployment to GitHub Pages. Every push to the `main` branch will trigger a new deployment.

## 📋 Setup Instructions

### 1. Enable GitHub Pages
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select **GitHub Actions**
4. The deployment workflow will automatically run on the next push

### 2. Repository Settings
- **Branch**: main
- **Deployment method**: GitHub Actions
- **Custom domain**: Optional (can be configured in Pages settings)

### 3. Automatic Deployment
The app will automatically deploy when you:
- Push commits to the `main` branch
- Merge pull requests into `main`
- Manually trigger the workflow from the Actions tab

## 🌐 Access Your App

After deployment, your app will be available at:
```
https://YOUR_USERNAME.github.io/leki/
```

## 🔧 Configuration Details

### Vite Configuration
- **Base path**: `/leki/` (for GitHub Pages)
- **Router**: Uses hash routing in production for GitHub Pages compatibility
- **PWA**: Configured with correct scope and start URL

### Build Process
1. **Install dependencies**: `npm ci`
2. **Build**: `npm run build`
3. **Deploy**: Automatic upload to GitHub Pages

## 📱 PWA Features
The app remains a full PWA with:
- Offline functionality
- Install prompts
- Service worker caching
- Mobile-responsive design

## 🔄 Manual Deployment
To manually trigger deployment:
1. Go to **Actions** tab in your repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" → "Run workflow"

## 🐛 Troubleshooting

### Common Issues:
- **404 errors**: Check that base path is `/leki/` in vite.config.js
- **Blank page**: Verify router is using hash history in production
- **Assets not loading**: Ensure `.nojekyll` file exists in public folder

### Debug Steps:
1. Check Actions tab for build errors
2. Verify GitHub Pages is enabled in repository settings
3. Confirm branch is set to `main`
4. Check browser console for any errors
# Event Matcher - Quick Start Guide

## 🚀 Get Started in 30 Seconds

### Option 1: Using the Start Script (Mac/Linux)
```bash
cd event-matcher
./start.sh
```
Then open: http://localhost:8080/public/

### Option 2: Using Python Directly
```bash
cd event-matcher
python3 server.py
# or
python server.py
```
Then open: http://localhost:8080/public/

### Option 3: Using Any Web Server
Serve the `event-matcher` directory with any local web server and navigate to `/public/index.html`

## 🎯 First Steps

1. **Sign In**: Click "Continue as Guest" to try the app immediately
2. **Set Preferences**: Fill out your interests (or click "Skip for now")
3. **Start Swiping**: 
   - Swipe/drag right = Like ❤️
   - Swipe/drag left = Pass ❌
   - Swipe/drag up = Super Like ⭐

## 📁 File Structure
```
event-matcher/
├── public/          # Main HTML file
├── src/             # JavaScript modules
├── styles/          # CSS files
├── server.py        # Python server
└── start.sh         # Start script
```

## ⚙️ Google Sign-In (Optional)
To enable Google Sign-In, edit `src/config.js` and replace:
```javascript
googleClientId: 'YOUR_GOOGLE_CLIENT_ID_HERE'
```

## 🎨 Features
- Tinder-like swipe interface
- Smart event matching based on preferences
- Local data storage (no server needed)
- Works on mobile and desktop

Enjoy discovering your perfect events! 🎉 
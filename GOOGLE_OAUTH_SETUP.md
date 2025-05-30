# Google OAuth Setup Guide for Event Matcher

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Event Matcher")
4. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Enable APIs and Services"
2. Search for "Google Identity" or "Google+ API"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: Event Matcher
     - User support email: your email
     - Developer contact: your email
   - Save and continue through the scopes (you can skip optional fields)
   - Add test users if needed
   - Back to credentials

4. For OAuth client ID:
   - Application type: **Web application**
   - Name: Event Matcher Web Client
   - Authorized JavaScript origins, add:
     - `http://localhost:8080`
     - `http://localhost:8000`
     - `http://127.0.0.1:8080`
     - `http://127.0.0.1:8000`
   - Leave Authorized redirect URIs empty (not needed for this implementation)
   - Click "Create"

5. Copy your **Client ID** (looks like: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`)

## Step 4: Update Your Application

1. Open `event-matcher/src/config.js`
2. Replace the placeholder with your actual Client ID:

```javascript
// Change this line:
googleClientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID

// To this (with your actual client ID):
googleClientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
```

3. Save the file

## Step 5: Test the Integration

1. Restart your server (Ctrl+C and run `./start.sh` again)
2. Clear your browser cache or open an incognito window
3. Navigate to http://localhost:8080/public/
4. Try signing in with Google

## Common Issues and Solutions

### "The OAuth client was not found"
- Make sure you've saved the correct Client ID in config.js
- Verify the Client ID doesn't have extra spaces or quotes

### "Localhost is not authorized"
- Add all localhost variations to Authorized JavaScript origins
- Make sure you're accessing the app via http://localhost:8080/public/ (not file://)

### "Invalid origin"
- The domain you're accessing from must match one in your Authorized JavaScript origins
- Add the exact URL you're using to the authorized origins list

### Development vs Production
For production deployment, you'll need to:
1. Add your production domain to Authorized JavaScript origins
2. Update the consent screen with production information
3. Possibly verify your domain ownership

## Alternative: Disable Google Sign-In

If you don't need Google Sign-In, you can hide the Google button by editing `event-matcher/public/index.html` and commenting out or removing the Google Sign-In elements (lines 48-65). 
# Event Matcher

A Tinder-like web app for discovering events with smart matching based on your preferences.

## ✨ Features

- **Swipe Interface**: Tinder-style swipe gestures (right = like, left = pass, up = super-like)
- **Smart Matching**: AI-powered recommendations based on occupation, interests, location
- **Auth0 Integration**: Secure authentication with Auth0
- **Live Event Data**: Fetch events from Apify API with local fallback
- **Match Explanations**: Visual indicators showing why events match your preferences
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### 1. Setup

```bash
# Clone the repository
cd event-matcher

# Copy configuration template
cp src/config.example.js src/config.js

# Start the server
./start.sh
```

Open: `http://localhost:8080/public/`

### 2. Configuration

Edit `src/config.js` with your credentials:

```javascript
// Apify API (for live event data)
apify: {
    apiToken: 'YOUR_APIFY_API_TOKEN',
    runId: 'YOUR_RUN_ID', 
    actorId: 'YOUR_ACTOR_ID'
}

// Auth0 (for authentication)
auth0: {
    domain: 'your-tenant.auth0.com',
    clientId: 'YOUR_AUTH0_CLIENT_ID'
}
```

**🔒 Security**: Never commit `src/config.js` - it's already in `.gitignore`

## 📖 Usage

1. **Sign In**: Use Auth0 or continue as guest
2. **Set Preferences**: Add your occupation, interests, location, event format preference
3. **Start Swiping**: Get personalized event recommendations
4. **View Matches**: Check your liked events in the matches section

## 🎯 Matching Algorithm

Events are scored based on:
- **Occupation** (20%): Professional relevance
- **Interests** (40%): Personal interests alignment  
- **Location** (20%): Geographic preference
- **Format** (20%): In-person vs virtual preference

## 🔧 Data Sources

**Apify API** (Recommended): Live event data with automatic caching
**Local JSON**: Place event files in `input/` directory for development

## 🛠️ Tech Stack

- Vanilla JavaScript (ES6 modules)
- Auth0 for authentication
- Apify API for event data
- Local storage for user data
- Python HTTP server

## 📱 Browser Support

Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## 🔒 Privacy

- Data stored locally in browser
- No user data sent to external servers
- Auth0 handles authentication securely
- 30-day cookie expiry

## 📝 Event Data Format

```json
[
  {
    "api_id": "unique-id",
    "event": {
      "name": "Event Name",
      "cover_url": "https://example.com/image.jpg",
      "start_at": "2025-05-30T16:30:00.000Z",
      "location_type": "offline",
      "geo_address_info": {
        "city_state": "San Francisco, CA"
      }
    },
    "calendar": {
      "name": "Organizer",
      "description_short": "Event description"
    }
  }
]
```

## 🐛 Troubleshooting

**Can't load events**: Ensure you're running a local web server and check JSON file path
**Auth0 issues**: Verify domain/clientId in config and callback URLs in Auth0 dashboard  
**Swipe not working**: Enable JavaScript and check browser console for errors

## 📄 License

MIT License 
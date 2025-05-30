# Event Matcher - Tinder for Events

A modern web application that helps users discover and match with events based on their preferences. Features a Tinder-like swipe interface for event discovery, Auth0 authentication integration, smart event recommendations with match explanations, and a beautiful modern UI.

## ✨ New Features

- **Auth0 Authentication**: Secure authentication with Auth0's Universal Login
- **Match Explanations**: See why events were recommended for you
- **Modern UI**: Beautiful glassmorphism design with gradient backgrounds
- **Match Counter**: Track your matches with a live counter badge
- **Enhanced Visuals**: Improved cards with match scores and reason badges

## Features

- **Tinder-like Swipe Interface**: Swipe right to like, left to pass, or up to super-like events
- **Auth0 Integration**: Sign in with Auth0 for secure authentication ([Auth0.com](https://auth0.com/ai/docs))
- **Apify API Integration**: Fetch live event data directly from your Apify actor runs
- **Guest Mode**: Try the app without creating an account
- **Smart Matching Algorithm**: Events are ranked based on your occupation, interests, location, and preferences
- **Match Reasons**: Visual indicators showing why each event matches your preferences
- **User Preferences**: Customize your experience with detailed preference settings
- **Local Storage & Cookies**: Your data is saved locally so you can come back anytime
- **Responsive Design**: Works beautifully on desktop and mobile devices
- **Match History**: Keep track of all the events you've liked with a match counter
- **Offline Support**: Events are cached locally for offline access

## Setup Instructions

### 1. Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (due to CORS restrictions for loading JSON files)
- Auth0 account (free tier available at [Auth0.com](https://auth0.com)) - optional
- Apify account for live data ([Apify.com](https://apify.com)) - optional

### 2. Quick Start

1. Clone or download this project
2. Configure your data source (see Apify Setup or use local JSON)
3. Serve the application using a local web server:

   **Using the provided script:**
   ```bash
   cd event-matcher
   ./start.sh
   ```

   **Or using Python directly:**
   ```bash
   cd event-matcher
   python3 server.py
   ```

4. Open your browser and navigate to: `http://localhost:8080/public/`

### 3. Apify API Setup (Recommended for Live Data)

To fetch live event data from Apify:

1. Get your Apify API token from your [Apify account settings](https://console.apify.com/account/integrations)
2. Get your Actor ID or Run ID from the Apify console
3. Update `src/config.js`:
   ```javascript
   apify: {
       apiToken: 'apify_api_YOUR_TOKEN_HERE',
       runId: 'YOUR_RUN_ID', // For specific run
       // OR
       actorId: 'username/actor-name', // For latest run
       baseUrl: 'https://api.apify.com/v2',
       useLocalFallback: true // Fallback to local file if API fails
   }
   ```

**Important Security Note**: Never commit your API token to version control! The `src/config.js` file is already in `.gitignore`.

### 4. Auth0 Setup

To enable Auth0 authentication:

1. Create an Auth0 account at [Auth0.com](https://auth0.com)
2. Follow the setup guide in `AUTH0_SETUP.md`
3. Update `src/config.js`:
   ```javascript
   auth0: {
       domain: 'your-tenant.auth0.com',
       clientId: 'your-auth0-client-id',
       // ... other settings
   }
   ```

### 4. Environment Configuration

The application uses a configuration file for settings. Edit `src/config.js` to customize:

- `auth0.domain`: Your Auth0 domain
- `auth0.clientId`: Your Auth0 client ID
- `cookieExpiry`: How long to remember user data (in days)
- `matchingWeights`: Adjust the importance of different matching criteria
- `ui.swipeThreshold`: Sensitivity of swipe gestures

## Data Sources

The application supports multiple data sources:

### 1. Apify API (Recommended)
- **Live Data**: Fetches the latest events directly from your Apify actor runs
- **Specific Run**: Use a run ID to fetch data from a specific run
- **Latest Run**: Use actor ID to automatically fetch the latest successful run
- **Caching**: Data is cached locally for 24 hours for offline access
- **Fallback**: Automatically falls back to local JSON if API fails

### 2. Local JSON File
- Place your event data in `input/` directory
- Format should match the Luma scraper output
- Good for development and testing

### 3. Cached Data
- Previously fetched Apify data is cached in localStorage
- Cache expires after 24 hours
- Provides offline functionality

## API Integration Details

### Apify Endpoints Used

The app uses the following [Apify API endpoints](https://docs.apify.com/api/v2):

1. **Specific Run Dataset**: 
   ```
   GET /v2/actor-runs/{runId}/dataset/items
   ```

2. **Latest Actor Run Dataset**: 
   ```
   GET /v2/acts/{actorId}/runs/last/dataset/items?status=SUCCEEDED
   ```

### Error Handling

- **Invalid Token**: Shows error notification and falls back to local data
- **Network Issues**: Attempts to load cached data, then local file
- **Expired Run**: Automatically handled with user notification
- **Rate Limits**: Implements caching to reduce API calls

### Performance

- Events are loaded once at startup
- Data is cached for offline use
- Loading indicator shows during API fetch
- Smooth fallback to local data if needed

## Usage Guide

### First Time Use

1. **Sign In**: Choose to sign in with Auth0 or continue as a guest
2. **Set Preferences**: Fill out your profile:
   - Name
   - Occupation
   - Interests (select multiple)
   - Event format preference (in-person, virtual, or both)
   - Location (for in-person events)
3. **Start Swiping**: The app will show you events based on your preferences

### Understanding Match Scores

Each event card shows:
- **Match Percentage**: How well the event matches your preferences (e.g., "85% Match")
- **Match Reasons**: Icons and labels explaining why the event was recommended:
  - 💼 Matches your profession
  - ❤️ Aligns with your interests
  - 📍 In your preferred location
  - 🖥️ Your preferred format

### Swiping Events

- **Swipe Right** or click ❤️: Like the event
- **Swipe Left** or click ❌: Pass on the event
- **Swipe Up** or click ⭐: Super-like the event
- **Drag & Hold**: See preview of your choice before releasing

### Navigation

- **Matches**: View all events you've liked (counter shows total matches)
- **Settings**: Update your preferences anytime
- **Logout**: Sign out and clear your data

## Event Data Format

The application expects event data in the following JSON format:

```json
[
  {
    "api_id": "unique-event-id",
    "event": {
      "name": "Event Name",
      "cover_url": "https://example.com/image.jpg",
      "start_at": "2025-05-30T16:30:00.000Z",
      "end_at": "2025-05-31T02:30:00.000Z",
      "location_type": "offline",
      "geo_address_info": {
        "city_state": "San Francisco, California"
      }
    },
    "calendar": {
      "name": "Organizer Name",
      "avatar_url": "https://example.com/avatar.jpg",
      "description_short": "Brief description of the event"
    }
  }
]
```

## Matching Algorithm

The app uses a weighted scoring system to rank events:

- **Occupation Match** (20%): Events related to your profession
- **Interest Match** (40%): Events matching your selected interests
- **Location Match** (20%): Events in your preferred location
- **Format Match** (20%): In-person vs virtual preference

## Privacy & Data Storage

- All data is stored locally in your browser
- Auth0 handles authentication securely
- No event data is sent to external servers
- Cookies expire after 30 days by default
- You can clear all data by logging out

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### "Failed to load events"
- Ensure you're running a local web server
- Check that the JSON file path is correct
- Verify the JSON file format

### Auth0 Sign-In not working
- Verify your Auth0 domain and client ID are correct
- Ensure your callback URLs are configured in Auth0 dashboard
- Check browser console for specific errors

### Cards not swiping
- Ensure JavaScript is enabled
- Try refreshing the page
- Check browser console for errors

## Development

The application is built with vanilla JavaScript modules for simplicity and performance:

- `config.js`: Application configuration
- `storage.js`: Local storage and cookie management
- `auth0.js`: Auth0 authentication integration
- `auth.js`: Authentication handling
- `events.js`: Event data management and matching algorithm
- `swipe.js`: Swipe interaction logic
- `app.js`: Main application orchestration

## Design Features

- **Glassmorphism**: Modern glass-like effects with backdrop blur
- **Gradient Backgrounds**: Beautiful purple to indigo gradients
- **Smooth Animations**: Polished transitions and hover effects
- **Match Badges**: Visual indicators for match scores and reasons
- **Responsive Cards**: Optimized for all screen sizes

## License

This project is open source and available under the MIT License. 
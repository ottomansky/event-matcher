// Example configuration file for Event Matcher
// Copy this file to src/config.js and update with your actual values

export const config = {
    // Google OAuth Configuration
    // Get your Client ID from https://console.cloud.google.com/
    googleClientId: 'YOUR_GOOGLE_CLIENT_ID_HERE',
    
    // Auth0 Configuration
    auth0: {
        domain: 'YOUR_AUTH0_DOMAIN', // e.g., 'your-tenant.auth0.com'
        clientId: 'YOUR_AUTH0_CLIENT_ID', // Replace with your Auth0 Client ID
        redirectUri: window.location.origin + '/public/index.html',
        audience: '', // Optional: Your API identifier if using Auth0 for API access
    },
    
    // Apify Configuration
    apify: {
        apiToken: 'YOUR_APIFY_API_TOKEN', // Get from your Apify account settings
        runId: 'YOUR_RUN_ID', // Specific run ID or leave empty for latest run
        actorId: 'YOUR_ACTOR_ID', // Your actor ID (e.g., 'username/actor-name')
        baseUrl: 'https://api.apify.com/v2',
        useLocalFallback: true // Fallback to local JSON if API fails
    },
    
    // App Settings
    appName: 'Event Matcher',
    cookieExpiry: 30, // days
    
    // Local Storage Keys (no need to change these)
    storageKeys: {
        user: 'eventMatcher_user',
        preferences: 'eventMatcher_preferences',
        matches: 'eventMatcher_matches',
        seenEvents: 'eventMatcher_seenEvents',
        authToken: 'eventMatcher_authToken'
    },
    
    // Event Matching Algorithm Weights
    // Adjust these to change how events are ranked
    matchingWeights: {
        occupation: 0.2,    // 20% weight for occupation match
        interests: 0.4,     // 40% weight for interest match
        location: 0.2,      // 20% weight for location match
        format: 0.2         // 20% weight for format preference
    },
    
    // Match reasons (for UI display)
    matchReasons: {
        occupation: { icon: '💼', label: 'Matches your profession' },
        interests: { icon: '❤️', label: 'Aligns with your interests' },
        location: { icon: '📍', label: 'In your preferred location' },
        format: { icon: '🖥️', label: 'Your preferred format' }
    },
    
    // API Settings (for future backend integration)
    api: {
        baseUrl: '/api',
        endpoints: {
            events: '/events',
            matches: '/matches',
            preferences: '/preferences'
        }
    },
    
    // UI Settings
    ui: {
        cardsToShow: 3,              // Number of cards in the stack
        swipeThreshold: 100,         // Pixels to trigger a swipe
        swipeVelocityThreshold: 0.5  // Velocity threshold for quick swipes
    }
};

// Google Sign-In callback handler
window.handleGoogleSignIn = function(response) {
    const credential = response.credential;
    const decodedToken = JSON.parse(atob(credential.split('.')[1]));
    
    const user = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        provider: 'google'
    };
    
    window.dispatchEvent(new CustomEvent('googleSignIn', { detail: user }));
}; 
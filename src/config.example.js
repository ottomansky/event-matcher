// Configuration settings for the Event Matcher app
// Copy this file to config.js and update with your actual values
export const config = {
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
        runId: 'WxgKyLhVQ4Y3qAr0D', // Specific run ID
        actorId: 'lexis-solutions/lu-ma-scraper', // Actor ID for latest runs
        baseUrl: 'https://api.apify.com/v2',
        useLocalFallback: true // Fallback to local JSON if API fails
    },
    
    // App Settings
    appName: 'Event Matcher',
    cookieExpiry: 30, // days
    
    // Local Storage Keys
    storageKeys: {
        user: 'eventMatcher_user',
        preferences: 'eventMatcher_preferences',
        matches: 'eventMatcher_matches',
        seenEvents: 'eventMatcher_seenEvents',
        authToken: 'eventMatcher_authToken'
    },
    
    // Event Matching Algorithm Weights
    matchingWeights: {
        occupation: 0.2,
        interests: 0.4,
        location: 0.2,
        format: 0.2
    },
    
    // Match reasons (for UI display)
    matchReasons: {
        occupation: { icon: '💼', label: 'Matches your profession' },
        interests: { icon: '❤️', label: 'Aligns with your interests' },
        location: { icon: '📍', label: 'In your preferred location' },
        format: { icon: '🖥️', label: 'Your preferred format' }
    },
    
    // API Settings (for future use)
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
        cardsToShow: 3,
        swipeThreshold: 100, // pixels
        swipeVelocityThreshold: 0.5
    }
};

// Initialize Google Sign-In
window.handleGoogleSignIn = function(response) {
    // This will be called by Google OAuth
    const credential = response.credential;
    const decodedToken = JSON.parse(atob(credential.split('.')[1]));
    
    const user = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        provider: 'google'
    };
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('googleSignIn', { detail: user }));
}; 
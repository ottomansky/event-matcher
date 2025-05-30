# Auth0 for GenAI Setup Guide

## Overview

Event Matcher now supports advanced Auth0 for GenAI features to provide AI-enhanced event recommendations. This guide will help you set up and configure these features.

## Features

### 🤖 AI-Powered Recommendations
- Calendar availability checking
- Social connections analysis
- Personalized event scoring
- Trending event detection

### 🔐 Enhanced Security
- Token vault for secure API access
- Fine-grained authorization (FGA)
- Asynchronous authorization (CIBA)
- Multi-service OAuth integration

### 🔗 Service Integrations
- Google Calendar
- GitHub
- Slack
- More coming soon!

## Setup Instructions

### 1. Enable Auth0 for GenAI

1. Log in to your Auth0 Dashboard
2. Navigate to Applications → Your App → Settings
3. Update the following settings:
   ```
   Application Type: Single Page Application
   Token Endpoint Authentication Method: None
   Allowed Callback URLs: http://localhost:8080/public/index.html
   Allowed Web Origins: http://localhost:8080
   ```

### 2. Configure API Permissions

1. Go to APIs → Create API
2. Create a new API for your application:
   ```
   Name: Event Matcher API
   Identifier: https://your-domain/api
   Signing Algorithm: RS256
   ```

3. Add the following scopes:
   - `read:events`
   - `write:preferences`
   - `read:calendar`
   - `read:social`

### 3. Set Up Social Connections

#### Google (for Calendar integration)
1. Go to Authentication → Social
2. Click on Google
3. Add your Google OAuth credentials
4. Request these scopes:
   ```
   - https://www.googleapis.com/auth/calendar.events.readonly
   - https://www.googleapis.com/auth/userinfo.profile
   - https://www.googleapis.com/auth/userinfo.email
   ```

#### GitHub
1. Enable GitHub connection
2. Add your GitHub OAuth App credentials
3. Request scopes: `user`, `repo`

#### Slack
1. Enable Slack connection
2. Add your Slack App credentials
3. Request scopes: `channels:read`, `users:read`

### 4. Configure Rules for AI Features

Create a new Rule in Auth0:

```javascript
function addAIMetadata(user, context, callback) {
  // Add AI preferences to user metadata
  user.app_metadata = user.app_metadata || {};
  user.app_metadata.ai_preferences = user.app_metadata.ai_preferences || {
    allowAIRecommendations: true,
    privacyLevel: 'balanced'
  };
  
  // Add permissions for AI features
  context.idToken['https://eventmatcher/permissions'] = [
    'read:events',
    'access:ai_recommendations'
  ];
  
  callback(null, user, context);
}
```

### 5. Update Your Configuration

In your `config.js` file, update:

```javascript
auth0: {
    domain: 'your-tenant.auth0.com',
    clientId: 'your-client-id',
    redirectUri: window.location.origin + '/public/index.html',
    audience: 'https://your-domain/api', // Your API identifier
    scope: 'openid profile email offline_access'
}
```

## Using AI Features

### 1. Enable AI Recommendations

Once logged in, users will see an "AI Enhanced" indicator if AI features are available. Click the settings icon to:
- Enable/disable AI recommendations
- Connect external services
- Adjust privacy settings

### 2. Connect Google Calendar

1. Click "Connect Google Calendar" in AI Settings
2. Authorize access to your calendar
3. Event Matcher will now check your availability when recommending events

### 3. Privacy Levels

- **Strict**: Minimal data sharing, basic recommendations only
- **Balanced**: Recommended setting, good privacy with enhanced features
- **Open**: Maximum personalization, full data utilization

## Troubleshooting

### "Auth0 not configured" error
- Ensure your Auth0 credentials are correctly set in `config.js`
- Check that your Auth0 application type is "Single Page Application"

### Calendar connection fails
- Verify Google OAuth is properly configured in Auth0
- Check that calendar scopes are requested
- Ensure popup blockers are disabled

### AI recommendations not showing
- Check that AI preferences are enabled
- Verify that events have been loaded from Apify
- Look for console errors related to AI initialization

## Security Best Practices

1. **Token Storage**: Tokens are stored in memory, not localStorage
2. **Scope Limitation**: Only request necessary scopes
3. **Regular Token Refresh**: Tokens are automatically refreshed every 5 minutes
4. **Audit Logging**: All permission checks are logged for security auditing

## Advanced Features

### Asynchronous Authorization

For sensitive actions, the app can request async authorization:

```javascript
const requestId = await auth0GenAI.requestAsyncAuthorization('delete_all_data', {
    reason: 'User requested data deletion'
});
```

### Fine-Grained Authorization

Check specific permissions for resources:

```javascript
const canAccess = await auth0GenAI.checkRAGAccess('events:premium', 'read');
```

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Verify all Auth0 settings match this guide
3. Ensure you're using the latest version of the Auth0 SDK

Happy event matching with AI! 🎉 
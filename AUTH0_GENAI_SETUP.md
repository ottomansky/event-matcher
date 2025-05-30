# 🤖 Auth0 for GenAI Setup Guide

This guide will help you set up Auth0 for GenAI features in the Event Matcher application.

## 📋 Prerequisites

1. **Auth0 Account**: You need an Auth0 account
2. **Developer Preview Access**: Auth0 for GenAI is currently in Developer Preview
3. **Modern Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## 🚀 Quick Setup

### Step 1: Join Auth0 GenAI Developer Preview

1. Visit [Auth0 for GenAI](https://auth0.com/ai/docs)
2. Click **"Join Developer Preview Program"**
3. Fill out the form with your use case details
4. Wait for approval (usually within 24-48 hours)

### Step 2: Create GenAI-Enabled Tenant

Once approved for the preview:

1. Go to [Auth0 Dashboard](https://manage.auth0.com/dashboard)
2. Create a new tenant or use existing
3. Ensure your tenant has GenAI features enabled
4. Note your tenant domain (should be like `your-tenant.auth0.com` or `your-tenant.eu.auth0.com`)

### Step 3: Create Application

1. In Auth0 Dashboard, go to **Applications**
2. Click **"Create Application"**
3. Choose **"Single Page Application"**
4. Name it "Event Matcher GenAI"

### Step 4: Configure Application Settings

**Application URIs:**
```
Allowed Callback URLs:
http://localhost:8080/public/index.html,
https://your-domain.com/public/index.html

Allowed Logout URLs:
http://localhost:8080/public/index.html,
https://your-domain.com/public/index.html

Allowed Web Origins:
http://localhost:8080,
https://your-domain.com

Allowed Origins (CORS):
http://localhost:8080,
https://your-domain.com
```

**Advanced Settings:**
- OAuth → Grant Types: Check "Authorization Code", "Refresh Token"
- OAuth → OIDC Conformant: Enabled

### Step 5: Configure GenAI Features

In your Auth0 Dashboard:

1. Go to **APIs** → Create API (if not exists)
2. Set identifier: `https://your-tenant.auth0.com/api/v2/`
3. Enable **Offline Access** for refresh tokens

**Scopes for GenAI:**
```
openid profile email offline_access
read:current_user
update:current_user_metadata
```

### Step 6: Update Configuration

Edit `src/config.js`:

```javascript
auth0: {
    domain: 'your-genai-tenant.auth0.com',     // Your GenAI tenant domain
    clientId: 'YOUR_CLIENT_ID',                 // From application settings
    redirectUri: window.location.origin + '/public/index.html',
    audience: 'https://your-tenant.auth0.com/api/v2/', // Your API identifier
}
```

## 🔧 Advanced GenAI Features

### External Service Connections

Auth0 for GenAI supports connecting to external services:

1. **Google Calendar** - For availability checking
2. **Slack** - For workspace integration  
3. **GitHub** - For repository access

To enable these:

1. Go to **Connections** → **Social**
2. Enable and configure each service
3. Set appropriate scopes:
   - Google: `https://www.googleapis.com/auth/calendar.readonly`
   - GitHub: `repo`, `user`
   - Slack: `channels:read`, `chat:write`

### Asynchronous Authorization (CIBA)

For advanced workflows requiring human-in-the-loop approval:

1. Enable **Client-Initiated Backchannel Authentication**
2. Configure webhook endpoints for notifications
3. Set up email/SMS providers for approval requests

### Fine-Grained Authorization (FGA)

For document-level access control in RAG applications:

1. Set up **Auth0 FGA** (Fine-Grained Authorization)
2. Define relationship models
3. Configure document-level permissions

## 🐛 Troubleshooting

### Common Issues

**❌ "GenAI features not available"**
- Solution: Ensure you're enrolled in Developer Preview
- Check tenant has GenAI capabilities enabled

**❌ "Unauthorized" errors**
- Solution: Verify API audience configuration
- Check scopes are properly set

**❌ "Domain configuration issue"**
- Solution: Ensure using GenAI-enabled tenant
- Check domain format: `tenant.auth0.com` or `tenant.eu.auth0.com`

**❌ "Popup blocked" errors**
- Solution: Allow popups for your domain
- Try redirect flow as alternative

### Debug Mode

Open browser console and look for:
```
🤖 Initializing Auth0 for GenAI with domain: your-tenant.auth0.com
🧪 GenAI capabilities test passed
✅ Auth0 for GenAI initialized successfully
```

If you see warnings about fallback to standard Auth0, check your GenAI configuration.

## 📚 Resources

- [Auth0 for GenAI Documentation](https://auth0.com/ai/docs)
- [Developer Preview Program](https://auth0.com/ai/docs#developer-preview-program)
- [Auth0 SPA SDK Documentation](https://auth0.com/docs/libraries/auth0-spa-js)
- [CIBA Protocol Guide](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-initiated-backchannel-authentication-flow)

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review browser console for detailed error messages
3. Verify your Developer Preview enrollment status
4. Contact Auth0 support for GenAI-specific issues

## 🔒 Security Best Practices

1. **Never commit** `src/config.js` with real credentials
2. Use **HTTPS** in production
3. Implement proper **CORS** policies
4. Enable **refresh token rotation**
5. Set appropriate **token expiration** times
6. Monitor for **suspicious activities**

---

**⚡ Need immediate testing?** The app will automatically fall back to standard Auth0 if GenAI features aren't available, so you can start developing right away! 
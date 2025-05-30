# 🔒 Auth0 Troubleshooting Guide

## Access Denied Error Fix

If you're getting **"Access denied. Please check your permissions."** after login, follow these solutions:

## 🎯 Quick Fix (90% of cases)

### 1. Check Auth0 Application Grant Types

In your Auth0 Dashboard:
1. Go to **Applications** → **Your Application** → **Settings**
2. Scroll to **Advanced Settings** → **Grant Types**
3. **ENSURE THESE ARE CHECKED:**
   - ✅ **Authorization Code**
   - ✅ **Refresh Token**
   - ✅ **Implicit** (needed for popup login)

### 2. Verify Application URLs

**Exact URLs to use:**
```
Allowed Callback URLs:
http://localhost:8080/public/index.html

Allowed Logout URLs:
http://localhost:8080/public/index.html

Allowed Web Origins:
http://localhost:8080

Allowed Origins (CORS):
http://localhost:8080
```

⚠️ **Important:** No trailing slashes, exact format matters!

### 3. Check OIDC Settings

In **Advanced Settings** → **OAuth**:
- ✅ **OIDC Conformant**: Enabled
- **JsonWebToken Signature Algorithm**: RS256

## 🔧 Configuration Fixes

### Option A: Basic Authentication (Recommended)

In `src/config.js`, set audience to `undefined`:

```javascript
auth0: {
    domain: 'your-tenant.auth0.com',
    clientId: 'your-client-id',
    redirectUri: window.location.origin + '/public/index.html',
    audience: undefined, // ← This fixes most issues
}
```

### Option B: API Authentication (Advanced)

If you need API access:

1. **Create API in Auth0:**
   - Go to **APIs** → **Create API**
   - Set identifier: `https://your-tenant.auth0.com/api/v2/`
   - Enable **Allow Offline Access**

2. **Update config:**
```javascript
auth0: {
    domain: 'your-tenant.auth0.com',
    clientId: 'your-client-id',
    redirectUri: window.location.origin + '/public/index.html',
    audience: 'https://your-tenant.auth0.com/api/v2/',
}
```

## 🛠️ Step-by-Step Debug

### 1. Clear Browser Data
```bash
# Clear everything and try again
1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Refresh page
4. Try login again
```

### 2. Check Browser Console
Look for these error patterns:

**❌ "Invalid state"**
- Solution: Clear localStorage and cookies

**❌ "Unauthorized client"**
- Solution: Check Grant Types in Auth0

**❌ "Access denied"**
- Solution: Remove audience or check API configuration

**❌ "Invalid redirect_uri"**
- Solution: Check callback URLs exactly match

### 3. Test Different Approaches

**A. Test with Guest Login First:**
```javascript
// Verify app works without Auth0
// Click "Continue as Guest"
```

**B. Test Auth0 Configuration:**
```javascript
// In browser console:
console.log(config.auth0);
// Should show your actual domain/clientId
```

**C. Test Basic Auth0:**
```javascript
// Temporarily set audience to undefined
auth0: { audience: undefined }
```

## 🔍 Common Error Patterns

### Pattern 1: Domain Issues
```
Error: "tenant_not_found" or "Invalid domain"
```
**Fix:** Check domain format:
- ✅ `your-tenant.auth0.com`
- ✅ `your-tenant.eu.auth0.com` (EU region)
- ❌ `your-tenant.auth0.com/` (no trailing slash)

### Pattern 2: Client ID Issues
```
Error: "client_not_found" or "Unauthorized client"
```
**Fix:** 
- Copy Client ID exactly from Auth0 dashboard
- Check for extra spaces or characters

### Pattern 3: Audience Issues
```
Error: "access_denied" or "Invalid audience"
```
**Fix:** 
- Set audience to `undefined` for basic auth
- Or create proper API in Auth0 dashboard

### Pattern 4: Popup Blocked
```
Error: "popup_closed_by_user" or popup doesn't open
```
**Fix:**
- Allow popups for localhost in browser
- Or use redirect flow instead

## 🚀 Quick Test Commands

### Test 1: Manual Auth0 Test
```javascript
// In browser console after page loads:
auth0.loginWithPopup().then(user => console.log('Success:', user))
```

### Test 2: Configuration Check
```javascript
// Check if Auth0 is properly initialized:
console.log('Auth0 initialized:', auth0.isInitialized);
console.log('Config:', config.auth0);
```

### Test 3: Token Check
```javascript
// After successful login:
auth0.client.getTokenSilently().then(token => console.log('Token:', token));
```

## 📋 Auth0 Dashboard Checklist

Before testing, verify these settings:

**Application Settings:**
- [ ] Application Type: Single Page Application
- [ ] Domain: Correct format
- [ ] Client ID: Copied exactly
- [ ] Callback URLs: Exact match with localhost
- [ ] Web Origins: Exact match with localhost

**Grant Types:**
- [ ] Authorization Code ✅
- [ ] Refresh Token ✅
- [ ] Implicit ✅

**Advanced Settings:**
- [ ] OIDC Conformant: Enabled
- [ ] JWT Signature: RS256

**API (if using audience):**
- [ ] API created with correct identifier
- [ ] Offline Access enabled
- [ ] Scopes configured

## 🔄 Reset Instructions

If nothing works, try a complete reset:

### 1. Auth0 Reset
1. Create a new Application in Auth0
2. Use basic SPA settings
3. Don't set audience initially
4. Test with new Client ID

### 2. Browser Reset
```bash
# Clear everything
rm -rf ~/.config/google-chrome/Default/Local\ Storage/
# Or use browser settings to clear all data
```

### 3. Config Reset
```javascript
// Use minimal config:
auth0: {
    domain: 'your-new-tenant.auth0.com',
    clientId: 'new-client-id',
    redirectUri: window.location.origin + '/public/index.html',
    audience: undefined, // Start without this
}
```

## 🆘 Still Not Working?

1. **Check Auth0 Status:** [status.auth0.com](https://status.auth0.com)
2. **Enable Debug Mode:** Add `?debug=true` to URL
3. **Check Network Tab:** Look for 4xx/5xx errors
4. **Test Different Browser:** Try incognito mode
5. **Contact Support:** With error logs and config (remove secrets)

## 🔒 Security Notes

- Never commit real credentials to git
- Use environment variables in production
- Enable MFA for Auth0 dashboard
- Monitor Auth0 logs for unusual activity
- Rotate secrets regularly

---

**✅ Most issues are resolved by setting `audience: undefined` and checking Grant Types in Auth0 dashboard.** 
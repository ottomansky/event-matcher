# Auth0 Setup Guide for Event Matcher

## Step 1: Create an Auth0 Account

1. Go to [Auth0.com](https://auth0.com/)
2. Click "Sign up" and create a free account
3. Choose your region (closest to your users)

## Step 2: Create a New Application

1. In the Auth0 Dashboard, navigate to "Applications"
2. Click "Create Application"
3. Name it "Event Matcher"
4. Choose "Single Page Web Applications"
5. Click "Create"

## Step 3: Configure Application Settings

1. In your application settings, configure:
   - **Allowed Callback URLs**: 
     ```
     http://localhost:8080/public/index.html,
     http://localhost:8000/public/index.html,
     http://127.0.0.1:8080/public/index.html
     ```
   - **Allowed Logout URLs**: 
     ```
     http://localhost:8080/public/index.html,
     http://localhost:8000/public/index.html,
     http://127.0.0.1:8080/public/index.html
     ```
   - **Allowed Web Origins**: 
     ```
     http://localhost:8080,
     http://localhost:8000,
     http://127.0.0.1:8080
     ```

2. Save the changes

## Step 4: Note Your Credentials

From the application settings, copy:
- **Domain**: (e.g., `your-tenant.auth0.com`)
- **Client ID**: (e.g., `AbCdEfGhIjKlMnOpQrStUvWxYz123456`)

## Step 5: Enable Social Connections (Optional)

1. Go to "Authentication" → "Social"
2. Enable providers you want:
   - Google
   - GitHub
   - Twitter/X
   - Facebook
3. Configure each provider with their respective API credentials

## Step 6: Customize Login Page (Optional)

1. Go to "Branding" → "Universal Login"
2. Customize colors, logo, and text to match Event Matcher brand

## Production Deployment

For production, add your production URLs to all the URL fields mentioned above. 
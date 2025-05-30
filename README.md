# 🎯 Event Matcher

A sophisticated Tinder-like web application for discovering and matching with events tailored to your interests, powered by AI-driven recommendations and secure authentication.

![Event Matcher Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![Auth0](https://img.shields.io/badge/Auth0-Integrated-blue) ![Apify](https://img.shields.io/badge/Apify%20API-Connected-orange)

## ✨ Key Features

### 🎯 **Smart Matching Algorithm**
- **AI-Powered Recommendations**: Intelligent event scoring based on your profile
- **Multi-Factor Scoring**: Considers occupation (20%), interests (40%), location (20%), and format preference (20%)
- **Real-time Match Explanations**: Visual indicators showing why events match your preferences

### 💫 **Intuitive Swipe Interface**
- **Tinder-Style Gestures**: Swipe right (like), left (pass), or up (super-like)
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Smooth Animations**: Professional-grade UI with fluid transitions

### 🔐 **Secure Authentication**
- **Auth0 Integration**: Enterprise-grade authentication with popup login
- **Multiple Auth Options**: Auth0, Google OAuth, or guest mode
- **Enhanced Security**: Token-based authentication with refresh tokens

### 📊 **Advanced Analytics & Tracking**
- **Comprehensive Event Tracking**: Every interaction is logged via webhook integration
- **Match Analytics**: Track user preferences and behavior patterns
- **Data Export/Import**: Full user data management and backup capabilities

### 🌐 **Live Data Integration**
- **Apify API**: Real-time event data from Luma.co
- **Local Fallback**: Offline support with cached event data
- **Smart Caching**: Optimized data loading and refresh strategies

### 💾 **Data Management**
- **Local Storage**: All user data stored securely in browser
- **Data Portability**: Export and import user preferences and matches
- **Privacy-First**: No user data sent to external servers without consent

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Local web server (included Python server)
- Auth0 account (optional, for enhanced features)
- Apify account (optional, for live event data)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/ottomansky/event-matcher.git
cd event-matcher

# Copy configuration template
cp src/config.example.js src/config.js

# Start the development server
./start.sh
```

**🌐 Application URL**: `http://localhost:8080/public/`

### 2. Auth0 Setup (Recommended)

To enable secure authentication with enhanced features:

#### Step 1: Create Auth0 Application
1. Visit [Auth0 Dashboard](https://manage.auth0.com/dashboard)
2. Click **"Create Application"**
3. Choose **"Single Page Application"**
4. Note your `Domain` and `Client ID`

#### Step 2: Configure Application
**Allowed Callback URLs:**
```
http://localhost:8080/public/index.html,
https://your-domain.com/public/index.html
```

**Allowed Logout URLs:**
```
http://localhost:8080/public/index.html,
https://your-domain.com/public/index.html
```

**Allowed Web Origins:**
```
http://localhost:8080,
https://your-domain.com
```

#### Step 3: Update Configuration
Edit `src/config.js`:

```javascript
auth0: {
    domain: 'your-tenant.auth0.com',        // Your Auth0 domain
    clientId: 'YOUR_AUTH0_CLIENT_ID',       // Your Auth0 Client ID
    redirectUri: window.location.origin + '/public/index.html',
    audience: '',                           // Optional: API identifier
}
```

**🔒 Security Note**: Never commit `src/config.js` - it's already in `.gitignore`

### 3. Apify Setup (Optional)

For live event data from Luma.co:

1. Sign up at [Apify.com](https://apify.com)
2. Get your API token from Account Settings
3. Find relevant actor ID (e.g., `lexis-solutions/lu-ma-scraper`)
4. Update `src/config.js`:

```javascript
apify: {
    apiToken: 'apify_api_YOUR_TOKEN',
    runId: 'YOUR_RUN_ID',
    actorId: 'YOUR_ACTOR_ID',
    baseUrl: 'https://api.apify.com/v2',
    useLocalFallback: true
}
```

## 📖 How to Use

### 1. **Authentication**
- Click **"Sign in with Auth0"** for full features
- Or **"Continue as Guest"** for basic functionality

### 2. **Set Preferences**
- **Personal Info**: Name and occupation
- **Interests**: Select from technology, business, arts, networking, education, health
- **Location**: Geographic preference for in-person events
- **Format**: In-person, virtual, or both

### 3. **Start Swiping**
- **Right Swipe / ❤️**: Like the event (add to matches)
- **Left Swipe / ✖️**: Pass on the event
- **Up Swipe / ⭐**: Super-like (enhanced tracking)
- **Use Buttons**: Click action buttons if preferred

### 4. **Manage Matches**
- View all liked events in the **Matches** section
- Click events to visit their Luma pages
- Export your data for backup

## 🎯 Matching Algorithm Details

Our sophisticated algorithm scores events based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Interests** | 40% | Alignment with selected interest categories |
| **Occupation** | 20% | Professional relevance and career development |
| **Location** | 20% | Geographic proximity or virtual availability |
| **Format** | 20% | Preferred event format (in-person vs virtual) |

### Match Indicators
- **💼 Profession Match**: Events relevant to your occupation
- **❤️ Interest Alignment**: Matches your selected interests
- **📍 Location Match**: In your preferred geographic area
- **🖥️ Format Match**: Matches your format preference

## 🛠️ Technical Architecture

### Frontend Stack
- **Pure JavaScript (ES6+)**: Modern vanilla JS with modules
- **Auth0 SPA SDK**: Secure authentication and authorization
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Professional iconography

### Data Sources
- **Primary**: Apify API for live event data
- **Fallback**: Local JSON files in `input/` directory
- **Storage**: Browser localStorage for user data

### API Integration
- **Apify API**: Event data fetching with caching
- **Webhook Integration**: Comprehensive event tracking
- **Auth0 API**: User management and authentication

## 🔧 Development

### Project Structure
```
event-matcher/
├── public/
│   ├── index.html          # Main application
│   └── ...
├── src/
│   ├── app.js              # Main application logic
│   ├── auth0.js            # Auth0 integration
│   ├── auth.js             # Authentication manager
│   ├── events.js           # Event data management
│   ├── swipe.js            # Swipe interface
│   ├── webhook.js          # Analytics tracking
│   ├── config.js           # Configuration (ignored)
│   └── config.example.js   # Configuration template
├── styles/
│   └── main.css            # Custom styles
├── input/                  # Local event data (optional)
├── server.py               # Python development server
├── start.sh                # Startup script
└── README.md
```

### Configuration Management
- **Template**: `src/config.example.js` (version controlled)
- **Active**: `src/config.js` (gitignored, contains secrets)
- **Security**: All sensitive data excluded from repository

### Data Flow
1. **Authentication**: Auth0 → Local Storage → App State
2. **Events**: Apify API → Cache → Filter → UI
3. **Interactions**: User Action → Webhook → Analytics
4. **Storage**: Local Storage → Export/Import → Backup

## 🔒 Security & Privacy

### Data Protection
- **Local-First**: All user data stored in browser
- **Secure Tokens**: Auth0 handles token management
- **No Tracking**: External analytics only with user consent
- **Data Control**: Full export/import capabilities

### Authentication Security
- **Token-Based**: Secure JWT tokens with refresh capability
- **HTTPS Only**: Secure communication in production
- **CORS Protected**: Proper origin validation
- **Session Management**: Automatic token refresh

## 🐛 Troubleshooting

### Common Issues

**🔐 Auth0 Login Issues**
- Verify domain format: `your-tenant.auth0.com`
- Check callback URLs in Auth0 dashboard
- Ensure popup blockers are disabled
- Check browser console for detailed errors

**📡 Event Loading Problems**
- Verify Apify API token and permissions
- Check network connectivity
- Ensure local fallback files exist in `input/`
- Check browser console for API errors

**💾 Data Not Saving**
- Ensure localStorage is enabled
- Check for browser storage limits
- Clear browser cache and retry
- Verify HTTPS in production

**🎨 UI/UX Issues**
- Enable JavaScript in browser
- Update to supported browser version
- Check for CSS loading errors
- Disable browser extensions temporarily

### Debug Mode
Open browser console to see detailed logs:
- **🔐 Auth**: Authentication flow details
- **📊 Events**: Data loading and filtering
- **🎯 Matching**: Algorithm scoring details
- **📡 API**: Network requests and responses

## 📊 Analytics & Tracking

### Webhook Integration
The app includes comprehensive analytics via webhook:

- **User Authentication**: Login/logout events
- **Event Interactions**: Views, likes, passes, super-likes
- **URL Clicks**: Event page visits tracking
- **Preference Updates**: Settings changes
- **Session Analytics**: Usage patterns and duration

### Data Tracked
```javascript
{
  "eventType": "match_created",
  "eventId": "unique-event-id",
  "eventUrl": "https://lu.ma/event-slug",
  "action": "like", // or "super-like"
  "matchScore": 0.85,
  "user": { /* user context */ },
  "timestamp": "2025-01-01T12:00:00Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Auth0** for enterprise-grade authentication
- **Apify** for reliable event data API
- **Luma.co** for event platform integration
- **Tailwind CSS** for modern styling framework

---

**🌟 Star this repository if Event Matcher helped you discover amazing events!**

For support, please check the [troubleshooting section](#-troubleshooting) or open an issue. 
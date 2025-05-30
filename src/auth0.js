import { config } from './config.js';
import { storage } from './storage.js';

// Auth0 authentication module
export const auth0 = {
    client: null,
    isInitialized: false,
    
    // Initialize Auth0 client
    async init() {
        try {
            // Only initialize Auth0 if credentials are configured
            if (config.auth0.domain === 'YOUR_AUTH0_DOMAIN' || 
                config.auth0.clientId === 'YOUR_AUTH0_CLIENT_ID') {
                console.log('⚠️ Auth0 not configured. Use config.example.js to set up your credentials.');
                return false;
            }
            
            console.log('🔐 Initializing Auth0 with domain:', config.auth0.domain);
            
            this.client = await window.auth0.createAuth0Client({
                domain: config.auth0.domain,
                clientId: config.auth0.clientId,
                authorizationParams: {
                    redirect_uri: config.auth0.redirectUri,
                    audience: config.auth0.audience || undefined,
                    scope: 'openid profile email'
                },
                cacheLocation: 'localstorage',
                useRefreshTokens: true
            });
            
            this.isInitialized = true;
            console.log('✅ Auth0 client initialized successfully');
            
            // Check if already authenticated on page load
            const isAuthenticated = await this.client.isAuthenticated();
            if (isAuthenticated) {
                console.log('👤 User already authenticated');
                const user = await this.getUser();
                if (user) {
                    window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
                }
            }
            
            // Handle redirect callback
            if (window.location.search.includes('code=') || 
                window.location.search.includes('error=')) {
                console.log('🔄 Handling Auth0 redirect callback...');
                await this.handleRedirectCallback();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing Auth0:', error);
            return false;
        }
    },
    
    // Handle redirect callback
    async handleRedirectCallback() {
        try {
            await this.client.handleRedirectCallback();
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Get user info after successful login
            const user = await this.getUser();
            if (user) {
                window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
            }
        } catch (error) {
            console.error('Error handling redirect callback:', error);
        }
    },
    
    // Login with redirect
    async login() {
        if (!this.isInitialized) {
            console.error('Auth0 not initialized');
            return;
        }
        
        try {
            await this.client.loginWithRedirect({
                appState: { returnTo: window.location.pathname }
            });
        } catch (error) {
            console.error('Error logging in:', error);
        }
    },
    
    // Login with popup
    async loginWithPopup() {
        if (!this.isInitialized) {
            console.error('❌ Auth0 not initialized');
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: 'Auth0 is not ready. Please refresh the page.', type: 'error' }
            }));
            return;
        }
        
        try {
            console.log('🔐 Starting Auth0 login...');
            
            await this.client.loginWithPopup({
                authorizationParams: {
                    scope: 'openid profile email'
                }
            });
            
            console.log('✅ Auth0 login successful');
            
            const user = await this.getUser();
            if (user) {
                console.log('👤 User profile retrieved:', user.name || user.email);
                window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
            }
        } catch (error) {
            console.error('❌ Error logging in with Auth0:', error);
            
            // Handle specific error types
            let errorMessage = 'Login failed. Please try again.';
            if (error.error === 'popup_closed_by_user') {
                errorMessage = 'Login was cancelled.';
            } else if (error.error === 'access_denied') {
                errorMessage = 'Access denied. Please check your permissions.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: errorMessage, type: 'error' }
            }));
        }
    },
    
    // Get current user
    async getUser() {
        if (!this.isInitialized) return null;
        
        try {
            const isAuthenticated = await this.client.isAuthenticated();
            if (!isAuthenticated) return null;
            
            const auth0User = await this.client.getUser();
            
            // Format user object
            const user = {
                id: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name || auth0User.nickname,
                avatar: auth0User.picture,
                provider: 'auth0',
                auth0Profile: auth0User,
                createdAt: new Date().toISOString()
            };
            
            // Save to storage
            storage.saveUser(user);
            
            return user;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },
    
    // Check if user is authenticated
    async isAuthenticated() {
        if (!this.isInitialized) return false;
        
        try {
            return await this.client.isAuthenticated();
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    },
    
    // Logout
    async logout() {
        if (!this.isInitialized) return;
        
        try {
            storage.clearAll();
            
            await this.client.logout({
                logoutParams: {
                    returnTo: window.location.origin + '/public/index.html'
                }
            });
        } catch (error) {
            console.error('Error logging out:', error);
        }
    },
    
    // Get access token
    async getAccessToken() {
        if (!this.isInitialized) return null;
        
        try {
            const token = await this.client.getTokenSilently();
            return token;
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    }
}; 
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
                console.log('Auth0 not configured. Use AUTH0_SETUP.md for instructions.');
                return false;
            }
            
            this.client = await window.auth0.createAuth0Client({
                domain: config.auth0.domain,
                clientId: config.auth0.clientId,
                authorizationParams: {
                    redirect_uri: config.auth0.redirectUri,
                    audience: config.auth0.audience || undefined
                },
                cacheLocation: 'localstorage',
                useRefreshTokens: true
            });
            
            this.isInitialized = true;
            
            // Handle redirect callback
            if (window.location.search.includes('code=') || 
                window.location.search.includes('error=')) {
                await this.handleRedirectCallback();
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing Auth0:', error);
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
            console.error('Auth0 not initialized');
            return;
        }
        
        try {
            await this.client.loginWithPopup();
            const user = await this.getUser();
            if (user) {
                window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
            }
        } catch (error) {
            console.error('Error logging in with popup:', error);
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
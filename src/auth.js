import { config } from './config.js';
import { storage } from './storage.js';
import { auth0 } from './auth0.js';
import { auth0GenAI } from './auth0-genai.js';

// Authentication module
export const auth = {
    currentUser: null,
    
    // Initialize authentication
    async init() {
        // Check for existing user
        const user = storage.getUser();
        if (user) {
            this.currentUser = user;
            return true;
        }
        
        // Initialize Auth0
        const auth0Initialized = await auth0.init();
        
        if (auth0Initialized) {
            // Check if user is already authenticated with Auth0
            const isAuth0User = await auth0.isAuthenticated();
            if (isAuth0User) {
                const auth0User = await auth0.getUser();
                if (auth0User) {
                    this.currentUser = auth0User;
                    return true;
                }
            }
        }
        
        // Listen for authentication events
        window.addEventListener('userAuthenticated', (event) => {
            this.handleAuthentication(event.detail);
        });
        
        return false;
    },
    
    // Handle authentication
    handleAuthentication(user) {
        this.setUser(user);
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
    },
    
    // Sign in with Auth0
    async signInWithAuth0() {
        try {
            // Try Auth0 GenAI first
            if (auth0GenAI && auth0GenAI.isInitialized) {
                await auth0GenAI.loginWithPopup();
            } else if (auth0 && auth0.isInitialized) {
                // Fallback to regular Auth0
                await auth0.loginWithPopup();
            } else {
                console.error('Auth0 not initialized');
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: 'Auth0 is not configured properly', type: 'error' }
                }));
            }
        } catch (error) {
            console.error('Error signing in with Auth0:', error);
        }
    },
    
    // Handle Guest Sign-In
    signInAsGuest() {
        const user = {
            id: 'guest_' + Date.now(),
            email: null,
            name: 'Guest User',
            avatar: null,
            provider: 'guest',
            createdAt: new Date().toISOString()
        };
        
        this.setUser(user);
        window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
    },
    
    // Set current user
    setUser(user) {
        this.currentUser = user;
        storage.saveUser(user);
    },
    
    // Get current user
    getUser() {
        return this.currentUser;
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    },
    
    // Check if user is guest
    isGuest() {
        return this.currentUser && this.currentUser.provider === 'guest';
    },
    
    // Update user profile
    updateProfile(updates) {
        if (this.currentUser) {
            this.currentUser = {
                ...this.currentUser,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            storage.saveUser(this.currentUser);
        }
    },
    
    // Sign out
    async signOut() {
        this.currentUser = null;
        
        // If user was authenticated with Auth0, logout from Auth0
        if (auth0.isInitialized && await auth0.isAuthenticated()) {
            await auth0.logout();
        } else {
            // Just clear local storage for guest users
            storage.clearAll();
            window.dispatchEvent(new CustomEvent('userSignedOut'));
        }
    }
}; 
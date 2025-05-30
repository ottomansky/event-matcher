import { config } from './config.js';
import { storage } from './storage.js';

// Auth0 for GenAI - Enhanced authentication module with AI-specific features
export const auth0GenAI = {
    client: null,
    isInitialized: false,
    tokenVault: new Map(), // Store tokens for different services
    
    // Initialize Auth0 client with GenAI capabilities
    async init() {
        try {
            // Check if Auth0 is configured
            if (config.auth0.domain === 'YOUR_AUTH0_DOMAIN' || 
                config.auth0.clientId === 'YOUR_AUTH0_CLIENT_ID') {
                console.log('⚠️ Auth0 not configured. Use AUTH0_SETUP.md for instructions.');
                return false;
            }
            
            console.log('🤖 Initializing Auth0 for GenAI with domain:', config.auth0.domain);
            
            // Check if this is a GenAI-enabled domain
            if (!config.auth0.domain.includes('genai') && !config.auth0.domain.includes('.eu.auth0.com')) {
                console.log('ℹ️ Domain does not appear to be GenAI-enabled, using standard Auth0');
                return false;
            }
            
            // Initialize with enhanced configuration for GenAI
            this.client = await window.auth0.createAuth0Client({
                domain: config.auth0.domain,
                clientId: config.auth0.clientId,
                authorizationParams: {
                    redirect_uri: config.auth0.redirectUri,
                    audience: config.auth0.audience || `https://${config.auth0.domain}/api/v2/`,
                    scope: 'openid profile email offline_access read:current_user update:current_user_metadata'
                },
                cacheLocation: 'memory', // Better for security with AI apps
                useRefreshTokens: true,
                useRefreshTokensFallback: true, // Fallback for older browsers
                leeway: 60 // Clock skew tolerance
            });
            
            this.isInitialized = true;
            console.log('✅ Auth0 for GenAI initialized successfully');
            
            // Test the client to ensure GenAI features are available
            try {
                await this.testGenAICapabilities();
            } catch (error) {
                console.warn('⚠️ GenAI features not available, falling back to standard Auth0:', error.message);
                this.isInitialized = false;
                return false;
            }
            
            // Check if already authenticated on page load
            const isAuthenticated = await this.client.isAuthenticated();
            if (isAuthenticated) {
                console.log('👤 User already authenticated with Auth0 GenAI');
                const user = await this.getEnhancedUser();
                if (user) {
                    window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
                }
            }
            
            // Handle redirect callback
            if (window.location.search.includes('code=') || 
                window.location.search.includes('error=')) {
                console.log('🔄 Handling Auth0 GenAI redirect callback...');
                await this.handleRedirectCallback();
            }
            
            // Setup token refresh interval
            this.setupTokenRefresh();
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing Auth0 for GenAI:', error);
            
            // Provide helpful debugging information
            if (error.message?.includes('Unauthorized')) {
                console.error('🔒 GenAI features require enrollment in Developer Preview program');
                console.error('📋 Visit https://auth0.com/ai/docs to join the program');
            } else if (error.message?.includes('audience')) {
                console.error('🎯 Invalid audience configuration for GenAI');
            } else if (error.message?.includes('domain')) {
                console.error('🌐 Domain configuration issue - ensure you have a GenAI-enabled tenant');
            }
            
            return false;
        }
    },
    
    // Test GenAI capabilities
    async testGenAICapabilities() {
        if (!this.client) {
            throw new Error('Auth0 client not initialized');
        }
        
        // Try to get token silently to test configuration
        try {
            await this.client.getTokenSilently({
                authorizationParams: {
                    audience: config.auth0.audience || `https://${config.auth0.domain}/api/v2/`,
                }
            });
            console.log('🧪 GenAI capabilities test passed');
        } catch (error) {
            if (error.error === 'login_required' || error.error === 'consent_required') {
                // This is expected when not logged in
                console.log('🧪 GenAI capabilities available (login required)');
                return;
            }
            throw new Error(`GenAI test failed: ${error.error || error.message}`);
        }
    },
    
    // Login with popup (required method)
    async loginWithPopup() {
        if (!this.isInitialized) {
            console.error('❌ Auth0 for GenAI not initialized');
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: 'Auth0 GenAI is not ready. Please refresh the page.', type: 'error' }
            }));
            return;
        }
        
        try {
            console.log('🤖 Starting Auth0 GenAI login...');
            
            await this.client.loginWithPopup({
                authorizationParams: {
                    scope: 'openid profile email offline_access read:current_user update:current_user_metadata'
                }
            });
            
            console.log('✅ Auth0 GenAI login successful');
            
            const user = await this.getEnhancedUser();
            if (user) {
                console.log('👤 Enhanced user profile retrieved:', user.name || user.email);
                window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
            }
        } catch (error) {
            console.error('❌ Error logging in with Auth0 GenAI:', error);
            
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
    
    // Login with redirect
    async login() {
        if (!this.isInitialized) {
            console.error('Auth0 GenAI not initialized');
            return;
        }
        
        try {
            await this.client.loginWithRedirect({
                appState: { returnTo: window.location.pathname }
            });
        } catch (error) {
            console.error('Error logging in with Auth0 GenAI:', error);
        }
    },
    
    // Connect external services (Gmail, Slack, GitHub, etc.)
    async connectExternalService(service, scopes = []) {
        if (!this.isInitialized) {
            throw new Error('Auth0 not initialized');
        }
        
        const serviceConfigs = {
            google: {
                connection: 'google-oauth2',
                scopes: ['https://www.googleapis.com/auth/calendar.readonly', ...scopes]
            },
            github: {
                connection: 'github',
                scopes: ['repo', 'user', ...scopes]
            },
            slack: {
                connection: 'slack',
                scopes: ['channels:read', 'chat:write', ...scopes]
            }
        };
        
        const config = serviceConfigs[service];
        if (!config) {
            throw new Error(`Service ${service} not supported`);
        }
        
        try {
            // Request authorization for specific service
            const token = await this.client.getTokenSilently({
                authorizationParams: {
                    connection: config.connection,
                    scope: config.scopes.join(' ')
                }
            });
            
            // Store token in vault
            this.tokenVault.set(service, {
                token,
                scopes: config.scopes,
                expiresAt: Date.now() + 3600000 // 1 hour
            });
            
            console.log(`✅ Connected to ${service} successfully`);
            return token;
        } catch (error) {
            console.error(`Failed to connect to ${service}:`, error);
            throw error;
        }
    },
    
    // Get token for external service from vault
    async getServiceToken(service) {
        const cached = this.tokenVault.get(service);
        
        if (cached && cached.expiresAt > Date.now()) {
            return cached.token;
        }
        
        // Token expired or not found, request new one
        return await this.connectExternalService(service, cached?.scopes || []);
    },
    
    // Asynchronous authorization using CIBA (Client-Initiated Backchannel Authentication)
    async requestAsyncAuthorization(action, metadata = {}) {
        if (!this.isInitialized) {
            throw new Error('Auth0 not initialized');
        }
        
        try {
            const user = await this.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Create authorization request
            const authRequest = {
                user_id: user.id,
                action: action,
                metadata: {
                    ...metadata,
                    requested_at: new Date().toISOString(),
                    app: 'event-matcher-ai'
                }
            };
            
            // Store pending authorization
            const requestId = this.generateRequestId();
            storage.savePendingAuth(requestId, authRequest);
            
            // Simulate CIBA flow (in production, this would call Auth0 CIBA endpoint)
            console.log(`📱 Async authorization requested for: ${action}`);
            
            // Send notification (email/SMS/push)
            await this.sendAuthNotification(user, action, requestId);
            
            return requestId;
        } catch (error) {
            console.error('Failed to request async authorization:', error);
            throw error;
        }
    },
    
    // Check async authorization status
    async checkAuthorizationStatus(requestId) {
        const pendingAuth = storage.getPendingAuth(requestId);
        
        if (!pendingAuth) {
            return { status: 'not_found' };
        }
        
        // In production, this would poll Auth0 CIBA endpoint
        return {
            status: pendingAuth.status || 'pending',
            authorized: pendingAuth.authorized || false,
            metadata: pendingAuth.metadata
        };
    },
    
    // Fine-grained authorization for RAG (Retrieval Augmented Generation)
    async checkRAGAccess(resource, action = 'read') {
        if (!this.isInitialized) {
            throw new Error('Auth0 not initialized');
        }
        
        try {
            const user = await this.getUser();
            if (!user) {
                return false;
            }
            
            // Check document-level permissions
            const permissions = await this.getUserPermissions();
            
            // Check if user has access to resource
            const hasAccess = permissions.some(perm => {
                return perm.resource === resource && 
                       (perm.action === action || perm.action === '*');
            });
            
            // Log access check for audit
            console.log(`🔒 RAG Access Check: ${user.email} ${action} ${resource} = ${hasAccess}`);
            
            return hasAccess;
        } catch (error) {
            console.error('Failed to check RAG access:', error);
            return false;
        }
    },
    
    // Get user permissions from Auth0
    async getUserPermissions() {
        if (!this.isInitialized) return [];
        
        try {
            const token = await this.client.getTokenSilently();
            const claims = await this.client.getIdTokenClaims();
            
            // Extract permissions from token claims
            const permissions = claims?.permissions || [];
            
            // Also check user metadata for additional permissions
            const userMetadata = claims?.user_metadata || {};
            const additionalPerms = userMetadata.permissions || [];
            
            return [...permissions, ...additionalPerms];
        } catch (error) {
            console.error('Failed to get user permissions:', error);
            return [];
        }
    },
    
    // Enhanced user profile with AI preferences
    async getEnhancedUser() {
        const baseUser = await this.getUser();
        if (!baseUser) return null;
        
        // Add AI-specific preferences
        const aiPreferences = storage.getAIPreferences() || {
            allowAIRecommendations: true,
            dataProcessingConsent: false,
            preferredAIModels: ['gpt-4', 'claude'],
            privacyLevel: 'balanced' // strict, balanced, open
        };
        
        return {
            ...baseUser,
            aiPreferences,
            connectedServices: Array.from(this.tokenVault.keys()),
            permissions: await this.getUserPermissions()
        };
    },
    
    // Setup automatic token refresh
    setupTokenRefresh() {
        setInterval(async () => {
            if (this.isInitialized && await this.isAuthenticated()) {
                try {
                    await this.client.getTokenSilently();
                    console.log('🔄 Token refreshed successfully');
                } catch (error) {
                    console.error('Failed to refresh token:', error);
                }
            }
        }, 300000); // Refresh every 5 minutes
    },
    
    // Generate unique request ID
    generateRequestId() {
        return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Send authorization notification (mock implementation)
    async sendAuthNotification(user, action, requestId) {
        // In production, this would call your notification service
        console.log(`📧 Sending auth notification to ${user.email} for action: ${action}`);
        
        // Simulate notification sent
        return true;
    },
    
    // Get current user (inherited from base auth0.js)
    async getUser() {
        if (!this.isInitialized) return null;
        
        try {
            const isAuthenticated = await this.client.isAuthenticated();
            if (!isAuthenticated) return null;
            
            const auth0User = await this.client.getUser();
            
            // Enhanced user object with GenAI fields
            const user = {
                id: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name || auth0User.nickname,
                avatar: auth0User.picture,
                provider: 'auth0',
                auth0Profile: auth0User,
                aiEnabled: true,
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
    
    // Check authentication status
    async isAuthenticated() {
        if (!this.isInitialized) return false;
        
        try {
            return await this.client.isAuthenticated();
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    },
    
    // Enhanced logout with cleanup
    async logout() {
        if (!this.isInitialized) return;
        
        try {
            // Clear token vault
            this.tokenVault.clear();
            
            // Clear all storage
            storage.clearAll();
            
            // Logout from Auth0
            await this.client.logout({
                logoutParams: {
                    returnTo: window.location.origin + '/public/index.html'
                }
            });
        } catch (error) {
            console.error('Error logging out:', error);
        }
    },
    
    // Handle redirect callback
    async handleRedirectCallback() {
        try {
            await this.client.handleRedirectCallback();
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Get enhanced user info after successful login
            const user = await this.getEnhancedUser();
            if (user) {
                window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: user }));
            }
        } catch (error) {
            console.error('Error handling Auth0 GenAI redirect callback:', error);
        }
    }
}; 
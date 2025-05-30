import { config } from './config.js';

// Storage utility module for managing local storage and cookies
export const storage = {
    // Storage keys
    keys: {
        user: 'eventMatcher_user',
        preferences: 'eventMatcher_preferences',
        matches: 'eventMatcher_matches',
        seenEvents: 'eventMatcher_seenEvents',
        analytics: 'eventMatcher_analytics',
        aiPreferences: 'eventMatcher_aiPreferences',
        pendingAuth: 'eventMatcher_pendingAuth',
        userData: 'eventMatcher_userData' // New key for user-specific data
    },
    
    // Get current user ID for user-specific storage
    getCurrentUserId() {
        const user = this.getUser();
        if (!user) return 'guest';
        
        // Create a consistent user ID from available data
        if (user.email) return `email_${user.email}`;
        if (user.sub) return `auth0_${user.sub}`;
        if (user.id) return `google_${user.id}`;
        
        // Fallback to a guest ID with timestamp for anonymous users
        const guestId = localStorage.getItem('eventMatcher_guestId');
        if (guestId) return guestId;
        
        const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('eventMatcher_guestId', newGuestId);
        return newGuestId;
    },
    
    // Get user-specific storage key
    getUserStorageKey(baseKey) {
        const userId = this.getCurrentUserId();
        return `${baseKey}_${userId}`;
    },
    
    // Get all user data for the current user
    getUserData() {
        try {
            const userId = this.getCurrentUserId();
            const userDataKey = this.getUserStorageKey(this.keys.userData);
            const userData = localStorage.getItem(userDataKey);
            
            if (userData) {
                return JSON.parse(userData);
            }
            
            // Initialize new user data structure
            const newUserData = {
                userId: userId,
                createdAt: new Date().toISOString(),
                lastAccessed: new Date().toISOString(),
                matches: [],
                seenEvents: [],
                preferences: null,
                aiPreferences: null,
                analytics: {},
                profile: null
            };
            
            this.saveUserData(newUserData);
            return newUserData;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    },
    
    // Save user data
    saveUserData(userData) {
        try {
            const userDataKey = this.getUserStorageKey(this.keys.userData);
            userData.lastAccessed = new Date().toISOString();
            localStorage.setItem(userDataKey, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    },
    
    // Export user data for backup/download
    exportUserData() {
        try {
            const userData = this.getUserData();
            if (!userData) return null;
            
            const exportData = {
                ...userData,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            return exportData;
        } catch (error) {
            console.error('Error exporting user data:', error);
            return null;
        }
    },
    
    // Import user data from backup
    importUserData(importData) {
        try {
            if (!importData || !importData.userId) {
                throw new Error('Invalid import data');
            }
            
            // Validate data structure
            const requiredFields = ['matches', 'seenEvents', 'createdAt'];
            for (const field of requiredFields) {
                if (!(field in importData)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
            
            // Save imported data
            const userData = {
                ...importData,
                importedAt: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            };
            
            this.saveUserData(userData);
            
            // Also update legacy storage for backward compatibility
            if (userData.matches) this.setItem(this.keys.matches, userData.matches);
            if (userData.seenEvents) this.setItem(this.keys.seenEvents, userData.seenEvents);
            if (userData.preferences) this.setItem(this.keys.preferences, userData.preferences);
            if (userData.aiPreferences) this.setItem(this.keys.aiPreferences, userData.aiPreferences);
            
            return true;
        } catch (error) {
            console.error('Error importing user data:', error);
            return false;
        }
    },
    
    // Cookie management
    setCookie(name, value, days = config.cookieExpiry) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${JSON.stringify(value)};expires=${expires.toUTCString()};path=/`;
    },
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(c.substring(nameEQ.length, c.length));
                } catch {
                    return c.substring(nameEQ.length, c.length);
                }
            }
        }
        return null;
    },
    
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    },
    
    // Local Storage management
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },
    
    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },
    
    // User management
    saveUser(user) {
        try {
            localStorage.setItem(this.keys.user, JSON.stringify(user));
            
            // Update user data with profile info
            const userData = this.getUserData();
            if (userData) {
                userData.profile = {
                    ...user,
                    updatedAt: new Date().toISOString()
                };
                this.saveUserData(userData);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            return false;
        }
    },
    
    getUser() {
        try {
            const userData = localStorage.getItem(this.keys.user);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },
    
    removeUser() {
        this.removeItem(this.keys.user);
        this.deleteCookie(this.keys.user);
        
        // Clear user-specific data
        const userId = this.getCurrentUserId();
        const userDataKey = this.getUserStorageKey(this.keys.userData);
        this.removeItem(userDataKey);
    },
    
    // Preferences management (now user-specific)
    savePreferences(preferences) {
        try {
            // Save to legacy storage for backward compatibility
            localStorage.setItem(this.keys.preferences, JSON.stringify(preferences));
            
            // Save to user-specific storage
            const userData = this.getUserData();
            if (userData) {
                userData.preferences = {
                    ...preferences,
                    updatedAt: new Date().toISOString()
                };
                this.saveUserData(userData);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            return false;
        }
    },
    
    getPreferences() {
        try {
            // Try user-specific storage first
            const userData = this.getUserData();
            if (userData && userData.preferences) {
                return userData.preferences;
            }
            
            // Fallback to legacy storage
            const prefsData = localStorage.getItem(this.keys.preferences);
            return prefsData ? JSON.parse(prefsData) : null;
        } catch (error) {
            console.error('Error getting preferences:', error);
            return null;
        }
    },
    
    // AI Preferences management (now user-specific)
    saveAIPreferences(aiPreferences) {
        try {
            // Save to legacy storage for backward compatibility
            localStorage.setItem(this.keys.aiPreferences, JSON.stringify(aiPreferences));
            
            // Save to user-specific storage
            const userData = this.getUserData();
            if (userData) {
                userData.aiPreferences = {
                    ...aiPreferences,
                    updatedAt: new Date().toISOString()
                };
                this.saveUserData(userData);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving AI preferences:', error);
            return false;
        }
    },
    
    getAIPreferences() {
        try {
            // Try user-specific storage first
            const userData = this.getUserData();
            if (userData && userData.aiPreferences) {
                return userData.aiPreferences;
            }
            
            // Fallback to legacy storage
            const aiPrefsData = localStorage.getItem(this.keys.aiPreferences);
            return aiPrefsData ? JSON.parse(aiPrefsData) : null;
        } catch (error) {
            console.error('Error getting AI preferences:', error);
            return null;
        }
    },
    
    // Pending Authorization management
    savePendingAuth(requestId, authRequest) {
        try {
            const pendingAuths = this.getAllPendingAuths();
            pendingAuths[requestId] = {
                ...authRequest,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            localStorage.setItem(this.keys.pendingAuth, JSON.stringify(pendingAuths));
            return true;
        } catch (error) {
            console.error('Error saving pending auth:', error);
            return false;
        }
    },
    
    getPendingAuth(requestId) {
        try {
            const pendingAuths = this.getAllPendingAuths();
            return pendingAuths[requestId] || null;
        } catch (error) {
            console.error('Error getting pending auth:', error);
            return null;
        }
    },
    
    getAllPendingAuths() {
        try {
            const data = localStorage.getItem(this.keys.pendingAuth);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting all pending auths:', error);
            return {};
        }
    },
    
    updatePendingAuth(requestId, updates) {
        try {
            const pendingAuths = this.getAllPendingAuths();
            if (pendingAuths[requestId]) {
                pendingAuths[requestId] = {
                    ...pendingAuths[requestId],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(this.keys.pendingAuth, JSON.stringify(pendingAuths));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating pending auth:', error);
            return false;
        }
    },
    
    // Matches management (now user-specific)
    addMatch(event) {
        try {
            // Get user-specific data
            const userData = this.getUserData();
            if (!userData) return false;
            
            const match = {
                event: event,
                matchedAt: new Date().toISOString(),
                id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            // Add to user-specific matches
            userData.matches.unshift(match); // Add to beginning
            
            // Keep only last 200 matches per user
            if (userData.matches.length > 200) {
                userData.matches.length = 200;
            }
            
            // Save user data
            this.saveUserData(userData);
            
            // Also save to legacy storage for backward compatibility
            const legacyMatches = this.getItem(this.keys.matches) || [];
            legacyMatches.unshift(match);
            if (legacyMatches.length > 100) {
                legacyMatches.length = 100;
            }
            localStorage.setItem(this.keys.matches, JSON.stringify(legacyMatches));
            
            // Update analytics
            this.updateAnalytics('match');
            
            console.log(`💾 Match saved for user ${userData.userId}:`, event.name);
            return true;
        } catch (error) {
            console.error('Error adding match:', error);
            return false;
        }
    },
    
    getMatches() {
        try {
            // Try user-specific storage first
            const userData = this.getUserData();
            if (userData && userData.matches) {
                return userData.matches.map(match => match.event || match); // Handle both old and new format
            }
            
            // Fallback to legacy storage
            const matchesData = localStorage.getItem(this.keys.matches);
            return matchesData ? JSON.parse(matchesData) : [];
        } catch (error) {
            console.error('Error getting matches:', error);
            return [];
        }
    },
    
    removeMatch(eventId) {
        try {
            // Remove from user-specific storage
            const userData = this.getUserData();
            if (userData) {
                userData.matches = userData.matches.filter(match => {
                    const event = match.event || match;
                    return event.api_id !== eventId;
                });
                this.saveUserData(userData);
            }
            
            // Also remove from legacy storage
            const matches = this.getItem(this.keys.matches) || [];
            const filteredMatches = matches.filter(match => {
                const event = match.event || match;
                return event.api_id !== eventId;
            });
            localStorage.setItem(this.keys.matches, JSON.stringify(filteredMatches));
            
            return true;
        } catch (error) {
            console.error('Error removing match:', error);
            return false;
        }
    },
    
    // Seen events management (now user-specific)
    addSeenEvent(eventId) {
        try {
            // Get user-specific data
            const userData = this.getUserData();
            if (!userData) return false;
            
            if (!userData.seenEvents.includes(eventId)) {
                userData.seenEvents.push(eventId);
                
                // Keep only last 1000 seen events per user
                if (userData.seenEvents.length > 1000) {
                    userData.seenEvents.shift(); // Remove oldest
                }
                
                this.saveUserData(userData);
            }
            
            // Also save to legacy storage for backward compatibility
            const seenEvents = this.getItem(this.keys.seenEvents) || [];
            if (!seenEvents.includes(eventId)) {
                seenEvents.push(eventId);
                if (seenEvents.length > 500) {
                    seenEvents.shift();
                }
                localStorage.setItem(this.keys.seenEvents, JSON.stringify(seenEvents));
            }
            
            // Update analytics
            this.updateAnalytics('seen');
            
            return true;
        } catch (error) {
            console.error('Error adding seen event:', error);
            return false;
        }
    },
    
    getSeenEvents() {
        try {
            // Try user-specific storage first
            const userData = this.getUserData();
            if (userData && userData.seenEvents) {
                return userData.seenEvents;
            }
            
            // Fallback to legacy storage
            const seenData = localStorage.getItem(this.keys.seenEvents);
            return seenData ? JSON.parse(seenData) : [];
        } catch (error) {
            console.error('Error getting seen events:', error);
            return [];
        }
    },
    
    // Analytics (now user-specific)
    updateAnalytics(action) {
        try {
            // Update user-specific analytics
            const userData = this.getUserData();
            if (userData) {
                const today = new Date().toISOString().split('T')[0];
                
                if (!userData.analytics[today]) {
                    userData.analytics[today] = {
                        seen: 0,
                        matches: 0,
                        sessions: 0
                    };
                }
                
                if (action === 'seen') {
                    userData.analytics[today].seen++;
                } else if (action === 'match') {
                    userData.analytics[today].matches++;
                } else if (action === 'session') {
                    userData.analytics[today].sessions++;
                }
                
                // Keep only last 60 days for user-specific analytics
                const dates = Object.keys(userData.analytics).sort();
                if (dates.length > 60) {
                    dates.slice(0, -60).forEach(date => delete userData.analytics[date]);
                }
                
                this.saveUserData(userData);
            }
            
            // Also update legacy analytics
            const analytics = this.getItem(this.keys.analytics) || {};
            const today = new Date().toISOString().split('T')[0];
            
            if (!analytics[today]) {
                analytics[today] = {
                    seen: 0,
                    matches: 0,
                    sessions: 0
                };
            }
            
            if (action === 'seen') {
                analytics[today].seen++;
            } else if (action === 'match') {
                analytics[today].matches++;
            } else if (action === 'session') {
                analytics[today].sessions++;
            }
            
            // Keep only last 30 days for legacy analytics
            const dates = Object.keys(analytics).sort();
            if (dates.length > 30) {
                dates.slice(0, -30).forEach(date => delete analytics[date]);
            }
            
            localStorage.setItem(this.keys.analytics, JSON.stringify(analytics));
            return true;
        } catch (error) {
            console.error('Error updating analytics:', error);
            return false;
        }
    },
    
    getAnalytics() {
        try {
            // Try user-specific storage first
            const userData = this.getUserData();
            if (userData && userData.analytics) {
                return userData.analytics;
            }
            
            // Fallback to legacy storage
            const analyticsData = localStorage.getItem(this.keys.analytics);
            return analyticsData ? JSON.parse(analyticsData) : {};
        } catch (error) {
            console.error('Error getting analytics:', error);
            return {};
        }
    },
    
    // Get storage usage statistics
    getStorageStats() {
        try {
            const userData = this.getUserData();
            const userId = this.getCurrentUserId();
            
            const stats = {
                userId: userId,
                userType: userId.startsWith('guest') ? 'guest' : 'authenticated',
                matches: userData ? userData.matches.length : 0,
                seenEvents: userData ? userData.seenEvents.length : 0,
                accountAge: userData ? Math.floor((new Date() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
                lastAccessed: userData ? userData.lastAccessed : null,
                storageSize: this.calculateStorageSize()
            };
            
            return stats;
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    },
    
    // Calculate storage size in KB
    calculateStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('eventMatcher_')) {
                    total += localStorage[key].length;
                }
            }
            return Math.round(total / 1024 * 100) / 100; // KB with 2 decimal places
        } catch (error) {
            console.error('Error calculating storage size:', error);
            return 0;
        }
    },
    
    // Clear all data
    clearAll() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clear user-specific data
            const userId = this.getCurrentUserId();
            Object.values(this.keys).forEach(baseKey => {
                const userKey = this.getUserStorageKey(baseKey);
                localStorage.removeItem(userKey);
            });
            
            // Clear guest ID
            localStorage.removeItem('eventMatcher_guestId');
            
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    },
    
    // Migrate legacy data to user-specific storage
    migrateLegacyData() {
        try {
            console.log('🔄 Migrating legacy data to user-specific storage...');
            
            const userData = this.getUserData();
            if (!userData) return false;
            
            let migrated = false;
            
            // Migrate matches
            const legacyMatches = this.getItem(this.keys.matches);
            if (legacyMatches && legacyMatches.length > 0 && userData.matches.length === 0) {
                userData.matches = legacyMatches.map(match => ({
                    event: match.event || match,
                    matchedAt: match.matchedAt || new Date().toISOString(),
                    id: `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                }));
                migrated = true;
            }
            
            // Migrate seen events
            const legacySeenEvents = this.getItem(this.keys.seenEvents);
            if (legacySeenEvents && legacySeenEvents.length > 0 && userData.seenEvents.length === 0) {
                userData.seenEvents = legacySeenEvents;
                migrated = true;
            }
            
            // Migrate preferences
            const legacyPreferences = this.getItem(this.keys.preferences);
            if (legacyPreferences && !userData.preferences) {
                userData.preferences = legacyPreferences;
                migrated = true;
            }
            
            // Migrate AI preferences
            const legacyAIPreferences = this.getItem(this.keys.aiPreferences);
            if (legacyAIPreferences && !userData.aiPreferences) {
                userData.aiPreferences = legacyAIPreferences;
                migrated = true;
            }
            
            if (migrated) {
                this.saveUserData(userData);
                console.log('✅ Legacy data migration completed');
            }
            
            return migrated;
        } catch (error) {
            console.error('Error migrating legacy data:', error);
            return false;
        }
    }
}; 
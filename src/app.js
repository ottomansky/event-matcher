import { config } from './config.js';
import { storage } from './storage.js';
import { auth } from './auth.js';
import { events } from './events.js';
import { swipe } from './swipe.js';
import { auth0 } from './auth0.js';
import { auth0GenAI } from './auth0-genai.js';
import { aiRecommendations } from './ai-recommendations.js';
import { webhook } from './webhook.js';

// Main application module
const app = {
    currentScreen: 'loading',
    currentUser: null,
    currentPage: 'welcome',
    useAuth0GenAI: false, // Flag to use enhanced Auth0 features
    
    // Initialize the application
    async init() {
        console.log('🚀 Initializing Event Matcher...');
        
        // Initialize webhook system
        webhook.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Migrate legacy data to user-specific storage
        storage.migrateLegacyData();
        
        // Check authentication
        await this.checkAuth();
        
        // Update analytics
        storage.updateAnalytics('session');
        
        // Log storage statistics
        this.logStorageStats();
        
        // Load events in background
        this.loadEventsInBackground();
    },
    
    // Log storage statistics
    logStorageStats() {
        const stats = storage.getStorageStats();
        if (stats) {
            console.log('📊 Storage Statistics:', {
                userId: stats.userId,
                userType: stats.userType,
                matches: stats.matches,
                seenEvents: stats.seenEvents,
                accountAge: `${stats.accountAge} days`,
                storageSize: `${stats.storageSize} KB`
            });
        }
    },
    
    // Check authentication status
    async checkAuth() {
        // Try Auth0 GenAI first
        const auth0GenAIInitialized = await auth0GenAI.init();
        if (auth0GenAIInitialized) {
            const user = await auth0GenAI.getEnhancedUser();
            if (user) {
                this.currentUser = user;
                this.useAuth0GenAI = true;
                this.showHomePage();
                
                // Initialize AI recommendations if enabled
                if (user.aiPreferences?.allowAIRecommendations) {
                    await aiRecommendations.init();
                }
                return;
            }
        }
        
        // Fallback to regular Auth0
        const auth0Initialized = await auth0.init();
        if (auth0Initialized) {
            const user = await auth0.getUser();
            if (user) {
                this.currentUser = user;
                this.showHomePage();
                return;
            }
        }
        
        // Check Google auth
        const googleUser = await auth.getUser();
        if (googleUser) {
            this.currentUser = googleUser;
            this.showHomePage();
            return;
        }
        
        // Check stored user
        const storedUser = storage.getUser();
        if (storedUser) {
            this.currentUser = storedUser;
            this.showHomePage();
            return;
        }
        
        // No user found, show welcome page
        this.showWelcomePage();
    },
    
    // Load events in background
    async loadEventsInBackground() {
        try {
            await events.loadEvents();
            console.log('📚 Events loaded successfully');
            
            // If user is on home page, refresh the view
            if (this.currentPage === 'home') {
                const preferences = storage.getPreferences();
                if (preferences) {
                    await this.startMatching(preferences);
                }
            }
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    },
    
    // Setup global event listeners
    setupEventListeners() {
        // Authentication events
        window.addEventListener('userAuthenticated', (e) => {
            this.handleAuthentication(e.detail);
        });
        
        window.addEventListener('userSignedOut', () => {
            this.showAuthScreen();
        });
        
        // Notification handler
        window.addEventListener('showNotification', (e) => {
            this.showNotification(e.detail.message, e.detail.type);
        });
        
        // Auth0 login button
        document.getElementById('auth0-login-btn')?.addEventListener('click', () => {
            auth.signInWithAuth0();
        });
        
        // Guest button
        document.getElementById('guest-btn')?.addEventListener('click', () => {
            auth.signInAsGuest();
        });
        
        // Preferences form
        document.getElementById('preferences-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePreferences();
        });
        
        document.getElementById('skip-preferences')?.addEventListener('click', () => {
            this.showMainScreen();
        });
        
        // Navigation buttons
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            auth.signOut();
        });
        
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showPreferencesScreen();
        });
        
        document.getElementById('matches-btn')?.addEventListener('click', () => {
            this.showMatchesScreen();
        });
        
        document.getElementById('back-to-swipe')?.addEventListener('click', () => {
            this.showMainScreen();
        });
    },
    
    // Update match count badge
    updateMatchCount() {
        const matches = storage.getMatches();
        const matchCountEl = document.getElementById('match-count');
        
        if (matchCountEl && matches.length > 0) {
            matchCountEl.textContent = matches.length;
            matchCountEl.classList.remove('hidden');
        } else if (matchCountEl) {
            matchCountEl.classList.add('hidden');
        }
    },
    
    // Handle authentication
    handleAuthentication(user) {
        console.log('User authenticated:', user);
        
        // Track authentication event
        webhook.trackAuthentication(user);
        
        // Update UI with user info
        if (user.name && user.provider !== 'guest') {
            document.getElementById('user-display-name').textContent = user.name;
            auth.updateProfile({ name: user.name });
        } else if (user.provider === 'guest') {
            document.getElementById('user-display-name').textContent = 'Guest';
        }
        
        if (user.avatar) {
            const avatar = document.getElementById('user-avatar');
            if (avatar) {
                avatar.src = user.avatar;
                avatar.classList.remove('hidden');
            }
        }
        
        // Update match count
        this.updateMatchCount();
        
        // Check for existing preferences
        const preferences = storage.getPreferences();
        if (preferences) {
            this.showMainScreen();
        } else {
            this.showPreferencesScreen();
        }
    },
    
    // Save user preferences
    savePreferences() {
        const formData = new FormData(document.getElementById('preferences-form'));
        
        // Get selected interests
        const interests = [];
        document.querySelectorAll('input[name="interests"]:checked').forEach(checkbox => {
            interests.push(checkbox.value);
        });
        
        const preferences = {
            name: document.getElementById('user-name').value,
            occupation: document.getElementById('occupation').value,
            interests: interests,
            format: formData.get('format'),
            location: document.getElementById('location').value
        };
        
        // Save preferences
        storage.savePreferences(preferences);
        
        // Track preferences update
        webhook.trackPreferencesUpdate(preferences);
        
        // Update user name if provided
        if (preferences.name) {
            auth.updateProfile({ name: preferences.name });
            document.getElementById('user-display-name').textContent = preferences.name;
        }
        
        // Go to main screen
        this.showMainScreen();
    },
    
    // Show authentication screen
    showAuthScreen() {
        this.hideAllScreens();
        document.getElementById('auth-screen')?.classList.remove('hidden');
        this.currentScreen = 'auth';
        
        // Update Google Client ID if available
        const googleOnload = document.getElementById('g_id_onload');
        if (googleOnload && config.googleClientId !== 'YOUR_GOOGLE_CLIENT_ID') {
            googleOnload.setAttribute('data-client_id', config.googleClientId);
        }
    },
    
    // Show preferences screen
    showPreferencesScreen() {
        this.hideAllScreens();
        document.getElementById('preferences-screen')?.classList.remove('hidden');
        this.currentScreen = 'preferences';
        
        // Load existing preferences if any
        const preferences = storage.getPreferences();
        if (preferences) {
            // Pre-fill form
            if (preferences.name) {
                document.getElementById('user-name').value = preferences.name;
            }
            if (preferences.occupation) {
                document.getElementById('occupation').value = preferences.occupation;
            }
            if (preferences.location) {
                document.getElementById('location').value = preferences.location;
            }
            
            // Check interests
            preferences.interests?.forEach(interest => {
                const checkbox = document.querySelector(`input[name="interests"][value="${interest}"]`);
                if (checkbox) checkbox.checked = true;
            });
            
            // Select format
            if (preferences.format) {
                const radio = document.querySelector(`input[name="format"][value="${preferences.format}"]`);
                if (radio) radio.checked = true;
            }
        }
    },
    
    // Show main screen
    showMainScreen() {
        this.hideAllScreens();
        document.getElementById('main-screen')?.classList.remove('hidden');
        this.currentScreen = 'main';
        
        // Initialize swipe module if not done
        if (!swipe.cardStack) {
            swipe.init();
        }
        
        // Update match count
        this.updateMatchCount();
        
        // Load events based on preferences
        const preferences = storage.getPreferences() || {};
        this.startMatching(preferences);
        
        // Show and hide swipe tip
        this.showSwipeTip();
    },
    
    // Show swipe tip
    showSwipeTip() {
        const swipeTip = document.getElementById('swipe-tip');
        if (swipeTip) {
            // Hide after 7 seconds
            setTimeout(() => {
                swipeTip.style.transition = 'opacity 0.5s';
                swipeTip.style.opacity = '0';
                setTimeout(() => swipeTip.style.display = 'none', 500);
            }, 7000);
            
            // Also hide on first card interaction
            const hideOnInteraction = () => {
                swipeTip.style.transition = 'opacity 0.3s';
                swipeTip.style.opacity = '0';
                setTimeout(() => swipeTip.style.display = 'none', 300);
                
                // Remove listeners
                document.removeEventListener('mousedown', hideOnInteraction);
                document.removeEventListener('touchstart', hideOnInteraction);
            };
            
            document.addEventListener('mousedown', hideOnInteraction, { once: true });
            document.addEventListener('touchstart', hideOnInteraction, { once: true });
        }
    },
    
    // Show matches screen
    showMatchesScreen() {
        this.hideAllScreens();
        document.getElementById('matches-screen')?.classList.remove('hidden');
        this.currentScreen = 'matches';
        
        // Display matches
        this.displayMatches();
    },
    
    // Display matched events
    displayMatches() {
        const matchesList = document.getElementById('matches-list');
        if (!matchesList) return;
        
        const matches = storage.getMatches();
        
        if (matches.length === 0) {
            matchesList.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-500">No matches yet. Start swiping to find events you like!</p>
                </div>
            `;
            return;
        }
        
        matchesList.innerHTML = matches.map((match, index) => {
            // Construct the Luma event URL
            let eventUrl = '#';
            if (match.event.url) {
                // Check if it's a full URL or just a slug
                if (match.event.url.startsWith('http')) {
                    eventUrl = match.event.url;
                } else {
                    // Construct Luma URL - format: https://lu.ma/{event_url}
                    eventUrl = `https://lu.ma/${match.event.url}`;
                }
            }
            
            return `
            <div class="match-card group cursor-pointer" 
                 data-event-id="${match.event.api_id}" 
                 data-event-url="${eventUrl}" 
                 data-match-index="${index}">
                <div class="relative overflow-hidden">
                    <img src="${match.event.cover_url || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                         alt="${match.event.name}"
                         class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                         onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span class="text-white text-sm font-medium">View on Luma</span>
                        <i class="fas fa-external-link-alt text-white"></i>
                    </div>
                </div>
                
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2 group-hover:text-purple-600 transition-colors">${match.event.name}</h3>
                    
                    <div class="text-sm text-gray-600 space-y-1">
                        <div class="flex items-center gap-1">
                            <i class="fas fa-calendar"></i>
                            <span>${events.formatEventDate(match.event.start_at)}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <i class="fas fa-location-dot"></i>
                            <span>${match.event.location_type === 'online' ? 'Virtual Event' : (match.event.geo_address_info?.city_state || 'Location TBD')}</span>
                        </div>
                    </div>
                    
                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-xs text-gray-500">
                            Matched ${this.formatRelativeTime(match.matchedAt)}
                        </span>
                        <span class="text-xs text-purple-600 font-medium">
                            <i class="fas fa-mouse-pointer mr-1"></i>
                            Click to view
                        </span>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Add click event listeners for match cards
        document.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const eventId = e.currentTarget.dataset.eventId;
                const eventUrl = e.currentTarget.dataset.eventUrl;
                const matchIndex = parseInt(e.currentTarget.dataset.matchIndex);
                
                // Find the match event data
                const match = matches[matchIndex];
                if (match && typeof webhook !== 'undefined') {
                    // Track the URL click
                    webhook.trackEventUrlClick(match, 'matches-list');
                }
                
                // Open the event URL
                if (eventUrl && eventUrl !== '#') {
                    window.open(eventUrl, '_blank');
                }
            });
        });
    },
    
    // Format relative time
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    },
    
    // Hide all screens
    hideAllScreens() {
        document.getElementById('loading-screen')?.classList.add('hidden');
        document.getElementById('auth-screen')?.classList.add('hidden');
        document.getElementById('preferences-screen')?.classList.add('hidden');
        document.getElementById('main-screen')?.classList.add('hidden');
        document.getElementById('matches-screen')?.classList.add('hidden');
    },
    
    // Show welcome page (new method)
    showWelcomePage() {
        this.hideAllScreens();
        document.getElementById('auth-screen')?.classList.remove('hidden');
        this.currentPage = 'welcome';
    },
    
    // Show home page (new method)
    showHomePage() {
        const preferences = storage.getPreferences();
        if (preferences) {
            this.showMainScreen();
        } else {
            this.showPreferencesScreen();
        }
        this.currentPage = 'home';
    },
    
    // Start matching with preferences
    async startMatching(preferences) {
        // Filter events based on preferences
        let filteredEvents = events.filterEvents(preferences);
        
        // Apply AI recommendations if available
        if (aiRecommendations.initialized) {
            console.log('🤖 Applying AI-enhanced recommendations...');
            filteredEvents = await aiRecommendations.getEnhancedRecommendations(filteredEvents);
            
            // Show AI status indicator
            this.showAIStatus(true);
        }
        
        // Load initial cards
        const initialEvents = events.getNextEvents();
        swipe.loadCards(initialEvents);
    },
    
    // Show AI status indicator
    showAIStatus(enabled) {
        const existingIndicator = document.getElementById('ai-status');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        if (!enabled) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'ai-status';
        indicator.className = 'fixed top-4 right-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-40 flex items-center gap-2';
        indicator.innerHTML = `
            <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span>AI Enhanced</span>
            <button onclick="app.showAISettings()" class="ml-2 hover:text-purple-200 transition-colors">
                <i class="fas fa-cog"></i>
            </button>
        `;
        
        document.body.appendChild(indicator);
    },
    
    // Show AI settings modal
    showAISettings() {
        const modal = document.createElement('div');
        modal.id = 'ai-settings-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50';
        
        const user = this.currentUser;
        const aiPrefs = storage.getAIPreferences() || {
            allowAIRecommendations: true,
            connectCalendar: false,
            connectSlack: false,
            connectGithub: false,
            privacyLevel: 'balanced'
        };
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 class="text-xl font-bold mb-4">AI Settings</h3>
                
                <div class="space-y-4">
                    <label class="flex items-center justify-between">
                        <span>AI Recommendations</span>
                        <input type="checkbox" ${aiPrefs.allowAIRecommendations ? 'checked' : ''} 
                               onchange="app.updateAIPreference('allowAIRecommendations', this.checked)"
                               class="toggle-checkbox">
                    </label>
                    
                    <div class="border-t pt-4">
                        <h4 class="font-semibold mb-2">Connect Services</h4>
                        
                        <button onclick="app.connectService('google')" 
                                class="w-full mb-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                            <i class="fab fa-google"></i>
                            ${user?.connectedServices?.includes('google') ? 'Connected' : 'Connect'} Google Calendar
                        </button>
                        
                        <button onclick="app.connectService('slack')" 
                                class="w-full mb-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2">
                            <i class="fab fa-slack"></i>
                            ${user?.connectedServices?.includes('slack') ? 'Connected' : 'Connect'} Slack
                        </button>
                        
                        <button onclick="app.connectService('github')" 
                                class="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
                            <i class="fab fa-github"></i>
                            ${user?.connectedServices?.includes('github') ? 'Connected' : 'Connect'} GitHub
                        </button>
                    </div>
                    
                    <div class="border-t pt-4">
                        <h4 class="font-semibold mb-2">Privacy Level</h4>
                        <select onchange="app.updateAIPreference('privacyLevel', this.value)"
                                class="w-full px-3 py-2 border rounded-lg">
                            <option value="strict" ${aiPrefs.privacyLevel === 'strict' ? 'selected' : ''}>Strict - Minimal data sharing</option>
                            <option value="balanced" ${aiPrefs.privacyLevel === 'balanced' ? 'selected' : ''}>Balanced - Recommended</option>
                            <option value="open" ${aiPrefs.privacyLevel === 'open' ? 'selected' : ''}>Open - Maximum personalization</option>
                        </select>
                    </div>
                    
                    <div class="border-t pt-4">
                        <h4 class="font-semibold mb-2">Data Management</h4>
                        
                        <div class="grid grid-cols-2 gap-2 mb-2">
                            <button onclick="app.exportUserData()" 
                                    class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                                <i class="fas fa-download"></i>
                                Export
                            </button>
                            
                            <button onclick="app.showImportDialog()" 
                                    class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-1">
                                <i class="fas fa-upload"></i>
                                Import
                            </button>
                        </div>
                        
                        <div class="text-xs text-gray-500 mb-2">
                            Export your matches and preferences as a backup file
                        </div>
                        
                        <div class="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <div>Matches: ${storage.getMatches().length}</div>
                            <div>Storage: ${storage.calculateStorageSize()} KB</div>
                        </div>
                    </div>
                </div>
                
                <button onclick="app.closeAISettings()" 
                        class="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // Close AI settings modal
    closeAISettings() {
        document.getElementById('ai-settings-modal')?.remove();
    },
    
    // Update AI preference
    updateAIPreference(key, value) {
        const prefs = storage.getAIPreferences() || {};
        prefs[key] = value;
        storage.saveAIPreferences(prefs);
        
        // Track AI preferences update
        webhook.trackAIPreferencesUpdate(prefs);
        
        // Reinitialize AI if needed
        if (key === 'allowAIRecommendations') {
            if (value) {
                aiRecommendations.init();
            } else {
                this.showAIStatus(false);
            }
        }
    },
    
    // Connect external service
    async connectService(service) {
        try {
            if (this.useAuth0GenAI) {
                await auth0GenAI.connectExternalService(service);
                
                // Update UI
                this.currentUser = await auth0GenAI.getEnhancedUser();
                this.showAISettings(); // Refresh modal
                
                // Show success message
                this.showNotification(`✅ Successfully connected to ${service}`, 'success');
            }
        } catch (error) {
            console.error(`Failed to connect ${service}:`, error);
            this.showNotification(`❌ Failed to connect to ${service}`, 'error');
        }
    },
    
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        } text-white`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transition = 'opacity 0.3s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // Export user data
    async exportUserData() {
        try {
            const userData = storage.exportUserData();
            if (!userData) {
                this.showNotification('❌ No data to export', 'error');
                return;
            }
            
            const fileName = `eventmatcher-backup-${userData.userId}-${new Date().toISOString().split('T')[0]}.json`;
            const json = JSON.stringify(userData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            // Track data export
            webhook.trackDataExport();
            
            this.showNotification('✅ Data exported successfully', 'success');
        } catch (error) {
            console.error('Failed to export user data:', error);
            this.showNotification('❌ Failed to export data', 'error');
        }
    },
    
    // Show import dialog
    showImportDialog() {
        const importModal = document.createElement('div');
        importModal.id = 'import-modal';
        importModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50';
        
        importModal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 class="text-xl font-bold mb-4">Import Data</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Select backup file (.json)
                        </label>
                        <input type="file" 
                               id="import-file-input" 
                               accept=".json"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    </div>
                    
                    <div class="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <div class="flex items-start gap-2">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mt-0.5"></i>
                            <div>
                                <strong>Warning:</strong> Importing data will replace your current matches and preferences. This action cannot be undone.
                            </div>
                        </div>
                    </div>
                    
                    <div id="import-preview" class="hidden">
                        <h4 class="font-semibold text-sm text-gray-700 mb-2">Preview:</h4>
                        <div class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg space-y-1">
                            <div>User ID: <span id="preview-user-id"></span></div>
                            <div>Matches: <span id="preview-matches"></span></div>
                            <div>Created: <span id="preview-created"></span></div>
                            <div>Version: <span id="preview-version"></span></div>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button onclick="app.closeImportDialog()" 
                            class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button onclick="app.performImport()" 
                            id="import-confirm-btn"
                            disabled
                            class="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                        Import
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(importModal);
        
        // Setup file input handler
        const fileInput = document.getElementById('import-file-input');
        const confirmBtn = document.getElementById('import-confirm-btn');
        const preview = document.getElementById('import-preview');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (this.validateImportData(data)) {
                        // Show preview
                        document.getElementById('preview-user-id').textContent = data.userId || 'Unknown';
                        document.getElementById('preview-matches').textContent = data.matches?.length || 0;
                        document.getElementById('preview-created').textContent = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown';
                        document.getElementById('preview-version').textContent = data.version || '1.0';
                        
                        preview.classList.remove('hidden');
                        confirmBtn.disabled = false;
                        
                        // Store data for import
                        this.pendingImportData = data;
                    } else {
                        throw new Error('Invalid file format');
                    }
                } catch (error) {
                    console.error('Error reading import file:', error);
                    this.showNotification('❌ Invalid backup file format', 'error');
                    preview.classList.add('hidden');
                    confirmBtn.disabled = true;
                }
            };
            reader.readAsText(file);
        });
    },
    
    // Validate import data structure
    validateImportData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Check for required fields
        const requiredFields = ['userId', 'matches', 'createdAt'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }
        
        // Validate data types
        if (!Array.isArray(data.matches)) {
            console.error('Matches must be an array');
            return false;
        }
        
        if (!Array.isArray(data.seenEvents)) {
            console.error('Seen events must be an array');
            return false;
        }
        
        return true;
    },
    
    // Perform the import
    async performImport() {
        try {
            if (!this.pendingImportData) {
                throw new Error('No data to import');
            }
            
            const success = storage.importUserData(this.pendingImportData);
            if (success) {
                // Track data import
                webhook.trackDataImport(this.pendingImportData);
                
                this.showNotification('✅ Data imported successfully', 'success');
                this.closeImportDialog();
                
                // Refresh the current view
                if (this.currentScreen === 'main') {
                    this.showMainScreen();
                } else if (this.currentScreen === 'matches') {
                    this.showMatchesScreen();
                }
                
                // Update match count
                this.updateMatchCount();
            } else {
                throw new Error('Import failed');
            }
        } catch (error) {
            console.error('Failed to import data:', error);
            this.showNotification('❌ Failed to import data', 'error');
        }
    },
    
    // Close import dialog
    closeImportDialog() {
        document.getElementById('import-modal')?.remove();
        this.pendingImportData = null;
    }
};

// Make app globally available
window.app = app;

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
} 
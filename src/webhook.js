// Webhook integration module for automatic data sending
export const webhook = {
    // Webhook configuration
    config: {
        endpoint: 'https://keboola.app.n8n.cloud/webhook/2477a8fc-1e67-45b8-9d22-45054645caaa',
        maxRetries: 3,
        retryDelay: 1000, // 1 second
        batchSize: 10,
        flushInterval: 30000 // 30 seconds
    },
    
    // Initialize webhook system
    init() {
        console.log('🌐 Initializing webhook integration...');
        
        // Initialize event queue
        this.eventQueue = [];
        this.isOnline = navigator.onLine;
        this.lastSent = Date.now();
        
        // Setup network status monitoring
        this.setupNetworkMonitoring();
        
        // Setup periodic flush
        this.setupPeriodicFlush();
        
        // Send initial session data
        this.sendEvent('session_start', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        });
        
        console.log('✅ Webhook integration initialized');
        return true;
    },
    
    // Setup network status monitoring
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            console.log('🌐 Network back online, flushing queued events');
            this.isOnline = true;
            this.flushQueue();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Network offline, queueing events');
            this.isOnline = false;
        });
    },
    
    // Setup periodic flush timer
    setupPeriodicFlush() {
        setInterval(() => {
            if (this.eventQueue.length > 0 && this.isOnline) {
                console.log(`📦 Periodic flush: ${this.eventQueue.length} events`);
                this.flushQueue();
            }
        }, this.config.flushInterval);
    },
    
    // Send event data to webhook
    async sendEvent(eventType, data, immediate = false) {
        try {
            const event = {
                id: this.generateEventId(),
                type: eventType,
                timestamp: new Date().toISOString(),
                data: data,
                user: this.getUserContext(),
                session: this.getSessionContext(),
                app: this.getAppContext()
            };
            
            console.log(`📡 Queueing event: ${eventType}`, event);
            
            // Add to queue
            this.eventQueue.push(event);
            
            // Send immediately if requested or queue is full
            if (immediate || this.eventQueue.length >= this.config.batchSize) {
                await this.flushQueue();
            }
            
            return true;
        } catch (error) {
            console.error('Error sending event:', error);
            return false;
        }
    },
    
    // Flush event queue to webhook
    async flushQueue() {
        if (this.eventQueue.length === 0 || !this.isOnline) {
            return false;
        }
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        try {
            const payload = {
                batch: true,
                events: events,
                metadata: {
                    batchSize: events.length,
                    sentAt: new Date().toISOString(),
                    source: 'event-matcher-app'
                }
            };
            
            console.log(`📡 Sending ${events.length} events to webhook...`);
            
            const success = await this.sendToWebhook(payload);
            
            if (success) {
                console.log(`✅ Successfully sent ${events.length} events`);
                this.lastSent = Date.now();
                return true;
            } else {
                // Re-queue events if failed
                this.eventQueue.unshift(...events);
                console.warn(`⚠️ Failed to send events, re-queued ${events.length} events`);
                return false;
            }
        } catch (error) {
            // Re-queue events on error
            this.eventQueue.unshift(...events);
            console.error('Error flushing queue:', error);
            return false;
        }
    },
    
    // Send payload to webhook with retry logic
    async sendToWebhook(payload, retryCount = 0) {
        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'EventMatcher/1.0'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                return true;
            } else {
                console.warn(`Webhook responded with status: ${response.status}`);
                
                // Retry on 5xx errors
                if (response.status >= 500 && retryCount < this.config.maxRetries) {
                    await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
                    return this.sendToWebhook(payload, retryCount + 1);
                }
                
                return false;
            }
        } catch (error) {
            console.error('Webhook request failed:', error);
            
            // Retry on network errors
            if (retryCount < this.config.maxRetries) {
                await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
                return this.sendToWebhook(payload, retryCount + 1);
            }
            
            return false;
        }
    },
    
    // Generate unique event ID
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Get user context information
    getUserContext() {
        try {
            const user = JSON.parse(localStorage.getItem('eventMatcher_user'));
            const userData = JSON.parse(localStorage.getItem(`eventMatcher_userData_${this.getCurrentUserId()}`));
            
            return {
                id: this.getCurrentUserId(),
                type: this.getCurrentUserId().startsWith('guest') ? 'guest' : 'authenticated',
                profile: user ? {
                    name: user.name,
                    email: user.email,
                    provider: user.provider
                } : null,
                stats: userData ? {
                    matches: userData.matches?.length || 0,
                    seenEvents: userData.seenEvents?.length || 0,
                    accountAge: Math.floor((new Date() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24))
                } : null
            };
        } catch (error) {
            console.error('Error getting user context:', error);
            return { id: 'unknown', type: 'unknown' };
        }
    },
    
    // Get current user ID (same logic as storage module)
    getCurrentUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('eventMatcher_user'));
            if (!user) return 'guest';
            
            if (user.email) return `email_${user.email}`;
            if (user.sub) return `auth0_${user.sub}`;
            if (user.id) return `google_${user.id}`;
            
            const guestId = localStorage.getItem('eventMatcher_guestId');
            if (guestId) return guestId;
            
            return 'guest';
        } catch (error) {
            return 'guest';
        }
    },
    
    // Get session context
    getSessionContext() {
        return {
            startTime: this.sessionStartTime || new Date().toISOString(),
            duration: Date.now() - (this.sessionStartTime || Date.now()),
            pageViews: this.pageViews || 1,
            lastActivity: new Date().toISOString()
        };
    },
    
    // Get app context
    getAppContext() {
        return {
            version: '1.0',
            name: 'Event Matcher',
            url: window.location.href,
            userAgent: navigator.userAgent,
            screen: {
                width: screen.width,
                height: screen.height
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    },
    
    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Track user match
    trackMatch(event, actionType = 'like') {
        // Log comprehensive data for debugging
        this.logEventDataSummary(event, actionType);
        
        // Build complete event URL
        const eventUrl = this.buildEventUrl(event);

        this.sendEvent('match_created', {
            // Event identifiers
            eventId: event.api_id,
            eventSlug: event.event?.url,
            eventUrl: eventUrl,
            
            // Event basic info
            eventName: event.event?.name,
            eventDescription: event.calendar?.description_short,
            
            // Event timing
            eventDate: event.event?.start_at,
            eventEndDate: event.event?.end_at,
            duration: this.calculateEventDuration(event.event?.start_at, event.event?.end_at),
            
            // Event location & format
            eventType: event.event?.location_type,
            location: event.event?.geo_address_info?.city_state,
            virtualInfo: event.event?.virtual_info,
            
            // Organizer info
            organizerName: event.calendar?.name,
            organizerAvatar: event.calendar?.avatar_url,
            
            // Event media
            coverImage: event.event?.cover_url,
            
            // Interaction details
            action: actionType, // 'like' or 'super-like'
            matchScore: event.matchScore,
            matchReasons: event.matchDetails,
            
            // Additional metadata
            timestamp: new Date().toISOString(),
            source: 'event-matcher-swipe'
        });
    },
    
    // Track event seen
    trackEventSeen(event, action = 'swipe') {
        // Log comprehensive data for debugging
        this.logEventDataSummary(event, action);
        
        // Build complete event URL
        const eventUrl = this.buildEventUrl(event);

        this.sendEvent('event_seen', {
            // Event identifiers
            eventId: event.api_id,
            eventSlug: event.event?.url,
            eventUrl: eventUrl,
            
            // Event basic info
            eventName: event.event?.name,
            eventDescription: event.calendar?.description_short,
            
            // Event timing
            eventDate: event.event?.start_at,
            eventEndDate: event.event?.end_at,
            duration: this.calculateEventDuration(event.event?.start_at, event.event?.end_at),
            
            // Event location & format
            eventType: event.event?.location_type,
            location: event.event?.geo_address_info?.city_state,
            virtualInfo: event.event?.virtual_info,
            
            // Organizer info
            organizerName: event.calendar?.name,
            organizerAvatar: event.calendar?.avatar_url,
            
            // Event media
            coverImage: event.event?.cover_url,
            
            // Interaction details
            action: action,
            matchScore: event.matchScore,
            matchReasons: event.matchDetails,
            
            // Additional metadata
            timestamp: new Date().toISOString(),
            source: 'event-matcher-swipe'
        });
    },
    
    // Calculate event duration helper
    calculateEventDuration(startAt, endAt) {
        if (!startAt || !endAt) return null;
        
        try {
            const start = new Date(startAt);
            const end = new Date(endAt);
            const durationMs = end - start;
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        } catch (error) {
            console.warn('Error calculating event duration:', error);
            return null;
        }
    },
    
    // Track user preferences update
    trackPreferencesUpdate(preferences) {
        this.sendEvent('preferences_updated', {
            interests: preferences.interests,
            format: preferences.format,
            location: preferences.location,
            hasName: !!preferences.name,
            hasOccupation: !!preferences.occupation
        });
    },
    
    // Track AI preferences update
    trackAIPreferencesUpdate(aiPreferences) {
        this.sendEvent('ai_preferences_updated', {
            allowAIRecommendations: aiPreferences.allowAIRecommendations,
            privacyLevel: aiPreferences.privacyLevel,
            connectedServices: Object.keys(aiPreferences).filter(key => 
                key.startsWith('connect') && aiPreferences[key]
            )
        });
    },
    
    // Track authentication
    trackAuthentication(user) {
        this.sendEvent('user_authenticated', {
            provider: user.provider,
            userType: user.provider === 'guest' ? 'guest' : 'authenticated',
            hasProfile: !!(user.name || user.email)
        });
    },
    
    // Track session end
    trackSessionEnd() {
        this.sendEvent('session_end', {
            duration: Date.now() - (this.sessionStartTime || Date.now()),
            eventsInQueue: this.eventQueue.length
        }, true); // Send immediately
    },
    
    // Track data export
    trackDataExport() {
        this.sendEvent('data_exported', {
            action: 'user_data_export',
            timestamp: new Date().toISOString()
        });
    },
    
    // Track data import
    trackDataImport(importData) {
        this.sendEvent('data_imported', {
            action: 'user_data_import',
            matchesCount: importData.matches?.length || 0,
            hasPreferences: !!importData.preferences,
            timestamp: new Date().toISOString()
        });
    },
    
    // Track event URL click
    trackEventUrlClick(event, source = 'card') {
        // Log comprehensive data for debugging
        this.logEventDataSummary(event, 'url-click');
        
        // Build complete event URL
        const eventUrl = this.buildEventUrl(event);

        this.sendEvent('event_url_clicked', {
            // Event identifiers
            eventId: event.api_id,
            eventSlug: event.event?.url,
            eventUrl: eventUrl,
            
            // Event basic info
            eventName: event.event?.name,
            eventType: event.event?.location_type,
            organizerName: event.calendar?.name,
            
            // Click details
            clickSource: source, // 'card', 'matches-list', etc.
            matchScore: event.matchScore,
            
            // Additional metadata
            timestamp: new Date().toISOString(),
            source: 'event-matcher-url-click'
        });
    },
    
    // Development helper: Log comprehensive event data summary
    logEventDataSummary(event, actionType = 'unknown') {
        if (typeof console !== 'undefined' && console.log) {
            console.log('🔍 Event Data Summary for Webhook:', {
                eventIdentifiers: {
                    eventId: event.api_id,
                    eventSlug: event.event?.url,
                    eventUrl: this.buildEventUrl(event)
                },
                eventBasicInfo: {
                    name: event.event?.name,
                    description: event.calendar?.description_short,
                    organizer: event.calendar?.name
                },
                eventTiming: {
                    startDate: event.event?.start_at,
                    endDate: event.event?.end_at,
                    duration: this.calculateEventDuration(event.event?.start_at, event.event?.end_at)
                },
                eventLocation: {
                    type: event.event?.location_type,
                    location: event.event?.geo_address_info?.city_state,
                    virtualInfo: event.event?.virtual_info
                },
                eventMedia: {
                    coverImage: event.event?.cover_url,
                    organizerAvatar: event.calendar?.avatar_url
                },
                matchingData: {
                    action: actionType,
                    matchScore: event.matchScore,
                    matchReasons: event.matchDetails
                }
            });
        }
    },

    // Helper to build event URL
    buildEventUrl(event) {
        if (!event.event?.url) return null;
        
        if (event.event.url.startsWith('http')) {
            return event.event.url;
        } else {
            return `https://lu.ma/${event.event.url}`;
        }
    },
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (webhook.eventQueue && webhook.eventQueue.length > 0) {
        webhook.trackSessionEnd();
        webhook.flushQueue();
    }
}); 
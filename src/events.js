import { config } from './config.js';
import { storage } from './storage.js';

// Events module for managing event data and matching
export const events = {
    allEvents: [],
    filteredEvents: [],
    currentIndex: 0,
    
    // Load events from JSON file
    async loadEvents() {
        try {
            // Try to fetch from Apify API first
            if (config.apify.apiToken && (config.apify.runId || config.apify.actorId)) {
                console.log('🔄 Fetching events from Apify API...');
                
                // Show loading indicator
                this.showLoadingIndicator('Fetching live data from Apify...');
                
                let apiUrl;
                
                if (config.apify.runId) {
                    // Use specific run ID
                    apiUrl = `${config.apify.baseUrl}/actor-runs/${config.apify.runId}/dataset/items`;
                    console.log(`📡 Using specific run ID: ${config.apify.runId}`);
                } else if (config.apify.actorId) {
                    // Use latest run from actor
                    apiUrl = `${config.apify.baseUrl}/acts/${config.apify.actorId}/runs/last/dataset/items?status=SUCCEEDED`;
                    console.log(`📡 Fetching latest successful run from actor: ${config.apify.actorId}`);
                }
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${config.apify.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = `Apify API error: ${response.status}`;
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.error?.message || errorMessage;
                    } catch (e) {
                        // Ignore JSON parse error
                    }
                    
                    throw new Error(errorMessage);
                }
                
                const data = await response.json();
                
                // Validate data structure
                if (!Array.isArray(data)) {
                    throw new Error('Invalid data format: expected array of events');
                }
                
                this.allEvents = data;
                console.log(`✅ Successfully loaded ${this.allEvents.length} events from Apify API`);
                
                // Display event count in UI
                this.displayEventCount('Apify API');
                
                // Hide loading indicator
                this.hideLoadingIndicator();
                
                // Cache the data locally for offline use
                this.cacheEventsLocally(data);
                
                return true;
            }
        } catch (error) {
            console.error('Error loading from Apify:', error);
            this.hideLoadingIndicator();
            
            // Show error notification
            this.showErrorNotification(error.message);
            
            // Try fallback to local file if enabled
            if (config.apify.useLocalFallback) {
                console.log('⚠️ Falling back to local JSON file...');
                return this.loadLocalEvents();
            }
        }
        
        // Default to local loading if Apify not configured
        return this.loadLocalEvents();
    },
    
    // Load events from local JSON file
    async loadLocalEvents() {
        try {
            const response = await fetch('../../input/dataset_lu-ma-scraper_2025-05-30_19-40-10-360.json');
            const data = await response.json();
            this.allEvents = data;
            console.log(`✅ Successfully loaded ${this.allEvents.length} events from local JSON file`);
            
            // Display event count in UI
            this.displayEventCount('Local File');
            
            return true;
        } catch (error) {
            console.error('Error loading local events:', error);
            // Fallback to sample data
            this.allEvents = this.getSampleEvents();
            console.log(`⚠️ Using ${this.allEvents.length} sample events (failed to load JSON)`);
            
            this.displayEventCount('Sample Data');
            
            return false;
        }
    },
    
    // Show loading indicator
    showLoadingIndicator(message = 'Loading events...') {
        const existingLoader = document.getElementById('api-loader');
        if (existingLoader) {
            existingLoader.remove();
        }
        
        const loader = document.createElement('div');
        loader.id = 'api-loader';
        loader.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 z-50 text-center';
        loader.innerHTML = `
            <div class="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <p class="text-lg font-semibold text-gray-700">${message}</p>
            <p class="text-sm text-gray-500 mt-2">This may take a moment...</p>
        `;
        
        document.body.appendChild(loader);
    },
    
    // Hide loading indicator
    hideLoadingIndicator() {
        const loader = document.getElementById('api-loader');
        if (loader) {
            loader.style.transition = 'opacity 0.3s';
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    },
    
    // Display event count in the UI
    displayEventCount(source = 'Unknown') {
        // Create or update event count display
        const existingCounter = document.getElementById('event-counter');
        if (existingCounter) {
            existingCounter.remove();
        }
        
        const counter = document.createElement('div');
        counter.id = 'event-counter';
        counter.className = 'fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-40';
        counter.innerHTML = `
            <i class="fas fa-calendar-check mr-2"></i>
            ${this.allEvents.length} events loaded
            <span class="text-xs opacity-75 ml-1">(${source})</span>
        `;
        
        document.body.appendChild(counter);
        
        // Hide after 5 seconds
        setTimeout(() => {
            counter.style.transition = 'opacity 0.5s';
            counter.style.opacity = '0';
            setTimeout(() => counter.remove(), 500);
        }, 5000);
    },
    
    // Get sample events for testing
    getSampleEvents() {
        return [
            {
                api_id: "evt-sample-1",
                event: {
                    name: "Tech Innovation Summit 2025",
                    cover_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                    start_at: "2025-06-15T09:00:00.000Z",
                    end_at: "2025-06-15T18:00:00.000Z",
                    location_type: "offline",
                    geo_address_info: {
                        city_state: "San Francisco, California"
                    }
                },
                calendar: {
                    name: "Tech Events SF",
                    avatar_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200",
                    description_short: "Bringing together tech innovators and entrepreneurs"
                }
            },
            {
                api_id: "evt-sample-2",
                event: {
                    name: "Virtual Design Workshop",
                    cover_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
                    start_at: "2025-06-20T14:00:00.000Z",
                    end_at: "2025-06-20T16:00:00.000Z",
                    location_type: "online",
                    virtual_info: {
                        has_access: true
                    }
                },
                calendar: {
                    name: "Creative Minds",
                    avatar_url: "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=200",
                    description_short: "Learn from the best designers in the industry"
                }
            },
            {
                api_id: "evt-sample-3",
                event: {
                    name: "Startup Networking Night",
                    cover_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
                    start_at: "2025-06-25T18:00:00.000Z",
                    end_at: "2025-06-25T21:00:00.000Z",
                    location_type: "offline",
                    geo_address_info: {
                        city_state: "New York, New York"
                    }
                },
                calendar: {
                    name: "Startup Hub NYC",
                    avatar_url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=200",
                    description_short: "Connect with fellow entrepreneurs and investors"
                }
            }
        ];
    },
    
    // Get match reasons for an event
    getMatchReasons(event) {
        const preferences = storage.getPreferences();
        if (!preferences || !event.matchDetails) return [];
        
        const reasons = [];
        const { matchDetails } = event;
        
        // Check each matching criterion
        if (matchDetails.occupationMatch) {
            reasons.push(config.matchReasons.occupation);
        }
        
        if (matchDetails.interestsMatch && matchDetails.interestsMatch.length > 0) {
            reasons.push({
                ...config.matchReasons.interests,
                label: `${config.matchReasons.interests.label}: ${matchDetails.interestsMatch.join(', ')}`
            });
        }
        
        if (matchDetails.locationMatch) {
            reasons.push(config.matchReasons.location);
        }
        
        if (matchDetails.formatMatch) {
            reasons.push(config.matchReasons.format);
        }
        
        return reasons;
    },
    
    // Calculate match score based on user preferences (enhanced version)
    calculateMatchScore(event, preferences) {
        let score = 0;
        const weights = config.matchingWeights;
        const matchDetails = {
            occupationMatch: false,
            interestsMatch: [],
            locationMatch: false,
            formatMatch: false
        };
        
        // Check event format preference
        if (preferences.format) {
            if (preferences.format === 'both' || 
                (preferences.format === 'in-person' && event.event.location_type === 'offline') ||
                (preferences.format === 'virtual' && event.event.location_type === 'online')) {
                score += weights.format;
                matchDetails.formatMatch = true;
            }
        }
        
        // Check location match (for in-person events)
        if (preferences.location && event.event.location_type === 'offline') {
            const eventLocation = event.event.geo_address_info?.city_state || '';
            if (eventLocation.toLowerCase().includes(preferences.location.toLowerCase())) {
                score += weights.location;
                matchDetails.locationMatch = true;
            }
        }
        
        // Check interests match (simplified - checks event/calendar names and descriptions)
        if (preferences.interests && preferences.interests.length > 0) {
            const eventText = `${event.event.name} ${event.calendar.name} ${event.calendar.description_short || ''}`.toLowerCase();
            
            const interestKeywords = {
                tech: ['tech', 'software', 'developer', 'innovation', 'code', 'programming', 'ai', 'data', 'hackathon'],
                business: ['business', 'entrepreneur', 'startup', 'investor', 'venture', 'growth', 'founder'],
                arts: ['art', 'design', 'creative', 'culture', 'music', 'gallery', 'exhibition'],
                networking: ['network', 'connect', 'meetup', 'social', 'community', 'mixer'],
                education: ['learn', 'workshop', 'course', 'training', 'seminar', 'tutorial', 'bootcamp'],
                health: ['health', 'wellness', 'fitness', 'mindfulness', 'yoga', 'meditation', 'wellbeing']
            };
            
            preferences.interests.forEach(interest => {
                const keywords = interestKeywords[interest] || [];
                if (keywords.some(keyword => eventText.includes(keyword))) {
                    matchDetails.interestsMatch.push(interest.charAt(0).toUpperCase() + interest.slice(1));
                }
            });
            
            if (matchDetails.interestsMatch.length > 0) {
                score += weights.interests * (matchDetails.interestsMatch.length / preferences.interests.length);
            }
        }
        
        // Occupation match (simplified)
        if (preferences.occupation) {
            const eventText = `${event.event.name} ${event.calendar.name} ${event.calendar.description_short || ''}`.toLowerCase();
            const occupationKeywords = {
                student: ['student', 'university', 'college', 'academic', 'education', 'campus'],
                developer: ['developer', 'software', 'code', 'programming', 'tech', 'engineer', 'hackathon'],
                designer: ['design', 'creative', 'ux', 'ui', 'graphic', 'visual', 'art'],
                pm: ['product', 'manager', 'management', 'strategy', 'leadership', 'agile'],
                entrepreneur: ['entrepreneur', 'startup', 'founder', 'business', 'venture', 'pitch'],
                marketing: ['marketing', 'growth', 'brand', 'social', 'content', 'digital', 'seo']
            };
            
            const keywords = occupationKeywords[preferences.occupation] || [];
            if (keywords.some(keyword => eventText.includes(keyword))) {
                score += weights.occupation;
                matchDetails.occupationMatch = true;
            }
        }
        
        // Store match details in the event
        event.matchDetails = matchDetails;
        
        return score;
    },
    
    // Filter and sort events based on user preferences
    filterEvents(preferences) {
        const seenEvents = storage.getSeenEvents();
        
        // Filter out seen events
        let unseenEvents = this.allEvents.filter(event => 
            !seenEvents.includes(event.api_id)
        );
        
        console.log(`📊 Filtering events: ${this.allEvents.length} total, ${seenEvents.length} seen, ${unseenEvents.length} remaining`);
        
        // Score and sort events
        const scoredEvents = unseenEvents.map(event => ({
            ...event,
            matchScore: this.calculateMatchScore(event, preferences)
        }));
        
        // Sort by match score (highest first)
        scoredEvents.sort((a, b) => b.matchScore - a.matchScore);
        
        this.filteredEvents = scoredEvents;
        this.currentIndex = 0;
        
        // Log match distribution
        const highMatches = scoredEvents.filter(e => e.matchScore > 0.7).length;
        const mediumMatches = scoredEvents.filter(e => e.matchScore > 0.4 && e.matchScore <= 0.7).length;
        const lowMatches = scoredEvents.filter(e => e.matchScore <= 0.4).length;
        
        console.log(`🎯 Match distribution: ${highMatches} high (>70%), ${mediumMatches} medium (40-70%), ${lowMatches} low (<40%)`);
        
        return this.filteredEvents;
    },
    
    // Get next batch of events
    getNextEvents(count = config.ui.cardsToShow) {
        const events = [];
        for (let i = 0; i < count && this.currentIndex < this.filteredEvents.length; i++) {
            events.push(this.filteredEvents[this.currentIndex + i]);
        }
        return events;
    },
    
    // Mark event as seen
    markEventSeen(eventId) {
        storage.addSeenEvent(eventId);
        this.currentIndex++;
    },
    
    // Get event by ID
    getEventById(eventId) {
        return this.allEvents.find(event => event.api_id === eventId);
    },
    
    // Format event date
    formatEventDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    },
    
    // Get event duration
    getEventDuration(startAt, endAt) {
        const start = new Date(startAt);
        const end = new Date(endAt);
        const durationMs = end - start;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${minutes}m`;
        }
    },
    
    // Cache events locally for offline use
    cacheEventsLocally(events) {
        try {
            const cacheKey = 'eventMatcher_cachedEvents';
            const cacheData = {
                events: events,
                cachedAt: new Date().toISOString(),
                source: 'Apify API'
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log('💾 Events cached locally for offline use');
        } catch (error) {
            console.warn('Failed to cache events:', error);
        }
    },
    
    // Load cached events
    loadCachedEvents() {
        try {
            const cacheKey = 'eventMatcher_cachedEvents';
            const cachedData = localStorage.getItem(cacheKey);
            
            if (cachedData) {
                const { events, cachedAt } = JSON.parse(cachedData);
                const cacheAge = Date.now() - new Date(cachedAt).getTime();
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (cacheAge < maxAge && Array.isArray(events)) {
                    this.allEvents = events;
                    console.log(`📦 Loaded ${events.length} cached events (cached ${Math.round(cacheAge / 1000 / 60)} minutes ago)`);
                    this.displayEventCount('Cached');
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load cached events:', error);
        }
        return false;
    },
    
    // Show error notification
    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-3"></i>
                <div>
                    <p class="font-semibold">API Error</p>
                    <p class="text-sm">${message}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Hide after 5 seconds
        setTimeout(() => {
            notification.style.transition = 'opacity 0.3s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}; 
import { auth0GenAI } from './auth0-genai.js';
import { storage } from './storage.js';
import { events } from './events.js';

// AI-powered recommendations module
export const aiRecommendations = {
    initialized: false,
    userProfile: null,
    
    // Initialize AI recommendations
    async init() {
        try {
            // Check if user has AI features enabled
            const user = await auth0GenAI.getEnhancedUser();
            if (!user || !user.aiPreferences.allowAIRecommendations) {
                console.log('🤖 AI recommendations disabled by user');
                return false;
            }
            
            this.userProfile = user;
            this.initialized = true;
            
            // Connect to Google Calendar if authorized
            if (user.aiPreferences.connectCalendar) {
                await this.connectGoogleCalendar();
            }
            
            console.log('✅ AI recommendations initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize AI recommendations:', error);
            return false;
        }
    },
    
    // Connect Google Calendar for availability checking
    async connectGoogleCalendar() {
        try {
            const token = await auth0GenAI.connectExternalService('google', [
                'https://www.googleapis.com/auth/calendar.events.readonly'
            ]);
            
            console.log('📅 Google Calendar connected for AI recommendations');
            return token;
        } catch (error) {
            console.error('Failed to connect Google Calendar:', error);
            return null;
        }
    },
    
    // Get AI-enhanced event recommendations
    async getEnhancedRecommendations(eventsList) {
        if (!this.initialized || !eventsList.length) {
            return eventsList;
        }
        
        try {
            // Get user's calendar availability
            const availability = await this.checkCalendarAvailability(eventsList);
            
            // Get user's social connections
            const socialData = await this.getSocialRecommendations();
            
            // Enhance events with AI scoring
            const enhancedEvents = await Promise.all(
                eventsList.map(async (event) => {
                    const aiScore = await this.calculateAIScore(event, {
                        availability,
                        socialData,
                        userProfile: this.userProfile
                    });
                    
                    return {
                        ...event,
                        aiScore,
                        aiReasons: this.getAIReasons(aiScore)
                    };
                })
            );
            
            // Sort by combined score (match score + AI score)
            enhancedEvents.sort((a, b) => {
                const scoreA = (a.matchScore || 0) * 0.6 + (a.aiScore.total || 0) * 0.4;
                const scoreB = (b.matchScore || 0) * 0.6 + (b.aiScore.total || 0) * 0.4;
                return scoreB - scoreA;
            });
            
            return enhancedEvents;
        } catch (error) {
            console.error('Failed to get enhanced recommendations:', error);
            return eventsList;
        }
    },
    
    // Check calendar availability for events
    async checkCalendarAvailability(eventsList) {
        if (!this.userProfile.connectedServices.includes('google')) {
            return {};
        }
        
        try {
            const token = await auth0GenAI.getServiceToken('google');
            
            // Get busy times from Google Calendar
            const startTime = new Date().toISOString();
            const endTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days
            
            // In production, this would call Google Calendar API
            // For now, simulate availability check
            const busyTimes = await this.simulateCalendarCheck(startTime, endTime);
            
            // Check each event against busy times
            const availability = {};
            eventsList.forEach(event => {
                const eventStart = new Date(event.event.start_at);
                const eventEnd = new Date(event.event.end_at);
                
                const isAvailable = !busyTimes.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    return (eventStart >= busyStart && eventStart < busyEnd) ||
                           (eventEnd > busyStart && eventEnd <= busyEnd);
                });
                
                availability[event.api_id] = isAvailable;
            });
            
            return availability;
        } catch (error) {
            console.error('Failed to check calendar availability:', error);
            return {};
        }
    },
    
    // Get social recommendations (friends attending, etc.)
    async getSocialRecommendations() {
        // Check if user has connected social accounts
        const connectedSocial = this.userProfile.connectedServices.filter(service => 
            ['github', 'slack'].includes(service)
        );
        
        if (connectedSocial.length === 0) {
            return {};
        }
        
        try {
            // In production, this would fetch data from connected services
            // For now, simulate social data
            return {
                friendsAttending: this.simulateFriendsData(),
                communityInterest: this.simulateCommunityInterest()
            };
        } catch (error) {
            console.error('Failed to get social recommendations:', error);
            return {};
        }
    },
    
    // Calculate AI-enhanced score for an event
    async calculateAIScore(event, context) {
        const scores = {
            availability: 0,
            social: 0,
            timing: 0,
            trending: 0,
            personalization: 0
        };
        
        // Availability score
        if (context.availability[event.api_id] !== undefined) {
            scores.availability = context.availability[event.api_id] ? 1.0 : 0.2;
        }
        
        // Social score
        if (context.socialData.friendsAttending) {
            const friendCount = context.socialData.friendsAttending[event.api_id] || 0;
            scores.social = Math.min(friendCount * 0.2, 1.0);
        }
        
        // Timing score (prefer events not too far in the future)
        const daysUntilEvent = Math.floor(
            (new Date(event.event.start_at) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilEvent <= 7) {
            scores.timing = 1.0;
        } else if (daysUntilEvent <= 30) {
            scores.timing = 0.7;
        } else {
            scores.timing = 0.4;
        }
        
        // Trending score (based on community interest)
        if (context.socialData.communityInterest) {
            const interest = context.socialData.communityInterest[event.api_id] || 0;
            scores.trending = Math.min(interest / 100, 1.0);
        }
        
        // Personalization score (based on past behavior)
        scores.personalization = await this.getPersonalizationScore(event);
        
        // Calculate total score (weighted average)
        scores.total = (
            scores.availability * 0.3 +
            scores.social * 0.2 +
            scores.timing * 0.2 +
            scores.trending * 0.15 +
            scores.personalization * 0.15
        );
        
        return scores;
    },
    
    // Get personalization score based on user's history
    async getPersonalizationScore(event) {
        const matches = storage.getMatches();
        const analytics = storage.getAnalytics();
        
        // Analyze past matches for patterns
        const matchPatterns = {
            preferredDays: {},
            preferredTimes: {},
            preferredHosts: new Set()
        };
        
        matches.forEach(match => {
            if (match.event) {
                const date = new Date(match.event.start_at);
                const day = date.getDay();
                const hour = date.getHours();
                
                matchPatterns.preferredDays[day] = (matchPatterns.preferredDays[day] || 0) + 1;
                matchPatterns.preferredTimes[hour] = (matchPatterns.preferredTimes[hour] || 0) + 1;
                
                if (match.calendar?.name) {
                    matchPatterns.preferredHosts.add(match.calendar.name);
                }
            }
        });
        
        let score = 0;
        
        // Check if event matches preferred patterns
        const eventDate = new Date(event.event.start_at);
        const eventDay = eventDate.getDay();
        const eventHour = eventDate.getHours();
        
        if (matchPatterns.preferredDays[eventDay]) {
            score += 0.3;
        }
        
        if (matchPatterns.preferredTimes[eventHour]) {
            score += 0.3;
        }
        
        if (matchPatterns.preferredHosts.has(event.calendar.name)) {
            score += 0.4;
        }
        
        return Math.min(score, 1.0);
    },
    
    // Get AI reasons for recommendation
    getAIReasons(aiScore) {
        const reasons = [];
        
        if (aiScore.availability >= 0.8) {
            reasons.push({
                icon: '📅',
                label: 'Free on your calendar',
                score: aiScore.availability
            });
        }
        
        if (aiScore.social >= 0.5) {
            reasons.push({
                icon: '👥',
                label: 'Friends attending',
                score: aiScore.social
            });
        }
        
        if (aiScore.timing >= 0.8) {
            reasons.push({
                icon: '⏰',
                label: 'Coming up soon',
                score: aiScore.timing
            });
        }
        
        if (aiScore.trending >= 0.6) {
            reasons.push({
                icon: '🔥',
                label: 'Trending in community',
                score: aiScore.trending
            });
        }
        
        if (aiScore.personalization >= 0.7) {
            reasons.push({
                icon: '✨',
                label: 'Matches your interests',
                score: aiScore.personalization
            });
        }
        
        return reasons;
    },
    
    // Request async authorization for calendar access
    async requestCalendarAccess() {
        try {
            const requestId = await auth0GenAI.requestAsyncAuthorization(
                'access_google_calendar',
                {
                    purpose: 'Check your availability for event recommendations',
                    scopes: ['calendar.events.readonly']
                }
            );
            
            console.log('📱 Calendar access authorization requested:', requestId);
            
            // Poll for authorization status
            return this.pollAuthorizationStatus(requestId);
        } catch (error) {
            console.error('Failed to request calendar access:', error);
            throw error;
        }
    },
    
    // Poll for authorization status
    async pollAuthorizationStatus(requestId, maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            const status = await auth0GenAI.checkAuthorizationStatus(requestId);
            
            if (status.status === 'approved') {
                return true;
            } else if (status.status === 'denied') {
                return false;
            }
            
            // Wait 2 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        throw new Error('Authorization timeout');
    },
    
    // Simulate calendar check (for demo purposes)
    simulateCalendarCheck(startTime, endTime) {
        // Simulate some busy times
        const busyTimes = [];
        const now = new Date();
        
        // Add some random busy slots
        for (let i = 0; i < 5; i++) {
            const start = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
            const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hour slots
            
            busyTimes.push({
                start: start.toISOString(),
                end: end.toISOString()
            });
        }
        
        return busyTimes;
    },
    
    // Simulate friends data (for demo purposes)
    simulateFriendsData() {
        const friendsData = {};
        
        // Randomly assign friend counts to some events
        events.allEvents.slice(0, 10).forEach((event, index) => {
            if (Math.random() > 0.6) {
                friendsData[event.api_id] = Math.floor(Math.random() * 5) + 1;
            }
        });
        
        return friendsData;
    },
    
    // Simulate community interest (for demo purposes)
    simulateCommunityInterest() {
        const interestData = {};
        
        // Randomly assign interest scores
        events.allEvents.forEach(event => {
            interestData[event.api_id] = Math.floor(Math.random() * 100);
        });
        
        return interestData;
    }
}; 
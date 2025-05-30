import { config } from './config.js';
import { storage } from './storage.js';
import { events } from './events.js';
import { webhook } from './webhook.js';

// Swipe module for handling card interactions
export const swipe = {
    cardStack: null,
    currentCard: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    
    // Initialize swipe functionality
    init() {
        this.cardStack = document.getElementById('card-stack');
        this.setupActionButtons();
    },
    
    // Create event card element
    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.eventId = event.api_id;
        
        // Add event URL to dataset
        if (event.event.url) {
            card.dataset.eventUrl = event.event.url;
        }
        
        // Format event data
        const startDate = events.formatEventDate(event.event.start_at);
        const duration = events.getEventDuration(event.event.start_at, event.event.end_at);
        const location = event.event.location_type === 'online' ? 
            'Virtual Event' : 
            (event.event.geo_address_info?.city_state || 'Location TBD');
        
        // Get match reasons
        const matchReasons = events.getMatchReasons(event);
        const matchScore = event.matchScore || 0;
        
        // Build Luma event URL
        const lumaUrl = event.event.url ? `https://lu.ma/${event.event.url}` : null;
        
        card.innerHTML = `
            <img src="${event.event.cover_url || 'https://via.placeholder.com/400x600?text=No+Image'}" 
                 alt="${event.event.name}" 
                 class="event-image"
                 onerror="this.src='https://via.placeholder.com/400x600?text=No+Image'"
                 loading="lazy">
            
            ${matchScore > 0 ? `
                <div class="match-score-badge">
                    <i class="fas fa-fire"></i>
                    ${Math.round(matchScore * 100)}% Match
                </div>
            ` : ''}
            
            <div class="event-info">
                <h3 class="event-title">${event.event.name}</h3>
                
                <div class="event-meta">
                    <div class="event-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${startDate}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${duration}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-location-dot"></i>
                        <span>${location}</span>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 mb-3">
                    <img src="${event.calendar.avatar_url || 'https://via.placeholder.com/40'}" 
                         alt="${event.calendar.name}"
                         class="w-8 h-8 rounded-full"
                         onerror="this.src='https://via.placeholder.com/40'"
                         loading="lazy">
                    <span class="text-sm text-gray-600 font-medium">${event.calendar.name}</span>
                </div>
                
                <p class="event-description">
                    ${event.calendar.description_short || 'No description available'}
                </p>
                
                ${matchReasons.length > 0 ? `
                    <div class="match-reasons">
                        ${matchReasons.map(reason => `
                            <div class="match-reason">
                                <span>${reason.icon}</span>
                                <span>${reason.label}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${lumaUrl ? `
                    <div class="event-actions mt-4">
                        <a href="${lumaUrl}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="luma-link"
                           onclick="event.stopPropagation();">
                            <i class="fas fa-external-link-alt"></i>
                            View on Luma
                        </a>
                    </div>
                ` : ''}
            </div>
            
            <!-- Choice labels -->
            <div class="choice-label nope-label">NOPE</div>
            <div class="choice-label like-label">LIKE</div>
            <div class="choice-label super-label">SUPER</div>
        `;
        
        // Add event listeners
        this.setupCardListeners(card);
        
        // Add click tracking for Luma links
        const lumaLink = card.querySelector('.luma-link');
        if (lumaLink) {
            lumaLink.addEventListener('click', (e) => {
                e.stopPropagation();
                // Track the URL click
                if (typeof webhook !== 'undefined') {
                    webhook.trackEventUrlClick(event, 'card');
                }
            });
        }
        
        return card;
    },
    
    // Setup card event listeners
    setupCardListeners(card) {
        // Mouse events
        card.addEventListener('mousedown', (e) => this.handleStart(e));
        card.addEventListener('mousemove', (e) => this.handleMove(e));
        card.addEventListener('mouseup', (e) => this.handleEnd(e));
        card.addEventListener('mouseleave', (e) => this.handleEnd(e));
        
        // Touch events
        card.addEventListener('touchstart', (e) => this.handleStart(e.touches[0]));
        card.addEventListener('touchmove', (e) => this.handleMove(e.touches[0]));
        card.addEventListener('touchend', (e) => this.handleEnd(e));
    },
    
    // Handle drag start
    handleStart(e) {
        if (this.currentCard) return;
        
        const card = e.target.closest('.event-card');
        if (!card || !card.parentElement) return;
        
        // Only allow dragging the top card
        if (card !== card.parentElement.firstElementChild) return;
        
        this.isDragging = true;
        this.currentCard = card;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = 0;
        this.currentY = 0;
        this.startTime = Date.now();
        
        card.classList.add('dragging');
    },
    
    // Handle drag move
    handleMove(e) {
        if (!this.isDragging || !this.currentCard) return;
        
        e.preventDefault();
        
        this.currentX = e.clientX - this.startX;
        this.currentY = e.clientY - this.startY;
        
        // Apply transform with enhanced rotation for better visual feedback
        const rotation = this.currentX * 0.2; // Increased rotation for better feedback
        this.currentCard.style.transform = `translate(${this.currentX}px, ${this.currentY}px) rotate(${rotation}deg)`;
        
        // Scale card slightly when dragging for better feedback
        const dragDistance = Math.sqrt(this.currentX * this.currentX + this.currentY * this.currentY);
        const scale = Math.max(0.95, 1 - dragDistance / 1000);
        this.currentCard.style.transform += ` scale(${scale})`;
        
        // Update choice labels opacity with enhanced thresholds
        this.updateChoiceLabels();
    },
    
    // Handle drag end
    handleEnd(e) {
        if (!this.isDragging || !this.currentCard) return;
        
        this.isDragging = false;
        const card = this.currentCard;
        card.classList.remove('dragging');
        
        // Calculate if card should be swiped away - reduced thresholds for easier swiping
        const threshold = config.ui.swipeThreshold * 0.7; // Reduced threshold by 30%
        const velocity = Math.abs(this.currentX) / (Date.now() - this.startTime);
        
        // Make velocity threshold more sensitive
        const velocityThreshold = config.ui.swipeVelocityThreshold * 0.5;
        
        if (Math.abs(this.currentX) > threshold || velocity > velocityThreshold) {
            if (this.currentX > 0) {
                // Swipe right - Like
                this.swipeCard('right');
            } else {
                // Swipe left - Pass
                this.swipeCard('left');
            }
        } else if (this.currentY < -threshold * 0.8) { // Easier upward swipe
            // Swipe up - Super Like
            this.swipeCard('up');
        } else {
            // Snap back to center with smooth animation
            card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.transform = '';
            setTimeout(() => {
                card.style.transition = '';
            }, 300);
            this.resetChoiceLabels();
        }
        
        this.currentCard = null;
    },
    
    // Update choice labels based on drag position
    updateChoiceLabels() {
        if (!this.currentCard) return;
        
        const nopeLabel = this.currentCard.querySelector('.nope-label');
        const likeLabel = this.currentCard.querySelector('.like-label');
        const superLabel = this.currentCard.querySelector('.super-label');
        
        // Reset all
        nopeLabel.style.opacity = '0';
        likeLabel.style.opacity = '0';
        superLabel.style.opacity = '0';
        
        // Lower thresholds for showing labels
        const labelThreshold = 30; // Reduced from 50
        
        if (this.currentX < -labelThreshold) {
            nopeLabel.style.opacity = Math.min(1, Math.abs(this.currentX) / 80);
            nopeLabel.style.transform = `scale(${1 + Math.abs(this.currentX) / 500})`;
        } else if (this.currentX > labelThreshold) {
            likeLabel.style.opacity = Math.min(1, this.currentX / 80);
            likeLabel.style.transform = `scale(${1 + this.currentX / 500})`;
        } else if (this.currentY < -labelThreshold) {
            superLabel.style.opacity = Math.min(1, Math.abs(this.currentY) / 80);
            superLabel.style.transform = `scale(${1 + Math.abs(this.currentY) / 500})`;
        }
    },
    
    // Reset choice labels
    resetChoiceLabels() {
        if (!this.currentCard) return;
        
        const labels = this.currentCard.querySelectorAll('.choice-label');
        labels.forEach(label => label.style.opacity = '0');
    },
    
    // Swipe card in direction
    swipeCard(direction) {
        const card = this.currentCard || this.cardStack.firstElementChild;
        if (!card) return;
        
        const eventId = card.dataset.eventId;
        const event = events.getEventById(eventId);
        
        // Add swipe animation class
        card.classList.add(`swiped-${direction}`);
        
        // Determine specific action type
        let actionType = 'pass';
        if (direction === 'right') {
            actionType = 'like';
        } else if (direction === 'up') {
            actionType = 'super-like';
        } else if (direction === 'left') {
            actionType = 'pass';
        }
        
        // Handle the swipe action
        if (direction === 'right' || direction === 'up') {
            // Like or Super Like
            storage.addMatch(event);
            webhook.trackMatch(event, actionType);
            this.showMatchAnimation();
        }
        
        // Mark event as seen and track it with specific action
        events.markEventSeen(eventId);
        webhook.trackEventSeen(event, actionType);
        
        // Remove card after animation
        setTimeout(() => {
            card.remove();
            this.loadMoreCards();
        }, 300);
    },
    
    // Setup action buttons
    setupActionButtons() {
        const passBtn = document.getElementById('pass-btn');
        const likeBtn = document.getElementById('like-btn');
        const superlikeBtn = document.getElementById('superlike-btn');
        
        passBtn?.addEventListener('click', () => this.swipeCard('left'));
        likeBtn?.addEventListener('click', () => this.swipeCard('right'));
        superlikeBtn?.addEventListener('click', () => this.swipeCard('up'));
    },
    
    // Load initial cards
    loadCards(eventsList) {
        this.cardStack.innerHTML = '';
        
        if (eventsList.length === 0) {
            document.getElementById('no-more-events').classList.remove('hidden');
            return;
        }
        
        document.getElementById('no-more-events').classList.add('hidden');
        
        // Add cards in reverse order so first is on top
        eventsList.slice(0, config.ui.cardsToShow).reverse().forEach(event => {
            const card = this.createEventCard(event);
            this.cardStack.appendChild(card);
        });
    },
    
    // Load more cards
    loadMoreCards() {
        const remainingCards = this.cardStack.children.length;
        
        if (remainingCards < 2) {
            const nextEvents = events.getNextEvents(config.ui.cardsToShow - remainingCards);
            
            if (nextEvents.length === 0 && remainingCards === 0) {
                document.getElementById('no-more-events').classList.remove('hidden');
                return;
            }
            
            nextEvents.reverse().forEach(event => {
                const card = this.createEventCard(event);
                this.cardStack.appendChild(card);
            });
        }
    },
    
    // Show match animation
    showMatchAnimation() {
        const likeBtn = document.getElementById('like-btn');
        likeBtn?.classList.add('match-animation');
        
        setTimeout(() => {
            likeBtn?.classList.remove('match-animation');
        }, 600);
    },
    
    // Reset swipe interface
    reset() {
        this.cardStack.innerHTML = '';
        this.currentCard = null;
        this.isDragging = false;
    }
}; 
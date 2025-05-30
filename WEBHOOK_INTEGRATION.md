# Webhook Integration Documentation

## Overview

The Event Matcher application now automatically sends all user interaction data to your n8n webhook endpoint in real-time. This enables comprehensive analytics, user behavior tracking, and data integration with external systems.

## Webhook Endpoint

**URL**: `https://keboola.app.n8n.cloud/webhook/2477a8fc-1e67-45b8-9d22-45054645caaa`

## Features

### 🚀 **Automatic Data Streaming**
- Real-time event tracking
- Offline support with event queuing
- Automatic retry logic with exponential backoff
- Batch processing for efficiency

### 📊 **Comprehensive Event Tracking**
- **Session Events**: Start, end, duration
- **Authentication**: Login, logout, user type
- **User Interactions**: Matches, swipes, preferences
- **Data Operations**: Export, import, preferences updates
- **AI Features**: AI settings, recommendations usage

### 🔄 **Robust Delivery**
- **Offline Queue**: Events stored when offline
- **Retry Logic**: 3 attempts with exponential backoff
- **Batch Processing**: Up to 10 events per request
- **Error Handling**: Graceful fallback and logging

## Event Types

### 1. Session Events
```json
{
  "type": "session_start",
  "data": {
    "timestamp": "2024-05-30T15:00:00.000Z",
    "userAgent": "Mozilla/5.0...",
    "url": "http://localhost:8080",
    "referrer": ""
  }
}
```

### 2. Authentication Events
```json
{
  "type": "user_authenticated",
  "data": {
    "provider": "google",
    "userType": "authenticated",
    "hasProfile": true
  }
}
```

### 3. Match Events
```json
{
  "type": "match_created",
  "data": {
    "eventId": "event_123",
    "eventName": "Tech Meetup",
    "eventType": "in_person",
    "eventDate": "2024-06-01T19:00:00.000Z",
    "location": "San Francisco, CA",
    "url": "tech-meetup-sf"
  }
}
```

### 4. User Interaction Events
```json
{
  "type": "event_seen",
  "data": {
    "eventId": "event_456",
    "eventName": "Design Workshop",
    "action": "swipe",
    "eventType": "online"
  }
}
```

### 5. Preferences Events
```json
{
  "type": "preferences_updated",
  "data": {
    "interests": ["technology", "design"],
    "format": "hybrid",
    "location": "San Francisco",
    "hasName": true,
    "hasOccupation": true
  }
}
```

### 6. Data Management Events
```json
{
  "type": "data_exported",
  "data": {
    "action": "user_data_export",
    "timestamp": "2024-05-30T15:30:00.000Z"
  }
}
```

## Event Structure

### Standard Event Format
```json
{
  "id": "evt_1717084800000_abc123xyz",
  "type": "match_created",
  "timestamp": "2024-05-30T15:00:00.000Z",
  "data": { /* event-specific data */ },
  "user": {
    "id": "google_123456789",
    "type": "authenticated",
    "profile": {
      "name": "John Doe",
      "email": "john@example.com",
      "provider": "google"
    },
    "stats": {
      "matches": 15,
      "seenEvents": 127,
      "accountAge": 3
    }
  },
  "session": {
    "startTime": "2024-05-30T14:45:00.000Z",
    "duration": 900000,
    "pageViews": 1,
    "lastActivity": "2024-05-30T15:00:00.000Z"
  },
  "app": {
    "version": "1.0",
    "name": "Event Matcher",
    "url": "http://localhost:8080",
    "userAgent": "Mozilla/5.0...",
    "screen": {"width": 1920, "height": 1080},
    "viewport": {"width": 1200, "height": 800}
  }
}
```

### Batch Request Format
```json
{
  "batch": true,
  "events": [
    { /* event 1 */ },
    { /* event 2 */ },
    { /* event 3 */ }
  ],
  "metadata": {
    "batchSize": 3,
    "sentAt": "2024-05-30T15:00:00.000Z",
    "source": "event-matcher-app"
  }
}
```

## Configuration

### Webhook Settings
```javascript
config: {
    endpoint: 'https://keboola.app.n8n.cloud/webhook/2477a8fc-1e67-45b8-9d22-45054645caaa',
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    batchSize: 10,
    flushInterval: 30000 // 30 seconds
}
```

### Request Headers
```javascript
{
    'Content-Type': 'application/json',
    'User-Agent': 'EventMatcher/1.0'
}
```

## Monitoring & Debugging

### Browser Console Logs
```javascript
// Initialization
🌐 Initializing webhook integration...
✅ Webhook integration initialized

// Event tracking
📡 Queueing event: match_created
📦 Periodic flush: 5 events
📡 Sending 5 events to webhook...
✅ Successfully sent 5 events

// Network issues
📴 Network offline, queueing events
🌐 Network back online, flushing queued events
⚠️ Failed to send events, re-queued 3 events
```

### Event Queue Status
```javascript
// Check current queue
console.log('Queue size:', webhook.eventQueue.length);

// Manual flush
webhook.flushQueue();

// Check last sent time
console.log('Last sent:', new Date(webhook.lastSent));
```

## Error Handling

### Network Failures
- Events are queued when offline
- Automatic retry when connection restored
- Exponential backoff for failed requests

### Server Errors
- 5xx errors trigger automatic retry
- 4xx errors are logged but not retried
- Events re-queued on failure

### Data Validation
- Events validated before sending
- Malformed events logged and skipped
- Context data sanitized for privacy

## Privacy & Security

### Data Anonymization
- No personally identifiable information in basic events
- User IDs are hashed/anonymized
- Email/names only sent if explicitly provided

### Sensitive Data Handling
- No passwords or tokens transmitted
- API keys and secrets excluded
- User consent respected for data sharing

## Integration Examples

### n8n Workflow Processing
```javascript
// Example n8n node to process events
if (inputData.batch) {
    // Process batch of events
    for (const event of inputData.events) {
        await processEvent(event);
    }
} else {
    // Process single event
    await processEvent(inputData);
}
```

### Analytics Dashboard
```sql
-- Example query for match analytics
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as matches,
    user.type as user_type
FROM webhook_events 
WHERE type = 'match_created'
GROUP BY date, user_type
ORDER BY date DESC;
```

### Real-time Alerts
```javascript
// Example alert for high-value users
if (event.user.stats.matches > 50) {
    await sendSlackAlert(`Power user ${event.user.id} created match`);
}
```

## Troubleshooting

### Common Issues

#### Events Not Sending
1. Check network connectivity
2. Verify webhook endpoint is accessible
3. Check browser console for errors
4. Manually flush queue: `webhook.flushQueue()`

#### Webhook Endpoint Errors
1. Verify n8n webhook is active
2. Check webhook URL is correct
3. Test endpoint with curl:
```bash
curl -X POST https://keboola.app.n8n.cloud/webhook/2477a8fc-1e67-45b8-9d22-45054645caaa \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

#### Data Missing in Analytics
1. Check event filtering in your analytics pipeline
2. Verify timestamp parsing
3. Check for data type mismatches

### Debug Tools

#### Manual Event Sending
```javascript
// Send test event
webhook.sendEvent('test_event', {
    message: 'Hello from Event Matcher',
    timestamp: new Date().toISOString()
}, true);
```

#### Queue Management
```javascript
// Clear queue
webhook.eventQueue = [];

// View queued events
console.table(webhook.eventQueue);
```

## Performance Impact

### Minimal Overhead
- Asynchronous processing
- Batched requests reduce frequency
- Offline queuing prevents blocking
- Optimized payload sizes

### Resource Usage
- ~1KB per event average
- Max 10 events per batch
- 30-second flush interval
- Automatic cleanup of old events

## Future Enhancements

### Planned Features
- Event filtering by user preferences
- Custom webhook endpoints per user
- Event aggregation and summarization
- Real-time dashboard integration
- Advanced retry strategies

---

## Quick Start

The webhook integration is automatically initialized when the app starts. No configuration needed - it just works! 🚀

Monitor the browser console to see events being tracked and sent in real-time.

**Your data is now flowing to**: `https://keboola.app.n8n.cloud/webhook/2477a8fc-1e67-45b8-9d22-45054645caaa` 
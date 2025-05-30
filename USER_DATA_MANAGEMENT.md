# User Data Management System

## Overview

The Event Matcher application now features a comprehensive user-specific data persistence system that saves all matches, preferences, and analytics locally per user. This ensures data isolation between different users and provides robust backup/restore capabilities.

## Key Features

### 🔐 User-Specific Storage
- **Isolated Data**: Each user's data is stored separately using unique user identifiers
- **Multiple Auth Methods**: Supports Auth0, Google OAuth, and guest users
- **Automatic Migration**: Legacy data is automatically migrated to user-specific storage

### 💾 Data Types Stored
- **Matches**: All liked/super-liked events with timestamps
- **Seen Events**: Track of all events the user has interacted with
- **Preferences**: User profile, interests, and location settings
- **AI Preferences**: AI feature settings and privacy controls
- **Analytics**: Daily usage statistics and engagement metrics

### 📊 Storage Statistics
- **Real-time Monitoring**: Track storage usage and data counts
- **User Type Detection**: Distinguish between guest and authenticated users
- **Account Age Tracking**: Monitor user engagement over time

### 🔄 Backup & Restore
- **Export Functionality**: Download complete user data as JSON
- **Import Validation**: Secure import with data structure validation
- **Preview Mode**: See what data will be imported before confirming

## User Identification System

### Authenticated Users
- **Auth0 Users**: `auth0_{sub}`
- **Google Users**: `google_{id}`
- **Email Users**: `email_{email}`

### Guest Users
- **Unique ID**: `guest_{timestamp}_{random}`
- **Persistent**: ID preserved across sessions until logout

## Data Structure

### User Data Object
```json
{
  "userId": "string",
  "createdAt": "ISO date",
  "lastAccessed": "ISO date",
  "matches": [
    {
      "event": { /* event object */ },
      "matchedAt": "ISO date",
      "id": "unique_match_id"
    }
  ],
  "seenEvents": ["event_id_1", "event_id_2"],
  "preferences": { /* user preferences */ },
  "aiPreferences": { /* AI settings */ },
  "analytics": {
    "2024-01-01": {
      "seen": 10,
      "matches": 2,
      "sessions": 1
    }
  },
  "profile": { /* user profile data */ }
}
```

## Storage Limits

### Per-User Limits
- **Matches**: 200 most recent matches
- **Seen Events**: 1,000 most recent events
- **Analytics**: 60 days of daily statistics

### Legacy Compatibility
- **Matches**: 100 most recent (for backward compatibility)
- **Seen Events**: 500 most recent
- **Analytics**: 30 days of daily statistics

## Export/Import System

### Export Features
- **Complete Backup**: All user data in single JSON file
- **Filename Format**: `eventmatcher-backup-{userId}-{date}.json`
- **Metadata**: Includes export timestamp and version

### Import Features
- **Validation**: Checks data structure and required fields
- **Preview**: Shows data summary before import
- **Safety Warning**: Warns about data replacement
- **Error Handling**: Robust error reporting

### File Format
```json
{
  "userId": "string",
  "createdAt": "ISO date",
  "lastAccessed": "ISO date",
  "matches": [...],
  "seenEvents": [...],
  "preferences": {...},
  "aiPreferences": {...},
  "analytics": {...},
  "profile": {...},
  "exportedAt": "ISO date",
  "version": "1.0"
}
```

## Privacy & Security

### Data Isolation
- **User Separation**: No data sharing between users
- **Storage Keys**: User-specific localStorage keys
- **Guest Protection**: Unique IDs for anonymous users

### Local Storage Only
- **No Server Storage**: All data remains on user's device
- **Browser-Dependent**: Data tied to specific browser/device
- **User Control**: Complete ownership of data

## API Reference

### Storage Methods

#### User Data Management
```javascript
// Get current user's data
const userData = storage.getUserData();

// Save user data
storage.saveUserData(userData);

// Export user data
const exportData = storage.exportUserData();

// Import user data
storage.importUserData(importData);
```

#### Statistics
```javascript
// Get storage statistics
const stats = storage.getStorageStats();

// Calculate storage size
const sizeKB = storage.calculateStorageSize();
```

#### Migration
```javascript
// Migrate legacy data
storage.migrateLegacyData();
```

### App Methods

#### Data Export/Import
```javascript
// Export user data as file
app.exportUserData();

// Show import dialog
app.showImportDialog();

// Validate import data
app.validateImportData(data);

// Perform import
app.performImport();
```

## Migration Process

### Automatic Migration
1. **On App Init**: Checks for legacy data
2. **Data Detection**: Identifies unmigrated data
3. **User Association**: Links data to current user
4. **Structure Update**: Converts to new format
5. **Preservation**: Keeps legacy data for compatibility

### Manual Migration
- Users can manually trigger migration through developer console
- Safe operation that doesn't overwrite existing user data

## Best Practices

### For Users
1. **Regular Backups**: Export data periodically
2. **Safe Storage**: Keep backup files secure
3. **Cross-Device**: Import backups when switching devices

### For Developers
1. **Backward Compatibility**: Always maintain legacy support
2. **Error Handling**: Robust error reporting and recovery
3. **Data Validation**: Strict validation on import
4. **User Feedback**: Clear notifications for all operations

## Troubleshooting

### Common Issues

#### Export Fails
- **Check Browser Support**: Ensure modern browser
- **Storage Space**: Verify sufficient device storage
- **Data Integrity**: Check for corrupted data

#### Import Fails
- **File Format**: Ensure valid JSON format
- **Required Fields**: Check all required fields present
- **Version Compatibility**: Verify export version

#### Data Loss
- **Browser Storage**: Check localStorage not cleared
- **User Switching**: Verify correct user logged in
- **Migration**: Check if migration completed

### Recovery Options
1. **Re-import Backup**: Use previously exported file
2. **Legacy Fallback**: System falls back to legacy storage
3. **Fresh Start**: Clear all data and start over

## Future Enhancements

### Planned Features
- **Cloud Sync**: Optional cloud backup integration
- **Data Encryption**: Client-side encryption for sensitive data
- **Sharing**: Ability to share match lists with friends
- **Analytics Dashboard**: Detailed usage analytics
- **Multiple Profiles**: Support for multiple user profiles

### Version History
- **v1.0**: Initial user-specific storage implementation
- **v1.1** (planned): Cloud sync capabilities
- **v1.2** (planned): Enhanced analytics and reporting

---

## Quick Start

To use the new data management features:

1. **Automatic**: Data is automatically saved per user
2. **Export**: Use AI Settings → Data Management → Export
3. **Import**: Use AI Settings → Data Management → Import
4. **Monitor**: Check browser console for storage statistics

The system is designed to be transparent to users while providing powerful data management capabilities for power users and developers. 
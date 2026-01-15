# Admin Guide

Administrative features and tools for managing the Spritz platform.

## Overview

Admin features include:

-   **User Management**: View and manage users
-   **Analytics Dashboard**: Track platform metrics
-   **Invite Codes**: Create and manage invite codes
-   **Beta Access**: Grant beta access to features
-   **Analytics Tracking**: Monitor usage patterns

## Accessing Admin Features

Admin features are only available to users with `is_admin: true` in the database.

### Admin Dashboard

1. Navigate to `/admin` in the app
2. View analytics and user metrics
3. Access admin tools and settings

## User Management

### View Users

1. Go to Admin → Users
2. Browse all registered users
3. Filter and search users
4. View user details and activity

### User Actions

-   **View Profile**: See user's full profile
-   **View Activity**: Check user's recent activity
-   **Grant Beta Access**: Enable beta features
-   **Revoke Access**: Remove user access (if needed)

## Analytics

### Platform Metrics

Track key metrics:

-   **Total Users**: Registered user count
-   **Active Users**: Users active in last 30 days
-   **Messages Sent**: Total messages across platform
-   **Streams Created**: Total livestreams
-   **Agents Created**: Total AI agents
-   **Video Minutes**: Total video call minutes

### User Analytics

Individual user metrics:

-   Messages sent
-   Friends count
-   Voice minutes
-   Video minutes
-   Groups joined

### Charts & Visualizations

-   Daily active users
-   Feature usage trends
-   Growth metrics
-   Engagement statistics

## Invite Codes

### Create Invite Code

1. Go to Admin → Invite Codes
2. Click "Create Invite Code"
3. Set code details:
    - **Code**: Custom code or auto-generated
    - **Uses**: Maximum number of uses
    - **Expires**: Expiration date (optional)
4. Generate and share code

### Manage Invite Codes

-   **View Usage**: See how many times code was used
-   **Disable Code**: Temporarily disable a code
-   **Delete Code**: Permanently remove a code
-   **Track Usage**: Monitor code usage patterns

### Grant Invites

Grant invite codes to specific users:

1. Go to Admin → Grant Invites
2. Select user
3. Enter number of invites
4. Grant invites to user

## Moderation System

Spritz includes a comprehensive moderation system for managing chat in both global (alpha) chat and public channels.

### Moderator Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | All permissions + manage other admins |
| **Admin** | All moderation permissions |
| **Channel Owner** | Full permissions within their channel |
| **Moderator** | Configurable permissions (pin, delete, mute) |

### Moderator Permissions

Moderators can have granular permissions:

- **can_pin**: Pin/unpin messages
- **can_delete**: Soft delete messages (preserves audit trail)
- **can_mute**: Mute/unmute users
- **can_manage_mods**: Promote/demote other moderators

### Managing Moderators

**Promote a Moderator:**

```typescript
POST /api/moderation
{
  "action": "promote-mod",
  "moderatorAddress": "0x...", // Your address
  "targetAddress": "0x...",    // New moderator
  "channelId": null,           // null for global chat
  "canPin": true,
  "canDelete": true,
  "canMute": true,
  "canManageMods": false
}
```

**Demote a Moderator:**

```typescript
POST /api/moderation
{
  "action": "demote-mod",
  "moderatorAddress": "0x...",
  "targetAddress": "0x...",
  "channelId": null
}
```

### Muting Users

Mute problematic users temporarily or permanently:

```typescript
POST /api/moderation
{
  "action": "mute-user",
  "moderatorAddress": "0x...",
  "targetAddress": "0x...",
  "channelId": null,
  "duration": "24h",  // "1h", "24h", "7d", "permanent"
  "reason": "Spamming chat"
}
```

**Duration formats:**
- `1m`, `5m`, `30m` - Minutes
- `1h`, `6h`, `24h` - Hours
- `1d`, `7d`, `30d` - Days
- `1w`, `2w` - Weeks
- `permanent` - No expiration

### Deleting Messages

Soft delete messages (preserves for audit):

```typescript
POST /api/moderation
{
  "action": "delete-message",
  "moderatorAddress": "0x...",
  "messageId": "uuid",
  "messageType": "alpha", // or "channel"
  "reason": "Inappropriate content"
}
```

### Moderation Log

View the audit trail of all moderation actions:

```typescript
GET /api/moderation?action=mod-log&requestingUser=0x...&channelId=null
```

Returns recent actions including:
- Who performed the action
- What action was taken
- Who was affected
- Timestamp and reason

### Protection Rules

- Cannot mute admins (unless you're a super admin)
- Cannot mute moderators (unless you're an admin)
- Channel owners have full permissions in their channels
- All actions are logged for accountability

## Bug Reports

Spritz integrates with GitHub for bug report management. Users can submit bug reports in-app, which are automatically synced to GitHub issues.

### Enabling GitHub Integration

1. Create a GitHub personal access token with `repo` permissions
2. Add to your environment variables:
    ```env
    GITHUB_OWNER=your_github_username_or_org
    GITHUB_REPO=your_repo_name
    GITHUB_TOKEN=your_github_personal_access_token
    ```

### Bug Report Features

-   **In-App Submission**: Users can report bugs directly from the app
-   **Screenshot Upload**: Users can attach screenshots/media
-   **Auto-Labeling**: Reports are automatically labeled by category
-   **GitHub Sync**: Reports create GitHub issues for tracking
-   **Admin Review**: Admins can view and manage reports

### Managing Bug Reports

1. Go to Admin → Bug Reports
2. View all submitted reports
3. Filter by status (open, resolved, closed)
4. View attached media and details
5. Update status as issues are resolved

### API Reference

```typescript
// Submit bug report
POST /api/bug-reports
{
  "title": "Bug title",
  "description": "Description of the issue",
  "category": "ui" | "performance" | "feature" | "other",
  "userAddress": "0x..."
}

// Upload bug report media
POST /api/bug-reports/upload
Content-Type: multipart/form-data
file: <image/video file>

// Get bug reports (admin)
GET /api/admin/bug-reports

// Update bug report (admin)
PATCH /api/admin/bug-reports/:id
{
  "status": "open" | "in_progress" | "resolved" | "closed"
}
```

## Beta Access

### Grant Beta Access

Enable beta features for users:

1. Go to Admin → Users
2. Select user
3. Toggle "Beta Access"
4. User gains access to beta features

### Beta Features

Beta features may include:

-   New AI agent capabilities
-   Experimental features
-   Early access to updates
-   Testing new functionality

## API Reference

### Get Users

```typescript
GET / api / admin / users;
```

### Get Analytics

```typescript
GET /api/admin/analytics?period=30d
```

### Track Analytics

```typescript
POST /api/admin/track-analytics
{
  "event": "user_action",
  "data": { ... }
}
```

### Create Invite Code

```typescript
POST /api/admin/invite-codes
{
  "code": "INVITE123",
  "maxUses": 100,
  "expiresAt": "2024-12-31"
}
```

### Grant Invites

```typescript
POST /api/admin/grant-invites
{
  "userAddress": "0x...",
  "count": 10
}
```

## Best Practices

1. **Privacy**: Respect user privacy in analytics
2. **Security**: Keep admin access secure
3. **Monitoring**: Regularly review analytics
4. **Invite Management**: Monitor invite code usage
5. **Beta Testing**: Carefully select beta testers

## Security

-   **Admin Verification**: Always verify admin status
-   **Access Control**: Limit admin features to authorized users
-   **Audit Logs**: Track admin actions
-   **Rate Limiting**: Protect admin endpoints

## Next Steps

-   Learn about [API Reference](/docs/api/intro)
-   Explore [Architecture Overview](/docs/architecture/overview)
-   Check out [Database Schema](/docs/database/schema)

# Admin Guide

Administrative features and tools for managing the Spritz platform.

## Overview

Admin features include:
- **User Management**: View and manage users
- **Analytics Dashboard**: Track platform metrics
- **Invite Codes**: Create and manage invite codes
- **Beta Access**: Grant beta access to features
- **Analytics Tracking**: Monitor usage patterns

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

- **View Profile**: See user's full profile
- **View Activity**: Check user's recent activity
- **Grant Beta Access**: Enable beta features
- **Revoke Access**: Remove user access (if needed)

## Analytics

### Platform Metrics

Track key metrics:
- **Total Users**: Registered user count
- **Active Users**: Users active in last 30 days
- **Messages Sent**: Total messages across platform
- **Streams Created**: Total livestreams
- **Agents Created**: Total AI agents
- **Video Minutes**: Total video call minutes

### User Analytics

Individual user metrics:
- Messages sent
- Friends count
- Voice minutes
- Video minutes
- Groups joined

### Charts & Visualizations

- Daily active users
- Feature usage trends
- Growth metrics
- Engagement statistics

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

- **View Usage**: See how many times code was used
- **Disable Code**: Temporarily disable a code
- **Delete Code**: Permanently remove a code
- **Track Usage**: Monitor code usage patterns

### Grant Invites

Grant invite codes to specific users:
1. Go to Admin → Grant Invites
2. Select user
3. Enter number of invites
4. Grant invites to user

## Beta Access

### Grant Beta Access

Enable beta features for users:
1. Go to Admin → Users
2. Select user
3. Toggle "Beta Access"
4. User gains access to beta features

### Beta Features

Beta features may include:
- New AI agent capabilities
- Experimental features
- Early access to updates
- Testing new functionality

## API Reference

### Get Users

```typescript
GET /api/admin/users
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

- **Admin Verification**: Always verify admin status
- **Access Control**: Limit admin features to authorized users
- **Audit Logs**: Track admin actions
- **Rate Limiting**: Protect admin endpoints

## Next Steps

- Learn about [API Reference](/docs/api/intro)
- Explore [Architecture Overview](/docs/architecture/overview)
- Check out [Database Schema](/docs/database/schema)


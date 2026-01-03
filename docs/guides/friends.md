# Friends Guide

The friends system in Spritz allows you to connect with other users, organize your network, and manage relationships.

## Overview

Friends in Spritz enable:
- **Friend Requests**: Send and receive friend requests
- **Friend Management**: Organize friends with tags
- **Quick Access**: Easy access to friends' profiles
- **Social Features**: See friends' activity and status

## Adding Friends

### Send Friend Request

1. Find a user you want to add
2. Click "Add Friend"
3. Wait for them to accept
4. They'll appear in your friends list

### Accept Friend Request

1. Check your friend requests
2. Review the request
3. Click "Accept" or "Decline"
4. Accepted friends can now message you

### QR Code Scanning

Quick way to add friends:

1. Open QR code scanner
2. Scan friend's QR code
3. Send friend request automatically
4. Wait for acceptance

## Managing Friends

### Friend Tags

Organize friends with custom tags:

1. Open friend's profile
2. Click "Add Tag"
3. Create or select a tag
4. Friends can have multiple tags

### Friend List

- View all your friends
- Search friends by name
- Filter by tags
- See friends' online status

### Remove Friend

1. Open friend's profile
2. Click "Remove Friend"
3. Confirm removal
4. They'll be removed from your list

## Friend Features

### Status Updates

See what friends are up to:
- Online/offline status
- Current activity
- Status messages
- Live streaming indicator

### Friend Activity

View friends' recent activity:
- Recent messages
- New agents created
- Streams started
- Profile updates

## Best Practices

1. **Verify Identity**: Ensure you're adding the right person
2. **Organize with Tags**: Use tags to organize your network
3. **Respect Privacy**: Don't spam friend requests
4. **Regular Cleanup**: Remove inactive or unwanted friends
5. **Be Selective**: Only add people you want to connect with

## API Reference

### Get Friends

```typescript
GET /api/friends?userAddress=0x...
```

### Send Friend Request

```typescript
POST /api/friends/request
{
  "fromAddress": "0x...",
  "toAddress": "0x..."
}
```

### Accept Friend Request

```typescript
POST /api/friends/accept
{
  "requestId": "uuid"
}
```

### Remove Friend

```typescript
DELETE /api/friends/:id
{
  "userAddress": "0x..."
}
```

## Next Steps

- Learn about [Groups](/docs/guides/groups)
- Explore [Messaging](/docs/guides/messaging)
- Check out [Profile Settings](/docs/guides/profile-settings)


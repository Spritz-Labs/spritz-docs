# Public Channels Guide

Public channels in Spritz allow you to discover and join community discussions on various topics.

## Overview

Public channels are:
- **Discoverable**: Browse and search available channels
- **Open**: Anyone can join public channels
- **Topic-Based**: Organized around specific topics
- **Community-Driven**: Built by and for the community

## Discovering Channels

### Browse Channels

1. Navigate to the Channels section
2. Browse available channels
3. See channel descriptions and member counts
4. Join channels that interest you

### Search Channels

- Search by name or topic
- Filter by category
- Sort by popularity or activity
- Find trending channels

## Joining Channels

1. Find a channel you want to join
2. Click "Join Channel"
3. Start participating in discussions
4. Leave anytime if no longer interested

## Channel Features

### Messaging

- Send messages to all channel members
- Share links and media
- React to messages with emojis
- Reply in threads (coming soon)

### Pinned Messages

Admins can pin important messages to the top of the channel:

- **Pin Messages**: Admins can pin any message for visibility
- **View Pinned**: Pinned messages appear at the top of the chat
- **Unpin**: Admins can unpin messages when no longer relevant

Pinned messages are great for:
- Important announcements
- Channel rules and guidelines
- Frequently asked questions
- Event information

### Channel Info

- View channel description
- See member count
- Check activity level
- View channel rules (if set)

## Creating Channels

1. Click "Create Channel"
2. Enter channel name
3. Add description
4. Set channel category
5. Configure privacy settings
6. Publish your channel

## Best Practices

1. **Clear Purpose**: Make channel purpose clear
2. **Active Moderation**: Keep discussions on-topic
3. **Respectful Communication**: Maintain friendly atmosphere
4. **Regular Participation**: Engage with the community
5. **Follow Guidelines**: Respect channel rules

## API Reference

### List Channels

```typescript
GET /api/channels?category=tech&limit=20
```

### Get Channel

```typescript
GET /api/channels/:id
```

### Join Channel

```typescript
POST /api/channels/:id/join
{
  "userAddress": "0x..."
}
```

### Leave Channel

```typescript
POST /api/channels/:id/leave
{
  "userAddress": "0x..."
}
```

### Get Channel Messages

```typescript
GET /api/channels/:id/messages?limit=50
```

### Send Channel Message

```typescript
POST /api/channels/:id/messages
{
  "userAddress": "0x...",
  "content": "Message text",
  "type": "text"
}
```

### Pin Message (Admin Only)

```typescript
POST /api/channels/:id/messages/pin
{
  "messageId": "uuid",
  "action": "pin"
}
```

### Unpin Message (Admin Only)

```typescript
POST /api/channels/:id/messages/pin
{
  "messageId": "uuid",
  "action": "unpin"
}
```

## Next Steps

- Learn about [Groups](/docs/guides/groups)
- Explore [Messaging](/docs/guides/messaging)
- Check out [Friends](/docs/guides/friends)




---
title: API Reference - Complete REST API Documentation
description: Complete REST API reference for Spritz. Learn how to authenticate, interact with AI agents, manage livestreams, and integrate Spritz into your applications.
keywords:
    [
        Spritz API,
        REST API,
        API documentation,
        API reference,
        authentication,
        SIWE,
        SIWS,
        Web3 API,
        decentralized API,
    ]
---

# API Reference

Spritz provides a comprehensive REST API for interacting with the platform programmatically.

## Base URL

```
https://app.spritz.chat/api
```

## Authentication

Most endpoints require authentication via Sign-In with Ethereum (SIWE/SIWS). Include your authentication token in the request headers:

```
Authorization: Bearer <token>
```

## Rate Limiting

API requests are rate-limited to prevent abuse. Current limits:
- **Standard**: 100 requests per minute
- **Authenticated**: 1000 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Common Error Codes

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## API Endpoints

### Agents

- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/:id` - Get agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/chat` - Chat with agent
- `GET /api/agents/:id/chat` - Get chat history
- `DELETE /api/agents/:id/chat` - Clear chat history
- `GET /api/agents/:id/knowledge` - Get knowledge base
- `POST /api/agents/:id/knowledge` - Add knowledge URL
- `DELETE /api/agents/:id/knowledge` - Remove knowledge URL
- `POST /api/agents/:id/knowledge/index` - Index knowledge
- `GET /api/agents/discover` - Discover public agents
- `GET /api/agents/favorites` - Get favorite agents
- `POST /api/agents/favorites` - Add favorite
- `DELETE /api/agents/favorites` - Remove favorite
- `GET /api/agents/:id/embed` - Get embed code and SDK examples
- `POST /api/agents/detect-api` - Detect API type (GraphQL/OpenAPI/REST)
- `POST /api/public/agents/:id/chat` - Public agent chat (x402)
- `GET /api/public/agents/:id` - Get public agent info

### Streaming

- `GET /api/streams` - List streams
- `POST /api/streams` - Create stream
- `GET /api/streams/:id` - Get stream
- `DELETE /api/streams/:id` - Delete stream
- `GET /api/streams/:id/assets` - Get stream recordings
- `POST /api/streams/:id/assets` - Create stream asset
- `GET /api/streams/:id/chat` - Get stream chat
- `POST /api/streams/:id/chat` - Send stream chat message
- `POST /api/streams/:id/viewers` - Increment viewer count
- `DELETE /api/streams/:id/viewers` - Decrement viewer count
- `GET /api/public/streams/:id` - Get public stream info
- `POST /api/public/streams/:id` - Join public stream
- `DELETE /api/public/streams/:id` - Leave public stream

### Authentication

- `GET /api/auth/verify` - Verify SIWE signature
- `POST /api/auth/verify` - Verify SIWE signature
- `GET /api/auth/verify-solana` - Verify SIWS signature
- `POST /api/auth/verify-solana` - Verify SIWS signature

### Friends

- `GET /api/friends` - List friends (via Waku, not API)
- Friend requests are handled via Waku messaging

### Channels

- `GET /api/channels` - List channels
- `POST /api/channels` - Create channel
- `GET /api/channels/:id` - Get channel
- `POST /api/channels/:id/join` - Join channel
- `POST /api/channels/:id/leave` - Leave channel
- `GET /api/channels/:id/messages` - Get channel messages
- `POST /api/channels/:id/messages` - Send channel message

### Rooms & Calls

- `POST /api/rooms` - Create instant room
- `GET /api/rooms` - List rooms
- `GET /api/rooms/:code` - Get room
- `DELETE /api/rooms/:code` - Delete room
- `POST /api/rooms/:code/token` - Get room token
- `GET /api/rooms/permanent` - Get permanent rooms
- `GET /api/calls` - Get call history
- `POST /api/calls` - Create call

### Scheduling

- `GET /api/scheduling/list` - List scheduled calls
- `POST /api/scheduling/schedule` - Schedule a call
- `POST /api/scheduling/invite` - Invite to scheduled call
- `GET /api/scheduling/availability` - Get availability
- `GET /api/scheduling/settings` - Get scheduling settings
- `POST /api/scheduling/settings` - Update scheduling settings
- `POST /api/scheduling/create-shareable` - Create shareable link
- `GET /api/scheduling/join/:token` - Join via token
- `POST /api/scheduling/join/:token` - Confirm join

### Calendar

- `GET /api/calendar/connect` - Connect Google Calendar
- `GET /api/calendar/callback` - OAuth callback
- `GET /api/calendar/status` - Get calendar connection status
- `GET /api/calendar/availability` - Get calendar availability
- `POST /api/calendar/availability` - Set availability window
- `DELETE /api/calendar/availability` - Remove availability window
- `POST /api/calendar/disconnect` - Disconnect calendar

### Other Endpoints

- `GET /api/leaderboard` - Get leaderboard
- `GET /api/points` - Get user points
- `POST /api/points` - Add points
- `GET /api/points/daily` - Get daily points
- `POST /api/points/daily` - Claim daily points
- `POST /api/phone/send-code` - Send phone verification code
- `POST /api/phone/verify-code` - Verify phone code
- `POST /api/phone/remove` - Remove phone number
- `POST /api/email/send-code` - Send email verification code
- `POST /api/email/verify-code` - Verify email code
- `POST /api/pixel-art/upload` - Upload pixel art avatar
- `POST /api/upload` - Upload file
- `POST /api/push/send` - Send push notification
- `GET /api/invites` - Get invite codes
- `POST /api/invites` - Create invite code
- `GET /api/public/user` - Get public user info
- `GET /api/public/user/:address` - Get public user info by address
- `GET /api/public/schedule/:slug` - Get public schedule
- `POST /api/bug-reports` - Submit bug report
- `GET /api/github/issues` - List GitHub issues (admin only)
- `GET /api/github/issues/:number` - Get GitHub issue (admin only)

## SDKs

Official SDKs are coming soon. For now, use standard HTTP requests.

## Examples

### Creating an Agent

```typescript
const response = await fetch('https://app.spritz.chat/api/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: 'My Agent',
    personality: 'Helpful and friendly',
    system_instructions: 'You are a helpful assistant.',
    visibility: 'private',
  }),
});

const agent = await response.json();
```

### Chatting with an Agent

```typescript
const response = await fetch(`https://app.spritz.chat/api/agents/${agentId}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: 'Hello!',
  }),
});

const chat = await response.json();
```

## Detailed API References

- [Agents API - Detailed Reference](/docs/api/agents-detailed): Complete agent endpoints
- [Streaming API](/docs/api/streaming): Livestreaming endpoints
- [Complete API Reference](/docs/api/complete): All endpoints overview

## Next Steps

- Explore [Agents API - Detailed Reference](/docs/api/agents-detailed)
- Check out [Streaming API](/docs/api/streaming)
- See [Complete API Reference](/docs/api/complete) for all endpoints
- Learn about [Architecture](/docs/architecture/overview)


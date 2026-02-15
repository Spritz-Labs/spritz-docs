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

Most endpoints require authentication via Sign-In with Ethereum (SIWE/SIWS). Sessions are managed via HTTP-only cookies.

### Quick Start Authentication

```typescript
// 1. Get a pre-formatted SIWE message with nonce from the server
const { message, nonce } = await fetch(
    `https://app.spritz.chat/api/auth/verify?address=${walletAddress}`, {
    credentials: 'include',
}).then(r => r.json());

// 2. Sign the message with the wallet
const signature = await wallet.signMessage(message);

// 3. Verify signature and create session
await fetch('https://app.spritz.chat/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Required for cookies
    body: JSON.stringify({ address: walletAddress, message, signature }),
});

// 4. Make authenticated requests (session cookie sent automatically)
const agents = await fetch('https://app.spritz.chat/api/agents', {
    credentials: 'include',
}).then(r => r.json());
```

:::note SIWE Message Format
The server generates a standard SIWE message for you. The GET request to `/api/auth/verify?address=...` returns both the pre-formatted `message` string and the `nonce`. You sign the message as-is and send it back for verification.
:::

:::tip Cookie-Based Auth
Spritz uses HTTP-only session cookies for security. Always include `credentials: 'include'` in your fetch requests.
:::

For server-to-server requests, you can also use the `Authorization` header:

```
Authorization: Bearer <session_token>
```

## Rate Limiting

API requests are rate-limited to prevent abuse using Upstash Redis. Limits are tiered by endpoint type:

| Tier | Limit | Used For |
|------|-------|----------|
| **auth** | 10/min | Login, registration, session endpoints |
| **strict** | 5/min | Sensitive operations (invites, points, streams) |
| **contact** | 3/min | Contact form submissions |
| **ai** | 30/min | AI agent chat endpoints |
| **messaging** | 60/min | Real-time messaging operations |
| **general** | 100/min | Default for other endpoints |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until you can retry (on 429 errors)

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

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

For a complete list of error codes with troubleshooting guidance, see the [Error Reference](/docs/api/error-codes).

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

- `GET /api/auth/verify?address=...` - Get SIWE message and nonce for signing
- `GET /api/auth/verify` - Verify SIWE signature
- `POST /api/auth/verify` - Verify SIWE signature
- `GET /api/auth/verify-solana` - Verify SIWS signature
- `POST /api/auth/verify-solana` - Verify SIWS signature
- `GET /api/auth/session` - Get current session
- `POST /api/auth/logout` - Logout and clear session
- `POST /api/auth/world-id` - Verify World ID proof
- `POST /api/auth/alien-id` - Verify Alien ID

### Passkey Authentication

- `POST /api/passkey/register/options` - Get registration options
- `POST /api/passkey/register/verify` - Verify registration
- `POST /api/passkey/login/options` - Get login options
- `POST /api/passkey/login/verify` - Verify login
- `GET /api/passkey/credentials` - List user's passkeys
- `DELETE /api/passkey/credential` - Remove a passkey
- `POST /api/passkey/check-migration` - Check passkey migration status
- `POST /api/passkey/recover/email` - Request passkey recovery via email
- `POST /api/passkey/recover/email/verify` - Verify recovery code and get token

### Email Authentication

- `POST /api/email/send-code` - Send email verification code
- `POST /api/email/verify-code` - Verify email code
- `POST /api/email/login/send-code` - Send email login code
- `POST /api/email/login/verify` - Verify email login
- `POST /api/email/restore-session` - Restore session from email

### Wallet

- `GET /api/wallet/balances?address=0x...` - Get token balances (address required)
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/smart-wallet` - Get/create smart wallet address
- `GET /api/wallet/safe-status` - Get Safe deployment status across chains
- `GET /api/wallet/recovery-signer` - Get recovery signer status
- `POST /api/wallet/recovery-signer` - Add recovery signer
- `POST /api/wallet/onramp/session` - Generate Coinbase Onramp session token

### Username

- `GET /api/username?address=0x...` - Get username for address
- `POST /api/username` - Claim or update username
- `DELETE /api/username` - Remove username
- `GET /api/username/resolve?username=name` - Resolve username to address

### Profile Widgets

- `GET /api/profile/widgets` - Get user's profile widgets
- `POST /api/profile/widgets` - Create/update profile widgets
- `GET /api/profile/theme` - Get user's profile theme
- `POST /api/profile/theme` - Update profile theme

### Friends

- `GET /api/friends` - List friends (via Logos Messaging, not API)
- Friend requests are handled via Logos Messaging

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

### Points & Gamification

- `GET /api/leaderboard` - Get leaderboard
- `GET /api/points` - Get user points
- `POST /api/points` - Add points
- `GET /api/points/daily` - Get daily points
- `POST /api/points/daily` - Claim daily points

### Phone Verification

- `POST /api/phone/send-code` - Send phone verification code
- `POST /api/phone/verify-code` - Verify phone code
- `POST /api/phone/remove` - Remove phone number

### Uploads & Media

- `POST /api/pixel-art/upload` - Upload pixel art avatar
- `POST /api/upload` - Upload file
- `POST /api/bug-reports/upload` - Upload media for bug reports

### Other Endpoints

- `POST /api/push/send` - Send push notification
- `GET /api/invites` - Get invite codes
- `POST /api/invites` - Redeem invite code
- `POST /api/contact` - Contact form submission
- `POST /api/beta-access/apply` - Apply for beta access
- `GET /api/moderation` - Get moderation data
- `GET /api/prices` - Get token prices
- `GET /api/public/user` - Get public user info
- `GET /api/public/user/:address` - Get public user info by address
- `GET /api/public/schedule/:slug` - Get public schedule
- `POST /api/bug-reports` - Submit bug report
- `GET /api/github/issues` - List GitHub issues (admin only)
- `GET /api/github/issues/:number` - Get GitHub issue (admin only)

### Admin Endpoints

- `GET /api/admin/users` - List all users (admin only)
- `GET /api/admin/analytics` - Get platform analytics (admin only)
- `GET /api/admin/user-wallets?address=0x...` - Get user wallet status across chains (admin only)
- `GET /api/admin/invite-codes` - List invite codes (admin only)
- `POST /api/admin/grant-invites` - Grant invite codes to user (admin only)
- `GET /api/admin/bug-reports` - List bug reports (admin only)
- `POST /api/admin/bug-reports/:id/github` - Create GitHub issue from bug report (admin only)

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
- [Error Reference](/docs/api/error-codes): Complete error code documentation
- [Quick Reference](/docs/api/complete): All endpoints overview

:::info For AI agents and LLMs
A single-file, machine-readable API reference is available at **[llms.txt](/llms.txt)**. It includes base URL, authentication steps, all major endpoints, request/response patterns, x402 paid agent chat, and links to full documentation so agents can parse and call Spritz APIs correctly.
:::

## Next Steps

- Explore [Agents API - Detailed Reference](/docs/api/agents-detailed)
- Check out [Streaming API](/docs/api/streaming)
- Review [Error Codes](/docs/api/error-codes) for troubleshooting
- See [Quick Reference](/docs/api/complete) for all endpoints
- Learn about [Architecture](/docs/architecture/overview)


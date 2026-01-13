# Complete API Reference

Comprehensive reference for all Spritz API endpoints.

## Base URL

```
https://app.spritz.chat/api
```

## Authentication

Most endpoints require authentication via Sign-In with Ethereum (SIWE) or Sign-In with Solana (SIWS). Include your authentication token in request headers:

```
Authorization: Bearer <token>
```

## Rate Limiting

-   **Standard**: 100 requests per minute
-   **Authenticated**: 1000 requests per minute
-   **x402 Public**: No rate limit (payment required)

Rate limit headers:

-   `X-RateLimit-Limit`: Maximum requests
-   `X-RateLimit-Remaining`: Remaining requests
-   `X-RateLimit-Reset`: Reset timestamp

## Response Format

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

## Endpoint Categories

### Agents

See [Agents API - Detailed Reference](/docs/api/agents-detailed) for complete documentation.

**Key Endpoints:**

-   `GET /api/agents` - List agents
-   `POST /api/agents` - Create agent
-   `GET /api/agents/:id` - Get agent
-   `DELETE /api/agents/:id` - Delete agent
-   `POST /api/agents/:id/chat` - Chat with agent
-   `GET /api/agents/:id/chat` - Get chat history
-   `GET /api/agents/:id/knowledge` - Get knowledge base
-   `POST /api/agents/:id/knowledge` - Add knowledge URL
-   `POST /api/agents/:id/knowledge/index` - Index knowledge
-   `GET /api/agents/discover` - Discover public agents
-   `GET /api/agents/favorites` - Get favorites
-   `POST /api/agents/favorites` - Add favorite
-   `DELETE /api/agents/favorites` - Remove favorite
-   `GET /api/public/agents/:id` - Get public agent info
-   `POST /api/public/agents/:id/chat` - Public chat (x402)

### Streaming

See [Streaming API Reference](/docs/api/streaming) for complete documentation.

**Key Endpoints:**

-   `GET /api/streams` - List streams
-   `POST /api/streams` - Create stream
-   `GET /api/streams/:id` - Get stream
-   `DELETE /api/streams/:id` - Delete stream
-   `GET /api/streams/:id/assets` - Get recordings
-   `GET /api/streams/:id/chat` - Get stream chat
-   `POST /api/streams/:id/chat` - Send chat message
-   `POST /api/streams/:id/viewers` - Increment viewers
-   `DELETE /api/streams/:id/viewers` - Decrement viewers

### Authentication

-   `GET /api/auth/verify` - Verify SIWE signature
-   `POST /api/auth/verify` - Verify SIWE signature
-   `GET /api/auth/verify-solana` - Verify SIWS signature
-   `POST /api/auth/verify-solana` - Verify SIWS signature
-   `GET /api/auth/session` - Get current session
-   `POST /api/auth/logout` - Logout and clear session
-   `POST /api/auth/world-id` - Verify World ID proof
-   `POST /api/auth/alien-id` - Verify Alien ID

### Passkey Authentication

WebAuthn/passkey-based authentication for passwordless login:

-   `POST /api/passkey/register/options` - Get registration options
-   `POST /api/passkey/register/verify` - Verify registration
-   `POST /api/passkey/login/options` - Get login options
-   `POST /api/passkey/login/verify` - Verify login
-   `GET /api/passkey/credentials` - List user's passkeys
-   `DELETE /api/passkey/credential` - Remove a passkey
-   `POST /api/passkey/recover/email` - Start email recovery
-   `POST /api/passkey/recover/email/verify` - Verify recovery code
-   `GET /api/passkey/check-migration` - Check migration status

### Wallet

-   `GET /api/wallet/balances` - Get token balances
-   `GET /api/wallet/transactions` - Get transaction history
-   `POST /api/wallet/smart-wallet` - Get/create smart wallet address

### Username

-   `GET /api/username` - Get current username
-   `POST /api/username` - Claim or update username

### Beta Access

-   `POST /api/beta-access/apply` - Apply for beta access

### Channels

-   `GET /api/channels` - List channels
-   `POST /api/channels` - Create channel
-   `GET /api/channels/:id` - Get channel
-   `POST /api/channels/:id/join` - Join channel
-   `POST /api/channels/:id/leave` - Leave channel
-   `GET /api/channels/:id/messages` - Get messages
-   `POST /api/channels/:id/messages` - Send message

### Rooms & Calls

-   `POST /api/rooms` - Create instant room
-   `GET /api/rooms` - List rooms
-   `GET /api/rooms/:code` - Get room
-   `DELETE /api/rooms/:code` - Delete room
-   `POST /api/rooms/:code/token` - Get room token
-   `GET /api/rooms/permanent` - Get permanent rooms
-   `GET /api/calls` - Get call history
-   `POST /api/calls` - Create call

### Huddle01 (Video Calls)

-   `POST /api/huddle01/room` - Create Huddle01 room
-   `POST /api/huddle01/token` - Get Huddle01 token

### Scheduling

-   `GET /api/scheduling/list` - List scheduled calls
-   `POST /api/scheduling/schedule` - Schedule a call
-   `POST /api/scheduling/invite` - Invite to call
-   `GET /api/scheduling/availability` - Get availability
-   `GET /api/scheduling/settings` - Get settings
-   `POST /api/scheduling/settings` - Update settings
-   `POST /api/scheduling/create-shareable` - Create shareable link
-   `GET /api/scheduling/join/:token` - Join via token
-   `POST /api/scheduling/join/:token` - Confirm join

### Calendar

-   `GET /api/calendar/connect` - Connect Google Calendar
-   `GET /api/calendar/callback` - OAuth callback
-   `GET /api/calendar/status` - Get connection status
-   `GET /api/calendar/availability` - Get availability
-   `POST /api/calendar/availability` - Set availability window
-   `DELETE /api/calendar/availability` - Remove availability
-   `POST /api/calendar/disconnect` - Disconnect calendar

### Points & Leaderboard

-   `GET /api/points` - Get user points
-   `POST /api/points` - Add points
-   `GET /api/points/daily` - Get daily points
-   `POST /api/points/daily` - Claim daily points
-   `GET /api/leaderboard` - Get leaderboard

### Verification

-   `POST /api/phone/send-code` - Send phone verification code
-   `POST /api/phone/verify-code` - Verify phone code
-   `POST /api/phone/remove` - Remove phone number
-   `POST /api/email/send-code` - Send email verification code
-   `POST /api/email/verify-code` - Verify email code

### Email Login

Email login allows users to sign in without a wallet or passkey:

-   `POST /api/email/login/send-code` - Send email login code
-   `POST /api/email/login/verify` - Verify email login code

**Send Code:**

```typescript
POST /api/email/login/send-code
{
  "email": "user@example.com"
}
// Response: { success: true, message: "Verification code sent" }
```

**Verify Code:**

```typescript
POST /api/email/login/verify
{
  "email": "user@example.com",
  "code": "123456"
}
// Response: { success: true, address: "0x...", isNewUser: true/false }
```

### Other Endpoints

-   `POST /api/pixel-art/upload` - Upload pixel art avatar
-   `POST /api/upload` - Upload file
-   `POST /api/push/send` - Send push notification
-   `GET /api/invites` - Get invite codes
-   `POST /api/invites` - Create invite code
-   `GET /api/public/user` - Get public user info
-   `GET /api/public/schedule/:slug` - Get public schedule

### Admin Endpoints

-   `GET /api/admin/users` - List users
-   `GET /api/admin/analytics` - Get analytics
-   `POST /api/admin/track-analytics` - Track analytics
-   `POST /api/admin/track-login` - Track login
-   `GET /api/admin/invite-codes` - List invite codes
-   `POST /api/admin/invite-codes` - Create invite code
-   `DELETE /api/admin/invite-codes` - Delete invite code
-   `GET /api/admin/admins` - List admins
-   `POST /api/admin/admins` - Add admin
-   `DELETE /api/admin/admins` - Remove admin
-   `POST /api/admin/grant-invites` - Grant invites
-   `POST /api/admin/verify` - Verify admin status

## Common Error Codes

-   `UNAUTHORIZED` (401): Authentication required
-   `FORBIDDEN` (403): Insufficient permissions
-   `NOT_FOUND` (404): Resource not found
-   `VALIDATION_ERROR` (400): Invalid request data
-   `RATE_LIMIT_EXCEEDED` (429): Too many requests
-   `PAYMENT_REQUIRED` (402): x402 payment required
-   `INTERNAL_ERROR` (500): Server error

## SDK Examples

### JavaScript/TypeScript

```typescript
const API_BASE = "https://app.spritz.chat/api";

async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
    }

    return response.json();
}

// Example: Create an agent
const agent = await apiRequest("/agents", {
    method: "POST",
    body: JSON.stringify({
        userAddress: "0x...",
        name: "My Agent",
        personality: "Helpful",
    }),
});
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Rate Limiting**: Respect rate limits and implement backoff
3. **Caching**: Cache responses when appropriate
4. **Retries**: Implement exponential backoff for retries
5. **Validation**: Validate data before sending requests

## Next Steps

-   See [Agents API](/docs/api/agents-detailed) for detailed agent endpoints
-   See [Streaming API](/docs/api/streaming) for streaming endpoints
-   Check [Architecture Overview](/docs/architecture/overview) for system design

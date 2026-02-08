---
title: Complete API Reference
description: Complete overview of all Spritz REST API endpoints for agents, streaming, authentication, wallets, and more.
keywords: [Spritz API, REST API, API endpoints, complete reference]
sidebar_label: Quick Reference
---

# Complete API Reference

This page provides a quick overview of all available API endpoints. For detailed documentation on each endpoint, see the dedicated API reference pages.

## API Documentation

-   **[API Overview](/docs/api/intro)** - Authentication, rate limiting, response formats
-   **[Agents API](/docs/api/agents-detailed)** - Create, manage, and chat with AI agents
-   **[Streaming API](/docs/api/streaming)** - Livestreaming endpoints

## Quick Endpoint Reference

### AI Agents

| Method | Endpoint                          | Description              |
| ------ | --------------------------------- | ------------------------ |
| GET    | `/api/agents`                     | List agents              |
| POST   | `/api/agents`                     | Create agent             |
| GET    | `/api/agents/:id`                 | Get agent details        |
| DELETE | `/api/agents/:id`                 | Delete agent             |
| POST   | `/api/agents/:id/chat`            | Chat with agent          |
| GET    | `/api/agents/:id/chat`            | Get chat history         |
| DELETE | `/api/agents/:id/chat`            | Clear chat history       |
| GET    | `/api/agents/:id/knowledge`       | Get knowledge base       |
| POST   | `/api/agents/:id/knowledge`       | Add knowledge URL        |
| DELETE | `/api/agents/:id/knowledge`       | Remove knowledge URL     |
| POST   | `/api/agents/:id/knowledge/index` | Index knowledge          |
| GET    | `/api/agents/discover`            | Discover public agents   |
| GET    | `/api/agents/favorites`           | Get favorites            |
| POST   | `/api/agents/favorites`           | Add favorite             |
| DELETE | `/api/agents/favorites`           | Remove favorite          |
| GET    | `/api/agents/:id/embed`           | Get embed code           |
| POST   | `/api/public/agents/:id/chat`     | Public agent chat (x402) |

### Livestreaming

| Method | Endpoint                   | Description       |
| ------ | -------------------------- | ----------------- |
| GET    | `/api/streams`             | List streams      |
| POST   | `/api/streams`             | Create stream     |
| GET    | `/api/streams/:id`         | Get stream        |
| DELETE | `/api/streams/:id`         | Delete stream     |
| GET    | `/api/streams/:id/assets`  | Get recordings    |
| POST   | `/api/streams/:id/chat`    | Send chat message |
| POST   | `/api/streams/:id/viewers` | Join stream       |
| DELETE | `/api/streams/:id/viewers` | Leave stream      |

### Authentication

| Method | Endpoint                         | Description                              |
| ------ | -------------------------------- | ---------------------------------------- |
| GET    | `/api/auth/verify?address=0x...` | Get SIWE message and nonce for signing   |
| POST   | `/api/auth/verify`               | Verify SIWE signature and create session |
| POST   | `/api/auth/verify-solana`        | Verify SIWS signature                    |
| GET    | `/api/auth/session`              | Get current session                      |
| POST   | `/api/auth/logout`               | Logout                                   |
| POST   | `/api/auth/world-id`             | Verify World ID                          |
| POST   | `/api/auth/alien-id`             | Verify Alien ID (SSO & Mini App flows)   |

### Passkeys

| Method | Endpoint                        | Description              |
| ------ | ------------------------------- | ------------------------ |
| POST   | `/api/passkey/register/options` | Get registration options |
| POST   | `/api/passkey/register/verify`  | Verify registration      |
| POST   | `/api/passkey/login/options`    | Get login options        |
| POST   | `/api/passkey/login/verify`     | Verify login             |
| GET    | `/api/passkey/credentials`      | List passkeys            |
| DELETE | `/api/passkey/credential`       | Remove passkey           |

### Wallet

| Method | Endpoint                             | Description                           |
| ------ | ------------------------------------ | ------------------------------------- |
| GET    | `/api/wallet/balances?address=0x...` | Get token balances (address required) |
| GET    | `/api/wallet/transactions`           | Get transaction history               |
| POST   | `/api/wallet/smart-wallet`           | Get/create smart wallet               |
| GET    | `/api/wallet/safe-status`            | Get Safe deployment status            |
| GET    | `/api/wallet/recovery-signer`        | Get recovery signer status            |
| POST   | `/api/wallet/recovery-signer`        | Add recovery signer                   |
| POST   | `/api/wallet/onramp/session`         | Generate Coinbase Onramp session      |

### Username

| Method | Endpoint                | Description                 |
| ------ | ----------------------- | --------------------------- |
| GET    | `/api/username`         | Get username for address    |
| POST   | `/api/username`         | Claim/update username       |
| DELETE | `/api/username`         | Remove username             |
| GET    | `/api/username/resolve` | Resolve username to address |

### Friends & Social

| Method | Endpoint               | Description            |
| ------ | ---------------------- | ---------------------- |
| GET    | `/api/friends`         | List friends           |
| GET    | `/api/profile/widgets` | Get profile widgets    |
| POST   | `/api/profile/widgets` | Update profile widgets |
| GET    | `/api/profile/theme`   | Get profile theme      |
| POST   | `/api/profile/theme`   | Update profile theme   |

### User (Email & Preferences)

| Method | Endpoint                  | Description                                                         |
| ------ | ------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/user/email-updates` | Get email updates opt-in status (auth)                              |
| PATCH  | `/api/user/email-updates` | Update email updates opt-in (auth; verify email required to opt in) |

### Upload (Encrypted Media - DMs)

| Method | Endpoint            | Description                                                                   |
| ------ | ------------------- | ----------------------------------------------------------------------------- |
| POST   | `/api/upload/image` | Upload encrypted image (multipart: file, conversationId, originalType; auth)  |
| POST   | `/api/upload/voice` | Upload encrypted voice memo (multipart: file, conversationId, duration; auth) |

Client encrypts media with the DM conversation key before upload. See [Encrypted Media](/docs/developers/encrypted-media) for format and crypto.

### User Moderation (Mute, Block, Report)

| Method | Endpoint            | Description                  |
| ------ | ------------------- | ---------------------------- |
| GET    | `/api/users/mute`   | Get muted conversations      |
| POST   | `/api/users/mute`   | Mute a conversation          |
| DELETE | `/api/users/mute`   | Unmute a conversation        |
| GET    | `/api/users/block`  | Get blocked users            |
| POST   | `/api/users/block`  | Block a user                 |
| DELETE | `/api/users/block`  | Unblock a user               |
| GET    | `/api/users/report` | Get reports (user/admin)     |
| POST   | `/api/users/report` | Submit a report              |
| PATCH  | `/api/users/report` | Update report status (admin) |

### Channels

| Method | Endpoint                       | Description                                                                                   |
| ------ | ------------------------------ | --------------------------------------------------------------------------------------------- |
| GET    | `/api/channels`                | List channels (optional: `?poapEventId=` for channel by POAP event)                           |
| POST   | `/api/channels`                | Create channel (supports POAP: `poapEventId`, `poapEventName`, `poapImageUrl`)                |
| GET    | `/api/channels/:id`            | Get channel by ID                                                                             |
| GET    | `/api/channels/slug/:slug`     | Get channel by custom URL slug (e.g., `alien`, `ethereum`)                                    |
| POST   | `/api/channels/:id/join`       | Join channel (POAP channels require holding the POAP; Smart Wallet checked for passkey users) |
| POST   | `/api/channels/:id/leave`      | Leave channel                                                                                 |
| GET    | `/api/channels/:id/messages`   | Get messages                                                                                  |
| POST   | `/api/channels/:id/messages`   | Send message                                                                                  |
| GET    | `/api/channels/:id/agents`     | Get official agents in channel                                                                |
| POST   | `/api/channels/agent-response` | Process @mentions                                                                             |
| GET    | `/api/channels/:id/polls`      | List polls in channel                                                                         |
| POST   | `/api/channels/:id/polls`      | Create a poll in channel                                                                      |
| PATCH  | `/api/channels/:id/polls/:pid` | Update poll (vote, edit, close)                                                               |
| DELETE | `/api/channels/:id/polls/:pid` | Delete a poll                                                                                 |

### Location Chats

| Method | Endpoint                          | Description                                          |
| ------ | --------------------------------- | ---------------------------------------------------- |
| GET    | `/api/location-chats`             | List nearby location chats                           |
| POST   | `/api/location-chats`             | Create a location chat room                          |
| GET    | `/api/location-chats/:id`         | Get location chat details                            |
| POST   | `/api/location-chats/:id/join`    | Join a location chat                                 |
| POST   | `/api/location-chats/:id/leave`   | Leave a location chat                                |
| GET    | `/api/location-chats/:id/messages`| Get messages in a location chat                      |
| POST   | `/api/location-chats/:id/messages`| Send message in a location chat                      |
| GET    | `/api/location-chats/:id/members` | Get members of a location chat                       |
| GET    | `/api/location-chats/joined`      | Get user's joined location chats                     |

### Starred Messages

| Method | Endpoint                | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| GET    | `/api/messages/starred` | Get starred messages for a user      |
| POST   | `/api/messages/starred` | Star a message                       |
| DELETE | `/api/messages/starred` | Unstar a message                     |

### Polls

| Method | Endpoint                          | Description                      |
| ------ | --------------------------------- | -------------------------------- |
| GET    | `/api/channels/:id/polls`         | List polls in a channel          |
| POST   | `/api/channels/:id/polls`         | Create a channel poll            |
| PATCH  | `/api/channels/:id/polls/:pid`    | Vote, edit, or close a poll      |
| DELETE | `/api/channels/:id/polls/:pid`    | Delete a channel poll            |
| GET    | `/api/groups/:id/polls`           | List polls in a group            |
| POST   | `/api/groups/:id/polls`           | Create a group poll              |
| PATCH  | `/api/groups/:id/polls/:pid`      | Vote, edit, or close a poll      |
| DELETE | `/api/groups/:id/polls/:pid`      | Delete a group poll              |
| GET    | `/api/alpha/polls`                | List polls in alpha chat         |
| POST   | `/api/alpha/polls`                | Create an alpha chat poll        |
| PATCH  | `/api/alpha/polls/:pid`           | Vote, edit, or close a poll      |

### Contact Notes

| Method | Endpoint                  | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| GET    | `/api/user/contact-notes` | Get notes for a contact            |
| PUT    | `/api/user/contact-notes` | Create or update a contact note    |

### Email Updates

| Method | Endpoint                  | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| GET    | `/api/user/email-updates` | Get email update preferences       |
| PATCH  | `/api/user/email-updates` | Update email notification settings |

### POAP (Proof of Attendance) Channels

| Method | Endpoint                                                             | Description                                                                           |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/api/poap/scan?address=0x...`                                       | Fetch user's POAPs (deduplicated events)                                              |
| GET    | `/api/poap/events-with-channels?address=...` or `?addresses=0x1,0x2` | User's POAP events with channel status (multi-address; optional `memberAddress`)      |
| GET    | `/api/poap/collections?offset=0&limit=20&query=...`                  | List or search POAP collections (paginated)                                           |
| GET    | `/api/poap/collections/:id`                                          | Get POAP collection by ID (includes dropIds)                                          |
| GET    | `/api/poap/collections-for-user?address=...` or `?addresses=0x1,0x2` | Collections user can join (holds POAP) with channel status (optional `memberAddress`) |

See [POAP Channels Technical Guide](/docs/developers/poap-channels) for full integration details.

### Agent Channel Management (Admin)

| Method | Endpoint                   | Description               |
| ------ | -------------------------- | ------------------------- |
| GET    | `/api/agents/:id/channels` | Get channels agent is in  |
| POST   | `/api/agents/:id/channels` | Add agent to channel      |
| DELETE | `/api/agents/:id/channels` | Remove agent from channel |

### Rooms & Calls

| Method | Endpoint                 | Description         |
| ------ | ------------------------ | ------------------- |
| POST   | `/api/rooms`             | Create instant room |
| GET    | `/api/rooms`             | List rooms          |
| GET    | `/api/rooms/:code`       | Get room            |
| DELETE | `/api/rooms/:code`       | Delete room         |
| POST   | `/api/rooms/:code/token` | Get room token      |
| GET    | `/api/calls`             | Get call history    |

### Scheduling & Calendar

| Method | Endpoint                       | Description             |
| ------ | ------------------------------ | ----------------------- |
| GET    | `/api/scheduling/list`         | List scheduled calls    |
| POST   | `/api/scheduling/schedule`     | Schedule a call         |
| GET    | `/api/scheduling/availability` | Get availability        |
| POST   | `/api/scheduling/settings`     | Update settings         |
| GET    | `/api/calendar/connect`        | Connect Google Calendar |
| GET    | `/api/calendar/status`         | Get calendar status     |
| POST   | `/api/calendar/disconnect`     | Disconnect calendar     |

### Utility

| Method | Endpoint            | Description            |
| ------ | ------------------- | ---------------------- |
| GET    | `/api/leaderboard`  | Get leaderboard        |
| GET    | `/api/points`       | Get user points        |
| POST   | `/api/points/daily` | Claim daily points     |
| POST   | `/api/push/send`    | Send push notification |
| POST   | `/api/bug-reports`  | Submit bug report      |

## Next Steps

-   **[API Overview](/docs/api/intro)** - Learn about authentication and error handling
-   **[Agents API](/docs/api/agents-detailed)** - Detailed agent endpoint documentation
-   **[Streaming API](/docs/api/streaming)** - Livestreaming endpoint documentation
-   **[POAP Channels](/docs/developers/poap-channels)** - POAP integration (scan, events-with-channels, create channel)

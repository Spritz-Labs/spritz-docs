---
title: Complete API Reference
description: Complete overview of all Spritz REST API endpoints for agents, streaming, authentication, wallets, and more.
keywords:
    [
        Spritz API,
        REST API,
        API endpoints,
        complete reference,
    ]
sidebar_class_name: hidden
---

# Complete API Reference

This page provides a quick overview of all available API endpoints. For detailed documentation on each endpoint, see the dedicated API reference pages.

## API Documentation

- **[API Overview](/docs/api/intro)** - Authentication, rate limiting, response formats
- **[Agents API](/docs/api/agents-detailed)** - Create, manage, and chat with AI agents
- **[Streaming API](/docs/api/streaming)** - Livestreaming endpoints

## Quick Endpoint Reference

### AI Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List agents |
| POST | `/api/agents` | Create agent |
| GET | `/api/agents/:id` | Get agent details |
| DELETE | `/api/agents/:id` | Delete agent |
| POST | `/api/agents/:id/chat` | Chat with agent |
| GET | `/api/agents/:id/chat` | Get chat history |
| DELETE | `/api/agents/:id/chat` | Clear chat history |
| GET | `/api/agents/:id/knowledge` | Get knowledge base |
| POST | `/api/agents/:id/knowledge` | Add knowledge URL |
| DELETE | `/api/agents/:id/knowledge` | Remove knowledge URL |
| POST | `/api/agents/:id/knowledge/index` | Index knowledge |
| GET | `/api/agents/discover` | Discover public agents |
| GET | `/api/agents/favorites` | Get favorites |
| POST | `/api/agents/favorites` | Add favorite |
| DELETE | `/api/agents/favorites` | Remove favorite |
| GET | `/api/agents/:id/embed` | Get embed code |
| POST | `/api/public/agents/:id/chat` | Public agent chat (x402) |

### Livestreaming

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streams` | List streams |
| POST | `/api/streams` | Create stream |
| GET | `/api/streams/:id` | Get stream |
| DELETE | `/api/streams/:id` | Delete stream |
| GET | `/api/streams/:id/assets` | Get recordings |
| POST | `/api/streams/:id/chat` | Send chat message |
| POST | `/api/streams/:id/viewers` | Join stream |
| DELETE | `/api/streams/:id/viewers` | Leave stream |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/verify` | Verify SIWE signature |
| POST | `/api/auth/verify-solana` | Verify SIWS signature |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/world-id` | Verify World ID |
| POST | `/api/auth/alien-id` | Verify Alien ID |

### Passkeys

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/passkey/register/options` | Get registration options |
| POST | `/api/passkey/register/verify` | Verify registration |
| POST | `/api/passkey/login/options` | Get login options |
| POST | `/api/passkey/login/verify` | Verify login |
| GET | `/api/passkey/credentials` | List passkeys |
| DELETE | `/api/passkey/credential` | Remove passkey |

### Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/balances` | Get token balances |
| GET | `/api/wallet/transactions` | Get transaction history |
| POST | `/api/wallet/smart-wallet` | Get/create smart wallet |
| GET | `/api/wallet/safe-status` | Get Safe deployment status |

### Username

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/username` | Get username for address |
| POST | `/api/username` | Claim/update username |
| DELETE | `/api/username` | Remove username |
| GET | `/api/username/resolve` | Resolve username to address |

### Friends & Social

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | List friends |
| GET | `/api/profile/widgets` | Get profile widgets |
| POST | `/api/profile/widgets` | Update profile widgets |
| GET | `/api/profile/theme` | Get profile theme |
| POST | `/api/profile/theme` | Update profile theme |

### Channels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/channels` | List channels |
| POST | `/api/channels` | Create channel |
| GET | `/api/channels/:id` | Get channel |
| POST | `/api/channels/:id/join` | Join channel |
| POST | `/api/channels/:id/leave` | Leave channel |
| GET | `/api/channels/:id/messages` | Get messages |
| POST | `/api/channels/:id/messages` | Send message |

### Rooms & Calls

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms` | Create instant room |
| GET | `/api/rooms` | List rooms |
| GET | `/api/rooms/:code` | Get room |
| DELETE | `/api/rooms/:code` | Delete room |
| POST | `/api/rooms/:code/token` | Get room token |
| GET | `/api/calls` | Get call history |

### Scheduling & Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scheduling/list` | List scheduled calls |
| POST | `/api/scheduling/schedule` | Schedule a call |
| GET | `/api/scheduling/availability` | Get availability |
| POST | `/api/scheduling/settings` | Update settings |
| GET | `/api/calendar/connect` | Connect Google Calendar |
| GET | `/api/calendar/status` | Get calendar status |
| POST | `/api/calendar/disconnect` | Disconnect calendar |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Get leaderboard |
| GET | `/api/points` | Get user points |
| POST | `/api/points/daily` | Claim daily points |
| POST | `/api/push/send` | Send push notification |
| POST | `/api/bug-reports` | Submit bug report |

## Next Steps

- **[API Overview](/docs/api/intro)** - Learn about authentication and error handling
- **[Agents API](/docs/api/agents-detailed)** - Detailed agent endpoint documentation
- **[Streaming API](/docs/api/streaming)** - Livestreaming endpoint documentation

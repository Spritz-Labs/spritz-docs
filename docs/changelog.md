---
title: Changelog
description: Release notes and version history for Spritz. Track new features, improvements, and bug fixes.
keywords:
    [
        Spritz changelog,
        release notes,
        version history,
        updates,
        new features,
    ]
sidebar_label: Changelog
sidebar_position: 99
---

# Changelog

All notable changes to Spritz are documented here.

## [Unreleased]

### Added
- Passkey support for vault deployment and transaction execution
- `wallet_type` tracking in session management
- `getPasskeySafeAddress` function for passkey-based smart accounts

### Changed
- Enhanced vault execution flow to support passkey signers
- Improved authentication documentation with wallet type detection

---

## [1.3.0] - 2026-01-15

### Added
- **AI Agents x402 Monetization**: Agents can now charge for interactions using the x402 payment protocol
- **MCP Server Integration**: Connect agents to external tools via Model Context Protocol
- **Agent Discovery**: Browse and discover public agents with tag-based filtering
- **Agent Favorites**: Save your favorite agents for quick access

### Changed
- Upgraded Gemini models to 2.0 Flash and 2.0 Flash Lite
- Improved RAG retrieval accuracy with hybrid search
- Enhanced agent personality customization options

### Fixed
- Agent knowledge base indexing failures on large documents
- Chat history pagination issues
- Memory leak in long agent conversations

---

## [1.2.0] - 2025-12-01

### Added
- **Livestreaming**: Go live with Livepeer integration
- **Stream Chat**: Real-time chat during livestreams
- **Stream Analytics**: View count, engagement metrics
- **VOD Support**: Automatic recording and playback

### Changed
- Improved video call quality with adaptive bitrate
- Enhanced screen sharing resolution options

### Fixed
- Audio sync issues in group calls
- Screen share stopping unexpectedly

---

## [1.1.0] - 2025-10-15

### Added
- **Public Channels**: Community channels for topic-based discussions
- **Channel Moderation**: Admin tools for managing channels
- **Message Pinning**: Pin important messages in channels
- **Channel Categories**: Organize channels by topic

### Changed
- Redesigned channel browser interface
- Improved message delivery reliability

### Fixed
- Channel join notifications not appearing
- Message ordering issues in high-traffic channels

---

## [1.0.0] - 2025-09-01

### Added
- **Core Messaging**: End-to-end encrypted DMs via Waku
- **Group Chats**: Private group conversations
- **Video Calls**: 1:1 and group video via Huddle01
- **Smart Wallets**: Account abstraction with Safe
- **Passkey Authentication**: Passwordless login
- **SIWE/SIWS**: Wallet-based authentication
- **AI Agents**: Create and chat with custom AI agents
- **Knowledge Bases**: RAG-powered agent memory
- **Calendar Integration**: Schedule calls and manage availability
- **Profile Customization**: Bento-style profile widgets
- **Friend System**: Add friends, organize with tags

### Technical
- Next.js 14+ with App Router
- Supabase for database and auth
- Tailwind CSS for styling
- TypeScript throughout

---

## Migration Guides

### Upgrading to 1.3.0

If you're upgrading from 1.2.x, run these migrations:

```sql
-- Add x402 support to agents
\i migrations/agents_x402.sql

-- Add MCP server configuration
\i migrations/agents_mcp.sql
```

### Upgrading to 1.2.0

Livestreaming requires new environment variables:

```bash
LIVEPEER_API_KEY=your_livepeer_key
```

Run the streaming migration:

```sql
\i migrations/streaming_analytics.sql
```

---

## Versioning

Spritz follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes to API or database schema
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Contributing

See our [contribution guidelines](https://github.com/spritz-chat/spritz/CONTRIBUTING.md) for how to submit changes.

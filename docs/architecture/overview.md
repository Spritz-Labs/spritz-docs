# Architecture Overview

## System Architecture

Spritz is built as a **Next.js 16** application using the App Router, with a **PostgreSQL** backend for data persistence and real-time features.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Next.js    │  │   React 19   │  │  TypeScript  │    │
│  │  App Router  │  │   Components │  │   Type Safe  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Agents     │  │  Streaming   │  │  Auth/SIWE  │    │
│  │   Endpoints  │  │  Endpoints   │  │  Endpoints   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Spritz     │   │  Livepeer    │   │  Google      │
│   Database   │   │  Streaming   │   │  Gemini AI   │
│  + pgvector  │   │  + WebRTC    │   │  + Embeddings│
└──────────────┘   └──────────────┘   └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │Logos         │  │  Huddle01    │  │  x402        │    │
│  │  Messaging   │  │  Video Calls │  │  Payments    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **State Management**: React Context + TanStack Query
- **3D Graphics**: Three.js with React Three Fiber
- **Animations**: Motion (Framer Motion)

### Backend

- **Database**: PostgreSQL 15+ with pgvector
- **Vector Search**: pgvector extension
- **Realtime**: WebSocket subscriptions
- **Storage**: Cloud storage (for file uploads)
- **Token Data**: The Graph Token API (balances, transactions, spam filtering)

### AI & ML

- **LLM**: Google Gemini 2.0 Flash
- **Embeddings**: Google text-embedding-004 (768 dimensions)
- **RAG**: Vector similarity search with pgvector
- **Web Search**: Google Search grounding via Gemini

### Streaming

- **Platform**: Livepeer Studio
- **Ingestion**: WebRTC via WHIP protocol
- **Playback**: HLS adaptive streaming
- **Recording**: Automatic VOD generation

### Video Calls

- **Platform**: Huddle01
- **Protocol**: WebRTC
- **Features**: Group calls, screen sharing, recording

### Messaging

- **Protocol**: [Logos Messaging](https://logos.co/tech-stack)
- **Encryption**: ECDH key exchange + AES-256-GCM (upgraded from deterministic keys)
- **Transport**: Peer-to-peer relay network via Logos Messaging Light Node
- **Key Backup**: Optional PIN-protected cloud backup with PBKDF2 (100,000 iterations)

### Payments

- **Protocol**: x402 (Coinbase)
- **Network**: Base / Base Sepolia
- **Currency**: USDC
- **Facilitator**: x402.org/facilitator

### Fiat Onramp

- **Provider**: Coinbase Pay
- **Methods**: Credit/debit cards, bank transfers, Apple Pay, Google Pay
- **Assets**: ETH, USDC, and more
- **Chains**: Base, Ethereum, Polygon, Arbitrum, Optimism, BNB Chain, Unichain

> **Note**: Avalanche is supported for wallet operations but not for Coinbase Onramp purchases.

### Digital Identity

- **World ID**: Privacy-preserving human verification via World App
- **Alien ID**: SSO-based identity verification

### Authentication

- **EVM Chains**: SIWE (Sign-In with Ethereum)
- **Solana**: SIWS (Sign-In with Solana)
- **Passkeys**: ERC-4337 account abstraction via Pimlico
- **Wallet Connection**: Reown AppKit (WalletConnect)

## Data Flow

### Agent Chat Flow

```
User Message
    │
    ▼
┌─────────────────┐
│  API Endpoint   │
│  /agents/:id/chat│
└─────────────────┘
    │
    ├─► Check Authentication
    ├─► Load Agent Config
    ├─► Get Chat History (if sessionId)
    │
    ├─► RAG Context Retrieval (if enabled)
    │   │
    │   ├─► Generate Query Embedding
    │   ├─► Vector Similarity Search
    │   └─► Format Context
    │
    ├─► MCP Tool Discovery (if configured)
    │   │
    │   ├─► Discover Tools
    │   ├─► Get Tool Context
    │   └─► Prepare Tool Schemas
    │
    ├─► Build Prompt
    │   ├─► System Instructions
    │   ├─► Chat History
    │   ├─► RAG Context
    │   └─► User Message
    │
    ├─► Call Gemini API
    │   ├─► Web Search (if enabled)
    │   ├─► MCP Tools (if needed)
    │   └─► Generate Response
    │
    ├─► Store Messages
    ├─► Update Stats
    └─► Return Response
```

### Streaming Flow

```
Broadcaster
    │
    ├─► Create Stream (POST /api/streams)
    │   └─► Livepeer API: Create Stream
    │       └─► Returns: streamKey, playbackId
    │
    ├─► Start Broadcasting
    │   ├─► Get User Media (camera/mic)
    │   ├─► WebRTC Connection
    │   └─► WHIP to Livepeer
    │
    └─► Livepeer Processing
        ├─► Receive WebRTC Stream
        ├─► Transcode (720p, 480p, 360p)
        ├─► Generate HLS Manifest
        └─► Record for VOD

Viewer
    │
    ├─► Get Stream Info (GET /api/streams/:id)
    │   └─► Returns: playbackId, status
    │
    ├─► Load HLS Stream
    │   └─► hls.js: Load manifest
    │       └─► Adaptive quality selection
    │
    └─► Playback
        └─► Livepeer CDN: HLS segments
```

## Database Schema

### Core Tables

- `shout_users` - User accounts
- `shout_friends` - Friend relationships
- `shout_friend_requests` - Friend requests
- `shout_groups` - Group chat configurations
- `shout_group_members` - Group membership
- `shout_public_channels` - Public channel configurations
- `shout_channel_members` - Channel membership
- `shout_channel_messages` - Channel messages
- `shout_agents` - AI agent configurations
- `shout_agent_chats` - Agent chat history
- `shout_agent_knowledge` - Knowledge base URLs
- `shout_knowledge_chunks` - Vector embeddings
- `shout_streams` - Livestreaming sessions
- `shout_stream_assets` - Stream recordings
- `shout_stream_viewers` - Active viewer tracking
- `shout_call_history` - Voice/video call history
- `shout_calendar_connections` - Calendar OAuth connections
- `shout_scheduled_calls` - Scheduled meetings
- `passkey_credentials` - WebAuthn/passkey storage

### Indexes

- **Vector Search**: IVFFlat index on `shout_knowledge_chunks.embedding`
- **User Lookups**: Index on `shout_users.wallet_address`
- **Agent Queries**: Index on `shout_agents.owner_address`, `visibility`
- **Stream Queries**: Index on `shout_streams.user_address`, `status`

## Security Architecture

### Authentication

- **SIWE/SIWS**: Cryptographic signature verification
- **JWT Tokens**: Short-lived session tokens
- **Passkeys**: ERC-4337 smart accounts via Pimlico

### Authorization

- **Row Level Security (RLS)**: PostgreSQL RLS policies
- **Ownership Checks**: Verify resource ownership
- **Visibility Controls**: Private/Friends/Public access

### Data Protection

- **Encryption**: Symmetric key (AES-GCM) for Logos Messaging
- **HTTPS**: All API communication
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent abuse

## Scalability

### Horizontal Scaling

- **Stateless API**: Next.js API routes are stateless
- **Database**: Connection pooling via PgBouncer
- **CDN**: Livepeer CDN for streaming content

### Caching Strategy

- **MCP Tool Schemas**: 1-hour cache
- **Agent Configs**: 5-minute cache
- **Stream Metadata**: 2-minute cache
- **Vector Embeddings**: Permanent (in database)

### Performance Optimization

- **Vector Search**: IVFFlat approximate nearest neighbor
- **Batch Operations**: Batch embedding generation
- **Connection Pooling**: Reuse database connections
- **Lazy Loading**: Load chat history on demand

## Deployment

### Production Stack

- **Hosting**: Vercel (Next.js)
- **Database**: Managed PostgreSQL
- **CDN**: Vercel Edge Network + Livepeer CDN
- **Monitoring**: Vercel Analytics

### Environment Variables

See [Developer Installation - Environment Variables](/docs/developers/installation#environment-variables) for complete list.

### Build Process

```bash
npm run build  # Next.js production build
npm run start # Start production server
```

## Monitoring & Observability

### Logging

- **API Logs**: Console logging with structured format
- **Error Tracking**: Error boundaries + logging
- **Performance**: Vercel Analytics

### Metrics

- **Agent Usage**: Message counts, token usage
- **Stream Metrics**: Viewer counts, duration
- **API Performance**: Response times, error rates

## Future Architecture Considerations

- **Microservices**: Split agents into separate service
- **Message Queue**: Add queue for async processing
- **Caching Layer**: Redis for frequently accessed data
- **Search**: Elasticsearch for full-text search
- **Analytics**: Dedicated analytics service


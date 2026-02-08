---
title: Technical Architecture
description: "Complete technical architecture for Spritz. Next.js 16, PostgreSQL, Logos Messaging, Livepeer, Huddle01, and system design."
keywords: [Spritz, architecture, Next.js, Logos Messaging, Livepeer, Huddle01]
sidebar_label: Architecture Overview
sidebar_position: 0
---

# Technical Architecture

Complete technical architecture documentation for Spritz, covering system design, protocols, and implementation details.

## System Architecture

Spritz is built as a **Next.js 16** application using the App Router, with a **PostgreSQL** backend for data persistence and real-time features.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │   React 19   │  │  TypeScript  │      │
│  │  App Router  │  │   Components │  │   Type Safe  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Agents     │  │  Streaming   │  │  Auth/SIWE   │      │
│  │   Endpoints  │  │  Endpoints   │  │  Endpoints   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Supabase   │   │  Livepeer    │   │  Google      │
│   Database   │   │  Streaming   │   │  Gemini AI   │
│  + pgvector  │   │  + WebRTC    │   │  + Embeddings│
└──────────────┘   └──────────────┘   └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Logos         │  │  Huddle01    │  │  x402        │      │
│  │  Messaging   │  │  Video Calls │  │  Payments    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Messaging Protocol

### Overview

Spritz uses **[Logos Messaging](https://logos.co/tech-stack)** (formerly Waku) for decentralized, peer-to-peer messaging with end-to-end encryption.

### Protocol Stack

| Layer             | Technology                 | Purpose               |
| ----------------- | -------------------------- | --------------------- |
| **Transport**     | Logos Messaging Light Node | P2P message relay     |
| **Encryption**    | ECDH P-256 + AES-256-GCM   | End-to-end encryption |
| **Serialization** | Protocol Buffers           | Message encoding      |
| **Persistence**   | Supabase + localStorage    | Message storage       |

### ECDH Key Exchange

**Security Model**: Keys are derived using Elliptic Curve Diffie-Hellman (ECDH), not from wallet addresses alone. This prevents attackers who know both wallet addresses from computing the encryption key.

```
┌─────────────────────────────────────────────────────────────┐
│              ECDH Key Exchange Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User A                           User B                     │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │ Generate P-256  │              │ Generate P-256  │       │
│  │ Keypair (local) │              │ Keypair (local) │       │
│  │ - privateKeyA   │              │ - privateKeyB   │       │
│  │ - publicKeyA    │              │ - publicKeyB    │       │
│  └─────────────────┘              └─────────────────┘       │
│         │                                │                   │
│         ▼                                ▼                   │
│  Store publicKeyA in              Store publicKeyB in        │
│  Supabase (for B to fetch)        Supabase (for A to fetch) │
│         │                                │                   │
│         └────────────┬───────────────────┘                  │
│                      ▼                                       │
│  Both derive same shared secret:                             │
│  sharedSecret = ECDH(myPrivate, theirPublic)                │
│                      │                                       │
│                      ▼                                       │
│  AES-256-GCM key = sharedSecret (256 bits)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Generation (P-256)**:

```typescript
const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable
    ["deriveBits"]
);
```

**Shared Secret Derivation**:

```typescript
const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    256 // 256 bits = 32 bytes
);
```

### Message Encryption (AES-256-GCM)

All messages are encrypted before transmission:

```typescript
// Generate random IV for each message
const iv = crypto.getRandomValues(new Uint8Array(12));

// Encrypt with AES-GCM
const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    messageData
);

// Output: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes)
```

**Security Properties**:

-   **Confidentiality**: AES-256 encryption
-   **Integrity**: GCM authentication tag
-   **Replay Protection**: Unique IV per message

### Key Backup (Optional)

Users can opt-in to cloud backup with PIN protection:

| Component           | Details                           |
| ------------------- | --------------------------------- |
| **Recovery Phrase** | 12 words (96 bits entropy)        |
| **PIN**             | 6 digits                          |
| **Key Derivation**  | PBKDF2-SHA256, 100,000 iterations |
| **Encryption**      | AES-256-GCM                       |

```typescript
// Key derivation from phrase + PIN
const derivedBits = await crypto.subtle.deriveBits(
    {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000,
        hash: "SHA-256",
    },
    keyMaterial,
    256
);
```

### Message Format (Protobuf)

```protobuf
message ChatMessage {
    uint64 timestamp = 1;      // Unix timestamp (ms)
    string sender = 2;         // Sender address
    string content = 3;        // Encrypted message text
    string messageId = 4;      // UUID v4
    string messageType = 5;    // "text", "pixel_art", "system"
}
```

### Content Topics

Messages are routed via content topics:

| Type       | Topic Format                            | Example                          |
| ---------- | --------------------------------------- | -------------------------------- |
| **DMs**    | `/spritz/1/dm-{sorted-addresses}/proto` | `/spritz/1/dm-0xabc-0xdef/proto` |
| **Groups** | `/spritz/1/group-{groupId}/proto`       | `/spritz/1/group-abc123/proto`   |

### Hybrid Persistence

Messages are stored in multiple layers for reliability:

| Layer                     | Retention | Encryption     | Purpose            |
| ------------------------- | --------- | -------------- | ------------------ |
| **Logos Messaging Store** | ~30 days  | E2E            | Real-time delivery |
| **Supabase**              | Permanent | E2E (same key) | Long-term backup   |
| **localStorage**          | Permanent | E2E            | Offline access     |

### Legacy Key Compatibility

For backwards compatibility with messages sent before ECDH migration:

```typescript
// Old deterministic key (DEPRECATED - kept for decryption only)
const seed = `spritz-dm-key-v1:${address1}:${address2}`;
const legacyKey = await crypto.subtle.digest("SHA-256", seed);

// Decryption tries ECDH key first, falls back to legacy
if (decryptWithECDH(message) fails) {
    return decryptWithLegacy(message);
}
```

---

## Video Calls Protocol

### Overview

Spritz uses **Huddle01** for decentralized video calls with WebRTC.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Video Call Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Room Creation                                            │
│  ┌──────────┐    POST /api/v2/sdk/rooms/create-room         │
│  │  Spritz  │ ─────────────────────────────────────────►    │
│  │  Server  │    { roomLocked: false, metadata: {...} }     │
│  └──────────┘ ◄─────────────────────────────────────────    │
│       │              { roomId: "abc-def-ghi" }              │
│       │                                                      │
│  2. Token Generation (per participant)                       │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐    AccessToken.toJwt()                        │
│  │  Huddle01│    - roomId, role: HOST                       │
│  │   SDK    │    - permissions: cam, mic, screen, data      │
│  └──────────┘    - metadata: displayName, walletAddress     │
│       │                                                      │
│  3. WebRTC Connection                                        │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐         ┌──────────┐                          │
│  │ Client A │ ◄─────► │ Client B │  (via Huddle01 SFU)     │
│  │ (WebRTC) │         │ (WebRTC) │                          │
│  └──────────┘         └──────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Room Creation

```typescript
// API: POST /api/huddle01/room
const response = await fetch(
    "https://api.huddle01.com/api/v2/sdk/rooms/create-room",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": HUDDLE01_API_KEY,
        },
        body: JSON.stringify({
            roomLocked: false,
            metadata: {
                title: "Spritz Call",
                hostWallets: [hostWallet],
            },
        }),
    }
);
// Returns: { roomId: "xyz-abc-123" }
```

### Token Generation

```typescript
import { AccessToken, Role } from "@huddle01/server-sdk/auth";

const accessToken = new AccessToken({
    apiKey: HUDDLE01_API_KEY,
    roomId: roomId,
    role: Role.HOST,
    permissions: {
        admin: true,
        canConsume: true, // Receive media
        canProduce: true, // Send media
        canProduceSources: {
            cam: true,
            mic: true,
            screen: true,
        },
        canRecvData: true,
        canSendData: true,
        canUpdateMetadata: true,
    },
    options: {
        metadata: {
            displayName: displayName,
            walletAddress: userAddress,
        },
    },
});

const token = await accessToken.toJwt();
```

### Call Types

| Type           | Implementation              | Max Participants |
| -------------- | --------------------------- | ---------------- |
| **1:1 Call**   | Single room, both as HOST   | 2                |
| **Group Call** | Single room, all as HOST    | 10+              |
| **Voice Only** | Camera disabled client-side | Unlimited        |

### WebRTC Configuration

-   **ICE Servers**: Managed by Huddle01
-   **Codec**: VP8/VP9 for video, Opus for audio
-   **Topology**: Selective Forwarding Unit (SFU)
-   **Encryption**: DTLS-SRTP (WebRTC standard)

---

## Livestreaming Protocol

### Overview

Spritz uses **Livepeer** for decentralized livestreaming with WebRTC ingestion and HLS playback.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Livestream Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Broadcaster                                                 │
│  ┌──────────┐                                               │
│  │  Camera  │                                               │
│  │   +Mic   │                                               │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────┐                                       │
│  │   WebRTC/WHIP    │  https://livepeer.studio/webrtc/{key} │
│  │    Ingestion     │                                       │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │     Livepeer     │  Transcoding:                         │
│  │    Processing    │  - 720p @ 2 Mbps                      │
│  │                  │  - 480p @ 1 Mbps                      │
│  │                  │  - 360p @ 0.5 Mbps                    │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │    Livepeer CDN  │  HLS Manifest:                        │
│  │   (HLS Delivery) │  livepeercdn.studio/hls/{id}/index.m3u8│
│  └────────┬─────────┘                                       │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Viewer 1 │  │ Viewer 2 │  │ Viewer N │  (Adaptive HLS)  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Stream Creation

```typescript
// Create stream on Livepeer
const response = await fetch("https://livepeer.studio/api/stream", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LIVEPEER_API_KEY}`,
    },
    body: JSON.stringify({
        name: streamTitle,
        record: true, // Enable VOD recording
        profiles: [
            {
                name: "720p",
                bitrate: 2000000,
                fps: 30,
                width: 1280,
                height: 720,
            },
            {
                name: "480p",
                bitrate: 1000000,
                fps: 30,
                width: 854,
                height: 480,
            },
            { name: "360p", bitrate: 500000, fps: 30, width: 640, height: 360 },
        ],
    }),
});

// Returns:
// {
//   id: "stream-id",
//   streamKey: "xxxx-xxxx-xxxx",
//   playbackId: "yyyy-yyyy",
//   rtmpIngestUrl: "rtmp://rtmp.livepeer.com/live/{streamKey}"
// }
```

### Ingestion (WHIP Protocol)

**WebRTC-HTTP Ingestion Protocol (WHIP)** enables low-latency browser-based streaming:

```typescript
// WebRTC ingest URL
const ingestUrl = `https://livepeer.studio/webrtc/${streamKey}`;

// Using @livepeer/react Broadcast component
<Broadcast.Root ingestUrl={ingestUrl}>
    <Broadcast.Container>
        <Broadcast.Video />
    </Broadcast.Container>
</Broadcast.Root>;
```

### Playback (HLS)

```typescript
// HLS playback URL
const playbackUrl = `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;

// Using hls.js for playback
import Hls from "hls.js";

const hls = new Hls();
hls.loadSource(playbackUrl);
hls.attachMedia(videoElement);
```

### Stream States

| State     | Description                      |
| --------- | -------------------------------- |
| **idle**  | Stream created, not broadcasting |
| **live**  | Currently broadcasting           |
| **ended** | Stream terminated                |

### Recording (VOD)

Streams are automatically recorded when `record: true`:

```typescript
// Get recordings for a stream
const assets = await fetch(
    `https://livepeer.studio/api/stream/${streamId}/assets`,
    { headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` } }
);

// Asset structure:
// {
//   id: "asset-id",
//   playbackId: "playback-id",
//   playbackUrl: "https://livepeercdn.studio/hls/{id}/index.m3u8",
//   downloadUrl: "...",
//   status: { phase: "ready", progress: 100 },
//   videoSpec: { duration: 1234 }
// }
```

---

## Authentication & Smart Wallets

### Overview

Spritz supports multiple authentication methods, all providing access to a Safe Smart Account for on-chain transactions.

### Two Address System

| Address           | Purpose                                      | Source              |
| ----------------- | -------------------------------------------- | ------------------- |
| **Spritz ID**     | Social identity (profile, friends, messages) | Auth-dependent      |
| **Spritz Wallet** | On-chain funds (Safe Smart Account)          | Derived from signer |

### Authentication Methods

| Method         | Spritz ID             | Wallet Signer         | Immediate Wallet? |
| -------------- | --------------------- | --------------------- | ----------------- |
| **EVM Wallet** | Wallet address        | Wallet EOA            | ✅ Yes            |
| **Passkey**    | Hash of credential ID | WebAuthn P-256        | ✅ Yes            |
| **Email**      | Derived or existing   | Passkey (must create) | ❌ No             |
| **World ID**   | nullifier_hash        | Passkey (must create) | ❌ No             |
| **Alien ID**   | alienAddress          | Passkey (must create) | ❌ No             |
| **Solana**     | Solana address        | Passkey (must create) | ❌ No             |

:::info Alien ID Dual-Flow Authentication
Alien ID supports two authentication flows: **SSO** (browser-based via `@alien_org/sso-sdk-react`) and **Mini App** (embedded inside the Alien app via `@alien_org/bridge`). Both flows validate a JWT token and create a session with `wallet_type = "alien_id"`. Alien ID users are automatically joined to the official "alien" channel on first login. See [Alien Integration](/docs/developers/alien-integration) for the complete technical guide.
:::

### Safe Smart Account Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Safe Smart Account                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────┐                │
│  │           Safe Proxy v1.4.1              │                │
│  │  Address: Deterministic across all chains│                │
│  └─────────────────────────────────────────┘                │
│                      │                                       │
│                      ▼                                       │
│  ┌─────────────────────────────────────────┐                │
│  │              Owner(s)                    │                │
│  │  - EOA Wallet Address                    │                │
│  │  OR                                      │                │
│  │  - WebAuthn Signer (P-256 passkey)      │                │
│  │  + Optional Recovery Signer             │                │
│  └─────────────────────────────────────────┘                │
│                      │                                       │
│                      ▼                                       │
│  ┌─────────────────────────────────────────┐                │
│  │         ERC-4337 Integration             │                │
│  │  - EntryPoint v0.7                       │                │
│  │  - Pimlico Bundler                       │                │
│  │  - Pimlico Paymaster (sponsorship)      │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Supported Chains

| Chain     | ID    | Gas Payment             | Pimlico Network |
| --------- | ----- | ----------------------- | --------------- |
| Ethereum  | 1     | USDC (ERC-20 paymaster) | `ethereum`      |
| Base      | 8453  | Sponsored               | `base`          |
| Arbitrum  | 42161 | Sponsored               | `arbitrum`      |
| Optimism  | 10    | Sponsored               | `optimism`      |
| Polygon   | 137   | Sponsored               | `polygon`       |
| BNB Chain | 56    | Sponsored               | `binance`       |
| Unichain  | 130   | Sponsored               | `unichain`      |
| Avalanche | 43114 | Sponsored               | `avalanche`     |

### WebAuthn/Passkey Signing

For passkey users, transactions are signed using WebAuthn:

```typescript
// Create WebAuthn account from passkey
const webAuthnAccount = toWebAuthnAccount({
    credential: {
        id: credentialId, // Base64url credential ID
        publicKey: `0x${x}${y}`, // P-256 public key (64 bytes)
    },
    rpId: "spritz.chat", // Relying party ID
});

// Create Safe with WebAuthn owner
const safeAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [webAuthnAccount],
    version: "1.4.1",
    entryPoint: { address: entryPoint07Address, version: "0.7" },
    saltNonce: BigInt(0),
    // WebAuthn verification contracts
    safeWebAuthnSharedSignerAddress:
        "0x94a4F6affBd8975951142c3999aEAB7ecee555c2",
    safeP256VerifierAddress: "0xA86e0054C51E4894D88762a017ECc5E5235f5DBA",
});
```

### Gas Sponsorship

**L2 Chains**: Transactions are sponsored via Pimlico's sponsorship policy.

```typescript
// Get paymaster context for sponsored chains
const paymasterContext = { sponsorshipPolicyId: policyId };

const client = createSmartAccountClient({
    account: safeAccount,
    chain,
    bundlerTransport: http(pimlicoBundlerUrl),
    paymaster: pimlicoClient,
    paymasterContext,
});
```

**Ethereum Mainnet**: Users pay gas in USDC via ERC-20 paymaster.

```typescript
// ERC-20 paymaster for mainnet
const paymasterContext = {
    token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
};
```

---

## AI Agents

### RAG Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG Pipeline                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Knowledge Indexing                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │   URL    │ ─► │  Fetch   │ ─► │  Chunk   │              │
│  │  Input   │    │ Content  │    │ (~500    │              │
│  └──────────┘    └──────────┘    │  tokens) │              │
│                                   └────┬─────┘              │
│                                        │                    │
│                                        ▼                    │
│                               ┌──────────────┐              │
│                               │   Generate   │              │
│                               │  Embeddings  │              │
│                               │  (768 dims)  │              │
│                               └──────┬───────┘              │
│                                      │                      │
│                                      ▼                      │
│                               ┌──────────────┐              │
│                               │   pgvector   │              │
│                               │   Storage    │              │
│                               └──────────────┘              │
│                                                              │
│  2. Query Processing                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  User    │ ─► │ Embed    │ ─► │ Vector   │              │
│  │  Query   │    │  Query   │    │ Search   │              │
│  └──────────┘    └──────────┘    │ (cosine) │              │
│                                   └────┬─────┘              │
│                                        │                    │
│                                        ▼                    │
│                               ┌──────────────┐              │
│                               │ Top-K chunks │              │
│                               │  + Context   │              │
│                               └──────┬───────┘              │
│                                      │                      │
│                                      ▼                      │
│                               ┌──────────────┐              │
│                               │   Gemini     │              │
│                               │  Generation  │              │
│                               └──────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Embedding Model

-   **Model**: Google text-embedding-004
-   **Dimensions**: 768
-   **Index**: IVFFlat (approximate nearest neighbor)

```sql
CREATE INDEX idx_knowledge_chunks_embedding
ON shout_knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Vector Similarity Search

```sql
CREATE FUNCTION match_knowledge_chunks(
    p_agent_id UUID,
    p_query_embedding vector(768),
    p_match_count INT DEFAULT 5,
    p_match_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (id UUID, content TEXT, similarity FLOAT, metadata JSONB)
AS $$
    SELECT
        kc.id,
        kc.content,
        1 - (kc.embedding <=> p_query_embedding) AS similarity,
        kc.metadata
    FROM shout_knowledge_chunks kc
    WHERE
        kc.agent_id = p_agent_id
        AND 1 - (kc.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY kc.embedding <=> p_query_embedding
    LIMIT p_match_count;
$$ LANGUAGE sql;
```

---

## x402 Payments

### Protocol Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    x402 Payment Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Client requests agent chat                               │
│  ┌──────────┐    POST /api/public/agents/{id}/chat          │
│  │  Client  │ ────────────────────────────────────────►     │
│  └──────────┘                                                │
│                                                              │
│  2. Server returns 402 Payment Required                      │
│  ◄──────────────────────────────────────────────────────    │
│  {                                                           │
│    "error": "Payment Required",                              │
│    "paymentRequirements": {                                  │
│      "x402Version": 1,                                       │
│      "accepts": [{ network: "base", amount: "10000" }]      │
│    }                                                         │
│  }                                                           │
│                                                              │
│  3. Client pays via x402-fetch                               │
│  ┌──────────┐    Automated payment                          │
│  │ x402-    │ ─────────────────────────────────────────►    │
│  │  fetch   │    X-Payment header with signed proof         │
│  └──────────┘                                                │
│                                                              │
│  4. Server verifies payment, processes request               │
│  ◄──────────────────────────────────────────────────────    │
│  { "message": "Agent response..." }                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Supported Networks

-   **Base** (mainnet): Production payments
-   **Base Sepolia**: Testing

### Integration

```typescript
import { wrapFetch } from "x402-fetch";

const paidFetch = wrapFetch(fetch, wallet);
const response = await paidFetch(
    "https://app.spritz.chat/api/public/agents/{id}/chat",
    {
        method: "POST",
        body: JSON.stringify({ message: "Hello!" }),
    }
);
```

---

## Security Architecture

### Authentication Security

| Layer               | Implementation                       |
| ------------------- | ------------------------------------ |
| **SIWE/SIWS**       | Cryptographic signature verification |
| **JWT Sessions**    | HTTP-only cookies (7 days)           |
| **CSRF Protection** | Origin validation                    |
| **Rate Limiting**   | Upstash Redis + sliding window       |

### Data Security

| Data Type          | Protection                       |
| ------------------ | -------------------------------- |
| **Messages**       | E2E encrypted (ECDH + AES-GCM)   |
| **Passkey Keys**   | Device-only storage (WebAuthn)   |
| **API Keys**       | Server-side only (never exposed) |
| **Session Tokens** | HTTP-only, secure, same-site     |

### Smart Wallet Security

| Risk             | Mitigation                       |
| ---------------- | -------------------------------- |
| **Passkey Loss** | Recovery signer option           |
| **Gas Griefing** | Sponsorship policies with limits |
| **Phishing**     | Domain-bound passkeys            |

---

## Tech Stack Summary

| Category                | Technology                       |
| ----------------------- | -------------------------------- |
| **Framework**           | Next.js 16 (App Router)          |
| **Language**            | TypeScript (strict)              |
| **Styling**             | Tailwind CSS 4                   |
| **Animations**          | Motion (Framer Motion)           |
| **3D Graphics**         | Three.js + React Three Fiber     |
| **Web3 (EVM)**          | viem, wagmi, permissionless.js   |
| **Web3 (Solana)**       | @solana/wallet-adapter           |
| **Account Abstraction** | Pimlico, Safe v1.4.1             |
| **Wallet Connection**   | Reown AppKit                     |
| **Video Calls**         | Huddle01 SDK                     |
| **Livestreaming**       | Livepeer (WHIP + HLS)            |
| **Messaging**           | Logos Messaging (Waku)           |
| **AI/LLM**              | Google Gemini 2.0 Flash          |
| **Embeddings**          | Google text-embedding-004        |
| **Vector Search**       | PostgreSQL pgvector              |
| **Database**            | Supabase (PostgreSQL + Realtime) |
| **Token Data**          | The Graph Token API              |
| **Push Notifications**  | Web Push API                     |
| **Payments**            | x402 Protocol                    |
| **Digital Identity**    | World ID, Alien ID               |

---

## Deployment

### Production Stack

-   **Hosting**: Vercel (Edge Runtime)
-   **Database**: Supabase (managed PostgreSQL)
-   **CDN**: Vercel Edge + Livepeer CDN
-   **Monitoring**: Vercel Analytics

### Environment Variables

See [Developer Installation Guide](/docs/developers/installation#environment-variables) for complete configuration.

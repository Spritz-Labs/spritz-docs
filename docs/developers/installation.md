---
title: Developer Installation Guide
description: Complete technical setup guide for running Spritz locally. Prerequisites, environment variables, database setup, and configuration.
keywords:
    [
        Spritz installation,
        developer setup,
        self-hosting,
        environment variables,
        database setup,
        PostgreSQL,
        Next.js,
    ]
sidebar_label: Installation
sidebar_position: 1
---

# Developer Installation Guide

This guide covers setting up Spritz for local development or self-hosting.

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL Database** (managed or self-hosted)
- **API Keys** for external services (see below)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Spritz-Labs/spritz.git
cd spritz

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Environment Variables

### Required Variables

```env
# Database (PostgreSQL with pgvector extension)
DATABASE_URL=postgresql://user:password@host:5432/database

# WalletConnect / Reown (for wallet connections)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Session & Security (REQUIRED)
JWT_SECRET=your_random_32_char_secret
SESSION_SECRET=your_random_32_char_secret

# Rate Limiting (Upstash Redis - REQUIRED for production)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# App URL (for callbacks and CORS)
NEXT_PUBLIC_APP_URL=https://app.spritz.chat
```

Get Upstash credentials at [Upstash Console](https://console.upstash.com/).

### AI Agents (Google Gemini)

```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

Get a key at [Google AI Studio](https://aistudio.google.com/).

### Video Calls

**Option A: Huddle01 (Decentralized - Recommended)**

```env
NEXT_PUBLIC_HUDDLE01_PROJECT_ID=your_project_id
NEXT_PUBLIC_HUDDLE01_API_KEY=your_api_key
HUDDLE01_API_KEY=your_api_key
```

Get keys at [Huddle01 Dashboard](https://huddle01.com/).

**Option B: Agora (Centralized Alternative)**

```env
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
NEXT_PUBLIC_AGORA_TOKEN_ENDPOINT=https://your-token-server.com/token
```

### Livestreaming (Livepeer)

```env
LIVEPEER_API_KEY=your_livepeer_api_key
```

Get a key at [Livepeer Studio](https://livepeer.studio/).

### Smart Accounts / Passkeys (Pimlico)

```env
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key
NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID=your_sponsorship_policy_id
```

Get a key at [Pimlico Dashboard](https://dashboard.pimlico.io/).

**Note**: The sponsorship policy ID is required for gas-free transactions on L2 networks. Without it, users will need to pay gas directly.

### RPC Configuration (dRPC)

```env
# dRPC - Reliable, load-balanced RPC endpoints (recommended)
NEXT_PUBLIC_DRPC_API_KEY=your_drpc_api_key
DRPC_API_KEY=your_drpc_api_key  # Server-side fallback
```

Get a key at [dRPC Dashboard](https://drpc.org/). dRPC provides reliable, load-balanced RPC endpoints for supported chains. If not configured, the app falls back to public RPCs (LlamaRPC, official chain RPCs).

**Supported Chains via dRPC:**
| Chain | Chain ID | dRPC Name |
|-------|----------|-----------|
| Ethereum | 1 | `ethereum` |
| Base | 8453 | `base` |
| Arbitrum | 42161 | `arbitrum` |
| Optimism | 10 | `optimism` |
| Polygon | 137 | `polygon` |
| BNB Chain | 56 | `bsc` |
| Avalanche | 43114 | `avalanche` |
| Unichain | 130 | `unichain` (fallback only) |

### Optional Variables

<details>
<summary>WebAuthn / Passkeys</summary>

```env
# WebAuthn Configuration (Required for passkey auth)
NEXT_PUBLIC_WEBAUTHN_RP_ID=spritz.chat
NEXT_PUBLIC_WEBAUTHN_RP_NAME=Spritz
```

Set `RP_ID` to your domain (without protocol). For local development, use `localhost`.

</details>

<details>
<summary>Push Notifications</summary>

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your@email.com
```

Generate VAPID keys with `npx web-push generate-vapid-keys`.

</details>

<details>
<summary>Phone Verification (Twilio)</summary>

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
```

</details>

<details>
<summary>Email Verification (Resend)</summary>

```env
RESEND_API_KEY=your_resend_api_key
```

</details>

<details>
<summary>File Storage (Pinata/IPFS)</summary>

```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud
```

</details>

<details>
<summary>Solana Support (Helius)</summary>

```env
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key
```

</details>

<details>
<summary>x402 Payments</summary>

```env
NEXT_PUBLIC_APP_URL=https://app.spritz.chat
X402_FACILITATOR_URL=https://x402.org/facilitator
```

</details>

<details>
<summary>Google Calendar</summary>

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/callback
```

</details>

<details>
<summary>GitHub Integration (Bug Reports)</summary>

```env
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repo_name
GITHUB_TOKEN=your_github_personal_access_token
```

</details>

<details>
<summary>Digital Identity</summary>

```env
# World ID
NEXT_PUBLIC_WORLD_ID_APP_ID=app_your_world_id_app_id
NEXT_PUBLIC_WORLD_ID_ACTION=your_action_name

# Alien ID (SSO + Mini App)
NEXT_PUBLIC_ALIEN_SSO_BASE_URL=https://sso.alien-api.com
NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS=000000010400000000000f89739b0806
```

Both Alien variables have sensible defaults and are only required if you have a custom Alien provider configuration. See [Alien Integration](/docs/developers/alien-integration) for the complete setup guide.

</details>

## Database Setup

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE spritz;
```

### 2. Enable Required Extensions

```sql
-- Connect to spritz database first
\c spritz

-- Enable pgvector for AI knowledge bases
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Run Migrations

Migrations are in the `/migrations` folder. There are 50+ migration files that must be run in a specific order.

#### Option A: Automated Script (Recommended)

```bash
#!/bin/bash
# run-migrations.sh

set -e  # Exit on error

MIGRATIONS_DIR="migrations"
DB_NAME="spritz"

# Get sorted list of migration files
migrations=$(ls -1 "$MIGRATIONS_DIR"/*.sql | sort)

for migration in $migrations; do
    echo "Running: $migration"
    psql -d "$DB_NAME" -f "$migration" || {
        echo "ERROR: Migration failed: $migration"
        exit 1
    }
    echo "✓ Completed: $migration"
done

echo "All migrations completed successfully!"
```

```bash
chmod +x run-migrations.sh
./run-migrations.sh
```

#### Option B: Manual Execution Order

Run migrations in this order (numbered files first, then alphabetical):

```
1. Core tables (no dependencies):
   - agents.sql
   - embeddings.sql
   - passkey_credentials.sql
   - email_login.sql

2. Dependent tables:
   - agents_x402.sql (requires agents.sql)
   - agents_mcp.sql (requires agents.sql)
   - agents_tags.sql (requires agents.sql)
   - favorite_agents.sql (requires agents.sql)

3. Social features:
   - group_chats.sql
   - public_channels.sql
   - friend_tags.sql

4. Numbered migrations (in order):
   - 041_moderation_system.sql
   - 042_profile_widgets.sql
   - 042_wallet_analytics.sql
   - 043_chat_folders.sql
   - 043_custom_avatar.sql
   - 044_agent_avatar.sql
   - 045_usernames.sql

5. Security (run last):
   - security_rls_sensitive_tables.sql
```

**Key Migration Categories:**

| Category | Files | Purpose |
|----------|-------|---------|
| **Core** | `agents.sql`, `embeddings.sql` | AI agents & vector search |
| **Auth** | `passkey_credentials.sql`, `email_login.sql` | Authentication systems |
| **Social** | `group_chats.sql`, `public_channels.sql`, `friend_tags.sql` | Social features |
| **Streaming** | `streaming_analytics.sql` | Livestreaming |
| **Scheduling** | `google_calendar.sql`, `scheduling_*.sql` | Calendar integration |
| **Payments** | `agents_x402.sql` | x402 monetization |
| **Security** | `security_rls_sensitive_tables.sql` | Row-level security |

:::warning Migration Dependencies
Some migrations depend on others. If you see a foreign key error, check that the referenced table exists first.
:::

See [Database Schema](/docs/database/schema) for complete documentation.

### 4. Verify Setup

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'shout_%';

-- Verify pgvector extension is installed
SELECT extversion FROM pg_extension WHERE extname = 'vector';

-- Verify core tables exist with expected columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shout_agents' 
ORDER BY ordinal_position;

-- Test vector search is working (should return 0 for new installations)
SELECT COUNT(*) FROM shout_knowledge_chunks;
```

## Project Structure

```
spritz/
├── src/
│   ├── app/           # Next.js App Router pages
│   │   ├── api/       # API routes
│   │   ├── admin/     # Admin pages
│   │   └── ...
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   └── types/         # TypeScript types
├── migrations/        # Database migrations
├── public/            # Static assets
└── ...
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL + pgvector |
| Realtime | PostgreSQL Realtime |
| Web3 (EVM) | viem, wagmi |
| Web3 (Solana) | @solana/wallet-adapter |
| Smart Accounts | Pimlico, Safe |
| Wallet UI | Reown AppKit |
| Video | Huddle01, Livepeer |
| Messaging | Logos Messaging (Waku) |
| AI | Google Gemini |
| RPC | dRPC (with fallback to public RPCs) |

### Supported Chains

| Chain | Chain ID | Gas Sponsorship |
|-------|----------|-----------------|
| Ethereum | 1 | USDC (paid) |
| Base | 8453 | Free |
| Arbitrum | 42161 | Free |
| Optimism | 10 | Free |
| Polygon | 137 | Free |
| BNB Chain | 56 | Free |
| Unichain | 130 | Free |
| Avalanche | 43114 | Free |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted

1. Build: `npm run build`
2. Set environment variables
3. Run: `npm start`
4. Use nginx/caddy as reverse proxy

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure pgvector extension is installed

### Wallet Connection Issues

- Verify `WALLETCONNECT_PROJECT_ID` is valid
- Check you're on a supported network
- Clear browser cache/local storage

### AI Agent Issues

- Verify `GOOGLE_GEMINI_API_KEY` is valid
- Check API quota hasn't been exceeded
- Review browser console for errors

### Video Call Issues

- Verify Huddle01/Agora API keys
- Check camera/microphone permissions
- Ensure HTTPS in production (required for WebRTC)

## Next Steps

- [API Reference](/docs/api/intro) - Integrate with Spritz
- [Database Schema](/docs/database/schema) - Understand the data model
- [Architecture](/docs/architecture/overview) - System design overview

## License

PolyForm Noncommercial License 1.0.0

Commercial use requires a separate license. Contact connect@spritz.chat.

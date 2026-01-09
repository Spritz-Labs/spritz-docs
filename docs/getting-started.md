---
title: Getting Started with Spritz
description: Complete installation and setup guide for Spritz. Learn how to install, configure environment variables, set up the database, and create your first AI agent.
keywords:
    [
        Spritz installation,
        Spritz setup,
        getting started,
        installation guide,
        environment variables,
        database setup,
        Supabase,
        AI agents,
        Web3 messaging,
    ]
---

# Getting Started

This guide will help you get started with Spritz, from installation to your first AI agent.

## Prerequisites

-   **Node.js** 18+ (recommended: 20+)
-   **npm** or **yarn** package manager
-   **Git** for version control
-   **Supabase Account** (free tier works)
-   **API Keys** for:
    -   Google Gemini (for AI agents)
    -   Huddle01 (for video calls)
    -   Livepeer (for livestreaming)
    -   Reown/WalletConnect (for wallet connections)
    -   Pimlico (for passkey authentication - optional)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Spritz-Labs/spritz.git
cd spritz
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

**Note:** The project uses Yarn 3.2.3 as specified in `package.json`, but npm also works.

3. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

**Note:** If `.env.example` doesn't exist yet, create it with the variables listed below.

### Required Environment Variables

```env
# Supabase (Database & Realtime)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WalletConnect / Reown
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### AI Agents

```env
# Google Gemini (required for AI agents)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

### Video Calls

**Option A: Huddle01 (Recommended - Decentralized)**

```env
# Huddle01
NEXT_PUBLIC_HUDDLE01_PROJECT_ID=your_huddle01_project_id
NEXT_PUBLIC_HUDDLE01_API_KEY=your_huddle01_api_key
HUDDLE01_API_KEY=your_huddle01_api_key
```

**Option B: Agora (Centralized Alternative)**

```env
# Agora (alternative to Huddle01)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
# Optional: Token endpoint for production (leave empty for testing mode)
NEXT_PUBLIC_AGORA_TOKEN_ENDPOINT=https://your-token-server.com/token
```

**Note:** You can use either Huddle01 or Agora, or both. Users can choose their preferred provider in settings. Huddle01 is decentralized, while Agora is centralized but may offer better reliability.

### Livestreaming

```env
# Livepeer
LIVEPEER_API_KEY=your_livepeer_api_key
```

### Smart Accounts (Passkeys)

```env
# Pimlico (ERC-4337)
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key
```

### Optional Environment Variables

```env
# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your@email.com

# Phone Verification (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

# Email Verification (Optional)
RESEND_API_KEY=your_resend_api_key

# Pixel Art Storage (Optional)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud

# Solana (Optional)
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key

# x402 Payments (Optional)
NEXT_PUBLIC_APP_URL=https://app.spritz.chat
X402_FACILITATOR_URL=https://x402.org/facilitator

# Google Calendar (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://app.spritz.chat/api/calendar/callback

# GitHub Integration (Optional - for bug reports)
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repo_name
GITHUB_TOKEN=your_github_personal_access_token
```

4. Run database migrations:

See the [Database Setup](#database-setup) section below for migration scripts. Run these in your Supabase SQL editor.

5. Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

**Note:** The Spritz app development server runs on port 3000 by default. The documentation site (this project) runs on port 3030.

## Database Setup

Spritz uses Supabase with several tables. Run these migrations in your Supabase SQL editor. See the `/migrations` folder in the repository for complete migration scripts.

### Enable Extensions

First, enable required PostgreSQL extensions:

```sql
-- Enable pgvector for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
```

### Run Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file from `/migrations` in order:
    - `agents.sql` - Core agent tables
    - `agents_x402.sql` - x402 payment configuration
    - `agents_mcp.sql` - MCP server support
    - `embeddings.sql` - Vector search setup
    - `streams.sql` - Streaming tables
    - And more...

### Verify Setup

Check that tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'shout_%';
```

For detailed schema documentation, see [Database Schema](/docs/database/schema).

## First Steps

### 1. Sign In to Spritz

Spritz supports multiple authentication methods:

**Option A: Wallet Connection (Web3)**

1. Click "Connect Wallet" in the top right
2. Select your wallet provider (Ethereum, Base, or Solana)
3. Sign the message to authenticate (SIWE/SIWS)

**Option B: Passkey Authentication (Passwordless)**

1. Click "Sign In with Passkey"
2. Use Face ID, Touch ID, or Windows Hello
3. A smart account will be created automatically

**Option C: Email Login**

1. Click "Sign In with Email"
2. Enter your email address
3. Check your inbox for a 6-digit verification code
4. Enter the code to sign in
5. A secure session will be created for you

**Note:** Email login uses a deterministic key derivation to create a wallet address from your email, allowing you to interact with Web3 features without managing private keys.

### 2. Create Your First AI Agent

1. Navigate to the Agents section
2. Click "Create Agent"
3. Fill in:
    - **Name**: Your agent's name
    - **Personality**: Describe how your agent should behave
    - **System Instructions**: Custom instructions for the agent
    - **Visibility**: Choose private, friends, or public
4. Click "Create"

### 3. Add Knowledge to Your Agent

1. Open your agent's settings
2. Go to the Knowledge Base section
3. Add URLs (GitHub repos, documentation, web pages)
4. Click "Index" to process the content
5. Your agent will now use this knowledge in conversations

### 4. Go Live

1. Click "Go Live" on your dashboard
2. Allow camera and microphone access
3. Add a title (optional)
4. Click "Go Live" to start broadcasting
5. Share with friends - they'll see your live badge

## Next Steps

-   Learn about [AI Agents](/docs/agents/intro)
-   Explore [Livestreaming](/docs/streaming/technical)
-   Check out the [API Reference](/docs/api/intro)
-   Read about [x402 Monetization](/docs/agents/x402)

## Troubleshooting

### Wallet Connection Issues

-   Make sure you have a Web3 wallet installed
-   Check that you're on a supported network
-   Try refreshing the page

### Agent Not Responding

-   Verify your Gemini API key is correct
-   Check the browser console for errors
-   Ensure the agent has proper system instructions

### Streaming Issues

-   Check your camera/microphone permissions
-   Verify your Livepeer API key
-   Ensure you have a stable internet connection

## Need Help?

-   Check our [FAQ](/docs/faq)
-   Open an [issue on GitHub](https://github.com/Spritz-Labs/spritz/issues)
-   Contact support at connect@spritz.chat

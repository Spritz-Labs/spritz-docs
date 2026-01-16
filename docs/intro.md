---
title: Welcome to Spritz
description: Spritz is a decentralized social platform that combines Web3 messaging, AI agents, livestreaming, and peer-to-peer communication. Learn how to build on Web3 with censorship-resistant messaging, AI agents, and decentralized livestreaming.
keywords:
    [
        Spritz,
        decentralized social platform,
        Web3 messaging,
        AI agents,
        livestreaming,
        censorship resistant,
        peer-to-peer,
        Logos Messaging,
    ]
---

# Welcome to Spritz

Spritz is a decentralized social platform that combines Web3 messaging, AI agents, livestreaming, and peer-to-peer communication.

## What is Spritz?

Spritz is a full-stack social platform built on Web3 principles, offering:

-   **Decentralized Messaging**: Peer-to-peer messaging powered by [Logos Messaging](https://logos.co/tech-stack)
-   **AI Agents**: Create and interact with customizable AI agents with knowledge bases
-   **Livestreaming**: Go live with friends using Livepeer
-   **Video Calls**: Real-time video and voice calls via Huddle01
-   **Group Features**: Group chats, group calls, and public channels
-   **Calendar Integration**: Google Calendar sync and scheduling
-   **x402 Monetization**: Monetize your AI agents with crypto payments
-   **Multi-Chain Authentication**: Sign in with Ethereum (SIWE) or Solana (SIWS)
-   **Passkey Support**: Passwordless login with Face ID, Touch ID, or Windows Hello

## Key Features

### 🤖 AI Agents

Create intelligent agents with custom personalities, knowledge bases, and monetization options. Agents can be private, shared with friends, or made public. Features include web search grounding, MCP server support, and API tools.

### 📹 Livestreaming

Broadcast live video streams to your friends. Streams are automatically recorded and stored for later viewing. Real-time viewer counts and HLS adaptive streaming.

### 💬 Messaging & Communication

-   **Decentralized Messaging**: Peer-to-peer messaging powered by [Logos Messaging](https://logos.co/tech-stack)
-   **Group Chats**: Create and join group conversations
-   **Public Channels**: Discover and join public channels
-   **Voice Messages**: Record and send voice notes
-   **Link Previews**: Rich previews for shared URLs

### 📞 Video Calls

High-quality video and voice calls powered by Huddle01. Support for group calls and instant rooms.

### 📅 Calendar & Scheduling

-   **Google Calendar Sync**: Connect your calendar to sync availability
-   **Availability Windows**: Set up recurring availability windows
-   **Scheduling Links**: Create shareable scheduling links
-   **x402 Payments**: Charge for scheduled calls (coming soon)

### 🔐 Authentication

-   **Multi-Chain**: Support for 8 EVM chains (Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Unichain, Avalanche) + Solana
-   **SIWE/SIWS**: Sign-In with Ethereum or Solana
-   **Passkeys**: Passwordless login with biometrics (creates a Smart Account)
-   **Email Login**: Sign in with just your email address
-   **Digital ID**: Verify with World ID or Alien ID
-   **Multi-Wallet**: Support for 300+ wallets via Reown

### 💳 Wallet Features

-   **Token Balances**: View balances across supported chains
-   **Transaction History**: See all your past transactions
-   **Buy Crypto**: Purchase crypto with fiat via Coinbase Onramp
-   **Smart Accounts**: ERC-4337 account abstraction with Safe

### 👥 Social Features

-   **Friends System**: Add friends, manage requests, and organize with tags
-   **Pixel Art Avatars**: Create custom 8-bit profile pictures
-   **Status Updates**: Share what you're up to with friends
-   **QR Code Scanning**: Quickly add friends by scanning QR codes
-   **Social Links**: Connect Twitter, Farcaster, and Lens profiles

### 💰 x402 Payments

Monetize your AI agents by charging per message using the x402 protocol. Support for Base and Base Sepolia networks.

## Quick Start

1. **Connect Your Wallet**: Sign in with your Ethereum, Base, or Solana wallet (or use passkeys)
2. **Explore Features**: Check out AI agents, messaging, and livestreaming
3. **Create an Agent**: Build your first AI agent with custom knowledge
4. **Go Live**: Start streaming to your friends
5. **Add Friends**: Connect with others and start chatting

## Tech Stack

| Category                | Technology                      |
| ----------------------- | ------------------------------- |
| **Framework**           | Next.js 16 with App Router      |
| **Styling**             | Tailwind CSS 4                  |
| **Animations**          | Motion (Framer Motion)          |
| **3D Graphics**         | Three.js with React Three Fiber |
| **Web3 (EVM)**          | viem, wagmi, permissionless.js  |
| **Web3 (Solana)**       | @solana/wallet-adapter          |
| **Account Abstraction** | Pimlico, Safe Smart Accounts    |
| **Wallet Connection**   | Reown AppKit (WalletConnect)    |
| **Video Calls**         | Huddle01 SDK, Agora RTC (optional) |
| **Livestreaming**       | Livepeer (WebRTC/WHIP + HLS)    |
| **Messaging**           | [Logos Messaging](https://logos.co/tech-stack) |
| **AI/LLM**              | Google Gemini API               |
| **Vector Search**       | PostgreSQL pgvector             |
| **Database**            | PostgreSQL + Realtime           |
| **Token Data**          | The Graph Token API             |
| **Push Notifications**  | Web Push API                    |
| **Payments**            | x402 Protocol (Coinbase)        |
| **Fiat Onramp**         | Coinbase Pay                    |
| **Digital Identity**    | World ID, Alien ID              |

## Documentation Structure

### Getting Started

-   **[Getting Started](/docs/getting-started)**: How to use Spritz (for users)
-   **[Developer Installation](/docs/developers/installation)**: Technical setup guide (for developers)

### Core Features

-   **[AI Agents](/docs/agents/intro)**: Create and customize AI agents
    -   [RAG Technical Details](/docs/agents/rag-technical): Deep dive into knowledge bases
    -   [MCP Servers](/docs/agents/mcp-servers): Extend agents with external tools
    -   [x402 Monetization](/docs/agents/x402): Monetize your agents
-   **[Livestreaming](/docs/streaming/technical)**: Broadcast live video
    -   [Technical Deep Dive](/docs/streaming/technical): WebRTC, HLS, and architecture

### User Guides

-   **[Messaging](/docs/guides/messaging)**: Decentralized messaging with [Logos Messaging](https://logos.co/tech-stack)
-   **[Video Calls](/docs/guides/video-calls)**: HD video and voice calls
-   **[Groups](/docs/guides/groups)**: Group chats and calls
-   **[Channels](/docs/guides/channels)**: Public community channels
-   **[Friends](/docs/guides/friends)**: Friend management and social features
-   **[Calendar & Scheduling](/docs/guides/calendar-scheduling)**: Google Calendar integration

### Developer Resources

-   **[API Reference](/docs/api/intro)**: Complete API documentation
    -   [Agents API](/docs/api/agents-detailed): Detailed agent endpoints
    -   [Streaming API](/docs/api/streaming): Livestreaming endpoints
-   **[Architecture](/docs/architecture/overview)**: System architecture and design
-   **[Database Schema](/docs/database/schema)**: Complete database reference

### Reference

-   **[FAQ](/docs/faq)**: Frequently asked questions

## Getting Help

-   Check out our [Getting Started Guide](/docs/getting-started)
-   Browse the [API Documentation](/docs/api/intro)
-   Visit our [GitHub repository](https://github.com/Spritz-Labs/spritz)
-   Open an [issue](https://github.com/Spritz-Labs/spritz/issues) for bugs or feature requests

## License

PolyForm Noncommercial License 1.0.0

Commercial use requires a separate license. Contact connect@spritz.chat for commercial licensing.

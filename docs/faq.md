---
title: Frequently Asked Questions (FAQ)
description: Find answers to common questions about Spritz, including installation, AI agents, livestreaming, authentication, payments, and more.
keywords:
    [
        Spritz FAQ,
        frequently asked questions,
        help,
        support,
        troubleshooting,
        Spritz guide,
    ]
---

# Frequently Asked Questions

## General

### What is Spritz?

Spritz is a decentralized social platform that combines Web3 messaging, AI agents, livestreaming, and peer-to-peer communication.

### Is Spritz open source?

Yes! Spritz is open source under the PolyForm Noncommercial License 1.0.0. Commercial use requires a separate license.

### How do I get started?

Check out our [Getting Started Guide](/docs/getting-started) for step-by-step instructions.

## AI Agents

### How do I create an AI agent?

Navigate to the Agents section, click "Create Agent", and fill in the required information. See our [Agents Guide](/docs/agents/intro) for details.

### Can I monetize my agent?

Yes! You can enable x402 payments on your agents. Learn more in our [x402 Guide](/docs/agents/x402).

### How does the knowledge base work?

Agents can have custom knowledge bases created from URLs. The content is indexed and used to enhance the agent's responses. See [AI Agents](/docs/agents/intro) for more information.

### What AI models are supported?

Currently, Spritz uses Google Gemini models. The default is `gemini-2.0-flash`, but you can choose from available models when creating an agent.

## Livestreaming

### How do I go live?

Click the "Go Live" button on your dashboard, allow camera/microphone access, and start streaming. See our [Livestreaming Guide](/docs/streaming/technical) for details.

### Are streams recorded?

Yes, streams are automatically recorded and stored on Livepeer. You can access recordings in your stream history.

### What resolution are streams?

Streams are broadcast at 1080x1920 (9:16 vertical/portrait format).

### Can I watch streams from friends?

Yes! Friends who are live show a red "LIVE" badge. Tap their avatar to join the stream.

## Messaging

### How does messaging work?

Spritz uses Waku (part of the Logos technology stack) for decentralized peer-to-peer messaging. Messages are sent directly between users without a central server.

### Is messaging encrypted?

Yes, messaging is end-to-end encrypted using symmetric key encryption (AES-GCM).

### What types of messaging are available?

-   **Direct Messages**: One-on-one conversations with friends
-   **Group Chats**: Multi-person conversations
-   **Public Channels**: Join public channels for community discussions
-   **Voice Messages**: Record and send voice notes

## Video Calls

### How do I start a video call?

Video calls are available through the Huddle01 integration. You can start calls with friends, create instant rooms, or join permanent rooms.

### What video quality is supported?

Video quality adapts based on your connection. Huddle01 provides high-quality video and audio.

### Can I do group calls?

Yes! Spritz supports multi-party video calls with friends.

## Payments & x402

### What is x402?

x402 is a protocol for micropayments on APIs. It allows you to charge users per message when using your AI agents.

### Which networks are supported?

Currently supported networks are **Base Sepolia** (testnet) and **Base** (mainnet). Ethereum support may be added in the future.

### How do I receive payments?

Configure your wallet address in your agent's x402 settings. Payments will be sent directly to that address.

## Additional Features

### Does Spritz support passkeys?

Yes! You can sign in using Face ID, Touch ID, or Windows Hello. A smart account will be created automatically using Pimlico.

### Can I connect my Google Calendar?

Yes! Connect your Google Calendar to sync availability and set up scheduling links.

### What is the points/leaderboard system?

Spritz includes a gamification system with daily points and a leaderboard. Earn points for various activities.

### Can I create pixel art avatars?

Yes! Spritz includes a pixel art editor where you can create custom 8-bit profile pictures.

### Does Spritz support Solana wallets?

Yes! Spritz supports both Ethereum (SIWE) and Solana (SIWS) authentication.

## Technical

### What tech stack does Spritz use?

-   **Framework**: Next.js 16 with App Router
-   **Styling**: Tailwind CSS 4
-   **Animations**: Motion (Framer Motion)
-   **3D Graphics**: Three.js with React Three Fiber
-   **Web3 (EVM)**: viem, wagmi, permissionless.js
-   **Web3 (Solana)**: @solana/wallet-adapter
-   **Account Abstraction**: Pimlico, Safe Smart Accounts
-   **Wallet Connection**: Reown AppKit (WalletConnect)
-   **Video Calls**: Huddle01 SDK
-   **Livestreaming**: Livepeer (WebRTC/WHIP + HLS)
-   **Messaging**: Waku Protocol (Logos)
-   **AI/LLM**: Google Gemini API
-   **Vector Search**: Supabase pgvector
-   **Database**: Supabase (Postgres + Realtime)
-   **Push Notifications**: Web Push API
-   **Payments**: x402 Protocol (Coinbase)

### How do I deploy Spritz?

See our [Getting Started Guide](/docs/getting-started) for deployment instructions.

### Can I contribute?

Yes! Contributions are welcome. Check out our [GitHub repository](https://github.com/Spritz-Labs/spritz) and open an issue or pull request.

## Support

### Where can I get help?

-   Check our documentation
-   Open an issue on [GitHub](https://github.com/Spritz-Labs/spritz/issues)
-   Contact support at connect@spritz.chat

### How do I report a bug?

Open an issue on [GitHub](https://github.com/Spritz-Labs/spritz/issues) with:

-   Description of the bug
-   Steps to reproduce
-   Expected vs actual behavior
-   Browser/device information

### Can I request a feature?

Yes! Open a feature request on [GitHub](https://github.com/Spritz-Labs/spritz/issues).

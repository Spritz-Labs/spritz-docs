---
title: AI Agents - Create and Customize Intelligent Assistants
description: Learn how to create, customize, and monetize AI agents in Spritz. Build intelligent assistants with knowledge bases, custom personalities, and x402 payments.
keywords:
    [
        AI agents,
        Spritz AI,
        Google Gemini,
        RAG,
        knowledge base,
        x402 payments,
        MCP servers,
        AI assistants,
        custom AI,
    ]
---

# AI Agents

Spritz allows you to create and interact with customizable AI agents powered by Google Gemini.

## Overview

AI agents in Spritz are intelligent assistants that can:
- Have custom personalities and behaviors
- Access knowledge bases (RAG - Retrieval Augmented Generation)
- Be shared with friends or made public
- Be monetized using x402 payments
- Use MCP servers and API tools

## Creating an Agent

### Basic Setup

1. Navigate to the Agents section in your dashboard
2. Click "Create Agent"
3. Fill in the required fields:
   - **Name**: A descriptive name for your agent
   - **Personality**: How your agent should behave and respond
   - **System Instructions**: Custom instructions for the AI model
   - **Model**: Choose from available Gemini models (default: `gemini-2.0-flash`)
   - **Avatar**: Choose an emoji or upload a custom image

### Agent Avatar

Customize your agent's appearance:

- **Emoji**: Quick selection from emoji picker (default)
- **Custom Image**: Upload a JPG, PNG, or WebP image
  1. Click the avatar area when editing your agent
  2. Select "Upload Image"
  3. Choose your image file
  4. Crop and adjust as needed
  5. Save your agent

Custom avatars are displayed in chat, discovery, and agent cards.

### Visibility Options

- **Private**: Only you can access this agent
- **Friends**: Your friends can discover and use this agent
- **Public**: Anyone can find and use this agent
- **Official**: Platform agents managed by admins (see below)

### Advanced Features

- **Web Search**: Enable web search for real-time information
- **Knowledge Base**: Add URLs to create a custom knowledge base
- **Tags**: Add tags to help others discover your agent
- **x402 Monetization**: Enable payments for agent usage

## Knowledge Base (RAG)

Agents can have custom knowledge bases that enhance their responses:

1. Open your agent's settings
2. Navigate to "Knowledge Base"
3. Add URLs (GitHub repositories, documentation sites, web pages)
4. Click "Index" to process the content
5. The agent will use this knowledge in conversations

Supported sources:
- GitHub repositories
- Documentation websites
- Web pages
- Markdown files

## x402 Monetization

Monetize your agents by enabling x402 payments:

1. Edit your agent
2. Enable "x402 Payments"
3. Set your price (in cents per message)
4. Configure your wallet address
5. Choose pricing mode (global or per-user)

External developers can integrate your agent:

```typescript
import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Setup wallet client for payments
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
});

// Wrap fetch to handle x402 payments automatically
const paidFetch = wrapFetchWithPayment(fetch, walletClient);

// Make paid request - payment handled automatically on 402 response
const response = await paidFetch(
    'https://app.spritz.chat/api/public/agents/{agentId}/chat',
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello!' }),
    }
);

const data = await response.json();
console.log('Agent response:', data.message);
```

:::tip Test First
Test your agent integration on Base Sepolia before using real funds on Base mainnet.
:::

## Official Agents & Channel Integration

**Official agents** are platform-managed AI agents that can be added to public channels and Global Chat. Users can @mention these agents to interact with them directly in conversations.

### Features of Official Agents

- **Channel Presence**: Can be added to Global Chat and public # channels
- **@Mentions**: Users can mention official agents using `@AgentName` syntax
- **Advanced Scraping**: Access to Firecrawl for high-quality knowledge base indexing
- **Auto-Sync**: Automatic re-indexing of knowledge sources on a schedule
- **Custom Suggested Questions**: Curated conversation starters

### How @Mentions Work

1. Admin adds an official agent to a channel
2. Users see available agents when typing `@`
3. User sends message like `@[Spritz Assistant](uuid) What is RAG?`
4. Agent processes the question with RAG context
5. Agent's response appears in the channel thread

:::info Admin Only
Only platform administrators can create official agents and add them to channels. Regular users can create public agents, but cannot make them official.
:::

## MCP Servers & API Tools

Agents can use Model Context Protocol (MCP) servers and custom API tools:

- **MCP Servers**: Connect to external services via MCP
- **API Tools**: Add custom API endpoints for your agent to use

## Best Practices

1. **Clear Instructions**: Write clear system instructions for consistent behavior
2. **Relevant Knowledge**: Add knowledge bases that match your agent's purpose
3. **Testing**: Test your agent thoroughly before making it public
4. **Pricing**: Set fair prices if monetizing your agent
5. **Tags**: Use descriptive tags to help discovery

## Technical Deep Dives

- [Knowledge Base (RAG) - Technical Details](/docs/agents/rag-technical)
- [MCP Servers & API Tools](/docs/agents/mcp-servers)
- [x402 Monetization](/docs/agents/x402)

## Next Steps

- Learn about [x402 Monetization](/docs/agents/x402)
- Explore the [API Reference](/docs/api/agents-detailed)
- Check out [RAG Technical Details](/docs/agents/rag-technical)


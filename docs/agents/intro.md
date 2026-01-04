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
   - **Avatar Emoji**: Pick an emoji to represent your agent

### Visibility Options

- **Private**: Only you can access this agent
- **Friends**: Your friends can discover and use this agent
- **Public**: Anyone can find and use this agent

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


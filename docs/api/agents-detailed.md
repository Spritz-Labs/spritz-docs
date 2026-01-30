---
title: Agents API - Detailed Reference
description: "Complete reference for AI agent endpoints: list, create, chat, knowledge base, discovery, favorites, embed, x402, and channel integration."
keywords: [Spritz, agents API, chat, knowledge base, MCP, x402, API reference]
sidebar_label: Agents API
sidebar_position: 1
---

# Agents API - Detailed Reference

Complete reference for AI agent endpoints including creation, chat, knowledge bases, and x402 monetization. For implementation details (RAG, MCP, API tools, scheduling), see [AI Architecture](/docs/agents/architecture).

## Authentication

All agent endpoints (except public endpoints) require authentication. Spritz uses HTTP-only session cookies for authentication.

```typescript
// Browser requests - include credentials for cookie-based auth
const response = await fetch('/api/agents', {
    credentials: 'include', // Required for session cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Server-to-server requests - use Authorization header
headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
}
```

:::tip Authentication Flow
See the [API Introduction](/docs/api/intro#authentication) for complete authentication examples including SIWE setup.
:::

## List Agents

```http
GET /api/agents?userAddress=0x...&includeOfficial=true
```

### Query Parameters

| Parameter         | Type   | Required | Description                                                                                                        |
| ----------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `userAddress`     | string | Yes      | Owner wallet address (normalized to lowercase)                                                                     |
| `includeOfficial` | string | No       | If `"true"`, and the requesting user is an admin, official agents (not owned by the user) are appended to the list |

### Response

Returns all agents owned by `userAddress`, ordered by `created_at` descending. When `includeOfficial` is `"true"` and the user is in `shout_admins`, official agents (visibility `official`) not owned by the user are merged into the list.

```json
{
    "agents": [
        {
            "id": "uuid",
            "owner_address": "0x...",
            "name": "Agent Name",
            "personality": "Helpful and friendly",
            "system_instructions": "You are a helpful assistant.",
            "model": "gemini-2.0-flash",
            "avatar_emoji": "🤖",
            "visibility": "private",
            "message_count": 123,
            "tags": ["helpful", "technical"],
            "created_at": "2026-01-15T10:30:00Z",
            "updated_at": "2026-01-15T10:30:00Z"
        }
    ]
}
```

## Create Agent

```http
POST /api/agents
```

### Request Body

| Parameter     | Type   | Required | Description                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| `userAddress` | string | Yes      | Owner wallet address                                                 |
| `name`        | string | Yes      | Agent name (trimmed)                                                 |
| `personality` | string | No       | Short personality; used to generate `system_instructions`            |
| `avatarEmoji` | string | No       | Single emoji (default: `"🤖"`)                                       |
| `visibility`  | string | No       | `private` (default), `friends`, `public`, or `official` (admin only) |
| `tags`        | array  | No       | Max 5 tags; each trimmed, lowercased, max 20 chars                   |

```json
{
    "userAddress": "0x...",
    "name": "My Agent",
    "personality": "Helpful and concise",
    "avatarEmoji": "🤖",
    "visibility": "private",
    "tags": ["helpful", "technical"]
}
```

- **Beta:** User must have `beta_access` in `shout_users` (403 if not).
- **Limit:** Non-admin users are limited to 5 agents; official agents and admins are exempt.
- **Official:** Only admins can set `visibility: "official"` (403 otherwise).
- **System instructions:** If `personality` is provided, generated as: `You are an AI assistant named "${name}". Your personality: ${personality}. Be helpful, friendly, and stay in character.` Otherwise a short default. Model is fixed as `gemini-2.0-flash`.

### Response

```json
{
    "agent": {
        "id": "uuid",
        "owner_address": "0x...",
        "name": "My Agent",
        "personality": "Helpful and concise",
        "system_instructions": "You are an AI assistant named \"My Agent\". Your personality: Helpful and concise. Be helpful, friendly, and stay in character.",
        "model": "gemini-2.0-flash",
        "avatar_emoji": "🤖",
        "visibility": "private",
        "tags": ["helpful", "technical"],
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-01-15T10:30:00Z"
    }
}
```

## Get Agent

```http
GET /api/agents/:id
```

### Response

```json
{
    "agent": {
        "id": "uuid",
        "owner_address": "0x...",
        "name": "Agent Name",
        "personality": "...",
        "system_instructions": "...",
        "model": "gemini-2.0-flash",
        "avatar_emoji": "🤖",
        "visibility": "public",
        "web_search_enabled": true,
        "use_knowledge_base": true,
        "message_count": 123,
        "tags": ["helpful"],
        "x402_enabled": false,
        "mcp_servers": [
            {
                "name": "GitHub MCP",
                "url": "https://mcp.example.com",
                "headers": {}
            }
        ],
        "api_tools": [],
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
}
```

## Chat with Agent

```http
POST /api/agents/:id/chat
```

### Request Body

| Parameter     | Type    | Required | Description                                                   |
| ------------- | ------- | -------- | ------------------------------------------------------------- |
| `userAddress` | string  | Yes      | User wallet address (used for access and history)             |
| `message`     | string  | Yes      | User message text                                             |
| `stream`      | boolean | No       | If `true`, response is NDJSON stream (`application/x-ndjson`) |

```json
{
    "userAddress": "0x...",
    "message": "What can you help me with?",
    "stream": false
}
```

### Response (non-streaming)

```json
{
    "message": "I can help you with...",
    "agentName": "Agent Name",
    "agentEmoji": "🤖",
    "scheduling": null
}
```

When scheduling was used and slots are returned for the booking card:

```json
{
    "message": "...",
    "agentName": "Support Bot",
    "agentEmoji": "🎧",
    "scheduling": {
        "ownerAddress": "0x...",
        "slots": [
            { "start": "2026-01-30T18:00:00Z", "end": "2026-01-30T18:30:00Z" }
        ],
        "slotsByDate": { "Monday, January 30": ["6:00 PM", "6:45 PM"] },
        "freeEnabled": true,
        "paidEnabled": false,
        "freeDuration": 15,
        "paidDuration": 30,
        "priceCents": 0,
        "timezone": "America/Los_Angeles"
    }
}
```

### Response (streaming)

When `stream: true`, the response is NDJSON (`application/x-ndjson`): one line per chunk or final event.

```json
{"type":"chunk","text":"Here "}
{"type":"chunk","text":"is "}
{"type":"chunk","text":"the answer.\n"}
{"type":"done","message":"Here is the answer.\n","scheduling":null}
```

On error:

```json
{ "type": "error", "error": "Failed to generate response" }
```

### Implementation Details

1. **RAG Context**: If `use_knowledge_base !== false`, retrieves relevant chunks via `match_knowledge_chunks`; fallback to pending knowledge URL fetch
2. **Web Search**: If `web_search_enabled`, uses Google Search grounding
3. **Platform + MCP**: Platform API tools (The Grid GraphQL) and optional MCP servers; per-agent `api_tools` and `mcp_servers`
4. **Chat History**: Last 10 messages from `shout_agent_chats` for this agent and `userAddress`
5. **Scheduling**: If enabled and message suggests scheduling, adds slot context and optional `scheduling` payload for the booking card
6. **Response**: Gemini `gemini-2.0-flash`; rate limit tier `ai` (30/min)

### Chat History

```http
GET /api/agents/:id/chat?userAddress=0x...&limit=50
```

### Query Parameters

| Parameter     | Type   | Required | Description                |
| ------------- | ------ | -------- | -------------------------- |
| `userAddress` | string | Yes      | User wallet address        |
| `limit`       | number | No       | Max messages (default: 50) |

### Response

```json
{
    "chats": [
        {
            "id": "uuid",
            "role": "user",
            "content": "Hello!",
            "created_at": "2026-01-15T10:30:00Z"
        },
        {
            "id": "uuid",
            "role": "assistant",
            "content": "Hi! How can I help?",
            "created_at": "2026-01-15T10:30:01Z"
        }
    ]
}
```

### Clear Chat History

```http
DELETE /api/agents/:id/chat?userAddress=0x...
```

**Query Parameters:** `userAddress` (required). Deletes all chat rows for this agent and user.

## Knowledge Base

### Get Knowledge Base

```http
GET /api/agents/:id/knowledge
```

### Response

```json
{
    "knowledge": [
        {
            "id": "uuid",
            "title": "Documentation",
            "url": "https://example.com/docs",
            "content_type": "webpage",
            "status": "indexed",
            "chunk_count": 15,
            "created_at": "2026-01-15T10:30:00Z",
            "indexed_at": "2024-01-01T00:00:05Z"
        }
    ]
}
```

### Add Knowledge URL

```http
POST /api/agents/:id/knowledge
```

### Request Body

```json
{
    "userAddress": "0x...",
    "url": "https://example.com/docs",
    "title": "Example Documentation"
}
```

### Request Body (Official Agents - Advanced Options)

Official agents can use Firecrawl for enhanced scraping:

```json
{
    "userAddress": "0x...",
    "url": "https://docs.example.com",
    "title": "Example Documentation",
    "scrapeMethod": "firecrawl",
    "crawlDepth": 3,
    "excludePatterns": ["/blog/*", "/changelog/*"],
    "autoSync": true,
    "syncIntervalHours": 24
}
```

| Parameter           | Type    | Description                                             |
| ------------------- | ------- | ------------------------------------------------------- |
| `url`               | string  | Required. Valid HTTPS URL                               |
| `title`             | string  | Optional. Auto-detected from URL if not provided        |
| `scrapeMethod`      | enum    | `basic` (default) or `firecrawl` (official agents only) |
| `crawlDepth`        | number  | Max crawl depth 1-5 (official agents only)              |
| `excludePatterns`   | array   | URL patterns to skip, max 20 (official agents only)     |
| `autoSync`          | boolean | Enable automatic re-indexing (official agents only)     |
| `syncIntervalHours` | number  | Hours between syncs, 1-168 (official agents only)       |

### Response

```json
{
    "item": {
        "id": "uuid",
        "status": "pending",
        "scrape_method": "firecrawl",
        "auto_sync": true
    }
}
```

### Index Knowledge

```http
POST /api/agents/:id/knowledge/index
```

### Request Body

| Parameter     | Type   | Required | Description                             |
| ------------- | ------ | -------- | --------------------------------------- |
| `userAddress` | string | Yes      | Owner or authorized user wallet address |
| `knowledgeId` | string | Yes      | UUID of the knowledge item to index     |

```json
{
    "userAddress": "0x...",
    "knowledgeId": "uuid"
}
```

### Process

1. Fetches URL content (using basic scraping or Firecrawl)
2. For Firecrawl with `crawlDepth > 1`: crawls linked pages up to max depth
3. Chunks content into ~500-1000 token pieces with 100-token overlap
4. Generates embeddings using `text-embedding-004` for each chunk
5. Stores chunks in database with vector embeddings
6. Updates status to "indexed"

### Response

```json
{
    "success": true,
    "chunksIndexed": 45,
    "pagesScraped": 12
}
```

The `pagesScraped` field indicates how many pages were crawled (always 1 for basic scraping, may be higher for Firecrawl with crawl depth > 1).

### Delete Knowledge

```http
DELETE /api/agents/:id/knowledge/:knowledge_id
```

Cascades to delete all associated chunks.

## Agent Discovery

### Discover Public Agents

```http
GET /api/agents/discover?tags=helpful,technical&limit=20&offset=0
```

### Query Parameters

- `tags` (optional): Comma-separated tags to filter
- `limit` (optional): Results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

### Response

```json
{
    "agents": [
        {
            "id": "uuid",
            "name": "Agent Name",
            "personality": "...",
            "avatar_emoji": "🤖",
            "tags": ["helpful", "technical"],
            "message_count": 123,
            "created_at": "2026-01-15T10:30:00Z"
        }
    ],
    "total": 50,
    "limit": 20,
    "offset": 0
}
```

## Favorites

### Get Favorites

```http
GET /api/agents/favorites?userAddress=0x...
```

### Add Favorite

```http
POST /api/agents/favorites
```

### Request Body

```json
{
    "userAddress": "0x...",
    "agentId": "uuid"
}
```

### Remove Favorite

```http
DELETE /api/agents/favorites
```

### Request Body

```json
{
    "userAddress": "0x...",
    "agentId": "uuid"
}
```

## Embed Code

### Get Embed Code

```http
GET /api/agents/:id/embed
```

### Response

```json
{
    "embedCode": "<script>...</script>",
    "sdkExample": "// Install: npm install..."
}
```

## Public API (x402)

### Get Public Agent Info

```http
GET /api/public/agents/:id
```

Returns information about a public or official agent.

### Response

```json
{
    "id": "uuid",
    "name": "Agent Name",
    "personality": "Helpful and knowledgeable",
    "avatar_emoji": "🤖",
    "avatar_url": "https://example.com/avatar.png",
    "visibility": "public",
    "tags": ["helpful", "technical"],
    "suggested_questions": [
        "What can you help me with?",
        "Tell me about yourself!",
        "What makes you unique?",
        "How can you help me today?"
    ],
    "x402_enabled": true,
    "x402_price_cents": 1,
    "x402_network": "base"
}
```

:::info Suggested Questions
For **official agents**, suggested questions are manually configured by admins. For **public agents**, suggested questions are auto-generated based on the agent's name, personality, and tags.
:::

````

### Chat with Public Agent (x402)

```http
POST /api/public/agents/:id/chat
````

### Request Headers

```http
X-Payment: {"from": "0x...", "amount": "10000", ...}
```

### Request Body

```json
{
    "message": "Hello!",
    "sessionId": "optional-session-id"
}
```

### Response

```json
{
    "success": true,
    "sessionId": "session-id",
    "message": "Hello! How can I help?",
    "agent": {
        "id": "uuid",
        "name": "Agent Name",
        "emoji": "🤖"
    }
}
```

## Get Embed Code

Get embed code and SDK examples for an x402-enabled agent.

```http
GET /api/agents/:id/embed?userAddress=0x...
```

### Query Parameters

- `userAddress` (required): Owner's wallet address

### Response

```json
{
    "agent": {
        "id": "uuid",
        "name": "Agent Name",
        "emoji": "🤖"
    },
    "endpoints": {
        "info": "https://app.spritz.chat/api/public/agents/{id}",
        "chat": "https://app.spritz.chat/api/public/agents/{id}/chat"
    },
    "pricing": {
        "pricePerMessage": "$0.01",
        "priceCents": 1,
        "network": "base-sepolia",
        "currency": "USDC",
        "payTo": "0x..."
    },
    "code": {
        "embed": "<iframe src=\"...\" />",
        "sdk": "import { wrapFetch } from \"x402-fetch\";\n...",
        "curl": "# Get agent info...\ncurl ..."
    },
    "stats": {
        "totalMessages": 123,
        "paidMessages": 45,
        "totalEarnings": "$0.45"
    }
}
```

### Errors

- `400`: x402 not enabled on agent
- `403`: Access denied (not owner)
- `404`: Agent not found

## Channel Integration (Official Agents)

Official agents can be added to public channels and Global Chat, allowing users to @mention them for interactions.

### Get Agents in Channel

```http
GET /api/channels/:id/agents
```

Returns all official agents present in a channel.

**Path Parameters:**

- `id`: Channel UUID or `"global"` for Global Chat

### Response

```json
{
    "agents": [
        {
            "id": "uuid",
            "name": "Spritz Assistant",
            "avatar_emoji": "🤖",
            "avatar_url": "https://example.com/avatar.png",
            "personality": "Helpful and friendly",
            "isAgent": true
        }
    ]
}
```

### Add Agent to Channel (Admin Only)

```http
POST /api/agents/:id/channels
```

### Request Body

```json
{
    "userAddress": "0x...",
    "channelType": "global",
    "channelId": null
}
```

| Parameter     | Type   | Description                                           |
| ------------- | ------ | ----------------------------------------------------- |
| `userAddress` | string | Admin's wallet address                                |
| `channelType` | enum   | `global` or `channel`                                 |
| `channelId`   | string | Channel UUID (required if `channelType` is `channel`) |

### Response

```json
{
    "membership": {
        "id": "uuid",
        "agent_id": "uuid",
        "channel_type": "global",
        "channel_id": null,
        "created_at": "2026-01-23T10:00:00Z",
        "created_by": "0x..."
    }
}
```

### Remove Agent from Channel (Admin Only)

```http
DELETE /api/agents/:id/channels?userAddress=0x...&channelType=global
```

**Query Parameters:**

- `userAddress` (required): Admin's wallet address
- `channelType` (required): `global` or `channel`
- `channelId` (optional): Channel UUID (required for `channel` type)

### Process @Mention (Internal)

```http
POST /api/channels/agent-response
```

Called when a message containing @mentions is sent to a channel. Generates AI responses for mentioned agents.

### Request Body

```json
{
    "messageContent": "@[Spritz Assistant](uuid) What is RAG?",
    "senderAddress": "0x...",
    "senderName": "alice.eth",
    "channelType": "global",
    "channelId": null,
    "originalMessageId": "uuid"
}
```

### Response

```json
{
    "processed": true,
    "mentionsFound": 1,
    "responsesGenerated": 1,
    "responses": [
        {
            "agentId": "uuid",
            "agentName": "Spritz Assistant",
            "response": "RAG (Retrieval Augmented Generation) is...",
            "messageId": "uuid"
        }
    ]
}
```

:::info Markdown Support
Agent responses in channels support markdown formatting including **bold**, _italic_, bullet points, and image rendering using `![Description](URL)` syntax. Agents can reference images from their knowledge base in responses.
:::

## Detect API Type

Detect the type of an external API (GraphQL, OpenAPI, or REST) for use with agent API tools.

```http
POST /api/agents/detect-api
```

### Request Body

```json
{
    "url": "https://api.example.com/graphql",
    "apiKey": "optional-api-key",
    "headers": {
        "Custom-Header": "value"
    }
}
```

### Response

```json
{
    "apiType": "graphql",
    "confidence": "high",
    "message": "GraphQL API detected via introspection",
    "schema": "GraphQL Query Types:\nusers: [User]\nposts: [Post]",
    "detectedAt": "2024-01-01T00:00:00Z"
}
```

### API Types

- `graphql`: GraphQL API (detected via introspection)
- `openapi`: OpenAPI/Swagger specification
- `rest`: REST API (default)

### Confidence Levels

- `high`: Confidently detected via introspection or spec
- `medium`: Detected from URL patterns
- `low`: Default fallback

## Error Responses

### 400 Bad Request

```json
{
    "error": "Message is required"
}
```

### 401 Unauthorized

```json
{
    "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
    "error": "Only public agents can be accessed via this API"
}
```

### 404 Not Found

```json
{
    "error": "Agent not found"
}
```

### 402 Payment Required (x402)

```json
{
    "error": "Payment Required",
    "message": "This API requires a payment of $0.01 USDC",
    "paymentRequirements": {
        "x402Version": 1,
        "accepts": [...]
    }
}
```

### 500 Internal Server Error

```json
{
    "error": "Failed to generate response"
}
```

## Rate Limiting

Agent endpoints follow the tiered rate limiting system:

| Endpoint Type                      | Limit    | Tier             |
| ---------------------------------- | -------- | ---------------- |
| `/api/agents/*/chat`               | 30/min   | AI               |
| Other agent endpoints              | 100/min  | General          |
| `/api/public/agents/*/chat` (x402) | No limit | Payment required |

See [API Overview](/docs/api/intro#rate-limiting) for complete rate limiting documentation.

## Parameter Validation Rules

When creating or updating agents, the following validation rules apply:

| Parameter             | Type    | Constraints                                                      |
| --------------------- | ------- | ---------------------------------------------------------------- |
| `name`                | string  | Required. 1-100 characters                                       |
| `personality`         | string  | Required. 1-1000 characters                                      |
| `system_instructions` | string  | Optional. Max 4000 characters                                    |
| `model`               | string  | Default: `gemini-2.0-flash` (currently the only supported model) |
| `avatar_emoji`        | string  | Optional. Single emoji character                                 |
| `avatar_url`          | string  | Optional. Valid HTTPS URL for custom avatar image                |
| `visibility`          | enum    | Must be: `private`, `friends`, `public`, or `official`           |
| `web_search_enabled`  | boolean | Optional. Default: `false`                                       |
| `use_knowledge_base`  | boolean | Optional. Default: `false`                                       |
| `tags`                | array   | Optional. Max 5 tags, each 1-20 characters                       |
| `suggested_questions` | array   | Official agents only. Max 4 questions, each 1-100 characters     |
| `x402_price_cents`    | number  | Optional. Min: 1, Max: 10000 (for x402-enabled agents)           |
| `x402_network`        | string  | Must be: `base` or `base-sepolia` (when x402_enabled)            |

:::warning Official Visibility
The `official` visibility type is **admin-only**. Only platform administrators can create or modify official agents. Official agents:

- Are publicly accessible (like `public` agents)
- Can use Firecrawl for advanced web scraping
- Support auto-sync for knowledge bases
- Can have custom suggested questions
  :::

### Knowledge Base Validation

| Parameter           | Type    | Constraints                                             |
| ------------------- | ------- | ------------------------------------------------------- |
| `url`               | string  | Required. Valid HTTPS URL                               |
| `title`             | string  | Optional. Auto-detected from URL. Max 200 characters    |
| `content_type`      | enum    | Auto-detected. One of: `webpage`, `github`, or `docs`   |
| `scrapeMethod`      | enum    | `basic` (default) or `firecrawl` (official agents only) |
| `crawlDepth`        | number  | 1-5 (official agents only)                              |
| `excludePatterns`   | array   | Max 20 patterns (official agents only)                  |
| `autoSync`          | boolean | Default: `false` (official agents only)                 |
| `syncIntervalHours` | number  | 1-168 hours (official agents only)                      |

:::info Knowledge Limits

- Regular agents: Maximum 10 knowledge URLs
- Official agents: Maximum 50 knowledge URLs
  :::

### Chat Validation

| Parameter   | Type   | Constraints                  |
| ----------- | ------ | ---------------------------- |
| `message`   | string | Required. 1-10000 characters |
| `sessionId` | string | Optional. UUID format        |

## Best Practices

1. **Session Management**: Use `sessionId` to maintain conversation context
2. **Error Handling**: Check for 402 responses and handle payment
3. **Caching**: Cache agent info, not chat responses
4. **Retries**: Implement exponential backoff for rate limits
5. **Monitoring**: Track token usage and costs

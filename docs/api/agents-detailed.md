# Agents API - Detailed Reference

Complete reference for AI agent endpoints including creation, chat, knowledge bases, and x402 monetization.

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
GET /api/agents?userAddress=0x...&visibility=public&limit=20
```

### Query Parameters

- `userAddress` (optional): Filter by owner address
- `visibility` (optional): Filter by visibility (`private`, `friends`, `public`)
- `limit` (optional): Maximum results (default: 20)

### Response

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
            "visibility": "public",
            "web_search_enabled": true,
            "use_knowledge_base": true,
            "message_count": 123,
            "tags": ["helpful", "technical"],
            "x402_enabled": false,
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

```json
{
    "userAddress": "0x...",
    "name": "My Agent",
    "personality": "Helpful and concise",
    "system_instructions": "You are a helpful assistant that provides concise answers.",
    "model": "gemini-2.0-flash",
    "avatar_emoji": "🤖",
    "visibility": "private",
    "web_search_enabled": true,
    "use_knowledge_base": true,
    "tags": ["helpful", "technical"],
    "mcp_servers": [],
    "api_tools": []
}
```

### Response

```json
{
    "agent": {
        "id": "uuid",
        "owner_address": "0x...",
        "name": "My Agent",
        "created_at": "2026-01-15T10:30:00Z"
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

```json
{
    "userAddress": "0x...",
    "message": "What can you help me with?",
    "sessionId": "optional-session-id"
}
```

### Response

```json
{
    "success": true,
    "sessionId": "session-id",
    "message": "I can help you with...",
    "agent": {
        "id": "uuid",
        "name": "Agent Name",
        "emoji": "🤖"
    },
    "usage": {
        "promptTokens": 150,
        "completionTokens": 75,
        "totalTokens": 225
    }
}
```

### Implementation Details

1. **RAG Context**: If `use_knowledge_base` is enabled, retrieves relevant chunks
2. **Web Search**: If `web_search_enabled`, uses Google Search grounding
3. **MCP Tools**: If MCP servers configured, discovers and uses tools
4. **Chat History**: Maintains context from previous messages in session
5. **Response Generation**: Uses Gemini API with system instructions

### Chat History

```http
GET /api/agents/:id/chat?sessionId=session-id&limit=20
```

### Response

```json
{
    "messages": [
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
            "created_at": "2024-01-01T00:00:01Z"
        }
    ]
}
```

### Clear Chat History

```http
DELETE /api/agents/:id/chat?sessionId=session-id
```

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
    "url": "https://example.com/docs",
    "title": "Example Documentation",
    "content_type": "webpage"
}
```

### Response

```json
{
    "knowledge": {
        "id": "uuid",
        "status": "pending"
    }
}
```

### Index Knowledge

```http
POST /api/agents/:id/knowledge/index
```

### Request Body

```json
{
    "knowledge_id": "uuid"
}
```

### Process

1. Fetches URL content
2. Chunks content into ~500-1000 token pieces
3. Generates embeddings for each chunk
4. Stores chunks in database
5. Updates status to "indexed"

### Response

```json
{
    "success": true,
    "chunk_count": 15,
    "status": "indexed"
}
```

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

### Response

```json
{
    "agent": {
        "id": "uuid",
        "name": "Agent Name",
        "personality": "...",
        "emoji": "🤖",
        "tags": ["helpful"],
        "features": {
            "webSearch": true,
            "knowledgeBase": true
        },
        "stats": {
            "totalMessages": 123
        },
        "createdAt": "2024-01-01T00:00:00Z"
    },
    "pricing": {
        "enabled": true,
        "pricePerMessage": "$0.01",
        "priceCents": 1,
        "network": "base-sepolia",
        "currency": "USDC"
    },
    "endpoints": {
        "chat": "/api/public/agents/{id}/chat",
        "info": "/api/public/agents/{id}"
    }
}
```

### Chat with Public Agent (x402)

```http
POST /api/public/agents/:id/chat
```

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

| Endpoint Type | Limit | Tier |
|---------------|-------|------|
| `/api/agents/*/chat` | 30/min | AI |
| Other agent endpoints | 100/min | General |
| `/api/public/agents/*/chat` (x402) | No limit | Payment required |

See [API Overview](/docs/api/intro#rate-limiting) for complete rate limiting documentation.

## Parameter Validation Rules

When creating or updating agents, the following validation rules apply:

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `name` | string | Required. 1-100 characters |
| `personality` | string | Required. 1-1000 characters |
| `system_instructions` | string | Optional. Max 4000 characters |
| `model` | enum | Must be: `gemini-2.0-flash`, `gemini-2.0-flash-lite`, or `gemini-1.5-pro` |
| `avatar_emoji` | string | Optional. Single emoji character |
| `visibility` | enum | Must be: `private`, `friends`, or `public` |
| `web_search_enabled` | boolean | Optional. Default: `false` |
| `use_knowledge_base` | boolean | Optional. Default: `false` |
| `tags` | array | Optional. Max 10 tags, each 1-30 characters |
| `x402_price_cents` | number | Optional. Min: 1, Max: 10000 (for x402-enabled agents) |
| `x402_network` | string | Must be: `base` or `base-sepolia` (when x402_enabled) |

### Knowledge Base Validation

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `url` | string | Required. Valid HTTPS URL |
| `title` | string | Required. 1-200 characters |
| `content_type` | enum | Must be: `webpage`, `github`, or `docs` |

### Chat Validation

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `message` | string | Required. 1-10000 characters |
| `sessionId` | string | Optional. UUID format |

## Best Practices

1. **Session Management**: Use `sessionId` to maintain conversation context
2. **Error Handling**: Check for 402 responses and handle payment
3. **Caching**: Cache agent info, not chat responses
4. **Retries**: Implement exponential backoff for rate limits
5. **Monitoring**: Track token usage and costs




# Agents API - Detailed Reference

## Authentication

All agent endpoints (except public endpoints) require authentication via SIWE/SIWS:

```typescript
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
}
```

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
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
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
        "created_at": "2024-01-01T00:00:00Z"
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
        "created_at": "2024-01-01T00:00:00Z",
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
            "created_at": "2024-01-01T00:00:00Z"
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
            "created_at": "2024-01-01T00:00:00Z",
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
            "created_at": "2024-01-01T00:00:00Z"
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

- **Standard**: 100 requests/minute
- **Authenticated**: 1000 requests/minute
- **x402 Public**: No rate limit (payment required)

## Best Practices

1. **Session Management**: Use `sessionId` to maintain conversation context
2. **Error Handling**: Check for 402 responses and handle payment
3. **Caching**: Cache agent info, not chat responses
4. **Retries**: Implement exponential backoff for rate limits
5. **Monitoring**: Track token usage and costs



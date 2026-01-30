# MCP Servers & API Tools

## Overview

Spritz agents can use **Model Context Protocol (MCP)** servers and custom API tools to extend their capabilities beyond the base LLM.

## MCP Servers

MCP is a protocol that allows AI agents to interact with external services and tools. Spritz agents can connect to MCP servers to access additional functionality.

### How It Works

1. **Server Discovery**: Agent queries MCP server for available tools
2. **Tool Schema Caching**: Tool schemas are cached for 1 hour
3. **Context Gathering**: System uses web search to understand tool usage
4. **Tool Execution**: Tools are called via JSON-RPC when needed
5. **Response Integration**: Tool results are included in agent responses

### MCP Server Configuration

```json
{
    "name": "GitHub MCP",
    "url": "https://mcp-server.example.com",
    "headers": {
        "Authorization": "Bearer token"
    }
}
```

### Tool Discovery

The system automatically discovers tools from MCP servers:

```typescript
async function discoverMcpTools(
    serverUrl: string,
    headers: Record<string, string>,
): Promise<MCPTool[]> {
    const response = await fetch(serverUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 0,
            method: "tools/list",
            params: {},
        }),
    });

    const data = await response.json();
    return data?.result?.tools || [];
}
```

### Tool Schema

```typescript
interface MCPTool {
    name: string;
    description?: string;
    inputSchema?: {
        type: string;
        properties?: Record<
            string,
            {
                type: string;
                description?: string;
            }
        >;
        required?: string[];
    };
}
```

### Context Gathering

For better tool usage, the system uses Google Search to understand MCP servers:

```typescript
async function getMcpServerContext(
    serverName: string,
    serverUrl: string,
): Promise<string | null> {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `What is ${serverName} MCP server? How do I use its tools?`,
                    },
                ],
            },
        ],
        config: {
            tools: [{ googleSearch: {} }],
            maxOutputTokens: 1024,
        },
    });

    return response.text;
}
```

### Tool Execution

When the agent needs to use a tool:

```typescript
const toolCall = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
        name: toolName,
        arguments: toolArguments,
    },
};

const response = await fetch(mcpServerUrl, {
    method: "POST",
    headers: mcpHeaders,
    body: JSON.stringify(toolCall),
});
```

## API Tools

Custom API tools allow agents to call external REST APIs directly.

### API Tool Configuration

```json
{
    "name": "Weather API",
    "description": "Get current weather for a location",
    "baseUrl": "https://api.weather.com",
    "endpoints": [
        {
            "path": "/weather",
            "method": "GET",
            "parameters": {
                "location": {
                    "type": "string",
                    "required": true,
                    "description": "City name or coordinates"
                }
            }
        }
    ],
    "headers": {
        "Authorization": "Bearer token"
    }
}
```

### Tool Execution Flow

1. Agent identifies need for API tool
2. System constructs API request from tool schema
3. Request is made to external API
4. Response is parsed and formatted
5. Result is included in agent's response

## Implementation Details

### Caching Strategy

- **Tool Schemas**: Cached for 1 hour (MCP_CACHE_TTL)
- **Context**: Not cached (varies by query)
- **Tool Results**: Not cached (dynamic data)

### Error Handling

- **Server Unavailable**: Tool is skipped, agent continues without it
- **Invalid Parameters**: Error returned to agent for correction
- **Rate Limiting**: Tools respect rate limits, agent is informed

### Security

- **Headers**: Stored encrypted in database
- **URL Validation**: Only HTTPS URLs allowed
- **Scope**: Tools only accessible to agent owner

## Best Practices

1. **Documentation**: Provide clear tool descriptions
2. **Error Messages**: Return helpful error messages
3. **Rate Limits**: Respect API rate limits
4. **Caching**: Use appropriate caching strategies
5. **Testing**: Test tools thoroughly before enabling

## Example: GitHub MCP Server

```json
{
    "name": "GitHub MCP",
    "url": "https://github-mcp.example.com",
    "headers": {
        "Authorization": "Bearer github_token"
    }
}
```

Available tools:

- `create_issue`: Create a GitHub issue
- `search_repos`: Search repositories
- `get_file_contents`: Read file from repository

## Example: Custom Weather API Tool

```json
{
    "name": "Weather Service",
    "baseUrl": "https://api.weather.com/v1",
    "endpoints": [
        {
            "path": "/current",
            "method": "GET",
            "parameters": {
                "city": {
                    "type": "string",
                    "required": true
                },
                "units": {
                    "type": "string",
                    "default": "metric"
                }
            }
        }
    ]
}
```

## API Reference

### Add MCP Server

```typescript
PUT /api/agents/:id
{
    "mcp_servers": [
        {
            "name": "Server Name",
            "url": "https://mcp-server.com",
            "headers": { "Authorization": "Bearer token" }
        }
    ]
}
```

### Add API Tool

```typescript
PUT /api/agents/:id
{
    "api_tools": [
        {
            "name": "Tool Name",
            "description": "Tool description",
            "baseUrl": "https://api.example.com",
            "endpoints": [...]
        }
    ]
}
```

## Next Steps

- [AI Architecture](/docs/agents/architecture) — Platform API tools (The Grid GraphQL), platform MCP, per-agent MCP/API tools, and tool-call flow
- [RAG Technical](/docs/agents/rag-technical) — Knowledge base and vector search
- [Agents API Reference](/docs/api/agents-detailed) — Endpoints and request/response shapes

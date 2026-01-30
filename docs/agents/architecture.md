---
title: AI Architecture - Detailed Technical Overview
description: "Complete technical overview of Spritz AI agents: file structure, chat flow, RAG, MCP, API tools, scheduling, events, and code examples from the implementation."
keywords:
    [
        Spritz AI,
        agent architecture,
        Gemini,
        RAG,
        MCP,
        knowledge base,
        agent chat,
        tools,
    ]
sidebar_label: AI Architecture
sidebar_position: 0
---

# AI Architecture - Detailed Technical Overview

This document describes the AI agent architecture as implemented in the Spritz app: file structure, chat flow, RAG (Retrieval Augmented Generation), MCP (Model Context Protocol) servers, API tools, scheduling, events, and streaming. All code examples are aligned with the implementation.

---

## File Structure

The AI agent implementation lives in the following paths:

```
src/
├── app/api/agents/
│   ├── route.ts                    # GET list, POST create
│   ├── discover/route.ts           # Discover public agents
│   ├── favorites/route.ts          # User's favorite agents
│   ├── detect-api/route.ts         # Detect API type (GraphQL/OpenAPI)
│   └── [id]/
│       ├── route.ts                # GET/PATCH/DELETE single agent
│       ├── chat/route.ts            # POST chat, GET history, DELETE clear
│       ├── embed/route.ts           # Embed widget config
│       ├── channels/route.ts        # Channels agent is in
│       ├── knowledge/
│       │   ├── route.ts             # GET list, POST add, DELETE item
│       │   ├── index/route.ts       # POST trigger indexing (Firecrawl/GitHub/basic)
│       │   └── [itemId]/route.ts    # GET/DELETE single knowledge item
│       └── events/
│           ├── route.ts            # Agent's events
│           ├── extract/route.ts    # Extract events from content
│           └── [eventId]/route.ts  # Single event
├── app/api/public/agents/
│   └── [id]/
│       ├── route.ts                # Public agent profile
│       └── chat/route.ts            # Public chat (no auth or with x402)
├── app/api/cron/
│   └── sync-knowledge/route.ts     # Cron: re-index auto_sync knowledge
├── lib/
│   ├── agent-capabilities.ts       # Platform API tools (The Grid GraphQL) + optional MCP
│   ├── firecrawl.ts                # Firecrawl scrape/crawl for knowledge
│   ├── github.ts                   # GitHub repo content for knowledge
│   └── x402.ts                     # x402 payment requirements/verification
└── hooks/
    └── useAgents.ts                # Agent list, create, update; MCP/server types
```

### Key Files Summary

| File                                       | Purpose                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `api/agents/[id]/chat/route.ts`            | Main chat handler: RAG, MCP, API tools, scheduling, events, Gemini generateContent/stream                     |
| `lib/agent-capabilities.ts`                | Platform API tools (The Grid GraphQL via `GRID_GRAPHQL_URL`); optional platform MCP via `GRID_MCP_SERVER_URL` |
| `lib/firecrawl.ts`                         | Scrape/crawl URLs for knowledge indexing (Firecrawl API)                                                      |
| `lib/github.ts`                            | Fetch GitHub repo content for knowledge (GitHub API)                                                          |
| `api/agents/[id]/knowledge/index/route.ts` | Index a knowledge URL (Firecrawl → GitHub → basic fetch, chunk, embed, store)                                 |
| `api/cron/sync-knowledge/route.ts`         | Re-index knowledge items with `auto_sync` enabled                                                             |

---

## Chat Flow (High Level)

A single chat request (`POST /api/agents/:id/chat`) runs this pipeline:

1. **Auth & rate limit** — Session/address; rate limit tier `ai` (30/min).
2. **Load agent** — From `shout_agents`; enforce visibility (private = owner only).
3. **Load history** — Last 10 messages from `shout_agent_chats` for context.
4. **RAG (optional)** — If `use_knowledge_base !== false`: embed query with `text-embedding-004`, call `match_knowledge_chunks`, inject top chunks into system prompt; fallback: fetch pending knowledge URLs and use raw content.
5. **MCP (optional)** — If MCP enabled: platform MCP servers (`GRID_MCP_SERVER_URL`) + agent `mcp_servers`. For each relevant server: `tools/list` → AI picks tool + args → `tools/call` (up to 3 iterations); inject results into system prompt.
6. **API tools (optional)** — Platform API tools (The Grid GraphQL from `getPlatformApiTools()`) + agent `api_tools`. Call external APIs (GraphQL query or OpenAPI body can be AI-generated); inject results into system prompt.
7. **Scheduling (optional)** — If `scheduling_enabled` and message looks like scheduling: load owner availability from `shout_availability_windows`, optionally filter by Google Calendar freebusy for **booking card only** (calendar data is never sent to the LLM); add slot summary to system prompt; attach `scheduling` payload to response for UI.
8. **Events (optional)** — If `events_access`: load from `shout_events` and add to system prompt.
9. **System prompt** — Built from: current date, MCP results, API results, agent `system_instructions`, knowledge context, scheduling/events context, markdown/image guidance for official agents.
10. **Generate** — Gemini `generateContent` or `generateContentStream` (model `gemini-2.0-flash`); optional `googleSearch` grounding if `web_search_enabled`.
11. **Persist** — Append user message and assistant message to `shout_agent_chats`; call `increment_agent_messages` RPC.
12. **Response** — JSON: `{ message, agentName, agentEmoji, scheduling }` or NDJSON stream: `{ type: "chunk", text }`, `{ type: "done", message, scheduling }`, `{ type: "error", error }`.

---

## Chat Request and Response (Code)

### POST /api/agents/:id/chat

**Request body:**

```json
{
    "userAddress": "0x...",
    "message": "What documentation do you have?",
    "stream": false
}
```

- `userAddress` (required): Normalized to lowercase; used for access and history.
- `message` (required): User message text.
- `stream` (optional): If `true`, response is NDJSON stream (`application/x-ndjson`).

**Non-streaming response (200):**

```json
{
    "message": "Assistant reply text...",
    "agentName": "My Agent",
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

**Streaming response:** NDJSON lines, one per chunk or final event:

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

---

## RAG (Retrieval Augmented Generation)

### Embedding Model

- **Model:** `text-embedding-004` (Google GenAI).
- **Usage:** Query embedding for retrieval; chunk embeddings when indexing knowledge.

```typescript
// Generate embedding for a query (chat route)
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
    if (!ai) return null;
    const result = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: query,
    });
    return result.embeddings?.[0]?.values || null;
}
```

### Vector Retrieval

- **RPC:** `match_knowledge_chunks(p_agent_id, p_query_embedding, p_match_count, p_match_threshold)`.
- **Typical args:** `p_match_count: Math.max(maxChunks, 8)` (e.g. 8 when `maxChunks` is 5), `p_match_threshold: 0.25` (broader recall).
- **Return:** Chunks with `content`, `similarity`, optional `source_title`; content is cleaned of base64 before being sent to the LLM.

```typescript
// Retrieve relevant chunks (chat route)
const { data: chunks } = await supabase.rpc("match_knowledge_chunks", {
    p_agent_id: agentId,
    p_query_embedding: `[${queryEmbedding.join(",")}]`,
    p_match_count: Math.max(maxChunks, 8),
    p_match_threshold: 0.25,
});
// Format for system prompt: "[Source: title | Relevance: 85%]\n{content}"
```

### Knowledge Fallback (Non-Indexed URLs)

If RAG returns no chunks, the app can use **pending** knowledge items (status `pending`) and fetch their URLs directly:

```typescript
const { data: knowledgeItems } = await supabase
    .from("shout_agent_knowledge")
    .select("url, title, content_type, status")
    .eq("agent_id", id)
    .eq("status", "pending")
    .limit(3);
// Fetch each URL with a simple GET + HTML-to-text; inject into knowledge context
```

---

## Knowledge Base: Indexing Pipeline

Indexing is triggered by `POST /api/agents/:id/knowledge/index` (or by cron for auto_sync). Pipeline:

1. **Content source** (priority order):
    - **GitHub:** If URL is GitHub repo, use `lib/github.ts` (`parseGitHubUrl`, `fetchGitHubRepoContent`) to get file content.
    - **Firecrawl:** If configured and requested, use `lib/firecrawl.ts` (`scrapeUrl` or crawl) for markdown.
    - **Basic fetch:** Otherwise `fetchAndCleanContentBasic` in the index route (HTML stripped to text).
2. **Chunking:** `chunkText(content, 1000, 100)` — max 1000 chars per chunk, 100 char overlap; break at sentence/paragraph when possible.
3. **Embedding:** Each chunk embedded with `text-embedding-004`.
4. **Storage:** Chunks and embeddings written to `shout_knowledge_chunks`; `shout_agent_knowledge` updated (`status: "indexed"`, `chunk_count`, `indexed_at`).

### Chunking (Index Route)

```typescript
function chunkText(
    text: string,
    maxChunkSize: number = 1000,
    overlap: number = 100,
): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        let end = start + maxChunkSize;
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf(".", end);
            const lastNewline = text.lastIndexOf("\n", end);
            const breakPoint = Math.max(lastPeriod, lastNewline);
            if (breakPoint > start + maxChunkSize / 2) end = breakPoint + 1;
        }
        const chunk = text.slice(start, end).trim();
        if (chunk.length > 50) chunks.push(chunk);
        start = end - overlap;
        if (start < 0) start = 0;
    }
    return chunks;
}
```

### Firecrawl Options (Knowledge POST)

When adding a knowledge item (`POST /api/agents/:id/knowledge`), optional body fields for indexing behavior:

- `scrapeMethod`: `"basic"` | `"firecrawl"` — use Firecrawl when available.
- `crawlDepth`: number — for Firecrawl crawl.
- `autoSync`: boolean — include in cron re-index.
- `syncIntervalHours`: number — how often to re-index.
- `excludePatterns`: string[] — URL patterns to exclude.
- `infiniteScroll`, `scrollCount`: for JS-rendered pages.

---

## Platform API Tools (The Grid)

All agents get **The Grid GraphQL API** as a platform-wide API tool (no per-agent config). It is provided by `getPlatformApiTools()` in `lib/agent-capabilities.ts`. Optional env: `GRID_GRAPHQL_URL`, `GRID_API_KEY`.

```typescript
// lib/agent-capabilities.ts
const GRID_GRAPHQL_BASE = "https://beta.node.thegrid.id/graphql";

export function getPlatformApiTools(): APITool[] {
    const url = process.env.GRID_GRAPHQL_URL?.trim() || GRID_GRAPHQL_BASE;
    const apiKey = process.env.GRID_API_KEY?.trim();
    const tool: APITool = {
        id: "the-grid-platform",
        name: "The Grid",
        method: "POST",
        url,
        apiType: "graphql",
        description:
            "Structured Web3 data: profiles, products, assets, socials, entities.",
        instructions:
            "Use The Grid when the user asks about Web3 data, profiles, products, assets...",
        schema: GRID_SCHEMA_HINT.trim(),
    };
    if (apiKey) tool.apiKey = apiKey;
    return [tool];
}
```

The Grid provides Web3 data (profiles, products, assets, socials) so agents can answer data questions without running an MCP server. MCP remains available for custom tools.

---

## MCP (Model Context Protocol)

### Platform vs Per-Agent Servers

- **Platform:** From `lib/agent-capabilities.ts` — `getPlatformMcpServers()`. Optional: The Grid MCP when `GRID_MCP_SERVER_URL` is set. Available to all agents when env is set.
- **Per-agent:** `agent.mcp_servers` (array of `{ id, name, url, description, instructions, headers?, apiKey? }`). Merged with platform list for chat.

```typescript
// lib/agent-capabilities.ts
export function getPlatformMcpServers(): MCPServer[] {
    const servers: MCPServer[] = [];
    const gridUrl = process.env.GRID_MCP_SERVER_URL?.trim();
    if (gridUrl) {
        servers.push({
            id: "the-grid-platform-mcp",
            name: "The Grid (MCP)",
            url: gridUrl,
            description:
                "The Grid MCP provides access to data and query tools.",
            instructions:
                "Use when user asks about data, datasets, APIs, subgraphs.",
        });
    }
    return servers;
}
```

### MCP Discovery and Tool Call

1. **Discover tools:** POST to server URL with JSON-RPC `method: "tools/list"`. Result cached in memory (e.g. 1 hour TTL).
2. **Tool selection:** Gemini is called with a prompt that lists tool names, descriptions, and parameters; it returns a single JSON object `{ toolName, args }`. If no tool fits, `toolName: null`.
3. **Execute:** POST `method: "tools/call"`, `params: { name: toolName, arguments: args }`. Response content (e.g. `result.content[0].text`) is truncated and appended to MCP results.
4. **Iteration:** Up to 3 tool-call iterations per server when the result looks intermediate (e.g. `resolve-library-id` followed by another tool).
5. **Context fallback:** If `tools/list` returns no tools, the app can call Gemini with Google Search grounding to get a short description of the MCP server and use that as context.

```typescript
// Discover tools (chat route)
const response = await fetch(serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ... },
    body: JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        method: "tools/list",
        params: {},
    }),
});
const tools = (await response.json())?.result?.tools || [];

// Call tool (chat route)
const callResponse = await fetch(serverUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: args },
    }),
});
const resultText = (await callResponse.json())?.result?.content?.[0]?.text || ...;
```

MCP results are prepended to the system prompt under a section that instructs the model to present the data only and not output code or API usage.

---

## API Tools (Custom HTTP/GraphQL)

**Platform:** Every agent gets The Grid GraphQL API from `getPlatformApiTools()` (see above).

**Per-agent:** Agents can have `api_tools`: array of `{ name, url, method, description?, instructions?, headers?, apiKey?, apiType?, schema? }`.

- **Relevance:** Message is matched to tools by “always” instructions, name mention, keyword overlap, doc/query patterns, or explicit “use API” language. For GraphQL, data-query patterns (list, get, fetch, etc.) also trigger.
- **GraphQL:** If `apiType === "graphql"` (or URL/description suggests GraphQL), Gemini is used to generate a `query` from the user message and schema; the request body is `{ query: generatedQuery }`. Response `data` is passed into the system prompt even if `errors` exist.
- **OpenAPI:** If `apiType === "openapi"`, Gemini can generate a JSON body from schema/instructions; that body is sent as POST body.
- **Other POST:** Default body is `{ query, message, text }` set from the user message.

API results are prepended to the system prompt with instructions to present the data and not output code.

---

## Scheduling

- **When:** Agent has `scheduling_enabled === true` and the user message looks like scheduling (e.g. “schedule”, “book”, “meeting”, “availability”, “when can”).
- **Data for AI:** Only **database** data: owner’s `shout_availability_windows` and `shout_user_settings` (durations, free/paid, price). Slots are generated from windows for the next 7 days and summarized by date/time in the user’s timezone. **Google Calendar busy/free is never sent to the LLM** (compliance).
- **Data for UI:** The same slots can be filtered by Google Calendar freebusy for the **booking card** only; that filtered list is returned in `response.scheduling.slots` and `scheduling.slotsByDate` so the card shows only free times.
- **Response:** `scheduling` object in the JSON (or in the final `done` event when streaming) so the client can render the booking widget.

---

## Events

- **When:** Agent has `events_access === true` and the message suggests events (e.g. “event”, “conference”, “hackathon”, “register”, “RSVP”).
- **Data:** Upcoming events from `shout_events` (status `published`, `event_date >= today`), ordered by featured then date; deduplicated by name/date/location. Event list is appended to the system prompt; the model is told to use it and to mention Spritz registration when available.

---

## Gemini Configuration

- **Model:** `gemini-2.0-flash` for chat and for auxiliary calls (tool selection, GraphQL/OpenAPI body generation, MCP server context).
- **Embedding:** `text-embedding-004` for RAG.
- **Config:** `maxOutputTokens: 2048`, `temperature: 0.7`; optional `tools: [{ googleSearch: {} }]` when `web_search_enabled !== false`.
- **Streaming:** `ai.models.generateContentStream(generateConfig)`; chunks parsed for `chunk.text` and sent as NDJSON.

---

## Agent Create (Alignment with Implementation)

**POST /api/agents** expects:

```json
{
    "userAddress": "0x...",
    "name": "My Agent",
    "personality": "Optional short personality",
    "avatarEmoji": "🤖",
    "visibility": "private",
    "tags": ["tag1", "tag2"]
}
```

- **Required:** `userAddress`, `name`.
- **Beta:** User must have `beta_access` in `shout_users`.
- **Limit:** Non-admin users are limited to 5 agents (official agents and admins are exempt).
- **Official:** Only admins can set `visibility: "official"`.
- **Tags:** Max 5, each trimmed and limited to 20 chars; stored normalized (e.g. lowercase).
- **System instructions:** If `personality` is provided, generated as: `You are an AI assistant named "${name}". Your personality: ${personality}. Be helpful, friendly, and stay in character.` Otherwise a short default.
- **Defaults:** `model: "gemini-2.0-flash"`, `avatar_emoji: "🤖"`, `visibility: "private"`.

---

## Agent List (Alignment with Implementation)

**GET /api/agents**

- **Query:** `userAddress` (required), `includeOfficial` (optional, `"true"` to include official agents).
- **Behavior:** Returns all agents owned by `userAddress`. If `includeOfficial === "true"`, the requesting user must be in `shout_admins`; then official agents (visibility `official`) not owned by the user are appended.
- **Order:** `created_at` descending.

---

## Next Steps

- [Agents Introduction](/docs/agents/intro) — Overview and user-facing features
- [RAG Technical](/docs/agents/rag-technical) — Database schema and vector search
- [MCP Servers](/docs/agents/mcp-servers) — Configuring MCP for agents
- [x402](/docs/agents/x402) — Monetizing agent access
- [Agents API Reference](/docs/api/agents-detailed) — Full endpoint list and request/response shapes

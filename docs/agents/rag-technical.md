# Knowledge Base (RAG) - Technical Deep Dive

## Overview

Spritz uses **Retrieval Augmented Generation (RAG)** to enhance AI agent responses with custom knowledge bases. The system uses vector embeddings stored in PostgreSQL with pgvector for semantic search.

## Architecture

### Components

1. **Content Ingestion**: URLs are fetched and parsed
2. **Text Chunking**: Content is split into manageable chunks
3. **Embedding Generation**: Chunks are converted to vector embeddings using Google's `text-embedding-004` model
4. **Vector Storage**: Embeddings stored in PostgreSQL with pgvector extension
5. **Semantic Search**: Query embeddings are matched against stored chunks using cosine similarity
6. **Context Injection**: Relevant chunks are injected into the LLM prompt

## Database Schema

### `shout_agent_knowledge`

Stores knowledge base URLs and their processing status:

```sql
CREATE TABLE shout_agent_knowledge (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES shout_agents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    content_type TEXT DEFAULT 'webpage', -- 'webpage', 'github', 'docs'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'indexed', 'failed'
    error_message TEXT,
    embedding_id TEXT, -- Reference to external embedding service (if used)
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ,
    UNIQUE(agent_id, url)
);
```

### `shout_knowledge_chunks`

Stores the actual content chunks with vector embeddings:

```sql
CREATE TABLE shout_knowledge_chunks (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES shout_agents(id) ON DELETE CASCADE,
    knowledge_id UUID NOT NULL, -- References shout_agent_knowledge
    content TEXT NOT NULL,
    embedding vector(768), -- pgvector type, 768 dimensions
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX ON shout_knowledge_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Embedding Model

Spritz uses **Google's `text-embedding-004`** model:

- **Dimensions**: 768
- **Distance Metric**: Cosine similarity
- **API**: Google GenAI Embedding API

:::info Gemini Model Configuration
For chat generation, Spritz uses **gemini-2.0-flash** from Google's Gemini API. This model provides:

- Fast response times (optimized for real-time chat)
- High-quality responses suitable for most use cases
- Good balance between cost and capability

All agents use this model by default. Model availability may change as Google updates their API.
:::

### Generating Embeddings

```typescript
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
    const result = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: query,
    });

    return result.embeddings?.[0]?.values || null;
}
```

## Vector Search

### Similarity Search Function

The database uses a PostgreSQL function for vector similarity search:

```sql
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    p_agent_id UUID,
    p_query_embedding vector(768),
    p_match_count INT DEFAULT 5,
    p_match_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.content,
        1 - (kc.embedding <=> p_query_embedding) AS similarity,
        kc.metadata
    FROM shout_knowledge_chunks kc
    WHERE
        kc.agent_id = p_agent_id
        AND 1 - (kc.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY kc.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;
```

### Query Implementation

```typescript
async function getRAGContext(
    agentId: string,
    message: string,
): Promise<string | null> {
    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(message);
    if (!queryEmbedding) return null;

    // Search for relevant chunks
    const { data: chunks, error } = await db.rpc("match_knowledge_chunks", {
        p_agent_id: agentId,
        p_query_embedding: `[${queryEmbedding.join(",")}]`,
        p_match_count: 5,
        p_match_threshold: 0.3, // 30% similarity threshold
    });

    if (error || !chunks?.length) return null;

    // Format context with relevance scores
    const context = chunks
        .map(
            (chunk: { content: string; similarity: number }) =>
                `[Relevance: ${(chunk.similarity * 100).toFixed(0)}%]\n${chunk.content}`,
        )
        .join("\n\n---\n\n");

    return context;
}
```

## Indexing Process

### Step 1: URL Submission

```typescript
POST /api/agents/:id/knowledge
{
    "url": "https://example.com/docs",
    "title": "Example Documentation",
    "content_type": "webpage"
}
```

### Step 2: Content Fetching

The system supports two scraping methods:

#### Basic Scraping (Default)

Available to all users. Fetches URL content using simple HTML parsing:

- HTML pages: Extracts text, removes scripts/styles/navigation
- GitHub repos: Fetches markdown files
- Documentation sites: Parses structured content

#### Firecrawl Integration (Official Agents Only)

For official agents, Spritz integrates with [Firecrawl](https://firecrawl.dev) for high-quality web scraping:

```typescript
POST /api/agents/:id/knowledge
{
    "url": "https://docs.example.com",
    "title": "Example Documentation",
    "scrapeMethod": "firecrawl",   // Use Firecrawl instead of basic
    "crawlDepth": 3,               // Follow links up to 3 levels deep
    "excludePatterns": ["/blog/*", "/changelog/*"],  // Skip these paths
    "autoSync": true,              // Enable automatic re-indexing
    "syncIntervalHours": 24        // Re-index every 24 hours
}
```

**Firecrawl Features:**

- JavaScript rendering for SPAs
- Multi-page crawling for documentation sites
- Clean markdown output optimized for RAG
- Anti-bot bypass capabilities
- Up to 50 pages per knowledge source

:::info Official Agents Only
Firecrawl integration is available only for official agents due to API costs. Regular agents use the basic scraping method which works well for most static content.
:::

### Step 3: Chunking

Content is split into chunks:

- **Chunk Size**: ~500-1000 tokens
- **Overlap**: ~100 tokens between chunks
- **Strategy**: Semantic chunking when possible

### Step 4: Embedding Generation

Each chunk is embedded:

```typescript
for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);

    await db.from("shout_knowledge_chunks").insert({
        agent_id: agentId,
        knowledge_id: knowledgeId,
        content: chunk.content,
        embedding: `[${embedding.join(",")}]`,
        metadata: {
            source_url: url,
            chunk_index: index,
            title: title,
        },
    });
}
```

### Step 5: Status Update

```typescript
await db
    .from("shout_agent_knowledge")
    .update({
        status: "indexed",
        chunk_count: chunks.length,
        indexed_at: new Date().toISOString(),
    })
    .eq("id", knowledgeId);
```

## Context Injection

When a user sends a message, the system:

1. Generates an embedding for the query
2. Searches for top 5 most similar chunks (30% threshold)
3. Formats chunks with relevance scores
4. Injects into the prompt:

```typescript
const ragContext = await getRAGContext(agentId, message);
const fullMessage =
    message +
    `\n\nRelevant context from knowledge base:\n${ragContext}\n\n` +
    `Use this context to inform your response when relevant.`;
```

## Performance Considerations

### Index Optimization

- **IVFFlat Index**: Used for approximate nearest neighbor search
- **Lists Parameter**: 100 (tuned for ~1M vectors)
- **Rebuild Threshold**: Rebuild when 10x growth

### Caching

- Query embeddings are not cached (queries vary)
- Chunk embeddings are cached in database
- Search results cached for 5 minutes per query

### Cost Optimization

- **Batch Embedding**: Process multiple chunks in parallel
- **Selective Indexing**: Only index when `use_knowledge_base` is enabled
- **Cleanup**: Remove old chunks when knowledge is deleted

## Auto-Sync for Knowledge Sources

Official agents can enable automatic re-indexing to keep knowledge bases up-to-date with source content changes.

### How Auto-Sync Works

1. **Cron Job**: Runs every 6 hours (configurable via Vercel Cron)
2. **Eligibility Check**: Only processes sources with `auto_sync: true` on official agents
3. **Interval Check**: Respects each source's `sync_interval_hours` setting
4. **Re-indexing**: Fetches fresh content, generates new embeddings, replaces old chunks

### Database Schema Updates

```sql
ALTER TABLE shout_agent_knowledge ADD COLUMN
    scrape_method TEXT DEFAULT 'basic',        -- 'basic' or 'firecrawl'
    crawl_depth INTEGER DEFAULT 1,             -- Max depth for Firecrawl crawls
    exclude_patterns TEXT[],                   -- URL patterns to skip
    auto_sync BOOLEAN DEFAULT false,           -- Enable automatic re-indexing
    sync_interval_hours INTEGER DEFAULT 24,    -- Hours between syncs
    last_synced_at TIMESTAMPTZ;                -- Last successful sync time
```

### Cron Endpoint

```http
GET /api/cron/sync-knowledge
Authorization: Bearer ${CRON_SECRET}
```

The cron job:

- Queries all knowledge sources with `auto_sync: true` on official agents
- Filters by those needing sync (based on `sync_interval_hours` and `last_synced_at`)
- Re-indexes each source sequentially with rate limiting
- Updates `last_synced_at` on success

:::tip Cost Management
Auto-sync is limited to official agents to manage Firecrawl and embedding API costs. Each sync operation generates new embeddings for all chunks in the knowledge source.
:::

## Best Practices

1. **Chunk Size**: Keep chunks between 500-1000 tokens for optimal retrieval
2. **Overlap**: Use 10-20% overlap to maintain context across chunks
3. **Metadata**: Store source URLs and titles for citation
4. **Threshold**: Adjust similarity threshold (0.3 default) based on use case
5. **Refresh**: Re-index when source content changes (or use auto-sync for official agents)
6. **Exclude Patterns**: For documentation sites, exclude changelog, blog, and versioned paths to reduce noise

## Troubleshooting

### Low Relevance Results

- **Issue**: Chunks not matching queries well
- **Solution**: Lower similarity threshold, increase chunk overlap, improve chunking strategy

### Slow Indexing

- **Issue**: Large documents taking too long
- **Solution**: Process in batches, use async processing, optimize chunking

### High Costs

- **Issue**: Too many embedding API calls
- **Solution**: Cache embeddings, batch requests, limit chunk size

## API Reference

### Index Knowledge

```typescript
POST /api/agents/:id/knowledge/index
{
    "knowledge_id": "uuid"
}
```

### Get Knowledge Base

```typescript
GET /api/agents/:id/knowledge
// Returns: Array of knowledge items with status
```

### Delete Knowledge

```typescript
DELETE /api/agents/:id/knowledge/:knowledge_id
// Cascades to delete all associated chunks
```

## Next Steps

- [AI Architecture](/docs/agents/architecture) — Chat flow, RAG retrieval (`match_knowledge_chunks`), indexing pipeline, and code examples
- [MCP Servers & API Tools](/docs/agents/mcp-servers) — External tools for agents
- [Agents API Reference](/docs/api/agents-detailed) — Knowledge endpoints

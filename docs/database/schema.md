# Database Schema

## Overview

Spritz uses **Supabase (PostgreSQL)** with the **pgvector** extension for vector similarity search.

## Core Tables

### `shout_users`

User accounts and analytics.

```sql
CREATE TABLE shout_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_admin BOOLEAN DEFAULT FALSE,
    beta_access BOOLEAN DEFAULT FALSE,
    
    -- Analytics
    messages_sent INTEGER DEFAULT 0,
    friends_count INTEGER DEFAULT 0,
    voice_minutes NUMERIC DEFAULT 0,
    video_minutes NUMERIC DEFAULT 0,
    groups_joined INTEGER DEFAULT 0
);

CREATE INDEX idx_users_wallet ON shout_users(wallet_address);
CREATE INDEX idx_users_username ON shout_users(username);
```

### `shout_friends`

Friend relationships.

```sql
CREATE TABLE shout_friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    friend_address TEXT NOT NULL,
    tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_address, friend_address)
);

CREATE INDEX idx_friends_user ON shout_friends(user_address);
CREATE INDEX idx_friends_friend ON shout_friends(friend_address);
```

### `shout_friend_requests`

Friend request management.

```sql
CREATE TABLE shout_friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_from ON shout_friend_requests(from_address);
CREATE INDEX idx_requests_to ON shout_friend_requests(to_address);
```

## AI Agents Tables

### `shout_agents`

Agent configurations.

```sql
CREATE TABLE shout_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_address TEXT NOT NULL,
    name TEXT NOT NULL CHECK (char_length(name) <= 50),
    personality TEXT CHECK (char_length(personality) <= 1000),
    system_instructions TEXT,
    model TEXT DEFAULT 'gemini-2.0-flash',
    avatar_emoji TEXT DEFAULT '🤖',
    
    -- Visibility: 'private', 'friends', 'public'
    visibility TEXT DEFAULT 'private' 
        CHECK (visibility IN ('private', 'friends', 'public')),
    
    -- Capabilities
    web_search_enabled BOOLEAN DEFAULT true,
    use_knowledge_base BOOLEAN DEFAULT true,
    
    -- Stats
    message_count INTEGER DEFAULT 0,
    
    -- Tags for discovery
    tags JSONB DEFAULT '[]',
    
    -- x402 configuration
    x402_enabled BOOLEAN DEFAULT FALSE,
    x402_price_cents INTEGER DEFAULT 1,
    x402_network TEXT DEFAULT 'base-sepolia',
    x402_wallet_address TEXT,
    x402_pricing_mode TEXT DEFAULT 'global',
    
    -- MCP & API tools
    mcp_servers JSONB DEFAULT '[]',
    api_tools JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_agent_name_per_user 
        UNIQUE (owner_address, name)
);

CREATE INDEX idx_agents_owner ON shout_agents(owner_address);
CREATE INDEX idx_agents_visibility ON shout_agents(visibility);
CREATE INDEX idx_agents_created ON shout_agents(created_at DESC);
CREATE INDEX idx_agents_tags ON shout_agents USING GIN(tags);
```

### `shout_agent_chats`

Agent chat history.

```sql
CREATE TABLE shout_agent_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES shout_agents(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    session_id TEXT, -- For maintaining conversation context
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_chats_agent ON shout_agent_chats(agent_id);
CREATE INDEX idx_agent_chats_user ON shout_agent_chats(user_address);
CREATE INDEX idx_agent_chats_session ON shout_agent_chats(session_id);
CREATE INDEX idx_agent_chats_created ON shout_agent_chats(created_at DESC);
```

### `shout_agent_knowledge`

Knowledge base URLs.

```sql
CREATE TABLE shout_agent_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES shout_agents(id) ON DELETE CASCADE,
    
    -- Content info
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    content_type TEXT DEFAULT 'webpage', -- 'webpage', 'github', 'docs'
    
    -- Processing status
    status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
    error_message TEXT,
    
    -- Vertex AI reference (for V2)
    embedding_id TEXT,
    chunk_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_url_per_agent UNIQUE (agent_id, url)
);

CREATE INDEX idx_agent_knowledge_agent ON shout_agent_knowledge(agent_id);
CREATE INDEX idx_agent_knowledge_status ON shout_agent_knowledge(status);
```

### `shout_knowledge_chunks`

Vector embeddings for RAG.

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE shout_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES shout_agents(id) ON DELETE CASCADE,
    knowledge_id UUID NOT NULL, -- References shout_agent_knowledge
    content TEXT NOT NULL,
    embedding vector(768), -- Google text-embedding-004
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX idx_knowledge_chunks_embedding 
ON shout_knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX idx_knowledge_chunks_agent ON shout_knowledge_chunks(agent_id);
CREATE INDEX idx_knowledge_chunks_knowledge ON shout_knowledge_chunks(knowledge_id);
```

### `shout_agent_favorites`

User favorites.

```sql
CREATE TABLE shout_agent_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    agent_id UUID REFERENCES shout_agents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_address, agent_id)
);

CREATE INDEX idx_favorites_user ON shout_agent_favorites(user_address);
CREATE INDEX idx_favorites_agent ON shout_agent_favorites(agent_id);
```

## Streaming Tables

### `shout_streams`

Livestreaming sessions.

```sql
CREATE TABLE shout_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    stream_id TEXT NOT NULL, -- Livepeer stream ID
    stream_key TEXT, -- Livepeer stream key (for WHIP)
    playback_id TEXT, -- Livepeer playback ID
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'live', 'ended')),
    viewer_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_streams_user ON shout_streams(user_address);
CREATE INDEX idx_streams_status ON shout_streams(status);
CREATE INDEX idx_streams_created ON shout_streams(created_at DESC);
```

### `shout_stream_assets`

Stream recordings.

```sql
CREATE TABLE shout_stream_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES shout_streams(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    asset_id TEXT NOT NULL UNIQUE, -- Livepeer asset ID
    playback_id TEXT,
    playback_url TEXT,
    download_url TEXT,
    duration_seconds NUMERIC,
    size_bytes BIGINT,
    status TEXT DEFAULT 'processing' 
        CHECK (status IN ('processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stream_assets_stream ON shout_stream_assets(stream_id);
CREATE INDEX idx_stream_assets_status ON shout_stream_assets(status);
```

### `shout_stream_viewers`

Active viewer tracking.

```sql
CREATE TABLE shout_stream_viewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES shout_streams(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stream_id, user_address)
);

CREATE INDEX idx_stream_viewers_stream ON shout_stream_viewers(stream_id);
CREATE INDEX idx_stream_viewers_user ON shout_stream_viewers(user_address);
```

## Functions

### Vector Similarity Search

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

### Increment Agent Messages

```sql
CREATE OR REPLACE FUNCTION increment_agent_messages(p_agent_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE shout_agents
    SET message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql;
```

## Row Level Security (RLS)

### Enable RLS

```sql
ALTER TABLE shout_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shout_agent_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE shout_agent_knowledge ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

```sql
-- Users can manage own agents
CREATE POLICY "Users can manage own agents" ON shout_agents
    FOR ALL USING (true); -- Simplified for now

-- Users can access agent chats
CREATE POLICY "Users can access agent chats" ON shout_agent_chats
    FOR ALL USING (true); -- Simplified for now
```

## Realtime Subscriptions

```sql
-- Enable realtime for agents
ALTER PUBLICATION supabase_realtime ADD TABLE shout_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE shout_streams;
```

## Migration Scripts

All migration scripts are located in `/migrations` directory:

- `agents.sql` - Agent tables
- `agents_x402.sql` - x402 payment fields
- `agents_mcp.sql` - MCP server configuration
- `agents_tags.sql` - Tags for discovery
- `embeddings.sql` - Vector search setup
- `streams.sql` - Streaming tables
- And more...

See the repository's `/migrations` folder for complete migration scripts.



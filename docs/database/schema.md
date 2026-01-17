# Database Schema

## Overview

Spritz uses **PostgreSQL** with the **pgvector** extension for vector similarity search.

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
    avatar_url TEXT, -- Custom uploaded avatar image (optional)

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

## Group Chat Tables

### `shout_groups`

Group configurations.

```sql
CREATE TABLE shout_groups (
    id TEXT PRIMARY KEY,  -- Group ID (uuid-like string)
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,  -- Creator's wallet address
    symmetric_key TEXT NOT NULL,  -- Encrypted symmetric key for the group
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groups_created_by ON shout_groups(created_by);
```

### `shout_group_members`

Group membership.

```sql
CREATE TABLE shout_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES shout_groups(id) ON DELETE CASCADE,
    member_address TEXT NOT NULL,  -- Member's wallet address (lowercase)
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    role TEXT DEFAULT 'member',  -- 'admin' or 'member'
    UNIQUE(group_id, member_address)
);

CREATE INDEX idx_group_members_group ON shout_group_members(group_id);
CREATE INDEX idx_group_members_member ON shout_group_members(member_address);
```

## Chat Folders Tables

### `shout_chat_folders`

User-defined folders for organizing chats (Telegram-style).

```sql
CREATE TABLE shout_chat_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    emoji TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_address, emoji)
);

CREATE INDEX idx_chat_folders_user ON shout_chat_folders(user_address);
```

### `shout_chat_folder_assignments`

Maps chats to folders.

```sql
CREATE TABLE shout_chat_folder_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    chat_type TEXT NOT NULL CHECK (chat_type IN ('dm', 'group', 'channel', 'global')),
    folder_emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_address, chat_id)
);

CREATE INDEX idx_chat_folder_assignments_user ON shout_chat_folder_assignments(user_address);
CREATE INDEX idx_chat_folder_assignments_folder ON shout_chat_folder_assignments(user_address, folder_emoji);
```

## Public Channel Tables

### `shout_public_channels`

Public channel configurations.

```sql
CREATE TABLE shout_public_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    emoji TEXT DEFAULT '💬',
    category TEXT DEFAULT 'general',
    creator_address TEXT,
    is_official BOOLEAN DEFAULT false,
    member_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_public_channels_category ON shout_public_channels(category);
```

### `shout_channel_members`

Channel membership.

```sql
CREATE TABLE shout_channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES shout_public_channels(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    notifications_muted BOOLEAN DEFAULT false,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, user_address)
);

CREATE INDEX idx_channel_members_user ON shout_channel_members(user_address);
CREATE INDEX idx_channel_members_channel ON shout_channel_members(channel_id);
```

### `shout_channel_messages`

Public channel messages (unencrypted).

```sql
CREATE TABLE shout_channel_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES shout_public_channels(id) ON DELETE CASCADE,
    sender_address TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    
    -- Pinned messages (admin feature)
    is_pinned BOOLEAN DEFAULT false,
    pinned_by TEXT,
    pinned_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channel_messages_channel ON shout_channel_messages(channel_id);
CREATE INDEX idx_channel_messages_created ON shout_channel_messages(created_at DESC);
CREATE INDEX idx_channel_messages_pinned ON shout_channel_messages(channel_id, is_pinned) WHERE is_pinned = true;
```

## Moderation System Tables

### `shout_moderators`

Moderators for global chat and specific channels.

```sql
CREATE TABLE shout_moderators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    channel_id UUID REFERENCES shout_public_channels(id) ON DELETE CASCADE, -- NULL = global chat
    granted_by TEXT NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Granular permissions
    can_pin BOOLEAN DEFAULT true,
    can_delete BOOLEAN DEFAULT true,
    can_mute BOOLEAN DEFAULT true,
    can_manage_mods BOOLEAN DEFAULT false,
    notes TEXT,
    
    UNIQUE(user_address, channel_id)
);

CREATE INDEX idx_moderators_user ON shout_moderators(user_address);
CREATE INDEX idx_moderators_channel ON shout_moderators(channel_id);
CREATE INDEX idx_moderators_global ON shout_moderators(channel_id) WHERE channel_id IS NULL;
```

### `shout_muted_users`

Users muted from channels or global chat.

```sql
CREATE TABLE shout_muted_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    channel_id UUID REFERENCES shout_public_channels(id) ON DELETE CASCADE, -- NULL = global chat
    muted_by TEXT NOT NULL,
    muted_at TIMESTAMPTZ DEFAULT NOW(),
    muted_until TIMESTAMPTZ, -- NULL = permanent mute
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    unmuted_by TEXT,
    unmuted_at TIMESTAMPTZ
);

CREATE INDEX idx_muted_users_address ON shout_muted_users(user_address);
CREATE INDEX idx_muted_users_channel ON shout_muted_users(channel_id);
CREATE INDEX idx_muted_users_active ON shout_muted_users(is_active, muted_until);
```

### `shout_moderation_log`

Audit trail for all moderation actions.

```sql
CREATE TABLE shout_moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- 'pin', 'unpin', 'delete', 'mute', 'unmute', 'promote_mod', 'demote_mod'
    moderator_address TEXT NOT NULL,
    target_user_address TEXT,
    target_message_id UUID,
    channel_id UUID REFERENCES shout_public_channels(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mod_log_moderator ON shout_moderation_log(moderator_address);
CREATE INDEX idx_mod_log_target_user ON shout_moderation_log(target_user_address);
CREATE INDEX idx_mod_log_action ON shout_moderation_log(action_type);
CREATE INDEX idx_mod_log_created ON shout_moderation_log(created_at DESC);
```

### Message Soft Delete

Messages support soft deletion for moderation:

```sql
-- Added to shout_alpha_messages and shout_channel_messages
ALTER TABLE shout_alpha_messages 
ADD COLUMN is_deleted BOOLEAN DEFAULT false,
ADD COLUMN deleted_by TEXT,
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN delete_reason TEXT;

ALTER TABLE shout_channel_messages 
ADD COLUMN is_deleted BOOLEAN DEFAULT false,
ADD COLUMN deleted_by TEXT,
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN delete_reason TEXT;
```

## Calendar & Scheduling Tables

### `shout_calendar_connections`

OAuth connections to calendar providers.

```sql
CREATE TABLE shout_calendar_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'google',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    calendar_id TEXT,
    calendar_email TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, provider)
);

CREATE INDEX idx_calendar_connections_wallet ON shout_calendar_connections(wallet_address);
```

### `shout_availability_windows`

User-defined availability windows for scheduling.

```sql
CREATE TABLE shout_availability_windows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    name TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_windows_wallet ON shout_availability_windows(wallet_address);
CREATE INDEX idx_availability_windows_day ON shout_availability_windows(day_of_week);
```

### `shout_scheduled_calls`

Scheduled calls/meetings between users.

```sql
CREATE TABLE shout_scheduled_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheduler_wallet_address TEXT NOT NULL,
    recipient_wallet_address TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_required BOOLEAN DEFAULT false,
    payment_amount TEXT,
    payment_token TEXT,
    payment_status TEXT DEFAULT 'pending',
    calendar_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_calls_scheduler ON shout_scheduled_calls(scheduler_wallet_address);
CREATE INDEX idx_scheduled_calls_recipient ON shout_scheduled_calls(recipient_wallet_address);
CREATE INDEX idx_scheduled_calls_scheduled_at ON shout_scheduled_calls(scheduled_at);
```

## Call History

### `shout_call_history`

Voice and video call history.

```sql
CREATE TABLE shout_call_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_address TEXT NOT NULL,
    callee_address TEXT NOT NULL,
    call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
    status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'declined', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    channel_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_history_caller ON shout_call_history(caller_address);
CREATE INDEX idx_call_history_callee ON shout_call_history(callee_address);
CREATE INDEX idx_call_history_created ON shout_call_history(created_at DESC);
```

## Profile Widgets Tables

### `profile_widgets`

Customizable Bento-style profile widgets.

```sql
CREATE TABLE profile_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    widget_type TEXT NOT NULL, -- 'map', 'image', 'text', 'social_embed', 'nft', 'link', 'spotify', 'github', 'video', 'countdown', 'stats'
    size TEXT NOT NULL DEFAULT '1x1', -- '1x1', '2x1', '1x2', '2x2', '4x1', '4x2'
    position INTEGER NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}',
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_widgets_user ON profile_widgets(user_address);
CREATE INDEX idx_profile_widgets_position ON profile_widgets(user_address, position);
```

### `profile_themes`

User profile theme and styling preferences.

```sql
CREATE TABLE profile_themes (
    user_address TEXT PRIMARY KEY,
    background_type TEXT NOT NULL DEFAULT 'solid', -- 'solid', 'gradient', 'image', 'mesh'
    background_value TEXT NOT NULL DEFAULT '#09090b',
    accent_color TEXT NOT NULL DEFAULT '#f97316',
    secondary_color TEXT,
    text_color TEXT NOT NULL DEFAULT '#ffffff',
    card_style TEXT NOT NULL DEFAULT 'rounded', -- 'rounded', 'sharp', 'pill'
    card_background TEXT NOT NULL DEFAULT 'rgba(24, 24, 27, 0.8)',
    card_border TEXT DEFAULT 'rgba(63, 63, 70, 0.5)',
    font_family TEXT NOT NULL DEFAULT 'system', -- 'system', 'inter', 'mono', 'serif'
    show_spritz_badge BOOLEAN NOT NULL DEFAULT true,
    custom_css TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Custom Avatar Columns

Additional columns on `shout_user_settings` for custom avatars:

```sql
ALTER TABLE shout_user_settings 
ADD COLUMN custom_avatar_url TEXT,
ADD COLUMN use_custom_avatar BOOLEAN DEFAULT FALSE;
```

## Username Tables

### `shout_usernames`

Username claims and management.

```sql
CREATE TABLE shout_usernames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usernames_wallet ON shout_usernames(wallet_address);
CREATE INDEX idx_usernames_username ON shout_usernames(username);
```

**Constraints:**
- Username must be 3-20 characters
- Only lowercase letters, numbers, and underscores allowed
- Reserved usernames are blocked (see [Security](/docs/developers/security#reserved-usernames))

## Authentication Tables

### `passkey_credentials`

WebAuthn/passkey credential storage.

```sql
CREATE TABLE passkey_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    user_address TEXT NOT NULL,
    display_name TEXT,
    aaguid TEXT,
    transports TEXT[],
    backed_up BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    device_info JSONB
);

CREATE INDEX idx_passkey_credentials_user_address ON passkey_credentials(user_address);
CREATE INDEX idx_passkey_credentials_credential_id ON passkey_credentials(credential_id);
```

### `passkey_challenges`

Active WebAuthn challenges (short-lived).

```sql
CREATE TABLE passkey_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge TEXT NOT NULL UNIQUE,
    ceremony_type TEXT NOT NULL CHECK (ceremony_type IN ('registration', 'authentication')),
    user_address TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_passkey_challenges_challenge ON passkey_challenges(challenge);
```

## Bug Reports

### `shout_bug_reports`

User-submitted bug reports.

```sql
CREATE TABLE shout_bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Agents', 'Friends', 'Calls', 'Chats', 'Rooms', 'Livestream', 'Settings', 'Configuration', 'Other')),
    description TEXT NOT NULL,
    replication_steps TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_notes TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    github_issue_url TEXT,
    github_issue_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bug_reports_user_address ON shout_bug_reports(user_address);
CREATE INDEX idx_bug_reports_category ON shout_bug_reports(category);
CREATE INDEX idx_bug_reports_status ON shout_bug_reports(status);
```

## Wallet Analytics Tables

### `shout_wallet_transactions`

Tracks all wallet transactions for analytics.

```sql
CREATE TABLE shout_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(66) NOT NULL,
    smart_wallet_address VARCHAR(42) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    chain_id INTEGER NOT NULL,
    chain_name VARCHAR(50) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    token_address VARCHAR(42),
    amount VARCHAR(78) NOT NULL,
    amount_formatted DECIMAL(38, 18),
    amount_usd DECIMAL(18, 2),
    tx_type VARCHAR(20) NOT NULL DEFAULT 'send',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    gas_used VARCHAR(78),
    gas_price VARCHAR(78),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    CONSTRAINT unique_tx_hash_chain UNIQUE(tx_hash, chain_id)
);

CREATE INDEX idx_wallet_tx_user ON shout_wallet_transactions(user_address);
CREATE INDEX idx_wallet_tx_smart_wallet ON shout_wallet_transactions(smart_wallet_address);
CREATE INDEX idx_wallet_tx_chain ON shout_wallet_transactions(chain_id);
CREATE INDEX idx_wallet_tx_created ON shout_wallet_transactions(created_at);
```

### `shout_wallet_network_stats`

Aggregated network usage statistics.

```sql
CREATE TABLE shout_wallet_network_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INTEGER NOT NULL UNIQUE,
    chain_name VARCHAR(50) NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    total_volume_usd DECIMAL(24, 2) DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Wallet Analytics Columns

Additional columns on `shout_users` for wallet analytics:

```sql
ALTER TABLE shout_users
ADD COLUMN wallet_tx_count INTEGER DEFAULT 0,
ADD COLUMN wallet_volume_usd DECIMAL(24, 2) DEFAULT 0,
ADD COLUMN last_wallet_tx_at TIMESTAMPTZ,
ADD COLUMN preferred_chain_id INTEGER;
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

### Check If User Is Muted

```sql
CREATE OR REPLACE FUNCTION is_user_muted(
    p_user_address TEXT,
    p_channel_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM shout_muted_users
        WHERE user_address = LOWER(p_user_address)
        AND (channel_id = p_channel_id OR (p_channel_id IS NULL AND channel_id IS NULL))
        AND is_active = true
        AND (muted_until IS NULL OR muted_until > NOW())
    );
END;
$$ LANGUAGE plpgsql;
```

### Check If User Is Moderator

```sql
CREATE OR REPLACE FUNCTION is_user_moderator(
    p_user_address TEXT,
    p_channel_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if global admin first
    IF EXISTS (SELECT 1 FROM shout_admins WHERE wallet_address = LOWER(p_user_address)) THEN
        RETURN true;
    END IF;
    
    -- Check moderator table
    RETURN EXISTS (
        SELECT 1 FROM shout_moderators
        WHERE user_address = LOWER(p_user_address)
        AND (channel_id = p_channel_id OR (p_channel_id IS NULL AND channel_id IS NULL))
    );
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
-- Enable realtime for key tables
ALTER PUBLICATION spritz_realtime ADD TABLE shout_agents;
ALTER PUBLICATION spritz_realtime ADD TABLE shout_streams;
ALTER PUBLICATION spritz_realtime ADD TABLE shout_groups;
ALTER PUBLICATION spritz_realtime ADD TABLE shout_group_members;
ALTER PUBLICATION spritz_realtime ADD TABLE shout_channel_messages;
ALTER PUBLICATION spritz_realtime ADD TABLE shout_moderators;
ALTER PUBLICATION spritz_realtime ADD TABLE shout_muted_users;
```

## Migration Scripts

All migration scripts are located in `/migrations` directory:

### Core Tables
- `agents.sql` - Agent configurations and chat history
- `agents_x402.sql` - x402 payment fields
- `agents_mcp.sql` - MCP server configuration
- `agents_tags.sql` - Tags for discovery
- `agents_api_tools.sql` - Custom API tools
- `embeddings.sql` - Vector search setup (pgvector)
- `favorite_agents.sql` - Agent favorites
- `044_agent_avatar.sql` - Custom agent avatar uploads

### Profile
- `042_profile_widgets.sql` - Bento-style profile widgets
- `043_custom_avatar.sql` - Custom profile avatar uploads

### Communication
- `group_chats.sql` - Group chat tables
- `public_channels.sql` - Public channels system
- `chat_enhancements.sql` - Typing status, read receipts, reactions
- `channel_chat_enhancements.sql` - Channel reactions
- `pinned_messages.sql` - Admin pinned messages in channels
- `043_chat_folders.sql` - Chat folder organization

### Streaming & Calls
- `call_history.sql` - Voice/video call history
- `permanent_rooms.sql` - Permanent meeting rooms
- `instant_rooms.sql` - Instant meeting rooms

### Authentication
- `passkey_credentials.sql` - WebAuthn/passkey storage
- `email_login.sql` - Email login verification

### Scheduling
- `google_calendar.sql` - Calendar connections and availability
- `scheduling_links.sql` - Shareable scheduling links
- `scheduling_settings.sql` - User scheduling preferences

### User Management
- `user_analytics.sql` - User activity tracking
- `friend_tags.sql` - Friend organization tags
- `bug_reports.sql` - Bug report system
- `admin_system.sql` - Admin functionality

### Wallet & Analytics
- `042_wallet_analytics.sql` - Wallet transaction tracking

### Moderation
- `041_moderation_system.sql` - Moderators, muted users, and audit log

### Usernames
- `045_usernames.sql` - Username claims and reserved name validation

See the repository's `/migrations` folder for complete migration scripts.




---
title: SDK & TypeScript Types
description: TypeScript types and client utilities for integrating with the Spritz API. Build type-safe applications with full IDE support.
keywords:
    [
        Spritz SDK,
        TypeScript types,
        API client,
        type definitions,
        integration,
    ]
sidebar_label: SDK & Types
sidebar_position: 2
---

# SDK & TypeScript Types

This guide provides TypeScript types and a reference client implementation for integrating with the Spritz API.

:::info SDK Status
An official SDK is planned for a future release. Track progress on the [GitHub repository](https://github.com/Spritz-Labs/spritz/issues). In the meantime, use the types and patterns below for type-safe integration with the Spritz API.
:::

## Installation

No package installation required. Copy the types and utilities you need into your project.

## Core Types

### API Response Types

```typescript
// types/spritz-api.ts

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    retryAfter?: number;
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}
```

### User Types

```typescript
// types/user.ts

export interface User {
    id: string;
    wallet_address: string;
    username?: string;
    created_at: string;
    last_login?: string;
    is_admin: boolean;
    beta_access: boolean;
}

export interface UserProfile {
    wallet_address: string;
    username?: string;
    bio?: string;
    status?: string;
    avatar_url?: string;
    ens_name?: string;
    social_links?: SocialLinks;
    public_profile_enabled: boolean;
}

export interface SocialLinks {
    twitter?: string;
    farcaster?: string;
    lens?: string;
    discord?: string;
    github?: string;
}

export type AuthMethod = 
    | 'wallet' 
    | 'passkey' 
    | 'email' 
    | 'worldid' 
    | 'alien' 
    | 'solana';

export interface Session {
    address: string;
    authMethod: AuthMethod;
    chainId?: number;
    passkeyCredentialId?: string;
    iat: number;
    exp: number;
}
```

### Agent Types

```typescript
// types/agent.ts

export interface Agent {
    id: string;
    owner_address: string;
    name: string;
    personality: string;
    system_instructions?: string;
    model: GeminiModel;
    avatar_emoji: string;
    avatar_url?: string;
    visibility: AgentVisibility;
    web_search_enabled: boolean;
    use_knowledge_base: boolean;
    message_count: number;
    tags: string[];
    x402_enabled: boolean;
    x402_price_cents?: number;
    x402_network?: string;
    x402_wallet_address?: string;
    mcp_servers: McpServer[];
    api_tools: ApiTool[];
    created_at: string;
    updated_at: string;
}

export type AgentVisibility = 'private' | 'friends' | 'public';

// Currently only gemini-2.0-flash is supported
export type GeminiModel = 'gemini-2.0-flash';

export interface McpServer {
    name: string;
    url: string;
    headers?: Record<string, string>;
}

export interface ApiTool {
    name: string;
    description: string;
    baseUrl: string;
    endpoints: ApiEndpoint[];
    headers?: Record<string, string>;
}

export interface ApiEndpoint {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    parameters?: Record<string, ParameterDefinition>;
}

export interface ParameterDefinition {
    type: 'string' | 'number' | 'boolean';
    required?: boolean;
    default?: string | number | boolean;
    description?: string;
}

export interface AgentKnowledge {
    id: string;
    agent_id: string;
    title: string;
    url: string;
    content_type: 'webpage' | 'github' | 'docs';
    status: 'pending' | 'processing' | 'indexed' | 'failed';
    error_message?: string;
    chunk_count: number;
    created_at: string;
    indexed_at?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface ChatResponse {
    success: boolean;
    sessionId: string;
    message: string;
    agent: {
        id: string;
        name: string;
        emoji: string;
    };
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface CreateAgentRequest {
    userAddress: string;
    name: string;
    personality: string;
    system_instructions?: string;
    model?: GeminiModel;
    avatar_emoji?: string;
    visibility?: AgentVisibility;
    web_search_enabled?: boolean;
    use_knowledge_base?: boolean;
    tags?: string[];
}
```

### Stream Types

```typescript
// types/stream.ts

export interface Stream {
    id: string;
    user_address: string;
    stream_id: string;
    stream_key: string;
    playback_id: string;
    title?: string;
    description?: string;
    status: StreamStatus;
    viewer_count: number;
    started_at?: string;
    ended_at?: string;
    created_at: string;
    playback_url: string;
    rtmp_url: string;
}

export type StreamStatus = 'idle' | 'live' | 'ended';

export interface StreamAsset {
    id: string;
    playback_id: string;
    playback_url: string;
    download_url?: string;
    status: {
        phase: 'waiting' | 'processing' | 'ready' | 'failed';
        progress?: number;
    };
    duration_seconds?: number;
    size_bytes?: number;
    created_at: string;
}

export interface CreateStreamRequest {
    userAddress: string;
    title?: string;
    description?: string;
}
```

### Channel Types

```typescript
// types/channel.ts

export interface Channel {
    id: string;
    name: string;
    description?: string;
    emoji: string;
    category: string;
    creator_address?: string;
    is_official: boolean;
    member_count: number;
    message_count: number;
    is_active: boolean;
    created_at: string;
}

export interface ChannelMessage {
    id: string;
    channel_id: string;
    sender_address: string;
    content: string;
    message_type: 'text' | 'image' | 'system';
    is_pinned: boolean;
    pinned_by?: string;
    pinned_at?: string;
    created_at: string;
}

export interface ChannelMember {
    id: string;
    channel_id: string;
    user_address: string;
    joined_at: string;
    notifications_muted: boolean;
}
```

### Room & Call Types

```typescript
// types/room.ts

export interface Room {
    id: string;
    code: string;
    creator_address: string;
    title?: string;
    type: 'instant' | 'permanent';
    huddle_room_id: string;
    created_at: string;
    expires_at?: string;
}

export interface CallHistory {
    id: string;
    caller_address: string;
    callee_address: string;
    call_type: 'audio' | 'video';
    status: 'completed' | 'missed' | 'declined' | 'failed';
    started_at: string;
    ended_at?: string;
    duration_seconds: number;
}
```

## API Client

### Base Client

```typescript
// lib/spritz-client.ts

export class SpritzApiError extends Error {
    constructor(
        public code: string,
        message: string,
        public retryAfter?: number
    ) {
        super(message);
        this.name = 'SpritzApiError';
    }
}

export class SpritzClient {
    private baseUrl: string;

    constructor(baseUrl = 'https://app.spritz.chat/api') {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            const error = data.error || { code: 'UNKNOWN', message: 'Unknown error' };
            throw new SpritzApiError(
                error.code,
                error.message,
                error.retryAfter
            );
        }

        return data;
    }

    // ==================
    // Agent Methods
    // ==================

    async listAgents(params?: {
        userAddress?: string;
        visibility?: AgentVisibility;
        limit?: number;
    }): Promise<{ agents: Agent[] }> {
        const searchParams = new URLSearchParams();
        if (params?.userAddress) searchParams.set('userAddress', params.userAddress);
        if (params?.visibility) searchParams.set('visibility', params.visibility);
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        
        return this.request(`/agents?${searchParams}`);
    }

    async getAgent(id: string): Promise<{ agent: Agent }> {
        return this.request(`/agents/${id}`);
    }

    async createAgent(data: CreateAgentRequest): Promise<{ agent: Agent }> {
        return this.request('/agents', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteAgent(id: string): Promise<{ success: boolean }> {
        return this.request(`/agents/${id}`, { method: 'DELETE' });
    }

    async chatWithAgent(
        agentId: string,
        message: string,
        sessionId?: string
    ): Promise<ChatResponse> {
        return this.request(`/agents/${agentId}/chat`, {
            method: 'POST',
            body: JSON.stringify({ message, sessionId }),
        });
    }

    async getChatHistory(
        agentId: string,
        sessionId: string,
        limit = 20
    ): Promise<{ messages: ChatMessage[] }> {
        return this.request(
            `/agents/${agentId}/chat?sessionId=${sessionId}&limit=${limit}`
        );
    }

    async discoverAgents(params?: {
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{ agents: Agent[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.tags) searchParams.set('tags', params.tags.join(','));
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.offset) searchParams.set('offset', params.offset.toString());
        
        return this.request(`/agents/discover?${searchParams}`);
    }

    // ==================
    // Stream Methods
    // ==================

    async listStreams(params?: {
        userAddress?: string;
        live?: boolean;
        limit?: number;
    }): Promise<{ streams: Stream[] }> {
        const searchParams = new URLSearchParams();
        if (params?.userAddress) searchParams.set('userAddress', params.userAddress);
        if (params?.live !== undefined) searchParams.set('live', params.live.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        
        return this.request(`/streams?${searchParams}`);
    }

    async createStream(data: CreateStreamRequest): Promise<{ stream: Stream }> {
        return this.request('/streams', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getStream(id: string): Promise<{ stream: Stream }> {
        return this.request(`/streams/${id}`);
    }

    async deleteStream(id: string): Promise<{ success: boolean }> {
        return this.request(`/streams/${id}`, { method: 'DELETE' });
    }

    async getStreamAssets(streamId: string): Promise<{ assets: StreamAsset[] }> {
        return this.request(`/streams/${streamId}/assets`);
    }

    // ==================
    // Channel Methods
    // ==================

    async listChannels(params?: {
        category?: string;
        userAddress?: string;
        joined?: boolean;
    }): Promise<{ channels: Channel[] }> {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.set('category', params.category);
        if (params?.userAddress) searchParams.set('userAddress', params.userAddress);
        if (params?.joined !== undefined) searchParams.set('joined', params.joined.toString());
        
        return this.request(`/channels?${searchParams}`);
    }

    async joinChannel(channelId: string, userAddress: string): Promise<{ success: boolean }> {
        return this.request(`/channels/${channelId}/join`, {
            method: 'POST',
            body: JSON.stringify({ userAddress }),
        });
    }

    async leaveChannel(channelId: string, userAddress: string): Promise<{ success: boolean }> {
        return this.request(`/channels/${channelId}/leave`, {
            method: 'POST',
            body: JSON.stringify({ userAddress }),
        });
    }

    async getChannelMessages(
        channelId: string,
        limit = 50
    ): Promise<{ messages: ChannelMessage[] }> {
        return this.request(`/channels/${channelId}/messages?limit=${limit}`);
    }

    async sendChannelMessage(
        channelId: string,
        userAddress: string,
        content: string
    ): Promise<{ message: ChannelMessage }> {
        return this.request(`/channels/${channelId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ userAddress, content, type: 'text' }),
        });
    }

    // ==================
    // Room Methods
    // ==================

    async createRoom(data: {
        type: 'instant' | 'permanent';
        title?: string;
    }): Promise<{ room: Room }> {
        return this.request('/rooms', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getRoom(code: string): Promise<{ room: Room }> {
        return this.request(`/rooms/${code}`);
    }

    async getRoomToken(
        code: string,
        userAddress: string
    ): Promise<{ token: string }> {
        return this.request(`/rooms/${code}/token`, {
            method: 'POST',
            body: JSON.stringify({ userAddress }),
        });
    }

    // ==================
    // User Methods
    // ==================

    async getPublicUser(address: string): Promise<{ user: UserProfile }> {
        return this.request(`/public/user?address=${address}`);
    }

    async getUsername(address: string): Promise<{ username: string | null }> {
        return this.request(`/username?address=${address}`);
    }

    async claimUsername(
        address: string,
        username: string
    ): Promise<{ success: boolean }> {
        return this.request('/username', {
            method: 'POST',
            body: JSON.stringify({ address, username }),
        });
    }
}
```

## Usage Examples

### Basic Usage

```typescript
import { SpritzClient, SpritzApiError } from './lib/spritz-client';
import type { Agent, ChatResponse } from './types/agent';

const client = new SpritzClient();

// List public agents
async function getPublicAgents(): Promise<Agent[]> {
    try {
        const { agents } = await client.listAgents({ visibility: 'public' });
        return agents;
    } catch (error) {
        if (error instanceof SpritzApiError) {
            console.error(`API Error: ${error.code} - ${error.message}`);
            if (error.retryAfter) {
                console.log(`Retry after ${error.retryAfter} seconds`);
            }
        }
        throw error;
    }
}

// Chat with an agent
async function chat(agentId: string, message: string): Promise<ChatResponse> {
    return client.chatWithAgent(agentId, message);
}
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { SpritzClient, SpritzApiError } from './lib/spritz-client';
import type { Agent, ChatMessage, ChatResponse } from './types/agent';

const client = new SpritzClient();

export function useAgentChat(agentId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        setIsLoading(true);
        setError(null);

        // Add user message immediately
        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await client.chatWithAgent(
                agentId,
                content,
                sessionId ?? undefined
            );

            // Store session ID for conversation continuity
            if (!sessionId) {
                setSessionId(response.sessionId);
            }

            // Add assistant message
            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: response.message,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            return response;
        } catch (err) {
            if (err instanceof SpritzApiError) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [agentId, sessionId]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setSessionId(null);
        setError(null);
    }, []);

    return {
        messages,
        sendMessage,
        clearChat,
        isLoading,
        error,
        sessionId,
    };
}
```

### Error Handling

```typescript
import { SpritzApiError } from './lib/spritz-client';

async function handleApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
    try {
        return await apiCall();
    } catch (error) {
        if (error instanceof SpritzApiError) {
            switch (error.code) {
                case 'UNAUTHORIZED':
                case 'SESSION_EXPIRED':
                    // Redirect to login
                    window.location.href = '/login';
                    break;
                    
                case 'RATE_LIMIT_EXCEEDED':
                    // Wait and retry
                    if (error.retryAfter) {
                        await new Promise(r => 
                            setTimeout(r, error.retryAfter! * 1000)
                        );
                        return handleApiCall(apiCall);
                    }
                    break;
                    
                case 'NOT_FOUND':
                    console.error('Resource not found');
                    break;
                    
                default:
                    console.error(`API Error: ${error.message}`);
            }
        }
        return null;
    }
}
```

## x402 Payment Integration

For agents with x402 enabled, use the `x402-fetch` wrapper:

```typescript
import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Setup wallet client
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
});

// Wrap fetch with x402 payment handling
const fetchWithPay = wrapFetchWithPayment(fetch, walletClient);

// Make paid request to agent
async function chatWithPaidAgent(agentId: string, message: string) {
    const response = await fetchWithPay(
        `https://app.spritz.chat/api/public/agents/${agentId}/chat`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        }
    );
    
    return response.json();
}
```

## Type Generation

To generate types from your Spritz database schema:

```bash
# If using Supabase CLI
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

## Next Steps

- [API Reference](/docs/api/intro) - Complete endpoint documentation
- [Error Codes](/docs/api/error-codes) - Error handling reference
- [Authentication](/docs/developers/authentication) - Auth implementation details

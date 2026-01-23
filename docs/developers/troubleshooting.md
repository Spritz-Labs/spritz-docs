---
title: Troubleshooting Guide
description: Common issues and solutions when developing with Spritz. Debug authentication, database, messaging, and deployment problems.
keywords:
    [
        Spritz troubleshooting,
        debugging,
        common issues,
        error solutions,
        development problems,
    ]
sidebar_label: Troubleshooting
sidebar_position: 3
---

# Troubleshooting Guide

This guide covers common issues and solutions when developing with Spritz.

## Authentication Issues

### "Session not found" or "Unauthorized" Errors

**Symptoms:**
- API returns 401 Unauthorized
- User appears logged out unexpectedly
- Actions fail with session errors

**Solutions:**

1. **Check credentials mode in fetch requests:**
```typescript
// ❌ Wrong - cookies won't be sent
fetch('/api/agents');

// ✅ Correct - include credentials
fetch('/api/agents', { credentials: 'include' });
```

2. **Verify cookie domain settings:**
```typescript
// In your auth verification, ensure cookies are set correctly
cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
});
```

3. **Check session expiration:**
```typescript
// Sessions expire after 7 days by default
// Check JWT expiration
import { jwtVerify } from 'jose';

const { payload } = await jwtVerify(token, secretKey);
if (payload.exp && payload.exp < Date.now() / 1000) {
    console.log('Session expired');
}
```

### Passkey Authentication Fails

**Symptoms:**
- "Passkey not found" error
- WebAuthn assertion fails
- Cross-device authentication issues

**Solutions:**

1. **Verify origin matches:**
```typescript
// Origin must match exactly
const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL;
const { origin } = new URL(clientData.origin);

if (origin !== expectedOrigin) {
    throw new Error(`Origin mismatch: ${origin} !== ${expectedOrigin}`);
}
```

2. **Check RP ID configuration:**
```typescript
// RP ID should be the domain without protocol
const rpId = 'spritz.chat'; // Not 'https://spritz.chat'
```

3. **Handle cross-device passkeys:**
```typescript
// Some passkeys are device-bound, others are synced
// Check the authenticator flags
const isDeviceBound = !(flags & 0x01); // UP flag check
```

### SIWE Signature Verification Fails

**Symptoms:**
- "Invalid signature" error
- Nonce mismatch
- Message format errors

**Solutions:**

1. **Verify message format:**
```typescript
import { SiweMessage } from 'siwe';

// Ensure message is prepared correctly
const message = new SiweMessage({
    domain: window.location.host,
    address: address,
    statement: 'Sign in to Spritz',
    uri: window.location.origin,
    version: '1',
    chainId: 8453,
    nonce: nonce,
});

// Use prepareMessage() not toString()
const messageToSign = message.prepareMessage();
```

2. **Check nonce validity:**
```typescript
// Nonce is returned with the SIWE message from the server
// and must be used within 5 minutes
const { message, nonce } = await fetch(`/api/auth/verify?address=${address}`).then(r => r.json());

// The nonce is already embedded in the message
// Just sign and submit within the validity window
```

---

## Database Issues

### "Relation does not exist" Error

**Symptoms:**
- `ERROR: relation "table_name" does not exist`
- Queries fail after deployment
- Missing tables or columns

**Solutions:**

1. **Run migrations in order:**
```bash
# Migrations must be run alphabetically
ls -1 migrations/*.sql | sort | while read f; do
    psql -d spritz -f "$f"
done
```

2. **Check for missing dependencies:**
```sql
-- Some tables depend on others
-- Run core tables first:
-- 1. agents.sql
-- 2. embeddings.sql
-- Then dependent tables:
-- 3. agents_x402.sql (requires agents)
```

3. **Verify schema:**
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'your_table'
);
```

### Vector Search Not Working

**Symptoms:**
- RAG returns no results
- Similarity search fails
- `pgvector` extension errors

**Solutions:**

1. **Enable pgvector extension:**
```sql
-- Must be enabled before creating vector columns
CREATE EXTENSION IF NOT EXISTS vector;
```

2. **Check embedding dimensions:**
```sql
-- Gemini embeddings are 768 dimensions
ALTER TABLE embeddings 
ALTER COLUMN embedding TYPE vector(768);
```

3. **Create index for performance:**
```sql
-- Use IVFFlat for larger datasets
CREATE INDEX ON embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### RLS Policy Blocks Access

**Symptoms:**
- Queries return empty results
- "Permission denied" errors
- Data visible in admin but not API

**Solutions:**

1. **Check RLS is enabled:**
```sql
-- Verify RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

2. **Debug policy evaluation:**
```sql
-- Temporarily check what user sees
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user_address';
SELECT * FROM agents; -- See what RLS allows
RESET ROLE;
```

3. **Common policy pattern:**
```sql
-- Ensure policy covers your use case
CREATE POLICY "Users can view own agents"
ON agents FOR SELECT
USING (owner_address = auth.jwt() ->> 'sub');
```

---

## Messaging Issues

### Logos Messaging (Waku) - Messages Not Delivering

:::info Terminology
Spritz uses [Logos Messaging](https://logos.co/tech-stack) (built on the Waku protocol) for decentralized peer-to-peer messaging. In code, you may see references to `@waku/sdk` as Logos Messaging uses Waku under the hood.
:::

**Symptoms:**
- Messages sent but not received
- Intermittent message loss
- High latency

**Solutions:**

1. **Check content topic format:**
```typescript
// Content topics must follow the format
const contentTopic = `/spritz/1/dm-${sortedAddresses}/proto`;

// Addresses must be sorted consistently
const sortedAddresses = [addr1, addr2].sort().join('-');
```

2. **Verify peer connections:**
```typescript
import { waitForRemotePeer, Protocols } from '@waku/sdk';

// Wait for peers before sending
await waitForRemotePeer(node, [
    Protocols.Filter,
    Protocols.LightPush,
]);

console.log('Connected peers:', node.libp2p.getPeers().length);
```

3. **Handle message encoding:**
```typescript
// Messages must be properly encoded
const encoder = createEncoder({
    contentTopic,
    pubsubTopic: '/waku/2/default-waku/proto',
});

const payload = proto.Message.encode({
    content: message,
    timestamp: Date.now(),
    sender: address,
}).finish();
```

### Realtime Subscriptions Not Working

**Symptoms:**
- Supabase realtime events not firing
- Channel joins fail
- Updates not reflected in UI

**Solutions:**

1. **Enable realtime for table:**
```sql
-- In Supabase dashboard or via SQL
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
```

2. **Check channel subscription:**
```typescript
const channel = supabase
    .channel('room1')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
            console.log('Change received:', payload);
        }
    )
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log('Subscribed!');
        }
    });
```

3. **Verify RLS allows subscription:**
```sql
-- RLS policies also apply to realtime
-- Ensure SELECT policy exists
CREATE POLICY "Allow reading messages"
ON messages FOR SELECT
USING (true); -- Or your specific condition
```

---

## Video Call Issues

### Huddle01 Room Creation Fails

**Symptoms:**
- "Invalid API key" error
- Room creation returns null
- Token generation fails

**Solutions:**

1. **Check environment variables:**
```bash
# Required variables
HUDDLE01_API_KEY=your_api_key
HUDDLE01_PROJECT_ID=your_project_id
```

2. **Verify API key scope:**
```typescript
// API key must have room creation permissions
const response = await fetch('https://api.huddle01.com/api/v1/create-room', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.HUDDLE01_API_KEY,
    },
    body: JSON.stringify({
        title: roomTitle,
        roomLocked: false,
    }),
});

if (!response.ok) {
    const error = await response.json();
    console.error('Huddle01 error:', error);
}
```

3. **Handle rate limits:**
```typescript
// Huddle01 has rate limits
// Implement exponential backoff
const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
await new Promise(r => setTimeout(r, delay));
```

### Screen Sharing Not Working

**Symptoms:**
- Screen share button disabled
- "NotAllowedError" in console
- Black screen on share

**Solutions:**

1. **Check HTTPS:**
```typescript
// Screen sharing requires secure context
if (!window.isSecureContext) {
    console.error('Screen sharing requires HTTPS');
}
```

2. **Handle permissions:**
```typescript
try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
    });
} catch (err) {
    if (err.name === 'NotAllowedError') {
        // User denied permission
    } else if (err.name === 'NotFoundError') {
        // No screen sharing available
    }
}
```

---

## Deployment Issues

### Build Fails with Type Errors

**Symptoms:**
- `tsc` reports errors
- Import resolution fails
- Module not found

**Solutions:**

1. **Check TypeScript version:**
```json
{
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

2. **Verify path aliases:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

3. **Clear cache and rebuild:**
```bash
rm -rf .next node_modules/.cache
npm run build
```

### Environment Variables Not Loading

**Symptoms:**
- `undefined` for env vars
- Different behavior in dev vs prod
- Client-side vars not available

**Solutions:**

1. **Use correct prefix:**
```bash
# Server-side only
DATABASE_URL=postgres://...

# Available in browser (Next.js)
NEXT_PUBLIC_APP_URL=https://app.spritz.chat
```

2. **Check .env file location:**
```
project/
├── .env.local        # Local overrides (gitignored)
├── .env.development  # Dev defaults
├── .env.production   # Prod defaults
└── .env              # Shared defaults
```

3. **Verify in runtime:**
```typescript
// Debug env loading
console.log('Env check:', {
    hasDbUrl: !!process.env.DATABASE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
});
```

---

## Performance Issues

### Slow API Responses

**Symptoms:**
- Requests take > 1 second
- Timeouts on complex queries
- High database CPU

**Solutions:**

1. **Add database indexes:**
```sql
-- Index frequently queried columns
CREATE INDEX idx_agents_owner ON agents(owner_address);
CREATE INDEX idx_messages_channel ON channel_messages(channel_id);
CREATE INDEX idx_messages_created ON channel_messages(created_at DESC);
```

2. **Use pagination:**
```typescript
// Don't fetch all records
const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .range(0, 49); // Fetch 50 at a time
```

3. **Enable connection pooling:**
```typescript
// Use connection string with pooler
const connectionString = process.env.DATABASE_URL; // Should include ?pgbouncer=true
```

### Memory Leaks in Development

**Symptoms:**
- Node process grows continuously
- Browser tab becomes slow
- "JavaScript heap out of memory"

**Solutions:**

1. **Clean up subscriptions:**
```typescript
useEffect(() => {
    const channel = supabase.channel('updates');
    
    return () => {
        supabase.removeChannel(channel);
    };
}, []);
```

2. **Unsubscribe from Waku:**
```typescript
useEffect(() => {
    const unsubscribe = node.filter.subscribe(/* ... */);
    
    return () => {
        unsubscribe();
    };
}, []);
```

---

## Common Error Code Reference

For a complete list of API error codes and their meanings, see the [Error Codes Reference](/docs/api/error-codes).

| HTTP Status | Common Cause | Quick Fix |
|-------------|--------------|-----------|
| **401** | Session expired or missing credentials | Ensure `credentials: 'include'` in fetch |
| **402** | x402 payment required | Provide valid X-Payment header |
| **403** | Access denied / RLS policy | Check permissions and ownership |
| **404** | Resource not found | Verify ID exists and is accessible |
| **429** | Rate limit exceeded | Implement exponential backoff |
| **500** | Server error | Check logs and retry |

## Getting Help

If your issue isn't covered here:

1. **Check the [FAQ](/docs/faq)** for common questions
2. **Review [Error Codes](/docs/api/error-codes)** for API errors
3. **Search existing issues** on GitHub
4. **Join the community** channels for support

When reporting issues, include:
- Error message and stack trace
- Steps to reproduce
- Environment (OS, Node version, browser)
- Relevant code snippets

---
title: Messaging (Logos)
description: Deep dive into Spritz decentralized messaging powered by Logos Messaging (Waku). Learn about P2P messaging, encryption, content topics, and message persistence.
keywords:
    [
        messaging,
        Logos Messaging,
        Waku,
        P2P,
        decentralized,
        encryption,
        WebSocket,
        light node,
    ]
sidebar_label: Messaging
sidebar_position: 4
---

# Messaging (Logos)

Spritz uses [Logos Messaging](https://logos.co/tech-stack) (powered by Waku) for decentralized, censorship-resistant messaging. Messages are transmitted peer-to-peer with end-to-end encryption.

## Overview

### Architecture

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   User A    │◄─────▶│  Waku P2P   │◄─────▶│   User B    │
│ Light Node  │       │   Network   │       │ Light Node  │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │              ┌──────┴──────┐             │
       │              │  Bootstrap  │             │
       │              │    Nodes    │             │
       │              └─────────────┘             │
       │                                          │
       │              ┌─────────────┐             │
       └─────────────▶│  PostgreSQL │◄────────────┘
                      │  (Backup)   │
                      └─────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Light Node** | Browser-based Waku node (no full relay) |
| **Content Topic** | Channel identifier for message routing |
| **LightPush** | Protocol for sending messages |
| **Filter** | Protocol for receiving messages |
| **Store** | Protocol for retrieving historical messages |
| **Symmetric Encryption** | AES-GCM for message content |

---

## Protocols Used

### LightPush

Sends messages to the network via relay nodes:

```
User Browser ──LightPush──▶ Relay Node ──▶ Network
```

### Filter

Subscribes to messages from the network:

```
Network ──▶ Relay Node ──Filter──▶ User Browser
```

### Store

Retrieves historical messages:

```
User Browser ──Store Query──▶ Store Node ──▶ Historical Messages
```

---

## Message Format

Messages use Protocol Buffers for efficient serialization:

```typescript
import protobuf from "protobufjs";

const MessageProto = new protobuf.Type("ChatMessage")
    .add(new protobuf.Field("timestamp", 1, "uint64"))
    .add(new protobuf.Field("sender", 2, "string"))
    .add(new protobuf.Field("content", 3, "string"))
    .add(new protobuf.Field("messageId", 4, "string"))
    .add(new protobuf.Field("messageType", 5, "string")); // text, pixel_art, system

// Example message
const message = {
    timestamp: Date.now(),
    sender: "0x1234...".toLowerCase(),
    content: "Hello!",
    messageId: "1234567890-abc123def",
    messageType: "text",
};
```

---

## Content Topics

Content topics route messages to the right conversations.

### DM Topics

```typescript
function getDmContentTopic(address1: string, address2: string): string {
    // Sort addresses for deterministic topic (both users get same topic)
    const sorted = [address1.toLowerCase(), address2.toLowerCase()].sort();
    return `/spritz/1/dm/${sorted[0]}-${sorted[1]}/proto`;
}

// Example: /spritz/1/dm/0x1234...-0xabcd.../proto
```

### Group Topics

```typescript
function getGroupContentTopic(groupId: string): string {
    return `/spritz/1/group/${groupId}/proto`;
}

// Example: /spritz/1/group/g-1234567890-abc123/proto
```

---

## Encryption

All messages are encrypted with AES-GCM symmetric encryption.

### Key Derivation (DMs)

Both users derive the **same key** from their addresses:

```typescript
async function getDmSymmetricKey(
    userAddress: string,
    peerAddress: string
): Promise<Uint8Array> {
    // Sort for determinism
    const sorted = [userAddress.toLowerCase(), peerAddress.toLowerCase()].sort();
    
    // Create deterministic seed
    const seed = `spritz-dm-key-v1:${sorted[0]}:${sorted[1]}`;
    const encoder = new TextEncoder();
    const seedBytes = encoder.encode(seed);
    
    // Derive 256-bit key via SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", seedBytes);
    return new Uint8Array(hashBuffer);
}
```

### Key Generation (Groups)

Groups use randomly generated symmetric keys:

```typescript
import { generateSymmetricKey } from "@waku/message-encryption/symmetric";
import { bytesToHex } from "@waku/utils/bytes";

// Generate random 256-bit key
const symmetricKey = generateSymmetricKey();
const keyHex = bytesToHex(symmetricKey);

// Store with group metadata
const group = {
    id: groupId,
    name: "My Group",
    members: [...],
    symmetricKey: keyHex, // Share with members
};
```

### Message Encryption

```typescript
import { createEncoder } from "@waku/message-encryption/symmetric";

const encoder = createEncoder({
    contentTopic: "/spritz/1/dm/0x123...-0xabc.../proto",
    routingInfo,
    symKey: symmetricKey, // 32-byte Uint8Array
});

// Encrypt and send
await node.lightPush.send(encoder, {
    payload: MessageProto.encode(message).finish(),
});
```

### Message Decryption

```typescript
import { createDecoder } from "@waku/message-encryption/symmetric";

const decoder = createDecoder(
    contentTopic,
    routingInfo,
    symmetricKey
);

// Automatically decrypts when receiving
await node.filter.subscribe(decoder, (wakuMessage) => {
    const payload = wakuMessage.payload; // Decrypted
    const message = MessageProto.decode(payload);
});
```

---

## Initializing Waku

### Creating a Light Node

```typescript
import { createLightNode, Protocols } from "@waku/sdk";

async function initializeWaku(): Promise<LightNode> {
    const node = await createLightNode({
        defaultBootstrap: true,
        networkConfig: {
            clusterId: 1, // The Waku network cluster
        },
    });

    await node.start();
    
    // Wait for peer connections
    await node.waitForPeers([
        Protocols.LightPush,
        Protocols.Filter,
    ]);
    
    return node;
}
```

### Connection with Timeout

```typescript
async function connectWithTimeout(timeoutMs: number = 30000): Promise<boolean> {
    const node = await createLightNode({
        defaultBootstrap: true,
        networkConfig: { clusterId: 1 },
    });

    await node.start();

    const peerPromise = node.waitForPeers([
        Protocols.LightPush,
        Protocols.Filter,
    ]);

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), timeoutMs)
    );

    await Promise.race([peerPromise, timeoutPromise]);
    return true;
}
```

---

## Sending Messages

### Direct Messages

```typescript
async function sendMessage(
    node: LightNode,
    userAddress: string,
    peerAddress: string,
    content: string
): Promise<{ success: boolean; messageId: string }> {
    const contentTopic = getDmContentTopic(userAddress, peerAddress);
    const symmetricKey = await getDmSymmetricKey(userAddress, peerAddress);
    
    // Create routing info for shard 0
    const routingInfo = StaticShardingRoutingInfo.fromShard(0, { clusterId: 1 });
    
    const encoder = createEncoder({
        contentTopic,
        routingInfo,
        symKey: symmetricKey,
    });

    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    const messageObj = MessageProto.create({
        timestamp: Date.now(),
        sender: userAddress.toLowerCase(),
        content,
        messageId,
        messageType: content.startsWith("[PIXEL_ART]") ? "pixel_art" : "text",
    });

    const payload = MessageProto.encode(messageObj).finish();
    
    await node.lightPush.send(encoder, { payload });
    
    return { success: true, messageId };
}
```

### Group Messages

```typescript
async function sendGroupMessage(
    node: LightNode,
    userAddress: string,
    groupId: string,
    symmetricKeyHex: string,
    content: string
): Promise<{ success: boolean; messageId: string }> {
    const contentTopic = getGroupContentTopic(groupId);
    const symmetricKey = hexToBytes(symmetricKeyHex);
    
    const routingInfo = StaticShardingRoutingInfo.fromShard(0, { clusterId: 1 });
    
    const encoder = createEncoder({
        contentTopic,
        routingInfo,
        symKey: symmetricKey,
    });

    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    const messageObj = MessageProto.create({
        timestamp: Date.now(),
        sender: userAddress.toLowerCase(),
        content,
        messageId,
        messageType: "text",
    });

    const payload = MessageProto.encode(messageObj).finish();
    
    await node.lightPush.send(encoder, { payload });
    
    return { success: true, messageId };
}
```

---

## Receiving Messages

### Real-time Subscription

```typescript
async function subscribeToMessages(
    node: LightNode,
    userAddress: string,
    peerAddress: string,
    onMessage: (message: ChatMessage) => void
): Promise<void> {
    const contentTopic = getDmContentTopic(userAddress, peerAddress);
    const symmetricKey = await getDmSymmetricKey(userAddress, peerAddress);
    
    const routingInfo = StaticShardingRoutingInfo.fromShard(0, { clusterId: 1 });
    
    const decoder = createDecoder(contentTopic, routingInfo, symmetricKey);

    await node.filter.subscribe(decoder, (wakuMessage) => {
        if (!wakuMessage.payload) return;
        
        try {
            const decoded = MessageProto.decode(wakuMessage.payload);
            const message = MessageProto.toObject(decoded);
            
            onMessage({
                id: message.messageId,
                content: message.content,
                senderInboxId: message.sender,
                sentAtNs: BigInt(message.timestamp) * BigInt(1000000),
                conversationId: contentTopic,
            });
        } catch (error) {
            console.error("Failed to decode message:", error);
        }
    });
}
```

### Fetching Historical Messages

```typescript
async function getMessageHistory(
    node: LightNode,
    userAddress: string,
    peerAddress: string
): Promise<ChatMessage[]> {
    const contentTopic = getDmContentTopic(userAddress, peerAddress);
    const symmetricKey = await getDmSymmetricKey(userAddress, peerAddress);
    
    const routingInfo = StaticShardingRoutingInfo.fromShard(0, { clusterId: 1 });
    const decoder = createDecoder(contentTopic, routingInfo, symmetricKey);

    const messages: ChatMessage[] = [];

    await node.store.queryWithOrderedCallback(
        [decoder],
        (wakuMessage) => {
            if (!wakuMessage.payload) return;
            
            const decoded = MessageProto.decode(wakuMessage.payload);
            const message = MessageProto.toObject(decoded);
            
            messages.push({
                id: message.messageId,
                content: message.content,
                senderInboxId: message.sender,
                sentAtNs: BigInt(message.timestamp) * BigInt(1000000),
            });
        }
    );

    return messages;
}
```

---

## Message Persistence (Database Backup)

For reliability, messages are also stored encrypted in the database.

### Encrypting for Storage

```typescript
async function encryptForStorage(
    content: string,
    symmetricKey: Uint8Array
): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        symmetricKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    // Random IV for each message
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        data
    );

    // Combine IV + ciphertext, encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
}
```

### Decrypting from Storage

```typescript
async function decryptFromStorage(
    encryptedBase64: string,
    symmetricKey: Uint8Array
): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        symmetricKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}
```

### Database Schema

```sql
CREATE TABLE shout_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    recipient_address TEXT,      -- NULL for group messages
    group_id TEXT,               -- NULL for DMs
    encrypted_content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    message_id TEXT UNIQUE NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON shout_messages(conversation_id);
CREATE INDEX idx_messages_sender ON shout_messages(sender_address);
CREATE INDEX idx_messages_recipient ON shout_messages(recipient_address);
```

---

## Group Chat Management

### Creating a Group

```typescript
async function createGroup(
    userAddress: string,
    memberAddresses: string[],
    groupName: string
): Promise<{ groupId: string; symmetricKey: string }> {
    const groupId = `g-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Generate random symmetric key
    const symmetricKey = generateSymmetricKey();
    const symmetricKeyHex = bytesToHex(symmetricKey);

    const allMembers = [
        userAddress.toLowerCase(),
        ...memberAddresses.map(a => a.toLowerCase()),
    ];

    // Save to database
    await db.from("shout_groups").insert({
        id: groupId,
        name: groupName,
        created_by: userAddress.toLowerCase(),
        symmetric_key: symmetricKeyHex,
    });

    // Add members
    const memberInserts = allMembers.map(addr => ({
        group_id: groupId,
        member_address: addr,
        role: addr === userAddress.toLowerCase() ? "admin" : "member",
    }));

    await db.from("shout_group_members").insert(memberInserts);

    return { groupId, symmetricKey: symmetricKeyHex };
}
```

### Inviting Members

```typescript
async function addGroupMembers(
    groupId: string,
    newMembers: string[]
): Promise<void> {
    const memberInserts = newMembers.map(addr => ({
        group_id: groupId,
        member_address: addr.toLowerCase(),
        role: "member",
    }));

    await db.from("shout_group_members").insert(memberInserts);
    
    // New members need the symmetric key to read messages
    // Key is shared via the invitation system
}
```

### Group Schema

```sql
CREATE TABLE shout_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    created_by TEXT NOT NULL,
    symmetric_key TEXT NOT NULL, -- Hex-encoded AES key
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shout_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id TEXT REFERENCES shout_groups(id),
    member_address TEXT NOT NULL,
    role TEXT DEFAULT 'member',  -- admin, member
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, member_address)
);
```

---

## Push Notifications

When messages arrive while the user is offline:

```typescript
// Server-side: Send push notification
async function notifyMessage(
    recipientAddress: string,
    senderAddress: string,
    content: string
): Promise<void> {
    await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            targetAddress: recipientAddress,
            senderAddress: senderAddress,
            title: "New Message",
            body: content.length > 100 ? content.slice(0, 100) + "..." : content,
            type: "message",
            url: "/",
        }),
    });
}
```

---

## Real-time Updates via Database

For reliability alongside P2P, messages trigger database subscriptions:

```typescript
// Subscribe to new messages for current user
const channel = supabase
    .channel("messages")
    .on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "shout_messages",
            filter: `recipient_address=eq.${userAddress.toLowerCase()}`,
        },
        (payload) => {
            const message = payload.new;
            // Handle new message (show notification, update UI)
        }
    )
    .subscribe();
```

---

## Unread Message Tracking

```typescript
// Mark messages as read
async function markAsRead(
    userAddress: string,
    messageIds: string[]
): Promise<void> {
    const inserts = messageIds.map(messageId => ({
        reader_address: userAddress.toLowerCase(),
        message_id: messageId,
        read_at: new Date().toISOString(),
    }));

    await db.from("shout_read_receipts").upsert(inserts);
}

// Get unread count per sender
async function getUnreadCounts(userAddress: string): Promise<Record<string, number>> {
    const { data: messages } = await db
        .from("shout_messages")
        .select("sender_address, message_id")
        .eq("recipient_address", userAddress.toLowerCase())
        .neq("sender_address", userAddress.toLowerCase());

    const { data: receipts } = await db
        .from("shout_read_receipts")
        .select("message_id")
        .eq("reader_address", userAddress.toLowerCase());

    const readIds = new Set(receipts?.map(r => r.message_id) || []);
    
    const counts: Record<string, number> = {};
    for (const msg of messages || []) {
        if (!readIds.has(msg.message_id)) {
            const sender = msg.sender_address.toLowerCase();
            counts[sender] = (counts[sender] || 0) + 1;
        }
    }
    
    return counts;
}
```

---

## Dependencies

```bash
npm install @waku/sdk @waku/message-encryption @waku/utils protobufjs
```

```typescript
// Required imports
import { createLightNode, Protocols } from "@waku/sdk";
import { createEncoder, createDecoder, generateSymmetricKey } from "@waku/message-encryption/symmetric";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";
import protobuf from "protobufjs";
```

---

## Next Steps

- [Video Calls](/docs/developers/video-calls) - Huddle01 integration
- [Livestreaming](/docs/developers/livestreaming) - Livepeer integration
- [API Reference](/docs/api/intro) - Complete API documentation

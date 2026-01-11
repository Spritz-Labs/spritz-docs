# Messaging Guide

Spritz uses the **Waku Protocol** for decentralized, peer-to-peer messaging with end-to-end encryption.

## Overview

Messaging in Spritz is fully decentralized:
- **No Central Server**: Messages are relayed through the Waku network
- **End-to-End Encrypted**: All messages are encrypted before transmission
- **Peer-to-Peer**: Direct communication between users
- **Censorship Resistant**: No single point of failure

## Types of Messaging

### Direct Messages

One-on-one conversations with friends:

1. Open the chat modal from a friend's profile
2. Type your message
3. Press Enter to send
4. Messages are encrypted and delivered via Waku

### Group Chats

Multi-person conversations:

1. Create a group from the Groups section
2. Invite friends to join
3. All members can send messages
4. Messages are encrypted for all group members

### Public Channels

Discoverable community channels:

1. Browse available channels
2. Join channels that interest you
3. Participate in public discussions
4. Leave channels anytime

### Voice Messages

Record and send voice notes:

1. Click the microphone icon in chat
2. Record your message
3. Send the audio file
4. Recipients can play it back

### Pixel Art

Create and share pixel art directly in chat:

1. Click the pixel art icon in chat
2. Use the 16x16 or 32x32 pixel editor
3. Choose colors from the palette
4. Create your design
5. Send to the chat

**Features:**
- Download any image by clicking the download button
- Share pixel art to social media with OG card previews
- Images are stored on IPFS via Pinata for decentralized hosting

### Image Sharing

Share images in any chat:

1. Click the image/attachment icon
2. Select an image from your device
3. Image is uploaded and shared
4. All images have a download button for easy saving

**Quick Share Actions:**

When viewing pixel art or images, use quick share buttons:
- **Share to X/Twitter**: Posts with automatic preview card
- **Copy Link**: Get a shareable URL with OG tags
- **More Options**: Share to Facebook, LinkedIn, Reddit, Telegram, WhatsApp
- **Download**: Save the image to your device

## Features

### Link Previews

When you share a URL, Spritz automatically generates a rich preview:
- Page title and description
- Preview image
- Domain information

### Message Status

Track message delivery:
- **Sending**: Message is being encrypted and sent
- **Sent**: Message delivered to Waku network
- **Delivered**: Message received by recipient
- **Read**: Message has been read (if enabled)

### Message Search

Search through your message history:
- Search by keyword
- Filter by date range
- Search across all conversations

## Technical Details

### Architecture Overview

Spritz uses a **bespoke implementation built directly on top of the Waku SDK** - not using any high-level "chat SDK". It's a custom messaging layer built from scratch using the core Waku protocols (part of the [Logos](https://logos.co/) technology stack).

### Waku Packages Used

```json
{
  "@waku/sdk": "^0.0.36",
  "@waku/message-encryption": "^0.0.38",
  "@waku/utils": "^0.0.27"
}
```

### Light Node Architecture

Spritz runs a Waku Light Node in the browser that connects to the Waku network:

```typescript
const node = await wakuSdk.createLightNode({
    defaultBootstrap: true,
    networkConfig: { clusterId: 1 },
});
await node.waitForPeers([Protocols.LightPush, Protocols.Filter]);
```

### Protocols Used

| Protocol | Purpose |
|----------|---------|
| **LightPush** | For sending messages to the network |
| **Filter** | For subscribing to real-time incoming messages |
| **Store** | For querying historical messages |

### Message Format

Custom Protobuf schema for messages:

```protobuf
message ChatMessage {
    uint64 timestamp = 1;
    string sender = 2;
    string content = 3;
    string messageId = 4;
    string messageType = 5;  // text, pixel_art, system
}
```

### Encryption

Uses **symmetric key encryption (AES-GCM)**:

- **DM keys** are derived deterministically from both wallet addresses using SHA-256
- **Group keys** are randomly generated and shared with members
- All messages are encrypted before being sent to Waku

### Content Topics

Deterministic topic naming for routing:

| Type | Topic Format |
|------|--------------|
| **DMs** | `/spritz/1/dm/{sorted-addresses}/proto` |
| **Groups** | `/spritz/1/group/{groupId}/proto` |

### Hybrid Persistence

Since Waku's Store protocol has limited retention, Spritz uses a hybrid approach:

| Layer | Purpose |
|-------|---------|
| **Waku Store** | Short-term message history from the P2P network |
| **Spritz Database** | Long-term encrypted message storage (messages are encrypted with the same symmetric key before storage) |
| **localStorage** | Offline cache for instant loading |

### Summary

> Spritz uses a bespoke implementation built directly on the Waku SDK (the low-level Logos messaging primitives). It's NOT using the newer "Waku Chat SDK" or any pre-built chat solution.
>
> The implementation uses:
> - Waku Light Node with LightPush, Filter, and Store protocols
> - Symmetric key encryption for all messages
> - Custom Protobuf message format
> - Hybrid persistence (Waku + Spritz Database) for reliable delivery
>
> This gives full control over the UX while leveraging Waku's decentralized, censorship-resistant message relay network.

## Best Practices

1. **Verify Identities**: Always verify you're messaging the right person
2. **Backup Keys**: Keep your encryption keys safe
3. **Respect Privacy**: Don't share private conversations
4. **Report Abuse**: Report inappropriate content
5. **Network Status**: Check Waku connection status

## Troubleshooting

### Messages Not Sending

- Check Waku connection status
- Verify recipient is online
- Check network connectivity
- Try refreshing the connection

### Messages Not Receiving

- Verify you're connected to Waku
- Check if sender is online
- Wait a few moments (network propagation delay)
- Refresh the chat

### Encryption Errors

- Verify your keys are valid
- Check for key synchronization issues
- Re-establish connection if needed

## API Reference

### Send Message

```typescript
POST /api/messages
{
  "to": "0x...",
  "content": "Hello!",
  "type": "text"
}
```

### Get Messages

```typescript
GET /api/messages?conversationId=...
```

### Search Messages

```typescript
GET /api/messages/search?query=keyword
```

## Next Steps

- Learn about [Video Calls](/docs/guides/video-calls)
- Explore [Groups](/docs/guides/groups)
- Check out [Channels](/docs/guides/channels)




# Messaging Guide

Spritz uses **[Logos Messaging](https://logos.co/tech-stack)** for decentralized, peer-to-peer messaging with end-to-end encryption.

## Overview

Messaging in Spritz is fully decentralized:
- **No Central Server**: Messages are relayed through the Logos Messaging network
- **End-to-End Encrypted**: All messages are encrypted before transmission
- **Peer-to-Peer**: Direct communication between users
- **Censorship Resistant**: No single point of failure

## Types of Messaging

### Direct Messages

One-on-one conversations with friends:

1. Open the chat modal from a friend's profile
2. Type your message
3. Press Enter to send
4. Messages are encrypted and delivered via Logos Messaging

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

## Chat Folders

Organize your conversations with Telegram-style emoji folders.

### Creating Folders

1. Click the folder icon in the chat header
2. Select an emoji for your folder (e.g., ⭐ for favorites, 💼 for work)
3. Optionally add a label
4. Your folder appears in the folder bar

### Assigning Chats to Folders

**Quick assign:**
1. Long-press or right-click any chat
2. Select "Add to folder"
3. Choose the target folder

**From folder menu:**
1. Click the folder button in the header
2. Select the folder to manage
3. Toggle chats on/off for that folder

### Default Folders

| Emoji | Suggested Use |
|-------|---------------|
| 📥 | All chats (default view) |
| ⭐ | Favorites / Important |
| 💼 | Work |
| 👨‍👩‍👧‍👦 | Family |
| 🎮 | Gaming |
| 🔔 | Unread |

### Folder Behavior

- Chats can belong to multiple folders
- Folders sync across devices via your account
- Removing a chat from a folder doesn't delete the chat
- Delete a folder by long-pressing it

## Features

### Link Previews

When you share a URL, Spritz automatically generates a rich preview:
- Page title and description
- Preview image
- Domain information

### Message Status

Track message delivery:
- **Sending**: Message is being encrypted and sent
- **Sent**: Message delivered to Logos Messaging network
- **Delivered**: Message received by recipient
- **Read**: Message has been read (if enabled)

### Message Search

Search through your message history:
- Search by keyword
- Filter by date range
- Search across all conversations

## Technical Details

### Architecture Overview

Spritz uses a **bespoke implementation built directly on top of the [Logos Messaging](https://logos.co/tech-stack) SDK** - not using any high-level "chat SDK". It's a custom messaging layer built from scratch using the core Logos Messaging protocols.

### Logos Messaging Packages Used

```json
{
  "@waku/sdk": "^0.0.36",
  "@waku/message-encryption": "^0.0.38",
  "@waku/utils": "^0.0.27"
}
```

### Light Node Architecture

Spritz runs a Logos Messaging Light Node in the browser that connects to the Logos Messaging network:

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

Uses **ECDH key exchange with AES-256-GCM encryption**:

- **DM keys** use ECDH (Elliptic Curve Diffie-Hellman) with P-256 curve
  - Each user generates a P-256 keypair
  - Shared secret derived via ECDH from peer's public key
  - This is more secure than deterministic keys—knowing addresses alone cannot derive the encryption key
- **Group keys** are randomly generated and shared with members
- All messages are encrypted before being sent to Logos Messaging

**Key Backup (Optional):**
- Keys stored locally by default for maximum security
- Opt-in cloud backup protected by 12-word phrase + 6-digit PIN
- PBKDF2 with 100,000 iterations for key derivation

### Content Topics

Deterministic topic naming for routing:

| Type | Topic Format |
|------|--------------|
| **DMs** | `/spritz/1/dm/{sorted-addresses}/proto` |
| **Groups** | `/spritz/1/group/{groupId}/proto` |

### Hybrid Persistence

Since Logos Messaging's Store protocol has limited retention, Spritz uses a hybrid approach:

| Layer | Purpose |
|-------|---------|
| **Logos Messaging Store** | Short-term message history from the P2P network |
| **Spritz Database** | Long-term encrypted message storage (messages are encrypted with the same symmetric key before storage) |
| **localStorage** | Offline cache for instant loading |

### Summary

> Spritz uses a bespoke implementation built directly on the [Logos Messaging](https://logos.co/tech-stack) SDK. It's NOT using any pre-built chat solution.
>
> The implementation uses:
> - Logos Messaging Light Node with LightPush, Filter, and Store protocols
> - Symmetric key encryption for all messages
> - Custom Protobuf message format
> - Hybrid persistence (Logos Messaging + Spritz Database) for reliable delivery
>
> This gives full control over the UX while leveraging Logos Messaging's decentralized, censorship-resistant message relay network.

## Best Practices

1. **Verify Identities**: Always verify you're messaging the right person
2. **Backup Keys**: Keep your encryption keys safe
3. **Respect Privacy**: Don't share private conversations
4. **Report Abuse**: Report inappropriate content
5. **Network Status**: Check Logos Messaging connection status

## Troubleshooting

### Messages Not Sending

- Check Logos Messaging connection status
- Verify recipient is online
- Check network connectivity
- Try refreshing the connection

### Messages Not Receiving

- Verify you're connected to Logos Messaging
- Check if sender is online
- Wait a few moments (network propagation delay)
- Refresh the chat

### Encryption Errors

- Verify your keys are valid
- Check for key synchronization issues
- Re-establish connection if needed

## Client-Side Implementation

:::note
Messaging in Spritz is **entirely client-side** using the Logos Messaging SDK. There is no REST API for messages - all communication happens peer-to-peer through the Logos Messaging network.
:::

### Using the Waku Hook

```typescript
import { useWaku } from "@/hooks/useWaku";

function ChatComponent({ recipientAddress }) {
    const { 
        sendMessage, 
        messages, 
        isConnected,
        connectionStatus 
    } = useWaku();
    
    const handleSend = async (content: string) => {
        await sendMessage(recipientAddress, content);
    };
    
    return (
        <div>
            {messages.map(msg => <Message key={msg.id} {...msg} />)}
            <MessageInput onSend={handleSend} disabled={!isConnected} />
        </div>
    );
}
```

For detailed technical implementation, see the [Messaging Technical Documentation](/docs/developers/messaging).

## Next Steps

- Learn about [Video Calls](/docs/guides/video-calls)
- Explore [Groups](/docs/guides/groups)
- Check out [Channels](/docs/guides/channels)




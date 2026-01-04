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

### Waku Protocol

Waku is a privacy-preserving messaging protocol:
- **Gossip Protocol**: Messages propagate through the network
- **Store and Forward**: Messages are stored temporarily for delivery
- **Encryption**: Uses Noise Protocol Framework
- **Relay Network**: Distributed relay nodes

### Message Encryption

All messages are encrypted using:
- **Noise Protocol**: Industry-standard encryption
- **Key Exchange**: Secure key establishment
- **Forward Secrecy**: Past messages remain secure

### Message Format

```typescript
{
  id: string;
  from: string;      // Wallet address
  to: string;        // Wallet address or channel ID
  content: string;   // Encrypted message content
  timestamp: number;
  type: 'text' | 'voice' | 'image';
  metadata?: {
    replyTo?: string;
    reactions?: Record<string, string[]>;
  };
}
```

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




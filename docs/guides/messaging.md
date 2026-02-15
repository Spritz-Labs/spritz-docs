---
title: Messaging Guide
description: "Use Spritz messaging with Logos Messaging for decentralized, peer-to-peer DMs and group chats. End-to-end encryption and censorship resistance."
keywords:
    [
        Spritz,
        messaging,
        Logos Messaging,
        DMs,
        end-to-end encryption,
        decentralized,
    ]
sidebar_label: Messaging
sidebar_position: 1
---

# Messaging Guide

Spritz uses **[Logos Messaging](https://logos.co/tech-stack)** for decentralized, peer-to-peer messaging with end-to-end encryption.

## Overview

Messaging in Spritz is fully decentralized:

-   **No Central Server**: Messages are relayed through the Logos Messaging network
-   **End-to-End Encrypted**: All messages are encrypted before transmission
-   **Peer-to-Peer**: Direct communication between users
-   **Censorship Resistant**: No single point of failure

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

In **DMs**, voice memos are **end-to-end encrypted** (same key as text). The client encrypts before upload; only you and the recipient can decrypt. See [Encrypted Media](/docs/developers/encrypted-media) for technical details.

### Encrypted Images (DMs)

In **direct messages**, you can send images that are **end-to-end encrypted** with the same conversation key as text and voice. Images are encrypted on your device before upload; only you and the recipient can view them. For format and API, see [Encrypted Media](/docs/developers/encrypted-media).

### Pixel Art

Create and share pixel art directly in chat:

1. Click the pixel art icon in chat
2. Use the 16x16 or 32x32 pixel editor
3. Choose colors from the palette
4. Create your design
5. Send to the chat

**Features:**

-   Download any image by clicking the download button
-   Share pixel art to social media with OG card previews
-   Images are stored on IPFS via Pinata for decentralized hosting

### Image Sharing

Share images in any chat:

1. Click the image/attachment icon
2. Select an image from your device
3. Image is uploaded and shared
4. All images have a download button for easy saving

**Quick Share Actions:**

When viewing pixel art or images, use quick share buttons:

-   **Share to X/Twitter**: Posts with automatic preview card
-   **Copy Link**: Get a shareable URL with OG tags
-   **More Options**: Share to Facebook, LinkedIn, Reddit, Telegram, WhatsApp
-   **Download**: Save the image to your device

### Location Sharing

Share your location in DMs and Group Chats:

1. Click the attachment menu (+) in chat
2. Select "Location"
3. Allow location access when prompted
4. Drop a pin on the map or use your current location
5. Send the location message

**Location Message Features:**

-   **Interactive Map Preview**: Shows an OpenStreetMap embed with your pin
-   **Open in Maps**: Recipients can open in Google Maps or Apple Maps
-   **Address Display**: Shows resolved address when available
-   **Coordinates**: Displays latitude and longitude

:::info Availability
Location sharing is available in DMs and Group Chats only. For privacy reasons, it is not available in public Channels or Global Chat.
:::

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

| Emoji | Suggested Use            |
| ----- | ------------------------ |
| 📥    | All chats (default view) |
| ⭐    | Favorites / Important    |
| 💼    | Work                     |
| 👨‍👩‍👧‍👦    | Family                   |
| 🎮    | Gaming                   |
| 🔔    | Unread                   |

### Folder Behavior

-   Chats can belong to multiple folders
-   Folders sync across devices via your account
-   Removing a chat from a folder doesn't delete the chat
-   Delete a folder by long-pressing it

## Message Actions

Spritz provides a unified Telegram-style message menu for quick actions. Long-press or right-click any message to access:

| Action          | Description                     |
| --------------- | ------------------------------- |
| 📋 **Copy**     | Copy message text to clipboard  |
| ↩️ **Reply**    | Reply to the specific message   |
| ➡️ **Forward**  | Forward message to another chat |
| 😀 **React**    | Add an emoji reaction           |
| ⬇️ **Download** | Download images or pixel art    |
| 🗑️ **Delete**   | Delete your own messages        |
| 🚫 **Report**   | Report inappropriate content    |

### Emoji Reactions

React to messages with emojis:

1. Long-press (mobile) or hover (desktop) on any message
2. Select from quick reactions: 👍 ❤️ 😂 😮 😢 🙏
3. Tap an existing reaction to add yours
4. Your reaction appears below the message

**Reaction Features:**

-   View who reacted by tapping the reaction count
-   Remove your reaction by tapping it again
-   Animated reactions for added expressiveness

### Emoji Shortcodes

In the message composer you can type **emoji shortcodes** for quick insertion. Type a colon followed by a shortcode name; an autocomplete list appears. Select an option to insert the emoji.

| You type   | Result |
| ---------- | ------ |
| `:heart:`  | ❤️     |
| `:thumbsup:` or `:+1:` | 👍 |
| `:fire:` or `:lit:` | 🔥 |
| `:gm:`     | 🌅     |
| `:eth:`    | ⟠      |

Shortcodes cover smileys, gestures, animals, food, travel, activities, objects, symbols, flags, and common crypto/Web3 terms (e.g. `gm`, `wagmi`, `lfg`). Use the autocomplete to discover more.

## User Moderation

Keep your conversations safe with built-in moderation tools.

### Mute Conversations

Silence notifications without blocking:

1. Open the chat you want to mute
2. Click the menu (⋮) or long-press the chat
3. Select "Mute"
4. Choose duration: 1 hour, 8 hours, 1 day, 1 week, or Forever
5. Unmute anytime from the same menu

### Block Users

Prevent a user from messaging you:

1. Open the user's profile or chat
2. Click "Block User"
3. Confirm the action

**What happens when you block someone:**

-   They cannot send you messages
-   You cannot send them messages
-   Any friend relationship is removed
-   They won't see when you're online

### Report Users

Report inappropriate behavior to admins:

1. Long-press the offending message
2. Select "Report"
3. Choose the reason:
    - Spam
    - Harassment
    - Hate speech
    - Violence
    - Scam
    - Impersonation
    - Inappropriate content
    - Other
4. Add optional details
5. Optionally block the user at the same time

Reports are reviewed by Spritz administrators. See the [User Moderation API](/docs/api/user-moderation) for technical details.

## Features

### Link Previews

When you share a URL, Spritz automatically generates a rich preview:

-   Page title and description
-   Preview image
-   Domain information

### Message Status

Track message delivery:

-   **Sending**: Message is being encrypted and sent
-   **Sent**: Message delivered to Logos Messaging network
-   **Delivered**: Message received by recipient
-   **Read**: Message has been read (if enabled)

### Message Search

Search through your message history:

-   Search by keyword
-   Filter by date range
-   Search across all conversations

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

| Protocol      | Purpose                                        |
| ------------- | ---------------------------------------------- |
| **LightPush** | For sending messages to the network            |
| **Filter**    | For subscribing to real-time incoming messages |
| **Store**     | For querying historical messages               |

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

-   **DM keys** use ECDH (Elliptic Curve Diffie-Hellman) with P-256 curve
    -   Each user generates a P-256 keypair
    -   Shared secret derived via ECDH from peer's public key
    -   This is more secure than deterministic keys—knowing addresses alone cannot derive the encryption key
-   **Group keys** are randomly generated and shared with members
-   All messages are encrypted before being sent to Logos Messaging

**PIN-Based Encryption (Email, Alien ID, World ID, Solana users):**

-   Set a 6-digit numeric PIN to generate your encryption keys
-   Same PIN + same account = same key on any device (deterministic)
-   PIN is never stored — only a verification hash is kept locally
-   Uses PBKDF2 with 600,000 iterations for brute-force resistance
-   Alternative to passkey for users who lack hardware WebAuthn support

:::tip
PIN encryption is the recommended setup for email, Alien ID, and Solana users. It enables cross-device messaging without requiring passkey hardware support.
:::

**Key Backup (Optional):**

-   Keys stored locally by default for maximum security
-   Opt-in cloud backup protected by 12-word phrase + 6-digit PIN
-   PBKDF2 with 100,000 iterations for key derivation

### Content Topics

Deterministic topic naming for routing:

| Type       | Topic Format                            |
| ---------- | --------------------------------------- |
| **DMs**    | `/spritz/1/dm/{sorted-addresses}/proto` |
| **Groups** | `/spritz/1/group/{groupId}/proto`       |

### Hybrid Persistence

Since Logos Messaging's Store protocol has limited retention, Spritz uses a hybrid approach:

| Layer                     | Purpose                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Logos Messaging Store** | Short-term message history from the P2P network                                                         |
| **Spritz Database**       | Long-term encrypted message storage (messages are encrypted with the same symmetric key before storage) |
| **localStorage**          | Offline cache for instant loading                                                                       |

### Summary

> Spritz uses a bespoke implementation built directly on the [Logos Messaging](https://logos.co/tech-stack) SDK. It's NOT using any pre-built chat solution.
>
> The implementation uses:
>
> -   Logos Messaging Light Node with LightPush, Filter, and Store protocols
> -   Symmetric key encryption for all messages
> -   Custom Protobuf message format
> -   Hybrid persistence (Logos Messaging + Spritz Database) for reliable delivery
>
> This gives full control over the UX while leveraging Logos Messaging's decentralized, censorship-resistant message relay network.

## Best Practices

1. **Verify Identities**: Always verify you're messaging the right person
2. **Backup Keys**: Keep your encryption keys safe
3. **Respect Privacy**: Don't share private conversations
4. **Report Abuse**: Report inappropriate content
5. **Network Status**: Check Logos Messaging connection status

## Starred Messages

Save important messages for quick access later:

-   **Star a Message**: Long-press or right-click a message and select "Star"
-   **View Starred**: Access all starred messages from the message menu
-   **Unstar**: Remove messages from your starred list when no longer needed

Starred messages are stored per-user and persist across sessions. They work in DMs, groups, and channels.

### Starred Messages API

```http
GET /api/messages/starred?userAddress=0x...
```

```http
POST /api/messages/starred
```

```json
{
    "userAddress": "0x...",
    "messageId": "uuid",
    "content": "Message text",
    "senderAddress": "0x...",
    "chatType": "dm"
}
```

```http
DELETE /api/messages/starred?userAddress=0x...&messageId=uuid
```

---

## Polls

Create polls in group chats and channels to gather opinions from members.

### Creating a Poll

1. Open a group chat or channel
2. Tap the poll icon in the message composer
3. Enter your question and answer options (2-10 choices)
4. Configure options:
    - **Anonymous voting**: Hide who voted for what
    - **Multiple choice**: Allow selecting more than one option
    - **Time limit**: Set an expiration time for the poll
5. Send the poll

### Voting

-   Tap an option to vote
-   Change your vote before the poll closes
-   View results in real-time as votes come in

### Poll Management

-   **Edit**: Poll creator can edit the question and options before anyone votes
-   **Delete**: Poll creator or admins can delete polls
-   **Close**: Polls auto-close when the time limit expires

Polls are available in **group chats**, **public channels**, and **alpha chat**.

---

## Message Deletion

You can delete your own messages across all chat types. Admins and moderators can also delete other users' messages.

### Deleting Your Messages

1. Long-press or right-click a message you sent
2. Select **Delete**
3. Confirm the deletion

:::warning
Deleted messages cannot be recovered. In DMs, channels, and groups, deleted messages are replaced with "[Message deleted]" (soft delete). In location chats, messages are permanently removed.
:::

### Admin & Moderator Deletion

-   **Channel creators** and **global admins** can delete any message in their channels
-   **Group moderators** can delete messages in their groups
-   **Alpha Chat moderators** with delete permissions can remove messages (all deletions are logged to an audit trail)
-   **Location chat creators** and global admins can delete any message

---

## Blocking Users

Block users to prevent them from messaging you. Blocking is bidirectional — neither party can see the other's messages.

### How to Block

1. Open the user's profile
2. Tap the **Block** option
3. Optionally provide a reason

### What Happens When You Block

-   Messages from the blocked user are hidden across **all** chat types (DMs, groups, channels, location chats, Alpha Chat)
-   Any friend relationship with the blocked user is removed
-   The blocked user cannot send you messages or see your messages
-   You can unblock at any time to restore messaging

---

## Troubleshooting

### Messages Not Sending

-   Check Logos Messaging connection status
-   Verify recipient is online
-   Check network connectivity
-   Try refreshing the connection

### Messages Not Receiving

-   Verify you're connected to Logos Messaging
-   Check if sender is online
-   Wait a few moments (network propagation delay)
-   Refresh the chat

### Encryption Errors

-   Verify your keys are valid
-   Check for key synchronization issues
-   Re-establish connection if needed

## Client-Side Implementation

:::note
Messaging in Spritz is **entirely client-side** using the Logos Messaging SDK. There is no REST API for messages - all communication happens peer-to-peer through the Logos Messaging network.
:::

### Using the Waku Hook

```typescript
import { useWaku } from "@/hooks/useWaku";

function ChatComponent({ recipientAddress }) {
    const { sendMessage, messages, isConnected, connectionStatus } = useWaku();

    const handleSend = async (content: string) => {
        await sendMessage(recipientAddress, content);
    };

    return (
        <div>
            {messages.map((msg) => (
                <Message key={msg.id} {...msg} />
            ))}
            <MessageInput onSend={handleSend} disabled={!isConnected} />
        </div>
    );
}
```

For detailed technical implementation, see the [Messaging Technical Documentation](/docs/developers/messaging).

## Next Steps

-   Learn about [Video Calls](/docs/guides/video-calls)
-   Explore [Groups](/docs/guides/groups)
-   Check out [Channels](/docs/guides/channels)

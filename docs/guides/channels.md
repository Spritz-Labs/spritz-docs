---
title: Public Channels Guide
description: "Discover and join public channels in Spritz. Browse official channels, POAP channels, and community discussions. Learn how to join, create, and use channels."
keywords:
    [
        Spritz,
        public channels,
        POAP channels,
        community,
        Logos Messaging,
        Browse Channels,
    ]
sidebar_label: Channels
sidebar_position: 4
---

# Public Channels Guide

Public channels in Spritz allow you to discover and join community discussions on various topics.

## Overview

Public channels are:

-   **Discoverable**: Browse and search available channels
-   **Open**: Anyone can join public channels
-   **Topic-Based**: Organized around specific topics
-   **Community-Driven**: Built by and for the community

## Official Channels

Spritz includes **96+ official channels** across multiple categories, verified by the Spritz team. Official channels are marked with a special badge and appear at the top of search results.

### Channel Categories

| Category      | Examples                         | Count |
| ------------- | -------------------------------- | ----- |
| **Cities**    | New York, London, Tokyo, Paris   | 20+   |
| **Crypto**    | Bitcoin, Ethereum, DeFi, NFTs    | 15+   |
| **Tech**      | AI, Web3, Programming, Startups  | 12+   |
| **Gaming**    | PC Gaming, Console, Esports      | 10+   |
| **Sports**    | Football, Basketball, Soccer     | 10+   |
| **Music**     | Hip Hop, Electronic, Indie       | 8+    |
| **Art**       | Digital Art, Photography, Design | 6+    |
| **Languages** | English, Spanish, Mandarin       | 8+    |
| **Partners**  | Alien                            | 1+    |

Official channels are created and moderated by the Spritz team to ensure quality conversations.

### Alien Channel

The **Alien** channel is a dedicated official channel for the Alien ecosystem community. Users who authenticate with [Alien ID](/docs/developers/alien-integration) are **automatically joined** to this channel on their first login. The channel can also be accessed directly via its custom URL slug: `/channel/alien`.

### Token-Gated Chats (Token Chats)

Spritz supports **token-gated chat rooms**: rooms where membership requires holding a minimum balance of an ERC-20 token on a chosen chain (Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche, Unichain). When you browse "Token Chats," you can filter by chain and search by name. To **join** a token chat, the app checks your connected wallet, your Spritz Wallet (if you use a passkey), and any vaults you belong to; if any of these holds at least the required minimum balance, you can join. Official token chats can show an **official** badge. For API details, see the [Complete API Reference](/docs/api/complete#token-gated-chats-token-chats).

### Channel Slugs

Official channels can have **custom URL slugs** for direct access:

```
https://app.spritz.chat/channel/alien
https://app.spritz.chat/channel/ethereum
```

Slugs provide memorable, shareable links to channels without needing to know the channel's UUID.

## Discovering Channels

### Browse Channels

1. Navigate to the Channels section
2. Browse available channels
3. See channel descriptions and member counts
4. Join channels that interest you

### From my POAPs

If you hold **POAPs** (Proof of Attendance Protocol NFTs) from events (e.g. conferences, meetups), you can:

-   Switch to **"From my POAPs"** in Browse Channels to see events you've attended
-   For each event: **Create** a channel (if none exists yet) or **Join** the existing channel
-   POAP channels use **Logos Messaging** (Waku) and are limited to **one channel per POAP event** (or per **POAP collection**, when using collections)

This requires the app to have POAP integration enabled (`POAP_API_KEY`). For technical details, API endpoints (including POAP collections), and code examples, see [POAP Channels - Technical Integration](/docs/developers/poap-channels).

#### Joining a POAP channel

To join a POAP channel, you must **hold the POAP** for that event:

1. Open **Browse Channels** and switch to **"From my POAPs"** (or find the channel by name).
2. Find the channel for the event you attended and click **Join**.
3. Spritz checks that your connected wallet (or your Spritz Smart Wallet, if you use a passkey) holds the POAP for that event.
4. If you hold it, you join the channel. If not, you'll see a message that you need the POAP to join — make sure the wallet that holds the POAP is connected, or that you're signed in with the account that has the POAP on its Smart Wallet.

:::tip Passkey users
If you sign in with a passkey, Spritz also checks your **Smart Wallet** for the POAP. As long as the POAP is in either your identity wallet or your Smart Wallet, you can join.
:::

### Search Channels

-   Search by name or topic
-   Filter by category
-   Sort by popularity or activity
-   Find trending channels

## Joining Channels

1. Find a channel you want to join
2. Click "Join Channel"
3. Start participating in discussions
4. Leave anytime if no longer interested

:::note POAP channels
**POAP channels** (event-based channels from "From my POAPs") require you to hold the POAP for that event to join. See [From my POAPs → Joining a POAP channel](#joining-a-poap-channel) above.
:::

## Channel Features

### Messaging

-   Send messages to all channel members
-   Share links and media
-   React to messages with emojis

### Sharing POAPs in chat (/poap command)

In any channel (and in groups, location chats, and Alpha Chat), you can insert a **POAP embed** from your own collection. Type **`/poap`** followed by a space and part of an event name; an autocomplete list shows your POAPs that match. Select one to insert a rich POAP card (event name and image) into the message.

-   **How it works:** Your POAPs are loaded from the same data used for "From my POAPs" (your connected wallet and, if you use a passkey, your Spritz Wallet). The composer converts your selection into a `[poap:eventId:eventName:imageUrl]` embed that other members see as a POAP card.
-   **Where it works:** Channels, groups, location chats, and Alpha Chat.
-   **Use case:** Share proof of attendance or event badges in conversation without leaving the app.
-   Reply with message quotes

### Pinned Messages

Admins can pin important messages to the top of the channel:

-   **Pin Messages**: Admins can pin any message for visibility
-   **View Pinned**: Pinned messages appear at the top of the chat
-   **Unpin**: Admins can unpin messages when no longer relevant

### Polls

Create polls in channels to gather community feedback:

-   **Create**: Tap the poll icon to create a new poll with multiple options
-   **Vote**: Members can vote and see real-time results
-   **Anonymous**: Polls can be set to anonymous voting
-   **Time Limits**: Set an expiration for time-sensitive polls

Only channel members can vote. See [Polls](/docs/guides/messaging#polls) for more details.

### AI Agents

Official AI agents can be added to channels by admins for @mention interactions:

-   **@mention**: Tag an agent to ask questions or get information
-   **Channel-Specific**: Agents can be assigned to specific channels
-   **Location Support**: Agents can also participate in location chats

Pinned messages are great for:

-   Important announcements
-   Channel rules and guidelines
-   Frequently asked questions
-   Event information

### Channel Info

-   View channel description
-   See member count
-   Check activity level
-   View channel rules (if set)

## Creating Channels

1. Click "Create Channel"
2. Enter channel name
3. Add description
4. Set channel category
5. Configure privacy settings
6. Publish your channel

## Best Practices

1. **Clear Purpose**: Make channel purpose clear
2. **Active Moderation**: Keep discussions on-topic
3. **Respectful Communication**: Maintain friendly atmosphere
4. **Regular Participation**: Engage with the community
5. **Follow Guidelines**: Respect channel rules

## Location Chats

Spritz supports **location-based chat rooms** that let users connect with others nearby using real-world places from Google Places.

### How Location Chats Work

-   **Place-Based**: Chats are anchored to real-world locations (cafes, parks, venues, neighborhoods)
-   **Proximity Requirement**: You must be within **1 mile** of a location to create a chat there
-   **Discoverable**: Browse active location chats near your current position
-   **Logos Messaging**: Location chats use Logos Messaging (Waku) for decentralized delivery
-   **AI Agent Support**: Official AI agents can join location chats for local context

### Creating a Location Chat

1. Open the location chat picker
2. Search for a place or browse nearby locations via Google Places
3. Select a location (must be within 1 mile of your position)
4. The chat room is created and linked to that place
5. Other nearby users can discover and join

### Joining Location Chats

1. Browse available location chats in the discovery view
2. See which chats are active near you
3. Tap to join and start chatting
4. Leave anytime

Location chats complement public channels by providing spontaneous, location-aware conversations.

---

## API Reference

### List Channels

```typescript
GET /api/channels?category=tech&userAddress=0x...
```

**Query Parameters:**

-   `category` - Filter by category (optional)
-   `userAddress` - Include membership status in response (optional)
-   `joined` - If `true`, only return channels user has joined (optional)

**Response:**

```json
{
    "channels": [
        {
            "id": "uuid",
            "name": "Ethereum",
            "description": "Discuss Ethereum development",
            "emoji": "⟠",
            "category": "crypto",
            "slug": "ethereum",
            "is_official": true,
            "member_count": 1250,
            "message_count": 8420,
            "is_member": false
        }
    ]
}
```

### Get Channel

```typescript
GET /api/channels/:id
```

### Get Channel by Slug

```typescript
GET /api/channels/slug/:slug
```

Returns a channel by its custom URL slug (e.g., `alien`, `ethereum`).

### Join Channel

```typescript
POST /api/channels/:id/join
{
  "userAddress": "0x..."
}
```

### Leave Channel

```typescript
POST /api/channels/:id/leave
{
  "userAddress": "0x..."
}
```

### Get Channel Messages

```typescript
GET /api/channels/:id/messages?limit=50
```

### Send Channel Message

```typescript
POST /api/channels/:id/messages
{
  "userAddress": "0x...",
  "content": "Message text",
  "type": "text"
}
```

### Pin Message (Admin Only)

```typescript
POST /api/channels/:id/messages/pin
{
  "messageId": "uuid",
  "action": "pin"
}
```

### Unpin Message (Admin Only)

```typescript
POST /api/channels/:id/messages/pin
{
  "messageId": "uuid",
  "action": "unpin"
}
```

## Next Steps

-   [Room Rules & Moderation](/docs/developers/moderation) — Configure room rules, moderators, and bans
-   [POAP Channels](/docs/developers/poap-channels) — Technical integration (API, schema, code)
-   [Alien Integration](/docs/developers/alien-integration) — Alien SSO, Mini App, and auto-join channel
-   [Groups](/docs/guides/groups) — Private group chats
-   [Messaging](/docs/guides/messaging) — Direct and channel messaging
-   [Friends](/docs/guides/friends) — Friends list and requests

---
title: User Moderation API - Mute, Block, and Report
description: API reference for user moderation features including muting conversations, blocking users, and reporting abuse in Spritz.
keywords:
    [
        Spritz API,
        mute,
        block,
        report,
        moderation,
        user safety,
        abuse reporting,
    ]
sidebar_label: User Moderation
sidebar_position: 6
---

# User Moderation API

Spritz provides comprehensive user moderation features to ensure a safe communication experience. Users can mute conversations, block other users, and report abuse.

## Overview

| Feature | Description |
|---------|-------------|
| **Mute** | Silence notifications from specific conversations (DMs, groups, channels) |
| **Block** | Prevent a user from messaging you (bidirectional) |
| **Report** | Flag users for admin review with detailed context |

All moderation endpoints require authentication.

---

## Mute Conversations

Muting a conversation stops notifications without blocking the sender. You can set temporary or permanent mutes.

### Get Muted Conversations

```http
GET /api/users/mute
```

Returns all active mutes for the authenticated user.

#### Response

```json
{
    "mutes": [
        {
            "id": "uuid",
            "user_address": "0x...",
            "conversation_type": "dm",
            "conversation_id": "0x...",
            "muted_until": "2026-01-28T10:00:00Z",
            "created_at": "2026-01-26T10:00:00Z",
            "updated_at": "2026-01-26T10:00:00Z"
        }
    ]
}
```

### Mute a Conversation

```http
POST /api/users/mute
```

#### Request Body

```json
{
    "conversationType": "dm",
    "conversationId": "0x1234...",
    "duration": "1d"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationType` | enum | Yes | `dm`, `group`, or `channel` |
| `conversationId` | string | Yes | Peer address (DM) or group/channel ID |
| `duration` | enum | No | `1h`, `8h`, `1d`, `1w`, or `forever` (default) |

#### Response

```json
{
    "success": true,
    "mute": {
        "id": "uuid",
        "user_address": "0x...",
        "conversation_type": "dm",
        "conversation_id": "0x1234...",
        "muted_until": "2026-01-27T10:00:00Z",
        "created_at": "2026-01-26T10:00:00Z"
    }
}
```

### Unmute a Conversation

```http
DELETE /api/users/mute?conversationType=dm&conversationId=0x1234...
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationType` | enum | Yes | `dm`, `group`, or `channel` |
| `conversationId` | string | Yes | Peer address or group/channel ID |

#### Response

```json
{
    "success": true
}
```

---

## Block Users

Blocking a user prevents them from sending you messages. Blocks are bidirectional — neither party can message the other. Blocking also removes any existing friend relationship.

### Get Blocked Users

```http
GET /api/users/block
```

Returns users you've blocked and users who have blocked you.

#### Response

```json
{
    "blockedUsers": [
        {
            "id": "uuid",
            "blocker_address": "0x...",
            "blocked_address": "0xabcd...",
            "reason": "Spam",
            "created_at": "2026-01-26T10:00:00Z"
        }
    ],
    "blockedBy": [
        "0x5678..."
    ]
}
```

### Block a User

```http
POST /api/users/block
```

#### Request Body

```json
{
    "userAddress": "0xabcd...",
    "reason": "Spam messages"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userAddress` | string | Yes | Address of user to block |
| `reason` | string | No | Optional reason for blocking |

#### Response

```json
{
    "success": true,
    "block": {
        "id": "uuid",
        "blocker_address": "0x...",
        "blocked_address": "0xabcd...",
        "reason": "Spam messages",
        "created_at": "2026-01-26T10:00:00Z"
    }
}
```

#### Errors

- `400`: Cannot block yourself
- `401`: Unauthorized

### Unblock a User

```http
DELETE /api/users/block?userAddress=0xabcd...
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userAddress` | string | Yes | Address of user to unblock |

#### Response

```json
{
    "success": true
}
```

---

## Report Users

Reports are submitted to administrators for review. You can report users for various violations and optionally include message context.

### Report Types

| Type | Description |
|------|-------------|
| `spam` | Unwanted promotional or repetitive messages |
| `harassment` | Bullying, threats, or targeted abuse |
| `hate_speech` | Discriminatory content based on identity |
| `violence` | Threats or glorification of violence |
| `scam` | Fraudulent schemes or phishing attempts |
| `impersonation` | Pretending to be another person |
| `inappropriate_content` | NSFW or offensive content |
| `other` | Other violations not listed |

### Get Reports

```http
GET /api/users/report
```

Regular users see their own reports. Admins can see all reports.

#### Query Parameters (Admin Only)

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | boolean | Set to `true` to fetch all reports |
| `status` | enum | Filter by status: `pending`, `reviewed`, `action_taken`, `dismissed` |

#### Response

```json
{
    "reports": [
        {
            "id": "uuid",
            "reporter_address": "0x...",
            "reported_address": "0xabcd...",
            "report_type": "spam",
            "description": "Sending promotional links repeatedly",
            "conversation_type": "dm",
            "conversation_id": "0xabcd...",
            "message_id": "uuid",
            "message_content": "Check out this crypto...",
            "status": "pending",
            "admin_notes": null,
            "reviewed_at": null,
            "reviewed_by": null,
            "created_at": "2026-01-26T10:00:00Z"
        }
    ],
    "isAdmin": false
}
```

### Submit a Report

```http
POST /api/users/report
```

#### Request Body

```json
{
    "reportedAddress": "0xabcd...",
    "reportType": "spam",
    "description": "Sending promotional links repeatedly",
    "conversationType": "dm",
    "conversationId": "0xabcd...",
    "messageId": "uuid",
    "messageContent": "Check out this crypto opportunity...",
    "alsoBlock": true
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reportedAddress` | string | Yes | Address of user being reported |
| `reportType` | enum | Yes | See report types above |
| `description` | string | No | Additional details |
| `conversationType` | enum | No | `dm`, `group`, or `channel` |
| `conversationId` | string | No | Context conversation ID |
| `messageId` | string | No | Specific message being reported |
| `messageContent` | string | No | Snapshot of message (max 1000 chars) |
| `alsoBlock` | boolean | No | Block user after reporting |

#### Response

```json
{
    "success": true,
    "report": {
        "id": "uuid",
        "reporter_address": "0x...",
        "reported_address": "0xabcd...",
        "report_type": "spam",
        "status": "pending",
        "created_at": "2026-01-26T10:00:00Z"
    }
}
```

#### Errors

- `400`: Cannot report yourself
- `400`: Invalid report type
- `400`: Duplicate report within 24 hours
- `401`: Unauthorized

### Update Report Status (Admin Only)

```http
PATCH /api/users/report
```

#### Request Body

```json
{
    "reportId": "uuid",
    "status": "reviewed",
    "adminNotes": "Warned user about spam"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reportId` | string | Yes | Report UUID |
| `status` | enum | Yes | `pending`, `reviewed`, `action_taken`, `dismissed` |
| `adminNotes` | string | No | Admin review notes |

#### Response

```json
{
    "success": true,
    "report": {
        "id": "uuid",
        "status": "reviewed",
        "admin_notes": "Warned user about spam",
        "reviewed_at": "2026-01-26T12:00:00Z",
        "reviewed_by": "0x..."
    }
}
```

---

## Database Schema

### Muted Conversations

```sql
CREATE TABLE shout_muted_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    conversation_type TEXT NOT NULL CHECK (conversation_type IN ('dm', 'group', 'channel')),
    conversation_id TEXT NOT NULL,
    muted_until TIMESTAMPTZ, -- NULL = forever
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_address, conversation_type, conversation_id)
);
```

### Blocked Users

```sql
CREATE TABLE shout_blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_address TEXT NOT NULL,
    blocked_address TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_address, blocked_address)
);
```

### User Reports

```sql
CREATE TABLE shout_user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_address TEXT NOT NULL,
    reported_address TEXT NOT NULL,
    report_type TEXT NOT NULL,
    description TEXT,
    conversation_type TEXT,
    conversation_id TEXT,
    message_id TEXT,
    message_content TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Best Practices

:::tip User Experience
- Show clear confirmation dialogs before blocking
- Allow users to easily unmute/unblock from settings
- Provide feedback when a report is submitted
:::

:::info Rate Limiting
- Reports are deduplicated: same reporter + reported + type within 24 hours = rejected
- Mutes can be updated (upsert) rather than creating duplicates
:::

## Next Steps

- [Messaging Guide](/docs/guides/messaging) - Learn about message types and features
- [API Overview](/docs/api/intro) - Authentication and error handling
- [Error Codes](/docs/api/error-codes) - Complete error reference

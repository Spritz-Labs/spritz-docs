---
title: Chat Room Rules & Moderation System
description: "Configure room rules, moderate chats, manage bans, and control content types across Spritz channels, groups, location chats, and Alpha Chat."
keywords:
    [
        Spritz,
        moderation,
        chat rules,
        room rules,
        slow mode,
        read-only,
        bans,
        moderators,
        content filtering,
    ]
sidebar_label: Room Rules & Moderation
sidebar_position: 11
---

# Chat Room Rules & Moderation

Spritz provides a comprehensive moderation system for managing chat rooms across all chat types — channels, groups, location chats, and Alpha Chat. Admins and moderators can configure content rules, enforce slow mode, ban disruptive users, and set custom room guidelines.

## Overview

The moderation system has three layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Moderation Layers                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Room Rules (content control)                                 │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Toggle content types, slow mode, read-only,      │        │
│     │ max message length, custom guidelines text       │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  2. Moderator Permissions (role-based)                           │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Pin, delete, mute, manage mods — per moderator   │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  3. Room Bans (user-level enforcement)                           │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Temporary or permanent bans with reasons,        │        │
│     │ removes user from room membership                │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Supported Chat Types

| Chat Type | Room Rules | Moderators | Room Bans |
|-----------|-----------|------------|-----------|
| **Channels** | ✅ | ✅ | ✅ |
| **Groups** | ✅ | ✅ | ✅ |
| **Location Chats** | ✅ | ✅ | ✅ |
| **Alpha Chat** | ✅ | ✅ | ✅ |

---

## Room Rules

Room rules control what types of content can be posted and set behavioral constraints for a chat room.

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `links_allowed` | `boolean` | `true` | Allow URLs and links in messages |
| `photos_allowed` | `boolean` | `true` | Allow photo uploads |
| `pixel_art_allowed` | `boolean` | `true` | Allow pixel art messages |
| `gifs_allowed` | `boolean` | `true` | Allow GIF images |
| `polls_allowed` | `boolean` | `true` | Allow creating polls |
| `location_sharing_allowed` | `boolean` | `true` | Allow location sharing |
| `voice_allowed` | `boolean` | `true` | Allow voice messages |
| `read_only` | `boolean` | `false` | Only admins and moderators can post |
| `slow_mode_seconds` | `integer` | `0` | Minimum seconds between messages (0 = off) |
| `max_message_length` | `integer` | `0` | Maximum characters per message (0 = unlimited) |
| `rules_text` | `string` | `null` | Custom room guidelines shown to members |

### Slow Mode Options

| Value | Description |
|-------|-------------|
| `0` | Off (no delay) |
| `5` | 5 seconds between messages |
| `10` | 10 seconds |
| `30` | 30 seconds |
| `60` | 1 minute |
| `300` | 5 minutes |
| `600` | 10 minutes |

### Read-Only Mode

When `read_only` is enabled, only admins and moderators can post messages. Regular members can read messages but cannot send them. This is useful for announcement channels or during maintenance periods.

### Custom Room Guidelines

Set `rules_text` to display custom guidelines that members can view via a banner in the chat. Guidelines support plain text and are shown in a modal when members tap "View Room Rules."

---

## Chat Rules API

### Get Room Rules

```http
GET /api/chat-rules?chatType=channel&chatId={channelId}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chatType` | `enum` | Yes | `channel`, `alpha`, `location`, `group` |
| `chatId` | `string` | Yes | Chat room ID (or `null` for Alpha Chat) |

#### Response

```json
{
    "rules": {
        "id": "uuid",
        "chat_type": "channel",
        "chat_id": "channel-uuid",
        "links_allowed": true,
        "photos_allowed": true,
        "pixel_art_allowed": true,
        "gifs_allowed": true,
        "polls_allowed": true,
        "location_sharing_allowed": true,
        "voice_allowed": true,
        "slow_mode_seconds": 0,
        "read_only": false,
        "max_message_length": 0,
        "rules_text": null
    }
}
```

### Update Room Rules

```http
POST /api/chat-rules
```

Requires admin, room owner, or moderator with `can_manage_mods` permission.

#### Request Body

```json
{
    "chatType": "channel",
    "chatId": "channel-uuid",
    "rules": {
        "links_allowed": false,
        "slow_mode_seconds": 30,
        "read_only": false,
        "max_message_length": 500,
        "rules_text": "Be respectful. No spam or self-promotion."
    }
}
```

---

## Moderator System

### Permission Hierarchy

Spritz uses a tiered permission system. Higher-privilege roles inherit all lower permissions:

```
┌────────────────────────────────────────────┐
│  Super Admin (all permissions, can mute     │
│  admins)                                    │
├────────────────────────────────────────────┤
│  Admin (all permissions, cannot mute        │
│  other admins)                              │
├────────────────────────────────────────────┤
│  Channel Owner / Group Admin                │
│  (all permissions for their room)           │
├────────────────────────────────────────────┤
│  Moderator (granular per-permission)        │
│  • can_pin                                  │
│  • can_delete                               │
│  • can_mute                                 │
│  • can_manage_mods                          │
├────────────────────────────────────────────┤
│  Regular Member (no moderation powers)      │
└────────────────────────────────────────────┘
```

### Moderator Permissions

| Permission | Description |
|------------|-------------|
| `can_pin` | Pin and unpin messages |
| `can_delete` | Delete any message in the room |
| `can_mute` | Mute users and manage room bans |
| `can_manage_mods` | Promote and demote other moderators |

### Moderation API

#### Get Permissions

```http
GET /api/moderation?action=permissions&userAddress=0x...&channelId={id}
```

#### List Moderators

```http
GET /api/moderation?action=moderators&channelId={id}
```

#### List Muted Users

```http
GET /api/moderation?action=muted&channelId={id}
```

#### Check If User Is Muted

```http
GET /api/moderation?action=check-muted&userAddress=0x...&channelId={id}
```

#### View Moderation Log

```http
GET /api/moderation?action=mod-log&requestingUser=0x...&channelId={id}
```

### Moderation Actions

All moderation actions are performed via `POST /api/moderation`:

#### Promote Moderator

```json
{
    "action": "promote-mod",
    "moderatorAddress": "0x...",
    "channelId": "channel-uuid",
    "targetAddress": "0xnewmod...",
    "canPin": true,
    "canDelete": true,
    "canMute": true,
    "canManageMods": false,
    "notes": "Trusted community member"
}
```

#### Demote Moderator

```json
{
    "action": "demote-mod",
    "moderatorAddress": "0x...",
    "channelId": "channel-uuid",
    "targetAddress": "0xmod..."
}
```

#### Mute a User

```json
{
    "action": "mute-user",
    "moderatorAddress": "0x...",
    "channelId": "channel-uuid",
    "targetAddress": "0xuser...",
    "duration": "24h",
    "reason": "Repeated spam"
}
```

| Duration | Description |
|----------|-------------|
| `1h` | 1 hour |
| `24h` | 24 hours |
| `7d` | 7 days |
| `permanent` | No expiration |

:::warning
Admins cannot be muted by other admins. Only super admins can mute admins. Moderators cannot mute other moderators unless they have `can_manage_mods` permission.
:::

#### Unmute a User

```json
{
    "action": "unmute-user",
    "moderatorAddress": "0x...",
    "channelId": "channel-uuid",
    "targetAddress": "0xuser..."
}
```

#### Delete a Message

```json
{
    "action": "delete-message",
    "moderatorAddress": "0x...",
    "messageId": "message-uuid",
    "messageType": "channel",
    "reason": "Violates community guidelines"
}
```

#### Pin / Unpin a Message

```json
{
    "action": "pin-message",
    "moderatorAddress": "0x...",
    "messageId": "message-uuid",
    "messageType": "channel",
    "shouldPin": true
}
```

---

## Room Bans

Room bans are more severe than mutes — they remove the user from the room entirely and prevent them from rejoining.

### Ban API

#### List Active Bans

```http
GET /api/chat-rules/ban?chatType=channel&chatId={id}
```

#### Check If User Is Banned

```http
GET /api/chat-rules/ban?chatType=channel&chatId={id}&action=check&userAddress=0x...
```

#### Ban a User

```http
POST /api/chat-rules/ban
```

```json
{
    "action": "ban",
    "chatType": "channel",
    "chatId": "channel-uuid",
    "targetAddress": "0xuser...",
    "reason": "Harassment",
    "duration": "permanent"
}
```

| Duration | Description |
|----------|-------------|
| `1h` | 1 hour |
| `24h` | 24 hours |
| `7d` | 7 days |
| `30d` | 30 days |
| `permanent` | No expiration |

When a user is banned:
1. Their ban record is created in `shout_room_bans`
2. They are removed from the room membership
3. They cannot rejoin until the ban expires or is lifted

:::danger
You cannot ban admins or yourself. Only admins, room owners, and moderators with `can_mute` permission can ban users.
:::

#### Unban a User

```json
{
    "action": "unban",
    "chatType": "channel",
    "chatId": "channel-uuid",
    "targetAddress": "0xuser..."
}
```

---

## Message Validation

When a user sends a message, the server validates it against the room's rules:

1. **Ban check** — Is the user banned from this room?
2. **Read-only check** — Is the room read-only? (admins/mods are exempt)
3. **Content type check** — Is the message type allowed? (links, photos, GIFs, etc.)
4. **Link detection** — If links are disabled, scan text messages for URLs
5. **Length check** — Does the message exceed `max_message_length`?

```typescript
// Server-side validation flow
const rules = await getChatRules(chatType, chatId);

// 1. Check if user is banned
const isBanned = await isUserBanned(chatType, chatId, userAddress);
if (isBanned) {
    return { allowed: false, reason: "You are banned from this room" };
}

// 2. Check read-only mode (admins/mods exempt)
if (rules.read_only && !isAdminOrMod) {
    return { allowed: false, reason: "This room is read-only" };
}

// 3. Check content type
if (messageType === "image" && !rules.photos_allowed) {
    return { allowed: false, reason: "Photos are not allowed" };
}

// 4. Check for links in text
if (!rules.links_allowed && containsUrl(content)) {
    return { allowed: false, reason: "Links are not allowed" };
}

// 5. Check message length
if (rules.max_message_length > 0 && content.length > rules.max_message_length) {
    return { allowed: false, reason: `Message exceeds ${rules.max_message_length} characters` };
}
```

---

## Database Schema

### Room Rules Table

```sql
CREATE TABLE shout_chat_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_type TEXT NOT NULL CHECK (chat_type IN ('channel', 'alpha', 'location', 'group')),
    chat_id TEXT,
    links_allowed BOOLEAN DEFAULT true,
    photos_allowed BOOLEAN DEFAULT true,
    pixel_art_allowed BOOLEAN DEFAULT true,
    gifs_allowed BOOLEAN DEFAULT true,
    polls_allowed BOOLEAN DEFAULT true,
    location_sharing_allowed BOOLEAN DEFAULT true,
    voice_allowed BOOLEAN DEFAULT true,
    slow_mode_seconds INTEGER DEFAULT 0,
    read_only BOOLEAN DEFAULT false,
    max_message_length INTEGER DEFAULT 0,
    rules_text TEXT,
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chat_type, chat_id)
);

CREATE INDEX idx_chat_rules_lookup ON shout_chat_rules(chat_type, chat_id);
```

### Room Bans Table

```sql
CREATE TABLE shout_room_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_type TEXT NOT NULL CHECK (chat_type IN ('channel', 'alpha', 'location', 'group')),
    chat_id TEXT,
    user_address TEXT NOT NULL,
    banned_by TEXT NOT NULL,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    banned_until TIMESTAMP WITH TIME ZONE,  -- NULL = permanent
    is_active BOOLEAN DEFAULT true
);

CREATE UNIQUE INDEX idx_room_bans_unique
    ON shout_room_bans(chat_type, COALESCE(chat_id, '__global__'), user_address)
    WHERE is_active = true;
CREATE INDEX idx_room_bans_lookup
    ON shout_room_bans(chat_type, chat_id, user_address, is_active);
```

### Moderators Table

```sql
CREATE TABLE shout_moderators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    channel_id UUID REFERENCES shout_public_channels(id) ON DELETE CASCADE,
    granted_by TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    can_pin BOOLEAN DEFAULT true,
    can_delete BOOLEAN DEFAULT true,
    can_mute BOOLEAN DEFAULT true,
    can_manage_mods BOOLEAN DEFAULT false,
    notes TEXT,
    UNIQUE(user_address, channel_id)
);
```

### Moderation Log Table

```sql
CREATE TABLE shout_moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    moderator_address TEXT NOT NULL,
    target_user_address TEXT,
    target_message_id UUID,
    channel_id UUID,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## UI Components

### ChatRulesPanel

The `ChatRulesPanel` component provides a three-tab interface for managing room settings:

| Tab | Features |
|-----|----------|
| **Content** | Toggle content types (links, photos, GIFs, etc.), read-only mode, slow mode selector |
| **Rules** | Text editor for custom room guidelines with preview |
| **Bans** | List active bans, ban/unban users, view ban reasons and durations |

### ChatRulesBanner

A member-facing banner that appears when `rules_text` is set. Members can tap "View Room Rules" to see the guidelines in a modal dialog.

### ModerationPanel

A two-tab interface for managing moderators and muted users:

| Tab | Features |
|-----|----------|
| **Moderators** | Add/remove moderators with individual permission toggles |
| **Muted Users** | View muted users with durations, unmute users |

---

## Best Practices

1. **Start permissive** — Only restrict content types if there's a specific problem
2. **Use slow mode for large rooms** — 10-30 seconds prevents spam without frustrating users
3. **Write clear guidelines** — Use `rules_text` to set expectations before issues arise
4. **Ban as last resort** — Try muting first; bans remove users from the room entirely
5. **Audit moderator actions** — Review the moderation log regularly via the admin panel
6. **Grant minimal permissions** — Only give moderators the specific permissions they need

## Next Steps

-   [User Moderation API](/docs/api/user-moderation) — Mute, block, and report users
-   [Messaging Guide](/docs/guides/messaging) — Message deletion and blocking
-   [Channels Guide](/docs/guides/channels) — Channel features and management
-   [Admin Guide](/docs/guides/admin) — Platform-wide admin tools

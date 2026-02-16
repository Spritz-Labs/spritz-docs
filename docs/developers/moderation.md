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

The moderation system has four layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Moderation Layers                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Room Rules (content control)                                 │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Role-based content toggles, slow mode, read-only,  │        │
│     │ max message length, custom guidelines text        │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  2. Blocked Words (anti-scam / content filter)                    │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Global or per-room blocked words/phrases, regex,   │        │
│     │ actions: block, flag, mute                        │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  3. Moderator Permissions (role-based)                           │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Pin, delete, mute, manage mods — per moderator;    │        │
│     │ shared moderators for official channels            │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  4. Room Bans (user-level enforcement)                           │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Temporary or permanent bans with reasons,          │        │
│     │ removes user from room membership                  │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Supported Chat Types

| Chat Type | Room Rules | Moderators | Room Bans |
|-----------|-----------|------------|-----------|
| **Channels** | ✅ | ✅ | ✅ |
| **Token Chats** | ✅ | ✅ (admin/mod roles) | ✅ |
| **Groups** | ✅ | ✅ | ✅ |
| **Location Chats** | ✅ | ✅ | ✅ |
| **Alpha Chat** | ✅ | ✅ | ✅ |

For token chats, use `chatType: "token"` and `chatId` set to the token chat id (e.g. `tc_xxxxxxxxxxxxxxxx`). Only the chat creator or members with admin/moderator role can manage rules and bans.

---

## Room Rules

Room rules control what types of content can be posted and set behavioral constraints for a chat room. Content permissions are **role-based**: you can allow everyone, restrict to moderators only, or disable a content type entirely.

### Content Permission Levels

Each content type (links, photos, GIFs, etc.) uses one of three levels:

| Level | Value | Description |
|-------|-------|-------------|
| **Everyone** | `everyone` | All members can use this content type |
| **Mods only** | `mods_only` | Only admins and moderators can use it |
| **Disabled** | `disabled` | No one can use this content type |

:::info Legacy Support
The API accepts legacy boolean values: `true` is treated as `everyone`, `false` as `disabled`.
:::

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `links_allowed` | `everyone` \| `mods_only` \| `disabled` | `everyone` | URLs and links in messages |
| `photos_allowed` | same | `everyone` | Photo uploads |
| `pixel_art_allowed` | same | `everyone` | Pixel art messages |
| `gifs_allowed` | same | `everyone` | GIF images |
| `polls_allowed` | same | `everyone` | Creating polls |
| `location_sharing_allowed` | same | `everyone` | Location sharing |
| `voice_allowed` | same | `everyone` | Voice messages |
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
| `chatType` | `enum` | Yes | `channel`, `alpha`, `location`, `group`, `token` |
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

## Blocked Words (Anti-Scam)

The blocked words system lets admins and moderators block or flag specific words or phrases (including regex patterns) to reduce scam and abuse. Words can be **global** (platform-wide) or **room-specific**.

### Scope and Actions

| Scope | Description | Who Can Manage |
|-------|-------------|----------------|
| **global** | Applies to all chats | Admins and global moderators |
| **room** | Applies to one channel, group, location chat, or Alpha | Room owner, admins, or moderators with `can_manage_mods` |

| Action | Description |
|--------|-------------|
| **block** | Message is rejected; user sees an error |
| **flag** | Message can be flagged for review (future use) |
| **mute** | Treated as restricted (message rejected with generic message) |

### Blocked Words API

#### List Blocked Words

```http
GET /api/blocked-words?scope=global
GET /api/blocked-words?scope=room&chatType=channel&chatId=xxx
GET /api/blocked-words?scope=all&chatType=channel&chatId=xxx
```

| Parameter | Description |
|-----------|-------------|
| `scope` | `global`, `room`, or `all` (global + room combined) |
| `chatType` | Required for `room`/`all`: `channel`, `alpha`, `location`, `group`, `token` |
| `chatId` | Room ID for room scope |

#### Add a Blocked Word

```http
POST /api/blocked-words
```

```json
{
    "word": "scam-phrase",
    "scope": "global",
    "chatType": null,
    "chatId": null,
    "action": "block",
    "isRegex": false
}
```

- **word**: The word or phrase (or regex pattern if `isRegex: true`). Stored lowercased for non-regex.
- **scope**: `global` or `room`.
- **chatType** / **chatId**: Required when `scope` is `room`.
- **action**: `block`, `flag`, or `mute`.
- **isRegex**: If `true`, `word` is treated as a case-insensitive regex pattern.

#### Remove a Blocked Word

```http
DELETE /api/blocked-words
```

```json
{ "id": "uuid-of-blocked-word" }
```

Soft delete: the word is set to `is_active: false`.

### Shared Moderators for Official Channels

For **official channels** (`is_official: true`), global moderators (moderators with `channel_id: null`) can also manage that channel. They can manage blocked words, room rules, and moderation for any official channel without being added as a per-channel moderator.

---

## Role Badges

Spritz shows role badges next to usernames in all chat types so members can see who is staff or a moderator:

| Badge | Role | Description |
|-------|------|-------------|
| **Spritz Team** | Super admin | Platform super admins |
| **Admin** | Admin | Platform admins |
| **Mod** | Moderator | Global or channel moderator |

Badges are resolved via the `useRoleBadges` hook (admins and global/channel moderators). For a given channel, both global moderators and channel-specific moderators are considered.

---

## Message Validation

When a user sends a message, the server validates it against the room's rules:

1. **Ban check** — Is the user banned from this room?
2. **Read-only check** — Is the room read-only? (admins/mods are exempt)
3. **Content type check** — Is the message type allowed for this user's role? (everyone vs mods_only vs disabled)
4. **Blocked words check** — For text messages, content is checked against global and room-specific blocked words (exact or regex). Violations return an error and the message is not sent.
5. **Link detection** — If links are disabled for the user's role, scan text messages for URLs
6. **Length check** — Does the message exceed `max_message_length`?

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

### Blocked Words Table

```sql
CREATE TABLE shout_blocked_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'room')),
    chat_type TEXT CHECK (chat_type IN ('channel', 'alpha', 'location', 'group')),
    chat_id TEXT,
    action TEXT NOT NULL DEFAULT 'block' CHECK (action IN ('block', 'flag', 'mute')),
    is_regex BOOLEAN DEFAULT false,
    added_by TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE UNIQUE INDEX idx_blocked_words_unique
    ON shout_blocked_words(LOWER(word), scope, COALESCE(chat_type, '__none__'), COALESCE(chat_id, '__global__'))
    WHERE is_active = true;
CREATE INDEX idx_blocked_words_global ON shout_blocked_words(scope, is_active) WHERE scope = 'global' AND is_active = true;
CREATE INDEX idx_blocked_words_room ON shout_blocked_words(chat_type, chat_id, is_active) WHERE scope = 'room' AND is_active = true;
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

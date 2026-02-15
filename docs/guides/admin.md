---
title: Admin Guide
description: "Administrative features for Spritz. User management, analytics, invite codes, beta access, and platform moderation. Admin-only access."
keywords: [Spritz, admin, moderation, analytics, invite codes, beta access]
sidebar_label: Admin
sidebar_position: 9
---

# Admin Guide

Administrative features and tools for managing the Spritz platform.

## Overview

Admin features include:

-   **User Management**: View and manage users
-   **User Bans**: Ban and unban users platform-wide
-   **Message Moderation**: Delete messages across all chat types
-   **Blocked Words**: Global or per-room blocked words for anti-scam
-   **Admin Broadcast**: Send a DM to all of your friends (signed request)
-   **Image Uploads**: Send images in Alpha Chat (admin-only)
-   **Analytics Dashboard**: Track platform metrics
-   **Invite Codes**: Create and manage invite codes
-   **Beta Access**: Grant beta access to features
-   **Analytics Tracking**: Monitor usage patterns

## Accessing Admin Features

Admin features are only available to users with `is_admin: true` in the database.

### Admin Dashboard

1. Navigate to `/admin` in the app
2. View analytics and user metrics
3. Access admin tools and settings

## User Management

### View Users

1. Go to Admin → Users
2. Browse all registered users
3. Filter and search users
4. View user details and activity

### User Actions

-   **View Profile**: See user's full profile
-   **View Activity**: Check user's recent activity
-   **View Wallet Deployments**: See user's smart wallet status across all chains
-   **Grant Beta Access**: Enable beta features
-   **Revoke Access**: Remove user access (if needed)

### Chain Deployment View

View a user's smart wallet deployment status across all supported chains:

1. Go to Admin → Users
2. Click on a user to open details
3. View the chain deployment grid showing:
    - Which chains have deployed smart wallets
    - Balance on each chain
    - Total balance across all chains (USD)

**Chain Status Indicators:**

| Status    | Meaning                       |
| --------- | ----------------------------- |
| ✓ (Green) | Wallet deployed on this chain |
| - (Gray)  | Wallet not deployed           |

**Supported Chains:**

| Chain     | Chain ID |
| --------- | -------- |
| Ethereum  | 1        |
| Base      | 8453     |
| Arbitrum  | 42161    |
| Optimism  | 10       |
| Polygon   | 137      |
| BNB Chain | 56       |
| Unichain  | 130      |
| Avalanche | 43114    |

**API Endpoint:**

```typescript
GET /api/admin/user-wallets?address=0x...
// Returns wallet deployment status and balances across all chains
```

## Analytics

### Platform Metrics

Track key metrics:

-   **Total Users**: Registered user count
-   **Active Users**: Users active in last 30 days
-   **Messages Sent**: Total messages across platform
-   **Streams Created**: Total livestreams
-   **Agents Created**: Total AI agents
-   **Video Minutes**: Total video call minutes

### User Analytics

Individual user metrics:

-   Messages sent
-   Friends count
-   Voice minutes
-   Video minutes
-   Groups joined

### Charts & Visualizations

-   Daily active users
-   Feature usage trends
-   Growth metrics
-   Engagement statistics

### Wallet Analytics

Track wallet usage across the platform:

**Transaction Metrics:**

-   Total transactions
-   Transaction volume (USD)
-   Transactions by network
-   Transaction types (send, receive, swap)

**Network Usage:**

| Network   | Chain ID | Metrics Tracked             |
| --------- | -------- | --------------------------- |
| Ethereum  | 1        | Transactions, Volume, Users |
| Base      | 8453     | Transactions, Volume, Users |
| Polygon   | 137      | Transactions, Volume, Users |
| Arbitrum  | 42161    | Transactions, Volume, Users |
| Optimism  | 10       | Transactions, Volume, Users |
| Avalanche | 43114    | Transactions, Volume, Users |
| BNB Chain | 56       | Transactions, Volume, Users |

**User Wallet Stats:**

-   `wallet_tx_count` - Total transactions per user
-   `wallet_volume_usd` - Total volume per user
-   `last_wallet_tx_at` - Last transaction timestamp
-   `preferred_chain_id` - Most used network

## Invite Codes

### Create Invite Code

1. Go to Admin → Invite Codes
2. Click "Create Invite Code"
3. Set code details:
    - **Code**: Custom code or auto-generated
    - **Uses**: Maximum number of uses
    - **Expires**: Expiration date (optional)
4. Generate and share code

### Manage Invite Codes

-   **View Usage**: See how many times code was used
-   **Disable Code**: Temporarily disable a code
-   **Delete Code**: Permanently remove a code
-   **Track Usage**: Monitor code usage patterns

### Grant Invites

Grant invite codes to specific users:

1. Go to Admin → Grant Invites
2. Select user
3. Enter number of invites
4. Grant invites to user

## Moderation System

Spritz includes a comprehensive moderation system for managing chat in both global (alpha) chat and public channels.

### Moderator Roles

| Role              | Permissions                                  |
| ----------------- | -------------------------------------------- |
| **Super Admin**   | All permissions + manage other admins        |
| **Admin**         | All moderation permissions                   |
| **Channel Owner** | Full permissions within their channel        |
| **Moderator**     | Configurable permissions (pin, delete, mute) |

### Moderator Permissions

Moderators can have granular permissions:

-   **can_pin**: Pin/unpin messages
-   **can_delete**: Soft delete messages (preserves audit trail)
-   **can_mute**: Mute/unmute users
-   **can_manage_mods**: Promote/demote other moderators

### Managing Moderators

**Promote a Moderator:**

```typescript
POST /api/moderation
{
  "action": "promote-mod",
  "moderatorAddress": "0x...", // Your address
  "targetAddress": "0x...",    // New moderator
  "channelId": null,           // null for global chat
  "canPin": true,
  "canDelete": true,
  "canMute": true,
  "canManageMods": false
}
```

**Demote a Moderator:**

```typescript
POST /api/moderation
{
  "action": "demote-mod",
  "moderatorAddress": "0x...",
  "targetAddress": "0x...",
  "channelId": null
}
```

### Muting Users

Mute problematic users temporarily or permanently:

```typescript
POST /api/moderation
{
  "action": "mute-user",
  "moderatorAddress": "0x...",
  "targetAddress": "0x...",
  "channelId": null,
  "duration": "24h",  // "1h", "24h", "7d", "permanent"
  "reason": "Spamming chat"
}
```

**Duration formats:**

-   `1m`, `5m`, `30m` - Minutes
-   `1h`, `6h`, `24h` - Hours
-   `1d`, `7d`, `30d` - Days
-   `1w`, `2w` - Weeks
-   `permanent` - No expiration

### Deleting Messages

Soft delete messages (preserves for audit):

```typescript
POST /api/moderation
{
  "action": "delete-message",
  "moderatorAddress": "0x...",
  "messageId": "uuid",
  "messageType": "alpha", // or "channel"
  "reason": "Inappropriate content"
}
```

### Moderation Log

View the audit trail of all moderation actions:

```typescript
GET /api/moderation?action=mod-log&requestingUser=0x...&channelId=null
```

Returns recent actions including:

-   Who performed the action
-   What action was taken
-   Who was affected
-   Timestamp and reason

### Protection Rules

-   Cannot mute admins (unless you're a super admin)
-   Cannot mute moderators (unless you're an admin)
-   Channel owners have full permissions in their channels
-   All actions are logged for accountability

## Bug Reports

Spritz integrates with GitHub for bug report management. Users can submit bug reports in-app, which are automatically synced to GitHub issues.

### Enabling GitHub Integration

1. Create a GitHub personal access token with `repo` permissions
2. Add to your environment variables:
    ```env
    GITHUB_OWNER=your_github_username_or_org
    GITHUB_REPO=your_repo_name
    GITHUB_TOKEN=your_github_personal_access_token
    ```

### Bug Report Features

-   **In-App Submission**: Users can report bugs directly from the app
-   **Screenshot Upload**: Users can attach screenshots/media
-   **Auto-Labeling**: Reports are automatically labeled by category
-   **GitHub Sync**: Reports create GitHub issues for tracking
-   **Admin Review**: Admins can view and manage reports

### Managing Bug Reports

1. Go to Admin → Bug Reports
2. View all submitted reports
3. Filter by status (open, resolved, closed)
4. View attached media and details
5. Update status as issues are resolved

### API Reference

```typescript
// Submit bug report
POST /api/bug-reports
{
  "title": "Bug title",
  "description": "Description of the issue",
  "category": "ui" | "performance" | "feature" | "other",
  "userAddress": "0x..."
}

// Upload bug report media
POST /api/bug-reports/upload
Content-Type: multipart/form-data
file: <image/video file>

// Get bug reports (admin)
GET /api/admin/bug-reports

// Update bug report (admin)
PATCH /api/admin/bug-reports/:id
{
  "status": "open" | "in_progress" | "resolved" | "closed"
}
```

## Beta Access

### Grant Beta Access

Enable beta features for users:

1. Go to Admin → Users
2. Select user
3. Toggle "Beta Access"
4. User gains access to beta features

### Beta Features

Beta features may include:

-   New AI agent capabilities
-   Experimental features
-   Early access to updates
-   Testing new functionality

## API Reference

### Get Users

```typescript
GET / api / admin / users;
```

### Get Analytics

```typescript
GET /api/admin/analytics?period=30d
```

The main analytics endpoint returns platform-wide metrics. Results are paginated internally so large datasets (e.g. all users or all messages) are not capped at 1000 rows.

### Get Analytics v2 (Richer Insights)

```http
GET /api/admin/analytics/v2?section=overview&period=7d
```

Requires the same signed admin headers as other admin endpoints. Use for the admin dashboard's richer insights:

| Parameter | Description |
| --------- | ----------- |
| `section` | `overview` (default), or other section identifiers used by the dashboard |
| `period` | `24h`, `7d`, `30d`, `90d`, or `365d` |

The v2 endpoint loads data by section (e.g. overview KPIs, DAU sparkline, segments, funnel, comparison) and uses RPC/aggregates for better performance.

### Track Analytics

```typescript
POST /api/admin/track-analytics
{
  "event": "user_action",
  "data": { ... }
}
```

### Create Invite Code

```typescript
POST /api/admin/invite-codes
{
  "code": "INVITE123",
  "maxUses": 100,
  "expiresAt": "2024-12-31"
}
```

### Grant Invites

```typescript
POST /api/admin/grant-invites
{
  "userAddress": "0x...",
  "count": 10
}
```

## User Bans

Global admins can ban users from the platform entirely. Banning a user prevents them from participating in any chats.

### Banning a User

```http
POST /api/admin/ban
```

```json
{
    "userAddress": "0x1234...",
    "ban": true,
    "reason": "Repeated community guideline violations"
}
```

### Unbanning a User

```http
POST /api/admin/ban
```

```json
{
    "userAddress": "0x1234...",
    "ban": false
}
```

All ban/unban actions are logged to the `shout_admin_activity` audit table, recording the admin who took the action, the target user, and the reason.

---

## Message Moderation

Admins can delete messages across all chat types for moderation purposes:

| Chat Type | Who Can Delete |
|-----------|----------------|
| **DMs** | Global admins |
| **Channels** | Channel creator or global admins |
| **Groups** | Group moderators |
| **Location Chats** | Location chat creator or global admins |
| **Alpha Chat** | Moderators with `canDelete` permission |

In Alpha Chat, all moderator deletions are logged through the moderation API with a reason and audit trail.

---

## Image Uploads (Alpha Chat)

Admins can upload and send images in Alpha Chat. This feature is **admin-only** for moderation purposes.

### Supported Formats

| Format | MIME Type |
|--------|-----------|
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| GIF | `image/gif` |
| WebP | `image/webp` |

**Maximum file size**: 5 MB

Images are uploaded via `/api/upload` with `context: "global"` and sent as an `[IMAGE]` message format in the chat.

---

## Admin Broadcast

Admins can send a single DM to **all of their friends** at once (e.g. for announcements). The endpoint requires a **signed admin message** in the request headers to prove admin identity.

### How It Works

1. **GET** `/api/admin/broadcast` — Returns your friend count and sender address (for preview). Requires signed headers.
2. **POST** `/api/admin/broadcast` — Sends the message to every friend. Body: `{ "message": "Your text here" }`. Max length 2000 characters. Messages are inserted into `shout_messages` with `message_type: "broadcast"`.

### Authentication

Requests must include:

| Header | Description |
|--------|-------------|
| `x-admin-address` | Your wallet address |
| `x-admin-signature` | Signature of the admin message (viem `verifyMessage`) |
| `x-admin-message` | Base64-encoded message string (must include "Issued At:" timestamp; valid for 24 hours) |

The server verifies the signature and checks that the signer is in `shout_admins`. Messages older than 24 hours or in the future are rejected.

### Response

```json
{
    "success": true,
    "sent": 42,
    "failed": 0,
    "total": 42
}
```

---

## Best Practices

1. **Privacy**: Respect user privacy in analytics
2. **Security**: Keep admin access secure
3. **Monitoring**: Regularly review analytics
4. **Invite Management**: Monitor invite code usage
5. **Beta Testing**: Carefully select beta testers
6. **Ban Sparingly**: Use bans as a last resort; document reasons
7. **Audit Regularly**: Review the admin activity log for moderation actions

## Security

-   **Admin Verification**: Always verify admin status
-   **Access Control**: Limit admin features to authorized users
-   **Audit Logs**: All ban/unban and moderation actions are logged to `shout_admin_activity`
-   **Rate Limiting**: Protect admin endpoints

## Next Steps

-   [Room Rules & Moderation](/docs/developers/moderation) — Room rules, moderators, and bans
-   [User Moderation API](/docs/api/user-moderation) — Mute, block, and report users
-   Learn about [API Reference](/docs/api/intro)
-   Explore [Architecture Overview](/docs/architecture/overview)
-   Check out [Database Schema](/docs/database/schema)

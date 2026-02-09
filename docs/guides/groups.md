---
title: Groups Guide
description: "Create and manage groups in Spritz for group chats, group calls, and shared activities. Invite friends, manage members, and collaborate."
keywords: [Spritz, groups, group chat, group calls, invitations, collaboration]
sidebar_label: Groups
sidebar_position: 3
---

# Groups Guide

Spritz allows you to create and manage groups for collaborative communication, group calls, and shared activities.

## Overview

Groups in Spritz enable:

-   **Group Chats**: Multi-person conversations
-   **Group Calls**: Video calls with multiple participants
-   **Group Invitations**: Invite friends to join
-   **Group Management**: Organize and manage members

## Creating a Group

1. Navigate to the Groups section
2. Click "Create Group"
3. Enter a group name
4. Add a description (optional)
5. Invite friends to join
6. Click "Create"

## Group Features

### Group Chat

-   Send messages to all group members
-   Share files and media
-   React to messages
-   Reply to specific messages

### Group Calls

-   Start video calls with all members
-   Support for large groups
-   Screen sharing during calls
-   Record calls (via Huddle01 dashboard)

### Group Invitations

-   Send invitations to friends
-   Share invitation links
-   QR code invitations
-   Manage pending invitations

## Managing Groups

### Member Management

-   **Add Members**: Invite new members
-   **Remove Members**: Remove members (admin only)
-   **Promote Admins**: Make members administrators
-   **View Members**: See all group members

### Group Settings

-   **Group Name**: Change group name
-   **Description**: Update group description
-   **Privacy**: Set group visibility
-   **Notifications**: Configure notification settings

## Best Practices

1. **Clear Purpose**: Give groups clear names and purposes
2. **Active Moderation**: Keep groups focused and respectful
3. **Member Limits**: Consider group size for performance
4. **Regular Cleanup**: Remove inactive members
5. **Privacy**: Be mindful of group privacy settings

## Polls in Groups

Create polls to make group decisions:

1. Tap the poll icon in the message composer
2. Write your question and add answer options
3. Configure poll settings (anonymous, multiple choice, time limit)
4. Send and watch votes come in

Group members can vote, change their vote, and view live results. See [Polls](/docs/guides/messaging#polls) for detailed usage.

## Password-Protected Groups

Groups can be secured with a password for private access:

-   **Set Password**: Group creator sets a password during creation or in group settings
-   **Join with Password**: New members must enter the correct password to join
-   **Encrypted Access**: Password is used to derive an encryption key (PBKDF2-SHA256), adding a layer of protection to group access
-   **Change Password**: Group admin can update the password at any time

:::warning
If a group password is changed, existing members retain access but new members must use the updated password.
:::

## Pinned Messages

Pin important messages to the top of the group chat:

-   Any group member can pin messages
-   View all pinned messages from the group header
-   Unpin messages when they are no longer relevant

Pinned messages are useful for rules, announcements, or important links.

## Read Receipts

Group chats support read receipts so members can see who has read messages:

-   **Blue checkmarks**: Indicate when your message has been read
-   **Read status**: See which members have read a specific message
-   Mark conversations as read with a single tap

---

## API Reference

### Create Group

```typescript
POST /api/groups
{
  "name": "Group Name",
  "description": "Group description",
  "memberAddresses": ["0x...", "0x..."]
}
```

### Get Groups

```typescript
GET /api/groups?userAddress=0x...
```

### Add Member

```typescript
POST /api/groups/:id/members
{
  "userAddress": "0x..."
}
```

### Remove Member

```typescript
DELETE /api/groups/:id/members/:address
```

## Next Steps

-   [Room Rules & Moderation](/docs/developers/moderation) — Configure room rules, moderators, and bans
-   Learn about [Channels](/docs/guides/channels)
-   Explore [Video Calls](/docs/guides/video-calls)
-   Check out [Messaging](/docs/guides/messaging)

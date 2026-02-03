---
title: POAP Channels - Technical Integration Guide
description: "How Spritz integrates POAP with channels - scan user POAPs, create one channel per POAP event, API endpoints, database schema, and code examples."
keywords:
    [
        Spritz,
        POAP,
        channels,
        POAP channels,
        Proof of Attendance,
        API integration,
        Waku,
        Logos Messaging,
    ]
sidebar_label: POAP Channels
sidebar_position: 11
---

# POAP Channels - Technical Integration Guide

This document explains how Spritz integrates **POAP** (Proof of Attendance Protocol) with public channels: users who hold POAPs can discover event-specific channels, create a channel for a POAP event (one channel per event), and join using Logos Messaging (Waku). It is intended for developers who need to understand or extend the integration.

## Overview

-   **POAP**: Proof of Attendance Protocol; users receive NFTs (POAPs) for attending events. Each POAP is tied to an **event** (e.g. Devcon 2026).
-   **Spritz POAP channels**: One **public channel** can be linked to one POAP **event**. Only one channel per POAP event is allowed. Channels created from POAPs use **Waku/Logos** messaging (not the default standard channel backend).
-   **User flow**: User connects wallet → app fetches their POAPs via POAP API → user sees "From my POAPs" in Browse Channels → for each POAP event they hold, they see either an existing channel (Join/Open) or the option to create the channel. Creating a channel from a POAP auto-sets `messaging_type: "waku"` and stores `poap_event_id`, `poap_event_name`, `poap_image_url`.
-   **Join gating**: To **join** a POAP channel, the user must hold the POAP for that event. The server checks both the user's address and their **Smart Wallet** (from `shout_users.smart_wallet_address`) so passkey users can join if the POAP is on their Smart Wallet. If the user does not hold the POAP, `POST /api/channels/:id/join` returns 403.
-   **Multi-address scan**: The "From my POAPs" endpoint (`/api/poap/events-with-channels`) accepts either a single `address` or multiple `addresses` (comma-separated). POAPs from all addresses are merged and deduplicated by event id (e.g. identity wallet + Smart Wallet for passkey users).

## Prerequisites

| Requirement       | Description                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **POAP API key**  | Set `POAP_API_KEY` in environment. Without it, POAP endpoints return `events: []` and a message that the integration is not configured. Get keys at [POAP Documentation](https://documentation.poap.tech/docs/getting-started). |
| **POAP API base** | Spritz uses `https://api.poap.tech`. Scan endpoint: `GET https://api.poap.tech/actions/scan/{address}` with header `X-API-Key: <POAP_API_KEY>`.                                                                                 |
| **Database**      | Table `shout_public_channels` must have columns `poap_event_id`, `poap_event_name`, `poap_image_url` and unique index on `poap_event_id` (see [Database schema](#database-schema)).                                             |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ POAP Channels Flow                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Wallet (0x...)                                                        │
│        │                                                                     │
│        ▼                                                                     │
│  GET /api/poap/scan?address=0x...     GET /api/poap/events-with-channels?...  │
│        │                                        │                            │
│        │  X-API-Key: POAP_API_KEY                │  (scan + DB channels)     │
│        ▼                                        ▼                            │
│  POAP API: /actions/scan/{address}    Spritz: shout_public_channels          │
│        │                                        │                            │
│        ▼                                        ▼                            │
│  Deduplicated events (eventId, name, imageUrl)  Events + channel or null      │
│        │                                        │                            │
│        └────────────────┬───────────────────────┘                            │
│                         ▼                                                    │
│  UI: "From my POAPs" — Create channel or Join existing                       │
│                         │                                                    │
│                         ▼                                                    │
│  POST /api/channels { poapEventId, poapEventName, poapImageUrl }             │
│        │                                                                     │
│        ▼                                                                     │
│  One channel per poap_event_id (Waku); creator auto-joined                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

POAP-linked channels extend `shout_public_channels` with three nullable columns and a unique partial index. Migration: `migrations/080_poap_channels.sql`.

```sql
-- POAP-linked channels: one channel per POAP event (e.g. Devcon 2026)
-- Channels created from POAPs use Logos/Waku messaging.

ALTER TABLE shout_public_channels
ADD COLUMN IF NOT EXISTS poap_event_id INTEGER UNIQUE;

ALTER TABLE shout_public_channels
ADD COLUMN IF NOT EXISTS poap_event_name TEXT;

ALTER TABLE shout_public_channels
ADD COLUMN IF NOT EXISTS poap_image_url TEXT;

-- Index for lookup: find channel by POAP event
CREATE UNIQUE INDEX IF NOT EXISTS idx_channels_poap_event_id
ON shout_public_channels(poap_event_id) WHERE poap_event_id IS NOT NULL;

COMMENT ON COLUMN shout_public_channels.poap_event_id IS 'POAP event id from POAP API; at most one channel per event';
COMMENT ON COLUMN shout_public_channels.poap_event_name IS 'Display name of the POAP event (e.g. Devcon 2026)';
COMMENT ON COLUMN shout_public_channels.poap_image_url IS 'POAP artwork URL for the channel icon';
```

| Column            | Type           | Description                                                 |
| ----------------- | -------------- | ----------------------------------------------------------- |
| `poap_event_id`   | INTEGER UNIQUE | POAP event id from POAP API. At most one channel per event. |
| `poap_event_name` | TEXT           | Display name of the event (e.g. "Devcon 2026").             |
| `poap_image_url`  | TEXT           | POAP artwork URL used as channel icon.                      |

Lookup by POAP event: `WHERE poap_event_id = :id` and `is_active = true`.

---

## API Endpoints

### 1. Scan user POAPs (deduplicated events)

Returns the user's POAP collection as **deduplicated events** (one entry per POAP event), for use in "create/join POAP channel" UX.

**Request**

```http
GET /api/poap/scan?address=0x1234...5678
```

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| `address` | string | Yes      | Ethereum address (checksummed or lowercase). |

No authentication required. Server uses `POAP_API_KEY` to call POAP API.

**Response (200)**

When POAP is configured and scan succeeds:

```json
{
    "events": [
        {
            "eventId": 12345,
            "eventName": "Devcon 2026",
            "imageUrl": "https://..../poap-art.png"
        },
        {
            "eventId": 67890,
            "eventName": "EthCC 2025",
            "imageUrl": null
        }
    ]
}
```

When `POAP_API_KEY` is not set:

```json
{
    "error": "POAP integration not configured",
    "events": []
}
```

On POAP API failure the API still returns 200 with `events: []` and an `error` message so the UI can show a friendly state.

**Server implementation (concept)**

```typescript
// src/app/api/poap/scan/route.ts
const POAP_API_BASE = "https://api.poap.tech";

export async function GET(request: NextRequest) {
    const address = request.nextUrl.searchParams.get("address");
    if (!address?.trim()) {
        return NextResponse.json(
            { error: "address query parameter is required" },
            { status: 400 }
        );
    }

    const apiKey = process.env.POAP_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "POAP integration not configured", events: [] },
            { status: 200 }
        );
    }

    const url = `${POAP_API_BASE}/actions/scan/${encodeURIComponent(
        address.trim()
    )}`;
    const res = await fetch(url, {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: 300 },
    });

    if (!res.ok) {
        return NextResponse.json(
            { error: "Failed to fetch POAPs", events: [] },
            { status: 200 }
        );
    }

    const data = await res.json();
    const rawList = Array.isArray(data)
        ? data
        : data?.tokens ?? data?.poaps ?? [];
    const seen = new Map<
        number,
        { eventId: number; eventName: string; imageUrl: string | null }
    >();

    for (const item of rawList) {
        const event = item?.event ?? item;
        const eventId =
            typeof event?.id === "number" ? event.id : parseInt(event?.id, 10);
        if (eventId == null || Number.isNaN(eventId) || seen.has(eventId))
            continue;

        const eventName =
            event?.name ?? event?.event_name ?? `POAP #${eventId}`;
        const imageUrl = item?.image_url ?? event?.image_url ?? null;

        seen.set(eventId, {
            eventId,
            eventName: eventName.trim() || `Event ${eventId}`,
            imageUrl: imageUrl || null,
        });
    }

    const events = Array.from(seen.values()).sort((a, b) =>
        a.eventName.localeCompare(b.eventName)
    );

    return NextResponse.json({ events });
}
```

**Client example**

```typescript
async function fetchMyPoapEvents(
    userAddress: string
): Promise<PoapEventForChannel[]> {
    const res = await fetch(
        `/api/poap/scan?address=${encodeURIComponent(userAddress)}`
    );
    const data = await res.json();
    if (data.error && data.events?.length === 0) {
        console.warn("POAP not configured or scan failed:", data.error);
        return [];
    }
    return data.events ?? [];
}
```

---

### 2. User POAP events with channel status ("From my POAPs")

Returns the same deduplicated POAP events for the user, plus for each event whether a channel already exists and the user's membership. Used by the "From my POAPs" tab in Browse Channels. Supports **multi-address** scan: pass `addresses=0x1,0x2` to merge POAPs from multiple wallets (e.g. identity + Smart Wallet for passkey users).

**Request**

```http
GET /api/poap/events-with-channels?address=0x1234...5678
```

Or multiple addresses (POAPs merged, deduplicated by event id):

```http
GET /api/poap/events-with-channels?addresses=0x1234...,0x5678...&memberAddress=0x1234...
```

| Parameter       | Type   | Required | Description                                                                   |
| --------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `address`       | string | Yes\*    | Single wallet address. Use when only one address is needed.                   |
| `addresses`     | string | Yes\*    | Comma-separated wallet addresses. POAPs from all are merged and deduplicated. |
| `memberAddress` | string | No       | Address used for `is_member` lookup (default: first address in list).         |

\*Exactly one of `address` or `addresses` is required.

**Response (200)**

```json
{
    "events": [
        {
            "eventId": 12345,
            "eventName": "Devcon 2026",
            "imageUrl": "https://..../poap-art.png",
            "channel": {
                "id": "uuid-of-channel",
                "name": "POAP: Devcon 2026",
                "description": "Community channel for holders of this POAP.",
                "poap_event_id": 12345,
                "is_member": true
            }
        },
        {
            "eventId": 67890,
            "eventName": "EthCC 2025",
            "imageUrl": null,
            "channel": null
        }
    ]
}
```

-   `channel: null` means no channel exists for that POAP event yet; the UI can offer "Create channel".
-   `channel` present: show "Join" or "Open" and use `channel.id`; `is_member` indicates if the current user is already a member.

**Server implementation (concept)**

1. Resolve addresses: single `address` or split `addresses` (comma-separated). Optionally use `memberAddress` for membership lookup (default: first address).
2. For each address, call POAP API `GET https://api.poap.tech/actions/scan/{address}` with `X-API-Key`; merge results and deduplicate by event id (optionally keep `createdAt` for sorting).
3. Query `shout_public_channels` where `is_active = true` and `poap_event_id` in event ids.
4. Query `shout_channel_members` for `memberAddress` to set `is_member` on each channel.
5. Return list of `{ eventId, eventName, imageUrl, channel }` (e.g. sorted by `createdAt` desc when available).

```typescript
// After fetching POAP list and building seen map (eventId -> { eventName, imageUrl })
const eventIds = Array.from(seen.keys());

const { data: channels } = await supabase
    .from("shout_public_channels")
    .select("*")
    .eq("is_active", true)
    .in("poap_event_id", eventIds);

const { data: memberships } = await supabase
    .from("shout_channel_members")
    .select("channel_id")
    .eq("user_address", userAddress.toLowerCase());

const memberSet = new Set(memberships?.map((m) => m.channel_id) ?? []);
const channelByEventId = new Map(
    (channels ?? []).map((c) => [
        c.poap_event_id,
        { ...c, is_member: memberSet.has(c.id) },
    ])
);

const eventsList = eventIds
    .sort((a, b) => seen.get(a).eventName.localeCompare(seen.get(b).eventName))
    .map((eventId) => ({
        eventId,
        eventName: seen.get(eventId).eventName,
        imageUrl: seen.get(eventId).imageUrl,
        channel: channelByEventId.get(eventId) ?? null,
    }));

return NextResponse.json({ events: eventsList });
```

---

### 3. Get channel by POAP event id

Part of the general channels API: if `poapEventId` is provided, returns the single active channel linked to that POAP event (or null).

**Request**

```http
GET /api/channels?poapEventId=12345&userAddress=0x...
```

| Parameter     | Type   | Required                | Description                                               |
| ------------- | ------ | ----------------------- | --------------------------------------------------------- |
| `poapEventId` | number | Yes (for this use case) | POAP event id.                                            |
| `userAddress` | string | No                      | If provided, response includes `is_member` for that user. |

**Response (200)**

```json
{
    "channel": {
        "id": "uuid",
        "name": "POAP: Devcon 2026",
        "description": "Community channel for holders of this POAP.",
        "emoji": "🎫",
        "poap_event_id": 12345,
        "poap_event_name": "Devcon 2026",
        "poap_image_url": "https://...",
        "messaging_type": "waku",
        "waku_content_topic": "/spritz/1/channel-...",
        "is_member": false
    }
}
```

If no channel exists for that event: `{ "channel": null }`.

---

### 4. Join channel (POAP gating)

For **POAP channels** (channel has `poap_event_id`), joining is gated: the user must hold the POAP for that event. The server checks both the user's `userAddress` and their **Smart Wallet** (`shout_users.smart_wallet_address`) so passkey users can join if the POAP is on their Smart Wallet.

**Request**

```http
POST /api/channels/:id/join
Content-Type: application/json
```

**Body**

```json
{
    "userAddress": "0x..."
}
```

**Verification (POAP channels only)**

1. Load channel; if `poap_event_id` is set, require `POAP_API_KEY`.
2. Call POAP API `GET https://api.poap.tech/actions/scan/{address}/{eventId}` for each address to check (user address + Smart Wallet if different).
3. If any address holds the POAP, allow join; otherwise return 403.

**Response (200)**

```json
{
    "success": true,
    "channelName": "POAP: Devcon 2026"
}
```

**Errors**

| Status | Condition                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 403    | POAP channel and `POAP_API_KEY` not set: "POAP verification is not configured. You need this POAP to join this channel."       |
| 403    | POAP channel and user does not hold the POAP: "You need this POAP to join this channel. Hold the POAP in your wallet to join." |
| 400    | Already a member: "Already a member of this channel."                                                                          |

**Server implementation (concept)**

```typescript
// For POAP channels: check ownership via POAP API scan for this event
async function addressHoldsPoap(
    address: string,
    eventId: number,
    apiKey: string
): Promise<boolean> {
    const url = `${POAP_API_BASE}/actions/scan/${encodeURIComponent(
        address
    )}/${eventId}`;
    const res = await fetch(url, {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: 60 },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.tokens ?? data?.poaps ?? [];
    return list.length > 0;
}

// Addresses to check: user address + Smart Wallet (for passkey users)
const addressesToCheck = [normalizedAddress];
const { data: userRow } = await supabase
    .from("shout_users")
    .select("smart_wallet_address")
    .eq("wallet_address", normalizedAddress)
    .maybeSingle();
if (userRow?.smart_wallet_address?.toLowerCase() !== normalizedAddress) {
    addressesToCheck.push(userRow.smart_wallet_address.toLowerCase());
}
let hasPoap = false;
for (const addr of addressesToCheck) {
    if (await addressHoldsPoap(addr, poapEventId, apiKey)) {
        hasPoap = true;
        break;
    }
}
if (!hasPoap) {
    return NextResponse.json(
        {
            error: "You need this POAP to join this channel. Hold the POAP in your wallet to join.",
        },
        { status: 403 }
    );
}
```

---

### 5. Create a POAP-linked channel

Creating a channel with `poapEventId` (and optionally `poapEventName`, `poapImageUrl`) creates a **POAP channel**: one channel per POAP event, Waku/Logos messaging, and default description.

**Request**

```http
POST /api/channels
Content-Type: application/json
Cookie: (session)
```

**Body**

| Field           | Type   | Required               | Description                                                    |
| --------------- | ------ | ---------------------- | -------------------------------------------------------------- |
| `poapEventId`   | number | Yes (for POAP channel) | POAP event id from scan/events-with-channels.                  |
| `poapEventName` | string | No                     | Display name (e.g. from POAP API).                             |
| `poapImageUrl`  | string | No                     | POAP artwork URL for channel icon.                             |
| `name`          | string | No                     | Override display name; default uses `poapEventName` or "POAP". |

For POAP channels, `messagingType` is forced to `"waku"`; other channel fields (e.g. `description`, `emoji`, `category`) can be sent and are applied.

**Example**

```json
{
    "poapEventId": 12345,
    "poapEventName": "Devcon 2026",
    "poapImageUrl": "https://..../poap-art.png"
}
```

**Validation**

-   If `poapEventId` is provided and valid, the backend ensures **at most one channel per POAP event**. If a channel with that `poap_event_id` already exists, response is 400: `"A channel for this POAP already exists"` with `existingChannelId`.
-   Channel name is stored as `POAP: ${poapEventName || name || "POAP"}` (sanitized).
-   Default description for POAP channels: `"Community channel for holders of this POAP."`

**Response (200)**

```json
{
    "channel": {
        "id": "uuid",
        "name": "POAP: Devcon 2026",
        "description": "Community channel for holders of this POAP.",
        "emoji": "🎫",
        "category": "events",
        "poap_event_id": 12345,
        "poap_event_name": "Devcon 2026",
        "poap_image_url": "https://..../poap-art.png",
        "messaging_type": "waku",
        "waku_symmetric_key": "...",
        "waku_content_topic": "/spritz/1/channel-...",
        "creator_address": "0x...",
        "member_count": 1
    }
}
```

The creator is auto-joined (one row in `shout_channel_members`).

**Client example (useChannels hook)**

```typescript
const createChannel = useCallback(
    async (params: {
        name?: string;
        poapEventId?: number;
        poapEventName?: string;
        poapImageUrl?: string;
        // ... other fields
    }) => {
        const res = await fetch("/api/channels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                ...params,
                creatorAddress: userAddress,
                messagingType:
                    params.poapEventId != null
                        ? "waku"
                        : params.messagingType || "standard",
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create channel");
        return data.channel;
    },
    [userAddress]
);

// Create POAP channel from "From my POAPs" selection
await createChannel({
    poapEventId: event.eventId,
    poapEventName: event.eventName,
    poapImageUrl: event.imageUrl ?? undefined,
});
```

---

## End-to-end flow (Browse Channels → "From my POAPs")

1. User opens Browse Channels and switches to **"From my POAPs"**.
2. Frontend calls `GET /api/poap/events-with-channels?address={userAddress}` (with session or passed address).
3. Backend fetches POAPs from POAP API, deduplicates by event id, then loads channels for those event ids and membership for the user.
4. UI renders one row per POAP event:
    - If `channel == null`: show "Create channel" (and on confirm send `POST /api/channels` with `poapEventId`, `poapEventName`, `poapImageUrl`).
    - If `channel` present: show "Join" or "Open" using `channel.id` (existing join channel flow).
5. After creating a channel, refresh the list (e.g. call `events-with-channels` again) so the new channel appears.

---

## File structure (eth-akash)

| Path                                             | Purpose                                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `src/app/api/poap/scan/route.ts`                 | `GET /api/poap/scan` — fetch user POAPs, return deduplicated events.                |
| `src/app/api/poap/events-with-channels/route.ts` | `GET /api/poap/events-with-channels` — POAP events + channel and membership.        |
| `src/app/api/channels/route.ts`                  | `GET /api/channels` (with `poapEventId`) and `POST /api/channels` (with POAP body). |
| `src/hooks/useChannels.ts`                       | `createChannel` with `poapEventId`, `poapEventName`, `poapImageUrl`.                |
| `src/components/BrowseChannelsModal.tsx`         | "From my POAPs" tab, calls events-with-channels, create/join.                       |
| `migrations/080_poap_channels.sql`               | Adds `poap_event_id`, `poap_event_name`, `poap_image_url` and unique index.         |

---

## Environment

| Variable       | Required                | Description                                                                                                  |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `POAP_API_KEY` | Yes (for POAP features) | API key for `api.poap.tech`. See [POAP Documentation](https://documentation.poap.tech/docs/getting-started). |

Without `POAP_API_KEY`, `/api/poap/scan` and `/api/poap/events-with-channels` return `events: []` and an error message; the rest of the app (non-POAP channels) continues to work.

---

## Next Steps

-   [Channels Guide](/docs/guides/channels) — User-facing channel discovery and POAP channels
-   [Messaging (Logos/Waku)](/docs/developers/messaging) — How Waku/Logos is used for POAP and other channels
-   [API Quick Reference](/docs/api/complete) — Overview of all endpoints including channels and POAP

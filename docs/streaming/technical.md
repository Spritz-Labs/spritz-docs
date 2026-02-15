---
title: Livestreaming Technical Deep Dive
description: Streaming flow, WebRTC/WHIP ingestion, Livepeer transcoding, HLS and WebRTC WHEP playback, recording, and technical specifications for Spritz livestreams.
keywords:
  [
    Spritz,
    livestreaming,
    Livepeer,
    WebRTC,
    WHIP,
    HLS,
    transcoding,
    streaming,
  ]
sidebar_label: Technical Deep Dive
sidebar_position: 1
---

# Livestreaming - Technical Deep Dive

This page describes the streaming flow and technical details used by the Spritz app (see `lib/livepeer.ts`, GoLiveModal, LiveStreamPlayer, and stream API routes in the codebase).

## Architecture

Spritz uses **Livepeer** for livestreaming infrastructure, combining WebRTC for ingestion and HLS for playback.

## Streaming Flow

### 1. Stream Creation

```typescript
// Create stream on Livepeer (recording off by default)
const livepeerStream = await createLivepeerStream(streamName, record = false);

// Response includes:
{
    id: "stream-id",
    streamKey: "stream-key-for-webrtc",
    playbackId: "playback-id-for-hls",
    rtmpIngestUrl: "rtmp://rtmp.livepeer.com/live/{streamKey}",
    record: false   // Set true only when user enables recording (beta)
}
```

:::info Recording (Beta)
**Recording is disabled by default.** When creating a stream, pass `record: true` only if the broadcaster has explicitly enabled recording in the Go Live modal. Recording is a **beta-only** feature: the recording toggle in the UI is shown only to users with beta access. This reduces storage and processing costs and keeps recording opt-in.
:::

### 2. WebRTC Ingestion (WHIP)

The broadcaster uses **WebRTC-HTTP Ingestion Protocol (WHIP)** to send video. Livepeer uses GeoDNS: a **HEAD** request to `https://livepeer.studio/webrtc/{streamKey}` returns a **Location** header with the regional WHIP endpoint (e.g. `https://lax-prod-catalyst-2.lp-playback.studio/webrtc/{streamKey}`). Use that URL for SDP POST and for ICE servers (STUN/TURN on the same host). Recommended: use `getIngest(streamKey)` from `@livepeer/react/external` or the Broadcast component from `@livepeer/react/broadcast`.

```typescript
import { getIngest } from "@livepeer/react/external";

const ingestUrl = getIngest(streamKey); // or resolve regional URL via HEAD redirect

// Regional ICE servers (host from redirect URL)
const host = new URL(ingestUrl).host;
const pc = new RTCPeerConnection({
    iceServers: [
        { urls: `stun:${host}` },
        { urls: `turn:${host}`, username: "livepeer", credential: "livepeer" },
    ],
});

const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1080, height: 1920, frameRate: 30 },
    audio: true,
});

// Add as sendonly transceivers (WHIP spec)
stream.getVideoTracks()[0] && pc.addTransceiver(stream.getVideoTracks()[0], { direction: "sendonly" });
stream.getAudioTracks()[0] && pc.addTransceiver(stream.getAudioTracks()[0], { direction: "sendonly" });

const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
// Wait for ICE gathering (e.g. up to 5s), then POST offer SDP to ingestUrl
const response = await fetch(ingestUrl, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: pc.localDescription?.sdp,
});
const answer = await response.text();
await pc.setRemoteDescription({ type: "answer", sdp: answer });
```

### 3. Livepeer Processing

Livepeer:
- Receives WebRTC stream (WHIP)
- Transcodes to H.264 with configured or default profiles (240p, 360p, 480p, 720p)
- Generates HLS manifest and optional WebRTC WHEP playback
- Records stream for VOD when `record: true` (optional `recordingSpec` with encoder: H.264, HEVC, VP8, VP9)

### 4. Playback (HLS or WebRTC WHEP)

Viewers can use **Playback Info** (`GET https://livepeer.studio/api/playback/{playbackId}`) to get HLS and WebRTC WHEP URLs, then use the Livepeer Player (prefers WebRTC, fallback HLS) or hls.js for HLS only:

```typescript
// Direct HLS URL
const playbackUrl = `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;

// Or fetch playback info (server-side) and use getSrc(playbackInfo) with Player.Root
const playbackInfo = await livepeer.playback.get(playbackId);

// Using hls.js
import Hls from "hls.js";
const hls = new Hls();
hls.loadSource(playbackUrl);
hls.attachMedia(video);
hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
```

## Stream States

### State Machine

```
idle → live → ended
  ↓      ↓
  └──────┘ (can transition back to idle if stream fails)
```

### State Transitions

- **idle → live**: When broadcaster starts WebRTC connection
- **live → ended**: When broadcaster stops or connection fails
- **idle → ended**: Auto-cleanup of stale streams (>1 hour old)

### Grace Period

New streams have a **60-second grace period** before verification:

```typescript
const GRACE_PERIOD_MS = 60000;
const startedAt = new Date(stream.started_at).getTime();
const isNewStream = (Date.now() - startedAt) < GRACE_PERIOD_MS;

// New streams shown even if not yet active
if (isNewStream) {
    return stream; // Show as live
}

// Older streams verified with Livepeer
const livepeerStream = await getLivepeerStream(stream.stream_id);
if (livepeerStream?.isActive) {
    return stream; // Actually live
}
```

## Recording

### Recording (Beta, Opt-In)

Streams are **not** recorded by default. Recording runs only when the stream is created with `record: true` (e.g. when the broadcaster enables the recording toggle in the Go Live modal; the toggle is shown only to users with beta access). Assets (recordings) are fetched and saved only for streams that had recording enabled.

```typescript
// Spritz app: createLivepeerStream(name, record = false)
const livepeerStream = await createLivepeerStream(streamName, record === true);
// When record is true: profiles [720p 2Mbps, 480p 1Mbps, 360p 500kbps] are used for recording
```

### Asset Retrieval

After stream ends, assets are processed:

```typescript
// Get stream assets (recordings)
const assets = await getLivepeerStreamAssets(streamId);

// Asset structure
{
    id: "asset-id",
    playbackId: "playback-id",
    playbackUrl: "https://livepeercdn.studio/hls/{playbackId}/index.m3u8",
    downloadUrl: "https://livepeer.studio/api/asset/{id}/download",
    status: {
        phase: "waiting" | "processing" | "ready" | "failed",
        progress?: number
    },
    videoSpec: {
        duration: 1234, // seconds
        format: "mp4"
    },
    size: 12345678 // bytes
}
```

## Viewer Tracking

### Real-time Viewer Count

```typescript
// Increment viewer count
POST /api/streams/:id/viewers
{
    "userAddress": "0x..."
}

// Decrement on leave
DELETE /api/streams/:id/viewers
{
    "userAddress": "0x..."
}
```

### Implementation

```typescript
// Track viewers in database
await db
    .from("shout_stream_viewers")
    .upsert({
        stream_id: streamId,
        user_address: userAddress,
        joined_at: new Date().toISOString()
    });

// Count active viewers
const { count } = await db
    .from("shout_stream_viewers")
    .select("*", { count: "exact", head: true })
    .eq("stream_id", streamId)
    .gte("joined_at", fiveMinutesAgo);
```

## Stream Chat

Streams can have associated chat:

```typescript
// Get stream chat
GET /api/streams/:id/chat

// Send chat message
POST /api/streams/:id/chat
{
    "userAddress": "0x...",
    "message": "Hello!"
}
```

## Technical Specifications

### Video Encoding (Livepeer)

- **Codec**: H.264 (AVC); profile: H264Baseline, H264Main, H264High, or H264ConstrainedHigh
- **Transcode profiles**: width/height ≥ 128, bitrate ≥ 400; optional quality (0–44), gop, fpsDen (default 1)
- **Default profiles** (if not specified): 240p (250 kbps), 360p (800 kbps), 480p (1.6 Mbps), 720p (3 Mbps)
- **Recording encoders**: H.264, HEVC, VP8, VP9 (via recordingSpec)

### Audio Encoding

- **Codec**: AAC (transcoder default)
- **Sample Rate**: 48 kHz typical
- **Bitrate**: Set by transcoder

### Network Requirements

- **Upload**: Minimum 2 Mbps for 720p; 5 Mbps recommended for stable broadcast
- **Download**: Minimum 1 Mbps for viewing
- **Latency**: ~3–5 s (HLS); sub-second with WebRTC WHEP playback

### Transcoding Profiles (Spritz defaults)

1. **720p**: 1280×720 @ 3 Mbps, quality 23, gop "2", H264Baseline
2. **480p**: 854×480 @ 1.6 Mbps
3. **360p**: 640×360 @ 800 kbps

HLS player (or Livepeer Player with Playback Info) selects best quality based on connection.

## Error Handling

### Connection Failures

```typescript
// WebRTC connection monitoring
pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') {
        // Attempt reconnection
        reconnectStream();
    }
};

// HLS error handling
hls.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
        switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad(); // Retry
                break;
            case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError(); // Recover
                break;
        }
    }
});
```

### Stream Cleanup

Stale streams are automatically cleaned up:

```typescript
// Auto-end stale idle streams (>1 hour old)
const createdAt = new Date(stream.created_at).getTime();
const oneHourAgo = Date.now() - 60 * 60 * 1000;

if (stream.status === "idle" && createdAt < oneHourAgo) {
    await db
        .from("shout_streams")
        .update({ 
            status: "ended", 
            ended_at: new Date().toISOString() 
        })
        .eq("id", stream.id);
}
```

## API Reference

### Create Stream

```typescript
POST /api/streams
{
    "userAddress": "0x...",
    "title": "My Stream",
    "description": "Optional description"
}

// Response
{
    "stream": {
        "id": "uuid",
        "stream_id": "livepeer-stream-id",
        "stream_key": "stream-key",
        "playback_id": "playback-id",
        "playback_url": "https://livepeercdn.studio/hls/{id}/index.m3u8",
        "rtmp_url": "rtmp://rtmp.livepeer.com/live/{key}",
        "status": "idle"
    }
}
```

### Get Streams

```typescript
GET /api/streams?userAddress=0x...&live=true&limit=20

// Response
{
    "streams": [
        {
            "id": "uuid",
            "user_address": "0x...",
            "title": "Stream Title",
            "status": "live",
            "viewer_count": 5,
            "playback_url": "...",
            "started_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### Stream Assets

```typescript
GET /api/streams/:id/assets

// Response
{
    "assets": [
        {
            "id": "asset-id",
            "playback_id": "playback-id",
            "playback_url": "...",
            "status": {
                "phase": "ready",
                "progress": 100
            },
            "duration_seconds": 1234,
            "size_bytes": 12345678
        }
    ]
}
```

## Performance Optimization

### CDN Caching

- HLS manifests cached for 2 seconds
- Video segments cached for 1 hour
- Thumbnails cached for 24 hours

### Adaptive Bitrate

HLS automatically adjusts quality:
- High bandwidth → 720p
- Medium bandwidth → 480p
- Low bandwidth → 360p

### Connection Pooling

- Reuse WebRTC connections when possible
- Batch viewer count updates
- Cache stream metadata

## Security

### Access Control

- Streams are public by default
- Can be restricted to friends (future feature)
- Viewer addresses tracked for analytics

### Content Moderation

- Stream titles/descriptions can be moderated
- Chat messages can be filtered
- Report functionality (future feature)




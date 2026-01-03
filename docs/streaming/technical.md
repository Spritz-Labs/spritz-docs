# Livestreaming - Technical Deep Dive

## Architecture

Spritz uses **Livepeer** for livestreaming infrastructure, combining WebRTC for ingestion and HLS for playback.

## Streaming Flow

### 1. Stream Creation

```typescript
// Create stream on Livepeer
const livepeerStream = await createLivepeerStream(streamName);

// Response includes:
{
    id: "stream-id",
    streamKey: "stream-key-for-webrtc",
    playbackId: "playback-id-for-hls",
    rtmpIngestUrl: "rtmp://rtmp.livepeer.com/live/{streamKey}",
    record: true
}
```

### 2. WebRTC Ingestion (WHIP)

The broadcaster uses **WebRTC-HTTP Ingestion Protocol (WHIP)** to send video:

```typescript
// WebRTC ingest URL
const ingestUrl = `https://livepeer.studio/webrtc/${streamKey}`;

// Browser WebRTC setup
const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.livepeer.studio:3478' }]
});

// Get user media
const stream = await navigator.mediaDevices.getUserMedia({
    video: {
        width: 1080,
        height: 1920,
        frameRate: 30
    },
    audio: true
});

// Add tracks to peer connection
stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
});

// WHIP offer/answer exchange
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const response = await fetch(ingestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: offer.sdp
});

const answer = await response.text();
await pc.setRemoteDescription({ type: 'answer', sdp: answer });
```

### 3. Livepeer Processing

Livepeer:
- Receives WebRTC stream
- Transcodes to multiple quality levels (720p, 480p, 360p)
- Generates HLS manifest
- Records stream for VOD

### 4. HLS Playback

Viewers receive HLS stream:

```typescript
// HLS playback URL
const playbackUrl = `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;

// Using hls.js
import Hls from 'hls.js';

const video = document.getElementById('video');
const hls = new Hls();
hls.loadSource(playbackUrl);
hls.attachMedia(video);
hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play();
});
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

### Automatic Recording

Streams are automatically recorded when `record: true`:

```typescript
const livepeerStream = await createLivepeerStream(streamName, {
    record: true,
    profiles: [
        { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
        { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
        { name: "360p", bitrate: 500000, fps: 30, width: 640, height: 360 }
    ]
});
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
await supabase
    .from("shout_stream_viewers")
    .upsert({
        stream_id: streamId,
        user_address: userAddress,
        joined_at: new Date().toISOString()
    });

// Count active viewers
const { count } = await supabase
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

### Video Encoding

- **Codec**: H.264 (AVC)
- **Resolution**: 1080x1920 (9:16 portrait)
- **Frame Rate**: 30 fps
- **Bitrate**: Adaptive (2Mbps max for 720p)

### Audio Encoding

- **Codec**: AAC
- **Sample Rate**: 48kHz
- **Bitrate**: 128kbps

### Network Requirements

- **Upload**: Minimum 2Mbps for 720p
- **Download**: Minimum 1Mbps for viewing
- **Latency**: ~3-5 seconds (HLS)

### Transcoding Profiles

Livepeer automatically creates multiple quality levels:

1. **720p**: 1280x720 @ 2Mbps
2. **480p**: 854x480 @ 1Mbps
3. **360p**: 640x360 @ 500kbps

HLS player automatically selects best quality based on connection.

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
    await supabase
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


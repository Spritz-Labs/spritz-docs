# Livestreaming Technical Documentation

Complete technical documentation for implementing livestreaming in Spritz using Livepeer's decentralized video infrastructure.

## Protocol Overview

Spritz uses **Livepeer** for decentralized livestreaming with WebRTC ingestion and HLS playback.

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Ingestion** | WebRTC/WHIP | Browser-based streaming |
| **Transcoding** | Livepeer Network | Multi-bitrate encoding |
| **Delivery** | HLS via CDN | Adaptive playback |
| **Recording** | Automatic VOD | Stream archival |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Livestream Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Broadcaster                                                 │
│  ┌──────────────┐                                           │
│  │   Browser    │                                           │
│  │  ┌────────┐  │                                           │
│  │  │ Camera │  │                                           │
│  │  │  +Mic  │  │                                           │
│  │  └────┬───┘  │                                           │
│  │       │      │                                           │
│  │  ┌────▼────────────┐                                     │
│  │  │ @livepeer/react │                                     │
│  │  │   Broadcast     │                                     │
│  │  └────────┬────────┘                                     │
│  └───────────┼──────────┘                                   │
│              │                                               │
│              │ WebRTC/WHIP                                   │
│              │ livepeer.studio/webrtc/{streamKey}           │
│              │                                               │
│              ▼                                               │
│  ┌───────────────────────────────────────┐                  │
│  │           Livepeer Network            │                  │
│  │  ┌─────────────────────────────────┐  │                  │
│  │  │         Transcoding             │  │                  │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐       │  │                  │
│  │  │  │720p │ │480p │ │360p │       │  │                  │
│  │  │  │2Mbps│ │1Mbps│ │0.5M │       │  │                  │
│  │  │  └─────┘ └─────┘ └─────┘       │  │                  │
│  │  └─────────────────────────────────┘  │                  │
│  │                  │                     │                  │
│  │                  ▼                     │                  │
│  │  ┌─────────────────────────────────┐  │                  │
│  │  │      HLS Manifest + Segments    │  │                  │
│  │  │  livepeercdn.studio/hls/{id}/   │  │                  │
│  │  └─────────────────────────────────┘  │                  │
│  └───────────────────────────────────────┘                  │
│                  │                                           │
│                  ▼                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Viewer 1 │ │ Viewer 2 │ │ Viewer N │                    │
│  │  (HLS)   │ │  (HLS)   │ │  (HLS)   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Stream Management

### Create Stream

```typescript
// lib/livepeer.ts
const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY;
const LIVEPEER_API_URL = "https://livepeer.studio/api";

export type LivepeerStream = {
    id: string;
    name: string;
    streamKey: string;
    playbackId: string;
    rtmpIngestUrl: string;
    record: boolean;
    isActive: boolean;
    createdAt: number;
};

export async function createLivepeerStream(name: string): Promise<LivepeerStream | null> {
        const response = await fetch(`${LIVEPEER_API_URL}/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LIVEPEER_API_KEY}`,
            },
            body: JSON.stringify({
                name,
            record: true, // Enable automatic recording
                profiles: [
                // Transcoding profiles for adaptive bitrate
                    { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
                    { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
                    { name: "360p", bitrate: 500000, fps: 30, width: 640, height: 360 },
                ],
            }),
        });

    if (!response.ok) return null;

        const data = await response.json();
        return {
            id: data.id,
            name: data.name,
            streamKey: data.streamKey,
            playbackId: data.playbackId,
            rtmpIngestUrl: `rtmp://rtmp.livepeer.com/live/${data.streamKey}`,
            record: data.record,
            isActive: data.isActive,
            createdAt: data.createdAt,
        };
}
```

### Get Stream Status

```typescript
export async function getLivepeerStream(streamId: string): Promise<LivepeerStream | null> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const data = await response.json();
        return {
            id: data.id,
            name: data.name,
            streamKey: data.streamKey,
            playbackId: data.playbackId,
            rtmpIngestUrl: `rtmp://rtmp.livepeer.com/live/${data.streamKey}`,
            record: data.record,
            isActive: data.isActive,
            createdAt: data.createdAt,
        };
}
```

### Delete Stream

```typescript
export async function deleteLivepeerStream(streamId: string): Promise<boolean> {
        const response = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
            method: "DELETE",
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
        });
        return response.ok;
}
```

---

## WebRTC Ingestion (WHIP)

### Protocol Overview

**WebRTC-HTTP Ingestion Protocol (WHIP)** enables sub-second latency browser-based streaming.

### Ingest URL

```typescript
// Generate WebRTC ingest URL
export function getWebRTCIngestUrl(streamKey: string): string {
    return `https://livepeer.studio/webrtc/${streamKey}`;
}
```

### Broadcast Component

```tsx
import * as Broadcast from "@livepeer/react/broadcast";

function GoLiveModal({ streamKey }: { streamKey: string }) {
    const ingestUrl = `https://livepeer.studio/webrtc/${streamKey}`;
    
    return (
        <Broadcast.Root ingestUrl={ingestUrl}>
            <Broadcast.Container>
                {/* Video preview */}
                <Broadcast.Video 
                    title="Live Preview" 
                    className="w-full h-full object-cover"
                />
                
                {/* Status indicator */}
                <Broadcast.LoadingIndicator className="absolute top-4 left-4">
                    <div className="animate-pulse bg-yellow-500 px-2 py-1 rounded">
                        Connecting...
                    </div>
                </Broadcast.LoadingIndicator>
                
                {/* Live indicator */}
                <Broadcast.StatusIndicator matcher="live">
                    <div className="absolute top-4 left-4 bg-red-500 px-2 py-1 rounded animate-pulse">
                        🔴 LIVE
                    </div>
                </Broadcast.StatusIndicator>
            </Broadcast.Container>
            
            {/* Controls */}
            <div className="flex gap-2">
                <Broadcast.EnabledTrigger>
                    {({ enabled }) => (
                        <button>
                            {enabled ? "Stop Streaming" : "Start Streaming"}
                        </button>
                    )}
                </Broadcast.EnabledTrigger>
                
                <Broadcast.VideoEnabledTrigger>
                    {({ videoEnabled }) => (
                        <button>
                            {videoEnabled ? "Disable Video" : "Enable Video"}
                        </button>
                    )}
                </Broadcast.VideoEnabledTrigger>
                
                <Broadcast.AudioEnabledTrigger>
                    {({ audioEnabled }) => (
                        <button>
                            {audioEnabled ? "Mute" : "Unmute"}
                        </button>
                    )}
                </Broadcast.AudioEnabledTrigger>
            </div>
        </Broadcast.Root>
    );
}
```

### Camera Setup

```typescript
// Start camera preview (before streaming)
const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
    });

    videoPreviewRef.current.srcObject = stream;
    await videoPreviewRef.current.play();
};

// Stop all media tracks
const stopAllMediaTracks = () => {
    // Stop tracked stream
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
            track.enabled = false;
            track.stop();
        });
    }
    
    // Stop any video element streams
    document.querySelectorAll("video").forEach(video => {
        const stream = video.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
    });
};
```

---

## HLS Playback

### Playback URLs

```typescript
// HLS manifest URL
export function getPlaybackUrl(playbackId: string): string {
    return `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;
}

// Thumbnail URL
export function getThumbnailUrl(playbackId: string): string {
    return `https://livepeercdn.studio/thumbnail/${playbackId}/0/0/thumbnail.png`;
}
```

### Player Component

```tsx
import Hls from "hls.js";

function LivestreamPlayer({ playbackId }: { playbackId: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    
    const playbackUrl = `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                lowLatencyMode: true,
            });
            
            hls.loadSource(playbackUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(console.error);
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });

            hlsRef.current = hls;
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            // Native HLS support (Safari)
            video.src = playbackUrl;
            video.play().catch(console.error);
        }

        return () => {
            hlsRef.current?.destroy();
        };
    }, [playbackUrl]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
            muted
        />
    );
}
```

### Livepeer React Player

```tsx
import { Player } from "@livepeer/react";

function StreamPlayer({ playbackId }: { playbackId: string }) {
    return (
        <Player
            playbackId={playbackId}
            autoPlay
            muted
            loop={false}
            showPipButton
            objectFit="cover"
            theme={{
                colors: {
                    accent: "#9333ea",
                },
            }}
        />
    );
}
```

---

## Transcoding Profiles

### Default Configuration

```typescript
const DEFAULT_PROFILES = [
    {
        name: "720p",
        bitrate: 2000000,  // 2 Mbps
        fps: 30,
        width: 1280,
        height: 720,
    },
    {
        name: "480p",
        bitrate: 1000000,  // 1 Mbps
        fps: 30,
        width: 854,
        height: 480,
    },
    {
        name: "360p",
        bitrate: 500000,   // 0.5 Mbps
        fps: 30,
        width: 640,
        height: 360,
    },
];
```

### Adaptive Bitrate (ABR)

The HLS manifest includes all renditions. Players automatically select the best quality based on:
- Available bandwidth
- Device capabilities
- Buffer health

---

## Recording (VOD)

### Automatic Recording

When `record: true` is set during stream creation, Livepeer automatically records the stream.

### Get Recordings

```typescript
export type LivepeerAsset = {
    id: string;
    playbackId: string;
    playbackUrl: string;
    downloadUrl: string;
    status: {
        phase: "waiting" | "processing" | "ready" | "failed";
        progress?: number;
    };
    videoSpec?: {
        duration: number;
        format: string;
    };
    size?: number;
};

export async function getLivepeerStreamAssets(streamId: string): Promise<LivepeerAsset[]> {
        const response = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}/assets`, {
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
        });

        if (!response.ok) return [];

        const assets = await response.json();
    return assets.map((asset: any) => ({
            id: asset.id,
            playbackId: asset.playbackId,
            playbackUrl: `https://livepeercdn.studio/hls/${asset.playbackId}/index.m3u8`,
            downloadUrl: asset.downloadUrl,
            status: asset.status,
            videoSpec: asset.videoSpec,
            size: asset.size,
        }));
}
```

### Get Specific Asset

```typescript
export async function getLivepeerAsset(assetId: string): Promise<LivepeerAsset | null> {
    const response = await fetch(`${LIVEPEER_API_URL}/asset/${assetId}`, {
        headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
    });

    if (!response.ok) return null;

    const asset = await response.json();
    return {
        id: asset.id,
        playbackId: asset.playbackId,
        playbackUrl: `https://livepeercdn.studio/hls/${asset.playbackId}/index.m3u8`,
        downloadUrl: asset.downloadUrl,
        status: asset.status,
        videoSpec: asset.videoSpec,
        size: asset.size,
    };
}
```

---

## Stream States

### State Machine

```
┌──────────┐    create     ┌──────────┐
│   IDLE   │ ───────────► │  CREATED │
└──────────┘               └──────────┘
                                │
                                │ start streaming
                                ▼
                           ┌──────────┐
                           │   LIVE   │ ◄─── viewers watching
                           └──────────┘
                                │
                                │ stop streaming
                                ▼
                           ┌──────────┐
                           │  ENDED   │ ───► recordings available
                           └──────────┘
```

### State Checking

```typescript
// Poll stream status
async function waitForStreamActive(streamId: string, timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        const stream = await getLivepeerStream(streamId);
        if (stream?.isActive) return true;
        await new Promise(r => setTimeout(r, 2000));
    }
    
    return false;
}
```

---

## Alternative Ingestion (RTMP)

For OBS or other streaming software:

### RTMP URL

```typescript
const rtmpUrl = `rtmp://rtmp.livepeer.com/live/${streamKey}`;
```

### OBS Configuration

1. **Service**: Custom
2. **Server**: `rtmp://rtmp.livepeer.com/live`
3. **Stream Key**: Your stream key from API

---

## API Endpoints

### Spritz Stream API

```typescript
// POST /api/streams - Create stream
// GET /api/streams - List user's streams
// GET /api/streams/[id] - Get stream details
// DELETE /api/streams/[id] - Delete stream
// GET /api/streams/[id]/assets - Get recordings

// Public stream access
// GET /api/public/streams/[id] - Get public stream info
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Stream key invalid` | Wrong or expired key | Regenerate stream |
| `Media access denied` | Browser blocked camera | Request permissions |
| `HLS manifest not found` | Stream not yet live | Retry with delay |
| `Transcoding failed` | Invalid input format | Check video codec |

### Error Recovery

```typescript
// HLS error recovery
hls.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
        switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                // Try to recover from network error
                console.log("Network error, attempting recovery...");
                hls.startLoad();
                break;
            case Hls.ErrorTypes.MEDIA_ERROR:
                // Try to recover from media error
                console.log("Media error, attempting recovery...");
                hls.recoverMediaError();
                break;
            default:
                // Fatal error, destroy and reinitialize
                hls.destroy();
                break;
        }
    }
});
```

---

## Best Practices

### Broadcasting

1. **Test before going live** - Use camera preview
2. **Good lighting** - Improves compression efficiency
3. **Stable internet** - Minimum 5 Mbps upload recommended
4. **Close other apps** - Reduce CPU/bandwidth competition

### Playback

1. **Start muted** - Avoid autoplay restrictions
2. **Use poster image** - Show thumbnail while loading
3. **Handle offline** - Show appropriate message
4. **Buffer appropriately** - Balance latency vs. stability

### Performance

1. **Lazy load player** - Don't load until needed
2. **Destroy on unmount** - Clean up HLS instance
3. **Monitor bandwidth** - Adjust quality if needed
4. **Use CDN** - Livepeer CDN handles this automatically

---

## Security

### Stream Key Protection

- Stream keys should only be exposed to the broadcaster
- Never include stream keys in client-side code for viewers
- Rotate keys after each stream if needed

### Access Control

```typescript
// Check if user owns the stream before allowing broadcast
async function canBroadcast(userId: string, streamId: string): Promise<boolean> {
    const stream = await getStreamFromDB(streamId);
    return stream?.creator_address === userId;
}
```

---

## Integration Example

```typescript
// Complete streaming flow
async function startLivestream(title: string) {
    // 1. Create stream
    const stream = await createLivepeerStream(title);
    if (!stream) throw new Error("Failed to create stream");
    
    // 2. Save to database
    await saveStreamToDB({
        id: stream.id,
        playbackId: stream.playbackId,
        streamKey: stream.streamKey,
        title,
        creatorAddress: userAddress,
    });
    
    // 3. Return ingest URL for broadcaster
    return {
        streamId: stream.id,
        ingestUrl: getWebRTCIngestUrl(stream.streamKey),
        playbackUrl: getPlaybackUrl(stream.playbackId),
    };
}

// End stream and get recordings
async function endLivestream(streamId: string) {
    // Wait for recordings to be available
    await new Promise(r => setTimeout(r, 5000));
    
    // Get recording assets
    const assets = await getLivepeerStreamAssets(streamId);
    
    // Update database with VOD info
    if (assets.length > 0) {
        await updateStreamWithRecordings(streamId, assets);
    }
    
    return assets;
}
```

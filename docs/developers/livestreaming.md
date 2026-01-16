---
title: Livestreaming (Livepeer)
description: Deep dive into Spritz livestreaming powered by Livepeer. Learn about WebRTC WHIP ingest, HLS playback, transcoding, and stream management.
keywords:
    [
        livestreaming,
        Livepeer,
        WebRTC,
        WHIP,
        HLS,
        video streaming,
        broadcast,
        transcoding,
    ]
sidebar_label: Livestreaming
sidebar_position: 6
---

# Livestreaming (Livepeer)

Spritz uses [Livepeer](https://livepeer.studio/) for decentralized livestreaming. Livepeer provides low-latency WebRTC ingest, HLS playback, automatic transcoding, and recording.

## Overview

### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              BROADCASTER                                  │
│  ┌──────────┐     ┌────────────┐     ┌────────────┐     ┌─────────────┐ │
│  │  Camera  │────▶│  WebRTC    │────▶│  Livepeer  │────▶│  Transcoder │ │
│  │   Mic    │     │ (Browser)  │     │   WHIP     │     │             │ │
│  └──────────┘     └────────────┘     └────────────┘     └──────┬──────┘ │
└──────────────────────────────────────────────────────────────────┼───────┘
                                                                   │
                                                                   ▼
                                                          ┌────────────────┐
                                                          │      HLS       │
                                                          │  (720p, 480p,  │
                                                          │     360p)      │
                                                          └───────┬────────┘
                                                                  │
              ┌───────────────────────────────────────────────────┼─────────┐
              │                                                   │         │
              ▼                                                   ▼         ▼
       ┌─────────────┐                                     ┌─────────────┐
       │   Viewer 1  │                                     │   Viewer N  │
       │  (Browser)  │                                     │  (Browser)  │
       │   HLS.js    │                                     │   HLS.js    │
       └─────────────┘                                     └─────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Stream** | Livepeer stream object with unique ID and keys |
| **Stream Key** | Secret for WHIP ingest |
| **Playback ID** | Public ID for HLS playback |
| **WHIP** | WebRTC HTTP Ingest Protocol |
| **HLS** | HTTP Live Streaming (adaptive bitrate) |
| **Asset** | Recorded video from a stream |

---

## Configuration

### Environment Variables

```env
# Server-side only (never expose to client!)
LIVEPEER_API_KEY=your_livepeer_api_key
```

---

## Stream Management

### Creating a Stream

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
    if (!LIVEPEER_API_KEY) {
        console.error("[Livepeer] API key not configured");
        return null;
    }

    try {
        const response = await fetch(`${LIVEPEER_API_URL}/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LIVEPEER_API_KEY}`,
            },
            body: JSON.stringify({
                name,
                record: true, // Enable recording for VOD
                profiles: [
                    // Transcoding profiles
                    { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
                    { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
                    { name: "360p", bitrate: 500000, fps: 30, width: 640, height: 360 },
                ],
            }),
        });

        if (!response.ok) {
            console.error("[Livepeer] Failed to create stream");
            return null;
        }

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
    } catch (error) {
        console.error("[Livepeer] Error creating stream:", error);
        return null;
    }
}
```

### Getting Stream Details

```typescript
export async function getLivepeerStream(streamId: string): Promise<LivepeerStream | null> {
    if (!LIVEPEER_API_KEY) return null;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
            headers: {
                Authorization: `Bearer ${LIVEPEER_API_KEY}`,
            },
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
    } catch (error) {
        console.error("[Livepeer] Error getting stream:", error);
        return null;
    }
}
```

### Deleting a Stream

```typescript
export async function deleteLivepeerStream(streamId: string): Promise<boolean> {
    if (!LIVEPEER_API_KEY) return false;

    try {
        const response = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${LIVEPEER_API_KEY}`,
            },
        });

        return response.ok;
    } catch (error) {
        console.error("[Livepeer] Error deleting stream:", error);
        return false;
    }
}
```

---

## API Routes

### Create Stream Endpoint

```typescript
// POST /api/streams
import { NextRequest, NextResponse } from "next/server";
import { createLivepeerStream, getPlaybackUrl } from "@/lib/livepeer";
import { getAuthenticatedUser } from "@/lib/session";

export async function POST(request: NextRequest) {
    // Authenticate user
    const session = await getAuthenticatedUser(request);
    if (!session) {
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }

    const { title, description } = await request.json();
    const userAddress = session.userAddress;

    // Check for existing active stream
    const { data: existingStream } = await db
        .from("shout_streams")
        .select("*")
        .eq("user_address", userAddress)
        .in("status", ["idle", "live"])
        .single();

    if (existingStream) {
        return NextResponse.json({
            stream: {
                ...existingStream,
                playback_url: existingStream.playback_id 
                    ? getPlaybackUrl(existingStream.playback_id) 
                    : null,
            },
            existing: true,
        });
    }

    // Create Livepeer stream
    const streamName = `${userAddress}-${Date.now()}`;
    const livepeerStream = await createLivepeerStream(streamName);

    if (!livepeerStream) {
        return NextResponse.json(
            { error: "Failed to create stream on Livepeer" },
            { status: 500 }
        );
    }

    // Save to database
    const { data: stream, error } = await db
        .from("shout_streams")
        .insert({
            user_address: userAddress,
            stream_id: livepeerStream.id,
            stream_key: livepeerStream.streamKey,
            playback_id: livepeerStream.playbackId,
            title: title?.trim() || null,
            description: description?.trim() || null,
            status: "idle",
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: "Failed to save stream" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        stream: {
            ...stream,
            rtmp_url: livepeerStream.rtmpIngestUrl,
            playback_url: getPlaybackUrl(livepeerStream.playbackId),
        },
    });
}
```

### Get Streams Endpoint

```typescript
// GET /api/streams
export async function GET(request: NextRequest) {
    const userAddress = request.nextUrl.searchParams.get("userAddress");
    const liveOnly = request.nextUrl.searchParams.get("live") === "true";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    let query = db
        .from("shout_streams")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (userAddress) {
        query = query.eq("user_address", userAddress.toLowerCase());
    }

    if (liveOnly) {
        query = query.eq("status", "live");
    }

    const { data: streams, error } = await query;

    if (error) {
        return NextResponse.json({ streams: [] });
    }

    // For live streams, verify with Livepeer
    let filteredStreams = streams || [];
    
    if (liveOnly && filteredStreams.length > 0) {
        const GRACE_PERIOD_MS = 60000; // 60 seconds for new streams
        const now = Date.now();
        
        const verifiedStreams = await Promise.allSettled(
            filteredStreams.map(async (stream) => {
                const startedAt = stream.started_at 
                    ? new Date(stream.started_at).getTime() 
                    : 0;
                const isNewStream = (now - startedAt) < GRACE_PERIOD_MS;
                
                if (isNewStream) return stream;
                
                if (stream.stream_id) {
                    const livepeerStream = await getLivepeerStream(stream.stream_id);
                    if (livepeerStream?.isActive) return stream;
                }
                return null;
            })
        );
        
        filteredStreams = verifiedStreams
            .filter(r => r.status === "fulfilled" && r.value !== null)
            .map(r => (r as PromiseFulfilledResult<any>).value);
    }

    // Add playback URLs
    const streamsWithUrls = filteredStreams.map(stream => ({
        ...stream,
        playback_url: stream.playback_id ? getPlaybackUrl(stream.playback_id) : null,
    }));

    return NextResponse.json({ streams: streamsWithUrls });
}
```

---

## URL Helpers

```typescript
// Playback URL (HLS)
export function getPlaybackUrl(playbackId: string): string {
    return `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;
}

// WebRTC ingest URL (WHIP)
export function getWebRTCIngestUrl(streamKey: string): string {
    return `https://livepeer.studio/webrtc/${streamKey}`;
}

// Thumbnail URL
export function getThumbnailUrl(playbackId: string): string {
    return `https://livepeercdn.studio/thumbnail/${playbackId}/0/0/thumbnail.png`;
}
```

---

## Broadcasting (WebRTC WHIP)

### Using Livepeer React SDK

```tsx
import * as Broadcast from "@livepeer/react/broadcast";

function GoLiveComponent({ streamKey }: { streamKey: string }) {
    const ingestUrl = getWebRTCIngestUrl(streamKey);
    
    return (
        <Broadcast.Root ingestUrl={ingestUrl}>
            <Broadcast.Container>
                <Broadcast.Video />
            </Broadcast.Container>
            
            <Broadcast.Controls>
                <Broadcast.EnabledTrigger>
                    {/* Start/Stop Button */}
                </Broadcast.EnabledTrigger>
            </Broadcast.Controls>
        </Broadcast.Root>
    );
}
```

### Manual WebRTC Implementation

```typescript
async function startBroadcast(streamKey: string): Promise<void> {
    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
    });

    // Create peer connection
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add tracks
    stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
    });

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send to Livepeer WHIP endpoint
    const response = await fetch(getWebRTCIngestUrl(streamKey), {
        method: "POST",
        headers: {
            "Content-Type": "application/sdp",
        },
        body: offer.sdp,
    });

    const answer = await response.text();
    await pc.setRemoteDescription({
        type: "answer",
        sdp: answer,
    });
}
```

---

## Playback (HLS)

### Using HLS.js

```typescript
import Hls from "hls.js";

function LiveStreamPlayer({ playbackId }: { playbackId: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const playbackUrl = getPlaybackUrl(playbackId);

    useEffect(() => {
        if (!videoRef.current) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
            });
            
            hls.loadSource(playbackUrl);
            hls.attachMedia(videoRef.current);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoRef.current?.play();
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
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
            // Safari native HLS
            videoRef.current.src = playbackUrl;
        }

        return () => {
            hlsRef.current?.destroy();
        };
    }, [playbackUrl]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            className="w-full aspect-video rounded-lg"
        />
    );
}
```

### Using Livepeer React Player

```tsx
import { Player } from "@livepeer/react";

function StreamPlayer({ playbackId }: { playbackId: string }) {
    return (
        <Player
            playbackId={playbackId}
            autoPlay
            muted
            showPipButton
            objectFit="cover"
        />
    );
}
```

---

## Recordings (VOD Assets)

### Getting Stream Assets

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
    if (!LIVEPEER_API_KEY) return [];

    try {
        const response = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}/assets`, {
            headers: {
                Authorization: `Bearer ${LIVEPEER_API_KEY}`,
            },
        });

        if (!response.ok) return [];

        const assets = await response.json();
        return assets.map((asset: Record<string, unknown>) => ({
            id: asset.id,
            playbackId: asset.playbackId,
            playbackUrl: `https://livepeercdn.studio/hls/${asset.playbackId}/index.m3u8`,
            downloadUrl: asset.downloadUrl,
            status: asset.status,
            videoSpec: asset.videoSpec,
            size: asset.size,
        }));
    } catch (error) {
        console.error("[Livepeer] Error getting assets:", error);
        return [];
    }
}
```

---

## Stream Status Management

### Database Schema

```sql
CREATE TABLE shout_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    stream_id TEXT NOT NULL,          -- Livepeer stream ID
    stream_key TEXT,                   -- Secret ingest key
    playback_id TEXT,                  -- Public playback ID
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'idle',        -- idle, live, ended
    viewer_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('idle', 'live', 'ended'))
);

CREATE INDEX idx_streams_user ON shout_streams(user_address);
CREATE INDEX idx_streams_status ON shout_streams(status);
CREATE INDEX idx_streams_created ON shout_streams(created_at DESC);
```

### Updating Status

```typescript
// Update stream to live status
async function markStreamLive(streamId: string): Promise<void> {
    await db
        .from("shout_streams")
        .update({
            status: "live",
            started_at: new Date().toISOString(),
        })
        .eq("id", streamId);
}

// End stream
async function endStream(streamId: string): Promise<void> {
    await db
        .from("shout_streams")
        .update({
            status: "ended",
            ended_at: new Date().toISOString(),
        })
        .eq("id", streamId);
}
```

---

## Camera/Microphone Management

```typescript
async function startCamera(): Promise<MediaStream | null> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: true,
        });
        return stream;
    } catch (error) {
        console.error("[GoLive] Camera error:", error);
        return null;
    }
}

function stopAllMediaTracks(): void {
    // Stop all tracked streams
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
            track.enabled = false;
            track.stop();
        });
    }

    // Also stop any tracks attached to video elements
    const videoElements = document.querySelectorAll("video");
    videoElements.forEach(video => {
        const stream = video.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(track => {
                track.enabled = false;
                track.stop();
            });
            video.srcObject = null;
        }
    });
}
```

---

## Go Live Modal Flow

```typescript
type StreamStatus = "preview" | "connecting" | "live" | "ending";

function GoLiveModal({ 
    userAddress,
    onClose 
}: { 
    userAddress: string;
    onClose: () => void;
}) {
    const [status, setStatus] = useState<StreamStatus>("preview");
    const [title, setTitle] = useState("");
    const [stream, setStream] = useState<Stream | null>(null);

    async function handleGoLive() {
        setStatus("connecting");

        // 1. Create stream via API
        const response = await fetch("/api/streams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title }),
        });

        const { stream: newStream } = await response.json();
        setStream(newStream);

        // 2. Start WebRTC broadcast
        // (handled by Livepeer Broadcast component)
        
        // 3. Update status to live
        await fetch(`/api/streams/${newStream.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "live" }),
        });

        setStatus("live");
    }

    async function handleEndStream() {
        setStatus("ending");

        if (stream) {
            await fetch(`/api/streams/${stream.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ended" }),
            });
        }

        stopAllMediaTracks();
        onClose();
    }

    return (
        <div>
            {status === "preview" && (
                <>
                    <VideoPreview />
                    <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Stream title (optional)"
                    />
                    <button onClick={handleGoLive}>Go Live</button>
                </>
            )}
            
            {status === "live" && stream && (
                <>
                    <Broadcast.Root ingestUrl={getWebRTCIngestUrl(stream.stream_key)}>
                        <Broadcast.Container>
                            <Broadcast.Video />
                        </Broadcast.Container>
                    </Broadcast.Root>
                    <button onClick={handleEndStream}>End Stream</button>
                </>
            )}
        </div>
    );
}
```

---

## Dependencies

```bash
npm install @livepeer/react hls.js
```

```typescript
// Broadcasting
import * as Broadcast from "@livepeer/react/broadcast";
import { Player } from "@livepeer/react";

// Playback
import Hls from "hls.js";
```

---

## Best Practices

1. **Always stop media tracks** - Prevent microphone/camera staying on after stream ends
2. **Handle stale streams** - Auto-end streams that have been "idle" for too long
3. **Verify with Livepeer** - Check `isActive` before showing as live
4. **Grace period** - Give new streams time to connect (60 seconds)
5. **Error recovery** - Implement HLS error recovery for playback

---

## Next Steps

- [Video Calls](/docs/developers/video-calls) - Huddle01 integration
- [Messaging](/docs/developers/messaging) - Logos messaging
- [API Reference](/docs/api/intro) - Complete API documentation

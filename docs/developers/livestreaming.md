---
title: Livestreaming with Livepeer
description: Complete technical documentation for implementing livestreaming in Spritz using Livepeer's decentralized video infrastructure, WebRTC/WHIP ingestion, and HLS playback.
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
    VOD,
  ]
sidebar_label: Livestreaming
sidebar_position: 7
---

# Livestreaming Technical Documentation

Complete technical documentation for implementing livestreaming in Spritz using **Livepeer**'s decentralized video infrastructure. This guide covers API usage, WebRTC/WHIP ingestion, HLS and WebRTC playback, transcoding profiles, recording, and security.

## Protocol Overview

Spritz uses **Livepeer** for decentralized livestreaming. Livepeer provides sub-second latency browser ingestion via **WHIP** (WebRTC-HTTP Ingestion Protocol), multi-bitrate **transcoding** on the Livepeer network, and delivery via **HLS** or low-latency **WebRTC (WHEP)** for playback.

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Ingestion** | WebRTC/WHIP | Browser-based streaming; regional ingest via redirect |
| **Transcoding** | Livepeer Network | Multi-bitrate H.264 encoding (240p–720p default) |
| **Delivery** | HLS + WebRTC WHEP | Adaptive HLS or low-latency WebRTC playback |
| **Recording** | Livepeer recordingSpec | VOD assets; H.264/HEVC/VP8/VP9 |

---

## Livepeer API Reference

### Base URL and Authentication

All Livepeer Studio API requests use:

- **Base URL**: `https://livepeer.studio/api` (or use the official `livepeer` SDK with `apiKey`)
- **Authentication**: `Authorization: Bearer YOUR_API_KEY`
- **API keys**: Created in [Livepeer Studio](https://livepeer.studio/). Use server-side only; never expose keys in client code. Expose only `playbackId` to viewers.

:::warning API key security
If a viewer has both the stream ID and a CORS-enabled API key, they could hijack the stream. Only expose `playbackId` to viewers; keep stream ID and stream key server-side.
:::

### Stream Create Request (POST /stream)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Stream name (1–500 chars) |
| `profiles` | object[] | No | Transcoding renditions; default 240p, 360p, 480p, 720p if omitted |
| `record` | boolean | No | Enable recording (default: false) |
| `recordingSpec` | object | No | Recording profiles; only when `record: true` |
| `playbackPolicy` | object | No | `public` (default), `jwt`, or `webhook` |
| `pull` | object | No | Pull from URL instead of push (no streamKey) |
| `multistream` | object | No | Push to external RTMP(S) targets |

### Transcoding Profile Object

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1–500 chars (e.g. `"720p"`; response may suffix with `0` e.g. `720p0`) |
| `width` | integer | Yes | ≥ 128 |
| `height` | integer | Yes | ≥ 128 |
| `bitrate` | integer | Yes | ≥ 400 (bits per second) |
| `fps` | integer | Yes | ≥ 0 (e.g. 30) |
| `fpsDen` | integer | No | Denominator for fps (default: 1) |
| `quality` | integer | No | Constant quality 0–44 (higher = lower quality); 23 typical |
| `gop` | string | No | Keyframe interval (e.g. `"2"`) |
| `profile` | enum | No | `H264Baseline`, `H264Main`, `H264High`, `H264ConstrainedHigh` |
| `encoder` | enum | No | `H.264` (transcode) |

### Recording Profile Object (recordingSpec.profiles)

Same as transcoding profile; `encoder` may be `H.264`, `HEVC`, `VP8`, or `VP9`.

### Stream Create Response (201)

Returns `id`, `streamKey`, `playbackId`, `createdAt` (ms), `isActive`, `profiles` (with server-assigned names e.g. `240p0`, `720p0`), `record`, `recordingSpec`, `playbackPolicy`, and optional `pull`/`multistream`. Use `streamKey` for WHIP/RTMP ingest; use `playbackId` for playback and Playback Info.

### Default Transcoding Profiles (when profiles omitted)

Livepeer applies these defaults:

| Name | Resolution | Bitrate |
|------|------------|---------|
| 240p | 426×240 | 250 kbps |
| 360p | 640×360 | 800 kbps |
| 480p | 854×480 | 1.6 Mbps |
| 720p | 1280×720 | 3 Mbps |

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

The following matches the Spritz app implementation in `lib/livepeer.ts`: base URL `https://livepeer.studio/api`, stream create with `record: true` and three transcoding profiles (720p, 480p, 360p) without `fpsDen`/`quality`/`gop`/`profile`. For full Livepeer API options (e.g. `fpsDen`, `quality`, `recordingSpec`), see the Livepeer API Reference section above.

### Create Stream

```typescript
// lib/livepeer.ts - matches Spritz app implementation
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
            record: true,
            profiles: [
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

Use **stream ID** (not playback ID) when calling Livepeer's GET stream endpoint. The Spritz app uses a 5-second timeout to avoid hanging on Livepeer verification.

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

:::important Live status check
When checking if a stream is live, pass the **stream_id** (Livepeer stream ID) to `getLivepeerStream`, not the playback_id. The playback ID is used only for playback URLs and Playback Info.
:::

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

**WebRTC-HTTP Ingestion Protocol (WHIP)** enables sub-second latency browser-based streaming. Livepeer uses GeoDNS: a **HEAD** request to the canonical ingest URL returns a **Location** header with the regional WHIP endpoint (e.g. `https://lax-prod-catalyst-2.lp-playback.studio/webrtc/{streamKey}`). Use that URL for SDP negotiation and for ICE servers (STUN/TURN on the same host).

### Ingest URL (Spritz app and alternatives)

The Spritz app builds the WHIP URL from the **stream key** (not the stream ID). Use the stream key from the Livepeer create-stream response or from your database (`stream_key`).

```typescript
// Spritz app: lib/livepeer.ts and GoLiveModal
export function getWebRTCIngestUrl(streamKey: string): string {
    return `https://livepeer.studio/webrtc/${streamKey}`;
}

// In the broadcast UI, use stream.stream_key (NOT stream.stream_id)
const whipUrl = `https://livepeer.studio/webrtc/${streamKey}`;
```

Alternatively, use `getIngest` from `@livepeer/react/external` (accepts stream key or Livepeer stream object; optional `baseUrl`). Livepeer may redirect the canonical URL to a regional endpoint; the Broadcast component handles this.

### Resolve regional ingest (custom WHIP)

For custom WebRTC (without `@livepeer/react` Broadcast), resolve the regional URL and ICE servers:

```typescript
async function getRegionalIngest(streamKey: string): Promise<{
    ingestUrl: string;
    iceServers: RTCIceServer[];
}> {
    const canonicalUrl = `https://livepeer.studio/webrtc/${streamKey}`;
    const response = await fetch(canonicalUrl, { method: "HEAD", redirect: "manual" });
    const redirectUrl = response.headers.get("Location") ?? canonicalUrl;
    const host = new URL(redirectUrl).host;

    return {
        ingestUrl: redirectUrl,
        iceServers: [
            { urls: `stun:${host}` },
            { urls: `turn:${host}`, username: "livepeer", credential: "livepeer" },
        ],
    };
}
```

### Broadcast Component

The Spritz app uses the Livepeer React **Broadcast** component (`@livepeer/react/broadcast`) with the WHIP URL from `stream.stream_key`. The component handles WHIP SDP negotiation and STUN/TURN for firewalls.

```tsx
import * as Broadcast from "@livepeer/react/broadcast";

// Spritz app: ingestUrl is set from stream.stream_key when user goes live
// ingestUrl = `https://livepeer.studio/webrtc/${streamKey}`;
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

### Custom WHIP (raw WebRTC SDP)

If you implement WHIP without `@livepeer/react` Broadcast, follow the WHIP spec:

1. Resolve regional ingest URL and ICE servers (HEAD redirect; use host for STUN/TURN).
2. Create `RTCPeerConnection` with those ICE servers.
3. Get user media; add video/audio as **sendonly** transceivers: `addTransceiver(track, { direction: "sendonly" })`.
4. Create SDP offer; set local description; wait for ICE gathering (e.g. up to 5 seconds).
5. POST the offer SDP to the **redirect URL** with `Content-Type: application/sdp`; body = offer SDP.
6. Set remote description with the 201 response SDP (answer).
7. Media flows via RTP/RTCP. HTTP DELETE to the WHIP resource is optional; Livepeer detects end by lack of packets.

```typescript
const { ingestUrl, iceServers } = await getRegionalIngest(streamKey);
const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
const pc = new RTCPeerConnection({ iceServers });

mediaStream.getVideoTracks()[0] && pc.addTransceiver(mediaStream.getVideoTracks()[0], { direction: "sendonly" });
mediaStream.getAudioTracks()[0] && pc.addTransceiver(mediaStream.getAudioTracks()[0], { direction: "sendonly" });

const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const ofr = await new Promise<RTCSessionDescription | null>((resolve) => {
    setTimeout(() => resolve(pc.localDescription), 5000);
    pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") resolve(pc.localDescription);
    };
});
if (!ofr?.sdp) throw new Error("ICE gathering failed");

const sdpResponse = await fetch(ingestUrl, {
    method: "POST",
    mode: "cors",
    headers: { "content-type": "application/sdp" },
    body: ofr.sdp,
});
if (sdpResponse.ok) {
    const answerSDP = await sdpResponse.text();
    await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answerSDP }));
}
```

---

## Playback (HLS and WebRTC WHEP)

### Spritz app: HLS playback

The Spritz app uses **HLS only** for playback via `getPlaybackUrl(playback_id)` and hls.js (or Safari native HLS). Playback URL is built from the **playback ID** (not stream ID).

```typescript
// lib/livepeer.ts - matches Spritz app
export function getPlaybackUrl(playbackId: string): string {
    return `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;
}
```

The viewer component uses `stream.playback_url` (from the API, which calls `getPlaybackUrl(stream.playback_id)`), hls.js with `lowLatencyMode: true` and `backBufferLength: 30`, and retries on manifest/404 errors (e.g. stream not yet broadcasting).

### Playback URLs (direct)

```typescript
// HLS manifest URL (Spritz app uses this for playback)
export function getPlaybackUrl(playbackId: string): string {
    return `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;
}

// WebRTC WHEP URL (low-latency; optional alternative)
export function getWebRTCPlaybackUrl(playbackId: string): string {
    return `https://livepeercdn.studio/webrtc/${playbackId}`;
}

// Thumbnail URL
export function getThumbnailUrl(playbackId: string): string {
    return `https://livepeercdn.studio/thumbnail/${playbackId}/0/0/thumbnail.png`;
}
```

### Playback Info API (optional)

Livepeer's **Playback Info** endpoint returns HLS, WebRTC WHEP, and thumbnail URLs. Use it on the server (with API key) if you want the Livepeer Player to prefer WebRTC and fall back to HLS.

```http
GET https://livepeer.studio/api/playback/{playbackId}
Authorization: Bearer YOUR_API_KEY
```

Response includes `type` (`live` | `vod` | `recording`) and `meta.source[]` with HLS URL, WebRTC URL, and thumbnail. You can pass the result to `getSrc(playbackInfo)` from `@livepeer/react/external` and use it with `Player.Root` from `@livepeer/react/player`.

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
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 30,
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

### Spritz app configuration

The Spritz app creates streams with three profiles (no `fpsDen`, `quality`, `gop`, or `profile`). This matches `lib/livepeer.ts` in the app.

| Name | Resolution | Bitrate |
|------|------------|---------|
| 720p | 1280×720 | 2 Mbps |
| 480p | 854×480 | 1 Mbps |
| 360p | 640×360 | 0.5 Mbps |

```typescript
// Spritz app: lib/livepeer.ts createLivepeerStream body
profiles: [
    { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
    { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
    { name: "360p", bitrate: 500000, fps: 30, width: 640, height: 360 },
],
```

### Livepeer API profile options (optional)

For more control, the Livepeer API supports `fpsDen` (default 1), `quality` (0–44), `gop`, and `profile` (H264Baseline, H264Main, H264High, H264ConstrainedHigh). Minimum width/height 128, bitrate ≥ 400. See the Livepeer API Reference section above.

### Adaptive Bitrate (ABR)

The HLS manifest includes all renditions. Players (e.g. hls.js, Livepeer Player) select the best quality based on:
- Available bandwidth
- Device capabilities
- Buffer health

### Video and Audio Codecs

| Role | Codec | Notes |
|------|-------|--------|
| Transcode output | H.264 (AVC) | profile: H264Baseline / H264Main / H264High |
| Recording output | H.264, HEVC, VP8, VP9 | via recordingSpec.profiles[].encoder |
| Audio | AAC | 48 kHz typical; set by transcoder |

---

## Recording (VOD)

### Automatic Recording (Spritz app)

The Spritz app sets `record: true` on stream creation and does not pass a custom `recordingSpec`; Livepeer uses default recording settings. Recorded assets are created after the stream ends; processing may take a few minutes. The app fetches assets via `GET /stream/{streamId}/assets` and maps them to `playbackUrl`, `downloadUrl`, `status`, `videoSpec`, and `size`.

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

:::info Livepeer Asset API
Recordings are exposed as **assets** in Livepeer. Spritz maps stream recordings to `GET /api/streams/:id/assets`. Livepeer also provides Asset API endpoints (create, get, list, delete) and stream session/recording retrieval. See [Livepeer API Reference](https://docs.livepeer.org/api-reference/overview/introduction).
:::

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
// POST /api/streams - Create stream (calls createLivepeerStream, saves stream_id, stream_key, playback_id)
// GET /api/streams - List user's streams (live check uses getLivepeerStream(stream.stream_id))
// GET /api/streams/[id] - Get stream details (live check: getLivepeerStream(stream.stream_id))
// DELETE /api/streams/[id] - Delete stream (calls deleteLivepeerStream(stream.stream_id))
// GET /api/streams/[id]/assets - Get recordings (getLivepeerStreamAssets(stream.stream_id))

// Public stream access
// GET /api/public/streams/[id] - Get public stream info (live check must use stream_id, not playback_id)
```

When implementing live status for a stream, query Livepeer with the **stream_id** (e.g. `getLivepeerStream(stream.stream_id)`). Do not use `playback_id`; the Livepeer GET stream endpoint expects the stream ID.

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

---

## Next Steps

- [Streaming API Reference](/docs/api/streaming) — Spritz stream endpoints
- [Streaming Technical Deep Dive](/docs/streaming/technical) — Flow, states, viewer tracking
- [Livepeer Documentation](https://docs.livepeer.org/) — API reference, SDKs, WHIP/WHEP, playback
- [Livepeer In-Browser Broadcasting](https://docs.livepeer.org/developers/guides/livestream-from-browser) — WebRTC/WHIP, getIngest, regional ingest
- [Livepeer Playback](https://docs.livepeer.org/developers/guides/playback-a-livestream) — Playback Info, HLS, WebRTC WHEP

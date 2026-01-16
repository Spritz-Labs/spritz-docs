---
title: Video Calls (Huddle01)
description: Deep dive into Spritz video calls powered by Huddle01. Learn about WebRTC, room management, media controls, and group calls.
keywords:
    [
        video calls,
        Huddle01,
        WebRTC,
        peer-to-peer,
        decentralized,
        real-time communication,
        group calls,
    ]
sidebar_label: Video Calls
sidebar_position: 5
---

# Video Calls (Huddle01)

Spritz uses [Huddle01](https://huddle01.com/) for decentralized video and audio calls. Huddle01 provides high-quality WebRTC-based communication with optional recording and low latency.

## Overview

### Architecture

```
┌──────────────┐                              ┌──────────────┐
│   User A     │                              │   User B     │
│  (Browser)   │                              │  (Browser)   │
│              │                              │              │
│  ┌────────┐  │      ┌──────────────┐       │  ┌────────┐  │
│  │Camera  │──┼─────▶│   Huddle01   │◀──────┼──│Camera  │  │
│  │Mic     │  │      │    SFU       │       │  │Mic     │  │
│  │Screen  │  │      │  (Selective  │       │  │Screen  │  │
│  └────────┘  │      │  Forwarding  │       │  └────────┘  │
│              │      │    Unit)     │       │              │
│  ┌────────┐  │      └──────────────┘       │  ┌────────┐  │
│  │Speaker │◀─┼──────────────────────────────┼──│Speaker │  │
│  │Display │  │                              │  │Display │  │
│  └────────┘  │                              │  └────────┘  │
└──────────────┘                              └──────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Room** | Virtual meeting space with unique ID |
| **SFU** | Selective Forwarding Unit - routes media between peers |
| **Track** | Individual audio/video stream (mic, camera, screen) |
| **Producer** | Client sending media |
| **Consumer** | Client receiving media |

---

## Configuration

### Environment Variables

```env
# Client-side (Project ID only)
NEXT_PUBLIC_HUDDLE01_PROJECT_ID=your_project_id

# Server-side (for room creation and tokens)
HUDDLE01_API_KEY=your_api_key
```

### Checking Configuration

```typescript
// config/huddle01.ts
export const huddle01ProjectId = process.env.NEXT_PUBLIC_HUDDLE01_PROJECT_ID || "";
export const isHuddle01Configured = !!huddle01ProjectId;
```

---

## Room Management

### Creating a Room

Rooms must be created server-side using the API key:

```typescript
// POST /api/huddle01/room
import { NextRequest, NextResponse } from "next/server";

const HUDDLE01_API_KEY = process.env.HUDDLE01_API_KEY || "";

export async function POST(request: NextRequest) {
    if (!HUDDLE01_API_KEY) {
        return NextResponse.json(
            { error: "Huddle01 API key not configured" },
            { status: 500 }
        );
    }

    const { title, hostWallet } = await request.json();

    const response = await fetch(
        "https://api.huddle01.com/api/v2/sdk/rooms/create-room",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": HUDDLE01_API_KEY,
            },
            body: JSON.stringify({
                roomLocked: false,
                metadata: {
                    title: title || "Spritz Call",
                    hostWallets: hostWallet ? [hostWallet] : [],
                },
            }),
        }
    );

    if (!response.ok) {
        return NextResponse.json(
            { error: `Failed to create room: ${response.status}` },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json({ roomId: data.data.roomId });
}
```

### Generating Access Tokens

```typescript
// POST /api/huddle01/token
import { AccessToken, Role } from "@huddle01/server-sdk/auth";

export async function POST(request: NextRequest) {
    const { roomId, userAddress, displayName } = await request.json();

    if (!roomId || !userAddress) {
        return NextResponse.json(
            { error: "roomId and userAddress are required" },
            { status: 400 }
        );
    }

    const accessToken = new AccessToken({
        apiKey: HUDDLE01_API_KEY,
        roomId: roomId,
        role: Role.HOST,
        permissions: {
            admin: true,
            canConsume: true,
            canProduce: true,
            canProduceSources: {
                cam: true,
                mic: true,
                screen: true,
            },
            canRecvData: true,
            canSendData: true,
            canUpdateMetadata: true,
        },
        options: {
            metadata: {
                displayName: displayName || userAddress.slice(0, 10),
                walletAddress: userAddress,
            },
        },
    });

    const token = await accessToken.toJwt();
    return NextResponse.json({ token });
}
```

### Client-side Room Helpers

```typescript
// Create room via API
export async function createHuddle01Room(
    title: string = "Spritz Call"
): Promise<{ roomId: string } | null> {
    try {
        const response = await fetch("/api/huddle01/room", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        return { roomId: data.roomId };
    } catch (error) {
        console.error("[Huddle01] Error creating room:", error);
        return null;
    }
}

// Get access token
export async function getHuddle01Token(
    roomId: string,
    userAddress: string,
    displayName?: string
): Promise<string | null> {
    try {
        const response = await fetch("/api/huddle01/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, userAddress, displayName }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error("[Huddle01] Error getting token:", error);
        return null;
    }
}
```

---

## Call Implementation

### State Management

```typescript
export type CallState = "idle" | "joining" | "connected" | "leaving" | "error";
export type CallType = "audio" | "video";

export type Huddle01CallState = {
    callState: CallState;
    callType: CallType;
    isMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    isRemoteMuted: boolean;
    isRemoteVideoOff: boolean;
    isRemoteScreenSharing: boolean;
    error: string | null;
    duration: number;
    roomId: string | null;
};
```

### Initializing the Client

```typescript
import { HuddleClient } from "@huddle01/web-core";

let huddleClient: HuddleClient | null = null;

async function initializeHuddle01(): Promise<HuddleClient> {
    const { HuddleClient } = await import("@huddle01/web-core");
    
    huddleClient = new HuddleClient({
        projectId: huddle01ProjectId,
    });
    
    return huddleClient;
}
```

### Joining a Room

```typescript
async function joinRoom(
    roomId: string,
    userAddress: string,
    displayName?: string,
    callType: CallType = "video"
): Promise<boolean> {
    try {
        // Get access token
        const token = await getHuddle01Token(roomId, userAddress, displayName);
        if (!token) {
            throw new Error("Failed to get access token");
        }

        // Initialize client if needed
        if (!huddleClient) {
            huddleClient = await initializeHuddle01();
        }

        // Join the room
        await huddleClient.joinRoom({
            roomId,
            token,
        });

        // Enable media based on call type
        if (callType === "video") {
            await huddleClient.localPeer.enableVideo();
        }
        await huddleClient.localPeer.enableAudio();

        return true;
    } catch (error) {
        console.error("[Huddle01] Failed to join room:", error);
        return false;
    }
}
```

### Leaving a Room

```typescript
async function leaveRoom(): Promise<void> {
    if (!huddleClient) return;

    try {
        // Disable media first
        await huddleClient.localPeer.disableVideo();
        await huddleClient.localPeer.disableAudio();
        
        // Leave room
        await huddleClient.leaveRoom();
    } catch (error) {
        console.error("[Huddle01] Error leaving room:", error);
    }
}
```

---

## Media Controls

### Audio Control

```typescript
async function toggleMute(): Promise<boolean> {
    if (!huddleClient) return false;

    try {
        const isMuted = huddleClient.localPeer.isMicMuted;
        
        if (isMuted) {
            await huddleClient.localPeer.enableAudio();
        } else {
            await huddleClient.localPeer.disableAudio();
        }
        
        return !isMuted; // Return new muted state
    } catch (error) {
        console.error("[Huddle01] Toggle mute error:", error);
        return false;
    }
}
```

### Video Control

```typescript
async function toggleVideo(): Promise<boolean> {
    if (!huddleClient) return false;

    try {
        const isVideoOff = !huddleClient.localPeer.isCamOn;
        
        if (isVideoOff) {
            await huddleClient.localPeer.enableVideo();
        } else {
            await huddleClient.localPeer.disableVideo();
        }
        
        return isVideoOff; // Return new video state (true = on)
    } catch (error) {
        console.error("[Huddle01] Toggle video error:", error);
        return false;
    }
}
```

### Screen Sharing

```typescript
async function startScreenShare(): Promise<boolean> {
    if (!huddleClient) return false;

    try {
        await huddleClient.localPeer.enableScreen();
        return true;
    } catch (error) {
        console.error("[Huddle01] Screen share error:", error);
        return false;
    }
}

async function stopScreenShare(): Promise<void> {
    if (!huddleClient) return;

    try {
        await huddleClient.localPeer.disableScreen();
    } catch (error) {
        console.error("[Huddle01] Stop screen share error:", error);
    }
}
```

---

## Handling Remote Peers

### Event Listeners

```typescript
function setupPeerEventListeners(): void {
    if (!huddleClient) return;

    // New peer joined
    huddleClient.room.on("peer-joined", (peer) => {
        console.log("[Huddle01] Peer joined:", peer.peerId);
        // Update UI to show new participant
    });

    // Peer left
    huddleClient.room.on("peer-left", (peer) => {
        console.log("[Huddle01] Peer left:", peer.peerId);
        // Remove from UI
    });

    // New track available
    huddleClient.room.on("new-consumer", (consumer) => {
        console.log("[Huddle01] New track:", consumer.kind, consumer.peerId);
        
        if (consumer.kind === "video") {
            // Attach video track to video element
            attachVideoTrack(consumer.peerId, consumer.track);
        } else if (consumer.kind === "audio") {
            // Attach audio track
            attachAudioTrack(consumer.peerId, consumer.track);
        }
    });

    // Track closed
    huddleClient.room.on("consumer-closed", (consumer) => {
        console.log("[Huddle01] Track closed:", consumer.kind, consumer.peerId);
        // Remove from UI
    });
}
```

### Attaching Video Tracks

```typescript
function attachVideoTrack(peerId: string, track: MediaStreamTrack): void {
    const videoContainer = document.getElementById("remote-video-container");
    if (!videoContainer) return;

    // Create video element
    const stream = new MediaStream([track]);
    const videoEl = document.createElement("video");
    videoEl.srcObject = stream;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.muted = false;
    videoEl.dataset.peerId = peerId;
    videoEl.style.width = "100%";
    videoEl.style.height = "100%";
    videoEl.style.objectFit = "cover";
    videoEl.style.borderRadius = "12px";
    
    videoContainer.appendChild(videoEl);
    
    videoEl.play().catch(e => console.warn("Video play failed:", e));
}

function removeVideoTrack(peerId: string): void {
    const videoEl = document.querySelector(`video[data-peer-id="${peerId}"]`);
    if (videoEl) {
        const stream = (videoEl as HTMLVideoElement).srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        videoEl.remove();
    }
}
```

---

## Group Calls

### Multi-peer Support

```typescript
// Track video elements per peer
const peerVideoElements = new Map<string, HTMLVideoElement>();

function addRemoteVideoForPeer(peerId: string, track: MediaStreamTrack): void {
    const container = document.getElementById("remote-videos");
    if (!container) return;

    // Check if we already have a video for this peer
    let videoEl = peerVideoElements.get(peerId);
    
    if (videoEl) {
        // Update existing element
        const stream = new MediaStream([track]);
        videoEl.srcObject = stream;
    } else {
        // Create new element
        const stream = new MediaStream([track]);
        videoEl = document.createElement("video");
        videoEl.srcObject = stream;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.dataset.peerId = peerId;
        
        container.appendChild(videoEl);
        peerVideoElements.set(peerId, videoEl);
    }
    
    videoEl.play().catch(e => console.warn("Video play failed:", e));
}

function removeRemoteVideoForPeer(peerId: string): void {
    const videoEl = peerVideoElements.get(peerId);
    if (videoEl) {
        const stream = videoEl.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
        videoEl.srcObject = null;
        videoEl.remove();
        peerVideoElements.delete(peerId);
    }
}
```

### Grid Layout

```tsx
// Dynamic grid layout based on participant count
function CallGrid({ participants }: { participants: Peer[] }) {
    const gridClass = useMemo(() => {
        const count = participants.length;
        if (count <= 1) return "grid-cols-1";
        if (count <= 4) return "grid-cols-2";
        if (count <= 9) return "grid-cols-3";
        return "grid-cols-4";
    }, [participants.length]);

    return (
        <div className={`grid ${gridClass} gap-2 w-full h-full`}>
            {participants.map(peer => (
                <div key={peer.peerId} className="relative aspect-video">
                    <video
                        ref={el => attachPeerVideo(peer.peerId, el)}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                        {peer.metadata?.displayName || peer.peerId.slice(0, 8)}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

---

## Call Duration Tracking

```typescript
const [duration, setDuration] = useState(0);
const startTimeRef = useRef<number | null>(null);
const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

function startDurationTimer(): void {
    startTimeRef.current = Date.now();
    
    durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
            setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
    }, 1000);
}

function stopDurationTimer(): void {
    if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
    }
    startTimeRef.current = null;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}
```

---

## Deterministic Room IDs

For 1-on-1 calls, generate deterministic room IDs:

```typescript
function generateRoomId(address1: string, address2: string): string {
    // Sort addresses for consistency
    const sorted = [address1.toLowerCase(), address2.toLowerCase()].sort();
    return `spritz-${sorted[0].slice(2, 10)}-${sorted[1].slice(2, 10)}`;
}
```

---

## Error Handling

```typescript
async function safeJoinRoom(
    roomId: string,
    userAddress: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Ensure we're not already in a call
        if (huddleClient?.room.isJoined) {
            await leaveRoom();
        }

        // Get token
        const token = await getHuddle01Token(roomId, userAddress);
        if (!token) {
            return { success: false, error: "Failed to get access token" };
        }

        // Initialize client
        if (!huddleClient) {
            huddleClient = await initializeHuddle01();
        }

        // Join with timeout
        const joinPromise = huddleClient.joinRoom({ roomId, token });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Join timeout")), 30000)
        );

        await Promise.race([joinPromise, timeoutPromise]);

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Huddle01] Join error:", message);
        return { success: false, error: message };
    }
}
```

---

## Cleanup

Proper cleanup is essential to avoid memory leaks:

```typescript
function cleanup(): void {
    // Stop duration timer
    stopDurationTimer();

    // Stop all media tracks
    if (huddleClient?.localPeer) {
        try {
            huddleClient.localPeer.disableVideo();
            huddleClient.localPeer.disableAudio();
            huddleClient.localPeer.disableScreen();
        } catch (e) {
            // Ignore errors during cleanup
        }
    }

    // Clear peer video elements
    peerVideoElements.forEach((videoEl, peerId) => {
        const stream = videoEl.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
        videoEl.srcObject = null;
        videoEl.remove();
    });
    peerVideoElements.clear();

    // Leave room
    if (huddleClient?.room.isJoined) {
        huddleClient.leaveRoom();
    }

    huddleClient = null;
}
```

---

## React Hook Example

```typescript
export function useHuddle01Call(userAddress: string | null) {
    const [state, setState] = useState<Huddle01CallState>({
        callState: "idle",
        callType: "audio",
        isMuted: false,
        isVideoOff: true,
        isScreenSharing: false,
        isRemoteMuted: false,
        isRemoteVideoOff: true,
        isRemoteScreenSharing: false,
        error: null,
        duration: 0,
        roomId: null,
    });

    const clientRef = useRef<HuddleClient | null>(null);

    const joinCall = useCallback(async (
        roomId: string,
        callType: CallType = "video"
    ) => {
        if (!userAddress) return;
        
        setState(prev => ({ ...prev, callState: "joining" }));

        const result = await safeJoinRoom(roomId, userAddress);
        
        if (result.success) {
            setState(prev => ({
                ...prev,
                callState: "connected",
                roomId,
                callType,
            }));
        } else {
            setState(prev => ({
                ...prev,
                callState: "error",
                error: result.error || "Failed to join",
            }));
        }
    }, [userAddress]);

    const leaveCall = useCallback(async () => {
        setState(prev => ({ ...prev, callState: "leaving" }));
        await leaveRoom();
        cleanup();
        setState({
            callState: "idle",
            callType: "audio",
            isMuted: false,
            isVideoOff: true,
            isScreenSharing: false,
            isRemoteMuted: false,
            isRemoteVideoOff: true,
            isRemoteScreenSharing: false,
            error: null,
            duration: 0,
            roomId: null,
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup();
    }, []);

    return {
        ...state,
        joinCall,
        leaveCall,
        toggleMute,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
    };
}
```

---

## Dependencies

```bash
npm install @huddle01/web-core @huddle01/server-sdk
```

```typescript
// Client-side
import { HuddleClient } from "@huddle01/web-core";

// Server-side
import { AccessToken, Role } from "@huddle01/server-sdk/auth";
```

---

## Next Steps

- [Livestreaming](/docs/developers/livestreaming) - Livepeer integration
- [Messaging](/docs/developers/messaging) - Logos messaging
- [API Reference](/docs/api/intro) - Complete API documentation

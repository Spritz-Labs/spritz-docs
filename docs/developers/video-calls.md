# Video Calls Technical Documentation

Complete technical documentation for implementing video calls in Spritz using Huddle01's WebRTC infrastructure.

## Protocol Overview

Spritz uses **Huddle01** for decentralized video calls with WebRTC.

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Signaling** | Huddle01 API v2 | Room creation & coordination |
| **Media Transport** | WebRTC | P2P audio/video streams |
| **Topology** | SFU (Selective Forwarding Unit) | Multi-party calls |
| **Auth** | JWT Access Tokens | Per-participant authorization |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Video Call Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Client A   │         │   Client B   │                  │
│  │  ┌────────┐  │         │  ┌────────┐  │                  │
│  │  │ Camera │  │         │  │ Camera │  │                  │
│  │  │  +Mic  │  │         │  │  +Mic  │  │                  │
│  │  └────┬───┘  │         │  └────┬───┘  │                  │
│  │       │      │         │       │      │                  │
│  │  ┌────▼───┐  │         │  ┌────▼───┐  │                  │
│  │  │ WebRTC │  │         │  │ WebRTC │  │                  │
│  │  │  Peer  │  │         │  │  Peer  │  │                  │
│  │  └────┬───┘  │         │  └────┬───┘  │                  │
│  └───────┼──────┘         └───────┼──────┘                  │
│          │                        │                          │
│          └──────────┬─────────────┘                         │
│                     │                                        │
│               ┌─────▼─────┐                                  │
│               │ Huddle01  │                                  │
│               │    SFU    │                                  │
│               │  Server   │                                  │
│               └───────────┘                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Room Management

### Create Room

```typescript
// POST /api/huddle01/room
const HUDDLE01_API_KEY = process.env.HUDDLE01_API_KEY;

export async function POST(request: NextRequest) {
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

    const data = await response.json();
    return NextResponse.json({ roomId: data.data.roomId });
}
```

### Room Response

```typescript
interface RoomResponse {
    data: {
        roomId: string;  // e.g., "abc-defg-hijk"
    };
}
```

---

## Token Generation

Access tokens authorize participants to join rooms with specific permissions.

### Token Structure

```typescript
import { AccessToken, Role } from "@huddle01/server-sdk/auth";

const accessToken = new AccessToken({
    apiKey: HUDDLE01_API_KEY,
    roomId: roomId,
    role: Role.HOST,           // or Role.GUEST, Role.CO_HOST
    permissions: {
        admin: true,            // Can manage room
        canConsume: true,       // Can receive media
        canProduce: true,       // Can send media
        canProduceSources: {
            cam: true,          // Camera permission
            mic: true,          // Microphone permission
            screen: true,       // Screen share permission
        },
        canRecvData: true,      // Receive data channels
        canSendData: true,      // Send data channels
        canUpdateMetadata: true,// Update participant metadata
    },
    options: {
        metadata: {
            displayName: displayName,
            walletAddress: userAddress,
        },
    },
});

const jwt = await accessToken.toJwt();
```

### Token API Endpoint

```typescript
// POST /api/huddle01/token
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
            canProduceSources: { cam: true, mic: true, screen: true },
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

---

## Client Integration

### React Hook

```typescript
// hooks/useHuddle01Call.ts
import { useRoom, useLocalVideo, useLocalAudio } from "@huddle01/react/hooks";

export function useHuddle01Call() {
    const { joinRoom, leaveRoom, state: roomState } = useRoom();
    const { stream: videoStream, enableVideo, disableVideo, isVideoOn } = useLocalVideo();
    const { stream: audioStream, enableAudio, disableAudio, isAudioOn } = useLocalAudio();

    const startCall = async (roomId: string, token: string) => {
        await joinRoom({ roomId, token });
    };

    const endCall = async () => {
        await leaveRoom();
    };

    const toggleVideo = () => {
        isVideoOn ? disableVideo() : enableVideo();
    };

    const toggleAudio = () => {
        isAudioOn ? disableAudio() : enableAudio();
    };

    return {
        roomState,
        videoStream,
        audioStream,
        isVideoOn,
        isAudioOn,
        startCall,
        endCall,
        toggleVideo,
        toggleAudio,
    };
}
```

### Call Component

```tsx
import { Video, Audio } from "@huddle01/react/components";

function VideoCall({ roomId }: { roomId: string }) {
    const {
        roomState,
        videoStream,
        isVideoOn,
        isAudioOn,
        startCall,
        endCall,
        toggleVideo,
        toggleAudio,
    } = useHuddle01Call();

    useEffect(() => {
        const initCall = async () => {
            // Get token from API
            const res = await fetch("/api/huddle01/token", {
                method: "POST",
                body: JSON.stringify({ roomId, userAddress }),
            });
            const { token } = await res.json();
            
            await startCall(roomId, token);
        };
        
        initCall();
        return () => { endCall(); };
    }, [roomId]);

    return (
        <div className="video-call">
            {/* Local video preview */}
            {videoStream && (
                <Video stream={videoStream} className="local-video" />
            )}
            
            {/* Remote participants */}
            <RemoteParticipants />
            
            {/* Controls */}
            <div className="controls">
                <button onClick={toggleVideo}>
                    {isVideoOn ? "Camera Off" : "Camera On"}
                </button>
                <button onClick={toggleAudio}>
                    {isAudioOn ? "Mute" : "Unmute"}
                </button>
                <button onClick={endCall}>End Call</button>
            </div>
        </div>
    );
}
```

---

## WebRTC Configuration

### ICE Configuration

Huddle01 manages ICE servers automatically. No manual STUN/TURN configuration required.

### Codec Support

| Media Type | Codec | Bitrate Range |
|------------|-------|---------------|
| **Video** | VP8, VP9 | 500kbps - 2.5Mbps |
| **Audio** | Opus | 32kbps - 128kbps |

### Network Adaptation

Huddle01's SFU automatically handles:
- Bandwidth estimation
- Resolution scaling (simulcast)
- Packet loss recovery
- Jitter buffering

---

## Permissions

### Role Hierarchy

| Role | Permissions |
|------|-------------|
| `HOST` | Full control, can manage room |
| `CO_HOST` | Can moderate, but not close room |
| `GUEST` | Can participate, limited control |
| `LISTENER` | Can only receive, no producing |

### Permission Matrix

| Permission | HOST | CO_HOST | GUEST | LISTENER |
|------------|------|---------|-------|----------|
| `admin` | ✅ | ❌ | ❌ | ❌ |
| `canConsume` | ✅ | ✅ | ✅ | ✅ |
| `canProduce` | ✅ | ✅ | ✅ | ❌ |
| `canProduceSources.cam` | ✅ | ✅ | ✅ | ❌ |
| `canProduceSources.mic` | ✅ | ✅ | ✅ | ❌ |
| `canProduceSources.screen` | ✅ | ✅ | ✅ | ❌ |
| `canSendData` | ✅ | ✅ | ✅ | ❌ |
| `canRecvData` | ✅ | ✅ | ✅ | ✅ |
| `canUpdateMetadata` | ✅ | ✅ | ✅ | ❌ |

---

## Call Types

### 1:1 Calls

```typescript
// Direct call to a friend
async function startDirectCall(friendAddress: string) {
    // Create room
    const roomRes = await fetch("/api/huddle01/room", {
        method: "POST",
        body: JSON.stringify({ 
            title: `Call with ${friendAddress}`,
            hostWallet: myAddress,
        }),
    });
    const { roomId } = await roomRes.json();
    
    // Notify friend (via messaging)
    await sendMessage(friendAddress, {
        type: "call_invite",
        roomId,
    });
    
    // Join room
    await joinCall(roomId);
}
```

### Group Calls

```typescript
// Group call (channel or group chat)
async function startGroupCall(groupId: string, members: string[]) {
    const roomRes = await fetch("/api/huddle01/room", {
        method: "POST",
        body: JSON.stringify({ 
            title: `Group Call`,
            hostWallet: myAddress,
        }),
    });
    const { roomId } = await roomRes.json();
    
    // Notify all members
    for (const member of members) {
        await sendMessage(member, {
            type: "group_call_invite",
            roomId,
            groupId,
        });
    }
    
    await joinCall(roomId);
}
```

---

## Scheduled Calls

### Room Persistence

Permanent rooms can be created for scheduled meetings:

```typescript
// Create permanent room
const response = await fetch("/api/rooms/permanent", {
    method: "POST",
    body: JSON.stringify({
        title: "Weekly Standup",
        code: "weekly-standup-abc",
    }),
});

// Store room code for later access
const { roomId, code } = await response.json();
```

### Join via Code

```typescript
// Join existing room by code
const joinUrl = `https://app.spritz.chat/room/${code}`;
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Token expired` | JWT past expiration | Generate new token |
| `Room not found` | Invalid roomId | Create new room |
| `Permission denied` | Insufficient role | Check token permissions |
| `Media access denied` | Browser blocked camera/mic | Request user permission |

### Error Recovery

```typescript
async function joinCallWithRetry(roomId: string, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const token = await getToken(roomId);
            await joinRoom({ roomId, token });
            return;
        } catch (error) {
            if (error.message.includes("Token expired")) {
                // Retry with fresh token
                continue;
            }
            throw error;
        }
    }
    throw new Error("Failed to join call after retries");
}
```

---

## Media Quality Settings

### Video Quality Presets

```typescript
const VIDEO_PRESETS = {
    low: { width: 320, height: 180, frameRate: 15 },
    medium: { width: 640, height: 360, frameRate: 24 },
    high: { width: 1280, height: 720, frameRate: 30 },
};

// Request specific quality
await enableVideo({
    constraints: VIDEO_PRESETS.medium,
});
```

### Adaptive Quality

```typescript
// Huddle01 automatically adjusts quality based on:
// - Network bandwidth
// - CPU usage
// - Number of participants
```

---

## Security

### Call Encryption

All WebRTC media is encrypted using:
- **DTLS**: Key exchange
- **SRTP**: Media encryption

### Room Security

| Feature | Implementation |
|---------|----------------|
| **Access Control** | JWT tokens with expiration |
| **Host Verification** | Wallet address in metadata |
| **Room Locking** | `roomLocked: true` option |

---

## Best Practices

### Performance

1. **Disable video** when not needed (audio-only mode)
2. **Use simulcast** for multi-party calls (automatic)
3. **Limit participants** to 10-15 for optimal quality
4. **Monitor network** and adjust quality dynamically

### UX

1. **Show connection state** (connecting, connected, reconnecting)
2. **Indicate mute status** clearly
3. **Provide fallback** for media access errors
4. **Test microphone/camera** before joining

### Integration

```typescript
// Complete call flow
const callFlow = {
    1: "Create room (server-side)",
    2: "Generate tokens for participants",
    3: "Join room with token",
    4: "Enable media (camera/mic)",
    5: "Handle participant events",
    6: "Leave room on disconnect",
};
```

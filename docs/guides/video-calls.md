# Video Calls Guide

Spritz provides high-quality video and voice calls powered by **Huddle01**, supporting both one-on-one and group calls.

## Overview

Video calls in Spritz support:
- **HD Video**: High-quality video streaming
- **Crystal Clear Audio**: Optimized audio codecs
- **Group Calls**: Multi-party video conferences
- **Screen Sharing**: Share your screen during calls
- **Recording**: Record calls for later review (coming soon)

## Starting a Call

### One-on-One Calls

1. Open a chat with a friend
2. Click the video call button
3. Allow camera and microphone access
4. Wait for the friend to answer
5. Start your conversation!

### Group Calls

1. Create or open a group
2. Click "Start Group Call"
3. Invite group members
4. All members can join when ready

### Instant Rooms

Create temporary rooms for quick calls:

1. Click "Create Instant Room"
2. Share the room code or link
3. Anyone with the code can join
4. Room expires after inactivity

### Permanent Rooms

Create persistent rooms for recurring calls:

1. Create a permanent room
2. Get a permanent room code
3. Share with team members
4. Room stays active indefinitely

## Call Features

### Video Controls

- **Mute/Unmute**: Toggle microphone
- **Video On/Off**: Toggle camera
- **Screen Share**: Share your screen
- **Leave Call**: End your participation

### Audio Settings

- **Microphone Selection**: Choose input device
- **Speaker Selection**: Choose output device
- **Audio Quality**: Adjust based on connection

### Video Settings

- **Camera Selection**: Choose video input
- **Video Quality**: Auto-adjusts based on bandwidth
- **Background Blur**: Blur background (if supported)

## Technical Details

### Huddle01 Integration

Spritz uses Huddle01 SDK for video calls:
- **WebRTC**: Real-time peer-to-peer connections
- **SFU Architecture**: Selective Forwarding Unit for scalability
- **Adaptive Bitrate**: Automatically adjusts quality
- **Low Latency**: Optimized for real-time communication

### Network Requirements

- **Upload**: Minimum 1 Mbps for video
- **Download**: Minimum 2 Mbps for receiving
- **Latency**: < 150ms for best experience
- **Stability**: Stable connection recommended

### Codecs

- **Video**: VP8, VP9, H.264
- **Audio**: Opus
- **Adaptive**: Automatically selects best codec

## Call States

- **Idle**: Call not started
- **Connecting**: Establishing connection
- **Connected**: Active call
- **Disconnected**: Call ended
- **Failed**: Connection error

## Best Practices

1. **Stable Connection**: Use wired connection when possible
2. **Good Lighting**: Ensure adequate lighting for video
3. **Quiet Environment**: Minimize background noise
4. **Bandwidth**: Close other bandwidth-intensive apps
5. **Testing**: Test your setup before important calls

## Troubleshooting

### No Video/Audio

- Check browser permissions
- Verify camera/microphone are not in use elsewhere
- Try refreshing the page
- Check device settings

### Poor Quality

- Check internet connection speed
- Close other bandwidth-intensive apps
- Try reducing video quality
- Move closer to router

### Connection Issues

- Check firewall settings
- Verify WebRTC is not blocked
- Try different network
- Check Huddle01 service status

### Can't Join Call

- Verify room code is correct
- Check if room is still active
- Ensure you have permissions
- Try refreshing connection

## API Reference

### Create Room

```typescript
POST /api/huddle01/room
{
  "type": "instant" | "permanent",
  "name": "Room Name"
}
```

### Get Room Token

```typescript
POST /api/rooms/:code/token
{
  "userAddress": "0x..."
}
```

### Get Call History

```typescript
GET /api/calls?userAddress=0x...
```

## Next Steps

- Learn about [Messaging](/docs/guides/messaging)
- Explore [Groups](/docs/guides/groups)
- Check out [Livestreaming](/docs/streaming/technical)


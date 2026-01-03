# Livestreaming

Spritz includes built-in livestreaming capabilities powered by Livepeer, allowing you to broadcast live video to your friends.

## Overview

Livestreaming in Spritz enables you to:
- Broadcast live video streams
- Share streams with friends
- Automatically record streams
- View real-time viewer counts
- Watch streams from friends

## Going Live

### Starting a Stream

1. Click the "Go Live" button on your dashboard
2. Allow camera and microphone access when prompted
3. Add an optional title for your stream
4. Click "Go Live" to start broadcasting
5. Your friends will see a red "LIVE" badge on your avatar

### Stream Settings

- **Title**: Optional title for your stream
- **Description**: Optional description (future feature)
- **Resolution**: Fixed at 1080x1920 (9:16 vertical/portrait)
- **Quality**: Adaptive streaming based on connection

## Watching Streams

### Finding Live Streams

- Friends who are live show a red "LIVE" badge on their avatar
- Tap their avatar to join the stream
- View real-time viewer count
- Streams auto-retry if connection drops

### Stream Player

The stream player includes:
- Full-screen mode
- Viewer count display
- Automatic reconnection on network issues
- HLS adaptive streaming

## Technical Details

### Broadcasting

- **Protocol**: WebRTC via WHIP (WebRTC-HTTP Ingestion Protocol)
- **Platform**: Livepeer
- **Resolution**: 1080x1920 (9:16 vertical/portrait)
- **Codec**: H.264

### Playback

- **Protocol**: HLS (HTTP Live Streaming)
- **CDN**: Livepeer CDN
- **Adaptive**: Automatically adjusts quality based on connection
- **Latency**: Low-latency streaming

### Recording

- **Automatic**: Streams are automatically recorded
- **Storage**: Recordings stored on Livepeer
- **Access**: View recordings in your stream history
- **Format**: HLS playback format

## Stream States

- **idle**: Stream created but not started
- **live**: Currently broadcasting
- **ended**: Stream has ended

## API Usage

### Creating a Stream

```typescript
const response = await fetch('/api/streams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Stream',
  }),
});

const stream = await response.json();
```

### Starting a Stream

```typescript
const response = await fetch(`/api/streams/${streamId}/start`, {
  method: 'POST',
});

const { stream_key, playback_id } = await response.json();
```

### Getting Stream Info

```typescript
const response = await fetch(`/api/streams/${streamId}`);
const stream = await response.json();
```

## Best Practices

1. **Stable Connection**: Use a stable internet connection for best quality
2. **Lighting**: Ensure good lighting for better video quality
3. **Audio**: Use a good microphone for clear audio
4. **Title**: Add descriptive titles to help viewers find your stream
5. **Testing**: Test your setup before going live

## Troubleshooting

### Camera/Microphone Not Working

- Check browser permissions
- Ensure no other app is using the camera/mic
- Try refreshing the page

### Stream Not Starting

- Verify your Livepeer API key is correct
- Check your internet connection
- Look for errors in the browser console

### Playback Issues

- Check your internet connection
- Try refreshing the page
- Verify the stream is actually live

### Recording Not Available

- Recordings may take a few minutes to process
- Check your stream history
- Verify the stream ended properly

## Technical Deep Dive

For detailed technical information, see [Livestreaming - Technical Deep Dive](/docs/streaming/technical).

## Next Steps

- Learn about [Streaming Technical Details](/docs/streaming/technical)
- Check out the [API Reference](/docs/api/intro)
- Explore the [Getting Started Guide](/docs/getting-started)


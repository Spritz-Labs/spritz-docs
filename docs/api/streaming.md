# Streaming API Reference

Complete API reference for livestreaming functionality in Spritz.

## Base URL

```
https://app.spritz.chat/api/streams
```

## Authentication

All endpoints require authentication unless otherwise noted. Include credentials in fetch requests:

```typescript
const response = await fetch('https://app.spritz.chat/api/streams', {
    credentials: 'include', // Required for session cookies
    headers: {
        'Content-Type': 'application/json',
    },
});
```

See [API Introduction](/docs/api/intro#authentication) for complete authentication setup.

## Endpoints

### List Streams

```http
GET /api/streams?userAddress=0x...&live=true&limit=20
```

**Query Parameters:**
- `userAddress` (optional): Filter by user address
- `live` (optional): Filter to only live streams (`true`/`false`)
- `limit` (optional): Maximum results (default: 20)

**Response:**
```json
{
  "streams": [
    {
      "id": "uuid",
      "user_address": "0x...",
      "stream_id": "livepeer-stream-id",
      "stream_key": "stream-key",
      "playback_id": "playback-id",
      "title": "My Stream",
      "description": "Stream description",
      "status": "live",
      "viewer_count": 5,
      "started_at": "2026-01-15T14:30:00Z",
      "ended_at": null,
      "created_at": "2026-01-15T14:30:00Z",
      "playback_url": "https://livepeercdn.studio/hls/{id}/index.m3u8"
    }
  ]
}
```

### Create Stream

```http
POST /api/streams
```

**Request Body:**
```json
{
  "userAddress": "0x...",
  "title": "My Stream",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "stream": {
    "id": "uuid",
    "stream_id": "livepeer-stream-id",
    "stream_key": "stream-key",
    "playback_id": "playback-id",
    "rtmp_url": "rtmp://rtmp.livepeer.com/live/{key}",
    "playback_url": "https://livepeercdn.studio/hls/{id}/index.m3u8",
    "status": "idle"
  }
}
```

### Get Stream

```http
GET /api/streams/:id
```

**Response:**
```json
{
  "stream": {
    "id": "uuid",
    "user_address": "0x...",
    "stream_id": "livepeer-stream-id",
    "playback_id": "playback-id",
    "title": "Stream Title",
    "status": "live",
    "viewer_count": 10,
    "playback_url": "...",
    "started_at": "2026-01-15T14:30:00Z"
  }
}
```

### Delete Stream

```http
DELETE /api/streams/:id
```

**Response:**
```json
{
  "success": true
}
```

### Get Stream Assets (Recordings)

```http
GET /api/streams/:id/assets
```

**Response:**
```json
{
  "assets": [
    {
      "id": "asset-id",
      "playback_id": "playback-id",
      "playback_url": "https://livepeercdn.studio/hls/{id}/index.m3u8",
      "download_url": "https://livepeer.studio/api/asset/{id}/download",
      "status": {
        "phase": "ready",
        "progress": 100
      },
      "duration_seconds": 1234,
      "size_bytes": 12345678,
      "created_at": "2026-01-15T14:30:00Z"
    }
  ]
}
```

### Create Stream Asset

```http
POST /api/streams/:id/assets
```

Manually trigger asset creation for a stream.

### Get Stream Chat

```http
GET /api/streams/:id/chat?limit=50
```

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "user_address": "0x...",
      "content": "Hello!",
      "created_at": "2026-01-15T14:30:00Z"
    }
  ]
}
```

### Send Stream Chat Message

```http
POST /api/streams/:id/chat
```

**Request Body:**
```json
{
  "userAddress": "0x...",
  "message": "Hello stream!"
}
```

### Increment Viewer Count

```http
POST /api/streams/:id/viewers
```

**Request Body:**
```json
{
  "userAddress": "0x..."
}
```

### Decrement Viewer Count

```http
DELETE /api/streams/:id/viewers
```

**Request Body:**
```json
{
  "userAddress": "0x..."
}
```

## Public Endpoints

### Get Public Stream Info

```http
GET /api/public/streams/:id
```

No authentication required. Returns public stream information.

**Response:**
```json
{
  "stream": {
    "id": "uuid",
    "user_address": "0x...",
    "title": "Stream Title",
    "status": "live",
    "viewer_count": 10,
    "playback_url": "..."
  }
}
```

### Join Public Stream

```http
POST /api/public/streams/:id
```

Increments viewer count for public access.

### Leave Public Stream

```http
DELETE /api/public/streams/:id
```

Decrements viewer count.

## Error Responses

### 400 Bad Request

```json
{
  "error": "User address is required"
}
```

### 404 Not Found

```json
{
  "error": "Stream not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create stream on Livepeer"
}
```

## Stream States

- **idle**: Stream created but not started
- **live**: Currently broadcasting
- **ended**: Stream has ended

## Technical Details

### WebRTC Ingestion

Streams use WebRTC via WHIP protocol:
- **Ingest URL**: `https://livepeer.studio/webrtc/{streamKey}`
- **Protocol**: WHIP (WebRTC-HTTP Ingestion Protocol)
- **Resolution**: 1080x1920 (9:16 portrait)

### HLS Playback

Viewers receive HLS streams:
- **Playback URL**: `https://livepeercdn.studio/hls/{playbackId}/index.m3u8`
- **Protocol**: HLS (HTTP Live Streaming)
- **Adaptive**: Automatically adjusts quality

### Recording

Streams are automatically recorded:
- **Format**: HLS
- **Storage**: Livepeer
- **Processing**: May take a few minutes after stream ends

## Best Practices

1. **Error Handling**: Always handle stream creation errors
2. **Viewer Tracking**: Properly increment/decrement viewer counts
3. **Cleanup**: Delete unused streams
4. **Status Checks**: Verify stream status before operations
5. **Rate Limiting**: Respect API rate limits

## Next Steps

- Learn about [Streaming Technical Details](/docs/streaming/technical)
- Check out [API Overview](/docs/api/intro)
- Explore [Livestreaming Guide](/docs/streaming/technical)


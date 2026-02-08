---
title: Encrypted Media - Images and Voice Memos in DMs
description: "Technical specification for end-to-end encrypted images and voice memos in Spritz DMs. AES-GCM, message format, upload API, and client flow."
keywords:
    [
        Spritz,
        encrypted media,
        encrypted images,
        voice memos,
        AES-GCM,
        DMs,
        end-to-end encryption,
    ]
sidebar_label: Encrypted Media
sidebar_position: 12
---

# Encrypted Media - Images and Voice Memos in DMs

This document describes how Spritz implements **end-to-end encrypted images and voice memos** in direct messages (DMs). Media is encrypted **client-side** with the same per-conversation symmetric key used for text; only ciphertext is uploaded and stored. Recipients decrypt in the browser using their copy of the conversation key.

## Overview

| Media Type      | Encryption  | Key Source                    | Storage Bucket | Max Size |
| --------------- | ----------- | ----------------------------- | -------------- | -------- |
| **Images**      | AES-256-GCM | DM conversation symmetric key | `chat-images`  | 10 MB    |
| **Voice memos** | AES-256-GCM | DM conversation symmetric key | `chat-voice`   | 10 MB    |

-   **Key source:** The symmetric key for the DM conversation (from ECDH or legacy key derivation). Same key used to encrypt/decrypt text in that conversation.
-   **No server-side decryption:** The server and storage only see ciphertext; decryption happens only in the client with the conversation key.
-   **Public URLs:** Stored files are served via public URLs; this is safe because the content is encrypted and only parties with the conversation key can decrypt.

---

## Cryptography

### Algorithm

-   **Cipher:** AES-GCM (Galois/Counter Mode).
-   **Key size:** 256-bit (32 bytes). The key is the raw bytes of the conversation symmetric key (`Uint8Array`).
-   **IV (nonce):** 12 bytes, randomly generated per encryption. Stored **prepended** to the ciphertext (first 12 bytes of the uploaded blob).
-   **Tag:** GCM authentication tag is included in the ciphertext by the Web Crypto API (no separate field).

### Encrypted blob layout

Every uploaded file (image or voice) has the same binary layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  Byte 0–11   │  Byte 12 … N                                    │
├──────────────┼──────────────────────────────────────────────────┤
│  IV (12 B)   │  AES-GCM ciphertext (plaintext + 16 B auth tag)   │
└──────────────┴──────────────────────────────────────────────────┘
```

-   **IV:** 12 bytes, `crypto.getRandomValues(new Uint8Array(12))`.
-   **Ciphertext:** Result of `crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintextBuffer)`.

### Client-side encrypt (image)

```typescript
// lib/audioEncryption.ts
export async function encryptImage(
    imageBlob: Blob,
    encryptionKey: Uint8Array
): Promise<{ encryptedBlob: Blob; iv: string }> {
    const imageBuffer = await imageBlob.arrayBuffer();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyData = new Uint8Array(encryptionKey).buffer;
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const ivData = new Uint8Array(iv).buffer;
    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: ivData },
        cryptoKey,
        imageBuffer
    );

    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return {
        encryptedBlob: new Blob([combined], {
            type: "application/octet-stream",
        }),
        iv: btoa(String.fromCharCode(...iv)),
    };
}
```

### Client-side decrypt (image)

```typescript
export async function decryptImage(
    encryptedData: ArrayBuffer,
    encryptionKey: Uint8Array,
    mimeType: string = "image/jpeg"
): Promise<Blob> {
    const combined = new Uint8Array(encryptedData);
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(encryptionKey).buffer,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv).buffer },
        cryptoKey,
        new Uint8Array(encrypted).buffer
    );

    return new Blob([decryptedData], { type: mimeType });
}
```

Voice memo encryption/decryption uses the same structure; the only difference is the plaintext format (WebM/Opus for voice) and the returned blob type (`audio/webm`).

---

## Message format (stored in DM content)

Encrypted media is not stored as raw binary in the message; the message stores a **marker + URL** so the client can fetch and decrypt.

### Voice memo

-   **Format:** `[VOICE:{duration}]{url}`
-   **Example:** `[VOICE:5]https://...supabase.co/storage/v1/object/public/chat-voice/voice/0x.../abc123/1234567890_xyz.enc`
-   **Fields:** `duration` = length in seconds (integer); `url` = public URL of the encrypted blob.

```typescript
// lib/audioEncryption.ts
const VOICE_MESSAGE_PREFIX = "[VOICE:";

export function formatVoiceMessage(duration: number, url: string): string {
    return `${VOICE_MESSAGE_PREFIX}${duration}]${url}`;
}

export function parseVoiceMessage(
    content: string
): { duration: number; url: string } | null {
    const match = content.match(/^\[VOICE:(\d+)\](.+)$/);
    if (!match) return null;
    return { duration: parseInt(match[1], 10), url: match[2] };
}
```

### Encrypted image

-   **Format:** `[ENC_IMAGE:{mimeType}]{url}`
-   **Example:** `[ENC_IMAGE:image/jpeg]https://...supabase.co/storage/v1/object/public/chat-images/encrypted/0x.../abc123/1234567890_xyz.enc`
-   **Fields:** `mimeType` = original MIME type (e.g. `image/jpeg`, `image/png`); `url` = public URL of the encrypted blob.

```typescript
const ENCRYPTED_IMAGE_PREFIX = "[ENC_IMAGE:";

export function formatEncryptedImageMessage(
    mimeType: string,
    url: string
): string {
    return `${ENCRYPTED_IMAGE_PREFIX}${mimeType}]${url}`;
}

export function parseEncryptedImageMessage(
    content: string
): { mimeType: string; url: string } | null {
    const match = content.match(/^\[ENC_IMAGE:([^\]]+)\](.+)$/);
    if (!match) return null;
    return { mimeType: match[1], url: match[2] };
}
```

The DM message payload (e.g. in Waku or Supabase) stores this string as the message content; the actual media is only at the URL, in encrypted form.

---

## Upload API

### POST /api/upload/image

Uploads an **already-encrypted** image blob. The client must encrypt the image with the conversation key before calling this endpoint.

**Request**

-   **Method:** `POST`
-   **Content-Type:** `multipart/form-data`
-   **Body (FormData):**
    -   `file` (required): Encrypted blob, typically `application/octet-stream`. Filename convention: `image.enc`.
    -   `conversationId` (required): Conversation identifier (used to build storage path).
    -   `originalType` (optional): Original MIME type before encryption (e.g. `image/jpeg`). Returned in response for the message format.

**Constraints**

-   Max file size: **10 MB** (encrypted payload is slightly larger than raw).
-   Authentication: Session required (`getAuthenticatedUser`).
-   Rate limit: General tier.

**Storage path**

-   Bucket: `chat-images`.
-   Path: `encrypted/{userAddressLower}/{conversationHash}/{timestamp}_{randomId}.enc`
-   `conversationHash` = first 8 chars of base64url(conversationId).

**Response (200)**

```json
{
    "url": "https://...supabase.co/storage/v1/object/public/chat-images/encrypted/0x.../abc123/123_xyz.enc",
    "path": "encrypted/0x.../abc123/123_xyz.enc",
    "originalType": "image/jpeg"
}
```

The client then builds the message content as `formatEncryptedImageMessage(originalType, url)` and sends that string in the DM.

### POST /api/upload/voice

Uploads an **already-encrypted** voice memo blob.

**Request**

-   **Method:** `POST`
-   **Content-Type:** `multipart/form-data`
-   **Body (FormData):**
    -   `file` (required): Encrypted blob, typically `application/octet-stream`. Filename convention: `voice.enc`.
    -   `duration` (optional): Length in seconds (integer string). Stored for the message format.
    -   `conversationId` (required): Conversation identifier for storage path.

**Constraints**

-   Max file size: **10 MB** (~100 minutes at typical voice quality).
-   Authentication and rate limit: same as image upload.

**Storage path**

-   Bucket: `chat-voice`.
-   Path: `voice/{userAddressLower}/{conversationHash}/{timestamp}_{randomId}.enc`

**Response (200)**

```json
{
    "url": "https://...supabase.co/storage/v1/object/public/chat-voice/voice/0x.../abc123/123_xyz.enc",
    "path": "voice/0x.../abc123/123_xyz.enc",
    "duration": 5
}
```

The client builds the message content as `formatVoiceMessage(duration, url)` and sends that string in the DM.

---

## Client flow (send)

1. **Resolve key:** `encryptionKey = await getDmEncryptionKey(peerAddress)` (same API used for text encryption in that DM).
2. **Image:** User selects image → read as `Blob` → `encryptImage(imageBlob, encryptionKey)` → get `encryptedBlob` → `FormData.append("file", encryptedBlob, "image.enc")` + `conversationId` + `originalType` → `POST /api/upload/image` → get `url` and `originalType` → `content = formatEncryptedImageMessage(originalType, url)` → send message with `content`.
3. **Voice:** User records → get audio `Blob` (e.g. WebM/Opus) → `encryptAudio(audioBlob, encryptionKey)` → `FormData.append("file", encryptedBlob, "voice.enc")` + `conversationId` + `duration` → `POST /api/upload/voice` → get `url` and `duration` → `content = formatVoiceMessage(duration, url)` → send message with `content`.

---

## Client flow (receive)

1. **Incoming message:** Content is a string. If `content.startsWith("[ENC_IMAGE:")` then it's an encrypted image; if `content.startsWith("[VOICE:")` then it's a voice memo (encrypted if URL points to `.enc`).
2. **Parse:** `parseEncryptedImageMessage(content)` or `parseVoiceMessage(content)` → get `url` and (for image) `mimeType`.
3. **Resolve key:** Same `getDmEncryptionKey(peerAddress)` for the conversation.
4. **Fetch + decrypt:** `fetchAndDecryptImage(url, encryptionKey, mimeType)` or `fetchAndDecryptVoice(url, encryptionKey)` → returns a blob URL (e.g. `URL.createObjectURL(decryptedBlob)`) for rendering or playback.
5. **Display:** Use blob URL in `<img src={blobUrl} />` or `<audio src={blobUrl} />`. Revoke blob URL when no longer needed to avoid leaks.

---

## File structure (eth-akash)

| Path                                | Purpose                                                                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/audioEncryption.ts`        | `encryptAudio` / `decryptAudio`, `encryptImage` / `decryptImage`, `fetchAndDecryptVoice` / `fetchAndDecryptImage`, message format/parse for voice and encrypted image |
| `src/app/api/upload/image/route.ts` | `POST /api/upload/image` — store encrypted image in `chat-images`                                                                                                     |
| `src/app/api/upload/voice/route.ts` | `POST /api/upload/voice` — store encrypted voice in `chat-voice`                                                                                                      |
| `src/components/EncryptedImage.tsx` | Renders encrypted image: fetch URL, decrypt with key, display blob URL                                                                                                |
| `src/components/VoiceRecorder.tsx`  | Records voice, encrypts, uploads, and plays back encrypted voice memos                                                                                                |
| `src/components/ChatModal.tsx`      | Sends/receives encrypted image and voice messages; uses `getDmEncryptionKey(peerAddress)` for key                                                                     |

---

## Security notes

-   **Key scope:** Only the DM conversation symmetric key is used. No separate key exchange for media.
-   **IV:** Never reuse an IV with the same key. The implementation generates a new 12-byte IV per encryption.
-   **Integrity:** AES-GCM provides authentication; tampering with the ciphertext causes decryption to fail.
-   **URLs:** Public URLs to encrypted blobs do not reveal plaintext; only clients with the conversation key can decrypt. Storage and CDN never see the key.

---

## Next Steps

-   [Messaging (Logos Messaging)](/docs/developers/messaging) — Key derivation, ECDH, and text encryption for DMs
-   [API Quick Reference](/docs/api/complete) — Upload endpoints and other APIs
-   [Security](/docs/developers/security) — Session and cryptography practices

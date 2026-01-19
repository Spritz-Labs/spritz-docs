# Messaging Technical Documentation

Complete technical documentation for implementing Spritz messaging, including encryption protocols, key management, and integration patterns.

## Protocol Overview

Spritz messaging uses **Logos Messaging** (formerly Waku) for decentralized peer-to-peer message delivery with end-to-end encryption.

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Transport** | Logos Messaging Light Node | P2P message relay |
| **Encryption** | ECDH P-256 + AES-256-GCM | End-to-end encryption |
| **Serialization** | Protocol Buffers | Message encoding |
| **Persistence** | Hybrid (P2P + Supabase + Local) | Message storage |

---

## Encryption Architecture

### ECDH Key Exchange (P-256)

Direct messages use **Elliptic Curve Diffie-Hellman** key exchange on the P-256 curve to derive a shared encryption key.

**Security Model**: The shared key is derived from both parties' keypairs, meaning an attacker who only knows the wallet addresses cannot compute the encryption key.

#### Key Generation

Each user generates a P-256 ECDH keypair on first message:

```typescript
// Generate new ECDH keypair using P-256 curve
const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable (for storage)
    ["deriveBits"]
);

// Export for storage
const publicKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey);
const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

// Store as base64
const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
```

#### Public Key Distribution

Public keys are stored in Supabase for other users to fetch:

```typescript
// Store public key in user settings
await supabase
    .from("shout_user_settings")
    .upsert({
        wallet_address: userAddress.toLowerCase(),
        messaging_public_key: publicKeyBase64,
        updated_at: new Date().toISOString(),
    }, { onConflict: "wallet_address" });
```

#### Shared Secret Derivation

When initiating a DM, both parties derive the same shared secret:

```typescript
// Import peer's public key
async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
        "raw",
        publicKeyBytes,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
    );
}

// Import own private key
async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
    const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
        "pkcs8",
        privateKeyBytes,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveBits"]
    );
}

// Derive shared secret
async function deriveSharedSecret(
    myPrivateKey: CryptoKey,
    theirPublicKey: CryptoKey
): Promise<Uint8Array> {
    const sharedBits = await crypto.subtle.deriveBits(
        { name: "ECDH", public: theirPublicKey },
        myPrivateKey,
        256 // 256 bits = 32 bytes for AES-256
    );
    return new Uint8Array(sharedBits);
}
```

**Key Property**: `ECDH(A_private, B_public) === ECDH(B_private, A_public)`

---

## Message Encryption (AES-256-GCM)

### Encryption

```typescript
async function encryptMessage(
    content: string,
    symmetricKey: Uint8Array
): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        symmetricKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    // Generate random 96-bit IV (NIST recommended)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        data
    );

    // Combine: IV (12 bytes) || Ciphertext || Auth Tag (16 bytes)
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
}
```

### Decryption

```typescript
async function decryptMessage(
    encryptedBase64: string,
    symmetricKey: Uint8Array
): Promise<string> {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Import key
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        symmetricKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    // Decrypt (will throw if auth tag verification fails)
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encrypted
    );

    return new TextDecoder().decode(decrypted);
}
```

### Security Properties

| Property | Implementation |
|----------|----------------|
| **Confidentiality** | AES-256 encryption |
| **Integrity** | GCM authentication tag (128-bit) |
| **Replay Protection** | Random IV per message |
| **Forward Secrecy** | Per-conversation keys (via ECDH) |

---

## Key Backup System

Private keys are stored locally by default. Users can opt-in to **PIN-protected cloud backup** with a 12-word recovery phrase.

:::info Security Model
- 12-word recovery phrase encodes 96 bits of entropy
- 6-digit PIN adds an authentication factor
- Final key = PBKDF2(entropy + PIN, salt, 100,000 iterations)
- **BOTH** phrase AND PIN are required to restore keys
:::

### Recovery Phrase Generation

```typescript
// 256 common words for phrase generation
const WORDS: string[] = ["apple", "ocean", "tiger", /* ... 253 more */];

function generateRecoveryPhrase(): string {
    // 12 random bytes = 96 bits of entropy
    const entropy = crypto.getRandomValues(new Uint8Array(12));
    const words: string[] = [];
    
    for (let i = 0; i < 12; i++) {
        words.push(WORDS[entropy[i]]);
    }
    
    return words.join(" ");
}
```

### Key Derivation (PBKDF2)

```typescript
async function deriveKeyFromPhraseAndPin(
    phrase: string,
    pin: string,     // 6 digits
    salt: Uint8Array // 16 bytes, stored with backup
): Promise<Uint8Array> {
    // Convert phrase to entropy bytes
    const entropy = phraseToEntropy(phrase); // 12 bytes
    const pinBytes = new TextEncoder().encode(pin);
    
    // Combine entropy + PIN
    const combined = new Uint8Array(entropy.length + pinBytes.length);
    combined.set(entropy);
    combined.set(pinBytes, entropy.length);
    
    // Import as key material
    const keyMaterial = await crypto.subtle.importKey(
        "raw", combined, "PBKDF2", false, ["deriveBits"]
    );
    
    // PBKDF2 with 100,000 iterations
    const derivedBits = await crypto.subtle.deriveBits({
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
    }, keyMaterial, 256);
    
    return new Uint8Array(derivedBits);
}
```

### Backup Storage (Supabase)

```typescript
// Backup structure in shout_user_settings
{
    wallet_address: string,
    messaging_public_key: string,              // Always stored (for ECDH)
    messaging_private_key_encrypted: string,   // Encrypted with phrase+PIN
    // Salt is stored in localStorage (not cloud)
}
```

---

## Message Format (Protobuf)

### Schema Definition

```protobuf
message ChatMessage {
    uint64 timestamp = 1;      // Unix timestamp in milliseconds
    string sender = 2;         // Sender wallet address
    string content = 3;        // Encrypted message content
    string messageId = 4;      // UUID v4
    string messageType = 5;    // "text", "pixel_art", "system"
}
```

### TypeScript Implementation

```typescript
import protobuf from "protobufjs";

const MessageProto = new protobuf.Type("ChatMessage")
    .add(new protobuf.Field("timestamp", 1, "uint64"))
    .add(new protobuf.Field("sender", 2, "string"))
    .add(new protobuf.Field("content", 3, "string"))
    .add(new protobuf.Field("messageId", 4, "string"))
    .add(new protobuf.Field("messageType", 5, "string"));

// Encode message
function encodeMessage(msg: ChatMessage): Uint8Array {
    const errMsg = MessageProto.verify(msg);
    if (errMsg) throw Error(errMsg);
    return MessageProto.encode(MessageProto.create(msg)).finish();
}

// Decode message
function decodeMessage(buffer: Uint8Array): ChatMessage {
    return MessageProto.decode(buffer) as ChatMessage;
}
```

---

## Content Topics

Messages are routed via Logos Messaging content topics:

### Direct Messages

```
/spritz/1/dm-{sorted-addresses}/proto
```

- Addresses are lowercased and sorted alphabetically
- Both parties subscribe to the same topic

```typescript
function getDmTopic(address1: string, address2: string): string {
    const sorted = [address1.toLowerCase(), address2.toLowerCase()].sort();
    return `/spritz/1/dm-${sorted[0]}-${sorted[1]}/proto`;
}
```

### Group Messages

```
/spritz/1/group-{groupId}/proto
```

- Group ID is a UUID assigned at creation
- All members subscribe to the group topic

```typescript
function getGroupTopic(groupId: string): string {
    return `/spritz/1/group-${groupId}/proto`;
}
```

---

## Hybrid Persistence

Messages are stored across three layers for reliability:

### Layer 1: Logos Messaging Store

- **Retention**: ~30 days
- **Purpose**: Real-time P2P delivery
- **Encryption**: E2E (same key)

```typescript
// Subscribe to Logos Messaging Store for historical messages
await lightNode.store.queryWithOrderedCallback(
    decoder,
    async (message) => {
        const decrypted = await decryptMessage(message.content, sharedKey);
        addToLocalState(decrypted);
    },
    { timeFilter: { startTime, endTime } }
);
```

### Layer 2: Supabase (Cloud)

- **Retention**: Permanent
- **Purpose**: Long-term backup, cross-device sync
- **Encryption**: E2E (same key as P2P)

```typescript
// Save to Supabase
await supabase.from("shout_messages").insert({
    conversation_id: conversationId,
    sender_address: sender.toLowerCase(),
    recipient_address: recipient.toLowerCase(),
    encrypted_content: encryptedBase64,
    message_type: "text",
    message_id: uuid(),
    sent_at: new Date().toISOString(),
});
```

### Layer 3: localStorage

- **Retention**: Permanent (per browser)
- **Purpose**: Offline access, instant load
- **Encryption**: E2E (same key)

```typescript
// Persist to localStorage
function persistMessages(topic: string, messages: Message[]) {
    const allMessages = JSON.parse(localStorage.getItem("waku_messages") || "{}");
    allMessages[topic] = messages;
    localStorage.setItem("waku_messages", JSON.stringify(allMessages));
}
```

---

## Legacy Key Compatibility

For messages sent before ECDH migration (backwards compatibility):

### Legacy Key Derivation (DEPRECATED)

```typescript
// Old deterministic key - INSECURE, kept for decryption only
async function computeLegacyDmKey(
    userAddress: string,
    peerAddress: string
): Promise<Uint8Array> {
    const sorted = [userAddress.toLowerCase(), peerAddress.toLowerCase()].sort();
    const seed = `spritz-dm-key-v1:${sorted[0]}:${sorted[1]}`;
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
    return new Uint8Array(hashBuffer);
}
```

### Dual-Key Decryption

```typescript
interface DmKeyResult {
    encryptionKey: Uint8Array;  // Primary key (ECDH)
    legacyKey: Uint8Array;      // Fallback (legacy)
    isSecure: boolean;          // true if ECDH available
}

async function decryptWithFallback(
    encryptedBase64: string,
    keys: DmKeyResult
): Promise<{ content: string; usedLegacy: boolean }> {
    // Try ECDH key first
    if (keys.isSecure) {
        try {
            const content = await decryptMessage(encryptedBase64, keys.ecdhKey);
            return { content, usedLegacy: false };
        } catch {
            // Fall through to legacy
        }
    }
    
    // Fallback to legacy key
    const content = await decryptMessage(encryptedBase64, keys.legacyKey);
    return { content, usedLegacy: true };
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Decryption failed` | Wrong key or corrupted data | Try legacy key fallback |
| `Peer public key not found` | Peer hasn't messaged anyone yet | Wait for peer to initialize |
| `Waku connection failed` | Network issues | Retry with exponential backoff |

### Error Recovery

```typescript
try {
    await sendMessage(content, recipient);
} catch (error) {
    if (error.message.includes("public key not found")) {
        // Peer hasn't set up messaging yet
        // Fall back to legacy key derivation
        const legacyKey = await computeLegacyDmKey(myAddress, recipient);
        await sendMessageWithKey(content, recipient, legacyKey);
    } else {
        throw error;
    }
}
```

---

## Best Practices

### Key Management

1. **Never export private keys** to server-side code
2. **Use Web Crypto API** for all cryptographic operations
3. **Store keys in localStorage** with secure context
4. **Offer backup option** for key recovery across devices

### Message Security

1. **Generate fresh IV** for every message
2. **Validate auth tag** before processing decrypted content
3. **Don't log decrypted content** in production
4. **Clear sensitive data** from memory after use

### Performance

1. **Cache derived keys** (per conversation)
2. **Batch localStorage writes** when possible
3. **Use IndexedDB** for large message history
4. **Lazy-load historical messages** on scroll

---

## Integration Example

```typescript
import { useWaku } from "@/hooks/useWaku";

function ChatComponent({ recipientAddress }) {
    const { 
        sendMessage, 
        messages, 
        isConnected,
        connectionStatus 
    } = useWaku();
    
    const handleSend = async (content: string) => {
        try {
            await sendMessage(recipientAddress, content);
        } catch (error) {
            console.error("Failed to send:", error);
        }
    };
    
    return (
        <div>
            {messages.map(msg => (
                <Message key={msg.id} {...msg} />
            ))}
            <MessageInput onSend={handleSend} disabled={!isConnected} />
        </div>
    );
}
```

---
title: Messaging Technical Documentation
description: "Complete technical guide to Spritz messaging with Logos Messaging (Waku). ECDH encryption, AES-256-GCM, key management, and peer-to-peer protocol integration."
keywords:
    [
        Spritz,
        Logos Messaging,
        Waku,
        encryption,
        ECDH,
        AES-256-GCM,
        peer-to-peer,
        decentralized messaging,
    ]
sidebar_label: Messaging
sidebar_position: 5
---

# Messaging Technical Documentation

Complete technical documentation for implementing Spritz messaging, including encryption protocols, key management, and integration patterns.

## Protocol Overview

Spritz messaging uses **Logos Messaging** (formerly Waku) for decentralized peer-to-peer message delivery with end-to-end encryption.

| Component          | Technology                      | Purpose               |
| ------------------ | ------------------------------- | --------------------- |
| **Transport**      | Logos Messaging Light Node      | P2P message relay     |
| **Encryption**     | X25519 + AES-256-GCM            | End-to-end encryption |
| **Key Derivation** | Deterministic MEK v3            | Cross-device key sync |
| **Serialization**  | Protocol Buffers                | Message encoding      |
| **Persistence**    | Hybrid (P2P + Supabase + Local) | Message storage       |

**Encrypted media (DMs):** Images and voice memos in DMs are encrypted client-side with the same per-conversation symmetric key used for text. Media is uploaded as ciphertext; only the client decrypts. See [Encrypted Media - Images and Voice Memos](/docs/developers/encrypted-media) for AES-GCM format, message format (`[ENC_IMAGE:...]`, `[VOICE:...]`), and upload API.

---

## Deterministic Messaging Encryption Keys (MEK v3)

:::tip Key Innovation
MEK v3 uses **deterministic key derivation** - the same keypair is generated on any device with the same authentication. **No backup needed** for wallet and passkey users!
:::

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Device A                              Device B                 │
│  ────────                              ────────                 │
│  Sign message with wallet              Sign SAME message        │
│         ↓                                    ↓                  │
│  Get signature (deterministic)         Get SAME signature       │
│         ↓                                    ↓                  │
│  Derive key from signature             Derive SAME key          │
│         ↓                                    ↓                  │
│  SAME KEYPAIR!                         SAME KEYPAIR!            │
│                                                                 │
│  ✅ No backup needed                                            │
│  ✅ No sync needed                                              │
│  ✅ No server storage of private keys                          │
│  ✅ Works automatically across all devices                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Derivation by User Type

| Auth Type                 | Derivation Method | Cross-Device             | Deterministic   |
| ------------------------- | ----------------- | ------------------------ | --------------- |
| **EOA Wallet**            | Wallet signature  | ✅ Yes                   | ✅ Yes          |
| **Passkey**               | PRF extension     | ✅ Yes (synced passkeys) | ✅ Yes          |
| **Passkey (no PRF)**      | Random + backup   | ❌ Manual                | ❌ No           |
| **PIN (6+ digits)**       | PBKDF2-SHA256     | ✅ Yes                   | ✅ Yes          |
| **Email/World ID/Solana** | PIN or passkey    | ✅ With PIN or passkey   | ✅ With PIN     |
| **Alien ID**              | PIN or passkey    | ✅ With PIN or passkey   | ✅ With PIN     |

---

## PIN-Based Messaging Encryption

For users without wallet signing capability (email, Alien ID, World ID, Solana), Spritz offers **PIN-based key derivation** as a deterministic alternative to passkey-derived keys.

### Why PIN Encryption?

PIN encryption solves a key problem: users who authenticate with email, Alien ID, or World ID may not have a passkey with PRF support. A 6-digit numeric PIN provides deterministic, cross-device key derivation without requiring any hardware-specific capabilities.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                   PIN Key Derivation Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User enters 6+ digit PIN                                       │
│         ↓                                                        │
│  PBKDF2-SHA256 (600,000 iterations)                             │
│  Salt: "spritz.chat:messaging-key:v3:pin-salt:{address}"        │
│         ↓                                                        │
│  256-bit key material                                            │
│         ↓                                                        │
│  HKDF domain separation                                         │
│         ↓                                                        │
│  Deterministic X25519 keypair                                    │
│         ↓                                                        │
│  Public key uploaded to Supabase (source="pin")                 │
│  Verification hash stored locally (not the PIN)                  │
│                                                                  │
│  ✅ Same PIN + same address = same key on any device             │
│  ✅ 600k iterations makes brute-force ~100ms per guess           │
│  ✅ PIN never stored; only a verification hash                   │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
const PIN_PBKDF2_ITERATIONS = 600_000;

export async function deriveMekFromPin(
    pin: string,
    userAddress: string
): Promise<MessagingKeyResult> {
    // PIN validation: 6+ digits, numbers only
    if (!pin || pin.length < 6 || !/^\d+$/.test(pin)) {
        return {
            success: false,
            error: "PIN must be at least 6 digits (numbers only)",
        };
    }

    // Import PIN as key material for PBKDF2
    const pinKeyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(pin),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    // User-specific salt for domain separation
    const pbkdf2Salt = new TextEncoder().encode(
        `${MEK_CONTEXT}:pin-salt:${userAddress.toLowerCase()}`
    );

    // Derive 256 bits with 600k iterations
    const pinBytes = new Uint8Array(
        await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                hash: "SHA-256",
                salt: pbkdf2Salt,
                iterations: PIN_PBKDF2_ITERATIONS,
            },
            pinKeyMaterial,
            256
        )
    );

    // Derive seed via HKDF, then generate X25519 keypair
    const seed = await deriveSeedFromSignature(pinBytes, userAddress);
    const keypair = generateDeterministicKeypair(seed);

    // Store verification hash (NOT the PIN) for future unlocking
    const verifyInput = new TextEncoder().encode(
        `${MEK_CONTEXT}:pin-verify:${userAddress.toLowerCase()}:${keypair.publicKey}`
    );
    const verifyHash = await crypto.subtle.digest("SHA-256", verifyInput);
    storePinVerificationHash(userAddress, hexFromBuffer(verifyHash));

    // Upload public key to server for cross-device verification
    await uploadPublicKeyToSupabase(userAddress, keypair.publicKey, "pin");

    return { success: true, keypair, isNewKey: true };
}
```

### Security Properties

| Property | Details |
|----------|---------|
| **Iterations** | 600,000 PBKDF2-SHA256 (~100ms per guess) |
| **Brute-force resistance** | 10^6 guesses (6-digit PIN) takes ~28 hours |
| **PIN storage** | Never stored; only a SHA-256 verification hash |
| **Cross-device** | Same PIN + address = same key on any device |
| **Public key sync** | Uploaded to Supabase with `source="pin"` for verification |
| **Priority** | If a PIN-derived key exists (locally or remotely), it takes priority to avoid overwriting keys |

### PIN vs Passkey Key Derivation

| Aspect | PIN | Passkey (PRF) | Passkey (no PRF) |
|--------|-----|---------------|------------------|
| **Input** | 6+ digit number | Biometric/PIN | Biometric/PIN |
| **Deterministic** | ✅ Yes | ✅ Yes | ❌ No (random) |
| **Cross-device** | ✅ Any device | ✅ Synced passkeys | ❌ Manual backup |
| **Hardware required** | ❌ None | ✅ WebAuthn support | ✅ WebAuthn support |
| **Best for** | Email, Alien ID, Solana users | Passkey-native users | Fallback |

---

## User Flows by Authentication Type

### Flow 1: EOA Wallet Users

Wallet users get fully deterministic keys via wallet signature:

```typescript
const MEK_DOMAIN = "spritz.chat";
const MEK_VERSION = 3;
const MEK_CONTEXT = `${MEK_DOMAIN}:messaging-key:v${MEK_VERSION}`;

/**
 * Deterministic signing message - MUST NEVER CHANGE
 */
function getEoaSigningMessage(userAddress: Address): string {
    return [
        `${MEK_DOMAIN} Messaging Key`,
        "",
        "Sign this message to generate your encryption key.",
        "This key will be the same on all your devices.",
        "",
        `Account: ${userAddress.toLowerCase()}`,
        `Version: ${MEK_VERSION}`,
    ].join("\n");
}

/**
 * Derive DETERMINISTIC messaging key from EOA wallet
 * Same wallet = Same signature = Same key (on ANY device)
 */
export async function deriveMekFromEoa(
    walletClient: WalletClient,
    userAddress: Address
): Promise<MessagingKeyResult> {
    const message = getEoaSigningMessage(userAddress);

    // Get deterministic signature
    const signature = await walletClient.signMessage({
        account: userAddress,
        message,
    });

    // Convert signature to bytes
    const signatureBytes = hexToBytes(signature);

    // Derive deterministic seed using HKDF
    const seed = await deriveSeedFromSignature(signatureBytes, userAddress);

    // Generate deterministic X25519 keypair
    const keypair = generateDeterministicKeypair(seed);

    // Upload public key to Supabase for ECDH
    await uploadPublicKeyToSupabase(userAddress, keypair.publicKey);

    return { success: true, keypair };
}
```

**User Experience:**

1. User opens chat → sees "Enable Secure Messaging" prompt
2. Signs one message with wallet
3. Done! Same key works on all devices with this wallet

---

### Flow 2: Passkey Users (PRF Supported)

Passkey users with PRF-compatible authenticators get fully deterministic keys:

```typescript
/**
 * Derive DETERMINISTIC messaging key from Passkey PRF
 * Same passkey + same salt = Same PRF = Same key
 * Works across devices with synced passkeys (iCloud/Google)
 */
export async function deriveMekFromPasskeyPrf(
    credentialId: string,
    rpId: string,
    userAddress: string
): Promise<MessagingKeyResult> {
    // Deterministic PRF salt
    const prfSalt = new TextEncoder().encode(
        `${MEK_CONTEXT}:prf-salt:${userAddress.toLowerCase()}`
    );

    // Request passkey with PRF extension
    const credential = await navigator.credentials.get({
        publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rpId,
            allowCredentials: [
                {
                    id: base64UrlToArrayBuffer(credentialId),
                    type: "public-key",
                    transports: ["internal"],
                },
            ],
            userVerification: "required",
            extensions: {
                prf: {
                    eval: { first: prfSalt },
                },
            },
        },
    });

    // Extract PRF result (deterministic output)
    const extensionResults = credential.getClientExtensionResults();
    const prfOutput = extensionResults.prf?.results?.first;

    if (!prfOutput) {
        return { success: false, prfNotSupported: true };
    }

    // Use PRF output as deterministic seed
    let seed = new Uint8Array(prfOutput);
    if (seed.length !== 32) {
        const hashBuffer = await crypto.subtle.digest("SHA-256", seed);
        seed = new Uint8Array(hashBuffer);
    }

    // Generate deterministic X25519 keypair
    const keypair = generateDeterministicKeypair(seed);

    return { success: true, keypair, derivedFrom: "passkey-prf" };
}
```

**User Experience:**

1. User opens chat → sees "Enable Secure Messaging" prompt
2. Authenticates with Face ID / Touch ID
3. Done! Same key on all devices with synced passkey

---

### Flow 3: Email / World ID / Solana Users

These users don't have signing capabilities, so they **must create a passkey first**:

```
┌─────────────────────────────────────────────────────────────────┐
│                Email/World ID/Solana User Flow                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User tries to send message                                   │
│     └─► "Add a passkey to enable secure messaging"               │
│                                                                  │
│  2. User creates passkey                                         │
│     ├─► Face ID / Touch ID / Windows Hello                       │
│     └─► Passkey syncs to iCloud / Google                         │
│                                                                  │
│  3. User authenticates with passkey                              │
│     └─► Deterministic key derived (same as Flow 2)               │
│                                                                  │
│  Result: Cross-device messaging with passkey sync!               │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
/**
 * Unified key derivation - handles all auth types
 */
export async function getOrDeriveMessagingKey(
    params: GetMessagingKeyParams
): Promise<MessagingKeyResult> {
    const {
        authType,
        userAddress,
        walletClient,
        passkeyCredentialId,
        rpId,
        hasPasskey,
    } = params;

    switch (authType) {
        case "wallet":
            if (!walletClient)
                return { success: false, error: "Wallet not connected" };
            return deriveMekFromEoa(walletClient, userAddress);

        case "passkey":
            if (!passkeyCredentialId || !rpId) {
                return {
                    success: false,
                    error: "Passkey credentials required",
                };
            }
            // Try PRF first, fallback to random if not supported
            const prfResult = await deriveMekFromPasskeyPrf(
                passkeyCredentialId,
                rpId,
                userAddress
            );
            if (prfResult.success) return prfResult;
            if (prfResult.prfNotSupported) {
                return deriveMekFromPasskeySignature(
                    passkeyCredentialId,
                    rpId,
                    userAddress
                );
            }
            return prfResult;

        case "email":
        case "digitalid":
        case "solana":
            // These users MUST create a passkey first
            if (hasPasskey && passkeyCredentialId && rpId) {
                return deriveMekFromPasskeyPrf(
                    passkeyCredentialId,
                    rpId,
                    userAddress
                );
            }
            return {
                success: false,
                requiresPasskey: true,
                error: "Add a passkey to enable secure messaging",
            };

        default:
            return { success: false, error: "Unknown auth type" };
    }
}
```

---

## React Hook: `useMessagingKey`

```typescript
import { useMessagingKey } from "@/hooks/useMessagingKey";

function ChatComponent() {
    const {
        isReady, // Key is derived and ready
        isLoading, // Currently deriving key
        requiresPasskey, // User needs to create passkey first
        requiresActivation, // User needs to activate (sign/authenticate)
        error,
        keypair, // Current keypair (if ready)
        publicKey, // Convenience accessor
        activateMessaging, // Trigger key derivation
        deactivate, // Clear session key
        derivedFrom, // "eoa" | "passkey-prf" | "passkey-fallback" | "legacy"
    } = useMessagingKey({
        userAddress,
        authType, // "wallet" | "passkey" | "email" | etc.
        passkeyCredentialId, // For passkey users
    });

    if (requiresPasskey) {
        return <AddPasskeyPrompt />;
    }

    if (requiresActivation) {
        return (
            <EnableMessagingPrompt
                authType={authType}
                onEnable={activateMessaging}
                isLoading={isLoading}
            />
        );
    }

    if (!isReady) {
        return <LoadingSpinner />;
    }

    return <ChatUI keypair={keypair} />;
}
```

---

## Key Derivation Implementation

### TypeScript Types

```typescript
export interface DerivedMessagingKey {
    publicKey: string; // Base64 encoded X25519 public key
    privateKey: string; // Base64 encoded X25519 private key
    derivedFrom: "eoa" | "passkey-prf" | "passkey-fallback" | "legacy";
}

export interface MessagingKeyResult {
    success: boolean;
    keypair?: DerivedMessagingKey;
    requiresPasskey?: boolean;
    prfNotSupported?: boolean;
    error?: string;
    isNewKey?: boolean;
}

export type AuthType = "wallet" | "passkey" | "email" | "digitalid" | "solana";
```

### HKDF Seed Derivation

```typescript
/**
 * Derive a 32-byte seed from signature using HKDF
 * Ensures the seed is uniformly distributed
 */
async function deriveSeedFromSignature(
    signature: Uint8Array,
    userAddress: string
): Promise<Uint8Array> {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        signature,
        "HKDF",
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: new TextEncoder().encode(MEK_CONTEXT),
            info: new TextEncoder().encode(
                `x25519-seed:${userAddress.toLowerCase()}`
            ),
        },
        keyMaterial,
        256 // 32 bytes for X25519
    );

    return new Uint8Array(derivedBits);
}
```

### Deterministic X25519 Keypair

```typescript
import nacl from "tweetnacl";

/**
 * Generate DETERMINISTIC X25519 keypair from seed
 * SAME SEED = SAME KEYPAIR (always, on any device)
 */
function generateDeterministicKeypair(seed: Uint8Array): {
    publicKey: string;
    privateKey: string;
} {
    if (seed.length !== 32) {
        throw new Error("Seed must be exactly 32 bytes");
    }

    // TweetNaCl deterministically generates keypair from seed
    const keyPair = nacl.box.keyPair.fromSecretKey(seed);

    return {
        publicKey: btoa(String.fromCharCode(...keyPair.publicKey)),
        privateKey: btoa(String.fromCharCode(...keyPair.secretKey)),
    };
}
```

---

## Session Caching

Keys are cached in memory for the session to avoid re-signing:

```typescript
// Session cache (survives page navigation, cleared on refresh)
const sessionKeyCache = new Map<string, DerivedMessagingKey>();

export function hasCachedKey(userAddress: string): boolean {
    return sessionKeyCache.has(userAddress.toLowerCase());
}

export function getCachedKey(userAddress: string): DerivedMessagingKey | null {
    return sessionKeyCache.get(userAddress.toLowerCase()) || null;
}

export function clearCachedKey(userAddress: string): void {
    sessionKeyCache.delete(userAddress.toLowerCase());
}

export function clearAllCachedKeys(): void {
    sessionKeyCache.clear();
}
```

---

## Encryption Architecture

### X25519 Key Exchange

Direct messages use **X25519** (Curve25519) for key exchange:

```typescript
import nacl from "tweetnacl";

/**
 * Derive shared secret using X25519
 */
function deriveSharedSecret(
    myPrivateKey: Uint8Array, // 32 bytes
    theirPublicKey: Uint8Array // 32 bytes
): Uint8Array {
    return nacl.box.before(theirPublicKey, myPrivateKey);
}
```

**Key Property**: `X25519(A_private, B_public) === X25519(B_private, A_public)`

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
    const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
        c.charCodeAt(0)
    );

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

| Property              | Implementation                   |
| --------------------- | -------------------------------- |
| **Confidentiality**   | AES-256 encryption               |
| **Integrity**         | GCM authentication tag (128-bit) |
| **Replay Protection** | Random IV per message            |
| **Forward Secrecy**   | Per-conversation keys (via ECDH) |

---

## Legacy Key Backup System (Fallback)

For users whose passkeys don't support PRF, or who want manual backup:

:::info Security Model

-   12-word recovery phrase encodes 96 bits of entropy
-   6-digit PIN adds an authentication factor
-   Final key = PBKDF2(entropy + PIN, salt, 100,000 iterations)
-   **BOTH** phrase AND PIN are required to restore keys
    :::

### Recovery Phrase Generation

```typescript
// 256 common words for phrase generation
const WORDS: string[] = ["apple", "ocean", "tiger" /* ... 253 more */];

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
    pin: string, // 6 digits
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
        "raw",
        combined,
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    // PBKDF2 with 100,000 iterations
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );

    return new Uint8Array(derivedBits);
}
```

### Backup Storage (Supabase)

```typescript
// Backup structure in shout_user_settings
{
    wallet_address: string,
    messaging_public_key: string,              // Always stored (for ECDH)
    messaging_backup_encrypted: string,        // Encrypted with phrase+PIN
    messaging_backup_salt: string,             // Base64 salt
    messaging_backup_enabled: boolean,
}
```

---

## Public Key Distribution

Public keys are stored in Supabase for other users to fetch:

```typescript
/**
 * Upload ONLY the public key to Supabase
 * Required for key exchange with other users
 */
async function uploadPublicKeyToSupabase(
    userAddress: string,
    publicKey: string
): Promise<void> {
    await supabase.from("shout_user_settings").upsert(
        {
            wallet_address: userAddress.toLowerCase(),
            messaging_public_key: publicKey,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "wallet_address" }
    );
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

-   Addresses are lowercased and sorted alphabetically
-   Both parties subscribe to the same topic

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

-   Group ID is a UUID assigned at creation
-   All members subscribe to the group topic

```typescript
function getGroupTopic(groupId: string): string {
    return `/spritz/1/group-${groupId}/proto`;
}
```

---

## Hybrid Persistence

Messages are stored across three layers for reliability:

### Layer 1: Logos Messaging Store

-   **Retention**: ~30 days
-   **Purpose**: Real-time P2P delivery
-   **Encryption**: E2E (same key)

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

-   **Retention**: Permanent
-   **Purpose**: Long-term backup, cross-device sync
-   **Encryption**: E2E (same key as P2P)

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

-   **Retention**: Permanent (per browser)
-   **Purpose**: Offline access, instant load
-   **Encryption**: E2E (same key)

```typescript
// Persist to localStorage
function persistMessages(topic: string, messages: Message[]) {
    const allMessages = JSON.parse(
        localStorage.getItem("waku_messages") || "{}"
    );
    allMessages[topic] = messages;
    localStorage.setItem("waku_messages", JSON.stringify(allMessages));
}
```

---

## Legacy Key Compatibility

For messages sent before MEK v3 migration (backwards compatibility):

### Legacy P-256 ECDH Keys

```typescript
// Old P-256 key generation - still supported for decryption
const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
);
```

### Legacy Key Import

```typescript
// Import legacy keys from localStorage
const LEGACY_KEYPAIR_STORAGE = "waku_messaging_keypair";

function importLegacyKeypair(userAddress: string): DerivedMessagingKey | null {
    const legacyJson = localStorage.getItem(LEGACY_KEYPAIR_STORAGE);
    if (!legacyJson) return null;

    try {
        const legacy = JSON.parse(legacyJson);
        if (legacy.publicKey && legacy.privateKey) {
            return {
                ...legacy,
                derivedFrom: "legacy" as const,
            };
        }
    } catch {
        return null;
    }
    return null;
}
```

---

## Key Restore & Upgrade Banners

### Auto-Detection System

Spritz automatically detects when users need to restore or upgrade their messaging keys:

| Scenario                           | Banner         | Action                               |
| ---------------------------------- | -------------- | ------------------------------------ |
| **No key** (site data cleared)     | Restore Banner | Sign/authenticate to restore         |
| **Legacy key** (non-deterministic) | Upgrade Banner | Sign to get deterministic key        |
| **Key mismatch** (not in Supabase) | Sync Banner    | Re-upload public key                 |
| **Passkey fallback** (no PRF)      | Upgrade Check  | Try PRF again (may now be supported) |

### MessagingKeyRestoreBanner

Auto-prompts users to restore their encryption key:

```typescript
/**
 * Banner that prompts users to restore their messaging key when:
 * 1. They have no key (site data was cleared)
 * 2. They have a "legacy" or "passkey-fallback" key instead of deterministic
 * 3. Their public key isn't in Supabase (needed for ECDH)
 *
 * For EOA users: Sign with wallet to derive deterministic key
 * For Passkey users: Authenticate to check PRF support and derive key if possible
 */
export function MessagingKeyRestoreBanner({
    userAddress,
    authType,
    passkeyCredentialId,
    rpId,
    onOpenSettings,
}: MessagingKeyRestoreBannerProps) {
    const [showBanner, setShowBanner] = useState(false);
    const [bannerReason, setBannerReason] = useState<
        "no_key" | "legacy_key" | "key_mismatch" | "passkey_upgrade"
    >("no_key");

    useEffect(() => {
        // Only for wallet (EOA) and passkey users - they can restore via signing
        if (authType !== "wallet" && authType !== "passkey") {
            setShowBanner(false);
            return;
        }

        const checkKeyStatus = async () => {
            const storedJson = localStorage.getItem(MESSAGING_KEYPAIR_STORAGE);
            const storedSource = localStorage.getItem(
                MESSAGING_KEY_SOURCE_STORAGE
            );

            if (!storedJson) {
                setBannerReason("no_key");
                setShowBanner(true);
                return;
            }

            // Check for legacy keys
            if (
                authType === "wallet" &&
                (!storedSource || storedSource === "legacy")
            ) {
                setBannerReason("legacy_key");
                setShowBanner(true);
                return;
            }

            // Check for passkey-fallback (might be able to upgrade to PRF)
            if (authType === "passkey" && storedSource === "passkey-fallback") {
                setBannerReason("passkey_upgrade");
                setShowBanner(true);
                return;
            }

            // Check if public key is in Supabase
            if (storedSource === "eoa" || storedSource === "passkey-prf") {
                const { data } = await supabase
                    .from("shout_user_settings")
                    .select("messaging_public_key")
                    .eq("wallet_address", userAddress.toLowerCase())
                    .single();

                if (
                    !data?.messaging_public_key ||
                    data.messaging_public_key !== stored.publicKey
                ) {
                    setBannerReason("key_mismatch");
                    setShowBanner(true);
                    return;
                }
            }
        };

        checkKeyStatus();
    }, [userAddress, authType]);

    const handleRestore = async () => {
        // Clear old key and derive fresh
        localStorage.removeItem(MESSAGING_KEYPAIR_STORAGE);
        localStorage.removeItem(MESSAGING_KEY_SOURCE_STORAGE);

        const result = await getOrDeriveMessagingKey({
            authType,
            userAddress,
            walletClient: authType === "wallet" ? walletClient : undefined,
            passkeyCredentialId:
                authType === "passkey" ? passkeyCredentialId : undefined,
            rpId,
        });

        if (result.success && result.keypair) {
            // Store and upload to Supabase
            localStorage.setItem(
                MESSAGING_KEYPAIR_STORAGE,
                JSON.stringify(result.keypair)
            );
            localStorage.setItem(
                MESSAGING_KEY_SOURCE_STORAGE,
                result.keypair.derivedFrom
            );

            // Reload to decrypt messages with restored key
            window.location.reload();
        }
    };

    // Message varies by scenario
    const getMessage = () => {
        switch (bannerReason) {
            case "no_key":
                return "Sign to restore your message encryption key and decrypt your messages.";
            case "legacy_key":
                return "Upgrade to a deterministic key for seamless cross-device messaging.";
            case "passkey_upgrade":
                return "Your passkey may now support better encryption. Try upgrading.";
            case "key_mismatch":
                return "Your encryption key needs to be synced. Sign to restore access.";
        }
    };

    return showBanner ? (
        <Banner message={getMessage()} onRestore={handleRestore} />
    ) : null;
}
```

### MessagingKeyUpgradeBanner

For wallet users with legacy keys:

```typescript
/**
 * Shows for WALLET users with legacy (non-deterministic) keys
 * Prompts them to upgrade to deterministic key derivation
 */
export function MessagingKeyUpgradeBanner({
    userAddress,
    authType,
}: MessagingKeyUpgradeBannerProps) {
    // Only show for wallet users with legacy keys
    if (authType !== "wallet") return null;

    const handleUpgrade = async () => {
        // Clear old key
        localStorage.removeItem(MESSAGING_KEYPAIR_STORAGE);
        clearCachedKey(userAddress);

        // Derive new deterministic key
        const result = await getOrDeriveMessagingKey({
            authType: "wallet",
            userAddress,
            walletClient,
        });

        if (result.success) {
            // Save with source indicator
            localStorage.setItem(
                MESSAGING_KEY_SOURCE_STORAGE,
                result.keypair.derivedFrom
            );
        }
    };

    return (
        <Banner
            title="Upgrade Available"
            description="Enable seamless cross-device messaging. Sign once, works everywhere."
            onUpgrade={handleUpgrade}
            onDismiss={() => {
                localStorage.setItem(UPGRADE_DISMISSED_KEY, userAddress);
            }}
        />
    );
}
```

---

## Passkey Selection

When deriving keys from passkeys, the browser shows a picker with ALL available passkeys for the site (not just the one used for login). This matches login/signing behavior and provides better UX:

```typescript
// Request passkey with PRF extension
// Don't specify allowCredentials - let user choose from ALL their passkeys
const credential = await navigator.credentials.get({
    publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: effectiveRpId,
        // No allowCredentials = browser shows picker with all available passkeys
        userVerification: "required",
        extensions: {
            prf: {
                eval: { first: prfSalt },
            },
        },
    },
});
```

### rpId Normalization

The `rpId` is normalized to handle subdomains:

```typescript
// Normalize rpId - use parent domain for subdomains
let effectiveRpId = rpId;
if (rpId.includes("spritz.chat")) {
    effectiveRpId = "spritz.chat"; // Works for app.spritz.chat, spritz.chat, etc.
} else if (rpId === "localhost" || rpId === "127.0.0.1") {
    effectiveRpId = "localhost";
}
```

---

## UI Components

### MessagingStatus

Displays current encryption status in settings:

```typescript
import { MessagingStatus } from "@/components/MessagingStatus";

// Full card for settings
<MessagingStatus showDetails={true} />

// Compact badge for inline use
<MessagingStatus compact={true} />
```

| Status                 | Display                                         |
| ---------------------- | ----------------------------------------------- |
| Active (deterministic) | 🟢 "Secure" - "Key derived from wallet/passkey" |
| Active (legacy)        | 🟢 "Active" - "Legacy backup"                   |
| Needs activation       | 🔵 "Enable"                                     |
| Needs passkey          | 🟡 "Add Passkey"                                |

---

## Error Handling

### Common Errors

| Error                       | Cause                         | Solution                       |
| --------------------------- | ----------------------------- | ------------------------------ |
| `Decryption failed`         | Wrong key or corrupted data   | Try legacy key fallback        |
| `Peer public key not found` | Peer hasn't enabled messaging | Show "waiting for peer" UI     |
| `Waku connection failed`    | Network issues                | Retry with exponential backoff |
| `PRF not supported`         | Old passkey/browser           | Fall back to backup system     |
| `Passkey required`          | Email/Solana user             | Prompt to create passkey       |

### Error Recovery

```typescript
try {
    const result = await activateMessaging();
    if (!result.success) {
        if (result.requiresPasskey) {
            showPasskeyPrompt();
        } else if (result.prfNotSupported) {
            showBackupOption();
        } else {
            showError(result.error);
        }
    }
} catch (error) {
    if (
        error.message.includes("cancelled") ||
        error.message.includes("denied")
    ) {
        // User cancelled signing/auth
        showRetryPrompt();
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
3. **Cache keys in memory** for the session (not localStorage for deterministic keys)
4. **Prefer deterministic derivation** over backup when available

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
import { useMessagingKey } from "@/hooks/useMessagingKey";
import { useWaku } from "@/hooks/useWaku";

function ChatComponent({ recipientAddress }) {
    const {
        isReady: keyReady,
        requiresActivation,
        requiresPasskey,
        activateMessaging,
        keypair,
    } = useMessagingKey({ userAddress, authType, passkeyCredentialId });

    const { sendMessage, messages, isConnected } = useWaku();

    // Handle messaging not ready states
    if (requiresPasskey) {
        return <AddPasskeyFlow onComplete={() => activateMessaging()} />;
    }

    if (requiresActivation) {
        return <EnableMessagingModal onActivate={activateMessaging} />;
    }

    if (!keyReady) {
        return <LoadingSpinner />;
    }

    // Ready to chat!
    return (
        <div>
            {messages.map((msg) => (
                <Message key={msg.id} {...msg} />
            ))}
            <MessageInput
                onSend={(content) => sendMessage(recipientAddress, content)}
                disabled={!isConnected}
            />
        </div>
    );
}
```

---

## Message Deletion

Spritz supports message deletion across all chat types. Deletion behavior varies by context:

| Chat Type | Own Messages | Admin/Moderator | Deletion Method |
|-----------|-------------|-----------------|-----------------|
| **DMs** | ✅ | ✅ Global admin | Soft delete (`is_deleted: true`) |
| **Channels** | ✅ | ✅ Creator or global admin | Soft delete (`is_deleted: true`) |
| **Groups** | ✅ | ✅ Moderator | Soft delete |
| **Location Chats** | ✅ | ✅ Creator or global admin | Hard delete (removed from DB) |
| **Alpha Chat** | ✅ | ✅ Moderators with `canDelete` | Moderation API (logged) |

### DM Deletion

```http
POST /api/messages/delete
```

```json
{
    "messageId": "uuid-of-message"
}
```

The sender or a global admin can delete DM messages. Content is replaced with `[Message deleted]` and `is_deleted` is set to `true`.

### Channel Message Deletion

```http
DELETE /api/channels/:channelId/messages/:messageId
```

The message sender, channel creator, or a global admin can delete channel messages. Uses the same soft-delete pattern.

### Location Chat Message Deletion

```http
DELETE /api/location-chats/:id/messages?messageId=uuid
```

Location chat messages are **hard deleted** (removed from the database entirely), unlike other chat types which use soft deletes.

### Moderation Deletion (Alpha Chat)

Admin-level deletions in Alpha Chat go through the moderation API and are logged to an audit trail:

```typescript
await fetch("/api/moderation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
        action: "delete-message",
        moderatorAddress: userAddress,
        messageId: "uuid",
        messageType: "alpha",
        reason: "Violation of community guidelines",
    }),
});
```

---

## Block & Ban System

Spritz implements a bidirectional block system and admin-level bans for moderation.

### User Blocking

When a user blocks another user:

1. **Messages hidden**: Messages from the blocked user are filtered client-side across all chat types
2. **Bidirectional**: Neither party can message the other
3. **Friend cleanup**: Any friend relationship is removed
4. **Reason tracking**: An optional reason is stored

```http
POST /api/users/block
```

```json
{
    "userAddress": "0x1234...",
    "reason": "Spam"
}
```

```http
DELETE /api/users/block
```

```json
{
    "userAddress": "0x1234..."
}
```

### Block Filtering in Chat

Messages from blocked users are filtered on the client in every chat modal:

```typescript
const { isBlocked: isUserBlocked } = useBlockedUsers(userAddress);

// Filter blocked messages in any chat type
const messages = useMemo(
    () => rawMessages.filter((msg) => !isUserBlocked(msg.sender_address)),
    [rawMessages, isUserBlocked]
);
```

The `isBlocked` check is bidirectional — it returns `true` if you blocked the user **or** the user blocked you.

### Admin Bans

Global admins can ban users platform-wide:

```http
POST /api/admin/ban
```

```json
{
    "userAddress": "0x1234...",
    "ban": true,
    "reason": "Repeated violations"
}
```

Banned users have `is_banned: true` set in the `shout_users` table. All admin ban/unban actions are logged to the `shout_admin_activity` audit table.

---

## Next Steps

-   [Encrypted Media](/docs/developers/encrypted-media) - End-to-end encrypted images and voice memos
-   [Messaging Guide](/docs/guides/messaging) - User-facing messaging features
-   [Channels Guide](/docs/guides/channels) - Public channel messaging
-   [Groups Guide](/docs/guides/groups) - Group chat messaging

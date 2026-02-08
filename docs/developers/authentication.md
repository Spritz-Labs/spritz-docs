# Authentication Technical Documentation

Complete technical documentation for Spritz authentication, including wallet connections, passkeys, and session management.

## Authentication Overview

Spritz supports multiple authentication methods, all providing:

1. **Spritz ID** - Your social identity for profiles, friends, and messages
2. **Spritz Wallet** - A Safe Smart Account for on-chain transactions

| Method         | Spritz ID Source    | Wallet Signer         | Immediate Wallet? |
| -------------- | ------------------- | --------------------- | ----------------- |
| **EVM Wallet** | Wallet address      | Wallet EOA            | ✅ Yes            |
| **Passkey**    | Credential ID hash  | WebAuthn P-256        | ✅ Yes            |
| **Email**      | Derived or existing | Passkey (must create) | ❌ No             |
| **World ID**   | nullifier_hash      | Passkey (must create) | ❌ No             |
| **Alien ID**   | alienAddress        | Passkey (must create) | ❌ No             |
| **Solana**     | Solana address      | Passkey (must create) | ❌ No             |

---

## Sign-In with Ethereum (SIWE)

### Protocol Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      SIWE Flow                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Request SIWE Message (includes nonce)                    │
│  ┌──────────┐    GET /api/auth/verify?address=0x...         │
│  │  Client  │ ────────────────────────────────►             │
│  └──────────┘ ◄────────────────────────────────             │
│                   { message: "...", nonce: "abc123..." }    │
│                                                              │
│  2. Server generates SIWE Message                            │
│  ┌──────────────────────────────────────────────┐           │
│  │ app.spritz.chat wants you to sign in...      │           │
│  │                                               │           │
│  │ URI: https://app.spritz.chat                 │           │
│  │ Version: 1                                    │           │
│  │ Chain ID: 1                                  │           │
│  │ Nonce: abc123...                              │           │
│  │ Issued At: 2026-01-22T12:00:00Z              │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  3. Sign Message (Wallet)                                    │
│  ┌──────────┐                                               │
│  │  Wallet  │  signMessage(message)                         │
│  │ (MM/RK)  │  → signature: 0x...                           │
│  └──────────┘                                               │
│                                                              │
│  4. Verify Signature                                         │
│  ┌──────────┐    POST /api/auth/verify                      │
│  │  Client  │ ────────────────────────────────►             │
│  └──────────┘    { address, message, signature }            │
│                                                              │
│  5. Create Session                                           │
│  ◄────────────────────────────────────────────              │
│  Set-Cookie: spritz_session=jwt...; HttpOnly                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// 1. Get pre-formatted SIWE message with nonce from server
const { message, nonce } = await fetch(
    `/api/auth/verify?address=${userAddress}`
).then((r) => r.json());

// 2. Sign the message
const signature = await signMessage({ message });

// 3. Verify and create session
const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Required for session cookie
    body: JSON.stringify({ address: userAddress, message, signature }),
});

// Session cookie is automatically set
```

### Server-Side Verification

```typescript
import { SiweMessage } from "siwe";

export async function POST(request: NextRequest) {
    const { message, signature } = await request.json();

    // Parse and verify SIWE message
    const siweMessage = new SiweMessage(message);
    const { success, data } = await siweMessage.verify({
        signature,
        domain: "app.spritz.chat",
        nonce: await getNonceFromStore(siweMessage.nonce),
    });

    if (!success) {
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
        );
    }

    // Create JWT session
    const token = await signJWT(
        {
            address: data.address,
            chainId: data.chainId,
            authMethod: "wallet",
        },
        { expiresIn: "7d" }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("spritz_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
}
```

---

## Sign-In with Solana (SIWS)

### Message Format

```typescript
import { createSignInMessage } from "@solana/wallet-standard-util";

const message = createSignInMessage({
    domain: window.location.host,
    address: publicKey.toBase58(),
    statement: "Sign in to Spritz",
    uri: window.location.origin,
    nonce: nonce,
    issuedAt: new Date().toISOString(),
});
```

### Verification

```typescript
import nacl from "tweetnacl";
import bs58 from "bs58";

const isValid = nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    bs58.decode(signature),
    bs58.decode(publicKey)
);
```

---

## Passkey Authentication (WebAuthn)

### Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Passkey Registration                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Generate Challenge                                       │
│  ┌──────────┐    GET /api/auth/webauthn/register-options    │
│  │  Server  │ ────────────────────────────────►             │
│  └──────────┘    { challenge, rpId, user: {...} }           │
│                                                              │
│  2. Create Credential                                        │
│  ┌──────────────┐                                           │
│  │   Browser    │  navigator.credentials.create({           │
│  │   WebAuthn   │    publicKey: {                           │
│  │              │      challenge,                            │
│  │              │      rp: { name: "Spritz", id: rpId },    │
│  │              │      user: { id, name, displayName },     │
│  │              │      pubKeyCredParams: [                   │
│  │              │        { alg: -7, type: "public-key" }    │
│  │              │      ],                                    │
│  │              │      authenticatorSelection: {             │
│  │              │        residentKey: "preferred",          │
│  │              │        userVerification: "preferred"      │
│  │              │      }                                     │
│  │              │    }                                       │
│  │              │  })                                        │
│  └──────────────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │   Touch ID   │  User verification (biometric/PIN)        │
│  │   Face ID    │                                           │
│  │   PIN        │                                           │
│  └──────────────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  Returns: {                                                  │
│    id: "base64url credential ID",                           │
│    rawId: ArrayBuffer,                                       │
│    response: {                                               │
│      clientDataJSON: ArrayBuffer,                           │
│      attestationObject: ArrayBuffer (contains publicKey)    │
│    }                                                         │
│  }                                                           │
│                                                              │
│  3. Store Credential                                         │
│  ┌──────────┐    POST /api/auth/webauthn/register           │
│  │  Client  │ ────────────────────────────────►             │
│  └──────────┘    { credential, publicKey: {x, y} }          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### P-256 Key Extraction

```typescript
import {
    decodeAttestationObject,
    parseAuthData,
} from "@simplewebauthn/server/helpers";

export function extractP256PublicKey(
    attestationObject: ArrayBuffer
): P256PublicKey {
    const decoded = decodeAttestationObject(new Uint8Array(attestationObject));
    const authData = parseAuthData(decoded.authData);

    if (!authData.credentialPublicKey) {
        throw new Error("No credential public key found");
    }

    // COSE Key structure for P-256
    // Key type (1): EC2 (2)
    // Algorithm (3): ES256 (-7)
    // Curve (-1): P-256 (1)
    // X coordinate (-2): 32 bytes
    // Y coordinate (-3): 32 bytes

    const coseKey = decodeCBOR(authData.credentialPublicKey);

    const x = coseKey.get(-2) as Uint8Array; // X coordinate
    const y = coseKey.get(-3) as Uint8Array; // Y coordinate

    return {
        x: `0x${Buffer.from(x).toString("hex")}`,
        y: `0x${Buffer.from(y).toString("hex")}`,
    };
}
```

### Authentication Flow

```typescript
// 1. Get authentication options
const { challenge } = await fetch("/api/auth/webauthn/auth-options").then((r) =>
    r.json()
);

// 2. Get credential
const credential = await navigator.credentials.get({
    publicKey: {
        challenge: base64urlToArrayBuffer(challenge),
        rpId: "spritz.chat",
        timeout: 120000,
        userVerification: "preferred",
        allowCredentials: [
            {
                id: base64urlToArrayBuffer(credentialId),
                type: "public-key",
                transports: ["internal", "hybrid"],
            },
        ],
    },
});

// 3. Verify on server
const response = await fetch("/api/auth/webauthn/verify", {
    method: "POST",
    body: JSON.stringify({
        credentialId: credential.id,
        authenticatorData: bufferToBase64url(
            credential.response.authenticatorData
        ),
        clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
        signature: bufferToBase64url(credential.response.signature),
    }),
});
```

---

## WebAuthn P-256 Signature Deep Dive

### Cryptographic Primitives

WebAuthn uses **ECDSA with the P-256 curve** (also known as secp256r1 or prime256v1):

| Parameter               | Value                                              |
| ----------------------- | -------------------------------------------------- |
| **Curve**               | P-256 (NIST)                                       |
| **Field Size**          | 256 bits                                           |
| **Key Size**            | 256 bits (private), 512 bits (public uncompressed) |
| **Signature Size**      | 512 bits (r: 256, s: 256)                          |
| **Hash**                | SHA-256                                            |
| **Algorithm ID (COSE)** | -7 (ES256)                                         |

### WebAuthn Signature Data Structure

When a passkey signs, it produces three pieces of data:

```typescript
interface WebAuthnAssertionResponse {
    // 1. Authenticator Data (≥37 bytes)
    // Contains RP ID hash, flags, and signature counter
    authenticatorData: ArrayBuffer;

    // 2. Client Data JSON
    // Contains challenge, origin, and type
    clientDataJSON: ArrayBuffer;

    // 3. Signature (DER-encoded)
    // ECDSA signature over SHA256(authenticatorData || SHA256(clientDataJSON))
    signature: ArrayBuffer;
}
```

#### Authenticator Data Format

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Authenticator Data                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Bytes 0-31: rpIdHash (SHA-256 of rpId, e.g., "spritz.chat")            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ a379a6f6ee...94a4c6d8e1 (32 bytes)                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Byte 32: Flags                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Bit 0 (UP): User Present       = 1 (required)                      │ │
│  │ Bit 2 (UV): User Verified      = 1 (biometric/PIN used)            │ │
│  │ Bit 6 (AT): Attested Data      = 0 (not for assertions)            │ │
│  │ Bit 7 (ED): Extension Data     = 0/1                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Bytes 33-36: Signature Counter (32-bit big-endian)                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 00 00 00 05 = 5 (increments on each use, anti-replay)              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Bytes 37+: Extensions (optional)                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Client Data JSON Format

```json
{
    "type": "webauthn.get",
    "challenge": "dGhpcyBpcyBhIGNoYWxsZW5nZQ",
    "origin": "https://app.spritz.chat",
    "crossOrigin": false
}
```

The challenge is the **base64url-encoded** data that needs to be signed (e.g., UserOperation hash).

### Signature Verification Process

```typescript
import { p256 } from "@noble/curves/p256";
import { sha256 } from "@noble/hashes/sha256";

/**
 * Complete WebAuthn P-256 signature verification
 */
export function verifyWebAuthnSignature(
    publicKey: { x: Hex; y: Hex },
    authenticatorData: Uint8Array,
    clientDataJSON: string,
    signature: Uint8Array,
    expectedChallenge: Uint8Array
): boolean {
    // 1. Parse and validate clientDataJSON
    const clientData = JSON.parse(clientDataJSON);

    // Verify type
    if (clientData.type !== "webauthn.get") {
        throw new Error("Invalid clientData type");
    }

    // Verify origin
    const allowedOrigins = [
        "https://app.spritz.chat",
        "https://spritz.chat",
        "http://localhost:3000",
    ];
    if (!allowedOrigins.includes(clientData.origin)) {
        throw new Error("Invalid origin");
    }

    // Verify challenge matches
    const receivedChallenge = base64urlDecode(clientData.challenge);
    if (!arraysEqual(receivedChallenge, expectedChallenge)) {
        throw new Error("Challenge mismatch");
    }

    // 2. Compute the signed message
    // WebAuthn signs: SHA256(authenticatorData || SHA256(clientDataJSON))
    const clientDataHash = sha256(new TextEncoder().encode(clientDataJSON));
    const signedData = new Uint8Array([
        ...authenticatorData,
        ...clientDataHash,
    ]);
    const messageHash = sha256(signedData);

    // 3. Parse DER-encoded signature
    const { r, s } = parseDERSignature(signature);

    // 4. Verify with P-256
    const publicKeyBytes = new Uint8Array(65);
    publicKeyBytes[0] = 0x04; // Uncompressed point
    publicKeyBytes.set(hexToBytes(publicKey.x), 1);
    publicKeyBytes.set(hexToBytes(publicKey.y), 33);

    return p256.verify(
        new Uint8Array([...r, ...s]),
        messageHash,
        publicKeyBytes
    );
}
```

### DER Signature Parsing

WebAuthn returns signatures in DER (Distinguished Encoding Rules) format:

```
DER Signature Structure:
0x30 [total-length] 0x02 [r-length] [r-bytes] 0x02 [s-length] [s-bytes]

Example:
30 45                           // SEQUENCE, 69 bytes total
   02 21                        // INTEGER, 33 bytes (r with leading 00)
      00 8b4c2e3f...            // r value (33 bytes, leading 00 for positive)
   02 20                        // INTEGER, 32 bytes
      1a2b3c4d...               // s value (32 bytes)
```

```typescript
/**
 * Parse DER-encoded ECDSA signature to r and s components
 */
export function parseDERSignature(der: Uint8Array): {
    r: Uint8Array; // 32 bytes
    s: Uint8Array; // 32 bytes
} {
    let offset = 0;

    // SEQUENCE tag (0x30)
    if (der[offset++] !== 0x30) {
        throw new Error("Expected SEQUENCE tag");
    }

    // Total length (may be 1 or 2 bytes)
    let totalLength = der[offset++];
    if (totalLength & 0x80) {
        // Long form length
        const numLengthBytes = totalLength & 0x7f;
        totalLength = 0;
        for (let i = 0; i < numLengthBytes; i++) {
            totalLength = (totalLength << 8) | der[offset++];
        }
    }

    // Parse r INTEGER
    if (der[offset++] !== 0x02) {
        throw new Error("Expected INTEGER tag for r");
    }
    let rLength = der[offset++];
    let r = der.slice(offset, offset + rLength);
    offset += rLength;

    // Parse s INTEGER
    if (der[offset++] !== 0x02) {
        throw new Error("Expected INTEGER tag for s");
    }
    let sLength = der[offset++];
    let s = der.slice(offset, offset + sLength);

    // Normalize to 32 bytes each
    // Remove leading zero (added for positive integers in DER)
    if (r.length === 33 && r[0] === 0) r = r.slice(1);
    if (s.length === 33 && s[0] === 0) s = s.slice(1);

    // Pad to 32 bytes if needed
    if (r.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(r, 32 - r.length);
        r = padded;
    }
    if (s.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(s, 32 - s.length);
        s = padded;
    }

    return { r, s };
}
```

### On-Chain Verification with RIP-7212

For on-chain verification, the P-256 signature is verified using either:

1. **RIP-7212 Precompile** (gas-efficient, ~3,450 gas)
2. **Solidity Implementation** (fallback, ~200,000 gas)

```solidity
// RIP-7212 P256 Precompile Interface
interface IP256Verifier {
    /// @notice Verifies a P-256 signature
    /// @param messageHash The 32-byte message hash
    /// @param r The r component of the signature (32 bytes)
    /// @param s The s component of the signature (32 bytes)
    /// @param x The x coordinate of the public key (32 bytes)
    /// @param y The y coordinate of the public key (32 bytes)
    /// @return success 1 if valid, 0 if invalid
    function verify(
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        bytes32 x,
        bytes32 y
    ) external view returns (uint256 success);
}

// Precompile address (standardized across RIP-7212 chains)
address constant P256_VERIFIER = 0x0000000000000000000000000000000000000100;
```

---

## Session Management

### Session Duration Constants

```typescript
// From src/lib/constants.ts
/** Session duration in seconds (7 days) */
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

/** Frontend session token duration in seconds (30 days) */
export const FRONTEND_TOKEN_DURATION_SECONDS = 30 * 24 * 60 * 60;

/** Auth credentials TTL in milliseconds (7 days) */
export const AUTH_CREDENTIALS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Nonce expiry in seconds (5 minutes) */
export const NONCE_EXPIRY_SECONDS = 300;
```

:::info Persistent Sessions
Sessions persist for **7 days** and include auto-detection on app return. When a user returns to the app after closing it, the session is automatically restored if still valid.
:::

### JWT Structure

```typescript
interface SessionPayload {
    address: string; // Spritz ID (wallet address or derived)
    authMethod: AuthMethod; // "wallet" | "passkey" | "email" | "worldid" | "alien" | "solana"
    chainId?: number; // For wallet auth
    passkeyCredentialId?: string; // For passkey auth
    iat: number; // Issued at
    exp: number; // Expiration (7 days)
}

type AuthMethod =
    | "wallet"
    | "passkey"
    | "email"
    | "worldid"
    | "alien"
    | "solana";
```

### Wallet Type Tracking

The system tracks `wallet_type` in the database to determine how to calculate Safe addresses and execute transactions:

| Auth Method | Wallet Type | Safe Address Calculation                        |
| ----------- | ----------- | ----------------------------------------------- |
| EVM Wallet  | `eoa`       | `getSafeAddress(walletAddress)`                 |
| Passkey     | `passkey`   | `getPasskeySafeAddress(publicKeyX, publicKeyY)` |
| World ID    | `world_id`  | Requires passkey creation → `passkey`           |
| Alien ID    | `alien_id`  | Requires passkey creation → `passkey`           |
| Email       | `email`     | Requires passkey creation → `passkey`           |

:::info Auto-fix on Login
For existing users with missing `wallet_type`, the system automatically sets the correct value on login based on the authentication method used.
:::

### Session Verification

```typescript
// Middleware for API routes
export async function verifySession(
    request: NextRequest
): Promise<SessionPayload | null> {
    const token = request.cookies.get("spritz_session")?.value;
    if (!token) return null;

    try {
        const payload = await verifyJWT(token);
        return payload as SessionPayload;
    } catch {
        return null;
    }
}

// Usage in API route
export async function GET(request: NextRequest) {
    const session = await verifySession(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use session.address for user identification
    const userData = await getUserData(session.address);
    return NextResponse.json(userData);
}
```

### Session Storage

Sessions are stored in Supabase for multi-device support:

```sql
CREATE TABLE shout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL REFERENCES shout_user_settings(wallet_address),
    token_hash TEXT NOT NULL,  -- SHA-256 hash of JWT
    auth_method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);
```

### User Settings Storage

User wallet type is stored in the user settings table:

```sql
-- wallet_type column in shout_user_settings
ALTER TABLE shout_user_settings
ADD COLUMN wallet_type TEXT;

-- Possible values: 'eoa', 'passkey', 'world_id', 'alien_id', 'email'
-- This determines how Safe addresses are calculated
```

---

## Rate Limiting

### Rate Limit Constants

```typescript
// From src/lib/constants.ts
/** Auth endpoint rate limit (requests per minute) */
export const RATE_LIMIT_AUTH = 10;

/** AI chat rate limit (requests per minute) */
export const RATE_LIMIT_AI = 30;

/** Messaging rate limit (requests per minute) */
export const RATE_LIMIT_MESSAGING = 60;

/** General API rate limit (requests per minute) */
export const RATE_LIMIT_GENERAL = 100;

/** Strict rate limit for sensitive operations (requests per minute) */
export const RATE_LIMIT_STRICT = 5;

/** Contact form rate limit (requests per minute) */
export const RATE_LIMIT_CONTACT = 3;

/** Rescue flow rate limit per address (attempts per hour) */
export const RATE_LIMIT_RESCUE_PER_ADDRESS = 3;
```

### Implementation

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_AUTH } from "@/lib/constants";

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_AUTH, "1 m"),
    analytics: true,
});

export async function rateLimitMiddleware(
    identifier: string
): Promise<{ success: boolean; remaining: number }> {
    const { success, remaining, reset } = await ratelimit.limit(identifier);

    if (!success) {
        throw new RateLimitError(
            `Rate limit exceeded. Reset at ${new Date(reset)}`
        );
    }

    return { success, remaining };
}
```

### Rate Limits by Endpoint

| Endpoint                  | Limit | Window   | Constant               |
| ------------------------- | ----- | -------- | ---------------------- |
| `/api/auth/verify` (GET)  | 10    | 1 minute | `RATE_LIMIT_AUTH`      |
| `/api/auth/verify` (POST) | 5     | 1 minute | `RATE_LIMIT_STRICT`    |
| `/api/auth/webauthn/*`    | 10    | 1 minute | `RATE_LIMIT_AUTH`      |
| `/api/agents/*/chat`      | 30    | 1 minute | `RATE_LIMIT_AI`        |
| `/api/streams`            | 5     | 1 minute | `RATE_LIMIT_STRICT`    |
| `/api/messages/*`         | 60    | 1 minute | `RATE_LIMIT_MESSAGING` |
| `/api/contact`            | 3     | 1 minute | `RATE_LIMIT_CONTACT`   |
| General API routes        | 100   | 1 minute | `RATE_LIMIT_GENERAL`   |

---

## Third-Party Auth Integration

### World ID

```typescript
// Verify World ID proof
const verifyResponse = await fetch(
    `https://developer.worldcoin.org/api/v1/verify/${process.env.WORLDCOIN_APP_ID}`,
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "spritz-login",
            signal: signalData,
            proof: proof,
            merkle_root: merkle_root,
            nullifier_hash: nullifier_hash,
        }),
    }
);

// Use nullifier_hash as Spritz ID (unique per user per app)
const spritzId = `world:${nullifier_hash}`;
```

### Alien ID

Spritz supports two Alien authentication flows: **SSO** (browser-based) and **Mini App** (embedded inside the Alien app).

#### SSO Flow

```typescript
import { AlienSsoProvider, useAuth, SignInButton } from "@alien_org/sso-sdk-react";

// 1. Wrap app with AlienSsoProvider
<AlienSsoProvider
    config={{
        ssoBaseUrl: "https://sso.alien-api.com",
        providerAddress: "000000010400000000000f89739b0806",
    }}
>
    {/* App content */}
</AlienSsoProvider>

// 2. Use the SignInButton and useAuth hook
function AlienLogin() {
    const { auth } = useAuth();

    useEffect(() => {
        if (auth?.isAuthenticated && auth?.token) {
            // Extract alienAddress from token (priority: sub > user_id)
            const alienAddress = auth.tokenInfo?.sub || auth.tokenInfo?.user_id;

            // Create server session
            fetch("/api/auth/alien-id", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Required for session cookie
                body: JSON.stringify({ alienAddress, token: auth.token }),
            });
        }
    }, [auth?.isAuthenticated, auth?.token]);

    return <SignInButton color="dark" />;
}
```

#### Mini App Flow

```typescript
import { isBridgeAvailable, getLaunchParams, send } from "@alien_org/bridge";

// 1. Detect Mini App environment
const isInAlienApp = isBridgeAvailable();

if (isInAlienApp) {
    // 2. Get auth token from launch params
    const params = getLaunchParams();
    const authToken = params?.authToken || window.__ALIEN_AUTH_TOKEN__;

    // 3. Auto-authenticate with the injected token
    await fetch("/api/auth/alien-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            token: authToken,
            isMiniApp: true, // Server extracts address from token
        }),
    });

    // 4. Signal the host app that mini app is ready
    send("app:ready", {});
}
```

#### Server Validation (`POST /api/auth/alien-id`)

```typescript
// SSO Flow: alienAddress + token (verifies address matches token)
// Mini App Flow: token + isMiniApp (extracts address from token)

const { alienAddress: providedAddress, token, isMiniApp } = await request.json();

// Decode JWT and extract user identifier
const payload = JSON.parse(atob(token.split(".")[1]));
const tokenAddress = payload.sub || payload.user_id;

if (isMiniApp) {
    // Mini App: trust the token's address
    alienAddress = tokenAddress;
} else {
    // SSO: CRITICAL - verify provided address matches token
    if (tokenAddress.toLowerCase() !== providedAddress.toLowerCase()) {
        return NextResponse.json(
            { error: "Token does not match claimed address" },
            { status: 401 }
        );
    }
    alienAddress = providedAddress;
}

// Check token expiration
if (payload.exp && payload.exp * 1000 < Date.now()) {
    return NextResponse.json({ error: "Token expired" }, { status: 401 });
}

// Create user with wallet_type = "alien_id" and session cookie
return createAuthResponse(alienAddress, "alien_id", { success: true });
```

For the complete integration guide including bridge SDK setup, session management, and troubleshooting, see [Alien Integration](/docs/developers/alien-integration).

### Email (Magic Link)

```typescript
// Send magic link
const token = generateSecureToken();
await supabase.from("shout_magic_links").insert({
    email: email,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
});

await sendEmail({
    to: email,
    subject: "Sign in to Spritz",
    body: `Sign in to Spritz: https://app.spritz.chat/auth/verify?token=${token}`,
});

// Verify magic link
const link = await supabase
    .from("shout_magic_links")
    .select()
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .single();

if (!link) throw new Error("Invalid or expired link");

// Create session with email-derived ID
const spritzId = `email:${hashEmail(email)}`;
```

---

## Security Best Practices

### Token Security

| Practice              | Implementation           |
| --------------------- | ------------------------ |
| **HTTP-only cookies** | Prevents XSS token theft |
| **Secure flag**       | HTTPS only               |
| **SameSite=Strict**   | Prevents CSRF            |
| **Short nonce TTL**   | 5 minutes max            |

### Signature Verification

1. **Verify nonce** - Ensure nonce hasn't been used
2. **Check expiration** - Reject expired messages
3. **Validate domain** - Match expected domain
4. **Recover address** - Confirm signer matches claimed address

### Session Invalidation

```typescript
// Logout endpoint
export async function POST(request: NextRequest) {
    const session = await verifySession(request);
    if (session) {
        // Invalidate session in database
        await supabase
            .from("shout_sessions")
            .delete()
            .eq("user_address", session.address);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("spritz_session");
    return response;
}
```

---

## Error Handling

### Common Auth Errors

| Error               | Code | Cause                         | Solution          |
| ------------------- | ---- | ----------------------------- | ----------------- |
| `Invalid nonce`     | 401  | Nonce expired or reused       | Request new nonce |
| `Invalid signature` | 401  | Signature verification failed | Re-sign message   |
| `Session expired`   | 401  | JWT expired                   | Re-authenticate   |
| `Rate limited`      | 429  | Too many requests             | Wait and retry    |
| `Passkey failed`    | 400  | WebAuthn error                | Check credential  |

### Error Response Format

```typescript
interface AuthErrorResponse {
    error: string;
    code: string;
    message?: string;
    retryAfter?: number; // For rate limiting
}
```

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
│  1. Request Nonce                                            │
│  ┌──────────┐    GET /api/auth/nonce                        │
│  │  Client  │ ────────────────────────────────►             │
│  └──────────┘ ◄────────────────────────────────             │
│                   { nonce: "abc123..." }                     │
│                                                              │
│  2. Create SIWE Message                                      │
│  ┌──────────────────────────────────────────────┐           │
│  │ app.spritz.chat wants you to sign in...      │           │
│  │                                               │           │
│  │ URI: https://app.spritz.chat                 │           │
│  │ Version: 1                                    │           │
│  │ Chain ID: 8453                               │           │
│  │ Nonce: abc123...                              │           │
│  │ Issued At: 2025-01-17T12:00:00Z              │           │
│  │ Expiration Time: 2025-01-17T12:10:00Z        │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  3. Sign Message (Wallet)                                    │
│  ┌──────────┐                                               │
│  │  Wallet  │  signMessage(siweMessage)                     │
│  │ (MM/RK)  │  → signature: 0x...                           │
│  └──────────┘                                               │
│                                                              │
│  4. Verify Signature                                         │
│  ┌──────────┐    POST /api/auth/verify                      │
│  │  Client  │ ────────────────────────────────►             │
│  └──────────┘    { message, signature }                     │
│                                                              │
│  5. Create Session                                           │
│  ◄────────────────────────────────────────────              │
│  Set-Cookie: spritz_session=jwt...; HttpOnly                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// 1. Get nonce
const { nonce } = await fetch("/api/auth/nonce").then((r) => r.json());

// 2. Create SIWE message
import { SiweMessage } from "siwe";

const message = new SiweMessage({
    domain: window.location.host,
    address: userAddress,
    statement: "Sign in to Spritz",
    uri: window.location.origin,
    version: "1",
    chainId: chainId,
    nonce: nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
});

const messageToSign = message.prepareMessage();

// 3. Sign with wallet
const signature = await signMessage({ message: messageToSign });

// 4. Verify and create session
const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: messageToSign, signature }),
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

## Session Management

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

---

## Rate Limiting

### Implementation

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
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

| Endpoint               | Limit | Window   |
| ---------------------- | ----- | -------- |
| `/api/auth/nonce`      | 10    | 1 minute |
| `/api/auth/verify`     | 5     | 1 minute |
| `/api/auth/webauthn/*` | 10    | 1 minute |
| `/api/agents/*/chat`   | 20    | 1 minute |
| `/api/streams`         | 5     | 1 minute |

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

```typescript
// Verify Alien ID token
const alienResponse = await fetch("https://api.alien.xyz/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${alienToken}` },
});

const { alienAddress, verified } = await alienResponse.json();

// Use alienAddress as Spritz ID
const spritzId = `alien:${alienAddress}`;
```

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
    body: `Click here to sign in: https://app.spritz.chat/auth/verify?token=${token}`,
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

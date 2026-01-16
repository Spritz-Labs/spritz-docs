---
title: Authentication
description: Deep dive into Spritz authentication methods - SIWE/SIWS, Passkeys, Email, and Digital ID (World ID, Alien). Learn how sessions, nonces, and security work.
keywords:
    [
        authentication,
        SIWE,
        SIWS,
        passkey,
        WebAuthn,
        session management,
        JWT,
        Web3 login,
    ]
sidebar_label: Authentication
sidebar_position: 2
---

# Authentication

Spritz supports multiple authentication methods, each designed for different user preferences and security requirements. All methods result in a unified session that works across the platform.

## Overview

| Method | Best For | Security Level | Key Type |
|--------|----------|----------------|----------|
| SIWE (Ethereum) | Web3 natives | High | EOA wallet |
| SIWS (Solana) | Solana users | High | Ed25519 wallet |
| Passkey | Mainstream users | Very High | WebAuthn + P256 |
| Email | Non-crypto users | Medium | Derived EOA |
| Digital ID | Verified humans | Very High | Identity provider |

## Architecture

All authentication flows result in:

1. **HTTP-only Session Cookie** (`spritz_session`) - Secure, server-validated JWT
2. **User Record** - Created/updated in `shout_users` table
3. **Frontend Token** - Optional signed token for client-side state

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│  Auth API    │─────▶│  Database   │
│  (Browser)  │      │  (/api/auth) │      │  (Postgres) │
└─────────────┘      └──────────────┘      └─────────────┘
       │                    │
       │                    ▼
       │              ┌──────────┐
       │              │  Session │
       │              │   JWT    │
       │              └──────────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌──────────────┐
│ localStorage│      │ HTTP-only    │
│   (token)   │      │   Cookie     │
└─────────────┘      └──────────────┘
```

---

## Sign-In with Ethereum (SIWE)

SIWE is the standard for Web3 authentication. Users sign a message with their wallet to prove ownership.

### Flow

```
1. Client requests message → GET /api/auth/verify?address=0x...
2. Server generates nonce, stores it, returns SIWE message
3. User signs message in wallet
4. Client sends signature → POST /api/auth/verify
5. Server verifies signature + nonce, creates session
6. Session cookie set, user authenticated
```

### Message Format

```typescript
// SIWE message structure
function generateSIWEMessage(address: string, nonce: string, domain: string): string {
    const issuedAt = new Date().toISOString();
    return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to Spritz

URI: https://${domain}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}
```

### API Endpoints

**GET `/api/auth/verify?address={address}`**

Returns a message to sign:

```json
{
  "message": "app.spritz.chat wants you to sign in...",
  "nonce": "a1b2c3d4e5f6..."
}
```

**POST `/api/auth/verify`**

Verifies the signature:

```typescript
// Request body
{
  "address": "0x1234...",
  "signature": "0xabcd...",
  "message": "app.spritz.chat wants you to sign in..."
}

// Response (success)
{
  "verified": true,
  "authenticated": true,
  "user": {
    "id": "uuid",
    "wallet_address": "0x1234...",
    "username": "alice",
    // ... more fields
  }
}
```

### Server Implementation

```typescript
// Signature verification using viem
import { verifyMessage } from "viem";

const isValid = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
});

if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

### Client Implementation

```typescript
import { useSignMessage } from "wagmi";

const { signMessageAsync } = useSignMessage();

// Get message to sign
const { message } = await fetch(`/api/auth/verify?address=${address}`).then(r => r.json());

// Sign with wallet
const signature = await signMessageAsync({ message });

// Verify
const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Important for cookies!
    body: JSON.stringify({ address, signature, message }),
});
```

---

## Sign-In with Solana (SIWS)

Similar to SIWE but uses Ed25519 signatures native to Solana.

### Key Differences from SIWE

- Uses `nacl.sign.detached.verify` instead of `verifyMessage`
- Addresses are base58 encoded (case-sensitive)
- Message format slightly different

### Signature Verification

```typescript
import nacl from "tweetnacl";
import bs58 from "bs58";

function verifySolanaSignature(
    message: string,
    signature: string,
    publicKey: string
): boolean {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);
    
    return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
    );
}
```

---

## Passkey Authentication (WebAuthn)

Passkeys provide the highest security with the best UX - no passwords, no seed phrases.

### How It Works

1. **Registration**: User creates a passkey (Face ID, Touch ID, Windows Hello)
2. **Credential stored**: Public key saved server-side, private key stays on device
3. **Login**: Device signs challenge with private key
4. **Verification**: Server verifies signature with stored public key

### Key Components

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│  WebAuthn    │─────▶│  Server-side    │─────▶│   Database   │
│  Credential  │      │  Verification   │      │  passkey_    │
│  (P256 key)  │      │                 │      │  credentials │
└──────────────┘      └─────────────────┘      └──────────────┘
```

### Registration Flow

**1. Get Registration Options**

```typescript
// POST /api/passkey/register/options
const response = await fetch("/api/passkey/register/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        userAddress: tempAddress,
        displayName: "Alice",
    }),
});

const { options } = await response.json();
```

**2. Create Credential (Browser)**

```typescript
import { startRegistration } from "@simplewebauthn/browser";

const credential = await startRegistration({ optionsJSON: options });
```

**3. Verify and Store**

```typescript
// POST /api/passkey/register/verify
const verifyResponse = await fetch("/api/passkey/register/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
        userAddress: tempAddress,
        displayName: "Alice",
        credential,
        challenge: options.challenge,
    }),
});

const { sessionToken, userAddress } = await verifyResponse.json();
```

### Login Flow

**1. Get Authentication Options**

```typescript
const optionsResponse = await fetch("/api/passkey/login/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ useDevicePasskey: false }),
});

const { options } = await optionsResponse.json();
```

**2. Authenticate (Browser)**

```typescript
import { startAuthentication } from "@simplewebauthn/browser";

const credential = await startAuthentication({ optionsJSON: options });
```

**3. Verify**

```typescript
const verifyResponse = await fetch("/api/passkey/login/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
        credential,
        challenge: options.challenge,
    }),
});
```

### P256 Public Key Extraction

Passkey credentials use P256 (secp256r1) keys. We extract the coordinates for Safe wallet integration:

```typescript
// Parse COSE public key to extract P256 coordinates
export function parseCosePublicKey(coseKeyBase64: string): P256PublicKey {
    const coseBytes = Buffer.from(coseKeyBase64, "base64");
    const parsed = parseCborMap(coseBytes);
    
    // Validate: kty=EC2, alg=ES256, crv=P-256
    if (parsed.get(1) !== 2) throw new Error("Invalid key type");
    if (parsed.get(3) !== -7) throw new Error("Invalid algorithm");
    if (parsed.get(-1) !== 1) throw new Error("Invalid curve");
    
    const x = parsed.get(-2); // 32 bytes
    const y = parsed.get(-3); // 32 bytes
    
    return {
        x: bytesToHex(new Uint8Array(x)),
        y: bytesToHex(new Uint8Array(y)),
    };
}
```

### Cross-Device Support

Passkeys support authentication across devices using WebAuthn's hybrid transport:

```typescript
const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge: fromBase64url(options.challenge),
    rpId: "spritz.chat",  // Parent domain for all subdomains
    timeout: 120000,
    userVerification: "preferred",
    allowCredentials: [{
        id: credentialIdBuffer,
        type: "public-key",
        transports: ["internal", "hybrid"],  // Hybrid enables cross-device
    }],
};
```

---

## Session Management

### Session Token Structure

```typescript
interface SessionPayload {
    userAddress: string;
    userId?: string;
    authMethod: "wallet" | "email" | "passkey" | "world_id" | "alien_id" | "solana";
    iat: number;  // Issued at (seconds)
    exp: number;  // Expiration (seconds)
}
```

### Creating Sessions

```typescript
import { SignJWT } from "jose";

const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days

async function createSessionToken(
    userAddress: string,
    authMethod: SessionPayload["authMethod"],
    userId?: string
): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    return new SignJWT({
        userAddress: userAddress.toLowerCase(),
        userId,
        authMethod,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(now)
        .setExpirationTime(now + SESSION_DURATION)
        .sign(encodedSecret);
}
```

### Session Cookie Configuration

```typescript
response.cookies.set("spritz_session", token, {
    httpOnly: true,           // Not accessible via JavaScript
    secure: true,             // HTTPS only in production
    sameSite: "lax",          // CSRF protection
    maxAge: SESSION_DURATION,
    path: "/",
});
```

### Validating Sessions

```typescript
import { jwtVerify } from "jose";

async function getAuthenticatedUser(request: NextRequest): Promise<SessionPayload | null> {
    // Try cookie first
    const cookieToken = request.cookies.get("spritz_session")?.value;
    if (cookieToken) {
        const payload = await verifySessionToken(cookieToken);
        if (payload) return payload;
    }
    
    // Fallback: Authorization header (for API clients)
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const payload = await verifySessionToken(token);
        if (payload) return payload;
    }
    
    return null;
}
```

---

## Nonce Management

Nonces prevent replay attacks by ensuring each authentication attempt is unique.

### Generating Nonces

```typescript
import { randomBytes } from "crypto";

function generateSecureNonce(): string {
    return randomBytes(32).toString("hex");
}
```

### Storing Nonces

```typescript
async function storeNonce(address: string, nonce: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await db.from("auth_nonces").insert({
        address: address.toLowerCase(),
        nonce,
        expires_at: expiresAt.toISOString(),
    });
}
```

### Verifying and Consuming

```typescript
async function verifyAndConsumeNonce(address: string, nonce: string): Promise<boolean> {
    const { data, error } = await db
        .from("auth_nonces")
        .select("*")
        .eq("address", address.toLowerCase())
        .eq("nonce", nonce)
        .eq("used", false)
        .single();
    
    if (error || !data) return false;
    if (new Date(data.expires_at) < new Date()) return false;
    
    // Mark as used (atomic operation)
    await db
        .from("auth_nonces")
        .update({ used: true })
        .eq("id", data.id);
    
    return true;
}
```

---

## CSRF Protection

### Origin Validation

```typescript
const ALLOWED_ORIGINS = [
    "https://spritz.chat",
    "https://app.spritz.chat",
    "http://localhost:3000", // Development only
];

function validateCsrf(request: NextRequest): boolean {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    
    // For same-origin requests
    if (!origin && !referer) {
        // Allow GET/HEAD/OPTIONS (safe methods)
        if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
            return true;
        }
        // For mutations, require custom header (API clients)
        return request.headers.get("authorization")?.startsWith("Bearer ");
    }
    
    // Check if origin is allowed
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return true;
    }
    
    return false;
}
```

---

## Rate Limiting

Authentication endpoints are rate-limited to prevent brute force attacks:

```typescript
// 10 requests per minute for auth endpoints
const rateLimitResponse = await checkRateLimit(request, "auth");
if (rateLimitResponse) return rateLimitResponse;
```

---

## Security Best Practices

### Environment Variables

```env
# Required - NO fallback in production
SESSION_SECRET=your-256-bit-secret-here

# Or use NextAuth secret
NEXTAUTH_SECRET=your-256-bit-secret-here
```

### Key Security Measures

1. **No fallback secrets in production** - App fails to start without proper config
2. **HTTP-only cookies** - Session tokens not accessible via JavaScript
3. **Nonce expiration** - 5-minute window prevents replay attacks
4. **Rate limiting** - Prevents brute force attempts
5. **CSRF validation** - Origin checking on mutations
6. **Signature verification** - Cryptographic proof of ownership

### Secure Session Extension

```typescript
// POST /api/auth/session
// Only extends sessions if a valid session already exists
const existingSession = await getAuthenticatedUser(request);
if (!existingSession) {
    return NextResponse.json(
        { error: "Authentication required. Please login again." },
        { status: 401 }
    );
}

// Create new session with extended expiry
return createAuthResponse(
    existingSession.userAddress,
    existingSession.authMethod,
    { success: true, extended: true }
);
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE shout_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    chain TEXT DEFAULT 'evm',
    username TEXT UNIQUE,
    email TEXT,
    email_verified BOOLEAN DEFAULT false,
    first_login TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    smart_wallet_address TEXT,
    -- ... more fields
);
```

### Passkey Credentials Table

```sql
CREATE TABLE passkey_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    user_address TEXT NOT NULL,
    display_name TEXT,
    backed_up BOOLEAN DEFAULT false,
    -- P256 coordinates for Safe integration
    public_key_x TEXT,
    public_key_y TEXT,
    safe_signer_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Next Steps

- [Smart Wallets](/docs/developers/smart-wallets) - How passkeys integrate with Safe
- [API Reference](/docs/api/intro) - Complete API documentation
- [Messaging](/docs/developers/messaging) - Logos messaging integration

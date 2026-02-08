---
title: Alien Integration - SSO & Mini App
description: "Complete guide to integrating Alien ID SSO authentication and Alien Mini App into Spritz. Covers SDK setup, authentication flows, token handling, and security."
keywords:
    [
        Spritz,
        Alien ID,
        Alien SSO,
        Alien Mini App,
        authentication,
        JWT,
        bridge SDK,
        digital identity,
    ]
sidebar_label: Alien Integration
sidebar_position: 11
---

# Alien Integration - SSO & Mini App

Complete technical guide to integrating Alien ID authentication into Spritz, covering both **Alien SSO** (browser-based login) and **Alien Mini App** (embedded app within the Alien ecosystem).

## Overview

Spritz supports two distinct Alien authentication flows:

| Flow | Use Case | SDK | Token Source |
|------|----------|-----|-------------|
| **Alien SSO** | Users sign in via browser | `@alien_org/sso-sdk-react` | SSO modal returns JWT |
| **Alien Mini App** | Spritz runs inside the Alien app | `@alien_org/bridge` | Injected via launch params |

Both flows result in a verified Alien ID user with a Spritz session, but they differ in how the authentication token is obtained and validated.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ALIEN AUTHENTICATION FLOWS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │       ALIEN SSO FLOW         │  │     ALIEN MINI APP FLOW      │    │
│  │                               │  │                               │    │
│  │  1. User clicks "Sign in     │  │  1. App loads inside Alien    │    │
│  │     with Alien ID"           │  │     app container             │    │
│  │  2. SSO modal opens          │  │  2. Bridge SDK detects        │    │
│  │  3. User authenticates       │  │     environment               │    │
│  │  4. SDK returns JWT token    │  │  3. Auth token extracted      │    │
│  │  5. Client sends token +     │  │     from launch params        │    │
│  │     alienAddress to server   │  │  4. Client sends token +      │    │
│  │  6. Server validates &       │  │     isMiniApp flag to server  │    │
│  │     creates session          │  │  5. Server validates &        │    │
│  │                               │  │     creates session           │    │
│  └──────────────┬───────────────┘  └──────────────┬───────────────┘    │
│                  │                                  │                     │
│                  ▼                                  ▼                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    POST /api/auth/alien-id                       │    │
│  │                                                                   │    │
│  │  • Validates JWT format and expiration                           │    │
│  │  • Extracts user identifier (sub / user_id)                     │    │
│  │  • Creates/updates user with wallet_type = "alien_id"           │    │
│  │  • Auto-joins user to "alien" channel                           │    │
│  │  • Creates HTTP-only session cookie (7-day expiry)              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dependencies

Install the required Alien SDKs:

```bash
npm install @alien_org/sso-sdk-react @alien_org/bridge
```

| Package | Version | Purpose |
|---------|---------|---------|
| `@alien_org/sso-sdk-react` | ^1.0.39 | SSO authentication UI and hooks |
| `@alien_org/bridge` | ^0.2.2 | Mini App bridge for communication with Alien host app |

---

## Environment Variables

```env
# Alien SSO Configuration
NEXT_PUBLIC_ALIEN_SSO_BASE_URL=https://sso.alien-api.com
NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS=000000010400000000000f89739b0806
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_ALIEN_SSO_BASE_URL` | No | `https://sso.alien-api.com` | Alien SSO API base URL |
| `NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS` | No | `000000010400000000000f89739b0806` | Your registered provider address with Alien |

:::info
Both variables have sensible defaults. You only need to set them if you have a custom Alien provider configuration or are targeting a different SSO environment.
:::

---

## Alien SSO Integration

### 1. SSO Provider Setup

Wrap your application with the `AlienSsoProvider` to initialize the SDK:

```typescript
import { AlienSsoProvider } from "@alien_org/sso-sdk-react";

function AlienAuthProvider({ children }: { children: React.ReactNode }) {
    const ssoBaseUrl =
        process.env.NEXT_PUBLIC_ALIEN_SSO_BASE_URL ||
        "https://sso.alien-api.com";
    const providerAddress =
        process.env.NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS ||
        "000000010400000000000f89739b0806";

    return (
        <AlienSsoProvider
            config={{
                ssoBaseUrl,
                providerAddress,
            }}
        >
            {children}
        </AlienSsoProvider>
    );
}
```

:::warning SSR Compatibility
The Alien SSO SDK requires browser APIs. Use dynamic imports or client-side checks to avoid SSR issues:

```typescript
import dynamic from "next/dynamic";

const AlienSsoProvider = dynamic(
    () =>
        import("@alien_org/sso-sdk-react").then(
            (mod) => mod.AlienSsoProvider
        ),
    { ssr: false }
);
```
:::

### 2. Sign-In Button

The SDK provides a pre-built `SignInButton` component:

```typescript
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues
const SignInButton = dynamic(
    () =>
        import("@alien_org/sso-sdk-react").then((mod) => mod.SignInButton),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-12 bg-zinc-800 rounded-xl animate-pulse" />
        ),
    }
);

function AlienLoginButton() {
    return (
        <div className="w-full">
            <SignInButton color="dark" />
        </div>
    );
}
```

When clicked, the `SignInButton` opens the Alien SSO modal where the user authenticates. After successful authentication, the `useAuth()` hook state updates automatically.

### 3. Auth State Hook

Use the `useAuth()` hook from the Alien SDK to react to authentication changes:

```typescript
import { useAuth } from "@alien_org/sso-sdk-react";

function useAlienAuth() {
    const { auth } = useAuth();

    // auth.isAuthenticated - Whether the user is logged in
    // auth.token           - JWT token string
    // auth.tokenInfo       - Decoded token payload (sub, iss, aud, exp, etc.)
    // auth.tokenInfo.sub   - User identifier (the alienAddress)

    return auth;
}
```

### 4. Extracting the User Identifier

The Alien token contains the user identifier in the JWT payload. Extract it with this priority:

```typescript
function extractAlienAddress(
    token: string | null,
    tokenInfo: Record<string, unknown> | null
): string | null {
    // Priority 1: tokenInfo.sub (official user identifier per Alien docs)
    if (tokenInfo?.sub) {
        return tokenInfo.sub as string;
    }

    // Priority 2: tokenInfo.user_id (fallback)
    if (tokenInfo?.user_id) {
        return tokenInfo.user_id as string;
    }

    // Priority 3: Decode JWT payload directly
    if (token) {
        try {
            const parts = token.split(".");
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                return payload.sub || payload.user_id || null;
            }
        } catch (e) {
            console.error("Failed to decode Alien JWT:", e);
        }
    }

    return null;
}
```

:::info Token Identifier Priority
The `sub` claim is the official user identifier per Alien's documentation. The `user_id` field is a fallback for older SDK versions. Always check `sub` first.
:::

### 5. Creating the Server Session

After extracting the token and address, send them to the server to create a session:

```typescript
async function createAlienSession(
    alienAddress: string,
    token: string
): Promise<boolean> {
    const response = await fetch("/api/auth/alien-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Required for session cookie
        body: JSON.stringify({ alienAddress, token }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create session");
    }

    return true;
}
```

### 6. Complete SSO Flow Example

Putting it all together in a React context provider:

```typescript
import { useAuth } from "@alien_org/sso-sdk-react";
import { useEffect, useState, useCallback } from "react";

function AlienAuthInner({ children }: { children: React.ReactNode }) {
    const { auth } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [alienAddress, setAlienAddress] = useState<string | null>(null);

    useEffect(() => {
        if (auth?.isAuthenticated && auth?.token) {
            const tokenInfo = auth.tokenInfo || {};
            const address = extractAlienAddress(auth.token, tokenInfo);

            if (address) {
                // Create server-side session
                fetch("/api/auth/alien-id", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        alienAddress: address,
                        token: auth.token,
                    }),
                    credentials: "include",
                })
                    .then((res) => {
                        if (res.ok) {
                            setIsAuthenticated(true);
                            setAlienAddress(address);

                            // Persist session locally
                            localStorage.setItem(
                                "spritz_alien_address",
                                address
                            );
                            localStorage.setItem(
                                "spritz_alien_session",
                                JSON.stringify({
                                    token: auth.token,
                                    exp: tokenInfo.exp
                                        ? (tokenInfo.exp as number) * 1000
                                        : Date.now() + 30 * 24 * 60 * 60 * 1000,
                                })
                            );
                        }
                    })
                    .catch(console.error);
            }
        }
    }, [auth?.isAuthenticated, auth?.token]);

    // ... render provider with state
}
```

---

## Alien Mini App Integration

When Spritz runs as a **Mini App inside the Alien app**, the authentication flow is different. The Alien host app injects an auth token automatically, so no user interaction is needed.

### 1. Detecting the Mini App Environment

Use the `@alien_org/bridge` SDK to detect if the app is running inside Alien:

```typescript
import { useState, useEffect, useCallback } from "react";

interface AlienLaunchParams {
    authToken?: string;
    contractVersion?: string;
    hostAppVersion?: string;
    platform?: "ios" | "android" | "web";
    startParam?: string;
}

// Extend Window for the injected token fallback
declare global {
    interface Window {
        __ALIEN_AUTH_TOKEN__?: string;
    }
}

interface UseAlienMiniAppReturn {
    /** Whether the app is running inside the Alien app */
    isInsideAlienApp: boolean;
    /** The auth token injected by the Alien app */
    authToken: string | null;
    /** Launch parameters from the Alien app */
    launchParams: AlienLaunchParams | null;
    /** Whether the hook is still loading */
    isLoading: boolean;
    /** Send a message to the Alien host app */
    send: (method: string, payload?: Record<string, unknown>) => void;
}
```

### 2. The `useAlienMiniApp` Hook

This hook handles bridge detection, token extraction, and host app communication:

```typescript
export function useAlienMiniApp(): UseAlienMiniAppReturn {
    const [isInsideAlienApp, setIsInsideAlienApp] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [launchParams, setLaunchParams] =
        useState<AlienLaunchParams | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [bridgeModule, setBridgeModule] =
        useState<typeof import("@alien_org/bridge") | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") {
            setIsLoading(false);
            return;
        }

        const loadBridge = async () => {
            try {
                const bridge = await import("@alien_org/bridge");
                setBridgeModule(bridge);

                // Check if running inside Alien app
                const isAvailable = bridge.isBridgeAvailable();
                setIsInsideAlienApp(isAvailable);

                if (isAvailable) {
                    // Get launch params (includes auth token)
                    const params =
                        bridge.getLaunchParams() as AlienLaunchParams;
                    if (params) {
                        setLaunchParams(params);
                        if (params.authToken) {
                            setAuthToken(params.authToken);
                        }
                    }

                    // Fallback: check window-injected token
                    if (!params?.authToken && window.__ALIEN_AUTH_TOKEN__) {
                        setAuthToken(window.__ALIEN_AUTH_TOKEN__);
                    }

                    // Signal that the mini app is ready
                    (bridge.send as (m: string, p: unknown) => void)(
                        "app:ready",
                        {}
                    );
                }
            } catch (error) {
                console.warn("Failed to load Alien bridge:", error);
                setIsInsideAlienApp(false);
            } finally {
                setIsLoading(false);
            }
        };

        loadBridge();
    }, []);

    const send = useCallback(
        (method: string, payload: Record<string, unknown> = {}) => {
            if (bridgeModule && isInsideAlienApp) {
                try {
                    (
                        bridgeModule.send as (
                            m: string,
                            p: unknown
                        ) => void
                    )(method, payload);
                } catch (error) {
                    console.warn("Failed to send to Alien app:", error);
                }
            }
        },
        [bridgeModule, isInsideAlienApp]
    );

    return { isInsideAlienApp, authToken, launchParams, isLoading, send };
}
```

### 3. Auto-Authentication in Mini App

When the bridge is available and has a token, authenticate automatically without user interaction:

```typescript
function AlienMiniAppAuth() {
    const { isInsideAlienApp, authToken, isLoading } = useAlienMiniApp();
    const [autoAuthenticating, setAutoAuthenticating] = useState(false);

    useEffect(() => {
        if (isInsideAlienApp && authToken && !autoAuthenticating) {
            const autoAuth = async () => {
                setAutoAuthenticating(true);

                try {
                    const res = await fetch("/api/auth/alien-id", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            token: authToken,
                            isMiniApp: true, // Tells server to extract address from token
                        }),
                        credentials: "include",
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || "Auth failed");
                    }

                    // Reload to pick up the new session
                    window.location.reload();
                } catch (err) {
                    console.error("Mini App auto-auth error:", err);
                } finally {
                    setAutoAuthenticating(false);
                }
            };

            // Small delay to ensure initialization
            const timer = setTimeout(autoAuth, 500);
            return () => clearTimeout(timer);
        }
    }, [isInsideAlienApp, authToken, autoAuthenticating]);

    if (isLoading || autoAuthenticating) {
        return <div>Signing in with Alien...</div>;
    }

    return null;
}
```

### 4. Bridge Communication

Send messages to the Alien host app using the `send` method:

```typescript
const { send, isInsideAlienApp } = useAlienMiniApp();

// Signal the app is ready
send("app:ready", {});

// Send custom events to the host app
send("custom:event", { data: "value" });
```

### 5. Mini App UI Considerations

When running as a Mini App, hide unnecessary UI elements:

```typescript
function AppLayout() {
    const { isInsideAlienApp } = useAlienMiniApp();

    return (
        <div>
            {/* Hide tab navigation in Mini App mode */}
            {!isInsideAlienApp && <TabNavigation />}

            {/* Show only Alien login when in Mini App */}
            {isInsideAlienApp ? (
                <AlienAuth alienOnly={true} />
            ) : (
                <FullAuthOptions />
            )}
        </div>
    );
}
```

---

## Server-Side API Endpoint

### `POST /api/auth/alien-id`

Handles both SSO and Mini App authentication flows.

### Request Body

```json
{
    "alienAddress": "abc123def456...",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isMiniApp": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `alienAddress` | string | SSO only | User identifier from Alien SDK |
| `token` | string | Yes | JWT token from Alien |
| `isMiniApp` | boolean | No | `true` for Mini App flow (default: `false`) |

### Flow Differences

| Validation Step | SSO Flow | Mini App Flow |
|----------------|----------|---------------|
| `alienAddress` required | Yes | No (extracted from token) |
| Address source | Request body | Token `sub` claim |
| Address verification | Token address must match provided address | Token address used directly |
| Token validation | JWT format + expiration | JWT format + expiration |

### Server Implementation

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAuthResponse } from "@/lib/session";

export async function POST(request: NextRequest) {
    const { alienAddress: providedAddress, token, isMiniApp } =
        await request.json();

    if (!token) {
        return NextResponse.json(
            { error: "Token required" },
            { status: 400 }
        );
    }

    // Decode JWT payload
    const parts = token.split(".");
    if (parts.length !== 3) {
        return NextResponse.json(
            { error: "Invalid token format" },
            { status: 400 }
        );
    }

    const payloadBase64 = parts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadBase64));

    // Extract user identifier
    const tokenAddress =
        payload.sub || payload.user_id || payload.address;

    if (!tokenAddress) {
        return NextResponse.json(
            { error: "Token missing user identifier" },
            { status: 400 }
        );
    }

    let alienAddress: string;

    if (isMiniApp) {
        // Mini App: use address from token directly
        alienAddress = tokenAddress;
    } else {
        // SSO: verify provided address matches token
        if (!providedAddress) {
            return NextResponse.json(
                { error: "Alien address required" },
                { status: 400 }
            );
        }

        if (
            tokenAddress.toLowerCase() !==
            providedAddress.toLowerCase()
        ) {
            return NextResponse.json(
                { error: "Token does not match claimed address" },
                { status: 401 }
            );
        }

        alienAddress = providedAddress;
    }

    // Check token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
        return NextResponse.json(
            { error: "Token has expired" },
            { status: 401 }
        );
    }

    // Create user record with wallet_type = "alien_id"
    await upsertUser(alienAddress, "alien_id");

    // Auto-join the official Alien channel
    await autoJoinAlienChannel(alienAddress);

    // Create session cookie
    return createAuthResponse(alienAddress, "alien_id", {
        success: true,
        alienAddress,
    });
}
```

### Response

**Success (200):**

```json
{
    "success": true,
    "alienAddress": "abc123def456..."
}
```

Response also sets an HTTP-only session cookie:

```
Set-Cookie: spritz_session=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Errors:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | `Token required` | No token provided |
| 400 | `Invalid token format` | Token is not a valid JWT |
| 400 | `Token missing user identifier` | No `sub` or `user_id` in token |
| 400 | `Alien address required` | SSO flow without `alienAddress` |
| 401 | `Token does not match claimed address` | Address mismatch (SSO security check) |
| 401 | `Token has expired` | JWT `exp` claim is in the past |
| 429 | `Rate limit exceeded` | More than 10 requests per minute |

---

## Token Structure

Alien ID tokens are standard JWTs with the following structure:

### JWT Format

```
header.payload.signature
```

### Decoded Payload

```json
{
    "sub": "abc123def456...",
    "iss": "https://sso.alien-api.com",
    "aud": "000000010400000000000f89739b0806",
    "iat": 1706000000,
    "exp": 1706604800
}
```

| Claim | Description |
|-------|-------------|
| `sub` | User identifier (the alienAddress used as Spritz ID) |
| `iss` | Token issuer (Alien SSO server) |
| `aud` | Audience (your provider address) |
| `iat` | Issued at (Unix timestamp) |
| `exp` | Expiration (Unix timestamp) |

:::warning Token Expiration
Always check the `exp` claim server-side. Expired tokens must be rejected. The Spritz server validates expiration before creating a session.
:::

---

## Session Management

### Session Storage

Alien ID sessions use both server-side cookies and client-side localStorage:

| Storage | Key | Purpose |
|---------|-----|---------|
| HTTP-only cookie | `spritz_session` | Server-side authentication (7-day expiry) |
| localStorage | `spritz_alien_address` | Client-side session restoration |
| localStorage | `spritz_alien_session` | Token and expiration for session persistence |

### Session Restoration

On page load, the client checks for a stored session and refreshes the server cookie:

```typescript
const storedAddress = localStorage.getItem("spritz_alien_address");
const storedSession = localStorage.getItem("spritz_alien_session");

if (storedAddress && storedSession) {
    const session = JSON.parse(storedSession);

    // Check if session hasn't expired
    if (session.exp && session.exp > Date.now()) {
        // Refresh server session cookie
        await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userAddress: storedAddress,
                authMethod: "alien_id",
            }),
            credentials: "include",
        });
    }
}
```

### Logout

Logout clears all Alien-related storage and user data:

```typescript
function alienLogout() {
    // Clear Alien session storage
    localStorage.removeItem("spritz_alien_address");
    localStorage.removeItem("spritz_alien_session");

    // Call SDK logout
    alienAuth.logout();

    // SECURITY: Clear ALL user data to prevent leakage
    const keysToRemove = Object.keys(localStorage).filter(
        (k) =>
            k.startsWith("waku_") ||
            k.startsWith("shout_") ||
            k.startsWith("spritz_")
    );
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Reload to clear all state
    window.location.reload();
}
```

:::danger Data Security on Logout
Always clear Waku messaging keys, group data, and all Spritz-prefixed localStorage items on logout. This prevents the next user from accessing the previous user's encrypted messages or private data.
:::

---

## Database Impact

### User Record

When an Alien ID user authenticates, the following user record is created:

```sql
INSERT INTO shout_user_settings (
    wallet_address,   -- The alienAddress (from token sub claim)
    wallet_type,      -- 'alien_id'
    first_login,
    last_login,
    login_count
) VALUES (
    'abc123def456...',
    'alien_id',
    NOW(),
    NOW(),
    1
);
```

### Auto-Join Alien Channel

Alien ID users are automatically joined to the official "alien" channel:

```sql
-- Find the Alien channel by slug
SELECT id FROM shout_public_channels
WHERE slug = 'alien' AND is_active = true;

-- Add user as member (if not already)
INSERT INTO shout_channel_members (channel_id, user_address)
VALUES (:alien_channel_id, :alien_address)
ON CONFLICT DO NOTHING;
```

---

## Comparison with Other Auth Methods

| Feature | EVM Wallet | Passkey | Email | World ID | Alien ID |
|---------|-----------|---------|-------|----------|----------|
| **Spritz ID** | Wallet address | Credential hash | Email hash | nullifier_hash | alienAddress |
| **Wallet Signer** | Wallet EOA | WebAuthn P-256 | Passkey (create) | Passkey (create) | Passkey (create) |
| **Immediate Wallet** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Token Source** | SIWE signature | WebAuthn assertion | Email code | ZK proof | Alien JWT |
| **Session Storage** | Cookie only | Cookie only | Cookie + localStorage | Cookie + localStorage | Cookie + localStorage |
| **Auto-Join Channel** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes ("alien") |
| **Needs Passkey for Wallet** | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |

:::info Wallet Access for Alien ID Users
Alien ID users must create a passkey to access Spritz Wallet features (sending tokens, deploying vaults, etc.). The passkey provides the P-256 cryptographic signer needed for the Safe Smart Account. Social features (messaging, friends, channels) work immediately without a passkey.
:::

---

## CSS Requirements

The Alien SSO modal needs high z-index values to appear above the Spritz UI:

```css
/* Alien SSO SDK - Ensure modal appears above everything */
[data-alien-modal],
[class*="alien"],
[id*="alien"],
.alien-sso-modal,
.alien-modal,
[class*="sso-modal"],
[role="dialog"][aria-modal="true"] {
    z-index: 99999 !important;
}

/* Alien SDK iframe/popup container */
iframe[src*="alien"],
iframe[src*="sso.alien"] {
    z-index: 99999 !important;
}
```

---

## Security Considerations

### Token Validation

| Check | SSO Flow | Mini App Flow |
|-------|----------|---------------|
| JWT format (3 parts) | ✅ | ✅ |
| Payload decode | ✅ | ✅ |
| User identifier present | ✅ | ✅ |
| Expiration check (`exp`) | ✅ | ✅ |
| Address match verification | ✅ (token vs provided) | N/A (single source) |

### Security Best Practices

1. **Always validate tokens server-side** - Never trust client-side token validation alone
2. **Verify address match in SSO flow** - The token's `sub` must match the `alienAddress` sent by the client to prevent impersonation
3. **Check token expiration** - Reject expired tokens to prevent replay attacks
4. **HTTP-only cookies** - Session tokens are stored in HTTP-only cookies, inaccessible to JavaScript
5. **Rate limiting** - The auth endpoint is rate-limited to 10 requests per minute
6. **Clear all data on logout** - Remove messaging keys, group data, and session storage to prevent data leakage between users

### Protected Wallet Types

Alien ID is classified as a protected wallet type alongside passkey, email, and World ID:

```typescript
const protectedWalletTypes = [
    "passkey",
    "email",
    "world_id",
    "alien_id",
];
```

This means Alien ID users cannot have their wallet type overwritten by other authentication methods.

---

## Troubleshooting

### SSO Modal Not Appearing

**Symptoms:** Clicking "Sign in with Alien ID" does nothing.

**Cause:** Z-index conflicts or SSR rendering issues.

**Solution:**
1. Verify the CSS z-index overrides are applied (see [CSS Requirements](#css-requirements))
2. Ensure `SignInButton` is dynamically imported with `ssr: false`
3. Check browser console for SDK initialization errors

### Mini App Not Detecting Alien Environment

**Symptoms:** `isInsideAlienApp` is always `false` inside the Alien app.

**Cause:** Bridge SDK not loading or bridge not available.

**Solution:**
1. Verify `@alien_org/bridge` is installed
2. Check that the app URL is registered as a Mini App with Alien
3. Inspect `bridge.isBridgeAvailable()` output in the console

### Token Address Mismatch (401)

**Symptoms:** SSO login fails with "Token does not match claimed address".

**Cause:** The `sub` claim in the token differs from the `alienAddress` extracted by the client.

**Solution:**
1. Ensure you extract the address using the same priority (`sub` > `user_id`)
2. Check for case sensitivity issues (the server compares lowercase)
3. Verify you're using the latest Alien SSO SDK version

### Session Not Persisting

**Symptoms:** User is logged out on page refresh.

**Cause:** localStorage items cleared or server session expired.

**Solution:**
1. Check that `spritz_alien_address` and `spritz_alien_session` are in localStorage
2. Verify the session `exp` timestamp hasn't passed
3. Confirm the server cookie is being set (check `Set-Cookie` header)

---

## Next Steps

-   [Authentication Technical Details](/docs/developers/authentication) - Deep dive into all auth methods
-   [Login Flow & Account Creation](/docs/developers/login-flow) - Complete login flow documentation
-   [Smart Wallets](/docs/developers/smart-wallets) - Passkey-based wallet setup for Alien ID users
-   [Channels Guide](/docs/guides/channels) - Using the Alien channel and other public channels

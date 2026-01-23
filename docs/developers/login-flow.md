---
title: Login Flow & Account Creation
description: Complete guide to Spritz authentication flows, account creation, and smart wallet provisioning. Understand when and how user accounts and wallets are created.
keywords:
    [
        Spritz login,
        account creation,
        smart wallet,
        authentication flow,
        SIWE,
        passkey,
        Safe wallet,
    ]
sidebar_label: Login Flow
sidebar_position: 0
---

# Login Flow & Account Creation

This guide explains how users authenticate with Spritz, how accounts are created, and when smart wallets are provisioned.

## Overview

When a user authenticates with Spritz, they receive two things:

1. **Spritz ID** — A unique identifier for social features (messaging, profiles, friends)
2. **Spritz Wallet** — A Safe Smart Account for on-chain transactions

The source of these depends on the authentication method used.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Spritz Account Architecture                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         SPRITZ ID                                   │ │
│  │              (Social Identity - Messages, Profiles)                │ │
│  │                                                                      │ │
│  │  Source depends on auth method:                                     │ │
│  │  • Wallet → Wallet address (0x...)                                  │ │
│  │  • Passkey → Derived from credential ID                            │ │
│  │  • Email → Derived from email hash                                  │ │
│  │  • World ID → nullifier_hash                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│                              ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       SPRITZ WALLET                                 │ │
│  │                (Safe Smart Account - Tokens, NFTs)                 │ │
│  │                                                                      │ │
│  │  • Computed deterministically (counterfactual)                     │ │
│  │  • Same address on all EVM chains                                  │ │
│  │  • Deployed on first transaction                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Methods Summary

| Method | Spritz ID Source | Wallet Signer | Immediate Wallet? | Best For |
|--------|------------------|---------------|-------------------|----------|
| **EVM Wallet** | Wallet address | Wallet EOA | ✅ Yes | Crypto-native users |
| **Passkey** | Credential ID hash | WebAuthn P-256 | ✅ Yes | New users, mobile |
| **Email** | Derived hash | Passkey (must create) | ❌ No | Non-crypto users |
| **World ID** | nullifier_hash | Passkey (must create) | ❌ No | Privacy-focused |
| **Alien ID** | alienAddress | Passkey (must create) | ❌ No | Alien ecosystem |
| **Solana** | Solana address | Passkey (must create) | ❌ No | Solana users |

---

## Flow 1: Wallet Login (SIWE)

The most common flow for crypto-native users connecting with MetaMask, Rainbow, etc.

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WALLET LOGIN FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User clicks "Connect Wallet"                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Reown AppKit opens → User selects wallet → Wallet connected     │   │
│  │  Result: walletAddress = 0x1234...                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 2: Get SIWE message and nonce from server                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  GET /api/auth/verify?address=0x1234...                          │   │
│  │  Response: { message: "...", nonce: "abc123..." }                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 3: Sign the SIWE message                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  "app.spritz.chat wants you to sign in with your Ethereum        │   │
│  │   account: 0x1234...                                              │   │
│  │   Nonce: abc123...                                                │   │
│  │   Issued At: 2026-01-22T10:00:00Z"                               │   │
│  │                                                                    │   │
│  │  → Wallet prompts user to sign                                    │   │
│  │  → signature = 0x9876...                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 4: Verify signature and create session                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/auth/verify                                            │   │
│  │  Body: { message, signature }                                     │   │
│  │                                                                    │   │
│  │  Server:                                                          │   │
│  │  ✓ Verifies SIWE signature                                        │   │
│  │  ✓ Creates/updates user record in database                       │   │
│  │  ✓ Sets wallet_type = "eoa"                                       │   │
│  │  ✓ Creates JWT session (7-day expiry)                            │   │
│  │  ✓ Sets HTTP-only session cookie                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 5: Smart Wallet address computed (NOT deployed yet)               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  GET /api/wallet/smart-wallet                                     │   │
│  │                                                                    │   │
│  │  Server calculates:                                               │   │
│  │  smartWalletAddress = getSafeAddress(walletAddress, chainId)     │   │
│  │                                                                    │   │
│  │  Response: {                                                      │   │
│  │    spritzId: "0x1234...",                                        │   │
│  │    smartWalletAddress: "0xABCD...",   // Counterfactual          │   │
│  │    isDeployed: false,                  // Not deployed yet        │   │
│  │    walletType: "wallet",                                          │   │
│  │    canSign: true,                                                 │   │
│  │    signerType: "eoa"                                              │   │
│  │  }                                                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ✅ LOGIN COMPLETE                                                       │
│  • Spritz ID = Wallet address (0x1234...)                               │
│  • Smart Wallet = Counterfactual Safe address (0xABCD...)              │
│  • Wallet is NOT deployed on-chain yet                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### When is the Smart Wallet Deployed?

The Safe smart wallet is deployed **on the first transaction**. This is called "counterfactual deployment":

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SMART WALLET DEPLOYMENT                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BEFORE FIRST TRANSACTION:                                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Smart Wallet Address: 0xABCD...                                  │   │
│  │  On-chain status: NO CONTRACT CODE (empty address)               │   │
│  │  Can receive tokens: ✅ YES (address exists, just no code)       │   │
│  │  Can send tokens: ❌ NO (no contract to execute)                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  USER INITIATES FIRST TRANSACTION:                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  e.g., "Send 10 USDC to 0x5678..."                               │   │
│  │                                                                    │   │
│  │  The ERC-4337 bundler automatically:                             │   │
│  │  1. Deploys the Safe contract (via initCode)                     │   │
│  │  2. Executes the requested transaction                           │   │
│  │                                                                    │   │
│  │  Gas is sponsored by Pimlico (on L2s) or paid in USDC (mainnet) │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  AFTER FIRST TRANSACTION:                                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Smart Wallet Address: 0xABCD...                                  │   │
│  │  On-chain status: SAFE CONTRACT DEPLOYED ✅                      │   │
│  │  Can receive tokens: ✅ YES                                       │   │
│  │  Can send tokens: ✅ YES                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

:::info Why Counterfactual Deployment?
This approach saves gas costs for users who never make on-chain transactions. The address is deterministic, so users can receive tokens immediately, and the contract is only deployed when actually needed.
:::

---

## Flow 2: Passkey Login

For users who want passwordless login using Face ID, Touch ID, or Windows Hello.

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PASSKEY LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FIRST TIME (Registration):                                             │
│  ─────────────────────────                                              │
│                                                                          │
│  STEP 1: User clicks "Create Passkey"                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  GET /api/passkey/register/options                                │   │
│  │  Response: { challenge, rpId: "spritz.chat", user: {...} }       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 2: Browser creates passkey credential                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  navigator.credentials.create({                                   │   │
│  │    publicKey: {                                                   │   │
│  │      challenge,                                                   │   │
│  │      rp: { name: "Spritz", id: "spritz.chat" },                  │   │
│  │      pubKeyCredParams: [{ alg: -7, type: "public-key" }], // P-256│   │
│  │      authenticatorSelection: { userVerification: "preferred" }   │   │
│  │    }                                                              │   │
│  │  })                                                               │   │
│  │                                                                    │   │
│  │  → Face ID / Touch ID / PIN prompt                                │   │
│  │  → Returns: credentialId + P-256 public key (x, y coordinates)   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 3: Store credential and create session                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/passkey/register/verify                                │   │
│  │  Body: { credentialId, publicKeyX, publicKeyY, attestation }     │   │
│  │                                                                    │   │
│  │  Server:                                                          │   │
│  │  ✓ Stores passkey in shout_passkey_credentials table             │   │
│  │  ✓ Derives Spritz ID from credential (hash of public key)        │   │
│  │  ✓ Creates user record with wallet_type = "passkey"              │   │
│  │  ✓ Computes Safe address using getPasskeySafeAddress()           │   │
│  │  ✓ Creates JWT session                                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 4: Smart Wallet computed with WebAuthn signer                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  // Different from wallet login!                                  │   │
│  │  smartWalletAddress = getPasskeySafeAddress(publicKeyX, publicKeyY)│  │
│  │                                                                    │   │
│  │  This Safe uses the P-256 passkey as its owner/signer            │   │
│  │  (NOT an EOA address)                                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  RETURNING USER (Authentication):                                       │
│  ────────────────────────────────                                       │
│                                                                          │
│  STEP 1: User clicks "Sign in with Passkey"                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  GET /api/passkey/login/options                                   │   │
│  │  Response: { challenge, allowCredentials: [...] }                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 2: Browser authenticates with passkey                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  navigator.credentials.get({                                      │   │
│  │    publicKey: { challenge, rpId: "spritz.chat", ... }            │   │
│  │  })                                                               │   │
│  │                                                                    │   │
│  │  → Face ID / Touch ID prompt                                      │   │
│  │  → Returns: assertion with signature                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 3: Verify and create session                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/passkey/login/verify                                   │   │
│  │  Body: { credentialId, authenticatorData, clientDataJSON, sig }  │   │
│  │                                                                    │   │
│  │  Server verifies P-256 signature → Creates session               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ✅ LOGIN COMPLETE                                                       │
│  • Spritz ID = Derived from passkey credential                          │
│  • Smart Wallet = Safe with WebAuthn (P-256) signer                    │
│  • Can sign transactions using Face ID / Touch ID                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Passkey vs Wallet: Key Differences

| Aspect | Wallet Login | Passkey Login |
|--------|--------------|---------------|
| **Spritz ID** | Wallet address (0x...) | Derived from credential hash |
| **Safe Signer** | EOA (secp256k1) | WebAuthn (P-256) |
| **Safe Address Calculation** | `getSafeAddress(walletAddress)` | `getPasskeySafeAddress(pubKeyX, pubKeyY)` |
| **Transaction Signing** | Wallet prompt | Face ID / Touch ID |
| **Cross-device** | Need wallet on device | Can use phone to sign on laptop |

---

## Flow 3: Email Login

For users without crypto wallets who want to sign in with just their email.

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EMAIL LOGIN FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User enters email address                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/email/send-code                                        │   │
│  │  Body: { email: "user@example.com" }                             │   │
│  │                                                                    │   │
│  │  Server sends 6-digit verification code via Resend               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 2: User enters verification code                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/email/verify-code                                      │   │
│  │  Body: { email: "user@example.com", code: "123456" }             │   │
│  │                                                                    │   │
│  │  Server:                                                          │   │
│  │  ✓ Verifies code is correct and not expired                      │   │
│  │  ✓ Creates/retrieves user with wallet_type = "email"             │   │
│  │  ✓ Creates JWT session                                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 3: User can chat and use social features                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ✅ Spritz ID assigned (derived from email hash)                  │   │
│  │  ✅ Can message friends, join channels, create agents            │   │
│  │  ❌ CANNOT make on-chain transactions yet                        │   │
│  │  ❌ Smart Wallet address NOT computed yet                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 4: User creates passkey to enable wallet features                 │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  When user tries to:                                              │   │
│  │  • View wallet balance                                            │   │
│  │  • Send/receive tokens                                            │   │
│  │  • Deploy a vault                                                 │   │
│  │                                                                    │   │
│  │  → Prompted to create a passkey                                   │   │
│  │  → Same passkey registration flow as above                       │   │
│  │  → Smart Wallet address computed using passkey public key        │   │
│  │  → wallet_type updated to "passkey"                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ✅ FULL ACCESS ENABLED                                                  │
│  • Spritz ID = Same (email-derived)                                     │
│  • Smart Wallet = Now computed from passkey                            │
│  • Can sign transactions with Face ID / Touch ID                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

:::warning Email Users Need Passkeys
Email-only users cannot make on-chain transactions until they create a passkey. The passkey provides the cryptographic signer needed for the Safe smart wallet.
:::

---

## Flow 4: World ID / Alien ID Login

Privacy-preserving authentication using zero-knowledge proofs.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WORLD ID / ALIEN ID FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User verifies with World ID orb or Alien ID                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  World ID:                                                        │   │
│  │  • User scans iris with World ID orb                             │   │
│  │  • Generates ZK proof of unique personhood                       │   │
│  │  • Returns: nullifier_hash (unique per user per app)             │   │
│  │                                                                    │   │
│  │  Alien ID:                                                        │   │
│  │  • User authenticates via Alien                                   │   │
│  │  • Returns: alienAddress                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 2: Verify proof and create session                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/auth/world-id or /api/auth/alien-id                   │   │
│  │                                                                    │   │
│  │  Server:                                                          │   │
│  │  ✓ Verifies ZK proof with World ID / Alien servers               │   │
│  │  ✓ Creates user with wallet_type = "world_id" or "alien_id"     │   │
│  │  ✓ Spritz ID = nullifier_hash or alienAddress                    │   │
│  │  ✓ Creates JWT session                                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  STEP 3: Same as email - passkey required for wallet                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  ❌ Cannot make on-chain transactions until passkey created      │   │
│  │  → User prompted to create passkey for wallet features           │   │
│  │  → Smart Wallet computed from passkey                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Smart Wallet Creation Timeline

Here's a summary of when each component is created:

| Stage | What Happens | Spritz ID | Smart Wallet Address | Smart Wallet Deployed |
|-------|--------------|-----------|---------------------|----------------------|
| **Before Login** | — | ❌ None | ❌ None | ❌ No |
| **After Wallet/Passkey Login** | Session created | ✅ Assigned | ✅ Computed (counterfactual) | ❌ No |
| **After Email/WorldID Login** | Session created | ✅ Assigned | ❌ Not computed | ❌ No |
| **After Email User Creates Passkey** | Passkey linked | ✅ Same | ✅ Computed | ❌ No |
| **User Receives Tokens** | Tokens sent to address | ✅ Same | ✅ Same | ❌ No (still works!) |
| **First Outgoing Transaction** | Safe deployed | ✅ Same | ✅ Same | ✅ **YES** |

---

## Database Records Created

When a user authenticates, the following database records are created/updated:

### 1. User Settings (`shout_user_settings`)

```sql
-- Created on first login
INSERT INTO shout_user_settings (
    wallet_address,    -- Spritz ID
    wallet_type,       -- 'eoa', 'passkey', 'email', 'world_id', 'alien_id'
    created_at,
    last_login
) VALUES (
    '0x1234...',       -- Or derived ID for non-wallet auth
    'passkey',
    NOW(),
    NOW()
);
```

### 2. Passkey Credentials (`shout_passkey_credentials`)

```sql
-- Created when user registers a passkey
INSERT INTO shout_passkey_credentials (
    user_address,      -- Links to shout_user_settings
    credential_id,     -- Base64url credential ID from WebAuthn
    public_key_x,      -- P-256 X coordinate (hex)
    public_key_y,      -- P-256 Y coordinate (hex)
    rp_id,            -- "spritz.chat"
    created_at
) VALUES (
    '0x1234...',
    'abc123...',
    '0x8b4c2e3f...',
    '0x1a2b3c4d...',
    'spritz.chat',
    NOW()
);
```

### 3. Session (`shout_sessions`)

```sql
-- Created on each login
INSERT INTO shout_sessions (
    user_address,
    token_hash,        -- SHA-256 of JWT
    auth_method,       -- 'wallet', 'passkey', 'email', etc.
    expires_at,
    user_agent,
    ip_address
) VALUES (
    '0x1234...',
    'sha256hash...',
    'passkey',
    NOW() + INTERVAL '7 days',
    'Mozilla/5.0...',
    '192.168.1.1'
);
```

---

## API Endpoints by Flow

### Wallet Login

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/verify?address=...` | GET | Get SIWE message and nonce for signing |
| `/api/auth/verify` | POST | Verify SIWE signature, create session |
| `/api/wallet/smart-wallet` | GET | Get computed Smart Wallet address |

### Passkey Login

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/passkey/register/options` | POST | Get WebAuthn registration options |
| `/api/passkey/register/verify` | POST | Verify registration, store credential |
| `/api/passkey/login/options` | POST | Get WebAuthn authentication options |
| `/api/passkey/login/verify` | POST | Verify assertion, create session |

### Email Login

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/email/send-code` | POST | Send verification code |
| `/api/email/verify-code` | POST | Verify code, create session |

### Session Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/session` | GET | Get current session info |
| `/api/auth/logout` | POST | Clear session, delete cookie |

---

## Implementation Examples

### Check if User Has Wallet Access

```typescript
import { useSmartWallet } from "@/hooks/useSmartWallet";

function WalletFeature() {
    const { smartWallet, isLoading } = useSmartWallet(userAddress);
    
    if (isLoading) return <Loading />;
    
    // User logged in via email/WorldID without passkey
    if (smartWallet?.needsPasskey) {
        return <CreatePasskeyPrompt />;
    }
    
    // User has full wallet access
    return (
        <div>
            <p>Wallet: {smartWallet?.smartWalletAddress}</p>
            <p>Deployed: {smartWallet?.isDeployed ? "Yes" : "No"}</p>
            <SendTokensButton />
        </div>
    );
}
```

### Handle Different Auth Methods

```typescript
async function handleLogin(method: AuthMethod) {
    switch (method) {
        case "wallet":
            // Connect wallet → Sign SIWE → Verify
            const address = await connectWallet();
            const nonce = await getNonce();
            const signature = await signSIWE(address, nonce);
            await verifySignature(signature);
            break;
            
        case "passkey":
            // Create/authenticate with passkey
            const credential = await navigator.credentials.get({...});
            await verifyPasskey(credential);
            break;
            
        case "email":
            // Send code → Verify → Prompt for passkey later
            await sendEmailCode(email);
            await verifyEmailCode(email, code);
            // User can now use social features
            // Passkey prompt shown when wallet features needed
            break;
    }
}
```

---

## Security Considerations

### Session Security

| Practice | Implementation |
|----------|----------------|
| **HTTP-only cookies** | JWT stored in cookie, not accessible to JS |
| **Secure flag** | Cookie only sent over HTTPS |
| **SameSite=Strict** | Prevents CSRF attacks |
| **7-day expiry** | Sessions automatically expire |

### Passkey Security

| Risk | Mitigation |
|------|------------|
| **Phishing** | Passkeys bound to domain (rpId = "spritz.chat") |
| **Device loss** | Recovery signer can be added to Safe |
| **Replay attacks** | Each signature includes unique challenge |

---

## Next Steps

- [Authentication Technical Details](/docs/developers/authentication) — Deep dive into SIWE, WebAuthn, and session management
- [Smart Wallets Technical Details](/docs/developers/smart-wallets) — Safe architecture, transaction signing, and gas sponsorship
- [API Reference](/docs/api/intro) — Complete API documentation

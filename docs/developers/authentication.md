---
title: Authentication & Identity System
description: Complete guide to Spritz authentication methods, identity system, and wallet architecture. Learn about SIWE, passkeys, email login, World ID, and Smart Wallets.
keywords:
    [
        authentication,
        SIWE,
        SIWS,
        passkeys,
        WebAuthn,
        Smart Wallet,
        Safe,
        identity,
        World ID,
        Alien ID,
    ]
sidebar_label: Authentication
sidebar_position: 2
---

# Authentication & Identity System

Spritz supports multiple authentication methods, each providing a unique "Spritz ID" (identity address) used for social features. Users can also access the Spritz Wallet (a Safe Smart Account) for on-chain transactions.

## Two Address System

Every user has **two addresses**:

| Address Type | Purpose | Stored In |
|--------------|---------|-----------|
| **Spritz ID** | Identity for profile, friends, messages, username | `shout_users.wallet_address` |
| **Spritz Wallet** | Smart contract wallet for on-chain funds | Safe Smart Account (ERC-4337) |

## Authentication Methods Overview

| Method | Spritz ID Source | Wallet Owner | Has Wallet Immediately? |
|--------|------------------|--------------|-------------------------|
| **EVM Wallet** | Wallet address (EOA) | Wallet EOA | ✅ Yes - wallet signs |
| **Passkey** | Derived from credential ID | Passkey signer | ✅ Yes - passkey signs |
| **Email** | Existing account OR derived | Passkey signer | ❌ No - must create passkey first |
| **World ID** | `nullifier_hash` from World ID | Passkey signer | ❌ No - must create passkey first |
| **Alien ID** | `alienAddress` from Alien | Passkey signer | ❌ No - must create passkey first |
| **Solana** | Solana wallet address | Passkey signer | ❌ No - must create passkey first |

**Key Architecture Points:**
- **EVM Wallet users**: Your connected wallet signs transactions directly. No passkey needed.
- **Everyone else**: You MUST create a passkey before you can receive/send tokens. Your passkey becomes your wallet key.
- **Passkey = Wallet Access**: For non-wallet users, the passkey IS the key to your funds. Losing your passkey means losing wallet access.

---

## Authentication Method Details

### 1. EVM Wallet (MetaMask, Coinbase Wallet, etc.)

**Authentication Flow:**
```
User connects wallet via Reown AppKit
    ↓
Frontend requests SIWE (Sign-In With Ethereum) message
    ↓
User signs message with wallet
    ↓
Server verifies signature, creates session
    ↓
Spritz ID = wallet address (e.g., 0x1234...)
```

**Spritz Wallet (Safe):**
- Safe address derived from wallet address as owner
- Wallet signs Safe transactions directly
- No passkey needed - the connected wallet IS the signer

**User Flow:**
1. Click "Connect Wallet"
2. Select wallet (MetaMask, Coinbase, etc.)
3. Sign SIWE message
4. Full access to app + wallet features

---

### 2. Passkey (Face ID, Touch ID, Windows Hello)

**Authentication Flow:**
```
User clicks "Login with Passkey"
    ↓
Server generates authentication challenge
    ↓
Browser triggers WebAuthn ceremony
    ↓
User authenticates with biometric
    ↓
Server verifies credential, creates session
    ↓
Spritz ID = stored user_address from passkey_credentials table
```

**Spritz Wallet (Safe):**
- P256 public key extracted from passkey
- Safe WebAuthn Signer address calculated from public key
- Safe address derived from WebAuthn signer as owner
- Passkey signs all transactions via WebAuthn

**New User Registration:**
```
User clicks "Create Account"
    ↓
Server generates registration challenge
    ↓
Browser creates new passkey (WebAuthn)
    ↓
Server extracts P256 public key (x, y coordinates)
    ↓
Spritz ID = deterministic hash of credential ID
    ↓
Safe signer address calculated from public key
```

**Key Storage:**
- `passkey_credentials.credential_id` - WebAuthn credential identifier
- `passkey_credentials.public_key_x/y` - P256 coordinates for Safe signing
- `passkey_credentials.safe_signer_address` - Precomputed WebAuthn signer

---

### 3. Email Login

**Authentication Flow:**
```
User enters email address
    ↓
Server sends 6-digit verification code via Resend
    ↓
User enters code
    ↓
Server verifies code, checks for existing account:
    
    IF email matches existing verified account:
        → Use that account's address (preserves profile!)
    ELSE:
        → Derive new address from email + EMAIL_AUTH_SECRET
    ↓
Session created with final address
```

**Spritz Wallet (Safe):**
- Email users CANNOT sign EVM transactions directly
- Must register a passkey to use Spritz Wallet
- Once passkey registered, Safe uses passkey as signer

**Backwards Compatibility:**
- If user already has account with email (from any auth method)
- Email login finds and uses that existing account
- Prevents duplicate accounts when EMAIL_AUTH_SECRET changes

---

### 4. World ID (Worldcoin)

**Authentication Flow:**
```
User clicks "Sign in with World ID"
    ↓
World ID SDK opens verification
    ↓
User verifies with Orb/Device
    ↓
Server receives proof + nullifier_hash
    ↓
Server verifies proof with World ID API
    ↓
Spritz ID = nullifier_hash (unique per person per app)
```

**Spritz Wallet (Safe):**
- World ID users CANNOT sign EVM transactions
- `nullifier_hash` is a proof identifier, not a real address
- Must register passkey while logged in with World ID
- Passkey links to their World ID identity (nullifier_hash)

**Identity Persistence:**
- `nullifier_hash` is deterministic per person per app
- Same person always gets same Spritz ID
- Sybil-resistant: one person = one account

---

### 5. Alien ID

**Authentication Flow:**
```
User clicks "Sign in with Alien ID"
    ↓
Alien ID SDK opens verification
    ↓
User authenticates with Alien
    ↓
Server receives alienAddress
    ↓
Spritz ID = alienAddress
```

**Spritz Wallet (Safe):**
- Same as World ID - cannot sign EVM transactions
- Must register passkey to use Spritz Wallet
- Passkey links to their Alien ID address

---

### 6. Solana Wallet (Phantom, Solflare, etc.)

**Authentication Flow:**
```
User connects Solana wallet
    ↓
Frontend requests SIWS (Sign-In With Solana) message
    ↓
User signs message with Solana wallet
    ↓
Server verifies signature
    ↓
Spritz ID = Solana address (base58 format)
```

**Spritz Wallet (Safe):**
- Solana wallets cannot sign EVM transactions
- Must register passkey for Spritz Wallet
- EVM funds stored in Safe on EVM chains

---

## Adding Passkey to Existing Account

When a logged-in user registers a passkey:

```
User is logged in (World ID, Email, Wallet, etc.)
    ↓
Session contains their Spritz ID
    ↓
User clicks "Add Passkey" in Wallet settings
    ↓
Server checks getAuthenticatedUser()
    ↓
IF authenticated:
    → Passkey linked to EXISTING Spritz ID ✅
ELSE IF session cookie present but invalid:
    → REJECT: "Session expired, please log in again"
ELSE:
    → Create new account (for passkey-only registration)
```

**Defensive Protections:**
1. If session exists → passkey links to existing account
2. If session cookie present but expired → reject (prevents accidental new account)
3. If userAddress matches existing account → link to it
4. Only create new account if genuinely new user

---

## Spritz Wallet (Safe Smart Account)

### Architecture

Spritz uses Safe Smart Accounts with ERC-4337 (Account Abstraction):

```
┌─────────────────────────────────────────────────────────┐
│                    Spritz Wallet                         │
├─────────────────────────────────────────────────────────┤
│  Safe Smart Account (same address on all EVM chains)    │
│  ├── Owner: EOA address OR WebAuthn Signer              │
│  ├── Bundler: Pimlico                                   │
│  └── Paymaster: Sponsored (L2) or ERC-20 USDC (mainnet) │
└─────────────────────────────────────────────────────────┘
```

### Supported Chains

| Chain | Chain ID | Gas Payment | Sponsorship |
|-------|----------|-------------|-------------|
| Ethereum | 1 | ETH (or USDC if available) | User pays |
| Base | 8453 | Sponsored | Free |
| Arbitrum | 42161 | Sponsored | Free |
| Optimism | 10 | Sponsored | Free |
| Polygon | 137 | Sponsored | Free |
| BNB Chain | 56 | Sponsored | Free |
| Unichain | 130 | Sponsored | Free |
| Avalanche | 43114 | Sponsored | Free |

### Safe Address Calculation

**For Wallet Users (EOA signer):**
```typescript
safeAddress = calculateSafeAddress(walletAddress)
// Safe is owned by the user's EOA
```

**For Passkey Users (WebAuthn signer):**
```typescript
webAuthnSignerAddress = calculateWebAuthnSignerAddress(publicKeyX, publicKeyY)
safeAddress = calculateSafeAddress(webAuthnSignerAddress)
// Safe is owned by the passkey's P256 signer
```

### Same Address Everywhere

Your Safe wallet address is **deterministic and identical** across all EVM chains. Send to any chain, funds are never lost - just on a different network at the same address.

---

## Complete User Flows

### Flow 1: New User with Wallet

```
1. User connects MetaMask
2. Signs SIWE message
3. Spritz ID = wallet address
4. Safe address calculated from wallet
5. User can send/receive immediately
   (wallet signs Safe transactions)
```

### Flow 2: New User with Passkey

```
1. User clicks "Create Account"
2. Creates passkey (Face ID/Touch ID)
3. Spritz ID = hash(credential_id)
4. Safe address calculated from passkey signer
5. User can send/receive immediately
   (passkey signs Safe transactions)
```

### Flow 3: New User with World ID

```
1. User verifies with World ID
2. Spritz ID = nullifier_hash
3. User sees profile, can chat, add friends
4. User opens Wallet → "Register Passkey to Send"
5. Creates passkey (linked to nullifier_hash)
6. Safe address calculated from passkey signer
7. User can now send/receive
```

### Flow 4: Existing User Adds Passkey

```
1. User logged in with Email/WorldID/etc.
2. Opens Wallet settings → "Add Passkey"
3. Creates passkey
4. Server detects existing session
5. Passkey linked to EXISTING Spritz ID
6. Safe uses new passkey as signer
7. Profile, friends, messages preserved ✅
```

---

## Key Security Properties

### Identity Persistence
- **Wallet**: Address never changes
- **Passkey**: Credential ID never changes
- **Email**: Finds existing account first, then derives
- **World ID**: Same nullifier_hash for same person
- **Alien ID**: Same address for same account

### Non-Custodial
- Private keys never leave user's device
- Passkeys backed up via iCloud/Google automatically
- Server only stores public keys

### Session Management
- JWT sessions in HTTP-only cookies (7 days)
- Frontend tokens in localStorage (30 days, signed)
- CSRF protection via origin validation

---

## API Endpoints

### SIWE/SIWS Authentication

```http
POST /api/auth/verify
Content-Type: application/json

{
  "message": "SIWE message string",
  "signature": "0x..."
}
```

```http
POST /api/auth/verify-solana
Content-Type: application/json

{
  "message": "SIWS message string",
  "signature": "base58 signature"
}
```

### Passkey Registration

```http
POST /api/passkey/register/options
Content-Type: application/json

{
  "userAddress": "0x..." // Optional, for linking to existing account
}
```

```http
POST /api/passkey/register/verify
Content-Type: application/json

{
  "credential": { /* WebAuthn credential */ },
  "challenge": "base64 challenge"
}
```

### Passkey Login

```http
POST /api/passkey/login/options
```

```http
POST /api/passkey/login/verify
Content-Type: application/json

{
  "credential": { /* WebAuthn credential */ },
  "challenge": "base64 challenge"
}
```

### World ID Verification

```http
POST /api/auth/world-id
Content-Type: application/json

{
  "proof": { /* World ID proof object */ },
  "action": "spritz-login"
}
```

### Session Management

```http
GET /api/auth/session
// Returns current user session

POST /api/auth/logout
// Clears session
```

---

## Environment Variables

```env
# Required for Passkey/Smart Accounts
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key
NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID=sp_your_policy_id

# Required for Email Login
RESEND_API_KEY=your_resend_api_key
EMAIL_AUTH_SECRET=your_secure_secret_for_email_key_derivation

# Required for World ID
NEXT_PUBLIC_WORLD_ID_APP_ID=app_your_world_id_app_id
NEXT_PUBLIC_WORLD_ID_ACTION=your_action_name
```

## Next Steps

- [Smart Wallets](/docs/developers/smart-wallets) - Deep dive into Safe integration
- [Security](/docs/developers/security) - Security best practices
- [API Reference](/docs/api/intro) - Complete API documentation

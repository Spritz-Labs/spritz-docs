# Spritz Wallets Technical Documentation

Complete technical documentation for Spritz Wallets, implementing Safe accounts with ERC-4337 account abstraction.

:::tip Terminology Update
"Smart Wallets" have been renamed to **Spritz Wallets** for simplicity. The underlying technology (Safe Smart Accounts) remains the same.
:::

## Architecture Overview

Every Spritz user gets a **Safe Smart Account** for on-chain transactions, regardless of authentication method.

```
┌─────────────────────────────────────────────────────────────┐
│                    Spritz Wallet Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Safe Proxy v1.4.1                  │    │
│  │  Address: Deterministic (same on all EVM chains)    │    │
│  │  Deployed: On first transaction (counterfactual)    │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     Signer(s)                        │    │
│  │  ┌─────────────┐     OR     ┌─────────────────┐     │    │
│  │  │  EOA Wallet │            │ WebAuthn Signer │     │    │
│  │  │  (0x...)    │            │ (P-256 Passkey) │     │    │
│  │  └─────────────┘            └─────────────────┘     │    │
│  │                                                      │    │
│  │  + Optional Recovery Signer (EOA)                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ERC-4337 Integration                    │    │
│  │  ┌──────────────────┐  ┌──────────────────┐        │    │
│  │  │ EntryPoint v0.7  │  │ Pimlico Bundler  │        │    │
│  │  └──────────────────┘  └──────────────────┘        │    │
│  │  ┌──────────────────┐  ┌──────────────────┐        │    │
│  │  │ Pimlico Paymaster│  │ Sponsorship      │        │    │
│  │  │ (Gas Abstraction)│  │ Policy           │        │    │
│  │  └──────────────────┘  └──────────────────┘        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Supported Chains

| Chain | ID | Gas Payment | Pimlico Network |
|-------|-----|-------------|-----------------|
| **Ethereum** | 1 | USDC (ERC-20 paymaster) | `ethereum` |
| **Base** | 8453 | Sponsored | `base` |
| **Arbitrum** | 42161 | Sponsored | `arbitrum` |
| **Optimism** | 10 | Sponsored | `optimism` |
| **Polygon** | 137 | Sponsored | `polygon` |
| **BNB Chain** | 56 | Sponsored | `binance` |
| **Unichain** | 130 | Sponsored | `unichain` |
| **Avalanche** | 43114 | Sponsored | `avalanche` |

---

## Safe Account Creation

### Counterfactual Addresses

Safe addresses are computed deterministically **before deployment**. There are two methods depending on the authentication type:

#### EOA Wallet Users

```typescript
import { toSafeSmartAccount } from "permissionless/accounts";
import { entryPoint07Address } from "viem/account-abstraction";

export async function getSafeAddress(
    ownerAddress: Address,
    chainId: number
): Promise<Address> {
    const publicClient = getPublicClient(chainId);
    
    const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [{ address: ownerAddress, type: "local" } as any],
        version: "1.4.1",
        entryPoint: {
            address: entryPoint07Address,
            version: "0.7",
        },
        saltNonce: BigInt(0), // Deterministic
    });

    return safeAccount.address;
}
```

#### Passkey Users

:::warning Critical: Passkey Address Calculation
Passkey users **must** use `getPasskeySafeAddress()` instead of `getSafeAddress()`. The passkey-based Safe uses a WebAuthn account as the owner, which produces a **different address** than an EOA-based calculation.
:::

```typescript
import { toSafeSmartAccount } from "permissionless/accounts";
import { toWebAuthnAccount } from "viem/account-abstraction";
import { entryPoint07Address } from "viem/account-abstraction";

/**
 * Calculate the Safe address for a passkey user.
 * 
 * IMPORTANT: This MUST use the same calculation as createPasskeySafeAccountClient
 * to ensure the displayed address matches where transactions are sent from.
 */
export async function getPasskeySafeAddress(
    publicKeyX: string, 
    publicKeyY: string, 
    chainId: number = 8453
): Promise<Address> {
    const publicClient = getPublicClient(chainId);

    // Format public key (64 bytes: x || y)
    const xPadded = publicKeyX.replace(/^0x/i, '').padStart(64, '0');
    const yPadded = publicKeyY.replace(/^0x/i, '').padStart(64, '0');
    const formattedPublicKey = `0x${xPadded}${yPadded}` as Hex;

    // Determine rpId based on environment
    const rpId = typeof window !== "undefined" 
        ? window.location.hostname 
        : "spritz.chat";

    // Create WebAuthn account (credential ID doesn't affect address)
    const webAuthnAccount = toWebAuthnAccount({
        credential: {
            id: "address-calculation-only",
            publicKey: formattedPublicKey,
        },
        rpId,
    });

    // Create Safe account with WebAuthn owner
    const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [webAuthnAccount],
        version: "1.4.1",
        entryPoint: {
            address: entryPoint07Address,
            version: "0.7",
        },
        saltNonce: BigInt(0),
        safeWebAuthnSharedSignerAddress: "0x94a4F6affBd8975951142c3999aEAB7ecee555c2" as Address,
        safeP256VerifierAddress: "0xA86e0054C51E4894D88762a017ECc5E5235f5DBA" as Address,
    });

    return safeAccount.address;
}
```

**Key Property**: Same owner + saltNonce = same Safe address on ALL chains.

### Check Deployment Status

```typescript
export async function isSafeDeployed(
    address: Address, 
    chainId: number
): Promise<boolean> {
    const publicClient = getPublicClient(chainId);
    
    const code = await publicClient.getCode({ address });
    return code !== undefined && code !== "0x" && code.length > 2;
}
```

---

## React Hooks & Address Management

### The `useSmartWallet` Hook

The primary React hook for interacting with Spritz Wallets:

```typescript
import { useSmartWallet } from "@/hooks/useSmartWallet";

type SmartWalletInfo = {
    spritzId: Address;                    // User's identity address
    smartWalletAddress: Address | null;   // Safe counterfactual address
    isDeployed: boolean;                  // Whether Safe is deployed on-chain
    walletType: "passkey" | "email" | "wallet" | "digitalid";
    canSign: boolean;                     // Can user sign transactions?
    signerType: "eoa" | "passkey" | "none";
    supportedChains: {
        chainId: number;
        name: string;
        sponsorship?: "free" | "usdc";
    }[];
    needsPasskey?: boolean;               // User needs to create passkey first
    passkeyCredentialId?: string | null;  // Credential ID for passkey users
    warning?: string;                     // Warning message if applicable
};

// Usage
function WalletComponent() {
    const { smartWallet, isLoading, error, refresh } = useSmartWallet(userAddress);
    
    if (isLoading) return <Loading />;
    if (error) return <Error message={error} />;
    
    return (
        <div>
            <p>Spritz ID: {smartWallet?.spritzId}</p>
            <p>Wallet: {smartWallet?.smartWalletAddress}</p>
            <p>Type: {smartWallet?.walletType}</p>
        </div>
    );
}
```

### Dual Address System

Spritz uses a dual-address system:

| Address | Purpose | Source |
|---------|---------|--------|
| **Spritz ID** | Social identity (profiles, friends, messages, database records) | Auth method-dependent |
| **Smart Wallet** | Token storage, on-chain transactions | Safe counterfactual address |

```
User Authentication
        │
        ▼
┌───────────────────────────────────────┐
│              Spritz ID                │
│  (wallet address, passkey hash, etc.) │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│          Smart Wallet Address         │
│    (Safe counterfactual, for tokens)  │
└───────────────────────────────────────┘
```

### Address Caching

Smart wallet addresses are cached in localStorage for improved UX:

```typescript
const SMART_WALLET_CACHE_KEY = "spritz_smart_wallet_cache";

// Get cached address (for immediate display)
function getCachedSmartWallet(userAddress: string): Address | null {
    if (typeof window === "undefined") return null;
    try {
        const cache = localStorage.getItem(SMART_WALLET_CACHE_KEY);
        if (!cache) return null;
        const parsed = JSON.parse(cache);
        return parsed[userAddress.toLowerCase()] || null;
    } catch {
        return null;
    }
}

// Cache address after server fetch
function setCachedSmartWallet(userAddress: string, smartWalletAddress: Address): void {
    if (typeof window === "undefined") return;
    try {
        const cache = localStorage.getItem(SMART_WALLET_CACHE_KEY);
        const parsed = cache ? JSON.parse(cache) : {};
        parsed[userAddress.toLowerCase()] = smartWalletAddress;
        localStorage.setItem(SMART_WALLET_CACHE_KEY, JSON.stringify(parsed));
    } catch {
        // Ignore cache errors
    }
}
```

**Caching benefits:**
- Immediate display on page load (no flicker)
- Offline fallback when session expires
- Reduced API calls for returning users

### API Endpoint

The `/api/wallet/smart-wallet` endpoint returns the authenticated user's wallet info:

```typescript
// GET /api/wallet/smart-wallet
// Requires: authenticated session (spritz_session cookie)

// Success Response
{
    spritzId: "0x...",
    smartWalletAddress: "0x...",
    isDeployed: true,
    walletType: "passkey",
    canSign: true,
    signerType: "passkey",
    supportedChains: [
        { chainId: 8453, name: "Base", sponsorship: "free" },
        // ...
    ],
    passkeyCredentialId: "base64url..."
}

// Needs Passkey Response (for email/World ID users)
{
    needsPasskey: true,
    walletType: "email",
    canSign: false,
    signerType: "none",
    smartWalletAddress: "0x...",  // May have stored address (lost passkey case)
    warning: "Create a passkey to enable wallet features"
}
```

---

## EOA Wallet Integration

### Create Safe Account Client

```typescript
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";

export async function createSafeAccountClient(
    ownerAddress: Address,
    chainId: number,
    signMessage: (message: string) => Promise<`0x${string}`>,
    signTypedData: (data: unknown) => Promise<`0x${string}`>,
    options?: { forceNativeGas?: boolean }
): Promise<SmartAccountClient> {
    const chain = SAFE_SUPPORTED_CHAINS[chainId];
    const publicClient = getPublicClient(chainId);
    const pimlicoClient = getPimlicoClient(chainId);

    // Create Safe account with EOA owner
    const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [{
            address: ownerAddress,
            type: "local",
            signMessage: async ({ message }) => {
                if (typeof message === "string") {
                    return signMessage(message);
                }
                return signMessage(message.raw as string);
            },
            signTypedData: async (typedData) => {
                return signTypedData(typedData);
            },
        } as any],
        version: "1.4.1",
        entryPoint: { address: entryPoint07Address, version: "0.7" },
        saltNonce: BigInt(0),
    });

    // Get paymaster context
    const paymasterContext = options?.forceNativeGas
        ? undefined
        : getPaymasterContext(chainId);

    // Create client
    const clientConfig = {
        account: safeAccount,
        chain,
        bundlerTransport: http(getPimlicoBundlerUrl(chainId)),
        userOperation: {
            estimateFeesPerGas: async () => {
                const prices = await pimlicoClient.getUserOperationGasPrice();
                return prices.fast;
            },
        },
    };

    if (paymasterContext) {
        clientConfig.paymaster = pimlicoClient;
        clientConfig.paymasterContext = paymasterContext;
    }

    return createSmartAccountClient(clientConfig);
}
```

---

## Passkey/WebAuthn Integration

Spritz uses **WebAuthn passkeys** with **P-256 (secp256r1)** elliptic curve cryptography to enable passwordless, phishing-resistant authentication that can directly sign blockchain transactions.

### WebAuthn & Safe Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WebAuthn → Safe Transaction Flow                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        1. PASSKEY CREATION                          │ │
│  │                                                                      │ │
│  │  navigator.credentials.create() → P-256 Key Pair                    │ │
│  │                                                                      │ │
│  │  ┌─────────────────┐           ┌─────────────────┐                 │ │
│  │  │  Private Key    │           │  Public Key     │                 │ │
│  │  │  (Never leaves  │           │  x: 32 bytes    │                 │ │
│  │  │   authenticator)│           │  y: 32 bytes    │                 │ │
│  │  └─────────────────┘           └─────────────────┘                 │ │
│  │                                        │                            │ │
│  │                                        ▼                            │ │
│  │                          Stored in Supabase for                     │ │
│  │                          Safe address calculation                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      2. SAFE ADDRESS DERIVATION                     │ │
│  │                                                                      │ │
│  │  toSafeSmartAccount({                                               │ │
│  │    owners: [webAuthnAccount],  ◄── P-256 public key                │ │
│  │    safeWebAuthnSharedSignerAddress: "0x94a4F6aff...",              │ │
│  │    safeP256VerifierAddress: "0xA86e0054C51E..."                    │ │
│  │  })                                                                 │ │
│  │                                                                      │ │
│  │  → Deterministic Safe Address (same on all chains)                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     3. TRANSACTION SIGNING                          │ │
│  │                                                                      │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │ │
│  │  │ UserOp Hash │───►│ WebAuthn    │───►│ P-256 ECDSA Signature   │ │ │
│  │  │ (32 bytes)  │    │ Assertion   │    │ r: 32 bytes             │ │ │
│  │  └─────────────┘    │ (biometric) │    │ s: 32 bytes             │ │ │
│  │                      └─────────────┘    │ + authenticatorData    │ │ │
│  │                                         │ + clientDataJSON       │ │ │
│  │                                         └─────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    4. ON-CHAIN VERIFICATION                         │ │
│  │                                                                      │ │
│  │  ERC-4337 EntryPoint                                                │ │
│  │         │                                                           │ │
│  │         ▼                                                           │ │
│  │  Safe Contract (validateUserOp)                                     │ │
│  │         │                                                           │ │
│  │         ▼                                                           │ │
│  │  SafeWebAuthnSharedSigner                                           │ │
│  │         │                                                           │ │
│  │         ▼                                                           │ │
│  │  P256Verifier (precompile or contract)                              │ │
│  │         │                                                           │ │
│  │         ▼                                                           │ │
│  │  ✓ Signature Valid → Execute Transaction                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### P-256 Elliptic Curve Cryptography

WebAuthn uses the **P-256 (secp256r1/prime256v1)** curve, which differs from Ethereum's native **secp256k1**:

| Property | P-256 (WebAuthn) | secp256k1 (Ethereum) |
|----------|------------------|----------------------|
| **Curve** | NIST P-256 | Koblitz |
| **Key Size** | 256 bits | 256 bits |
| **Signature** | ECDSA (r, s) | ECDSA (r, s, v) |
| **Browser Support** | Native (WebAuthn) | Requires library |
| **Hardware Support** | Secure Enclave, TPM | Software only |
| **EVM Support** | Via precompile/contract | Native `ecrecover` |

#### P-256 Key Structure

```typescript
// P-256 Public Key (uncompressed format)
interface P256PublicKey {
    x: `0x${string}`;  // 32 bytes (256 bits) - X coordinate
    y: `0x${string}`;  // 32 bytes (256 bits) - Y coordinate
}

// Combined format for viem (64 bytes total)
const formattedPublicKey = `0x${x.slice(2).padStart(64, '0')}${y.slice(2).padStart(64, '0')}`;

// Example:
// x: 0x8b4c2e3f...a1b2c3d4 (32 bytes)
// y: 0x1a2b3c4d...e5f6a7b8 (32 bytes)
// Combined: 0x8b4c2e3f...a1b2c3d41a2b3c4d...e5f6a7b8 (64 bytes)
```

#### P-256 Signature Structure

```typescript
// WebAuthn P-256 ECDSA Signature
interface P256Signature {
    r: Uint8Array;  // 32 bytes - signature component
    s: Uint8Array;  // 32 bytes - signature component
    // Note: No 'v' (recovery id) - P-256 signatures don't include it
}

// WebAuthn wraps the signature with additional data
interface WebAuthnSignature {
    authenticatorData: Uint8Array;  // Authenticator state (≥37 bytes)
    clientDataJSON: string;          // JSON with challenge, origin, type
    signature: Uint8Array;           // DER-encoded P-256 signature
}
```

---

### Passkey Credential Interface

```typescript
import { toWebAuthnAccount } from "viem/account-abstraction";

export interface PasskeyCredential {
    credentialId: string;  // Base64url encoded credential ID
    publicKey: {
        x: `0x${string}`;  // P-256 X coordinate (32 bytes)
        y: `0x${string}`;  // P-256 Y coordinate (32 bytes)
    };
}

// Storage in Supabase
interface StoredPasskey {
    credential_id: string;        // Base64url credential ID
    public_key_x: string;         // Hex-encoded X coordinate
    public_key_y: string;         // Hex-encoded Y coordinate
    user_address: string;         // Derived Spritz ID
    rp_id: string;               // Relying party ID (e.g., "spritz.chat")
    created_at: string;
    last_used_at: string;
}
```

---

### WebAuthn Registration (Passkey Creation)

```typescript
import { startRegistration } from "@simplewebauthn/browser";
import { decodeAttestationObject, parseAuthData } from "@simplewebauthn/server/helpers";

/**
 * Register a new passkey and extract the P-256 public key
 */
export async function registerPasskey(): Promise<PasskeyCredential> {
    // 1. Get registration options from server
    const optionsResponse = await fetch('/api/auth/webauthn/register-options');
    const options = await optionsResponse.json();

    // 2. Create credential via WebAuthn API
    const credential = await navigator.credentials.create({
        publicKey: {
            challenge: base64urlToArrayBuffer(options.challenge),
            rp: {
                name: "Spritz",
                id: getRpId(),  // "spritz.chat" or "localhost"
            },
            user: {
                id: base64urlToArrayBuffer(options.userId),
                name: options.userName,
                displayName: options.userDisplayName,
            },
            // CRITICAL: Request P-256 algorithm (-7 = ES256)
            pubKeyCredParams: [
                { alg: -7, type: "public-key" },   // ES256 (P-256)
                // Note: Do NOT include -8 (Ed25519) as Safe doesn't support it
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",  // Prefer built-in (TouchID, FaceID)
                residentKey: "preferred",             // Discoverable credential
                userVerification: "preferred",        // Biometric/PIN
            },
            timeout: 120000,  // 2 minutes
            attestation: "none",  // Don't need attestation for our use case
        },
    });

    if (!credential || credential.type !== "public-key") {
        throw new Error("Failed to create credential");
    }

    // 3. Extract P-256 public key from attestation
    const response = credential.response as AuthenticatorAttestationResponse;
    const publicKey = extractP256PublicKey(response.attestationObject);

    // 4. Store credential on server
    await fetch('/api/auth/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            credentialId: credential.id,
            publicKeyX: publicKey.x,
            publicKeyY: publicKey.y,
            attestationObject: arrayBufferToBase64url(response.attestationObject),
            clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
        }),
    });

    return {
        credentialId: credential.id,
        publicKey,
    };
}

/**
 * Extract P-256 public key coordinates from WebAuthn attestation
 */
function extractP256PublicKey(attestationObject: ArrayBuffer): P256PublicKey {
    const decoded = decodeAttestationObject(new Uint8Array(attestationObject));
    const authData = parseAuthData(decoded.authData);

    if (!authData.credentialPublicKey) {
        throw new Error("No credential public key in attestation");
    }

    // Decode COSE key structure
    // COSE Key for P-256:
    // {
    //   1: 2,      // kty: EC2
    //   3: -7,     // alg: ES256
    //   -1: 1,     // crv: P-256
    //   -2: x,     // x-coordinate (32 bytes)
    //   -3: y      // y-coordinate (32 bytes)
    // }
    const coseKey = decodeCBOR(authData.credentialPublicKey);

    const kty = coseKey.get(1);
    const alg = coseKey.get(3);
    const crv = coseKey.get(-1);

    // Verify it's P-256
    if (kty !== 2 || alg !== -7 || crv !== 1) {
        throw new Error(`Unsupported key type: kty=${kty}, alg=${alg}, crv=${crv}`);
    }

    const x = coseKey.get(-2) as Uint8Array;
    const y = coseKey.get(-3) as Uint8Array;

    if (x.length !== 32 || y.length !== 32) {
        throw new Error(`Invalid key coordinates: x=${x.length}, y=${y.length}`);
    }

    return {
        x: `0x${Buffer.from(x).toString('hex')}` as `0x${string}`,
        y: `0x${Buffer.from(y).toString('hex')}` as `0x${string}`,
    };
}
```

---

### WebAuthn Authentication (Signing)

```typescript
/**
 * Sign a message using the passkey (triggers biometric prompt)
 */
export async function signWithPasskey(
    credentialId: string,
    challenge: Uint8Array
): Promise<WebAuthnSignature> {
    const credential = await navigator.credentials.get({
        publicKey: {
            challenge,
            rpId: getRpId(),
            timeout: 120000,
            userVerification: "preferred",
            allowCredentials: [{
                id: base64urlToArrayBuffer(credentialId),
                type: "public-key",
                transports: ["internal", "hybrid"],  // Platform + cross-device
            }],
        },
    });

    if (!credential || credential.type !== "public-key") {
        throw new Error("Failed to get credential");
    }

    const response = credential.response as AuthenticatorAssertionResponse;

    return {
        authenticatorData: new Uint8Array(response.authenticatorData),
        clientDataJSON: new TextDecoder().decode(response.clientDataJSON),
        signature: new Uint8Array(response.signature),
    };
}
```

---

### Safe Integration Contracts

Spritz uses Safe's WebAuthn signer contracts for on-chain signature verification:

| Contract | Address | Purpose |
|----------|---------|---------|
| **SafeWebAuthnSharedSigner** | `0x94a4F6affBd8975951142c3999aEAB7ecee555c2` | Shared signer module for all WebAuthn-based Safes |
| **SafeP256Verifier** | `0xA86e0054C51E4894D88762a017ECc5E5235f5DBA` | P-256 signature verification (uses RIP-7212 precompile when available) |

:::tip Verify Contract Addresses
Always verify contract addresses on a block explorer before use in production. These addresses are deployed by Safe and are the same across all supported EVM chains. You can verify them at:
- [Safe Deployments Repository](https://github.com/safe-global/safe-deployments)
- [Etherscan](https://etherscan.io/address/0x94a4F6affBd8975951142c3999aEAB7ecee555c2)
:::

#### RIP-7212: P256 Precompile

Some chains support [RIP-7212](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md), a native P-256 verification precompile at address `0x0000000000000000000000000000000000000100`:

| Chain | RIP-7212 Support | Gas Cost |
|-------|------------------|----------|
| Base | ✅ Yes | ~3,450 gas |
| Arbitrum | ✅ Yes | ~3,450 gas |
| Optimism | ✅ Yes | ~3,450 gas |
| Polygon | ✅ Yes | ~3,450 gas |
| Ethereum | ❌ No (uses contract fallback) | ~200,000 gas |

The `SafeP256Verifier` automatically uses the precompile when available, falling back to a Solidity implementation otherwise.

---

### Create Safe with Passkey Owner

```typescript
import { toWebAuthnAccount } from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";

export async function createPasskeySafeAccountClient(
    passkeyCredential: PasskeyCredential,
    chainId: number,
    options?: { forceNativeGas?: boolean }
): Promise<SmartAccountClient> {
    const chain = SAFE_SUPPORTED_CHAINS[chainId];
    const publicClient = getPublicClient(chainId);
    const pimlicoClient = getPimlicoClient(chainId);

    // Format public key for viem (64 bytes: x || y)
    const xHex = passkeyCredential.publicKey.x.replace(/^0x/i, '').padStart(64, '0');
    const yHex = passkeyCredential.publicKey.y.replace(/^0x/i, '').padStart(64, '0');
    const formattedPublicKey = `0x${xHex}${yHex}` as Hex;

    // Get rpId (must match passkey registration)
    const getRpId = (): string => {
        if (typeof window === 'undefined') return 'spritz.chat';
        const hostname = window.location.hostname;
        if (hostname.includes('spritz.chat')) return 'spritz.chat';
        if (hostname === 'localhost') return 'localhost';
        return hostname;
    };

    // Create WebAuthn account from viem
    // This wraps the passkey as an "owner" that can sign for the Safe
    const webAuthnAccount = toWebAuthnAccount({
        credential: {
            id: passkeyCredential.credentialId,
            publicKey: formattedPublicKey,
        },
        rpId: getRpId(),
    });

    // Create Safe with WebAuthn owner
    const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [webAuthnAccount],
        version: "1.4.1",
        entryPoint: { address: entryPoint07Address, version: "0.7" },
        saltNonce: BigInt(0),
        // WebAuthn verification contracts (deployed on all supported chains)
        safeWebAuthnSharedSignerAddress: "0x94a4F6affBd8975951142c3999aEAB7ecee555c2",
        safeP256VerifierAddress: "0xA86e0054C51E4894D88762a017ECc5E5235f5DBA",
    });

    // Create client with paymaster
    const paymasterContext = options?.forceNativeGas
        ? undefined
        : getPaymasterContext(chainId);

    const clientConfig = {
        account: safeAccount,
        chain,
        bundlerTransport: http(getPimlicoBundlerUrl(chainId)),
        userOperation: {
            estimateFeesPerGas: async () => {
                const prices = await pimlicoClient.getUserOperationGasPrice();
                return prices.fast;
            },
        },
    };

    if (paymasterContext) {
        clientConfig.paymaster = pimlicoClient;
        clientConfig.paymasterContext = paymasterContext;
    }

    return createSmartAccountClient(clientConfig);
}
```

---

### WebAuthn Signature Encoding for Safe

When signing a UserOperation with a passkey, the signature must be encoded in a specific format for the Safe contract:

```typescript
import { encodeAbiParameters, parseAbiParameters } from 'viem';

/**
 * Encode a WebAuthn signature for Safe contract verification
 * 
 * The Safe expects the signature in this format:
 * abi.encode(authenticatorData, clientDataFields, r, s)
 */
export function encodeWebAuthnSignature(
    webAuthnSignature: WebAuthnSignature
): `0x${string}` {
    // Parse the DER-encoded signature to extract r and s
    const { r, s } = parseDERSignature(webAuthnSignature.signature);

    // Extract clientDataJSON fields (everything after "challenge":"...")
    // The Safe contract reconstructs the full clientDataJSON to verify
    const clientDataFields = extractClientDataFields(webAuthnSignature.clientDataJSON);

    // Encode for Safe's WebAuthn verification
    return encodeAbiParameters(
        parseAbiParameters('bytes authenticatorData, string clientDataFields, uint256 r, uint256 s'),
        [
            webAuthnSignature.authenticatorData,
            clientDataFields,
            BigInt(`0x${Buffer.from(r).toString('hex')}`),
            BigInt(`0x${Buffer.from(s).toString('hex')}`),
        ]
    );
}

/**
 * Parse DER-encoded ECDSA signature to r and s components
 * 
 * DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
 */
function parseDERSignature(signature: Uint8Array): { r: Uint8Array; s: Uint8Array } {
    let offset = 0;

    // Check SEQUENCE tag
    if (signature[offset++] !== 0x30) {
        throw new Error('Invalid DER signature: missing SEQUENCE tag');
    }

    // Skip total length
    let length = signature[offset++];
    if (length & 0x80) {
        const numBytes = length & 0x7f;
        offset += numBytes;
    }

    // Parse r
    if (signature[offset++] !== 0x02) {
        throw new Error('Invalid DER signature: missing INTEGER tag for r');
    }
    let rLength = signature[offset++];
    let r = signature.slice(offset, offset + rLength);
    offset += rLength;

    // Parse s
    if (signature[offset++] !== 0x02) {
        throw new Error('Invalid DER signature: missing INTEGER tag for s');
    }
    let sLength = signature[offset++];
    let s = signature.slice(offset, offset + sLength);

    // Remove leading zeros and pad to 32 bytes
    r = padTo32Bytes(removeLeadingZeros(r));
    s = padTo32Bytes(removeLeadingZeros(s));

    return { r, s };
}

function removeLeadingZeros(bytes: Uint8Array): Uint8Array {
    let start = 0;
    while (start < bytes.length - 1 && bytes[start] === 0) {
        start++;
    }
    return bytes.slice(start);
}

function padTo32Bytes(bytes: Uint8Array): Uint8Array {
    if (bytes.length >= 32) return bytes.slice(0, 32);
    const padded = new Uint8Array(32);
    padded.set(bytes, 32 - bytes.length);
    return padded;
}

/**
 * Extract the clientDataFields portion for Safe verification
 * 
 * clientDataJSON format:
 * {"type":"webauthn.get","challenge":"...","origin":"https://spritz.chat","crossOrigin":false}
 * 
 * Safe needs everything after the challenge for reconstruction
 */
function extractClientDataFields(clientDataJSON: string): string {
    const parsed = JSON.parse(clientDataJSON);
    
    // Find where challenge ends and extract the rest
    const challengeEnd = clientDataJSON.indexOf('"', clientDataJSON.indexOf('"challenge":"') + 13);
    return clientDataJSON.slice(challengeEnd + 1, -1); // Remove final }
}
```

---

### ERC-4337 UserOperation Signing with WebAuthn

```typescript
/**
 * Complete flow for signing a UserOperation with a passkey
 */
export async function signUserOperationWithPasskey(
    userOp: UserOperation,
    entryPointAddress: Address,
    chainId: number,
    passkeyCredential: PasskeyCredential
): Promise<`0x${string}`> {
    // 1. Calculate UserOperation hash
    const userOpHash = getUserOperationHash(userOp, entryPointAddress, chainId);

    // 2. Create WebAuthn challenge from UserOp hash
    // The challenge must be base64url encoded for WebAuthn
    const challenge = new Uint8Array(Buffer.from(userOpHash.slice(2), 'hex'));

    // 3. Sign with passkey (triggers biometric)
    const webAuthnSignature = await signWithPasskey(
        passkeyCredential.credentialId,
        challenge
    );

    // 4. Verify the signature locally before submitting
    const isValid = await verifyWebAuthnSignature(
        challenge,
        webAuthnSignature,
        passkeyCredential.publicKey
    );

    if (!isValid) {
        throw new Error('Local signature verification failed');
    }

    // 5. Encode for Safe contract
    return encodeWebAuthnSignature(webAuthnSignature);
}

/**
 * Calculate ERC-4337 UserOperation hash
 */
function getUserOperationHash(
    userOp: UserOperation,
    entryPointAddress: Address,
    chainId: number
): `0x${string}` {
    // Pack UserOperation (excluding signature)
    const packed = encodeAbiParameters(
        parseAbiParameters(
            'address sender, uint256 nonce, bytes initCode, bytes callData, ' +
            'uint256 callGasLimit, uint256 verificationGasLimit, ' +
            'uint256 preVerificationGas, uint256 maxFeePerGas, ' +
            'uint256 maxPriorityFeePerGas, bytes paymasterAndData'
        ),
        [
            userOp.sender,
            userOp.nonce,
            userOp.initCode || '0x',
            userOp.callData,
            userOp.callGasLimit,
            userOp.verificationGasLimit,
            userOp.preVerificationGas,
            userOp.maxFeePerGas,
            userOp.maxPriorityFeePerGas,
            userOp.paymasterAndData || '0x',
        ]
    );

    // Hash the packed data
    const userOpHashInner = keccak256(packed);

    // Combine with entry point and chain ID
    return keccak256(
        encodeAbiParameters(
            parseAbiParameters('bytes32, address, uint256'),
            [userOpHashInner, entryPointAddress, BigInt(chainId)]
        )
    );
}
```

---

### Local Signature Verification

Before submitting to the network, verify signatures locally to catch errors early:

```typescript
import { p256 } from '@noble/curves/p256';
import { sha256 } from '@noble/hashes/sha256';

/**
 * Verify a WebAuthn P-256 signature locally
 */
export async function verifyWebAuthnSignature(
    challenge: Uint8Array,
    webAuthnSignature: WebAuthnSignature,
    publicKey: P256PublicKey
): Promise<boolean> {
    // 1. Reconstruct the signed data
    // WebAuthn signs: SHA256(authenticatorData || SHA256(clientDataJSON))
    const clientDataHash = sha256(new TextEncoder().encode(webAuthnSignature.clientDataJSON));
    const signedData = new Uint8Array([
        ...webAuthnSignature.authenticatorData,
        ...clientDataHash,
    ]);
    const messageHash = sha256(signedData);

    // 2. Parse the signature
    const { r, s } = parseDERSignature(webAuthnSignature.signature);

    // 3. Format public key for noble-curves
    const publicKeyUncompressed = new Uint8Array(65);
    publicKeyUncompressed[0] = 0x04; // Uncompressed point indicator
    publicKeyUncompressed.set(hexToBytes(publicKey.x), 1);
    publicKeyUncompressed.set(hexToBytes(publicKey.y), 33);

    // 4. Verify using noble-curves P-256
    const signatureBytes = new Uint8Array([...r, ...s]);
    
    try {
        return p256.verify(
            signatureBytes,
            messageHash,
            publicKeyUncompressed
        );
    } catch {
        return false;
    }
}
```

---

### WebAuthn Gas Limits

For WebAuthn transactions, explicit gas limits are required because simulation often fails due to the complexity of P-256 verification:

```typescript
// From src/lib/constants.ts
const WEBAUTHN_GAS_LIMITS = {
    // Safe deployment + P-256 signature verification
    verificationGasLimit: BigInt(800000),
    
    // Transaction execution
    callGasLimit: BigInt(200000),
    
    // Pre-verification overhead (bundler operations)
    preVerificationGas: BigInt(100000),
    
    // Paymaster verification
    paymasterVerificationGasLimit: BigInt(150000),
    
    // Paymaster post-operation
    paymasterPostOpGasLimit: BigInt(50000),
};

// Usage when sending transactions
const txHash = await client.sendTransaction({
    calls: [{ to, value, data }],
    // Explicit gas limits for WebAuthn
    ...WEBAUTHN_GAS_LIMITS,
});
```

:::info Why Explicit Gas Limits?
ERC-4337 bundlers simulate UserOperations before submission. P-256 verification is complex and simulation can timeout or produce inaccurate estimates. Explicit limits ensure transactions succeed.
:::

---

### Cross-Device Passkey Authentication (Hybrid Transport)

WebAuthn supports signing from a different device than where the browser is running (e.g., using your phone to sign a transaction on your laptop):

```typescript
/**
 * Request passkey authentication with hybrid (cross-device) support
 */
export async function signWithPasskeyCrossDevice(
    credentialId: string,
    challenge: Uint8Array,
    options?: { preferHybrid?: boolean }
): Promise<WebAuthnSignature> {
    const credential = await navigator.credentials.get({
        publicKey: {
            challenge,
            rpId: getRpId(),
            timeout: 300000,  // 5 minutes for cross-device
            userVerification: "preferred",
            allowCredentials: [{
                id: base64urlToArrayBuffer(credentialId),
                type: "public-key",
                // Include all possible transports
                transports: [
                    "internal",    // Built-in authenticator (TouchID, Windows Hello)
                    "hybrid",      // Cross-device via QR code / Bluetooth
                    "usb",         // Hardware security keys
                    "ble",         // Bluetooth Low Energy
                    "nfc",         // Near Field Communication
                ],
            }],
        },
        // Enable conditional UI for better UX (shows passkey selector)
        mediation: options?.preferHybrid ? "required" : "optional",
    });

    if (!credential) {
        throw new Error("Authentication cancelled");
    }

    const response = credential.response as AuthenticatorAssertionResponse;
    return {
        authenticatorData: new Uint8Array(response.authenticatorData),
        clientDataJSON: new TextDecoder().decode(response.clientDataJSON),
        signature: new Uint8Array(response.signature),
    };
}
```

#### Hybrid Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Cross-Device (Hybrid) Passkey Flow                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐                        ┌────────────────┐           │
│  │    Laptop      │                        │    Phone       │           │
│  │   (Browser)    │                        │  (Passkey)     │           │
│  └────────────────┘                        └────────────────┘           │
│         │                                          │                     │
│         │  1. User clicks "Sign"                   │                     │
│         ▼                                          │                     │
│  ┌─────────────────┐                              │                     │
│  │ WebAuthn shows  │                              │                     │
│  │ QR code or asks │──────────────────────────────┤                     │
│  │ to use phone    │  2. Scan QR / Bluetooth      │                     │
│  └─────────────────┘     discovery                │                     │
│         │                                          ▼                     │
│         │                               ┌─────────────────┐             │
│         │                               │ Phone prompts   │             │
│         │                               │ for biometric   │             │
│         │                               │ (FaceID/Touch)  │             │
│         │                               └─────────────────┘             │
│         │                                          │                     │
│         │  3. Encrypted signature                  │                     │
│         │     sent via CTAP2/FIDO2                │                     │
│         ◄──────────────────────────────────────────┘                     │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────┐                                                    │
│  │ Transaction     │                                                    │
│  │ signed and      │                                                    │
│  │ submitted       │                                                    │
│  └─────────────────┘                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Passkey Security Considerations

| Risk | Mitigation | Implementation |
|------|------------|----------------|
| **Phishing** | Origin-bound credentials | rpId = "spritz.chat" prevents cross-origin use |
| **Replay attacks** | Challenge uniqueness | Server generates random 32-byte challenges |
| **Key extraction** | Hardware protection | Private key never leaves Secure Enclave/TPM |
| **Lost device** | Recovery signer | Add EOA as backup Safe owner |
| **Stolen device** | User verification | Biometric/PIN required for each signature |

#### rpId Security

The `rpId` is bound to the credential during registration and **cannot be changed**:

```typescript
// Registration creates credential bound to "spritz.chat"
const credential = await navigator.credentials.create({
    publicKey: {
        rp: {
            name: "Spritz",
            id: "spritz.chat",  // This is permanent!
        },
        // ...
    },
});

// Any subdomain can use the credential:
// ✅ app.spritz.chat
// ✅ beta.spritz.chat
// ✅ spritz.chat

// Other domains CANNOT:
// ❌ spritz.io
// ❌ malicious-site.com
// ❌ spritz.chat.fake.com
```

---

## Transaction Execution

### Send Transaction

```typescript
export interface SendTransactionParams {
    to: Address;
    value: bigint;
    data?: `0x${string}`;
    tokenAddress?: Address;    // For ERC20 transfers
    tokenAmount?: bigint;
    tokenDecimals?: number;
}

export async function sendSafeTransaction(
    client: SmartAccountClient,
    params: SendTransactionParams,
    options: { isWebAuthn?: boolean; forceNativeGas?: boolean } = {}
): Promise<`0x${string}`> {
    const { to, value, data, tokenAddress, tokenAmount } = params;
    const { isWebAuthn = false } = options;

    const calls: Array<{ to: Address; value: bigint; data: `0x${string}` }> = [];
    
    if (tokenAddress && tokenAmount !== undefined) {
        // ERC20 token transfer
        calls.push({
            to: tokenAddress,
            value: BigInt(0),
            data: encodeERC20Transfer(to, tokenAmount),
        });
    } else {
        // Native ETH transfer
        calls.push({
            to,
            value,
            data: data || "0x",
        });
    }
    
    const txParams: Record<string, unknown> = { calls };
    
    // Use explicit gas limits for WebAuthn
    if (isWebAuthn) {
        txParams.verificationGasLimit = WEBAUTHN_GAS_LIMITS.verificationGasLimit;
        txParams.callGasLimit = WEBAUTHN_GAS_LIMITS.callGasLimit;
        txParams.preVerificationGas = WEBAUTHN_GAS_LIMITS.preVerificationGas;
        txParams.paymasterVerificationGasLimit = WEBAUTHN_GAS_LIMITS.paymasterVerificationGasLimit;
        txParams.paymasterPostOpGasLimit = WEBAUTHN_GAS_LIMITS.paymasterPostOpGasLimit;
    }
    
    return client.sendTransaction(txParams as any);
}
```

### ERC20 Encoding

```typescript
import { encodeFunctionData } from "viem";

const ERC20_TRANSFER_ABI = [{
    name: "transfer",
    type: "function",
    inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
}] as const;

export function encodeERC20Transfer(to: Address, amount: bigint): `0x${string}` {
    return encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [to, amount],
    });
}
```

---

## Gas Sponsorship

### Sponsorship Policy

L2 transactions are sponsored via Pimlico's sponsorship policy:

```typescript
export function getPaymasterContext(chainId: number = 8453) {
    const config = CHAIN_SPONSORSHIP_CONFIG[chainId];
    const policyId = process.env.NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID;
    
    if (config?.type === "sponsor" && policyId) {
        return { sponsorshipPolicyId: policyId };
    }
    
    if (config?.type === "erc20") {
        const usdcAddress = USDC_ADDRESSES[chainId];
        if (usdcAddress) {
            return { token: usdcAddress };
        }
    }
    
    return undefined;
}
```

### ERC-20 Paymaster (Mainnet)

On Ethereum mainnet, users pay gas in USDC:

```typescript
// USDC addresses per chain
export const USDC_ADDRESSES: Record<number, Address> = {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",    // Ethereum
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  // Base
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
    10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",   // Optimism
    137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",  // Polygon
    56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",   // BSC
    43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // Avalanche
};

// Pimlico ERC-20 Paymaster address
export const PIMLICO_ERC20_PAYMASTER_ADDRESS: Address = 
    "0x777777777777AeC03fd955926DbF81597e66834C";
```

### Check USDC Approval

```typescript
export async function checkPaymasterAllowance(
    safeAddress: Address,
    chainId: number
): Promise<{ hasApproval: boolean; allowance: bigint }> {
    const usdcAddress = USDC_ADDRESSES[chainId];
    if (!usdcAddress) return { hasApproval: true, allowance: BigInt(0) };
    
    const publicClient = getPublicClient(chainId);
    
    const allowance = await publicClient.readContract({
        address: usdcAddress,
        abi: [{ 
            name: 'allowance', 
            type: 'function', 
            inputs: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' }
            ], 
            outputs: [{ name: '', type: 'uint256' }] 
        }],
        functionName: 'allowance',
        args: [safeAddress, PIMLICO_ERC20_PAYMASTER_ADDRESS],
    });
    
    const minRequired = BigInt(2_000_000); // 2 USDC
    return {
        hasApproval: allowance >= minRequired,
        allowance,
    };
}
```

---

## Direct Execution (EOA Pays Gas)

For cases where the user wants to pay gas directly from an EOA:

### Deploy Safe with EOA

```typescript
// Safe v1.4.1 contract addresses (same on all chains)
const SAFE_PROXY_FACTORY_141 = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
const SAFE_SINGLETON_141 = "0x41675C099F32341bf84BFc5382aF534df5C7461a";
const SAFE_FALLBACK_HANDLER_141 = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";

export async function deploySafeWithEOA(
    ownerAddress: Address,
    chainId: number,
    walletClient: WalletClient
): Promise<{ txHash: Hex; safeAddress: Address }> {
    // Encode Safe setup call
    const setupData = encodeFunctionData({
        abi: SAFE_SETUP_ABI,
        functionName: "setup",
        args: [
            [ownerAddress],  // owners
            BigInt(1),       // threshold
            "0x0000000000000000000000000000000000000000", // no module
            "0x",            // no data
            SAFE_FALLBACK_HANDLER_141,
            "0x0000000000000000000000000000000000000000", // native token
            BigInt(0),       // no payment
            "0x0000000000000000000000000000000000000000", // no receiver
        ],
    });

    // Deploy via factory
    const txHash = await walletClient.writeContract({
        address: SAFE_PROXY_FACTORY_141,
        abi: SAFE_PROXY_FACTORY_ABI,
        functionName: "createProxyWithNonce",
        args: [SAFE_SINGLETON_141, setupData, BigInt(0)],
    });

    const safeAddress = await getSafeAddress({ ownerAddress, chainId });
    return { txHash, safeAddress };
}
```

### Execute Transaction Directly

```typescript
export async function execSafeTransactionDirect(
    safeAddress: Address,
    chainId: number,
    to: Address,
    value: bigint,
    data: Hex = "0x",
    walletClient: WalletClient
): Promise<Hex> {
    const publicClient = getPublicClient(chainId);
    
    // Verify ownership
    const isOwner = await isSafeOwner(safeAddress, walletClient.account.address, chainId);
    if (!isOwner) throw new Error("Not an owner of this Safe");

    // Get nonce
    const nonce = await publicClient.readContract({
        address: safeAddress,
        abi: SAFE_ABI,
        functionName: "nonce",
    });

    // Get transaction hash
    const safeTxHash = await publicClient.readContract({
        address: safeAddress,
        abi: SAFE_ABI,
        functionName: "getTransactionHash",
        args: [to, value, data, 0, BigInt(0), BigInt(0), BigInt(0), 
               "0x0000000000000000000000000000000000000000",
               "0x0000000000000000000000000000000000000000", nonce],
    });

    // Sign and adjust v value
    const signature = await walletClient.signMessage({
        message: { raw: safeTxHash },
    });
    
    let v = parseInt(signature.slice(-2), 16);
    if (v < 27) v += 27;
    v += 4; // Safe's eth_sign adjustment
    const adjustedSignature = (signature.slice(0, -2) + v.toString(16).padStart(2, "0"));

    // Execute
    return walletClient.writeContract({
        address: safeAddress,
        abi: SAFE_ABI,
        functionName: "execTransaction",
        args: [to, value, data, 0, BigInt(0), BigInt(0), BigInt(0),
               "0x0000000000000000000000000000000000000000",
               "0x0000000000000000000000000000000000000000", adjustedSignature],
    });
}
```

---

## Recovery Signer

### Add Recovery Signer

```typescript
export async function addRecoverySigner(
    safeAddress: Address,
    recoveryAddress: Address,
    passkeyCredential: PasskeyCredential,
    chainId: number
): Promise<string> {
    // Verify Safe is deployed
    const deployed = await isSafeDeployed(safeAddress, chainId);
    if (!deployed) throw new Error("Safe must be deployed first");
    
    // Check not already an owner
    const alreadyOwner = await isSafeOwner(safeAddress, recoveryAddress, chainId);
    if (alreadyOwner) throw new Error("Already an owner");

    // Encode addOwnerWithThreshold call (keep threshold at 1)
    const addOwnerData = encodeFunctionData({
        abi: SAFE_OWNER_MANAGER_ABI,
        functionName: "addOwnerWithThreshold",
        args: [recoveryAddress, BigInt(1)],
    });
    
    // Create client and send transaction
    const client = await createPasskeySafeAccountClient(passkeyCredential, chainId);
    
    return client.sendTransaction({
        calls: [{
            to: safeAddress,
            value: BigInt(0),
            data: addOwnerData,
        }],
    });
}
```

### Get Recovery Info

```typescript
export async function getRecoveryInfo(
    safeAddress: Address,
    primarySignerAddress: Address,
    chainId: number
): Promise<{
    isDeployed: boolean;
    owners: Address[];
    threshold: number;
    hasRecoverySigner: boolean;
    recoverySigners: Address[];
}> {
    const isDeployed = await isSafeDeployed(safeAddress, chainId);
    if (!isDeployed) {
        return { isDeployed: false, owners: [], threshold: 1, 
                 hasRecoverySigner: false, recoverySigners: [] };
    }
    
    const owners = await getSafeOwners(safeAddress, chainId);
    const threshold = await getSafeThreshold(safeAddress, chainId);
    
    const recoverySigners = owners.filter(
        owner => owner.toLowerCase() !== primarySignerAddress.toLowerCase()
    );
    
    return {
        isDeployed,
        owners,
        threshold,
        hasRecoverySigner: recoverySigners.length > 0,
        recoverySigners,
    };
}
```

---

## Security Considerations

### API Key Protection

The Pimlico API key is exposed client-side (`NEXT_PUBLIC_*`) because account abstraction requires browser-side signing. Mitigations:

1. **Sponsorship Policy** - Limits gas spending per user/time
2. **Domain Restrictions** - API key restricted to specific domains
3. **Rate Limiting** - Built-in Pimlico rate limiting

### Passkey Security

| Risk | Mitigation |
|------|------------|
| **Lost passkey** | Recovery signer option |
| **Phishing** | rpId bound to `spritz.chat` domain |
| **Device theft** | User verification (biometric/PIN) |

### Transaction Security

| Risk | Mitigation |
|------|------------|
| **Replay attacks** | Nonce enforced by Safe contract |
| **Front-running** | Bundler handles transaction ordering |
| **Gas griefing** | Sponsorship policy limits |

---

## Best Practices

### Performance

1. **Cache Safe address** - Computed once, same on all chains
2. **Batch transactions** - Use `calls` array for multiple operations
3. **Estimate gas first** - Avoid failed transactions

### User Experience

1. **Show deployment status** - Let users know if Safe needs deployment
2. **Explain gas source** - Clear indication of who pays gas
3. **Recovery prompt** - Encourage recovery signer setup

### Error Handling

```typescript
try {
    const txHash = await sendSafeTransaction(client, params);
    // Success
} catch (error) {
    if (error.message.includes("gas")) {
        // Insufficient gas or sponsorship limit
    } else if (error.message.includes("signature")) {
        // User rejected signing
    } else if (error.message.includes("nonce")) {
        // Transaction already processed
    }
}
```

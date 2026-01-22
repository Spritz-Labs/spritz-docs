# WebAuthn & Passkey Signatures Deep Dive

Complete technical documentation for WebAuthn-based signatures in Spritz, including P-256 ECDSA cryptography, Safe integration, and transaction signing.

## Overview

Spritz uses **WebAuthn passkeys** as an alternative to EOA wallets for signing transactions. This provides:

- **Device-native security** - Biometric/PIN protected credentials
- **Phishing resistance** - rpId binding prevents credential use on fake sites
- **Account abstraction** - P-256 signatures verified on-chain via Safe modules

---

## P-256 ECDSA Cryptography

### Curve Parameters

WebAuthn uses the **NIST P-256** (secp256r1) elliptic curve, different from Ethereum's secp256k1:

| Parameter | P-256 (WebAuthn) | secp256k1 (Ethereum) |
|-----------|------------------|----------------------|
| **Prime (p)** | 2²⁵⁶ - 2²²⁴ + 2¹⁹² + 2⁹⁶ - 1 | 2²⁵⁶ - 2³² - 977 |
| **Order (n)** | 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551 | 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 |
| **Cofactor** | 1 | 1 |
| **Generator (G)** | (Gx, Gy) defined by NIST | (Gx, Gy) defined by SECG |

### Key Generation

When a user registers a passkey, the authenticator generates a P-256 keypair:

```typescript
// Passkey registration returns a COSE-encoded public key
interface PasskeyPublicKey {
    x: Uint8Array;  // 32-byte X coordinate
    y: Uint8Array;  // 32-byte Y coordinate
}

// The public key point (X, Y) satisfies: Y² = X³ + aX + b (mod p)
// Where a = -3 and b is the P-256 curve parameter
```

### Signature Format

WebAuthn produces **DER-encoded ECDSA signatures** which must be converted to raw format for on-chain verification:

```typescript
/**
 * WebAuthn signature structure (DER encoded):
 * 
 * 0x30 [total-length]
 *   0x02 [r-length] [r-value]
 *   0x02 [s-length] [s-value]
 * 
 * Each value may have leading 0x00 if high bit is set (to indicate positive integer)
 */

interface ECDSASignature {
    r: bigint;  // 32 bytes when normalized
    s: bigint;  // 32 bytes when normalized
}

/**
 * Parse DER-encoded signature to raw (r, s) values
 */
export function parseDERSignature(derSig: Uint8Array): ECDSASignature {
    // Verify DER structure
    if (derSig[0] !== 0x30) {
        throw new Error('Invalid DER signature: missing SEQUENCE tag');
    }
    
    let offset = 2; // Skip SEQUENCE tag and length
    
    // Parse R value
    if (derSig[offset] !== 0x02) {
        throw new Error('Invalid DER signature: missing INTEGER tag for R');
    }
    offset++;
    
    const rLength = derSig[offset++];
    let rStart = offset;
    
    // Skip leading zero if present (indicates positive integer)
    if (derSig[rStart] === 0x00 && rLength > 32) {
        rStart++;
    }
    
    const r = BigInt('0x' + Buffer.from(derSig.slice(rStart, offset + rLength)).toString('hex'));
    offset += rLength;
    
    // Parse S value
    if (derSig[offset] !== 0x02) {
        throw new Error('Invalid DER signature: missing INTEGER tag for S');
    }
    offset++;
    
    const sLength = derSig[offset++];
    let sStart = offset;
    
    if (derSig[sStart] === 0x00 && sLength > 32) {
        sStart++;
    }
    
    const s = BigInt('0x' + Buffer.from(derSig.slice(sStart, offset + sLength)).toString('hex'));
    
    return { r, s };
}
```

### Signature Malleability

ECDSA signatures have a malleability property: for any valid signature (r, s), the signature (r, n - s) is also valid. Safe's P-256 verifier requires **low-S normalization**:

```typescript
// P-256 curve order
const P256_N = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');
const HALF_N = P256_N / BigInt(2);

/**
 * Normalize signature to low-S form
 * Required for Safe's P256Verifier contract
 */
export function normalizeSignature(sig: ECDSASignature): ECDSASignature {
    let { r, s } = sig;
    
    // If s > n/2, use s' = n - s
    if (s > HALF_N) {
        s = P256_N - s;
    }
    
    return { r, s };
}

/**
 * Convert normalized signature to 64-byte raw format
 */
export function signatureToRaw(sig: ECDSASignature): `0x${string}` {
    const normalized = normalizeSignature(sig);
    
    const rHex = normalized.r.toString(16).padStart(64, '0');
    const sHex = normalized.s.toString(16).padStart(64, '0');
    
    return `0x${rHex}${sHex}`;
}
```

---

## WebAuthn Authentication Data

### Authenticator Data Structure

Every WebAuthn assertion includes **authenticatorData** containing:

```typescript
/**
 * Authenticator Data structure (variable length):
 * 
 * | Bytes | Field                    | Description                           |
 * |-------|--------------------------|---------------------------------------|
 * | 32    | rpIdHash                 | SHA-256 hash of relying party ID      |
 * | 1     | flags                    | Bit flags (UP, UV, AT, ED)            |
 * | 4     | signCount                | 32-bit big-endian signature counter   |
 * | var   | attestedCredentialData   | (if AT flag set) credential details   |
 * | var   | extensions               | (if ED flag set) extension data       |
 */

interface AuthenticatorData {
    rpIdHash: Uint8Array;      // 32 bytes
    flags: {
        userPresent: boolean;   // UP: User was present
        userVerified: boolean;  // UV: User was verified (biometric/PIN)
        attestedCredentialData: boolean;  // AT: Contains credential data
        extensionData: boolean; // ED: Contains extension data
    };
    signCount: number;
}

export function parseAuthenticatorData(authData: Uint8Array): AuthenticatorData {
    const rpIdHash = authData.slice(0, 32);
    const flags = authData[32];
    const signCount = new DataView(authData.buffer, 33, 4).getUint32(0, false);
    
    return {
        rpIdHash,
        flags: {
            userPresent: (flags & 0x01) !== 0,
            userVerified: (flags & 0x04) !== 0,
            attestedCredentialData: (flags & 0x40) !== 0,
            extensionData: (flags & 0x80) !== 0,
        },
        signCount,
    };
}
```

### Client Data JSON

WebAuthn includes a **clientDataJSON** structure that binds the signature to the request context:

```typescript
interface ClientDataJSON {
    type: 'webauthn.get' | 'webauthn.create';
    challenge: string;        // Base64URL encoded challenge
    origin: string;           // e.g., "https://app.spritz.chat"
    crossOrigin?: boolean;
}

// Example clientDataJSON
const clientData: ClientDataJSON = {
    type: 'webauthn.get',
    challenge: 'dGVzdC1jaGFsbGVuZ2U',  // Base64URL of challenge bytes
    origin: 'https://app.spritz.chat',
};
```

### Signature Verification Hash

The WebAuthn signature is computed over:

```
signedData = authenticatorData || SHA-256(clientDataJSON)
signature = ECDSA_Sign(privateKey, SHA-256(signedData))
```

```typescript
/**
 * Reconstruct the message that was signed by the authenticator
 */
export function buildSignedMessage(
    authenticatorData: Uint8Array,
    clientDataJSON: Uint8Array
): Uint8Array {
    // Hash the clientDataJSON
    const clientDataHash = sha256(clientDataJSON);
    
    // Concatenate: authenticatorData || clientDataHash
    const signedData = new Uint8Array(authenticatorData.length + 32);
    signedData.set(authenticatorData, 0);
    signedData.set(clientDataHash, authenticatorData.length);
    
    return signedData;
}

/**
 * The actual message hash that ECDSA signs
 */
export function getSignatureMessageHash(
    authenticatorData: Uint8Array,
    clientDataJSON: Uint8Array
): Uint8Array {
    const signedData = buildSignedMessage(authenticatorData, clientDataJSON);
    return sha256(signedData);
}
```

---

## Safe WebAuthn Integration

### Contract Architecture

Safe uses a modular architecture for WebAuthn signature verification:

```
┌─────────────────────────────────────────────────────────────┐
│                    Safe WebAuthn Stack                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Safe Proxy v1.4.1                       │    │
│  │  Address: User's Safe smart account                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │       SafeWebAuthnSharedSigner                       │    │
│  │  Address: 0x94a4F6affBd8975951142c3999aEAB7ecee555c2│    │
│  │                                                      │    │
│  │  - Validates WebAuthn signature format               │    │
│  │  - Extracts authenticatorData and clientDataJSON    │    │
│  │  - Delegates P-256 verification to verifier         │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              P256Verifier                            │    │
│  │  Address: 0xA86e0054C51E4894D88762a017ECc5E5235f5DBA│    │
│  │                                                      │    │
│  │  - Pure P-256 ECDSA signature verification          │    │
│  │  - Uses precompiled contract (EIP-7212) if available│    │
│  │  - Falls back to Solidity implementation            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Contract Addresses

These contracts are deployed at the same addresses across all supported chains:

```typescript
export const SAFE_WEBAUTHN_CONTRACTS = {
    // Shared signer that processes WebAuthn assertions
    safeWebAuthnSharedSignerAddress: '0x94a4F6affBd8975951142c3999aEAB7ecee555c2' as const,
    
    // P-256 signature verifier
    safeP256VerifierAddress: '0xA86e0054C51E4894D88762a017ECc5E5235f5DBA' as const,
} as const;
```

### WebAuthn Signature Encoding for Safe

Safe requires a specific encoding for WebAuthn signatures:

```typescript
import { encodeAbiParameters } from 'viem';

/**
 * Encode WebAuthn signature for Safe contract consumption
 * 
 * The Safe WebAuthn module expects:
 * - authenticatorData: Raw bytes from WebAuthn assertion
 * - clientDataJSON: UTF-8 string (not the raw bytes)
 * - challengeIndex: Position of challenge in clientDataJSON
 * - typeIndex: Position of "type" field in clientDataJSON
 * - r: Signature R value (32 bytes)
 * - s: Signature S value (32 bytes, low-S normalized)
 */
export function encodeWebAuthnSignature(
    authenticatorData: Uint8Array,
    clientDataJSON: string,
    signature: ECDSASignature
): `0x${string}` {
    // Normalize signature to low-S
    const normalizedSig = normalizeSignature(signature);
    
    // Find challenge position in clientDataJSON
    // Challenge appears as: "challenge":"<base64url>"
    const challengeIndex = clientDataJSON.indexOf('"challenge"');
    const challengeValueStart = clientDataJSON.indexOf(':', challengeIndex) + 2; // Skip ":"
    
    // Find type position
    const typeIndex = clientDataJSON.indexOf('"type"');
    const typeValueStart = clientDataJSON.indexOf(':', typeIndex) + 2;
    
    return encodeAbiParameters(
        [
            { name: 'authenticatorData', type: 'bytes' },
            { name: 'clientDataJSON', type: 'string' },
            { name: 'challengeIndex', type: 'uint256' },
            { name: 'typeIndex', type: 'uint256' },
            { name: 'r', type: 'uint256' },
            { name: 's', type: 'uint256' },
        ],
        [
            `0x${Buffer.from(authenticatorData).toString('hex')}`,
            clientDataJSON,
            BigInt(challengeValueStart),
            BigInt(typeValueStart),
            normalizedSig.r,
            normalizedSig.s,
        ]
    );
}
```

### Full WebAuthn Signing Flow

```typescript
import { toWebAuthnAccount } from 'viem/account-abstraction';

/**
 * Complete flow for signing a Safe transaction with WebAuthn
 */
export async function signSafeTransactionWithPasskey(
    safeTxHash: `0x${string}`,
    credential: {
        id: string;
        publicKey: { x: `0x${string}`; y: `0x${string}` };
    }
): Promise<`0x${string}`> {
    // 1. Create WebAuthn account from credential
    const xHex = credential.publicKey.x.replace(/^0x/i, '').padStart(64, '0');
    const yHex = credential.publicKey.y.replace(/^0x/i, '').padStart(64, '0');
    const formattedPublicKey = `0x${xHex}${yHex}` as `0x${string}`;
    
    const webAuthnAccount = toWebAuthnAccount({
        credential: {
            id: credential.id,
            publicKey: formattedPublicKey,
        },
        rpId: getRpId(),
    });
    
    // 2. The safeTxHash becomes the WebAuthn challenge
    // Convert to ArrayBuffer for WebAuthn API
    const challenge = hexToArrayBuffer(safeTxHash);
    
    // 3. Request WebAuthn assertion
    const assertion = await navigator.credentials.get({
        publicKey: {
            challenge,
            rpId: getRpId(),
            timeout: 120000,
            userVerification: 'preferred',
            allowCredentials: [{
                id: base64urlToArrayBuffer(credential.id),
                type: 'public-key',
                transports: ['internal', 'hybrid'],
            }],
        },
    }) as PublicKeyCredential;
    
    const response = assertion.response as AuthenticatorAssertionResponse;
    
    // 4. Parse the DER-encoded signature
    const derSignature = new Uint8Array(response.signature);
    const { r, s } = parseDERSignature(derSignature);
    
    // 5. Get authenticatorData and clientDataJSON
    const authenticatorData = new Uint8Array(response.authenticatorData);
    const clientDataJSON = new TextDecoder().decode(response.clientDataJSON);
    
    // 6. Encode for Safe contract
    const encodedSignature = encodeWebAuthnSignature(
        authenticatorData,
        clientDataJSON,
        { r, s }
    );
    
    return encodedSignature;
}
```

---

## User Operation Signing

### ERC-4337 UserOp Structure

For account abstraction, transactions are packaged as User Operations:

```typescript
interface PackedUserOperation {
    sender: Address;           // Safe address
    nonce: bigint;             // EntryPoint nonce
    initCode: Hex;             // Factory data for deployment (empty if deployed)
    callData: Hex;             // Encoded Safe transaction
    accountGasLimits: Hex;     // Packed verification + call gas limits
    preVerificationGas: bigint;
    gasFees: Hex;              // Packed maxFeePerGas + maxPriorityFeePerGas
    paymasterAndData: Hex;     // Paymaster address + data
    signature: Hex;            // WebAuthn signature
}
```

### UserOp Hash Calculation

The signature covers a hash of the UserOp:

```typescript
import { keccak256, encodeAbiParameters, encodePacked } from 'viem';

/**
 * Calculate the hash that must be signed for a UserOperation
 */
export function getUserOpHash(
    userOp: PackedUserOperation,
    entryPointAddress: Address,
    chainId: bigint
): `0x${string}` {
    // Pack the UserOp fields (excluding signature)
    const packedUserOp = encodeAbiParameters(
        [
            { type: 'address' },   // sender
            { type: 'uint256' },   // nonce
            { type: 'bytes32' },   // keccak256(initCode)
            { type: 'bytes32' },   // keccak256(callData)
            { type: 'bytes32' },   // accountGasLimits
            { type: 'uint256' },   // preVerificationGas
            { type: 'bytes32' },   // gasFees
            { type: 'bytes32' },   // keccak256(paymasterAndData)
        ],
        [
            userOp.sender,
            userOp.nonce,
            keccak256(userOp.initCode),
            keccak256(userOp.callData),
            userOp.accountGasLimits,
            userOp.preVerificationGas,
            userOp.gasFees,
            keccak256(userOp.paymasterAndData),
        ]
    );
    
    const userOpHash = keccak256(packedUserOp);
    
    // Final hash includes EntryPoint address and chainId
    return keccak256(
        encodeAbiParameters(
            [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
            [userOpHash, entryPointAddress, chainId]
        )
    );
}
```

### Signing UserOps with WebAuthn

```typescript
import { createSmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { toWebAuthnAccount } from 'viem/account-abstraction';

/**
 * Create a Smart Account Client that signs with WebAuthn
 */
export async function createWebAuthnSmartAccountClient(
    credential: PasskeyCredential,
    chainId: number
): Promise<SmartAccountClient> {
    const publicClient = getPublicClient(chainId);
    const pimlicoClient = getPimlicoClient(chainId);
    const chain = getChain(chainId);
    
    // Format P-256 public key (64 bytes: x || y)
    const xHex = credential.publicKey.x.replace(/^0x/i, '').padStart(64, '0');
    const yHex = credential.publicKey.y.replace(/^0x/i, '').padStart(64, '0');
    const formattedPublicKey = `0x${xHex}${yHex}` as Hex;
    
    // Create WebAuthn account for viem
    const webAuthnAccount = toWebAuthnAccount({
        credential: {
            id: credential.credentialId,
            publicKey: formattedPublicKey,
        },
        rpId: getRpId(),
    });
    
    // Create Safe account with WebAuthn owner
    const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [webAuthnAccount],
        version: '1.4.1',
        entryPoint: {
            address: entryPoint07Address,
            version: '0.7',
        },
        saltNonce: BigInt(0),
        // WebAuthn verification contracts
        safeWebAuthnSharedSignerAddress: SAFE_WEBAUTHN_CONTRACTS.safeWebAuthnSharedSignerAddress,
        safeP256VerifierAddress: SAFE_WEBAUTHN_CONTRACTS.safeP256VerifierAddress,
    });
    
    // Create client with bundler and paymaster
    return createSmartAccountClient({
        account: safeAccount,
        chain,
        bundlerTransport: http(getPimlicoBundlerUrl(chainId)),
        userOperation: {
            estimateFeesPerGas: async () => {
                const prices = await pimlicoClient.getUserOperationGasPrice();
                return prices.fast;
            },
        },
        paymaster: pimlicoClient,
        paymasterContext: getPaymasterContext(chainId),
    });
}
```

---

## Gas Limits for WebAuthn

### Why Explicit Gas Limits?

WebAuthn signatures require P-256 verification on-chain, which is computationally expensive. Gas estimation often fails or underestimates, so explicit limits are required:

```typescript
/**
 * Gas limits optimized for WebAuthn transactions
 * 
 * These values account for:
 * - Safe deployment (if counterfactual)
 * - P-256 signature verification (~100k gas)
 * - Safe execution logic
 * - Paymaster verification
 */
export const WEBAUTHN_GAS_LIMITS = {
    // Verification includes Safe deployment + P-256 verification
    verificationGasLimit: BigInt(800_000),
    
    // Actual transaction execution
    callGasLimit: BigInt(200_000),
    
    // Bundler overhead
    preVerificationGas: BigInt(100_000),
    
    // Paymaster signature verification
    paymasterVerificationGasLimit: BigInt(150_000),
    
    // Paymaster post-operation (refund logic)
    paymasterPostOpGasLimit: BigInt(50_000),
} as const;
```

### Applying Gas Limits

```typescript
/**
 * Send a transaction with WebAuthn, applying explicit gas limits
 */
export async function sendWebAuthnTransaction(
    client: SmartAccountClient,
    calls: Array<{ to: Address; value: bigint; data: Hex }>
): Promise<Hex> {
    return client.sendTransaction({
        calls,
        // Apply WebAuthn-specific gas limits
        verificationGasLimit: WEBAUTHN_GAS_LIMITS.verificationGasLimit,
        callGasLimit: WEBAUTHN_GAS_LIMITS.callGasLimit,
        preVerificationGas: WEBAUTHN_GAS_LIMITS.preVerificationGas,
        paymasterVerificationGasLimit: WEBAUTHN_GAS_LIMITS.paymasterVerificationGasLimit,
        paymasterPostOpGasLimit: WEBAUTHN_GAS_LIMITS.paymasterPostOpGasLimit,
    });
}
```

---

## Relying Party (rpId) Configuration

### rpId Rules

The rpId determines which origins can use a passkey:

```typescript
/**
 * rpId configuration for Spritz
 * 
 * Rules:
 * - rpId must be a valid domain (no scheme, no port)
 * - Credential can be used on rpId and any subdomain
 * - Cannot be changed after credential creation
 */
export function getRpId(): string {
    if (typeof window === 'undefined') {
        return 'spritz.chat';
    }
    
    const hostname = window.location.hostname;
    
    // Production: use root domain for cross-subdomain support
    if (hostname.includes('spritz.chat')) {
        return 'spritz.chat';  // Works on app.spritz.chat, spritz.chat, etc.
    }
    
    // Local development
    if (hostname === 'localhost') {
        return 'localhost';
    }
    
    // Preview deployments (Vercel)
    return hostname;
}
```

### Cross-Subdomain Authentication

Passkeys registered with rpId `spritz.chat` work on:
- `https://spritz.chat`
- `https://app.spritz.chat`
- `https://staging.spritz.chat`
- Any other `*.spritz.chat` subdomain

---

## Credential Storage

### Database Schema

Passkey credentials are stored securely:

```sql
CREATE TABLE shout_passkey_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User association
    user_address TEXT NOT NULL REFERENCES shout_user_settings(wallet_address),
    
    -- WebAuthn credential identifiers
    credential_id TEXT NOT NULL UNIQUE,      -- Base64URL encoded
    credential_id_hash TEXT NOT NULL,        -- SHA-256 for indexing
    
    -- P-256 public key (required for Safe address calculation)
    public_key_x TEXT NOT NULL,              -- Hex encoded (0x...)
    public_key_y TEXT NOT NULL,              -- Hex encoded (0x...)
    
    -- Metadata
    device_name TEXT,                         -- User-provided name
    authenticator_type TEXT,                  -- 'platform' | 'cross-platform'
    transports TEXT[],                        -- ['internal', 'hybrid', 'usb', etc.]
    
    -- Counter for replay protection
    sign_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Backup status (for recovery)
    backed_up BOOLEAN DEFAULT FALSE,
    backup_eligible BOOLEAN DEFAULT TRUE
);

-- Index for fast lookup
CREATE INDEX idx_passkey_user ON shout_passkey_credentials(user_address);
CREATE INDEX idx_passkey_credential_hash ON shout_passkey_credentials(credential_id_hash);
```

### Client-Side Storage

For instant access during transactions:

```typescript
interface StoredCredential {
    credentialId: string;
    publicKey: {
        x: `0x${string}`;
        y: `0x${string}`;
    };
    deviceName?: string;
    createdAt: string;
}

// Store in localStorage (encrypted in production)
const STORAGE_KEY = 'spritz_passkey_credential';

export function storeCredential(credential: StoredCredential): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credential));
}

export function getStoredCredential(): StoredCredential | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
}
```

---

## Error Handling

### WebAuthn Error Types

```typescript
/**
 * Common WebAuthn errors and their causes
 */
export enum WebAuthnErrorType {
    // User cancelled the operation
    NotAllowedError = 'NotAllowedError',
    
    // Credential not found or rpId mismatch
    InvalidStateError = 'InvalidStateError',
    
    // Security policy blocked the operation
    SecurityError = 'SecurityError',
    
    // Authenticator doesn't support required features
    NotSupportedError = 'NotSupportedError',
    
    // Operation timed out
    TimeoutError = 'AbortError',
}

export function handleWebAuthnError(error: unknown): string {
    if (error instanceof DOMException) {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Authentication was cancelled. Please try again.';
            case 'InvalidStateError':
                return 'Passkey not found. You may need to register a new one.';
            case 'SecurityError':
                return 'Security policy prevented authentication. Check your browser settings.';
            case 'NotSupportedError':
                return 'This device does not support the required authentication method.';
            case 'AbortError':
                return 'Authentication timed out. Please try again.';
            default:
                return `Authentication error: ${error.message}`;
        }
    }
    
    return 'An unexpected error occurred during authentication.';
}
```

### Recovery from Errors

```typescript
/**
 * Retry logic for transient WebAuthn failures
 */
export async function signWithRetry(
    safeTxHash: `0x${string}`,
    credential: StoredCredential,
    maxAttempts = 3
): Promise<`0x${string}`> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await signSafeTransactionWithPasskey(safeTxHash, credential);
        } catch (error) {
            lastError = error;
            
            // Don't retry user cancellation
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                throw error;
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    
    throw lastError;
}
```

---

## Security Considerations

### Phishing Resistance

WebAuthn's rpId binding provides strong phishing protection:

| Attack Vector | Protection |
|--------------|------------|
| **Fake domain** | rpId mismatch - credential won't work |
| **Subdomain takeover** | Credential still bound to root rpId |
| **MitM proxy** | TLS required; challenge bound to origin |

### Credential Backup

For account recovery, Spritz supports:

1. **Recovery signer** - Add an EOA as backup owner on the Safe
2. **Multi-device registration** - Register passkeys on multiple devices
3. **Cloud sync** - Platform passkeys (iCloud Keychain, Google Password Manager)

### Sign Count Verification

Detect cloned credentials by tracking the signature counter:

```typescript
export async function verifySignCount(
    credentialId: string,
    newSignCount: number
): Promise<boolean> {
    const stored = await getStoredSignCount(credentialId);
    
    // Sign count should always increase
    if (newSignCount <= stored) {
        // Possible credential cloning detected
        console.warn('Sign count did not increase - possible credential clone');
        return false;
    }
    
    await updateStoredSignCount(credentialId, newSignCount);
    return true;
}
```

---

## Related Documentation

- [Spritz Wallets](/docs/developers/smart-wallets) - Safe Smart Account implementation
- [Social Vaults](/docs/developers/vaults) - Multi-sig vaults with passkey support
- [Authentication](/docs/developers/authentication) - Complete auth flow documentation

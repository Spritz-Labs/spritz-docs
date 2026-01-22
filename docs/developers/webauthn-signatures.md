# WebAuthn & Passkey Signatures

Complete technical reference for WebAuthn signature generation, verification, and blockchain integration in Spritz.

:::tip Quick Links
- [Smart Wallets](/docs/developers/smart-wallets) - Safe integration with WebAuthn
- [Authentication](/docs/developers/authentication) - Passkey registration and login
- [Vaults](/docs/developers/vaults) - Multi-sig with passkey signatures
:::

## Overview

Spritz uses **WebAuthn passkeys** with **P-256 (secp256r1)** elliptic curve cryptography for:

1. **Passwordless Authentication** - Sign in with biometrics (Face ID, Touch ID, Windows Hello)
2. **Transaction Signing** - Sign blockchain transactions directly with your passkey
3. **Multi-Sig Participation** - Sign vault proposals as a Smart Wallet owner

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WebAuthn in the Spritz Stack                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────────────────┐│
│  │   WebAuthn    │    │    Safe       │    │     ERC-4337              ││
│  │   Passkey     │───►│  Smart Wallet │───►│     EntryPoint            ││
│  │   (P-256)     │    │   (Account)   │    │   (Execution)             ││
│  └───────────────┘    └───────────────┘    └───────────────────────────┘│
│         │                    │                        │                  │
│         │                    │                        │                  │
│         ▼                    ▼                        ▼                  │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────────────────┐│
│  │ P-256 ECDSA   │    │ EIP-1271      │    │   Pimlico Bundler         ││
│  │ Signature     │    │ Verification  │    │   + Paymaster             ││
│  └───────────────┘    └───────────────┘    └───────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## P-256 Elliptic Curve

WebAuthn mandates support for the **P-256** curve (NIST standardized), which differs from Ethereum's native **secp256k1**:

| Property | P-256 (WebAuthn) | secp256k1 (Ethereum) |
|----------|------------------|----------------------|
| **Standardization** | NIST P-256 | Koblitz curve |
| **Browser Support** | Native WebAuthn | Requires library |
| **Hardware Support** | Secure Enclave, TPM, Yubikey | Software only |
| **EVM Verification** | RIP-7212 precompile or contract | Native `ecrecover` |
| **Security Level** | 128-bit | 128-bit |
| **Signature Format** | DER-encoded (r, s) | Compact (r, s, v) |

### Curve Parameters

```typescript
// P-256 (secp256r1/prime256v1) curve parameters
const P256 = {
    // Prime field
    p: 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff,
    
    // Curve coefficients (y² = x³ + ax + b)
    a: 0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc,
    b: 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b,
    
    // Generator point
    Gx: 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296,
    Gy: 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5,
    
    // Order of the curve
    n: 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551,
};
```

---

## Passkey Key Structure

### Public Key Format

```typescript
interface P256PublicKey {
    // X coordinate (32 bytes)
    x: `0x${string}`;
    
    // Y coordinate (32 bytes)  
    y: `0x${string}`;
}

// Uncompressed format (65 bytes): 0x04 || x || y
// Used by noble-curves and most libraries
const uncompressed = new Uint8Array(65);
uncompressed[0] = 0x04;  // Uncompressed point indicator
uncompressed.set(hexToBytes(publicKey.x), 1);   // x: bytes 1-32
uncompressed.set(hexToBytes(publicKey.y), 33);  // y: bytes 33-64

// Concatenated format (64 bytes): x || y
// Used by viem/permissionless
const concatenated = `0x${publicKey.x.slice(2)}${publicKey.y.slice(2)}`;
```

### COSE Key Format

WebAuthn attestation returns the public key in COSE (CBOR Object Signing and Encryption) format:

```typescript
// COSE Key Map for P-256
// {
//   1: 2,      // kty (key type): EC2
//   3: -7,     // alg (algorithm): ES256
//   -1: 1,     // crv (curve): P-256
//   -2: x,     // x-coordinate (32 bytes)
//   -3: y      // y-coordinate (32 bytes)
// }

import { decodeFirst } from 'cbor';

function parseCOSEKey(coseKeyBytes: Uint8Array): P256PublicKey {
    const decoded = decodeFirst(coseKeyBytes);
    
    // Verify key type and algorithm
    if (decoded.get(1) !== 2) throw new Error('Not an EC key');
    if (decoded.get(3) !== -7) throw new Error('Not ES256 algorithm');
    if (decoded.get(-1) !== 1) throw new Error('Not P-256 curve');
    
    const x = decoded.get(-2) as Uint8Array;
    const y = decoded.get(-3) as Uint8Array;
    
    return {
        x: `0x${Buffer.from(x).toString('hex')}`,
        y: `0x${Buffer.from(y).toString('hex')}`,
    };
}
```

---

## Signature Generation

### WebAuthn Assertion Flow

When signing with a passkey, the browser's WebAuthn API:

1. Prompts for user verification (biometric/PIN)
2. Signs the challenge with the private key
3. Returns authenticatorData, clientDataJSON, and signature

```typescript
/**
 * Request a WebAuthn signature for a given challenge
 */
async function signWithPasskey(
    credentialId: string,
    challenge: Uint8Array,
    rpId: string = 'spritz.chat'
): Promise<WebAuthnSignature> {
    const credential = await navigator.credentials.get({
        publicKey: {
            // The data to sign (e.g., UserOp hash, Safe tx hash)
            challenge,
            
            // Relying party ID (must match registration)
            rpId,
            
            // Timeout (2 minutes)
            timeout: 120000,
            
            // Require user verification
            userVerification: 'preferred',
            
            // Specify which credential to use
            allowCredentials: [{
                id: base64urlDecode(credentialId),
                type: 'public-key',
                transports: ['internal', 'hybrid'],
            }],
        },
    });

    const response = credential.response as AuthenticatorAssertionResponse;
    
    return {
        authenticatorData: new Uint8Array(response.authenticatorData),
        clientDataJSON: new TextDecoder().decode(response.clientDataJSON),
        signature: new Uint8Array(response.signature),
    };
}
```

### What Gets Signed

WebAuthn signs a **hash of hashes**:

```
Message = SHA256(authenticatorData || SHA256(clientDataJSON))
```

```typescript
import { sha256 } from '@noble/hashes/sha256';

function computeSignedMessage(
    authenticatorData: Uint8Array,
    clientDataJSON: string
): Uint8Array {
    // Hash the clientDataJSON
    const clientDataHash = sha256(
        new TextEncoder().encode(clientDataJSON)
    );
    
    // Concatenate and hash again
    const message = new Uint8Array([
        ...authenticatorData,
        ...clientDataHash,
    ]);
    
    return sha256(message);
}
```

### Client Data JSON Structure

```json
{
    "type": "webauthn.get",
    "challenge": "SGVsbG8gV29ybGQh...",
    "origin": "https://app.spritz.chat",
    "crossOrigin": false
}
```

| Field | Description |
|-------|-------------|
| `type` | Always "webauthn.get" for assertions |
| `challenge` | Base64url-encoded challenge (your data to sign) |
| `origin` | The website origin (verified by authenticator) |
| `crossOrigin` | Whether request is cross-origin |

---

## DER Signature Format

WebAuthn returns signatures in **DER (Distinguished Encoding Rules)** format, not raw (r, s) bytes:

### DER Structure

```
SEQUENCE {
    INTEGER r,  // May have leading 0x00 if high bit is set
    INTEGER s   // May have leading 0x00 if high bit is set
}

Bytes: 30 [len] 02 [r-len] [r-bytes] 02 [s-len] [s-bytes]
```

### Example DER Signature

```
30 45                              // SEQUENCE, 69 bytes
   02 21                           // INTEGER, 33 bytes
      00                           // Leading zero (high bit was set)
      8b 4c 2e 3f ... (32 bytes)  // r value
   02 20                           // INTEGER, 32 bytes
      1a 2b 3c 4d ... (32 bytes)  // s value
```

### Parsing DER to Raw (r, s)

```typescript
/**
 * Parse DER-encoded ECDSA signature to raw (r, s) components
 */
function parseDERSignature(der: Uint8Array): {
    r: Uint8Array;  // 32 bytes, big-endian
    s: Uint8Array;  // 32 bytes, big-endian
} {
    let offset = 0;

    // Verify SEQUENCE tag
    if (der[offset++] !== 0x30) {
        throw new Error('Invalid DER: expected SEQUENCE');
    }

    // Parse total length (may be short or long form)
    let totalLen = der[offset++];
    if (totalLen & 0x80) {
        const lenBytes = totalLen & 0x7f;
        totalLen = 0;
        for (let i = 0; i < lenBytes; i++) {
            totalLen = (totalLen << 8) | der[offset++];
        }
    }

    // Parse r
    if (der[offset++] !== 0x02) {
        throw new Error('Invalid DER: expected INTEGER for r');
    }
    let rLen = der[offset++];
    let r = der.slice(offset, offset + rLen);
    offset += rLen;

    // Parse s
    if (der[offset++] !== 0x02) {
        throw new Error('Invalid DER: expected INTEGER for s');
    }
    let sLen = der[offset++];
    let s = der.slice(offset, offset + sLen);

    // Normalize: remove leading zeros, pad to 32 bytes
    r = normalizeScalar(r);
    s = normalizeScalar(s);

    return { r, s };
}

function normalizeScalar(bytes: Uint8Array): Uint8Array {
    // Remove leading zeros
    let start = 0;
    while (start < bytes.length - 1 && bytes[start] === 0) {
        start++;
    }
    bytes = bytes.slice(start);

    // Pad to 32 bytes
    if (bytes.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(bytes, 32 - bytes.length);
        return padded;
    }
    
    return bytes.slice(0, 32);
}
```

---

## Signature Verification

### Local Verification (JavaScript)

Verify signatures before submitting to avoid wasted gas:

```typescript
import { p256 } from '@noble/curves/p256';
import { sha256 } from '@noble/hashes/sha256';

function verifyWebAuthnSignature(
    publicKey: P256PublicKey,
    authenticatorData: Uint8Array,
    clientDataJSON: string,
    signature: Uint8Array
): boolean {
    // 1. Compute the message that was signed
    const messageHash = computeSignedMessage(authenticatorData, clientDataJSON);

    // 2. Parse DER signature
    const { r, s } = parseDERSignature(signature);

    // 3. Format public key (uncompressed)
    const pubKeyBytes = new Uint8Array(65);
    pubKeyBytes[0] = 0x04;
    pubKeyBytes.set(hexToBytes(publicKey.x), 1);
    pubKeyBytes.set(hexToBytes(publicKey.y), 33);

    // 4. Verify using noble-curves
    try {
        return p256.verify(
            new Uint8Array([...r, ...s]),  // 64-byte signature
            messageHash,                     // 32-byte message hash
            pubKeyBytes                      // 65-byte public key
        );
    } catch {
        return false;
    }
}
```

### On-Chain Verification

#### RIP-7212 Precompile

Chains supporting [RIP-7212](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md) have a native P-256 verifier at `0x0000000000000000000000000000000000000100`:

```solidity
// RIP-7212 P256Verify precompile
address constant P256_VERIFIER = address(0x100);

function verifyP256(
    bytes32 messageHash,
    bytes32 r,
    bytes32 s,
    bytes32 x,
    bytes32 y
) internal view returns (bool) {
    // Call precompile
    (bool success, bytes memory result) = P256_VERIFIER.staticcall(
        abi.encode(messageHash, r, s, x, y)
    );
    
    // Returns 1 for valid, 0 for invalid
    return success && result.length == 32 && 
           abi.decode(result, (uint256)) == 1;
}
```

| Chain | RIP-7212 | Gas Cost |
|-------|----------|----------|
| Base | ✅ | ~3,450 |
| Arbitrum | ✅ | ~3,450 |
| Optimism | ✅ | ~3,450 |
| Polygon | ✅ | ~3,450 |
| Ethereum | ❌ | N/A |

#### Safe P256 Verifier Contract

For chains without RIP-7212, Safe deploys a Solidity-based verifier:

```solidity
// SafeP256Verifier at 0xA86e0054C51E4894D88762a017ECc5E5235f5DBA
interface ISafeP256Verifier {
    function verifySignature(
        bytes32 messageHash,
        bytes calldata signature,  // 64 bytes: r || s
        bytes calldata publicKey   // 64 bytes: x || y
    ) external view returns (bool);
}
```

---

## Safe Integration

### Encoding WebAuthn Signature for Safe

Safe's `execTransaction` expects a specific signature format for WebAuthn:

```typescript
import { encodeAbiParameters, parseAbiParameters } from 'viem';

/**
 * Encode WebAuthn signature for Safe's checkNSignatures
 */
function encodeWebAuthnSignatureForSafe(
    authenticatorData: Uint8Array,
    clientDataJSON: string,
    r: Uint8Array,
    s: Uint8Array
): Hex {
    // Extract clientDataFields (everything after challenge in JSON)
    // Safe reconstructs the full clientDataJSON for verification
    const clientDataFields = extractClientDataFields(clientDataJSON);

    return encodeAbiParameters(
        parseAbiParameters([
            'bytes authenticatorData',
            'string clientDataFields', 
            'uint256[2] signature'
        ]),
        [
            authenticatorData,
            clientDataFields,
            [
                BigInt('0x' + Buffer.from(r).toString('hex')),
                BigInt('0x' + Buffer.from(s).toString('hex')),
            ],
        ]
    );
}

function extractClientDataFields(clientDataJSON: string): string {
    // Find where challenge ends
    const challengeEndIndex = clientDataJSON.indexOf(
        '"', 
        clientDataJSON.indexOf('"challenge":"') + 13
    );
    // Return everything after challenge (e.g., ',"origin":"https://...")
    return clientDataJSON.slice(challengeEndIndex + 1, -1);
}
```

### SafeWebAuthnSharedSigner

Safe's WebAuthn signer module handles P-256 signature verification:

```solidity
// Deployed at 0x94a4F6affBd8975951142c3999aEAB7ecee555c2

interface ISafeWebAuthnSharedSigner {
    // Configuration per Safe
    struct SignerConfiguration {
        uint256 x;     // Public key X coordinate
        uint256 y;     // Public key Y coordinate
        address verifier;  // P256 verifier to use
    }

    // Verify a WebAuthn signature
    function isValidSignature(
        bytes32 _hash,
        bytes calldata _signature
    ) external view returns (bytes4);
}
```

### ERC-4337 UserOperation Signing

For account abstraction transactions, the passkey signs the UserOperation hash:

```typescript
async function signUserOpWithPasskey(
    userOp: UserOperation,
    entryPoint: Address,
    chainId: number,
    credential: PasskeyCredential
): Promise<Hex> {
    // 1. Compute UserOp hash
    const userOpHash = computeUserOpHash(userOp, entryPoint, chainId);

    // 2. Sign with passkey
    const webAuthnSig = await signWithPasskey(
        credential.credentialId,
        hexToBytes(userOpHash)
    );

    // 3. Encode for Safe
    const { r, s } = parseDERSignature(webAuthnSig.signature);
    
    return encodeWebAuthnSignatureForSafe(
        webAuthnSig.authenticatorData,
        webAuthnSig.clientDataJSON,
        r,
        s
    );
}
```

---

## Security Considerations

### Phishing Protection

WebAuthn binds credentials to the **origin** (website) where they were created:

```typescript
// Credential created at spritz.chat can only be used on:
// ✅ app.spritz.chat
// ✅ beta.spritz.chat
// ✅ spritz.chat

// Cannot be used on:
// ❌ spritz.io
// ❌ evil-spritz.com
// ❌ spritz.chat.phishing.com
```

### Replay Protection

| Protection | Mechanism |
|------------|-----------|
| **Challenge** | Server-generated random nonce, single-use |
| **Counter** | Authenticator increments on each use |
| **Origin** | Bound to specific domain |

### Key Storage Security

| Platform | Storage | Extraction |
|----------|---------|------------|
| **iOS** | Secure Enclave | Impossible |
| **Android** | TEE/StrongBox | Impossible |
| **macOS** | Secure Enclave | Impossible |
| **Windows** | TPM 2.0 | Impossible |
| **Security Keys** | Secure Element | Impossible |

The private key **never leaves the secure hardware** - not even the operating system can access it.

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `NotAllowedError` | User cancelled or timeout | Re-prompt user |
| `InvalidStateError` | Credential already exists | Use existing credential |
| `NotSupportedError` | P-256 not available | Check authenticator capabilities |
| `SecurityError` | Wrong rpId or origin | Verify domain configuration |

### Debugging Tips

```typescript
// Log authenticator data for debugging
function debugAuthenticatorData(authData: Uint8Array) {
    console.log('rpIdHash:', authData.slice(0, 32));
    console.log('flags:', authData[32].toString(2).padStart(8, '0'));
    console.log('  UP (user present):', !!(authData[32] & 0x01));
    console.log('  UV (user verified):', !!(authData[32] & 0x04));
    console.log('signCount:', new DataView(
        authData.buffer, 
        authData.byteOffset + 33, 
        4
    ).getUint32(0));
}
```

---

## Related Documentation

- [Smart Wallets](/docs/developers/smart-wallets) - Safe account integration
- [Authentication](/docs/developers/authentication) - Passkey registration flow
- [Vaults](/docs/developers/vaults) - Multi-sig with passkey signatures
- [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271) - Contract signature verification
- [RIP-7212](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md) - P-256 precompile

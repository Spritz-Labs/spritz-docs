---
title: Smart Wallets
description: Deep dive into Spritz smart wallets powered by Safe, Pimlico, and ERC-4337 account abstraction. Learn about passkey signing, gas sponsorship, and multi-chain deployment.
keywords:
    [
        smart wallets,
        Safe,
        ERC-4337,
        account abstraction,
        Pimlico,
        passkey,
        WebAuthn,
        gas sponsorship,
    ]
sidebar_label: Smart Wallets
sidebar_position: 3
---

# Smart Wallets

Spritz uses Safe smart wallets with ERC-4337 account abstraction, enabling passwordless authentication, gasless transactions, and social recovery.

## Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Identity                          │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │   Passkey   │   │   Wallet    │   │   Email     │          │
│   │  (WebAuthn) │   │   (EOA)     │   │ (Derived)   │          │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │
│          │                 │                 │                   │
│          └────────────────┬┴─────────────────┘                  │
│                           │                                      │
│                           ▼                                      │
│                  ┌─────────────────┐                            │
│                  │   Safe Smart    │                            │
│                  │     Wallet      │  ◄─── Counterfactual       │
│                  │   (Same addr    │       (Same address        │
│                  │    all chains)  │        on all EVM chains)  │
│                  └────────┬────────┘                            │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │  Base   │   │Arbitrum │   │Optimism │   ... 8 chains
        │  L2     │   │   L2    │   │   L2    │
        └─────────┘   └─────────┘   └─────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Safe** | Multi-sig smart contract wallet (we use 1/1 threshold) |
| **ERC-4337** | Account abstraction standard for smart wallets |
| **Pimlico** | Bundler and paymaster infrastructure |
| **WebAuthn** | Passkey-based signing using P256 curve |
| **Counterfactual** | Address is deterministic before deployment |

---

## Supported Chains

| Chain | ID | Sponsorship | Notes |
|-------|-----|-------------|-------|
| Base | 8453 | ✅ Free | Primary chain |
| Arbitrum | 42161 | ✅ Free | L2 |
| Optimism | 10 | ✅ Free | Has P256 precompile |
| Polygon | 137 | ✅ Free | L2 |
| BNB Chain | 56 | ✅ Free | L1 |
| Unichain | 130 | ✅ Free | L2 |
| Avalanche | 43114 | ✅ Free | L1 |
| Ethereum | 1 | 💰 USDC | User pays gas in USDC |

---

## Safe Address Calculation

Safe addresses are **deterministic** - calculated from the owner address and salt. This means:

- Same address on all EVM chains
- Address known before deployment
- Users can receive funds before deploying

### Code Example

```typescript
import { toSafeSmartAccount } from "permissionless/accounts";
import { entryPoint07Address } from "viem/account-abstraction";

async function getSafeAddress(config: { ownerAddress: Address; chainId: number }): Promise<Address> {
    const { ownerAddress, chainId } = config;
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

### Checking Deployment Status

```typescript
async function isSafeDeployed(address: Address, chainId: number): Promise<boolean> {
    const publicClient = getPublicClient(chainId);
    
    const code = await publicClient.getCode({ address });
    return code !== undefined && code !== "0x" && code.length > 2;
}
```

---

## Passkey Integration with Safe

Passkeys use P256 (secp256r1) keys, which Safe supports via the WebAuthn Shared Signer module.

### Safe WebAuthn Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Safe Wallet                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                     Owners Array                        │  │
│  │   ┌──────────────────────┐                             │  │
│  │   │  WebAuthn Signer     │ ◄─── Derived from passkey   │  │
│  │   │  (P256 public key)   │      public key coordinates │  │
│  │   └──────────────────────┘                             │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              SafeWebAuthnSharedSigner                   │  │
│  │              0x94a4F6affBd8975951142c3999aEAB7ecee555c2 │  │
│  │                                                         │  │
│  │  Verifies P256 signatures from WebAuthn credentials     │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   P256 Verifier                         │  │
│  │  FCL: 0x75cf11467937ce3f2f357ce24ffc3dbf8fd5c226       │  │
│  │  or precompile at 0x100 (Optimism)                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Extracting P256 Coordinates

When a passkey is registered, we extract the P256 coordinates for Safe:

```typescript
interface P256PublicKey {
    x: Hex; // 32 bytes
    y: Hex; // 32 bytes
}

function parseCosePublicKey(coseKeyBase64: string): P256PublicKey {
    const coseBytes = Buffer.from(coseKeyBase64, "base64");
    const parsed = parseCborMap(coseBytes);
    
    // COSE key format validation
    if (parsed.get(1) !== 2) throw new Error("Not EC2 key");
    if (parsed.get(3) !== -7) throw new Error("Not ES256");
    if (parsed.get(-1) !== 1) throw new Error("Not P-256");
    
    return {
        x: bytesToHex(new Uint8Array(parsed.get(-2))),
        y: bytesToHex(new Uint8Array(parsed.get(-3))),
    };
}
```

### Calculating WebAuthn Signer Address

```typescript
import { keccak256, encodePacked, concat, getAddress } from "viem";

const SAFE_WEBAUTHN_SIGNER_FACTORY = "0xF7488fFbe67327ac9f37D5F722d83Fc900852Fbf";
const SAFE_WEBAUTHN_SIGNER_SINGLETON = "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47";

function calculateWebAuthnSignerAddress(
    publicKey: P256PublicKey, 
    chainId: number = 8453
): Address {
    const verifierAddress = getP256VerifierAddress(chainId);
    
    // Salt = hash(x, y, verifier)
    const salt = keccak256(
        encodePacked(
            ["uint256", "uint256", "address"],
            [BigInt(publicKey.x), BigInt(publicKey.y), verifierAddress]
        )
    );
    
    // Proxy creation code
    const proxyCreationCode = concat([
        "0x3d602d80600a3d3981f3363d3d373d3d3d363d73",
        SAFE_WEBAUTHN_SIGNER_SINGLETON,
        "0x5af43d82803e903d91602b57fd5bf3",
    ]);
    
    const initCodeHash = keccak256(proxyCreationCode);
    
    // CREATE2 address
    const create2Input = concat([
        "0xff",
        SAFE_WEBAUTHN_SIGNER_FACTORY,
        salt,
        initCodeHash,
    ]);
    
    return getAddress(`0x${keccak256(create2Input).slice(-40)}`);
}
```

---

## Creating Smart Account Clients

### For EOA Wallets (MetaMask, etc.)

```typescript
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";

async function createSafeAccountClient(
    ownerAddress: Address,
    chainId: number,
    signMessage: (message: string) => Promise<`0x${string}`>,
    signTypedData: (data: unknown) => Promise<`0x${string}`>
): Promise<SmartAccountClient> {
    const publicClient = getPublicClient(chainId);
    const pimlicoClient = getPimlicoClient(chainId);

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
        }],
        version: "1.4.1",
        entryPoint: {
            address: entryPoint07Address,
            version: "0.7",
        },
        saltNonce: BigInt(0),
    });

    return createSmartAccountClient({
        account: safeAccount,
        chain: SAFE_SUPPORTED_CHAINS[chainId],
        bundlerTransport: http(getPimlicoBundlerUrl(chainId)),
        paymaster: pimlicoClient,
        paymasterContext: getPaymasterContext(chainId),
        userOperation: {
            estimateFeesPerGas: async () => {
                const prices = await pimlicoClient.getUserOperationGasPrice();
                return prices.fast;
            },
        },
    });
}
```

### For Passkeys (WebAuthn)

```typescript
import { toWebAuthnAccount } from "viem/account-abstraction";

async function createPasskeySafeAccountClient(
    passkeyCredential: PasskeyCredential,
    chainId: number
): Promise<SmartAccountClient> {
    const publicClient = getPublicClient(chainId);
    const pimlicoClient = getPimlicoClient(chainId);

    // Format public key for viem (concatenated x||y, 64 bytes)
    const xHex = passkeyCredential.publicKey.x.replace(/^0x/i, '').padStart(64, '0');
    const yHex = passkeyCredential.publicKey.y.replace(/^0x/i, '').padStart(64, '0');
    const formattedPublicKey = `0x${xHex}${yHex}` as Hex;

    // Create WebAuthn account
    const webAuthnAccount = toWebAuthnAccount({
        credential: {
            id: passkeyCredential.credentialId,
            publicKey: formattedPublicKey,
        },
        rpId: "spritz.chat",
        getFn: customCredentialGetFn, // Custom function to handle credential retrieval
    });

    // Create Safe with WebAuthn owner
    const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [webAuthnAccount],
        version: "1.4.1",
        entryPoint: {
            address: entryPoint07Address,
            version: "0.7",
        },
        saltNonce: BigInt(0),
        // Explicit WebAuthn addresses
        safeWebAuthnSharedSignerAddress: "0x94a4F6affBd8975951142c3999aEAB7ecee555c2",
        safeP256VerifierAddress: "0xA86e0054C51E4894D88762a017ECc5E5235f5DBA",
    });

    return createSmartAccountClient({
        account: safeAccount,
        chain: SAFE_SUPPORTED_CHAINS[chainId],
        bundlerTransport: http(getPimlicoBundlerUrl(chainId)),
        paymaster: pimlicoClient,
        paymasterContext: getPaymasterContext(chainId),
    });
}
```

---

## Gas Sponsorship

### Configuration by Chain

```typescript
type SponsorshipType = "sponsor" | "erc20" | "none";

const CHAIN_SPONSORSHIP_CONFIG: Record<number, { type: SponsorshipType }> = {
    1: { type: "erc20" },      // Mainnet: User pays in USDC
    8453: { type: "sponsor" },  // Base: Free
    42161: { type: "sponsor" }, // Arbitrum: Free
    10: { type: "sponsor" },    // Optimism: Free
    137: { type: "sponsor" },   // Polygon: Free
    56: { type: "sponsor" },    // BSC: Free
    130: { type: "sponsor" },   // Unichain: Free
    43114: { type: "sponsor" }, // Avalanche: Free
};
```

### Getting Paymaster Context

```typescript
function getPaymasterContext(chainId: number) {
    const config = CHAIN_SPONSORSHIP_CONFIG[chainId];
    const policyId = process.env.NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID;
    
    if (config.type === "sponsor" && policyId) {
        return { sponsorshipPolicyId: policyId };
    }
    
    if (config.type === "erc20") {
        const usdcAddress = USDC_ADDRESSES[chainId];
        if (usdcAddress) {
            return { token: usdcAddress };
        }
    }
    
    return undefined; // User pays in native token
}
```

### ERC-20 Paymaster (Mainnet)

On Ethereum mainnet, users pay gas in USDC:

```typescript
const PIMLICO_ERC20_PAYMASTER = "0x777777777777AeC03fd955926DbF81597e66834C";

async function checkPaymasterAllowance(
    safeAddress: Address,
    chainId: number
): Promise<{ hasApproval: boolean; allowance: bigint }> {
    const usdcAddress = USDC_ADDRESSES[chainId];
    const publicClient = getPublicClient(chainId);
    
    const allowance = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [safeAddress, PIMLICO_ERC20_PAYMASTER],
    });
    
    const minRequired = BigInt(2_000_000); // 2 USDC
    
    return {
        hasApproval: allowance >= minRequired,
        allowance,
    };
}
```

---

## Sending Transactions

### Basic ETH Transfer

```typescript
async function sendEthTransfer(
    client: SmartAccountClient,
    to: Address,
    amount: bigint
): Promise<`0x${string}`> {
    return client.sendTransaction({
        calls: [{
            to,
            value: amount,
            data: "0x",
        }],
    });
}
```

### ERC-20 Token Transfer

```typescript
async function sendTokenTransfer(
    client: SmartAccountClient,
    tokenAddress: Address,
    to: Address,
    amount: bigint
): Promise<`0x${string}`> {
    const data = encodeFunctionData({
        abi: [{
            name: "transfer",
            type: "function",
            inputs: [
                { name: "to", type: "address" },
                { name: "amount", type: "uint256" }
            ],
            outputs: [{ name: "", type: "bool" }]
        }],
        functionName: "transfer",
        args: [to, amount],
    });

    return client.sendTransaction({
        calls: [{
            to: tokenAddress,
            value: BigInt(0),
            data,
        }],
    });
}
```

### Batched Transactions

```typescript
async function batchedOperations(
    client: SmartAccountClient,
    operations: Array<{ to: Address; value: bigint; data: Hex }>
): Promise<`0x${string}`> {
    return client.sendTransaction({
        calls: operations,
    });
}
```

---

## Gas Estimation

### WebAuthn Gas Limits

WebAuthn signatures require higher gas limits due to P256 verification:

```typescript
const WEBAUTHN_GAS_LIMITS = {
    verificationGasLimit: BigInt(800000),   // Safe + WebAuthn verification
    callGasLimit: BigInt(200000),           // Transaction execution
    preVerificationGas: BigInt(100000),     // Pre-verification overhead
    paymasterVerificationGasLimit: BigInt(150000),
    paymasterPostOpGasLimit: BigInt(50000),
};
```

### Estimating Gas Costs

```typescript
async function estimateGas(
    chainId: number,
    params: SendTransactionParams
): Promise<{
    estimatedCostWei: bigint;
    estimatedCostEth: string;
}> {
    const pimlicoClient = getPimlicoClient(chainId);
    const gasPrice = await pimlicoClient.getUserOperationGasPrice();
    
    const totalGas = BigInt(250000); // Typical for ETH transfer
    const estimatedCostWei = totalGas * gasPrice.fast.maxFeePerGas;
    
    return {
        estimatedCostWei,
        estimatedCostEth: formatEther(estimatedCostWei),
    };
}
```

---

## Recovery Signers

Safe supports multiple owners, enabling recovery mechanisms:

### Adding a Recovery Signer

```typescript
async function addRecoverySigner(
    safeAddress: Address,
    recoveryAddress: Address,
    passkeyCredential: PasskeyCredential,
    chainId: number
): Promise<string> {
    // Verify Safe is deployed
    const deployed = await isSafeDeployed(safeAddress, chainId);
    if (!deployed) {
        throw new Error("Safe must be deployed first");
    }
    
    // Encode addOwnerWithThreshold call
    const addOwnerData = encodeFunctionData({
        abi: SAFE_OWNER_MANAGER_ABI,
        functionName: "addOwnerWithThreshold",
        args: [recoveryAddress, BigInt(1)], // Keep threshold at 1
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

### Getting Recovery Info

```typescript
async function getRecoveryInfo(
    safeAddress: Address,
    primarySignerAddress: Address,
    chainId: number
) {
    const isDeployed = await isSafeDeployed(safeAddress, chainId);
    if (!isDeployed) {
        return { isDeployed: false, owners: [], hasRecoverySigner: false };
    }
    
    const owners = await getSafeOwners(safeAddress, chainId);
    const threshold = await getSafeThreshold(safeAddress, chainId);
    
    const recoverySigners = owners.filter(
        owner => owner.toLowerCase() !== primarySignerAddress.toLowerCase()
    );
    
    return {
        isDeployed: true,
        owners,
        threshold,
        hasRecoverySigner: recoverySigners.length > 0,
        recoverySigners,
    };
}
```

---

## Direct Safe Execution (EOA Pays Gas)

For cases where ERC-4337 isn't suitable, EOAs can execute Safe transactions directly:

### Deploy Safe with EOA

```typescript
async function deploySafeWithEOA(
    ownerAddress: Address,
    chainId: number,
    walletClient: WalletClient
): Promise<{ txHash: Hex; safeAddress: Address }> {
    // Encode Safe setup
    const setupData = encodeFunctionData({
        abi: SAFE_SETUP_ABI,
        functionName: "setup",
        args: [
            [ownerAddress],   // owners
            BigInt(1),        // threshold
            "0x0000000000000000000000000000000000000000",
            "0x",
            SAFE_FALLBACK_HANDLER_141,
            "0x0000000000000000000000000000000000000000",
            BigInt(0),
            "0x0000000000000000000000000000000000000000",
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

---

## Environment Variables

```env
# Pimlico API Key (client-side, for bundler/paymaster)
NEXT_PUBLIC_PIMLICO_API_KEY=pim_your_api_key

# Sponsorship Policy ID (optional, for gasless transactions)
NEXT_PUBLIC_PIMLICO_SPONSORSHIP_POLICY_ID=sp_your_policy_id

# WebAuthn RP ID (optional, auto-detected from hostname)
NEXT_PUBLIC_WEBAUTHN_RP_ID=spritz.chat
```

---

## Contract Addresses

### Safe v1.4.1

| Contract | Address |
|----------|---------|
| Proxy Factory | `0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67` |
| Singleton | `0x41675C099F32341bf84BFc5382aF534df5C7461a` |
| Fallback Handler | `0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99` |

### WebAuthn

| Contract | Address |
|----------|---------|
| Signer Factory | `0xF7488fFbe67327ac9f37D5F722d83Fc900852Fbf` |
| Signer Singleton | `0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47` |
| Shared Signer | `0x94a4F6affBd8975951142c3999aEAB7ecee555c2` |
| P256 Verifier (FCL) | `0x75cf11467937ce3f2f357ce24ffc3dbf8fd5c226` |

### Pimlico

| Contract | Address |
|----------|---------|
| ERC-20 Paymaster | `0x777777777777AeC03fd955926DbF81597e66834C` |

---

## Next Steps

- [Authentication](/docs/developers/authentication) - How users authenticate
- [Messaging](/docs/developers/messaging) - Logos messaging integration
- [Video Calls](/docs/developers/video-calls) - Huddle01 integration

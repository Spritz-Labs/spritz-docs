# Smart Wallets Technical Documentation

Complete technical documentation for Spritz Smart Wallets, implementing Safe accounts with ERC-4337 account abstraction.

## Architecture Overview

Every Spritz user gets a **Safe Smart Account** for on-chain transactions, regardless of authentication method.

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Wallet Architecture                 │
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

Safe addresses are computed deterministically **before deployment**:

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

### Create Safe with Passkey Owner

```typescript
import { toWebAuthnAccount } from "viem/account-abstraction";

export interface PasskeyCredential {
    credentialId: string;  // Base64url encoded
    publicKey: {
        x: `0x${string}`;  // P-256 X coordinate (32 bytes)
        y: `0x${string}`;  // P-256 Y coordinate (32 bytes)
    };
}

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

    // Create WebAuthn account
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
        // WebAuthn verification contracts
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

### WebAuthn Gas Limits

For WebAuthn transactions, explicit gas limits are required (simulation fails):

```typescript
const WEBAUTHN_GAS_LIMITS = {
    verificationGasLimit: BigInt(800000),   // Safe deployment + P-256 verification
    callGasLimit: BigInt(200000),           // Transaction execution  
    preVerificationGas: BigInt(100000),     // Pre-verification overhead
    paymasterVerificationGasLimit: BigInt(150000),
    paymasterPostOpGasLimit: BigInt(50000),
};
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

---
title: Social Vaults
description: Technical documentation for Spritz Social Vaults - shared multi-sig wallets with friends using Safe SDK.
keywords:
    [
        Spritz Vaults,
        Social Vaults,
        multi-sig wallet,
        Safe multisig,
        shared wallet,
        group wallet,
        ERC-4337,
    ]
sidebar_label: Social Vaults
---

# Social Vaults Technical Documentation

Spritz Social Vaults are shared multi-signature wallets that allow groups of friends to collectively manage funds using Safe (formerly Gnosis Safe).

## Overview

Social Vaults provide:
- **Multi-sig Security**: Require multiple signatures to execute transactions
- **Friend Integration**: Add Spritz friends who have Spritz Wallets
- **Flexible Thresholds**: Configure how many signatures are needed (e.g., 2 of 3)
- **Multi-chain Support**: Create vaults on Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, and Avalanche
- **Lazy Deployment**: Vault addresses are computed deterministically; actual Safe contract deploys on first transaction

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Social Vault Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Safe Proxy v1.4.1                   │    │
│  │  Address: Deterministic (computed before deploy)    │    │
│  │  Deployed: On first transaction (counterfactual)    │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Vault Members                     │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │  Creator     │  │  Member 1    │  │ Member N │  │    │
│  │  │  (You)       │  │  (Friend)    │  │ (Friend) │  │    │
│  │  │ Smart Wallet │  │ Smart Wallet │  │   ...    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │    │
│  │                                                      │    │
│  │  Threshold: M of N signatures required              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Supported Chains

| Chain | ID | Status |
|-------|-----|--------|
| **Ethereum** | 1 | ✅ Supported |
| **Base** | 8453 | ✅ Supported |
| **Arbitrum** | 42161 | ✅ Supported |
| **Optimism** | 10 | ✅ Supported |
| **Polygon** | 137 | ✅ Supported |
| **BNB Chain** | 56 | ✅ Supported |
| **Avalanche** | 43114 | ✅ Supported |

---

## Creating a Vault

### API Endpoint

```http
POST /api/vault/create
```

### Request Body

```typescript
interface CreateVaultRequest {
    name: string;           // Vault name (max 50 chars)
    description?: string;   // Optional description (max 200 chars)
    emoji?: string;         // Icon emoji (default: 🔐)
    chainId: number;        // Target blockchain ID
    members: Array<{
        address: string;    // Friend's wallet address
        nickname?: string;  // Optional display name
    }>;
    threshold: number;      // Required signatures (1 to totalMembers)
}
```

### Example Request

```typescript
const response = await fetch('/api/vault/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        name: "Trip Fund",
        description: "Shared savings for our vacation",
        emoji: "🏝️",
        chainId: 8453, // Base
        members: [
            { address: "0x1234...", nickname: "Alice" },
            { address: "0x5678...", nickname: "Bob" },
        ],
        threshold: 2, // 2 of 3 signatures required
    }),
});

const { vault, members, signerAddresses } = await response.json();
```

### Response

```typescript
interface CreateVaultResponse {
    vault: {
        id: string;         // Database ID
        name: string;
        description: string | null;
        emoji: string;
        safeAddress: string;  // Deterministic vault address
        chainId: number;
        threshold: number;
        isDeployed: boolean;  // Always false initially
        createdAt: string;
    };
    members: Array<{
        address: string;
        smartWalletAddress: string;
        isCreator: boolean;
        nickname: string | null;
    }>;
    signerAddresses: string[];  // Sorted signer addresses
}
```

---

## Vault Requirements

### Prerequisites

1. **Creator must have a Spritz Wallet**: You need to have created a Spritz Wallet first
2. **Members must have Spritz Wallets**: Only friends with Spritz Wallets can be added
3. **Must be friends**: Members must be in your friends list
4. **At least one additional member**: Cannot create a vault with just yourself

### Finding Eligible Friends

```http
GET /api/vault/eligible-friends
```

Returns friends who have Spritz Wallets and can be added to vaults:

```typescript
interface EligibleFriendsResponse {
    friends: Array<{
        address: string;
        smartWalletAddress: string;
        username?: string;
        avatar?: string;
        ensName?: string;
    }>;
}
```

---

## Listing Vaults

```http
GET /api/vault/list
```

### Response

```typescript
interface VaultListResponse {
    vaults: Array<{
        id: string;
        name: string;
        description: string | null;
        emoji: string;
        safeAddress: string;
        chainId: number;
        threshold: number;
        isDeployed: boolean;
        createdAt: string;
        memberCount: number;
        isCreator: boolean;
    }>;
}
```

---

## Vault Details

```http
GET /api/vault/:id
```

### Response

```typescript
interface VaultDetailsResponse {
    vault: {
        id: string;
        name: string;
        description: string | null;
        emoji: string;
        safeAddress: string;
        chainId: number;
        threshold: number;
        isDeployed: boolean;
        createdAt: string;
        updatedAt: string;
        members: Array<{
            address: string;
            smartWalletAddress: string;
            nickname: string | null;
            isCreator: boolean;
            status: 'active' | 'pending' | 'removed';
            joinedAt: string;
            username?: string;
            avatar?: string;
            ensName?: string;
        }>;
    };
}
```

---

## Update Vault

```http
PATCH /api/vault/:id
```

### Request Body

```typescript
interface UpdateVaultRequest {
    name?: string;
    description?: string;
    emoji?: string;
}
```

Only vault creators can update vault metadata.

---

## Delete Vault

```http
DELETE /api/vault/:id
```

Only vault creators can delete vaults. Vaults with deployed Safe contracts cannot be deleted.

---

## React Hook Usage

```typescript
import { useVaults, useFriendsWithWallets } from '@/hooks/useVaults';

function VaultManager() {
    const { vaults, isLoading, error, createVault, fetchVaults } = useVaults(userAddress);
    const { friends, isLoading: friendsLoading } = useFriendsWithWallets(userAddress);

    const handleCreate = async () => {
        try {
            const vault = await createVault({
                name: "Trip Fund",
                emoji: "🏝️",
                chainId: 8453,
                members: selectedFriends.map(f => ({ address: f.address })),
                threshold: 2,
            });
            console.log("Created vault:", vault);
        } catch (error) {
            console.error("Failed to create vault:", error);
        }
    };

    return (
        <div>
            {vaults.map(vault => (
                <div key={vault.id}>
                    <span>{vault.emoji}</span>
                    <span>{vault.name}</span>
                    <span>{vault.threshold} of {vault.memberCount} required</span>
                </div>
            ))}
        </div>
    );
}
```

---

## Threshold Configuration

| Members | Min Threshold | Max Threshold | Recommended |
|---------|--------------|---------------|-------------|
| 2 | 1 | 2 | 2 (both agree) |
| 3 | 1 | 3 | 2 (majority) |
| 4 | 1 | 4 | 3 (majority) |
| 5+ | 1 | N | Majority or N-1 |

### Security Considerations

- **Threshold = 1**: Any single member can execute transactions (least secure)
- **Threshold = N**: All members must approve (most secure, but can block if someone is unavailable)
- **Threshold = Majority**: Balance between security and usability

---

## Gas & Deployment

### Counterfactual Deployment

Vaults use **counterfactual deployment**, meaning:

1. The vault address is computed deterministically before deployment
2. Users can send funds to the vault address immediately
3. The actual Safe contract deploys on the first transaction
4. This saves gas costs if the vault is never used

### Gas Costs

| Operation | Estimated Gas |
|-----------|---------------|
| First transaction (deploys Safe) | ~300,000 gas |
| Subsequent transactions | ~100,000 gas |
| Adding owner | ~50,000 gas |

Gas is paid according to the network's sponsorship policy:
- **L2s (Base, Arbitrum, etc.)**: Sponsored (free)
- **Ethereum mainnet**: USDC ERC-20 paymaster

---

## Database Schema

```sql
-- Vaults table
CREATE TABLE shout_vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    emoji VARCHAR(10) DEFAULT '🔐',
    safe_address VARCHAR(42) NOT NULL UNIQUE,
    chain_id INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    creator_address VARCHAR(42) NOT NULL,
    is_deployed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault members table
CREATE TABLE shout_vault_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID REFERENCES shout_vaults(id) ON DELETE CASCADE,
    member_address VARCHAR(42) NOT NULL,
    smart_wallet_address VARCHAR(42) NOT NULL,
    is_creator BOOLEAN DEFAULT FALSE,
    nickname VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vault_id, member_address)
);

-- Vault transactions table
CREATE TABLE shout_vault_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID REFERENCES shout_vaults(id) ON DELETE CASCADE,
    safe_tx_hash TEXT NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value TEXT NOT NULL,
    data TEXT,
    operation INTEGER DEFAULT 0,
    nonce INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    created_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Token details
    token_symbol TEXT,
    token_address TEXT,
    -- Execution details
    executed_at TIMESTAMP WITH TIME ZONE,
    executed_tx_hash TEXT
);

-- Vault transaction confirmations (signatures)
CREATE TABLE shout_vault_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES shout_vault_transactions(id) ON DELETE CASCADE,
    signer_address VARCHAR(42) NOT NULL,
    signature TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transaction_id, signer_address)
);
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Not authenticated |
| `NO_SMART_WALLET` | User doesn't have a Spritz Wallet |
| `INVALID_CHAIN` | Chain ID not supported for vaults |
| `INVALID_THRESHOLD` | Threshold out of valid range |
| `MISSING_SMART_WALLETS` | Some members don't have Spritz Wallets |
| `NOT_CREATOR` | Only vault creator can perform this action |
| `VAULT_DEPLOYED` | Cannot delete a deployed vault |

---

## Best Practices

1. **Use appropriate threshold**: Balance security with usability
2. **Verify members**: Double-check friend addresses before creating
3. **Document purpose**: Use description to explain what the vault is for
4. **Test with small amounts**: Send small amounts first to verify
5. **Backup recovery**: Ensure members have backup recovery options

---

## Vault Balances API

Fetch token balances for a vault, including native tokens and ERC-20s.

```http
GET /api/vault/:id/balances
```

### Response

```typescript
interface VaultBalanceResponse {
    vaultId: string;
    safeAddress: string;
    chainId: number;
    nativeBalance: VaultTokenBalance | null;
    tokens: VaultTokenBalance[];
    totalUsd: number;
    lastUpdated: string;
}

interface VaultTokenBalance {
    contractAddress: string;  // "native" for native token
    symbol: string;
    name: string;
    decimals: number;
    balance: string;          // Raw balance
    balanceFormatted: string; // Human-readable balance
    balanceUsd: number | null;
    tokenType: "native" | "erc20";
    logoUrl?: string;
}
```

### Supported Tokens

Only trusted tokens are returned to prevent spam token attacks:

| Chain | Tokens |
|-------|--------|
| Ethereum | USDC, USDT, DAI, WBTC, WETH |
| Base | USDC, DAI, WETH |
| Arbitrum | USDC, USDT, DAI, WETH |
| Optimism | USDC, USDT, DAI, WETH |
| Polygon | USDC, USDT, DAI, WETH |

### Data Sources

1. **Primary**: Blockscout API for indexed balances
2. **Fallback**: Direct RPC calls when Blockscout indexing is delayed

---

## Vault UI Features

The vault detail view includes four main tabs:

### Assets Tab
- View native token balance (ETH, MATIC, etc.)
- View ERC-20 token balances
- Total USD value calculation
- Refresh balances button

### Send Tab
- Select token to send
- Enter amount with MAX button
- Recipient address with **ENS support**
- Transaction proposals require multi-sig approval

```typescript
// ENS resolution example
const recipient = "vitalik.eth"; // Resolves to 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

### Receive Tab
- QR code for vault address
- Copy address to clipboard
- Chain-specific warning messages
- Link to block explorer

### Activity Tab
- Real-time transaction history from Blockscout
- Incoming/outgoing transaction indicators
- Token transfer details
- Timestamps and status

---

## Vault Management

### Edit Vault (Creator Only)

```http
PATCH /api/vault/:id
```

Creators can update:
- Vault name
- Description
- Emoji icon

### Vault Status

| Status | Description |
|--------|-------------|
| **Pending** | Created but not deployed on-chain |
| **Active** | Safe contract deployed, ready for transactions |

---

## Transaction Proposals

Vault transactions require multiple signatures based on the threshold. The proposal flow:

1. **Propose**: Any member creates a transaction proposal
2. **Sign**: Other members sign the proposal
3. **Execute**: Once threshold is reached, any signer can execute

### Create Transaction Proposal

```http
POST /api/vault/:id/transactions
```

#### Request Body

```typescript
interface CreateTransactionRequest {
    toAddress: string;        // Recipient address
    amount: string;           // Amount as string (e.g., "1.5")
    tokenAddress?: string;    // ERC-20 contract address (null for native token)
    tokenDecimals?: number;   // Token decimals (default: 18)
    tokenSymbol?: string;     // Token symbol for display
    description?: string;     // Optional description
}
```

#### Example: Send ETH

```typescript
const response = await fetch(`/api/vault/${vaultId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        toAddress: "0x1234...5678",
        amount: "0.5",
        tokenSymbol: "ETH",
        description: "Payment for services",
    }),
});
```

#### Example: Send USDC

```typescript
const response = await fetch(`/api/vault/${vaultId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        toAddress: "0x1234...5678",
        amount: "100",
        tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC on Base
        tokenDecimals: 6,
        tokenSymbol: "USDC",
    }),
});
```

#### Response

```typescript
interface CreateTransactionResponse {
    success: boolean;
    transaction: {
        id: string;
        vault_id: string;
        safe_tx_hash: string;
        to_address: string;
        value: string;
        data: string;
        operation: number;
        nonce: number;
        status: "pending" | "executed" | "cancelled";
        description: string;
        created_by: string;
        created_at: string;
    };
    message: string;  // e.g., "Transaction proposed. 1 more signature(s) needed."
}
```

### List Transaction Proposals

```http
GET /api/vault/:id/transactions
```

Returns all transactions for the vault with confirmation status:

```typescript
interface TransactionWithConfirmations {
    id: string;
    vault_id: string;
    safe_tx_hash: string;
    to_address: string;
    value: string;
    data: string;
    operation: number;
    nonce: number;
    status: "pending" | "executed" | "cancelled";
    description: string;
    created_by: string;
    created_at: string;
    // Token transfer details
    token_symbol?: string;    // e.g., "USDC"
    token_address?: string;   // ERC-20 contract address
    // Execution details (when executed)
    executed_at?: string;
    executed_tx_hash?: string;
    // Signatures
    confirmations: Array<{
        id: string;
        signer_address: string;
        signed_at: string;
    }>;
}
```

### Transaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Transaction Proposal Flow                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PROPOSE                                                  │
│     ┌──────────────────┐                                    │
│     │  Member creates  │───► Auto-signed by proposer        │
│     │  transaction     │                                    │
│     └──────────────────┘                                    │
│              │                                               │
│              ▼                                               │
│  2. SIGN                                                     │
│     ┌──────────────────┐                                    │
│     │ Other members    │───► Signatures collected           │
│     │ review & sign    │     (threshold - 1 more needed)    │
│     └──────────────────┘                                    │
│              │                                               │
│              ▼                                               │
│  3. EXECUTE (when threshold reached)                         │
│     ┌──────────────────┐                                    │
│     │ Any signer       │───► On-chain execution             │
│     │ executes tx      │     via Safe contract              │
│     └──────────────────┘                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Sign, Execute, or Cancel Transaction

```http
PATCH /api/vault/:id/transactions
```

#### Request Body

```typescript
interface TransactionActionRequest {
    transactionId: string;
    action: "sign" | "execute" | "cancel";
}
```

#### Sign Transaction

Add your signature to a pending transaction:

```typescript
const response = await fetch(`/api/vault/${vaultId}/transactions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        transactionId: "uuid-of-transaction",
        action: "sign",
    }),
});

// Response
{
    "success": true,
    "message": "Signed! 1 more signature(s) needed.",
    "confirmations": 2,
    "threshold": 3,
    "canExecute": false
}
```

#### Execute Transaction

Execute a transaction once threshold is reached:

```typescript
const response = await fetch(`/api/vault/${vaultId}/transactions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        transactionId: "uuid-of-transaction",
        action: "execute",
    }),
});

// Response
{
    "success": true,
    "message": "Transaction executed successfully",
    "txHash": "0x..." // On-chain transaction hash
}
```

#### Cancel Transaction

Only the proposer can cancel a pending transaction:

```typescript
const response = await fetch(`/api/vault/${vaultId}/transactions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        transactionId: "uuid-of-transaction",
        action: "cancel",
    }),
});

// Response
{
    "success": true,
    "message": "Transaction cancelled"
}
```

### Transaction Status

| Status | Description |
|--------|-------------|
| `pending` | Awaiting signatures or execution |
| `executed` | Successfully executed on-chain |
| `cancelled` | Cancelled by proposer |

### Action Permissions

| Action | Who Can Perform |
|--------|-----------------|
| **Sign** | Any vault member who hasn't signed yet |
| **Execute** | Any vault member (when threshold reached) |
| **Cancel** | Only the transaction proposer |

---

## Vault Deployment

Vaults use counterfactual deployment - the address is computed before the Safe contract is deployed on-chain.

### Deployment Methods

Spritz offers three deployment options:

| Method | Gas Cost | Best For |
|--------|----------|----------|
| **Passkey Smart Wallet** | Free on L2s | Passkey-only users (no connected wallet) |
| **Wallet Smart Wallet** | Free on L2s | Users with connected wallets |
| **EOA (Direct)** | User pays gas | Users who prefer direct control |

:::tip Passkey Users
Passkey users can deploy vaults using their passkey-based Smart Wallet with sponsored gas. No external wallet connection is required.
:::

#### Passkey-Based Deployment (Recommended for Passkey Users)

Passkey users can deploy vaults using their passkey-based Smart Wallet. No external wallet connection is required:

```typescript
import { deployVaultViaPasskey, type PasskeyCredential } from '@/lib/safeWallet';

// Load passkey credential from your auth system
const passkeyCredential: PasskeyCredential = {
    credentialId: "base64url-credential-id",
    publicKey: {
        x: "0x..." as `0x${string}`,  // P-256 X coordinate
        y: "0x..." as `0x${string}`,  // P-256 Y coordinate
    },
};

const result = await deployVaultViaPasskey(
    owners,              // Array of owner addresses (smart wallet addresses)
    threshold,           // Number of required signatures
    chainId,             // Chain ID (8453 for Base, etc.)
    passkeyCredential,   // User's passkey credential
    saltNonce,           // For deterministic address (default: BigInt(0))
);

console.log("Vault deployed:", result.safeAddress);
console.log("Transaction:", result.txHash);
```

#### Wallet-Based Sponsored Deployment

For users with connected wallets, deployment uses sponsored gas through the wallet's signing capabilities:

```typescript
import { deployVaultViaSponsoredGas } from '@/lib/safeWallet';

const result = await deployVaultViaSponsoredGas(
    owners,           // Array of owner addresses
    threshold,        // Number of required signatures
    chainId,          // Chain ID (8453 for Base, etc.)
    signerAddress,    // Your EOA address
    signMessage,      // Wallet sign function
    signTypedData,    // EIP-712 sign function
    saltNonce,        // For deterministic address
);

console.log("Vault deployed:", result.safeAddress);
console.log("Transaction:", result.txHash);
```

:::tip L2 Recommendation
For mainnet vaults with high gas fees (~$5-20), we recommend deploying on an L2 where deployment is free via sponsored gas.
:::

**UI Indicators:**
- 🟢 **"Free (Sponsored)"** - L2 networks with paymaster support
- 🟠 **"~$X.XX estimated"** - Mainnet with gas cost estimate

#### EOA Deployment (Direct)

Users can toggle to pay gas directly from their connected wallet:

```typescript
// User pays gas directly from EOA
const tx = await walletClient.writeContract({
    address: SAFE_PROXY_FACTORY,
    abi: proxyFactoryAbi,
    functionName: 'createProxyWithNonce',
    args: [safeSingleton, setupData, saltNonce],
});
```

### Check Deployment Status

```http
GET /api/vault/:id/deploy
```

Returns deployment status and details needed to deploy:

```typescript
interface DeploymentStatusResponse {
    isDeployed: boolean;       // On-chain status
    isDeployedInDb: boolean;   // Database status
    safeAddress: string;
    chainId: number;
    threshold: number;
    saltNonce: string;
    owners: string[];          // Smart wallet addresses of all members
}
```

### Mark Vault as Deployed

After deploying the Safe contract on-chain:

```http
POST /api/vault/:id/deploy
```

**Request Body:**
```json
{
    "txHash": "0x..."  // Deployment transaction hash
}
```

**Response:**
```json
{
    "success": true,
    "message": "Vault deployed successfully",
    "safeAddress": "0x...",
    "txHash": "0x..."
}
```

### Deployment Sync

ERC-4337 bundler transactions can have slight delays. The UI polls for on-chain confirmation:

```typescript
// Poll for deployment confirmation (up to 30 seconds)
for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const deployed = await isSafeDeployed(safeAddress, chainId);
    if (deployed) break;
}
```

**Auto-detection of existing vaults:**

If a Create2 deployment fails with "Create2 call failed", it means the Safe already exists at that address. The system auto-detects this and marks the vault as deployed.

### Admin Sync Endpoint

For vaults stuck in "Not Deployed" state, admins can force-sync:

```http
POST /api/admin/vault/sync-deployment
```

**Request Body (optional):**
```json
{
    "vaultId": "uuid"  // Omit to sync all undeployed vaults
}
```

**Response:**
```json
{
    "message": "Synced 3 of 5 vaults",
    "checked": 5,
    "synced": 3,
    "details": [
        {
            "id": "uuid",
            "name": "Family Vault",
            "safeAddress": "0x...",
            "wasDeployed": false,
            "nowDeployed": true,
            "updated": true
        }
    ]
}
```

Users can also click the **"Sync"** button next to the "Not Deployed" badge in the vault details UI.

---

## Multi-sig Execution Flow

For threshold > 1 vaults, use the `useVaultExecution` hook. The hook supports both wallet-connected users and passkey-only users.

:::tip Passkey Support
Passkey users can now sign and execute vault transactions directly using their passkey-based Smart Wallet. No external wallet connection is required.
:::

### Sign Transaction

```typescript
import { useVaultExecution } from '@/hooks/useVaultExecution';

function VaultTransactionSigner() {
    // Pass passkeyUserAddress for passkey-only users
    const { signTransaction, status, error } = useVaultExecution(passkeyUserAddress);

    const handleSign = async () => {
        const result = await signTransaction({
            safeAddress: "0x...",
            chainId: 8453,
            to: "0x...",
            value: "1000000000000000000", // 1 ETH in wei
            data: "0x",
            nonce: 0,
        });

        if (result.success) {
            // Send signature to backend
            await fetch(`/api/vault/${vaultId}/transactions`, {
                method: 'PATCH',
                body: JSON.stringify({
                    transactionId,
                    action: 'sign',
                    signature: result.signature,
                    signerAddress: result.signerAddress,
                    safeTxHash: result.safeTxHash,
                }),
            });
        }
    };
}
```

### Execute with Signatures

Once threshold is reached, any vault member can execute the transaction. The hook automatically detects whether to use a connected wallet or passkey:

```typescript
const { executeWithSignatures } = useVaultExecution(passkeyUserAddress);

const result = await executeWithSignatures({
    safeAddress: "0x...",
    chainId: 8453,
    to: "0x...",
    value: "1000000000000000000",
    data: "0x",
    signatures: [
        { signerAddress: "0xabc...", signature: "0x123..." },
        { signerAddress: "0xdef...", signature: "0x456..." },
    ],
});

if (result.success) {
    console.log("Transaction hash:", result.txHash);
}
```

### Passkey Execution (Direct)

For programmatic access, passkey users can execute vault transactions directly:

```typescript
import { executeVaultViaPasskey, type PasskeyCredential } from '@/lib/safeWallet';

const passkeyCredential: PasskeyCredential = {
    credentialId: "base64url-credential-id",
    publicKey: {
        x: "0x..." as `0x${string}`,
        y: "0x..." as `0x${string}`,
    },
};

// Execute with collected signatures
const txHash = await executeVaultViaPasskey(
    vaultAddress,       // The vault (Safe) address
    chainId,            // Chain ID
    to,                 // Destination address
    value,              // ETH value in wei (BigInt)
    data,               // Call data (0x for ETH transfer)
    combinedSignatures, // Collected signatures meeting threshold
    passkeyCredential,  // Passkey credential for execution
);

console.log("Executed via passkey:", txHash);
```

This function:
1. Creates a passkey-based Smart Account Client
2. Encodes the `execTransaction` call for the vault Safe
3. Sends it through the passkey Smart Wallet via ERC-4337 with sponsored gas

### Multi-Sig Signature Mechanics

Safe multi-sig requires careful handling of signatures from multiple signers. Each signer's Smart Wallet signs the Safe transaction hash, and all signatures are combined for execution.

#### Safe Transaction Hash Computation

```typescript
import { keccak256, encodeAbiParameters, parseAbiParameters, Address, Hex } from 'viem';

// Safe domain separator (unique per Safe deployment)
const DOMAIN_SEPARATOR_TYPEHASH = keccak256(
    toBytes("EIP712Domain(uint256 chainId,address verifyingContract)")
);

// Safe transaction type hash
const SAFE_TX_TYPEHASH = keccak256(
    toBytes(
        "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas," +
        "uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    )
);

/**
 * Compute the Safe transaction hash that signers must sign
 */
export function computeSafeTxHash(
    safeAddress: Address,
    chainId: number,
    tx: {
        to: Address;
        value: bigint;
        data: Hex;
        operation: 0 | 1;  // 0 = Call, 1 = DelegateCall
        safeTxGas: bigint;
        baseGas: bigint;
        gasPrice: bigint;
        gasToken: Address;
        refundReceiver: Address;
        nonce: bigint;
    }
): Hex {
    // 1. Compute domain separator
    const domainSeparator = keccak256(
        encodeAbiParameters(
            parseAbiParameters('bytes32, uint256, address'),
            [DOMAIN_SEPARATOR_TYPEHASH, BigInt(chainId), safeAddress]
        )
    );

    // 2. Hash transaction data
    const safeTxHash = keccak256(
        encodeAbiParameters(
            parseAbiParameters(
                'bytes32, address, uint256, bytes32, uint8, uint256, uint256, uint256, address, address, uint256'
            ),
            [
                SAFE_TX_TYPEHASH,
                tx.to,
                tx.value,
                keccak256(tx.data),  // Hash of calldata
                tx.operation,
                tx.safeTxGas,
                tx.baseGas,
                tx.gasPrice,
                tx.gasToken,
                tx.refundReceiver,
                tx.nonce,
            ]
        )
    );

    // 3. Compute EIP-712 hash
    return keccak256(
        concat([
            toBytes('\x19\x01'),
            hexToBytes(domainSeparator),
            hexToBytes(safeTxHash),
        ])
    );
}
```

#### Signature Collection Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Multi-Sig Signature Collection                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Vault: "Trip Fund" (2-of-3 threshold)                                   │
│  Members: Alice, Bob, Charlie                                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  1. ALICE PROPOSES TRANSACTION                                      │ │
│  │                                                                      │ │
│  │  POST /api/vault/{id}/transactions                                  │ │
│  │  { to: "0x...", amount: "1.5", tokenSymbol: "ETH" }                │ │
│  │                                                                      │ │
│  │  Server:                                                            │ │
│  │  - Computes safeTxHash                                              │ │
│  │  - Alice signs with her Smart Wallet                                │ │
│  │  - Stores proposal + Alice's signature (1/2)                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                          │                                               │
│                          ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  2. BOB SIGNS (Notification sent)                                   │ │
│  │                                                                      │ │
│  │  PATCH /api/vault/{id}/transactions                                 │ │
│  │  { transactionId: "...", action: "sign" }                          │ │
│  │                                                                      │ │
│  │  Server:                                                            │ │
│  │  - Retrieves safeTxHash                                             │ │
│  │  - Bob signs with his Smart Wallet                                  │ │
│  │  - Stores Bob's signature (2/2 ✓ threshold met!)                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                          │                                               │
│                          ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  3. EXECUTE (Any signer can execute)                                │ │
│  │                                                                      │ │
│  │  PATCH /api/vault/{id}/transactions                                 │ │
│  │  { transactionId: "...", action: "execute" }                       │ │
│  │                                                                      │ │
│  │  Server:                                                            │ │
│  │  - Retrieves all signatures                                         │ │
│  │  - Sorts by signer address (CRITICAL!)                              │ │
│  │  - Concatenates signatures                                          │ │
│  │  - Calls Safe.execTransaction()                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Signature Format (EOA vs Smart Wallet vs Passkey)

Safe supports multiple signature types. Spritz vaults use Smart Wallet signatures:

| Signature Type | Format | Length | Signer Type |
|----------------|--------|--------|-------------|
| **EOA (ECDSA)** | `r (32) + s (32) + v (1)` | 65 bytes | External wallet |
| **Contract Signature** | `r (32) + s (32) + v=0 + dynamic` | 65+ bytes | Smart contract |
| **eth_sign (legacy)** | `r (32) + s (32) + v+4` | 65 bytes | Legacy wallets |
| **EIP-1271** | Verified via `isValidSignature()` | Variable | Smart Wallet |

```typescript
// Signature type indicators (v value)
const SIGNATURE_TYPES = {
    CONTRACT_SIGNATURE: 0,      // EIP-1271 contract signature
    APPROVED_HASH: 1,           // Pre-approved hash
    ETH_SIGN_PREFIX: 27,        // Standard ECDSA (v = 27 or 28)
    ETH_SIGN_LEGACY: 31,        // eth_sign with v+4 adjustment
};
```

#### Signature Sorting (Critical!)

**Safe requires signatures sorted by signer address in ascending order.** Incorrect ordering causes transaction failure:

```typescript
/**
 * Sort and concatenate signatures for Safe execution
 */
export function prepareSafeSignatures(
    signatures: Array<{
        signerAddress: Address;
        signature: Hex;
    }>
): Hex {
    // CRITICAL: Sort by signer address (case-insensitive, ascending)
    const sorted = [...signatures].sort((a, b) =>
        a.signerAddress.toLowerCase().localeCompare(
            b.signerAddress.toLowerCase()
        )
    );

    // Concatenate signatures (remove 0x prefix except first)
    const concatenated = sorted.reduce((acc, sig, index) => {
        const sigWithoutPrefix = sig.signature.slice(2);
        return acc + sigWithoutPrefix;
    }, '0x');

    return concatenated as Hex;
}

// Example:
// Alice: 0xABC... signature: 0x111...
// Bob:   0xDEF... signature: 0x222...
// Charlie: 0x123... signature: 0x333...
//
// Sorted order: Charlie (0x123) < Alice (0xABC) < Bob (0xDEF)
// Result: 0x333...111...222...
```

#### Smart Wallet Signature Generation

When a vault member signs a proposal, their Smart Wallet signs the Safe transaction hash:

```typescript
import { createSafeAccountClient } from '@/lib/safeWallet';

/**
 * Sign a vault transaction proposal using the member's Smart Wallet
 */
export async function signVaultTransaction(
    userAddress: Address,           // Member's EOA address
    vaultAddress: Address,          // Vault (Safe) address
    safeTxHash: Hex,               // Hash to sign
    chainId: number,
    signMessage: (msg: string) => Promise<Hex>
): Promise<{
    signature: Hex;
    signerAddress: Address;        // Member's Smart Wallet address
}> {
    // Get the member's Smart Wallet address (this is what's registered as vault owner)
    const smartWalletAddress = await getSafeAddress(userAddress, chainId);

    // Sign the Safe transaction hash with the user's EOA
    // The EOA is the owner of the Smart Wallet
    const signature = await signMessage(safeTxHash);

    // Adjust signature for Safe's eth_sign verification
    // Safe expects v to be 27/28 + 4 for eth_sign signatures
    let v = parseInt(signature.slice(-2), 16);
    if (v < 27) v += 27;
    v += 4;  // Safe's eth_sign adjustment

    const adjustedSignature = (signature.slice(0, -2) + v.toString(16).padStart(2, '0')) as Hex;

    return {
        signature: adjustedSignature,
        signerAddress: smartWalletAddress,
    };
}
```

#### Passkey Signature for Vault Transactions

Passkey users can also sign vault transactions:

```typescript
import { createPasskeySafeAccountClient, type PasskeyCredential } from '@/lib/safeWallet';

/**
 * Sign a vault transaction using a passkey-based Smart Wallet
 */
export async function signVaultTransactionWithPasskey(
    safeTxHash: Hex,
    chainId: number,
    passkeyCredential: PasskeyCredential
): Promise<{
    signature: Hex;
    signerAddress: Address;
}> {
    // Get the passkey user's Smart Wallet address
    const smartWalletAddress = await getPasskeySafeAddress(
        passkeyCredential.publicKey.x,
        passkeyCredential.publicKey.y,
        chainId
    );

    // Convert safeTxHash to challenge bytes
    const challenge = new Uint8Array(Buffer.from(safeTxHash.slice(2), 'hex'));

    // Sign with passkey (triggers biometric)
    const webAuthnSignature = await signWithPasskey(
        passkeyCredential.credentialId,
        challenge
    );

    // Encode for Safe verification
    const encodedSignature = encodeWebAuthnSignature(webAuthnSignature);

    // For contract signatures (EIP-1271), we need to format differently
    // v = 0 indicates contract signature, followed by the actual signature data
    const contractSignature = encodeContractSignature(
        smartWalletAddress,
        encodedSignature
    );

    return {
        signature: contractSignature,
        signerAddress: smartWalletAddress,
    };
}

/**
 * Encode a contract signature for Safe
 * Format: r (32 bytes) + s (32 bytes) + v (1 byte, = 0) + data offset + data
 */
function encodeContractSignature(
    contractAddress: Address,
    signatureData: Hex
): Hex {
    // Contract signatures use a special encoding:
    // - r: padded contract address (32 bytes)
    // - s: data position (32 bytes) - points to after all static signatures
    // - v: 0 (indicates contract signature)
    // - Then the actual signature data follows at the specified position

    const r = contractAddress.slice(2).padStart(64, '0');
    const v = '00';  // Contract signature indicator

    // For simplicity in single-sig scenarios, we can use a simplified encoding
    // In multi-sig with mixed signature types, positions must be calculated
    return `0x${r}${''.padStart(64, '0')}${v}${signatureData.slice(2)}` as Hex;
}
```

### Nested Contract Signatures (Passkey Vault Members)

When a vault member is a **Passkey Smart Wallet**, we need TWO levels of contract signatures:

1. **INNER**: For the Smart Wallet's `checkNSignatures`
   - `r` = SafeWebAuthnSharedSigner address
   - `s` = 65 (offset to WebAuthn data within inner signature)
   - `v` = 0
   - dynamic = WebAuthn ABI-encoded signature

2. **OUTER**: For the Vault's `checkNSignatures`
   - `r` = Smart Wallet address  
   - `s` = offset to inner signature within final signature
   - `v` = 0
   - dynamic = the complete INNER signature

```typescript
// SafeWebAuthnSharedSigner - used as the "owner" in Safe's checkNSignatures for WebAuthn
const SAFE_WEBAUTHN_SHARED_SIGNER = "0x94a4F6affBd8975951142c3999aEAB7ecee555c2" as Address;

/**
 * Build a NESTED contract signature for passkey/Smart Wallet owners of a vault.
 */
function buildNestedContractSignature(
    smartWalletAddress: Address,
    webAuthnSignature: string,
    dynamicOffset: number
): { staticPart: string; dynamicPart: string; dynamicLength: number } {
    // === INNER SIGNATURE (for Smart Wallet's checkNSignatures) ===
    // Points to SafeWebAuthnSharedSigner and contains WebAuthn data
    const innerStaticOffset = 65; // Offset within inner signature to its dynamic part
    
    // Inner static: r = SafeWebAuthnSharedSigner, s = 65, v = 0
    const innerR = SAFE_WEBAUTHN_SHARED_SIGNER.slice(2).toLowerCase().padStart(64, "0");
    const innerS = innerStaticOffset.toString(16).padStart(64, "0");
    const innerV = "00";
    const innerStaticPart = innerR + innerS + innerV; // 65 bytes = 130 hex chars
    
    // Inner dynamic: length + WebAuthn signature
    const webAuthnHex = webAuthnSignature.startsWith("0x") 
        ? webAuthnSignature.slice(2) 
        : webAuthnSignature;
    const webAuthnLength = webAuthnHex.length / 2;
    const innerDynamicLengthHex = webAuthnLength.toString(16).padStart(64, "0");
    const innerDynamicPart = innerDynamicLengthHex + webAuthnHex;
    
    // Complete inner signature
    const innerSignature = innerStaticPart + innerDynamicPart;
    const innerSignatureLength = innerSignature.length / 2;
    
    // === OUTER SIGNATURE (for Vault's checkNSignatures) ===
    // Points to Smart Wallet and contains complete inner signature
    const outerR = smartWalletAddress.slice(2).toLowerCase().padStart(64, "0");
    const outerS = dynamicOffset.toString(16).padStart(64, "0");
    const outerV = "00";
    const outerStaticPart = outerR + outerS + outerV;
    
    // Outer dynamic: length of inner signature + inner signature
    const outerDynamicLengthHex = innerSignatureLength.toString(16).padStart(64, "0");
    const outerDynamicPart = outerDynamicLengthHex + innerSignature;
    
    return {
        staticPart: outerStaticPart,
        dynamicPart: outerDynamicPart,
        dynamicLength: 32 + innerSignatureLength, // length field + inner signature
    };
}
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Nested Contract Signature Structure                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  VAULT execTransaction(... signatures)                                   │
│      │                                                                   │
│      ▼                                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  OUTER SIGNATURE (v=0, contract signature)                          │ │
│  │  ┌────────────────────────────────────────────────────────────────┐│ │
│  │  │ r: Smart Wallet Address (32 bytes)                             ││ │
│  │  │ s: Offset to inner signature (32 bytes)                        ││ │
│  │  │ v: 0 (contract signature indicator)                            ││ │
│  │  └────────────────────────────────────────────────────────────────┘│ │
│  │  ┌────────────────────────────────────────────────────────────────┐│ │
│  │  │ Dynamic Data: Length + Complete Inner Signature                ││ │
│  │  └────────────────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│      │                                                                   │
│      │ Vault calls smartWallet.isValidSignature(hash, innerSig)         │
│      ▼                                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  INNER SIGNATURE (v=0, contract signature)                          │ │
│  │  ┌────────────────────────────────────────────────────────────────┐│ │
│  │  │ r: SafeWebAuthnSharedSigner (32 bytes)                         ││ │
│  │  │ s: 65 (offset to WebAuthn data)                                ││ │
│  │  │ v: 0 (contract signature indicator)                            ││ │
│  │  └────────────────────────────────────────────────────────────────┘│ │
│  │  ┌────────────────────────────────────────────────────────────────┐│ │
│  │  │ Dynamic Data: WebAuthn ABI-encoded signature                   ││ │
│  │  │ (authenticatorData, clientDataFields, r, s)                    ││ │
│  │  └────────────────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│      │                                                                   │
│      │ Smart Wallet calls SafeWebAuthnSharedSigner.isValidSignature()   │
│      ▼                                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  WebAuthn P-256 signature verification via SafeP256Verifier        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### EIP-1271 Contract Signature Verification

Vault members' signatures are Smart Wallet signatures, which use [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271) for verification:

```solidity
// EIP-1271 interface (implemented by Safe)
interface IERC1271 {
    function isValidSignature(
        bytes32 _hash,
        bytes memory _signature
    ) external view returns (bytes4 magicValue);
}

// Magic return value for valid signatures
bytes4 constant EIP1271_MAGIC_VALUE = 0x1626ba7e;
```

#### Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EIP-1271 Signature Verification                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Vault (Safe) receives execTransaction with signatures                   │
│                          │                                               │
│                          ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  For each signature:                                                │ │
│  │                                                                      │ │
│  │  if (v == 0) {                                                      │ │
│  │      // Contract signature (EIP-1271)                               │ │
│  │      address signer = address(bytes20(r));                          │ │
│  │                                                                      │ │
│  │      // Call signer's isValidSignature()                            │ │
│  │      ┌────────────────────────────────────────────────┐            │ │
│  │      │  Member's Smart Wallet                          │            │ │
│  │      │                                                  │            │ │
│  │      │  isValidSignature(safeTxHash, signatureData)    │            │ │
│  │      │         │                                        │            │ │
│  │      │         ▼                                        │            │ │
│  │      │  Verifies the EOA/Passkey signature             │            │ │
│  │      │  that controls this Smart Wallet                │            │ │
│  │      │         │                                        │            │ │
│  │      │         ▼                                        │            │ │
│  │      │  Returns 0x1626ba7e (valid) or reverts         │            │ │
│  │      └────────────────────────────────────────────────┘            │ │
│  │                                                                      │ │
│  │  } else if (v > 30) {                                               │ │
│  │      // eth_sign signature (v = 27/28 + 4)                          │ │
│  │      signer = ecrecover(hash, v-4, r, s)                            │ │
│  │  } else {                                                           │ │
│  │      // Standard ECDSA (v = 27 or 28)                               │ │
│  │      signer = ecrecover(hash, v, r, s)                              │ │
│  │  }                                                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  All signatures valid + threshold met = Execute transaction             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Execution States

| Status | Description |
|--------|-------------|
| `idle` | Ready for action |
| `checking` | Verifying Safe deployment and ownership |
| `signing` | Waiting for wallet signature |
| `executing` | Transaction being sent |
| `success` | Transaction confirmed |
| `error` | Something went wrong |

---

## Multi-Sig Signature Mechanics (Deep Dive)

### Safe Transaction Hash Calculation

Every vault transaction has a unique hash that all signers must sign:

```typescript
import { keccak256, encodeAbiParameters, encodePacked } from 'viem';

/**
 * Safe Transaction TypeHash (EIP-712)
 * keccak256("SafeTx(address to,uint256 value,bytes data,uint8 operation,
 *            uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,
 *            address gasToken,address refundReceiver,uint256 nonce)")
 */
const SAFE_TX_TYPEHASH = '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8';

interface VaultTransactionData {
    to: Address;
    value: bigint;
    data: `0x${string}`;
    operation: 0 | 1;        // 0 = Call, 1 = DelegateCall
    safeTxGas: bigint;       // Gas for Safe internal tx
    baseGas: bigint;         // Gas for overhead
    gasPrice: bigint;        // Gas price for refund
    gasToken: Address;       // Token for gas payment (0x0 = ETH)
    refundReceiver: Address; // Refund recipient (0x0 = msg.sender)
    nonce: bigint;           // Safe nonce
}

/**
 * Calculate the Safe transaction hash
 * This is what signers actually sign
 */
export function calculateVaultTxHash(
    vaultAddress: Address,
    chainId: number,
    tx: VaultTransactionData
): `0x${string}` {
    // 1. Hash the transaction data structure
    const txDataHash = keccak256(
        encodeAbiParameters(
            [
                { type: 'bytes32' },  // SAFE_TX_TYPEHASH
                { type: 'address' },  // to
                { type: 'uint256' },  // value
                { type: 'bytes32' },  // keccak256(data)
                { type: 'uint8' },    // operation
                { type: 'uint256' },  // safeTxGas
                { type: 'uint256' },  // baseGas
                { type: 'uint256' },  // gasPrice
                { type: 'address' },  // gasToken
                { type: 'address' },  // refundReceiver
                { type: 'uint256' },  // nonce
            ],
            [
                SAFE_TX_TYPEHASH,
                tx.to,
                tx.value,
                keccak256(tx.data),
                tx.operation,
                tx.safeTxGas,
                tx.baseGas,
                tx.gasPrice,
                tx.gasToken,
                tx.refundReceiver,
                tx.nonce,
            ]
        )
    );
    
    // 2. Calculate domain separator
    const DOMAIN_SEPARATOR_TYPEHASH = keccak256(
        encodePacked(['string'], ['EIP712Domain(uint256 chainId,address verifyingContract)'])
    );
    
    const domainSeparator = keccak256(
        encodeAbiParameters(
            [{ type: 'bytes32' }, { type: 'uint256' }, { type: 'address' }],
            [DOMAIN_SEPARATOR_TYPEHASH, BigInt(chainId), vaultAddress]
        )
    );
    
    // 3. Final hash: "\x19\x01" || domainSeparator || txDataHash
    return keccak256(
        encodePacked(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            ['0x19', '0x01', domainSeparator, txDataHash]
        )
    );
}
```

### Signature Types in Multi-Sig

Safe supports different signature types from different owner types:

```typescript
/**
 * Safe Signature Types
 * 
 * Type 0: Contract signature (EIP-1271)
 *   - Used when owner is a smart contract
 *   - Calls isValidSignature(hash, signature) on the contract
 * 
 * Type 1: Approved hash
 *   - Pre-approved via approveHash() on-chain
 *   - Signature is just padded signer address
 * 
 * Type 2: eth_sign
 *   - Uses personal_sign with "\x19Ethereum Signed Message:" prefix
 *   - v value adjusted: v + 4 (31 or 32 instead of 27 or 28)
 * 
 * Type 3: EIP-712
 *   - Typed data signature (no message prefix)
 *   - v value: 27 or 28
 */

type SignatureType = 0 | 1 | 2 | 3;

interface VaultSignature {
    signerAddress: Address;    // Signer's address
    signature: `0x${string}`;  // Raw signature (65 bytes for EOA)
    signatureType: SignatureType;
}
```

### Encoding Mixed Signature Types

When vault members use different wallet types (EOA vs Smart Wallet), signatures must be encoded differently:

```typescript
/**
 * Encode signatures for Safe execution
 * Handles both EOA and Smart Wallet (EIP-1271) signatures
 */
export function encodeVaultSignatures(
    signatures: VaultSignature[]
): `0x${string}` {
    // Sort by signer address (Safe requirement)
    const sorted = [...signatures].sort((a, b) =>
        a.signerAddress.toLowerCase().localeCompare(b.signerAddress.toLowerCase())
    );
    
    // For contract signatures (type 0), we need dynamic data
    // Structure: [static data for all sigs] [dynamic data for contract sigs]
    
    let staticPart = '';
    let dynamicPart = '';
    let dynamicOffset = sorted.length * 65; // Start of dynamic data
    
    for (const sig of sorted) {
        if (sig.signatureType === 0) {
            // Contract signature (EIP-1271)
            // Static: address (32 bytes) || offset (32 bytes) || type (1 byte)
            const addressPadded = sig.signerAddress.slice(2).padStart(64, '0');
            const offsetHex = dynamicOffset.toString(16).padStart(64, '0');
            staticPart += addressPadded + offsetHex + '00';
            
            // Dynamic: length (32 bytes) || signature data
            const sigData = sig.signature.slice(2);
            const sigLength = (sigData.length / 2).toString(16).padStart(64, '0');
            dynamicPart += sigLength + sigData;
            
            dynamicOffset += 32 + sigData.length / 2;
        } else if (sig.signatureType === 2) {
            // eth_sign (type 2)
            // Adjust v: add 4 to indicate eth_sign
            const r = sig.signature.slice(0, 66);
            const s = sig.signature.slice(66, 130);
            let v = parseInt(sig.signature.slice(130, 132), 16);
            if (v < 27) v += 27;
            v += 4; // eth_sign adjustment
            staticPart += sig.signature.slice(2, 130) + v.toString(16).padStart(2, '0');
        } else {
            // EIP-712 or other (65 bytes as-is)
            staticPart += sig.signature.slice(2);
        }
    }
    
    return `0x${staticPart}${dynamicPart}`;
}
```

### Smart Wallet Owner Signatures (EIP-1271)

When a vault member is a **Spritz Wallet** (not just an EOA), they sign using their Safe which requires EIP-1271 verification:

```typescript
/**
 * Sign vault transaction from a Spritz Wallet (Safe)
 * The outer vault will verify this signature via EIP-1271
 */
export async function signVaultTxFromSmartWallet(
    safeTxHash: `0x${string}`,
    ownerSmartWallet: {
        address: Address;
        client: SmartAccountClient;
    }
): Promise<VaultSignature> {
    // The Smart Wallet signs the vault's safeTxHash
    // When the vault calls isValidSignature on the owner's Safe,
    // it will verify this signature against the owner's Safe owners
    
    const signature = await ownerSmartWallet.client.signMessage({
        message: { raw: safeTxHash },
    });
    
    return {
        signerAddress: ownerSmartWallet.address,
        signature,
        signatureType: 0, // Contract signature (EIP-1271)
    };
}
```

### Complete Signing Flow Example

```typescript
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

/**
 * Complete flow: Create, sign, and execute a vault transaction
 */
export async function executeVaultTransaction({
    vaultAddress,
    chainId,
    to,
    value,
    members, // Array of member addresses with their signing methods
}: {
    vaultAddress: Address;
    chainId: number;
    to: Address;
    value: bigint;
    members: Array<{
        address: Address;
        isSmartWallet: boolean;
        signFn: (hash: `0x${string}`) => Promise<`0x${string}`>;
    }>;
}): Promise<`0x${string}`> {
    const publicClient = createPublicClient({
        chain: base,
        transport: http(),
    });
    
    // 1. Get vault nonce
    const nonce = await publicClient.readContract({
        address: vaultAddress,
        abi: [{ name: 'nonce', type: 'function', inputs: [], outputs: [{ type: 'uint256' }] }],
        functionName: 'nonce',
    });
    
    // 2. Build transaction data
    const txData: VaultTransactionData = {
        to,
        value,
        data: '0x',
        operation: 0,
        safeTxGas: BigInt(0),
        baseGas: BigInt(0),
        gasPrice: BigInt(0),
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce,
    };
    
    // 3. Calculate safeTxHash
    const safeTxHash = calculateVaultTxHash(vaultAddress, chainId, txData);
    console.log('Safe TX Hash:', safeTxHash);
    
    // 4. Collect signatures from members
    const signatures: VaultSignature[] = [];
    
    for (const member of members) {
        const rawSig = await member.signFn(safeTxHash);
        
        signatures.push({
            signerAddress: member.address,
            signature: rawSig,
            signatureType: member.isSmartWallet ? 0 : 2,
        });
    }
    
    // 5. Encode signatures
    const encodedSignatures = encodeVaultSignatures(signatures);
    
    // 6. Execute transaction
    const txHash = await publicClient.writeContract({
        address: vaultAddress,
        abi: SAFE_EXEC_TRANSACTION_ABI,
        functionName: 'execTransaction',
        args: [
            txData.to,
            txData.value,
            txData.data,
            txData.operation,
            txData.safeTxGas,
            txData.baseGas,
            txData.gasPrice,
            txData.gasToken,
            txData.refundReceiver,
            encodedSignatures,
        ],
    });
    
    return txHash;
}

const SAFE_EXEC_TRANSACTION_ABI = [{
    name: 'execTransaction',
    type: 'function',
    inputs: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'operation', type: 'uint8' },
        { name: 'safeTxGas', type: 'uint256' },
        { name: 'baseGas', type: 'uint256' },
        { name: 'gasPrice', type: 'uint256' },
        { name: 'gasToken', type: 'address' },
        { name: 'refundReceiver', type: 'address' },
        { name: 'signatures', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }],
}] as const;
```

### Passkey Member Signatures

When a vault member uses a **passkey-based Spritz Wallet**, the signature flow involves WebAuthn:

```typescript
/**
 * Sign vault transaction using a passkey
 * 
 * Flow:
 * 1. User's passkey signs the safeTxHash via WebAuthn
 * 2. The signature is wrapped for Safe's P256Verifier
 * 3. The vault calls isValidSignature on the member's Spritz Wallet
 * 4. The Spritz Wallet verifies the P-256 signature
 */
export async function signVaultTxWithPasskey(
    safeTxHash: `0x${string}`,
    credential: PasskeyCredential
): Promise<VaultSignature> {
    // Convert safeTxHash to WebAuthn challenge
    const challenge = hexToArrayBuffer(safeTxHash);
    
    // Request WebAuthn assertion
    const assertion = await navigator.credentials.get({
        publicKey: {
            challenge,
            rpId: getRpId(),
            timeout: 120000,
            userVerification: 'preferred',
            allowCredentials: [{
                id: base64urlToArrayBuffer(credential.credentialId),
                type: 'public-key',
            }],
        },
    }) as PublicKeyCredential;
    
    const response = assertion.response as AuthenticatorAssertionResponse;
    
    // Parse DER signature and normalize to low-S
    const derSignature = new Uint8Array(response.signature);
    const { r, s } = parseDERSignature(derSignature);
    const normalized = normalizeSignature({ r, s });
    
    // Encode for Safe's WebAuthn module
    const encodedSig = encodeWebAuthnSignature(
        new Uint8Array(response.authenticatorData),
        new TextDecoder().decode(response.clientDataJSON),
        normalized
    );
    
    // Get the Smart Wallet address for this passkey
    const smartWalletAddress = await getPasskeySafeAddress(
        credential.publicKey.x,
        credential.publicKey.y,
        8453 // chainId
    );
    
    return {
        signerAddress: smartWalletAddress,
        signature: encodedSig,
        signatureType: 0, // EIP-1271 (verified by Smart Wallet)
    };
}
```

### Signature Verification Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Vault Multi-Sig Verification Flow                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Transaction Submitted to Vault (Safe)                                   │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────┐                            │
│  │     1. Parse Packed Signatures          │                            │
│  │     (sorted by signer address)          │                            │
│  └─────────────────────────────────────────┘                            │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────┐                            │
│  │     2. For Each Signature:              │                            │
│  │                                          │                            │
│  │     ┌─ Type 0 (Contract) ──────────────┐│                            │
│  │     │  Call isValidSignature() on      ││                            │
│  │     │  signer's Smart Wallet           ││                            │
│  │     │       │                          ││                            │
│  │     │       ▼                          ││                            │
│  │     │  ┌──────────────────────────┐   ││                            │
│  │     │  │ Smart Wallet verifies    │   ││                            │
│  │     │  │ via WebAuthn or EOA      │   ││                            │
│  │     │  └──────────────────────────┘   ││                            │
│  │     └──────────────────────────────────┘│                            │
│  │                                          │                            │
│  │     ┌─ Type 2 (eth_sign) ──────────────┐│                            │
│  │     │  ecrecover with adjusted v       ││                            │
│  │     │  Verify signer == claimed owner  ││                            │
│  │     └──────────────────────────────────┘│                            │
│  │                                          │                            │
│  └─────────────────────────────────────────┘                            │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────┐                            │
│  │     3. Check Threshold Met              │                            │
│  │     (valid signatures >= threshold)     │                            │
│  └─────────────────────────────────────────┘                            │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────┐                            │
│  │     4. Execute Transaction              │                            │
│  │     call(to, value, data)               │                            │
│  └─────────────────────────────────────────┘                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Nonce Management

Each vault transaction must use a unique nonce:

```typescript
/**
 * Get the next available nonce for a vault transaction
 */
export async function getVaultNonce(
    vaultAddress: Address,
    chainId: number
): Promise<bigint> {
    const publicClient = getPublicClient(chainId);
    
    // Check if vault is deployed
    const code = await publicClient.getCode({ address: vaultAddress });
    if (!code || code === '0x') {
        return BigInt(0); // Counterfactual vault starts at 0
    }
    
    return publicClient.readContract({
        address: vaultAddress,
        abi: [{ 
            name: 'nonce', 
            type: 'function', 
            inputs: [], 
            outputs: [{ type: 'uint256' }] 
        }],
        functionName: 'nonce',
    });
}

/**
 * Atomically increment nonce to prevent race conditions
 * Use database-level locking for pending transactions
 */
export async function reserveNonce(
    vaultId: string,
    chainId: number
): Promise<bigint> {
    const { data, error } = await supabase
        .rpc('reserve_vault_nonce', { 
            p_vault_id: vaultId,
            p_chain_id: chainId 
        });
    
    if (error) throw error;
    return BigInt(data);
}
```

---

## Coming Soon

- **Spending limits**: Set individual and collective spending limits
- **Member management**: Add/remove members after creation
- **Push notifications**: Get notified when signatures are needed

---

## Related Documentation

- [Spritz Wallets](/docs/developers/smart-wallets) - Individual wallet documentation
- [Authentication](/docs/developers/authentication) - How users authenticate
- [API Reference](/docs/api/intro) - Complete API documentation

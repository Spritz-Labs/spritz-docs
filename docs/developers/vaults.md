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

## Coming Soon

- **Spending limits**: Set individual and collective spending limits
- **Member management**: Add/remove members after creation
- **Push notifications**: Get notified when signatures are needed

---

## Related Documentation

- [Spritz Wallets](/docs/developers/smart-wallets) - Individual wallet documentation
- [Authentication](/docs/developers/authentication) - How users authenticate
- [API Reference](/docs/api/intro) - Complete API documentation

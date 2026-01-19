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

## Coming Soon

- **Transaction proposals**: Create and sign multi-sig transactions
- **Spending limits**: Set individual and collective spending limits
- **Activity history**: View all vault transactions
- **Member management**: Add/remove members after creation
- **Push notifications**: Get notified when signatures are needed

---

## Related Documentation

- [Spritz Wallets](/docs/developers/smart-wallets) - Individual wallet documentation
- [Authentication](/docs/developers/authentication) - How users authenticate
- [API Reference](/docs/api/intro) - Complete API documentation

# Profile & Settings Guide

Manage your Spritz profile, preferences, and account settings.

## Profile Management

### Profile Information

- **Username**: Set a unique username (optional)
- **Bio**: Add a description about yourself (up to 160 characters)
- **Status**: Share what you're up to
- **Avatar**: Upload or create pixel art avatar
- **Social Links**: Connect Twitter, Farcaster, Lens
- **ENS Name**: Your ENS name is automatically resolved if you have one

### Public Profile

Enable a public landing page for your profile:

1. Go to Settings
2. Toggle "Enable Public Landing Page"
3. Your profile is now visible at `spritz.chat/user/YOUR_ADDRESS`
4. Add a bio to tell visitors about yourself
5. Visitors can see your username, bio, avatar, and social links

**Features:**
- **ENS Resolution**: If you have an ENS name, it displays automatically
- **Public Bio**: Share what you're about with the world
- **Social Links**: Visitors can find your other profiles
- **Avatar Display**: Your pixel art avatar is prominently shown

### Pixel Art Avatars

Create custom 8-bit profile pictures:

1. Go to Profile Settings
2. Click "Edit Avatar"
3. Use the pixel art editor
4. Create your design
5. Save and set as avatar

**Features:**
- 16x16 or 32x32 pixel grid
- Color palette
- Undo/redo
- Export/import designs

### Social Links

Connect your social profiles:

1. Go to Profile Settings
2. Navigate to Social Links
3. Add your profiles:
   - Twitter/X
   - Farcaster
   - Lens Protocol
4. Links appear on your profile

## Wallet Features

### View Balances

See your token balances across 8 supported EVM chains:

1. Go to Settings → Wallet
2. View balances for:
   - ETH, USDC, and other tokens
   - Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Unichain, Avalanche
3. Switch between networks to see chain-specific balances
4. **Trusted Tokens**: Spam tokens are automatically filtered

**Powered by The Graph** for real-time token data.

### Transaction History

View your past transactions:

1. Go to Settings → Wallet → Transactions
2. See all transactions including:
   - Sent/received transfers
   - x402 payments
   - Smart account operations
3. Click any transaction for details on block explorer

### Buy Crypto (Coinbase Onramp)

Purchase crypto directly with fiat currency:

1. Go to Settings → Wallet → Buy Crypto
2. Click "Buy with Card"
3. Select asset (ETH, USDC, etc.)
4. Enter amount in USD
5. Complete purchase via Coinbase Pay
6. Funds arrive in your wallet

**Supported:**
- Credit/debit cards
- Bank transfers (ACH)
- Apple Pay / Google Pay

### Smart Wallet

Your wallet type depends on how you signed in:

| Auth Method | Wallet Owner | How to Sign | Passkey Required? |
|-------------|--------------|-------------|-------------------|
| **EVM Wallet** | Your wallet EOA | Connected wallet | No |
| **Passkey** | Passkey signer | Your passkey | Built-in |
| **Email** | Passkey signer | Your passkey | Must create |
| **World ID** | Passkey signer | Your passkey | Must create |
| **Alien ID** | Passkey signer | Your passkey | Must create |
| **Solana** | Passkey signer | Your passkey | Must create |

**Smart Account Features:**

- **Same Address Everywhere**: One address across all 8 EVM chains
- **Gas Sponsorship**: Free transactions on L2s (Base, Arbitrum, Optimism, Polygon, BNB Chain, Unichain, Avalanche)
- **ERC-20 Gas**: Pay gas in USDC on Ethereum mainnet (no ETH needed)
- **Passkey Signing**: Sign with Face ID, Touch ID, or Windows Hello

> ⚠️ **Important for Email/Digital ID users:** Your passkey controls your wallet. If you delete your passkey, you will lose access to any funds. Use a synced passkey (iCloud Keychain, Google Password Manager) for backup.

### Recovery Signer

Add a backup recovery address to your Smart Wallet for extra security. This allows you to recover funds if you lose access to your passkey.

**How it works:**

1. Go to Settings → Wallet → Security
2. View your Safe deployment status across all chains
3. Click "Add Recovery Signer"
4. Enter a recovery address (another wallet you control)
5. Sign the transaction with your passkey
6. Recovery signer is added as a Safe owner

**Multi-Chain Security:**

Your Safe wallet may be deployed on multiple chains. The security dashboard shows:

| Status | Meaning |
|--------|---------|
| **Deployed** | Safe is active on this chain |
| **Has Recovery** | Recovery signer already added |
| **Needs Recovery** | Has funds but no recovery signer |
| **Not Deployed** | Safe not yet created on this chain |

**Important:**
- Add recovery to chains where you have funds
- Recovery signer can help you recover funds if passkey is lost
- Safe uses 1-of-N threshold, so either signer can approve transactions
- You can manage your Safe directly at [app.safe.global](https://app.safe.global)

## Account Settings

### Verification

**Phone Verification:**
1. Go to Settings → Verification
2. Click "Verify Phone"
3. Enter your phone number
4. Enter verification code
5. Phone number verified

**Email Verification:**
1. Go to Settings → Verification
2. Click "Verify Email"
3. Enter your email
4. Check email for code
5. Enter verification code

### Privacy Settings

- **Profile Visibility**: Control who can see your profile
- **Friend Requests**: Who can send you requests
- **Message Requests**: Who can message you
- **Stream Visibility**: Who can see your streams

### Notification Settings

Configure notifications for:
- **Messages**: New messages from friends
- **Friend Requests**: New friend requests
- **Calls**: Incoming video calls
- **Streams**: Friends going live
- **Agents**: Agent-related notifications

### Push Notifications

Enable browser push notifications:

1. Click "Enable Notifications"
2. Allow browser permissions
3. Configure notification preferences
4. Receive notifications even when app is closed

## Username

### Claim Username

1. Go to Profile Settings
2. Click "Claim Username"
3. Enter desired username
4. Check availability
5. Confirm and claim

**Requirements:**
- 3-20 characters
- Alphanumeric and underscores
- Unique across platform

### Change Username

1. Go to Profile Settings
2. Click "Change Username"
3. Enter new username
4. Confirm change
5. Username updated

## API Reference

### Wallet Endpoints

```typescript
// Get token balances
GET /api/wallet/balances

// Get transaction history
GET /api/wallet/transactions

// Get/create smart wallet address
POST /api/wallet/smart-wallet

// Get recovery signer status
GET /api/wallet/recovery-signer

// Validate recovery address
POST /api/wallet/recovery-signer
{
  "recoveryAddress": "0x..."
}

// Get Safe status across all chains
GET /api/wallet/safe-status?address=0x...&primarySigner=0x...
```

### Get User Profile

```typescript
GET /api/public/user?address=0x...
```

### Update Profile

```typescript
PUT /api/user/profile
{
  "username": "newusername",
  "status": "Status message",
  "socialLinks": {
    "twitter": "@username",
    "farcaster": "username",
    "lens": "lens/username"
  }
}
```

### Upload Pixel Art

```typescript
POST /api/pixel-art/upload
{
  "imageData": "base64...",
  "format": "16x16" | "32x32"
}
```

### Verify Phone

```typescript
POST /api/phone/send-code
{
  "phoneNumber": "+1234567890"
}

POST /api/phone/verify-code
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

### Verify Email

```typescript
POST /api/email/send-code
{
  "email": "user@example.com"
}

POST /api/email/verify-code
{
  "email": "user@example.com",
  "code": "123456"
}
```

## Best Practices

1. **Complete Profile**: Fill out your profile information
2. **Verify Identity**: Verify phone/email for trust
3. **Privacy**: Review privacy settings regularly
4. **Notifications**: Configure to avoid spam
5. **Username**: Choose a memorable username

## Next Steps

- Learn about [Friends](/docs/guides/friends)
- Explore [Groups](/docs/guides/groups)
- Check out [Getting Started](/docs/getting-started)


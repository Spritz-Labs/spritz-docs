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


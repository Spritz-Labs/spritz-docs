---
title: Security - Session Management, Cryptography & Best Practices
description: Security practices in Spritz including session timeout, cryptographically secure randomness, URL validation, input sanitization, and protection against XSS.
keywords:
    [
        Spritz security,
        session timeout,
        cryptographic security,
        URL validation,
        input sanitization,
        XSS prevention,
        security best practices,
        Web3 security,
    ]
---

# Security

Spritz implements comprehensive security measures to protect users from malicious content, XSS attacks, and impersonation attempts.

## URL Security

User-generated content often includes URLs (profile links, widget embeds, social links). Spritz validates all URLs to prevent security vulnerabilities.

### Dangerous URL Detection

The `isDangerousUrl` function blocks potentially malicious URL schemes:

```typescript
export function isDangerousUrl(url: string): boolean {
    if (!url) return true;
    
    const trimmed = url.trim().toLowerCase();
    
    // Block dangerous protocols
    if (trimmed.startsWith('javascript:')) return true;
    if (trimmed.startsWith('data:') && !trimmed.startsWith('data:image/')) return true;
    if (trimmed.startsWith('vbscript:')) return true;
    if (trimmed.startsWith('file:')) return true;
    
    // Block URLs with encoded dangerous characters
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith('javascript:')) return true;
    
    return false;
}
```

**Blocked protocols:**
- `javascript:` - Prevents XSS attacks
- `data:` - Blocked except for `data:image/` (base64 images)
- `vbscript:` - Legacy but still dangerous
- `file:` - Prevents local file access

### URL Sanitization

All URLs are sanitized before use:

```typescript
export function sanitizeUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    
    const trimmed = url.trim();
    
    if (isDangerousUrl(trimmed)) {
        console.warn('[Security] Blocked dangerous URL:', trimmed.substring(0, 50));
        return null;
    }
    
    if (!isSafeProtocol(trimmed)) {
        console.warn('[Security] Blocked non-http(s) URL:', trimmed.substring(0, 50));
        return null;
    }
    
    return trimmed;
}
```

### Social Platform Validation

Social links are validated against known domains to prevent phishing:

```typescript
const SOCIAL_DOMAINS: Record<string, string[]> = {
    twitter: ['twitter.com', 'x.com'],
    github: ['github.com'],
    linkedin: ['linkedin.com', 'www.linkedin.com'],
    instagram: ['instagram.com', 'www.instagram.com'],
    youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
    tiktok: ['tiktok.com', 'www.tiktok.com'],
    discord: ['discord.gg', 'discord.com'],
    telegram: ['t.me', 'telegram.me'],
    farcaster: ['warpcast.com'],
    website: [], // Allow any for generic website
};

export function validateSocialUrl(platform: string, url: string): boolean {
    const allowedDomains = SOCIAL_DOMAINS[platform.toLowerCase()];
    
    // If no domain restriction, just check it's safe
    if (!allowedDomains || allowedDomains.length === 0) {
        return !isDangerousUrl(url) && isSafeProtocol(url);
    }
    
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
        
        return allowedDomains.some(domain => 
            hostname === domain || hostname === `www.${domain}`
        );
    } catch {
        return false;
    }
}
```

### Embed URL Validation

Video and music embeds are restricted to trusted platforms:

```typescript
const EMBED_DOMAINS: Record<string, string[]> = {
    spotify: ['open.spotify.com'],
    youtube: ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com'],
    vimeo: ['player.vimeo.com', 'vimeo.com'],
    loom: ['loom.com', 'www.loom.com'],
    twitter: ['twitter.com', 'x.com', 'platform.twitter.com'],
    instagram: ['instagram.com', 'www.instagram.com'],
};
```

### Image URL Sanitization

Image URLs support both regular URLs and base64 data URLs:

```typescript
export function sanitizeImageUrl(
    url: string | undefined | null, 
    strict: boolean = false
): string | null {
    if (!url) return null;
    
    const trimmed = url.trim();
    
    // Allow data:image URLs (for base64 encoded images)
    if (trimmed.startsWith('data:image/')) {
        // Limit size to prevent abuse
        if (trimmed.length > 100000) {
            console.warn('[Security] Blocked oversized data URL');
            return null;
        }
        return trimmed;
    }
    
    if (isDangerousUrl(trimmed)) return null;
    if (!isSafeProtocol(trimmed)) return null;
    
    return trimmed;
}
```

**Trusted image domains** (optional strict mode):
- CDNs: Unsplash, Imgur, Cloudinary, jsDelivr
- Social: Twitter, GitHub avatars
- NFT: IPFS, OpenSea, Alchemy
- Spritz: app.spritz.chat, spritz.chat

### Video URL Parsing

Video URLs are converted to safe embed URLs:

```typescript
export function sanitizeVideoUrl(
    platform: 'youtube' | 'vimeo' | 'loom', 
    input: string
): { embedUrl: string; videoId: string } | null {
    // YouTube: Extract video ID and create nocookie embed
    // Returns: https://www.youtube-nocookie.com/embed/{videoId}
    
    // Vimeo: Extract video ID
    // Returns: https://player.vimeo.com/video/{videoId}
    
    // Loom: Extract share ID
    // Returns: https://www.loom.com/embed/{shareId}
}
```

### Safe External Link Props

When rendering external links, use safe props:

```typescript
export function getSafeExternalLinkProps(url: string | null) {
    if (!url || isDangerousUrl(url)) {
        return {
            href: '#',
            onClick: (e: React.MouseEvent) => e.preventDefault(),
        };
    }
    
    return {
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
    };
}
```

**Always include:**
- `target="_blank"` - Opens in new tab
- `rel="noopener noreferrer nofollow"` - Prevents tab hijacking and referrer leaks

## Input Sanitization

All user inputs are sanitized before storage:

```typescript
import { sanitizeInput, INPUT_LIMITS } from "@/lib/sanitize";

// Sanitize with length limits
const sanitizedName = sanitizeInput(username, INPUT_LIMITS.USERNAME);
```

### Input Limits

| Field | Max Length |
|-------|------------|
| Username | 20 characters |
| Display Name | 50 characters |
| Bio | 500 characters |
| Message | 4000 characters |
| Agent Personality | 1000 characters |

## Reserved Usernames

To prevent impersonation and scams, certain usernames are reserved:

### Blocked Categories

**Brand names:**
- `spritz`, `spritzapp`, `spritzchat`, `spritz_support`, etc.

**Official roles:**
- `admin`, `administrator`, `support`, `moderator`, `staff`, `team`

**Security terms:**
- `security`, `root`, `sysadmin`, `webmaster`

**Financial terms:**
- `wallet`, `vault`, `treasury`, `payment`, `billing`

**Authority titles:**
- `ceo`, `cto`, `founder`, `developer`, `owner`

**Scam prevention:**
- `giveaway`, `airdrop`, `prize`, `verify`, `claim`

**Known figures:**
- `vitalik`, `satoshi`, `elon`

### Blocked Patterns

Prefixes that are blocked:
- `spritz_*`, `official_*`, `support_*`, `admin_*`, `mod_*`, `team_*`

Suffixes that are blocked:
- `*_official`, `*_support`, `*_admin`, `*_verified`

### Implementation

```typescript
function isReservedUsername(username: string): boolean {
    const normalized = username.toLowerCase();
    
    // Direct match against reserved list
    if (RESERVED_USERNAMES.has(normalized)) {
        return true;
    }
    
    // Check blocked prefixes
    const reservedPrefixes = ["spritz_", "official_", "support_"];
    for (const prefix of reservedPrefixes) {
        if (normalized.startsWith(prefix)) return true;
    }
    
    // Check blocked suffixes
    const reservedSuffixes = ["_official", "_support", "_admin", "_verified"];
    for (const suffix of reservedSuffixes) {
        if (normalized.endsWith(suffix)) return true;
    }
    
    return false;
}
```

## Contract Address Validation

For NFT widgets and Web3 features:

```typescript
export function isValidContractAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
```

## Centralized Logging

Spritz uses a centralized logger to control log output:

```typescript
import { createLogger } from "@/lib/logger";

const authLogger = createLogger('Auth');

// In production: only errors logged
// In development: all logs shown
// Debug mode: localStorage.setItem('spritz_debug', 'true')

authLogger.debug('Debug message');  // Only in dev or debug mode
authLogger.info('Info message');    // Only in dev or debug mode
authLogger.warn('Warning');         // Always logged
authLogger.error('Error');          // Always logged
```

### Pre-configured Loggers

```typescript
import { 
    authLogger, 
    chatLogger, 
    callLogger, 
    walletLogger, 
    apiLogger 
} from "@/lib/logger";
```

### Enabling Debug Mode

In browser console:
```javascript
localStorage.setItem('spritz_debug', 'true');
// Reload page to see debug logs
```

## Session Security

### Session Timeout & Lock Screen

Spritz implements automatic session locking to protect users who leave their devices unattended.

**Default Timeouts:**
| Scenario | Timeout |
|----------|---------|
| Active session (no activity) | 15 minutes |
| App backgrounded | 1 minute |
| Warning before lock | 1 minute |

```typescript
import { useInactivityMonitor, useSessionLock } from '@/hooks/useInactivityMonitor';

function App() {
    const { lock, unlock, isLocked, lockReason } = useSessionLock();
    
    const { resetActivity, isWarningShown, timeRemaining } = useInactivityMonitor({
        timeout: 15 * 60 * 1000,       // 15 minutes
        backgroundTimeout: 60 * 1000,   // 1 minute when backgrounded
        warningThreshold: 60 * 1000,    // Show warning 1 min before lock
        onInactive: () => lock('inactivity'),
        onWarning: () => console.log('Session will lock soon'),
    });

    // Show lock screen when session is locked
    if (isLocked) {
        return <SessionLockScreen onUnlock={unlock} reason={lockReason} />;
    }
    
    // Show warning banner when about to lock
    if (isWarningShown && timeRemaining) {
        return <div>Session locking in {timeRemaining}s</div>;
    }
    
    return <MainApp />;
}
```

**Unlock Options:**
- Re-authenticate with passkey
- Sign with connected wallet
- Manual unlock (if recently authenticated)

### CSRF Protection

Sessions include origin validation:

```typescript
// Validate request origin matches expected domains
const allowedOrigins = [
    'https://app.spritz.chat',
    'https://spritz.chat',
];

if (!allowedOrigins.includes(request.headers.get('origin'))) {
    return new Response('Invalid origin', { status: 403 });
}
```

### HttpOnly Cookies

Session tokens are stored in HttpOnly cookies:

```typescript
response.cookies.set('spritz_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
});
```

### Token Expiration

- Session tokens: 7 days
- Passkey challenges: 5 minutes
- Verification codes: 10 minutes

## Cryptographically Secure Randomness

Spritz uses `crypto.getRandomValues()` for all security-sensitive random generation. **Never use `Math.random()` for security purposes.**

### Available Functions

```typescript
import { 
    secureRandomString,
    secureVerificationCode,
    secureRandomHex,
    secureUUID,
    secureRecoveryToken,
    secureInviteCode,
} from '@/lib/secureRandom';
```

### Verification Codes

6-digit numeric codes with rejection sampling to avoid modulo bias:

```typescript
const code = secureVerificationCode();
// Returns: "847291" (6 digits, always padded)
```

Uses rejection sampling: if the random number falls in the "bias zone" (0.02% of cases), it retries for uniform distribution.

### Invite Codes

URL-safe codes without ambiguous characters (0, O, I, 1, L excluded):

```typescript
const invite = secureInviteCode(8);
// Returns: "KJ7HNPRQ"
```

### Recovery Tokens

URL-safe base64 tokens for password reset, etc.:

```typescript
const token = secureRecoveryToken(32);
// Returns: "aB3dEfGh1jKlMnOp..."
```

### Hex Strings

For cryptographic keys and hashes:

```typescript
const hex = secureRandomHex(32);
// Returns: "0x8a7b3c..."  (64 hex chars = 32 bytes)
```

### Usage Guidelines

| Use Case | Function | Example |
|----------|----------|---------|
| Email verification | `secureVerificationCode()` | "847291" |
| Invite codes | `secureInviteCode(8)` | "KJ7HNPRQ" |
| Password reset | `secureRecoveryToken(32)` | URL-safe string |
| Transaction nonces | `secureRandomHex(32)` | "0x..." |
| UUIDs | `secureUUID()` | RFC 4122 UUID |

**DO use `Math.random()` for:**
- UI animations
- Non-security log IDs
- Shuffle for display only

---

## Best Practices

### For Widget Content

1. **Always sanitize URLs** before rendering
2. **Validate embed domains** for video/audio content
3. **Limit data URL sizes** for images
4. **Use safe link props** for external links

### For User Input

1. **Apply length limits** to all text inputs
2. **Sanitize HTML** (strip dangerous tags)
3. **Validate usernames** against reserved list
4. **Normalize addresses** (lowercase for EVM)

### For API Endpoints

1. **Verify session** for authenticated routes
2. **Check origin headers** for CSRF protection
3. **Rate limit** to prevent abuse
4. **Log security events** for audit trail

## Security Headers

Recommended headers for production:

```typescript
const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

## Related Documentation

- [Authentication](/docs/developers/authentication) - SIWE/SIWS and passkey flows
- [Spritz Wallets](/docs/developers/smart-wallets) - Wallet security
- [Social Vaults](/docs/developers/vaults) - Multi-sig security
- [Database Schema](/docs/database/schema) - Data model and constraints


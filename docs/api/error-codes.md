---
title: API Error Reference
description: Complete reference for all Spritz API error codes, HTTP status codes, and troubleshooting guidance.
keywords:
    [
        Spritz API errors,
        error codes,
        HTTP status codes,
        API troubleshooting,
        error handling,
    ]
sidebar_label: Error Codes
---

# API Error Reference

This document provides a complete reference for all error codes returned by the Spritz API.

## Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description"
  }
}
```

Some errors include additional fields:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

## HTTP Status Codes

### 4xx Client Errors

| Status | Code | Description | Action |
|--------|------|-------------|--------|
| **400** | `VALIDATION_ERROR` | Invalid request data | Check request body and parameters |
| **400** | `INVALID_PARAMETER` | Missing or invalid parameter | Review required parameters |
| **401** | `UNAUTHORIZED` | No valid session | Re-authenticate with SIWE/SIWS |
| **401** | `SESSION_EXPIRED` | Session token expired | Generate new session |
| **401** | `INVALID_SIGNATURE` | Signature verification failed | Re-sign the message |
| **402** | `PAYMENT_REQUIRED` | x402 payment needed | Send payment via X-Payment header |
| **403** | `FORBIDDEN` | Insufficient permissions | Check user permissions |
| **403** | `ACCESS_DENIED` | Resource not accessible | Verify ownership or visibility |
| **404** | `NOT_FOUND` | Resource doesn't exist | Verify resource ID |
| **404** | `AGENT_NOT_FOUND` | Agent doesn't exist | Check agent ID |
| **404** | `STREAM_NOT_FOUND` | Stream doesn't exist | Check stream ID |
| **404** | `USER_NOT_FOUND` | User doesn't exist | Check wallet address |
| **409** | `CONFLICT` | Resource already exists | Handle duplicate |
| **409** | `USERNAME_TAKEN` | Username already claimed | Choose different username |
| **429** | `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |

### 5xx Server Errors

| Status | Code | Description | Action |
|--------|------|-------------|--------|
| **500** | `INTERNAL_ERROR` | Server error | Retry with exponential backoff |
| **500** | `DATABASE_ERROR` | Database operation failed | Retry later |
| **502** | `UPSTREAM_ERROR` | External service error | Retry later |
| **503** | `SERVICE_UNAVAILABLE` | Service temporarily down | Check status page |
| **504** | `TIMEOUT` | Request timed out | Retry with smaller payload |

---

## Authentication Errors

### SIWE/SIWS Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_NONCE` | Nonce expired or already used | Request new nonce via `GET /api/auth/verify?address=...` |
| `INVALID_SIGNATURE` | Signature doesn't match address | Re-sign the SIWE message |
| `NONCE_EXPIRED` | Nonce older than 5 minutes | Request new nonce |
| `INVALID_DOMAIN` | Domain mismatch | Ensure domain is `app.spritz.chat` |
| `CHAIN_NOT_SUPPORTED` | Unsupported chain ID | Use supported chain (see [Authentication](/docs/developers/authentication)) |

### Passkey Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `PASSKEY_NOT_FOUND` | Credential not registered | Register new passkey |
| `PASSKEY_VERIFICATION_FAILED` | WebAuthn verification failed | Check credential ID |
| `CHALLENGE_EXPIRED` | Challenge older than 5 minutes | Get new challenge |
| `INVALID_AUTHENTICATOR` | Authenticator not recognized | Use registered device |
| `PASSKEY_ALREADY_REGISTERED` | Passkey already exists | Use existing passkey |

### Session Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `SESSION_EXPIRED` | JWT token expired | Re-authenticate |
| `SESSION_INVALID` | Token tampered or invalid | Re-authenticate |
| `SESSION_NOT_FOUND` | Session doesn't exist | Create new session |

---

## Agent Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `AGENT_NOT_FOUND` | Agent ID doesn't exist | Verify agent ID |
| `AGENT_NOT_PUBLIC` | Private agent accessed without auth | Use authenticated endpoint or contact owner |
| `AGENT_LIMIT_REACHED` | Maximum agents per user reached | Delete unused agents |
| `KNOWLEDGE_INDEXING` | Knowledge base still processing | Wait and retry |
| `KNOWLEDGE_FAILED` | Knowledge indexing failed | Check URL accessibility |
| `X402_NOT_ENABLED` | Agent doesn't accept payments | Contact agent owner |
| `X402_PAYMENT_FAILED` | Payment verification failed | Check payment parameters |
| `INVALID_MODEL` | Unsupported AI model specified | Use supported model |
| `CHAT_HISTORY_NOT_FOUND` | Session doesn't exist | Start new session |

### Agent Visibility Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `AGENT_PRIVATE` | Agent is private | Must be owner to access |
| `AGENT_FRIENDS_ONLY` | Agent limited to friends | Add owner as friend |

---

## Streaming Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `STREAM_NOT_FOUND` | Stream doesn't exist | Verify stream ID |
| `STREAM_NOT_LIVE` | Stream is not currently live | Wait for broadcaster |
| `STREAM_ENDED` | Stream has ended | Check for recordings |
| `LIVEPEER_ERROR` | Livepeer API error | Retry later |
| `INVALID_STREAM_KEY` | Stream key invalid | Regenerate stream |
| `RECORDING_NOT_READY` | Recording still processing | Wait for processing |

---

## Wallet Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `WALLET_NOT_FOUND` | Wallet address not registered | Create account first |
| `SAFE_NOT_DEPLOYED` | Smart wallet not deployed | Deploy Safe first |
| `INSUFFICIENT_BALANCE` | Not enough tokens | Add funds |
| `TRANSACTION_FAILED` | Transaction reverted | Check parameters |
| `CHAIN_NOT_SUPPORTED` | Chain not supported | Use supported chain |

---

## Rate Limiting Errors

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705600000
Retry-After: 60
```

### Rate Limit Tiers

| Tier | Limit | Endpoints |
|------|-------|-----------|
| `auth` | 10/min | `/api/auth/*`, `/api/passkey/*` |
| `strict` | 5/min | `/api/invites`, `/api/points/*`, `/api/streams` |
| `contact` | 3/min | `/api/contact` |
| `ai` | 30/min | `/api/agents/*/chat` |
| `messaging` | 60/min | `/api/channels/*/messages` |
| `general` | 100/min | All other endpoints |

---

## x402 Payment Errors

### 402 Response

```json
{
  "error": "Payment Required",
  "message": "This API requires a payment of $0.01 USDC",
  "paymentRequirements": {
    "x402Version": 1,
    "accepts": [
      {
        "network": "base-sepolia",
        "token": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "amount": "10000",
        "recipient": "0x..."
      }
    ]
  }
}
```

### Payment Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `PAYMENT_REQUIRED` | No payment provided | Send X-Payment header |
| `INVALID_PAYMENT` | Payment verification failed | Check payment format |
| `INSUFFICIENT_PAYMENT` | Payment amount too low | Increase payment amount |
| `WRONG_NETWORK` | Payment on wrong network | Use Base or Base Sepolia |
| `PAYMENT_EXPIRED` | Payment proof expired | Generate new payment |

---

## Error Handling Best Practices

### Exponential Backoff

For 5xx errors, implement exponential backoff:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### Rate Limit Handling

```typescript
async function fetchWithRateLimit(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    
    await new Promise(r => setTimeout(r, waitTime));
    return fetch(url, options);
  }
  
  return response;
}
```

### Error Type Checking

```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}

function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}

// Usage
const data = await response.json();

if (isApiError(data)) {
  switch (data.error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      // Handle rate limiting
      break;
    case 'UNAUTHORIZED':
      // Redirect to login
      break;
    default:
      // Show error message
      console.error(data.error.message);
  }
}
```

---

## Related Documentation

- [API Overview](/docs/api/intro) - Authentication and general API usage
- [Authentication](/docs/developers/authentication) - SIWE/SIWS and passkey flows
- [x402 Monetization](/docs/agents/x402) - Payment integration


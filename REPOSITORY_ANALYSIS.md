# Spritz Repository - Technical Analysis & Organization Report

**Generated:** 2024  
**Repository:** `/Users/kevinjones/eth-akash`  
**Project:** Spritz - Decentralized Social Platform

---

## Executive Summary

Spritz is a **full-stack Next.js 16 web application** built with TypeScript, React 19, and Supabase. It's a comprehensive decentralized social platform featuring AI agents, livestreaming, video calls, messaging, and Web3 authentication. The codebase is well-structured but could benefit from better organization, documentation, and some cleanup.

**Overall Assessment:** ⭐⭐⭐⭐ (4/5)

-   **Strengths:** Modern tech stack, comprehensive features, good separation of concerns
-   **Areas for Improvement:** Documentation, test coverage, code organization, missing critical files

---

## 1. Repository Analysis

### 1.1 Programming Languages & Technologies

| Category          | Technology            | Version        | Purpose                     |
| ----------------- | --------------------- | -------------- | --------------------------- |
| **Framework**     | Next.js               | 16.0.7         | App Router, SSR, API Routes |
| **Language**      | TypeScript            | 5.x            | Type-safe development       |
| **UI Library**    | React                 | 19.2.0         | Component framework         |
| **Styling**       | Tailwind CSS          | 4.x            | Utility-first CSS           |
| **Database**      | Supabase (PostgreSQL) | -              | Data persistence, Realtime  |
| **Vector DB**     | pgvector              | -              | Embedding search (RAG)      |
| **AI/LLM**        | Google Gemini         | 2.0 Flash      | AI agent responses          |
| **Embeddings**    | text-embedding-004    | -              | Vector embeddings (768-dim) |
| **Web3 (EVM)**    | viem, wagmi           | 3.x, 2.x       | Ethereum/Base interactions  |
| **Web3 (Solana)** | @solana/web3.js       | 1.98.4         | Solana interactions         |
| **Wallet**        | Reown AppKit          | 1.8.14         | WalletConnect integration   |
| **Video Calls**   | Huddle01              | 2.6.x          | WebRTC video/voice          |
| **Streaming**     | Livepeer              | 4.3.6          | WebRTC/WHIP + HLS           |
| **Messaging**     | Waku Protocol         | 0.0.36         | P2P messaging               |
| **Payments**      | x402 Protocol         | -              | Micropayments               |
| **3D Graphics**   | Three.js + R3F        | 0.182.0, 9.4.2 | 3D visualizations           |
| **Animations**    | Motion (Framer)       | 12.23.25       | UI animations               |

### 1.2 Project Type

**Type:** Full-Stack Web Application (PWA)  
**Architecture:** Monorepo with Next.js App Router  
**Deployment:** Vercel (production), Supabase (database)

### 1.3 Current Directory Structure

```
eth-akash/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (50+ endpoints)
│   │   ├── admin/             # Admin pages
│   │   ├── agent/             # Agent pages
│   │   ├── landing/           # Landing page
│   │   ├── live/              # Livestream pages
│   │   └── ...
│   ├── components/            # React components (60+ files)
│   ├── context/               # React Context providers (4)
│   ├── hooks/                 # Custom React hooks (35+)
│   ├── lib/                   # Utility libraries (4)
│   ├── types/                 # TypeScript types (empty!)
│   ├── utils/                 # Helper functions (1)
│   └── middleware.ts          # Next.js middleware
├── migrations/                # SQL migration files (24)
├── public/                    # Static assets
├── scripts/                   # Build scripts
├── worker/                    # Service worker
├── package.json
├── tsconfig.json
├── next.config.mjs
├── eslint.config.mjs
└── README.md
```

### 1.4 Configuration Files

✅ **Present:**

-   `package.json` - Dependencies and scripts
-   `tsconfig.json` - TypeScript configuration
-   `next.config.mjs` - Next.js configuration (with PWA)
-   `eslint.config.mjs` - ESLint configuration
-   `postcss.config.mjs` - PostCSS configuration
-   `vercel.json` - Vercel deployment config
-   `.gitignore` - Git ignore rules

❌ **Missing:**

-   `.env.example` - **CRITICAL:** Environment variable template
-   `.prettierrc` - Code formatting configuration
-   `jest.config.js` or `vitest.config.ts` - Test configuration
-   `CONTRIBUTING.md` - Contribution guidelines
-   `CHANGELOG.md` - Version history
-   `ARCHITECTURE.md` - System architecture documentation

### 1.5 Dependencies Analysis

**Total Dependencies:** 48 production, 5 dev  
**Package Manager:** Yarn 3.2.3 (but package-lock.json exists - inconsistency!)

**Key Dependencies:**

-   ✅ Modern and up-to-date
-   ✅ Well-maintained packages
-   ⚠️ Some potential duplicates (Agora + Huddle01 for video)
-   ⚠️ Large bundle size (Three.js, multiple Web3 libraries)

**Security Concerns:**

-   No `.env.example` file - developers may commit secrets
-   Need to audit dependencies for vulnerabilities

---

## 2. Code Structure Assessment

### 2.1 Source Code Inventory

| Category              | Count | Location          | Status                  |
| --------------------- | ----- | ----------------- | ----------------------- |
| **API Routes**        | 50+   | `src/app/api/`    | ✅ Well organized       |
| **React Components**  | 60+   | `src/components/` | ⚠️ Flat structure       |
| **Custom Hooks**      | 35+   | `src/hooks/`      | ✅ Good separation      |
| **Context Providers** | 4     | `src/context/`    | ✅ Minimal, focused     |
| **Library Utils**     | 4     | `src/lib/`        | ✅ Clean                |
| **Type Definitions**  | 0     | `src/types/`      | ❌ **EMPTY - CRITICAL** |
| **Helper Utils**      | 1     | `src/utils/`      | ⚠️ Underutilized        |
| **Pages**             | 15+   | `src/app/`        | ✅ App Router structure |
| **Migrations**        | 24    | `migrations/`     | ✅ Well organized       |

**Total Lines of Code (Components):** ~29,291 lines

### 2.2 Main Entry Points

1. **Application Entry:** `src/app/layout.tsx` - Root layout
2. **Home Page:** `src/app/page.tsx` - Main dashboard
3. **API Entry:** `src/app/api/` - REST API endpoints
4. **Middleware:** `src/middleware.ts` - Request interception

### 2.3 Critical Modules

**Core Functionality:**

-   `src/context/AuthProvider.tsx` - Authentication state
-   `src/context/WakuProvider.tsx` - Messaging infrastructure
-   `src/context/Web3Provider.tsx` - Wallet connections
-   `src/lib/x402.ts` - Payment processing
-   `src/lib/livepeer.ts` - Streaming utilities

**Feature Modules:**

-   `src/hooks/useAgents.ts` - AI agent management
-   `src/hooks/useStreams.ts` - Livestreaming
-   `src/hooks/useWaku.ts` - P2P messaging
-   `src/hooks/useHuddle01Call.ts` - Video calls

### 2.4 Dependency Mapping

```
App Layout
├── AuthProvider (SIWE/SIWS)
│   ├── Web3Provider (Wallet connections)
│   └── PasskeyProvider (ERC-4337)
├── WakuProvider (Messaging)
└── Dashboard
    ├── AgentsSection → useAgents
    ├── ChatModal → useWaku
    ├── VoiceCallUI → useHuddle01Call
    └── GoLiveModal → useStreams
```

### 2.5 Test Coverage

❌ **No test files found!**

-   No `__tests__/` directory
-   No `.test.ts` or `.spec.ts` files
-   No test configuration
-   **CRITICAL:** Zero test coverage

---

## 3. Documentation Inventory

### 3.1 Existing Documentation

✅ **Present:**

-   `README.md` - Comprehensive feature list and setup guide (595 lines)
-   Inline code comments - Moderate coverage
-   Migration files - Well-documented SQL

❌ **Missing:**

-   `ARCHITECTURE.md` - System design documentation
-   `CONTRIBUTING.md` - Contribution guidelines
-   `CHANGELOG.md` - Version history
-   `API.md` - API documentation (separate from README)
-   JSDoc comments - Limited TypeScript documentation
-   Component documentation - No Storybook or similar
-   Architecture diagrams - No visual documentation

### 3.2 Documentation Quality

**README.md:** ⭐⭐⭐⭐ (4/5)

-   Comprehensive feature list
-   Good setup instructions
-   Missing: Architecture overview, API reference, troubleshooting

**Code Comments:** ⭐⭐⭐ (3/5)

-   Some functions documented
-   Missing: JSDoc format, parameter descriptions
-   Inconsistent commenting style

**Migration Files:** ⭐⭐⭐⭐⭐ (5/5)

-   Well-commented SQL
-   Clear migration order
-   Good documentation

### 3.3 Undocumented Areas

1. **Type Definitions** - `src/types/` is empty, types likely scattered
2. **API Endpoints** - No comprehensive API documentation
3. **Component Props** - No prop documentation
4. **State Management** - No architecture docs for state flow
5. **Error Handling** - No error handling strategy documented

---

## 4. Organizational Structure Proposal

### 4.1 Current Issues

1. **Flat Component Structure** - All 60+ components in one directory
2. **Empty Types Directory** - Types likely scattered across files
3. **Missing Utils Organization** - Only one utility file
4. **No Constants File** - Magic numbers/strings scattered
5. **No Shared Components** - No distinction between feature and shared components

### 4.2 Proposed Structure

```
src/
├── app/                          # Next.js App Router (keep as-is)
│   ├── api/                      # API routes
│   └── [pages]/                  # Pages
│
├── components/                   # REORGANIZE
│   ├── ui/                       # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── agents/                   # Agent-related components
│   │   ├── AgentChatModal.tsx
│   │   ├── CreateAgentModal.tsx
│   │   └── ...
│   ├── streaming/                # Streaming components
│   │   ├── GoLiveModal.tsx
│   │   ├── LiveStreamPlayer.tsx
│   │   └── ...
│   ├── chat/                     # Chat components
│   │   ├── ChatModal.tsx
│   │   ├── GroupChatModal.tsx
│   │   └── ...
│   ├── calls/                    # Video call components
│   │   ├── VoiceCallUI.tsx
│   │   ├── GroupCallUI.tsx
│   │   └── ...
│   └── layout/                   # Layout components
│       ├── Dashboard.tsx
│       └── ...
│
├── lib/                          # REORGANIZE
│   ├── api/                      # API clients
│   │   ├── supabase.ts
│   │   ├── livepeer.ts
│   │   └── x402.ts
│   ├── services/                 # External services
│   │   ├── gemini.ts
│   │   ├── huddle01.ts
│   │   └── waku.ts
│   └── utils/                    # Utility functions
│       ├── address.ts
│       ├── timezone.ts
│       └── validation.ts
│
├── hooks/                        # Keep as-is (well organized)
│   ├── agents/
│   ├── streaming/
│   └── ...
│
├── types/                        # CREATE & ORGANIZE
│   ├── index.ts                  # Re-export all types
│   ├── agent.ts                  # Agent types
│   ├── stream.ts                 # Streaming types
│   ├── user.ts                   # User types
│   ├── api.ts                    # API response types
│   └── database.ts               # Database schema types
│
├── constants/                     # CREATE
│   ├── index.ts
│   ├── networks.ts               # Chain configurations
│   ├── routes.ts                 # Route paths
│   └── config.ts                 # App configuration
│
├── context/                      # Keep as-is
│
└── utils/                        # EXPAND
    ├── address.ts                # Keep
    ├── format.ts                 # Formatting utilities
    ├── validation.ts             # Validation helpers
    └── errors.ts                 # Error handling
```

### 4.3 Migration Steps

**Phase 1: Critical (Week 1)**

1. Create `.env.example` file
2. Create `src/types/` with proper type definitions
3. Create `src/constants/` for configuration
4. Add missing documentation files

**Phase 2: Organization (Week 2)**

1. Reorganize `src/components/` into feature folders
2. Expand `src/lib/` structure
3. Create shared UI components
4. Consolidate utility functions

**Phase 3: Quality (Week 3)**

1. Add test infrastructure
2. Add JSDoc comments
3. Create architecture documentation
4. Set up linting/formatting

---

## 5. Technical Debt & Quality Assessment

### 5.1 Code Quality Issues

**Critical:**

1. ❌ **No Type Definitions** - `src/types/` is empty
2. ❌ **No Tests** - Zero test coverage
3. ❌ **No .env.example** - Security risk
4. ⚠️ **Package Manager Inconsistency** - Yarn specified but package-lock.json exists

**High Priority:**

1. ⚠️ **Flat Component Structure** - 60+ components in one folder
2. ⚠️ **Scattered Types** - Types defined inline instead of centralized
3. ⚠️ **No Error Boundaries** - Missing React error boundaries
4. ⚠️ **No Loading States** - Inconsistent loading state handling

**Medium Priority:**

1. ⚠️ **Duplicate Video Libraries** - Both Agora and Huddle01
2. ⚠️ **Large Bundle Size** - Three.js and multiple Web3 libs
3. ⚠️ **No Code Splitting Strategy** - All code in main bundle
4. ⚠️ **Inconsistent Error Handling** - Different patterns across codebase

### 5.2 Security Concerns

1. ⚠️ **Missing .env.example** - Developers may commit secrets
2. ⚠️ **No Dependency Audit** - Need to check for vulnerabilities
3. ⚠️ **API Keys in Code** - Verify no hardcoded keys
4. ⚠️ **No Rate Limiting Documentation** - Rate limits not clearly documented

### 5.3 Dead Code & Unused Files

**Potentially Unused:**

-   `empty-module.js` - Purpose unclear
-   `src/config/agora.ts` - Agora config but Huddle01 is primary
-   `landing-page-example/` - Example code that may not be used

**Needs Review:**

-   Multiple video call implementations (Agora vs Huddle01)
-   Unused hooks or components

### 5.4 Missing Critical Files

1. ❌ `.env.example` - **CRITICAL**
2. ❌ `ARCHITECTURE.md`
3. ❌ `CONTRIBUTING.md`
4. ❌ `CHANGELOG.md`
5. ❌ Test configuration files
6. ❌ `.prettierrc` or formatting config
7. ❌ `Dockerfile` (if containerization needed)

---

## 6. Comprehensive Report

### 6.1 Project Overview

**Purpose:** Decentralized social platform with AI agents, livestreaming, video calls, and Web3 messaging

**Architecture:**

-   **Frontend:** Next.js 16 App Router, React 19, TypeScript
-   **Backend:** Next.js API Routes, Supabase (PostgreSQL + Realtime)
-   **AI:** Google Gemini 2.0 Flash with RAG (pgvector)
-   **Streaming:** Livepeer (WebRTC/WHIP + HLS)
-   **Video:** Huddle01 (WebRTC)
-   **Messaging:** Waku Protocol (P2P)
-   **Payments:** x402 Protocol (Base network)

**Deployment:** Vercel (frontend), Supabase (database)

### 6.2 File Inventory

**Total Files Analyzed:** 200+

| Category     | Count | Status                  |
| ------------ | ----- | ----------------------- |
| API Routes   | 50+   | ✅ Well organized       |
| Components   | 60+   | ⚠️ Needs organization   |
| Hooks        | 35+   | ✅ Good structure       |
| Migrations   | 24    | ✅ Well documented      |
| Config Files | 6     | ✅ Complete             |
| Type Files   | 0     | ❌ **CRITICAL MISSING** |
| Test Files   | 0     | ❌ **CRITICAL MISSING** |

### 6.3 Dependency Map

```
┌─────────────────────────────────────────┐
│         Next.js Application            │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Supabase │  │ Livepeer │  │  Gemini  │
│ (DB+RAG) │  │(Streaming)│  │   (AI)   │
└──────────┘  └──────────┘  └──────────┘
        │           │           │
        ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Waku    │  │ Huddle01 │  │   x402   │
│(Messaging)│  │ (Video)  │  │(Payments)│
└──────────┘  └──────────┘  └──────────┘
```

### 6.4 Documentation Status

| Document         | Status     | Quality  | Priority        |
| ---------------- | ---------- | -------- | --------------- |
| README.md        | ✅ Present | ⭐⭐⭐⭐ | -               |
| ARCHITECTURE.md  | ❌ Missing | -        | 🔴 High         |
| CONTRIBUTING.md  | ❌ Missing | -        | 🟡 Medium       |
| CHANGELOG.md     | ❌ Missing | -        | 🟡 Medium       |
| API.md           | ❌ Missing | -        | 🔴 High         |
| .env.example     | ❌ Missing | -        | 🔴 **CRITICAL** |
| Code Comments    | ⚠️ Partial | ⭐⭐⭐   | 🟡 Medium       |
| Type Definitions | ❌ Missing | -        | 🔴 **CRITICAL** |

### 6.5 Reorganization Plan

**Priority 1 (Critical - Week 1):**

1. Create `.env.example` with all required variables
2. Create `src/types/` directory with proper type definitions
3. Create `ARCHITECTURE.md` documenting system design
4. Add missing configuration files

**Priority 2 (High - Week 2):**

1. Reorganize components into feature folders
2. Create shared UI components library
3. Expand `src/lib/` with proper structure
4. Create `src/constants/` for configuration

**Priority 3 (Medium - Week 3):**

1. Set up test infrastructure (Jest/Vitest)
2. Add JSDoc comments to all functions
3. Create `CONTRIBUTING.md`
4. Add error boundaries

**Priority 4 (Low - Week 4):**

1. Code splitting optimization
2. Bundle size optimization
3. Remove unused dependencies
4. Add Storybook for components

### 6.6 Priority Action Items

**🔴 Critical (Do Immediately):**

1. Create `.env.example` file
2. Create `src/types/` with type definitions
3. Add test infrastructure
4. Create `ARCHITECTURE.md`

**🟡 High Priority (This Week):**

1. Reorganize component structure
2. Create shared UI components
3. Add JSDoc documentation
4. Set up Prettier/ESLint properly

**🟢 Medium Priority (This Month):**

1. Add error boundaries
2. Optimize bundle size
3. Remove duplicate dependencies
4. Create CONTRIBUTING.md

**⚪ Low Priority (Backlog):**

1. Add Storybook
2. Add E2E tests
3. Performance monitoring
4. Add Docker support

---

## 7. Best Practice Recommendations

### 7.1 TypeScript Best Practices

1. **Centralize Types:** Create `src/types/` with organized type files
2. **Use Type Guards:** Add runtime type checking
3. **Avoid `any`:** Use `unknown` and proper type narrowing
4. **Type Exports:** Re-export types from `src/types/index.ts`

### 7.2 React Best Practices

1. **Component Organization:** Group by feature, not by type
2. **Error Boundaries:** Add at route level
3. **Code Splitting:** Use dynamic imports for large components
4. **Memoization:** Use React.memo and useMemo appropriately

### 7.3 Next.js Best Practices

1. **API Routes:** Keep routes focused and small
2. **Server Components:** Use where possible for better performance
3. **Metadata:** Add proper metadata to all pages
4. **Middleware:** Use for authentication and redirects

### 7.4 Code Organization

1. **Feature-Based Structure:** Organize by feature, not by file type
2. **Shared Components:** Separate shared from feature-specific
3. **Constants:** Extract magic numbers and strings
4. **Utilities:** Group related utilities together

### 7.5 Testing Strategy

1. **Unit Tests:** Test hooks and utilities
2. **Integration Tests:** Test API routes
3. **Component Tests:** Test React components
4. **E2E Tests:** Test critical user flows

### 7.6 Documentation Standards

1. **JSDoc:** Document all public functions
2. **README:** Keep updated with latest changes
3. **ARCHITECTURE:** Document system design
4. **API Docs:** Document all endpoints

---

## 8. Supporting Artifacts

### 8.1 Recommended File Structure

See section 4.2 for complete proposed structure.

### 8.2 Quick Start Guide for New Developers

```bash
# 1. Clone repository
git clone https://github.com/Spritz-Labs/spritz.git
cd spritz

# 2. Install dependencies
npm install  # or yarn install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Run database migrations
# See migrations/ folder for SQL scripts

# 5. Start development server
npm run dev

# 6. Open browser
# http://localhost:3000
```

### 8.3 Recommended Tools & Linters

**Required:**

-   ESLint (already configured)
-   Prettier (needs configuration)
-   TypeScript (already configured)

**Recommended:**

-   Husky - Git hooks
-   lint-staged - Pre-commit linting
-   Jest/Vitest - Testing
-   Storybook - Component documentation
-   Bundle Analyzer - Bundle size analysis

### 8.4 Environment Variables Template

Create `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# WalletConnect / Reown
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Google Gemini
GOOGLE_GEMINI_API_KEY=

# Huddle01
NEXT_PUBLIC_HUDDLE01_PROJECT_ID=
HUDDLE01_API_KEY=

# Livepeer
LIVEPEER_API_KEY=

# Pimlico (ERC-4337)
NEXT_PUBLIC_PIMLICO_API_KEY=

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Optional: Phone Verification
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_VERIFY_SERVICE_SID=

# Optional: Email Verification
RESEND_API_KEY=

# Optional: Pixel Art Storage
PINATA_API_KEY=
PINATA_SECRET_KEY=
NEXT_PUBLIC_PINATA_GATEWAY=

# Optional: Solana
NEXT_PUBLIC_HELIUS_API_KEY=

# Optional: x402
NEXT_PUBLIC_APP_URL=
X402_FACILITATOR_URL=

# Optional: Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

---

## 9. Action Plan Summary

### Immediate Actions (This Week)

1. ✅ Create `.env.example` file
2. ✅ Create `src/types/` directory structure
3. ✅ Create `ARCHITECTURE.md` document
4. ✅ Set up test infrastructure
5. ✅ Add Prettier configuration

### Short-term (This Month)

1. Reorganize component structure
2. Add comprehensive type definitions
3. Add JSDoc comments
4. Create CONTRIBUTING.md
5. Add error boundaries

### Long-term (Next Quarter)

1. Achieve 80%+ test coverage
2. Optimize bundle size
3. Add Storybook
4. Performance monitoring
5. Complete documentation

---

## 10. Conclusion

The Spritz repository is a **well-architected, modern application** with a comprehensive feature set. The codebase demonstrates good practices in many areas but has some critical gaps that need immediate attention:

**Strengths:**

-   Modern tech stack
-   Comprehensive features
-   Good separation of concerns in hooks/context
-   Well-documented migrations

**Critical Gaps:**

-   Missing type definitions
-   No test coverage
-   Missing .env.example
-   Flat component structure

**Recommendation:** Follow the priority action items above, starting with the critical items. The codebase is in good shape overall and with these improvements will be production-ready and maintainable.

---

**Report Generated:** 2024  
**Next Review:** After implementing Priority 1 items

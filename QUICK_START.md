# Quick Start Guide for New Developers

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase Account** (free tier works)
- **API Keys** for:
  - Google Gemini (AI agents)
  - Huddle01 (video calls)
  - Livepeer (livestreaming)
  - Reown/WalletConnect (wallet connections)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Spritz-Labs/spritz.git
cd spritz
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# OR using yarn (recommended - see package.json)
yarn install
```

### 3. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your API keys
# See REPOSITORY_ANALYSIS.md for complete list
```

**Minimum Required Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
GOOGLE_GEMINI_API_KEY=your_gemini_key
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run migrations in order from `/migrations` folder:
   - `agents.sql`
   - `agents_x402.sql`
   - `embeddings.sql`
   - `streams.sql`
   - And others as needed

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Running the App

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/       # React components
├── hooks/           # Custom React hooks
├── context/         # React Context providers
├── lib/             # Utility libraries
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

## Common Tasks

### Adding a New API Route

1. Create file in `src/app/api/[route-name]/route.ts`
2. Export `GET`, `POST`, etc. functions
3. Use Supabase client from `@/lib/supabase`

### Adding a New Component

1. Create file in `src/components/[feature]/ComponentName.tsx`
2. Use TypeScript for props
3. Follow existing component patterns

### Adding a New Hook

1. Create file in `src/hooks/useFeatureName.ts`
2. Use `useState`, `useEffect`, etc.
3. Return object with state and functions

## Getting Help

- **Documentation:** See `/docs` folder
- **Architecture:** See `ARCHITECTURE.md`
- **API Reference:** See `docs/api/` folder
- **Issues:** Open issue on GitHub
- **Questions:** Check existing issues or discussions

## Next Steps

1. Read `ARCHITECTURE.md` to understand system design
2. Review `REPOSITORY_ANALYSIS.md` for code organization
3. Check `CONTRIBUTING.md` for contribution guidelines
4. Explore the codebase starting with `src/app/page.tsx`

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

- Verify Supabase URL and keys
- Check network connectivity
- Verify RLS policies are set correctly

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Type Errors

```bash
# Regenerate TypeScript types
npx tsc --noEmit
```

## Development Tips

1. **Use TypeScript:** All files should be `.ts` or `.tsx`
2. **Follow Patterns:** Look at existing code for patterns
3. **Test Locally:** Test changes before committing
4. **Check Linting:** Run `npm run lint` before commits
5. **Document Code:** Add JSDoc comments to functions

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)


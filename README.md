# Spritz Documentation

This is the documentation site for [Spritz](https://github.com/Spritz-Labs/spritz), built with [Docusaurus](https://docusaurus.io/).

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Git

### Installation

```bash
npm install
```

### Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window at `http://localhost:3030`. Most changes are reflected live without having to restart the server.

### Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Preview Production Build

```bash
npm run serve
```

This command serves the built website locally for testing the production build.

## 📝 Documentation Structure

```
docs/
├── intro.md                    # Welcome page
├── getting-started.md          # Installation and setup
├── faq.md                      # Frequently asked questions
├── agents/                     # AI Agents documentation
│   ├── intro.md
│   ├── rag-technical.md        # RAG technical deep dive
│   ├── mcp-servers.md          # MCP servers & API tools
│   └── x402.md                 # x402 monetization
├── streaming/                  # Livestreaming documentation
│   ├── intro.md
│   └── technical.md            # Technical deep dive
├── guides/                     # User guides
│   ├── messaging.md            # Messaging guide
│   ├── video-calls.md          # Video calls guide
│   ├── groups.md               # Groups guide
│   ├── channels.md             # Channels guide
│   ├── friends.md              # Friends guide
│   ├── calendar-scheduling.md  # Calendar & scheduling
│   └── profile-settings.md     # Profile & settings
├── api/                        # API reference
│   ├── intro.md
│   ├── complete.md             # Complete API reference
│   ├── agents-detailed.md      # Detailed agents API
│   └── streaming.md             # Streaming API
├── architecture/               # Architecture documentation
│   └── overview.md
└── database/                   # Database documentation
    └── schema.md
```

## 🚢 Deployment

### GitHub Pages

The site is automatically deployed to GitHub Pages on every push to the `main` branch via GitHub Actions.

To manually deploy:

```bash
npm run deploy
```

This will build the website and push to the `gh-pages` branch.

### Other Platforms

You can deploy the `build` folder to any static hosting service:

- **Vercel**: Connect your GitHub repo and deploy automatically
- **Netlify**: Drag and drop the `build` folder or connect via Git
- **Cloudflare Pages**: Connect your GitHub repo
- **AWS S3 + CloudFront**: Upload the `build` folder to S3

## 🛠️ Configuration

Key configuration files:

- `docusaurus.config.ts` - Main Docusaurus configuration
- `sidebars.ts` - Sidebar navigation structure
- `package.json` - Dependencies and scripts

## 📚 Adding Documentation

1. Create a new `.md` or `.mdx` file in the `docs/` directory
2. The sidebar will automatically update based on the file structure
3. Use frontmatter to control sidebar position:

```markdown
---
sidebar_position: 1
---

# Your Document Title
```

## 🎨 Customization

- **Styling**: Edit `src/css/custom.css`
- **Homepage**: Edit `src/pages/index.tsx`
- **Components**: Add custom React components in `src/components/`
- **Theme**: Configure in `docusaurus.config.ts` under `themeConfig`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This documentation is part of the Spritz project and follows the same license:
PolyForm Noncommercial License 1.0.0

Commercial use requires a separate license. Contact kevin@kevinjonescreates.com for commercial licensing.

## 🔗 Links

- [Spritz Repository](https://github.com/Spritz-Labs/spritz)
- [Spritz App](https://app.spritz.chat)
- [Docusaurus Documentation](https://docusaurus.io/docs)

import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
    title: "Spritz Documentation",
    tagline:
        "Decentralized social platform with AI agents, livestreaming, and Web3 messaging",
    favicon: "icons/favicon-32x32.png",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
    url: "https://docs.spritz.chat",
  // Set the /<baseUrl>/ pathname under which your site is served
    // For Vercel deployment, use root path
    baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
    organizationName: "Spritz-Labs", // Usually your GitHub org/user name.
    projectName: "spritz-docs", // Usually your repo name.

    onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
        defaultLocale: "en",
        locales: ["en"],
  },

    headTags: [
        // Preconnect to external domains for performance
        {
            tagName: 'link',
            attributes: {
                rel: 'preconnect',
                href: 'https://app.spritz.chat',
            },
        },
        {
            tagName: 'link',
            attributes: {
                rel: 'dns-prefetch',
                href: 'https://app.spritz.chat',
            },
        },
        // Canonical base
        {
            tagName: 'link',
            attributes: {
                rel: 'canonical',
                href: 'https://docs.spritz.chat',
            },
        },
    ],

  presets: [
    [
            "classic",
      {
        docs: {
                    sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
                        "https://github.com/Spritz-Labs/spritz-docs/tree/main/",
                    showLastUpdateAuthor: false,
                    showLastUpdateTime: false,
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'Spritz Blog',
          blogDescription: 'Latest updates, announcements, and insights from Spritz - the decentralized social platform for Web3 messaging, AI agents, and censorship-resistant communication.',
          blogSidebarTitle: 'Recent posts',
          blogSidebarCount: 10,
          feedOptions: {
                        type: ["rss", "atom", "json"],
            xslt: true,
            title: 'Spritz Blog',
            description: 'Latest updates from Spritz - decentralized social platform',
            copyright: `Copyright © ${new Date().getFullYear()} Spritz Labs`,
            language: 'en',
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
                        "https://github.com/Spritz-Labs/spritz-docs/tree/main/",
          // Useful options to enforce blogging best practices
                    onInlineTags: "warn",
                    onInlineAuthors: "warn",
                    onUntruncatedBlogPosts: "warn",
        },
        theme: {
                    customCss: "./src/css/custom.css",
                },
                sitemap: {
                    changefreq: "weekly",
                    priority: 0.5,
                    ignorePatterns: [
                        "/tags/**",
                        "/blog/tags/**",
                        "/blog/authors/**",
                        "/blog/archive",
                        "/markdown-page",
                        "/search",
                    ],
                    filename: "sitemap.xml",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: false,
      },
    },
    // Replace with your project's social card
        image: "og-image.png",
        metadata: [
            {
                name: "keywords",
                content:
                    "Spritz, decentralized social platform, Web3 messaging, AI agents, livestreaming, censorship resistant, open source, peer-to-peer, Logos Messaging, Logos, x402 payments, Web3, blockchain, decentralized messaging, P2P communication, Livepeer, Huddle01, Sign-In with Ethereum, SIWE, Sign-In with Solana, SIWS, passkeys, crypto payments, decentralized social network",
            },
            {
                name: "author",
                content: "Spritz Labs",
            },
            {
                name: "description",
                content:
                    "Complete documentation for Spritz - a decentralized social platform with Web3 messaging, AI agents, livestreaming, and peer-to-peer communication. Learn how to build censorship-resistant applications.",
            },
            {
                name: "robots",
                content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            },
            {
                name: "googlebot",
                content: "index, follow",
            },
            {
                property: "og:type",
                content: "website",
            },
            {
                property: "og:site_name",
                content: "Spritz",
            },
            {
                property: "og:title",
                content: "Spritz Documentation - Decentralized Social Platform",
            },
            {
                property: "og:description",
                content:
                    "Complete documentation for Spritz - a decentralized social platform with Web3 messaging, AI agents, livestreaming, and peer-to-peer communication.",
            },
            {
                property: "og:url",
                content: "https://docs.spritz.chat",
            },
            {
                property: "og:image",
                content: "https://docs.spritz.chat/og-image.png",
            },
            {
                property: "og:image:width",
                content: "1200",
            },
            {
                property: "og:image:height",
                content: "630",
            },
            {
                property: "og:image:alt",
                content: "Spritz - Censorship-Resistant Chat for Web3",
            },
            {
                property: "og:locale",
                content: "en_US",
            },
            {
                name: "twitter:card",
                content: "summary_large_image",
            },
            {
                name: "twitter:site",
                content: "@spritzchat",
            },
            {
                name: "twitter:creator",
                content: "@spritzchat",
            },
            {
                name: "twitter:title",
                content: "Spritz Documentation - Decentralized Social Platform",
            },
            {
                name: "twitter:description",
                content:
                    "Complete documentation for Spritz - a decentralized social platform with Web3 messaging, AI agents, livestreaming, and peer-to-peer communication.",
            },
            {
                name: "twitter:image",
                content: "https://docs.spritz.chat/og-image.png",
            },
            {
                name: "twitter:image:alt",
                content: "Spritz - Censorship-Resistant Chat for Web3",
            },
            {
                name: "application-name",
                content: "Spritz Documentation",
            },
            {
                name: "apple-mobile-web-app-title",
                content: "Spritz Docs",
            },
            {
                name: "theme-color",
                content: "#FF5500",
            },
        ],
    colorMode: {
      respectPrefersColorScheme: true,
            defaultMode: "light",
            disableSwitch: false,
    },
    navbar: {
            title: "Spritz",
      logo: {
                alt: "Spritz Logo",
                src: "img/logo.svg",
                srcDark: "img/logo.svg",
                width: 32,
                height: 32,
            },
            hideOnScroll: false,
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "docsSidebar",
                    position: "left",
                    label: "Docs",
                },
                {
                    type: "dropdown",
                    label: "AI Agents",
                    position: "left",
                    items: [
                        {
                            type: "doc",
                            docId: "agents/intro",
                            label: "Overview",
                        },
                        {
                            type: "doc",
                            docId: "agents/rag-technical",
                            label: "RAG Technical",
                        },
                        {
                            type: "doc",
                            docId: "agents/mcp-servers",
                            label: "MCP Servers",
                        },
                        {
                            type: "doc",
                            docId: "agents/x402",
                            label: "x402 Payments",
                        },
                    ],
                },
                {
                    type: "dropdown",
                    label: "Livestreaming",
                    position: "left",
                    items: [
                        {
                            type: "doc",
                            docId: "streaming/technical",
                            label: "Technical",
                        },
                    ],
                },
                {
                    type: "dropdown",
                    label: "Guides",
                    position: "left",
                    items: [
                        {
                            type: "doc",
                            docId: "guides/messaging",
                            label: "Messaging",
                        },
                        {
                            type: "doc",
                            docId: "guides/video-calls",
                            label: "Video Calls",
                        },
                        {
                            type: "doc",
                            docId: "guides/groups",
                            label: "Groups",
      },
                        {
                            type: "doc",
                            docId: "guides/channels",
                            label: "Channels",
                        },
                        {
                            type: "doc",
                            docId: "guides/friends",
                            label: "Friends",
                        },
                        {
                            type: "doc",
                            docId: "guides/calendar-scheduling",
                            label: "Calendar & Scheduling",
                        },
                        {
                            type: "doc",
                            docId: "guides/profile-settings",
                            label: "Profile Settings",
                        },
                        {
                            type: "doc",
                            docId: "guides/admin",
                            label: "Admin",
                        },
                    ],
                },
                {
                    type: "dropdown",
                    label: "API",
                    position: "left",
      items: [
        {
                            type: "doc",
                            docId: "api/intro",
                            label: "Overview",
                        },
                        {
                            type: "doc",
                            docId: "api/agents-detailed",
                            label: "Agents API",
                        },
                        {
                            type: "doc",
                            docId: "api/streaming",
                            label: "Streaming API",
                        },
                    ],
        },
                { to: "/blog", label: "Blog", position: "left" },
                { to: "/brand", label: "Brand", position: "left" },
        {
                    href: "https://github.com/Spritz-Labs/spritz",
                    label: "GitHub",
                    position: "right",
        },
      ],
    },
    footer: {
            style: "light",
      links: [
        {
                    title: "Documentation",
          items: [
            {
                            label: "Getting Started",
                            to: "/docs/intro",
                        },
                        {
                            label: "AI Agents",
                            to: "/docs/agents/intro",
                        },
                        {
                            label: "Livestreaming",
                            to: "/docs/streaming/technical",
                        },
                        {
                            label: "API Reference",
                            to: "/docs/api/intro",
            },
          ],
        },
        {
                    title: "Community",
          items: [
            {
                            label: "GitHub",
                            href: "https://github.com/Spritz-Labs/spritz",
            },
            {
                            label: "Issues",
                            href: "https://github.com/Spritz-Labs/spritz/issues",
            },
          ],
        },
        {
                    title: "More",
          items: [
            {
                            label: "Blog",
                            to: "/blog",
            },
            {
                            label: "Brand Kit",
                            to: "/brand",
            },
            {
                            label: "App",
                            href: "https://app.spritz.chat",
            },
          ],
        },
      ],
            copyright: `Copyright © ${new Date().getFullYear()} Spritz Labs. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

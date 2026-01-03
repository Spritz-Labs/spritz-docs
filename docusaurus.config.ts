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
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true,
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
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        // Replace with your project's social card
        image: "og-image.png",
        metadata: [
            {
                name: "keywords",
                content:
                    "Spritz, decentralized social platform, Web3 messaging, AI agents, livestreaming, censorship resistant, open source, peer-to-peer, Waku protocol, x402 payments",
            },
            {
                name: "author",
                content: "Spritz Labs",
            },
            {
                property: "og:type",
                content: "website",
            },
            {
                property: "og:site_name",
                content: "Spritz Documentation",
            },
            {
                name: "twitter:card",
                content: "summary_large_image",
            },
            {
                name: "twitter:site",
                content: "@SpritzLabs",
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
                { to: "/blog", label: "Blog", position: "left" },
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
                            to: "/docs/streaming/intro",
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

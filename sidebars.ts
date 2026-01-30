import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
    docsSidebar: [
        "intro",
        "getting-started",
        {
            type: "category",
            label: "User Guides",
            items: [
                "guides/messaging",
                "guides/video-calls",
                "guides/groups",
                "guides/channels",
                "guides/friends",
                "guides/calendar-scheduling",
                "guides/profile-settings",
                "guides/profile-widgets",
            ],
        },
        {
            type: "category",
            label: "AI Agents",
            items: [
                "agents/architecture",
                "agents/intro",
                "agents/rag-technical",
                "agents/mcp-servers",
                "agents/x402",
            ],
        },
        {
            type: "category",
            label: "Livestreaming",
            items: ["streaming/technical"],
        },
        "faq",
        {
            type: "category",
            label: "Developers",
            items: [
                "developers/login-flow",
                "developers/installation",
                "developers/sdk",
                "developers/troubleshooting",
                {
                    type: "category",
                    label: "Technical Deep Dives",
                    collapsed: false,
                    items: [
                        "developers/authentication",
                        "developers/smart-wallets",
                        "developers/webauthn-signatures",
                        "developers/vaults",
                        "developers/messaging",
                        "developers/video-calls",
                        "developers/livestreaming",
                        "developers/security",
                    ],
                },
                {
                    type: "category",
                    label: "API Reference",
                    items: [
                        "api/intro",
                        "api/agents-detailed",
                        "api/user-moderation",
                        "api/streaming",
                        "api/error-codes",
                        "api/complete",
                    ],
                },
                "architecture/overview",
                "database/schema",
                "guides/admin",
                "changelog",
            ],
        },
    ],
};

export default sidebars;

import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

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
    'intro',
    'getting-started',
    {
      type: 'category',
      label: 'AI Agents',
      items: [
        'agents/intro',
        'agents/rag-technical',
        'agents/mcp-servers',
        'agents/x402',
      ],
    },
    {
      type: 'category',
      label: 'Livestreaming',
      items: [
        'streaming/technical',
      ],
    },
    {
      type: 'category',
      label: 'User Guides',
      items: [
        'guides/messaging',
        'guides/video-calls',
        'guides/groups',
        'guides/channels',
        'guides/friends',
        'guides/calendar-scheduling',
        'guides/profile-settings',
        'guides/admin',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/intro',
        'api/complete',
        'api/agents-detailed',
        'api/streaming',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
      ],
    },
    {
      type: 'category',
      label: 'Database',
      items: [
        'database/schema',
      ],
    },
    'faq',
  ],
};

export default sidebars;

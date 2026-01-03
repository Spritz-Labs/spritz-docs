import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/blog',
    component: ComponentCreator('/blog', 'e99'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '182'),
    exact: true
  },
  {
    path: '/blog/authors',
    component: ComponentCreator('/blog/authors', '0b7'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '287'),
    exact: true
  },
  {
    path: '/blog/tags/censorship-resistance',
    component: ComponentCreator('/blog/tags/censorship-resistance', 'cf4'),
    exact: true
  },
  {
    path: '/blog/tags/decentralization',
    component: ComponentCreator('/blog/tags/decentralization', '9a8'),
    exact: true
  },
  {
    path: '/blog/tags/openness',
    component: ComponentCreator('/blog/tags/openness', '8c9'),
    exact: true
  },
  {
    path: '/blog/tags/spritz',
    component: ComponentCreator('/blog/tags/spritz', 'b2e'),
    exact: true
  },
  {
    path: '/blog/tags/web3',
    component: ComponentCreator('/blog/tags/web3', '867'),
    exact: true
  },
  {
    path: '/blog/why-we-built-spritz',
    component: ComponentCreator('/blog/why-we-built-spritz', 'cb4'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '707'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '727'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '52c'),
            routes: [
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', '0ee'),
                exact: true
              },
              {
                path: '/docs/agents/intro',
                component: ComponentCreator('/docs/agents/intro', '6f2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/agents/mcp-servers',
                component: ComponentCreator('/docs/agents/mcp-servers', '771'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/agents/rag-technical',
                component: ComponentCreator('/docs/agents/rag-technical', '901'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/agents/x402',
                component: ComponentCreator('/docs/agents/x402', 'b17'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/api/agents-detailed',
                component: ComponentCreator('/docs/api/agents-detailed', '870'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/api/complete',
                component: ComponentCreator('/docs/api/complete', '5e7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/api/intro',
                component: ComponentCreator('/docs/api/intro', '284'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/api/streaming',
                component: ComponentCreator('/docs/api/streaming', 'db2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/architecture/overview',
                component: ComponentCreator('/docs/architecture/overview', '8f4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/database/schema',
                component: ComponentCreator('/docs/database/schema', '494'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/faq',
                component: ComponentCreator('/docs/faq', 'ec8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/getting-started',
                component: ComponentCreator('/docs/getting-started', '3fb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/admin',
                component: ComponentCreator('/docs/guides/admin', '204'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/calendar-scheduling',
                component: ComponentCreator('/docs/guides/calendar-scheduling', '0c5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/channels',
                component: ComponentCreator('/docs/guides/channels', '005'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/friends',
                component: ComponentCreator('/docs/guides/friends', 'a0b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/groups',
                component: ComponentCreator('/docs/guides/groups', '97b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/messaging',
                component: ComponentCreator('/docs/guides/messaging', 'ab8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/profile-settings',
                component: ComponentCreator('/docs/guides/profile-settings', '87f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/video-calls',
                component: ComponentCreator('/docs/guides/video-calls', 'd31'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '058'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/streaming/intro',
                component: ComponentCreator('/docs/streaming/intro', '817'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/streaming/technical',
                component: ComponentCreator('/docs/streaming/technical', 'b61'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

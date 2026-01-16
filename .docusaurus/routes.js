import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', '485'),
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
    path: '/blog/spritz-alien-partnership',
    component: ComponentCreator('/blog/spritz-alien-partnership', 'bce'),
    exact: true
  },
  {
    path: '/blog/spritz-chat-manifesto',
    component: ComponentCreator('/blog/spritz-chat-manifesto', '805'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '287'),
    exact: true
  },
  {
    path: '/blog/tags/alien',
    component: ComponentCreator('/blog/tags/alien', '80c'),
    exact: true
  },
  {
    path: '/blog/tags/censorship-resistance',
    component: ComponentCreator('/blog/tags/censorship-resistance', '3d6'),
    exact: true
  },
  {
    path: '/blog/tags/decentralization',
    component: ComponentCreator('/blog/tags/decentralization', '353'),
    exact: true
  },
  {
    path: '/blog/tags/ethereum',
    component: ComponentCreator('/blog/tags/ethereum', '43c'),
    exact: true
  },
  {
    path: '/blog/tags/global',
    component: ComponentCreator('/blog/tags/global', '4a1'),
    exact: true
  },
  {
    path: '/blog/tags/logos-messaging',
    component: ComponentCreator('/blog/tags/logos-messaging', '4cf'),
    exact: true
  },
  {
    path: '/blog/tags/manifesto',
    component: ComponentCreator('/blog/tags/manifesto', 'd87'),
    exact: true
  },
  {
    path: '/blog/tags/openness',
    component: ComponentCreator('/blog/tags/openness', '8a0'),
    exact: true
  },
  {
    path: '/blog/tags/partnership',
    component: ComponentCreator('/blog/tags/partnership', 'b02'),
    exact: true
  },
  {
    path: '/blog/tags/policy',
    component: ComponentCreator('/blog/tags/policy', 'e7a'),
    exact: true
  },
  {
    path: '/blog/tags/privacy',
    component: ComponentCreator('/blog/tags/privacy', '784'),
    exact: true
  },
  {
    path: '/blog/tags/proof-of-personhood',
    component: ComponentCreator('/blog/tags/proof-of-personhood', 'ee5'),
    exact: true
  },
  {
    path: '/blog/tags/spritz',
    component: ComponentCreator('/blog/tags/spritz', '262'),
    exact: true
  },
  {
    path: '/blog/tags/vitalik',
    component: ComponentCreator('/blog/tags/vitalik', '17e'),
    exact: true
  },
  {
    path: '/blog/tags/voip',
    component: ComponentCreator('/blog/tags/voip', '596'),
    exact: true
  },
  {
    path: '/blog/tags/web3',
    component: ComponentCreator('/blog/tags/web3', '5ce'),
    exact: true
  },
  {
    path: '/blog/vitalik-decentralized-messaging-vision',
    component: ComponentCreator('/blog/vitalik-decentralized-messaging-vision', '671'),
    exact: true
  },
  {
    path: '/blog/voip-restrictions-global',
    component: ComponentCreator('/blog/voip-restrictions-global', 'eb3'),
    exact: true
  },
  {
    path: '/blog/why-we-built-spritz',
    component: ComponentCreator('/blog/why-we-built-spritz', '6d3'),
    exact: true
  },
  {
    path: '/brand',
    component: ComponentCreator('/brand', 'd91'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'c0b'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '954'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '9e2'),
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

import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/spritz-docs/blog',
    component: ComponentCreator('/spritz-docs/blog', '9a5'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/archive',
    component: ComponentCreator('/spritz-docs/blog/archive', 'f37'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/authors',
    component: ComponentCreator('/spritz-docs/blog/authors', 'a12'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/authors/all-sebastien-lorber-articles',
    component: ComponentCreator('/spritz-docs/blog/authors/all-sebastien-lorber-articles', '3ba'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/authors/yangshun',
    component: ComponentCreator('/spritz-docs/blog/authors/yangshun', '863'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/first-blog-post',
    component: ComponentCreator('/spritz-docs/blog/first-blog-post', 'd6e'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/long-blog-post',
    component: ComponentCreator('/spritz-docs/blog/long-blog-post', 'e2b'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/mdx-blog-post',
    component: ComponentCreator('/spritz-docs/blog/mdx-blog-post', '46f'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/tags',
    component: ComponentCreator('/spritz-docs/blog/tags', 'b87'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/tags/docusaurus',
    component: ComponentCreator('/spritz-docs/blog/tags/docusaurus', '033'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/tags/facebook',
    component: ComponentCreator('/spritz-docs/blog/tags/facebook', '1c1'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/tags/hello',
    component: ComponentCreator('/spritz-docs/blog/tags/hello', 'e83'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/tags/hola',
    component: ComponentCreator('/spritz-docs/blog/tags/hola', '115'),
    exact: true
  },
  {
    path: '/spritz-docs/blog/welcome',
    component: ComponentCreator('/spritz-docs/blog/welcome', 'd86'),
    exact: true
  },
  {
    path: '/spritz-docs/markdown-page',
    component: ComponentCreator('/spritz-docs/markdown-page', '47b'),
    exact: true
  },
  {
    path: '/spritz-docs/docs',
    component: ComponentCreator('/spritz-docs/docs', 'aea'),
    routes: [
      {
        path: '/spritz-docs/docs',
        component: ComponentCreator('/spritz-docs/docs', 'e1c'),
        routes: [
          {
            path: '/spritz-docs/docs',
            component: ComponentCreator('/spritz-docs/docs', '2c1'),
            routes: [
              {
                path: '/spritz-docs/docs/',
                component: ComponentCreator('/spritz-docs/docs/', '834'),
                exact: true
              },
              {
                path: '/spritz-docs/docs/agents/intro',
                component: ComponentCreator('/spritz-docs/docs/agents/intro', 'ef4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/agents/mcp-servers',
                component: ComponentCreator('/spritz-docs/docs/agents/mcp-servers', '536'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/agents/rag-technical',
                component: ComponentCreator('/spritz-docs/docs/agents/rag-technical', 'efc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/agents/x402',
                component: ComponentCreator('/spritz-docs/docs/agents/x402', '572'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/api/agents-detailed',
                component: ComponentCreator('/spritz-docs/docs/api/agents-detailed', '108'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/api/complete',
                component: ComponentCreator('/spritz-docs/docs/api/complete', '58d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/api/intro',
                component: ComponentCreator('/spritz-docs/docs/api/intro', 'a4a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/api/streaming',
                component: ComponentCreator('/spritz-docs/docs/api/streaming', '41d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/architecture/overview',
                component: ComponentCreator('/spritz-docs/docs/architecture/overview', '1bc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/database/schema',
                component: ComponentCreator('/spritz-docs/docs/database/schema', '640'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/faq',
                component: ComponentCreator('/spritz-docs/docs/faq', '1dc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/getting-started',
                component: ComponentCreator('/spritz-docs/docs/getting-started', '449'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/guides/admin',
                component: ComponentCreator('/spritz-docs/docs/guides/admin', 'a69'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/guides/calendar-scheduling',
                component: ComponentCreator('/spritz-docs/docs/guides/calendar-scheduling', '4fb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/guides/channels',
                component: ComponentCreator('/spritz-docs/docs/guides/channels', 'd5b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/guides/friends',
                component: ComponentCreator('/spritz-docs/docs/guides/friends', '4e8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/guides/groups',
                component: ComponentCreator('/spritz-docs/docs/guides/groups', 'e1e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/guides/messaging',
                component: ComponentCreator('/spritz-docs/docs/guides/messaging', '4cb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/guides/profile-settings',
                component: ComponentCreator('/spritz-docs/docs/guides/profile-settings', '546'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/guides/video-calls',
                component: ComponentCreator('/spritz-docs/docs/guides/video-calls', 'adb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/intro',
                component: ComponentCreator('/spritz-docs/docs/intro', '4fe'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/streaming/intro',
                component: ComponentCreator('/spritz-docs/docs/streaming/intro', 'f14'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/spritz-docs/docs/streaming/technical',
                component: ComponentCreator('/spritz-docs/docs/streaming/technical', '9cf'),
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
    path: '/spritz-docs/',
    component: ComponentCreator('/spritz-docs/', 'b23'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

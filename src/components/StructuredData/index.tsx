import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function StructuredData(): JSX.Element {
    const {siteConfig} = useDocusaurusContext();
    
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Spritz Labs',
        url: 'https://docs.spritz.chat',
        logo: {
            '@type': 'ImageObject',
            url: 'https://docs.spritz.chat/og-image.png',
            width: 1200,
            height: 630,
        },
        sameAs: [
            'https://github.com/Spritz-Labs/spritz',
            'https://app.spritz.chat',
            'https://x.com/spritzchat',
        ],
        description: 'Spritz is a decentralized social platform with Web3 messaging, AI agents, livestreaming, and peer-to-peer communication.',
        foundingDate: '2024',
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'technical support',
            url: 'https://github.com/Spritz-Labs/spritz/issues',
        },
    };

    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.title,
        alternateName: 'Spritz Docs',
        url: siteConfig.url,
        description: siteConfig.tagline,
        inLanguage: 'en-US',
        publisher: {
            '@type': 'Organization',
            name: 'Spritz Labs',
            logo: {
                '@type': 'ImageObject',
                url: 'https://docs.spritz.chat/og-image.png',
            },
        },
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    const softwareApplicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Spritz',
        applicationCategory: 'SocialNetworkingApplication',
        applicationSubCategory: 'Communication',
        operatingSystem: 'Web, iOS, Android',
        url: 'https://app.spritz.chat',
        description: 'Decentralized social platform with Web3 messaging, AI agents, livestreaming, and peer-to-peer communication. Built on Logos Messaging for censorship-resistant communication.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
        },
        featureList: [
            'Decentralized Messaging via Logos/Waku',
            'AI Agents with RAG',
            'Livestreaming via Livepeer',
            'Video Calls via Huddle01',
            'Web3 Authentication (SIWE/SIWS)',
            'Passkey/WebAuthn Login',
            'Smart Wallet (Safe/ERC-4337)',
            'x402 Micropayments',
            'Multi-chain Support (8 EVM chains + Solana)',
        ],
        screenshot: 'https://docs.spritz.chat/og-image.png',
        softwareVersion: '1.0',
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '5',
            ratingCount: '1',
            bestRating: '5',
            worstRating: '1',
        },
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Documentation',
                item: 'https://docs.spritz.chat/docs/intro',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: 'https://docs.spritz.chat/blog',
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(softwareApplicationSchema),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbSchema),
                }}
            />
        </>
    );
}


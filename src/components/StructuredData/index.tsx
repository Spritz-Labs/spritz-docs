import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function StructuredData(): JSX.Element {
    const {siteConfig} = useDocusaurusContext();
    
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Spritz Labs',
        url: 'https://docs.spritz.chat',
        logo: 'https://docs.spritz.chat/img/logo.svg',
        sameAs: [
            'https://github.com/Spritz-Labs/spritz',
            'https://app.spritz.chat',
        ],
        description: 'Spritz is a decentralized social platform with Web3 messaging, AI agents, livestreaming, and peer-to-peer communication.',
    };

    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.title,
        url: siteConfig.url,
        description: siteConfig.tagline,
        publisher: {
            '@type': 'Organization',
            name: 'Spritz Labs',
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
        operatingSystem: 'Web',
        url: 'https://app.spritz.chat',
        description: 'Decentralized social platform with Web3 messaging, AI agents, livestreaming, and peer-to-peer communication.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: [
            'Decentralized Messaging',
            'AI Agents',
            'Livestreaming',
            'Video Calls',
            'Web3 Authentication',
            'Crypto Payments',
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
        </>
    );
}


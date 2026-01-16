import React from 'react';
import Layout from '@theme/Layout';
import styles from './brand.module.css';

const colors = [
  { name: 'Primary Orange', hex: '#FF5500', rgb: '255, 85, 0', usage: 'Primary brand color, CTAs, highlights' },
  { name: 'Secondary Orange', hex: '#FB8D22', rgb: '251, 141, 34', usage: 'Secondary accents, hover states' },
  { name: 'Light Coral', hex: '#FFBBA7', rgb: '255, 187, 167', usage: 'Light accents, backgrounds' },
  { name: 'Cream', hex: '#FFF0E0', rgb: '255, 240, 224', usage: 'Light mode backgrounds, icon backgrounds' },
  { name: 'Forest Green', hex: '#004921', rgb: '0, 73, 33', usage: 'Dark mode background, contrast' },
  { name: 'Dark Orange', hex: '#E04D00', rgb: '224, 77, 0', usage: 'Shadows, depth' },
  { name: 'Deep Orange', hex: '#CC4400', rgb: '204, 68, 0', usage: 'Dark shadows, depth' },
];

const logoAssets = [
  { name: 'Logo Icon (Cream BG)', file: 'logo-icon.svg', desc: 'Primary app icon with cream background' },
  { name: 'Logo Icon (Transparent)', file: 'logo-icon-transparent.svg', desc: 'Icon without background for overlays' },
  { name: 'Logo Icon (Dark BG)', file: 'logo-dark-bg.svg', desc: 'Icon with forest green background' },
  { name: 'Wordmark - DM Sans', file: 'logo-wordmark-dark.svg', desc: 'Clean sans-serif (current app font)' },
  { name: 'Wordmark - Lobster', file: 'wordmark-lobster.svg', desc: 'Bold retro script' },
  { name: 'Wordmark - Fredoka', file: 'wordmark-fredoka.svg', desc: 'Playful, bubbly rounded' },
  { name: 'Wordmark - Quicksand', file: 'wordmark-quicksand.svg', desc: 'Clean, modern rounded' },
  { name: 'Wordmark - Righteous', file: 'wordmark-righteous.svg', desc: 'Retro geometric display' },
  { name: 'Wordmark - Satisfy', file: 'wordmark-satisfy.svg', desc: 'Elegant flowing script' },
  { name: 'Wordmark - Poppins', file: 'wordmark-poppins.svg', desc: 'Modern geometric sans' },
];

function ColorSwatch({ color }: { color: typeof colors[0] }) {
  return (
    <div className={styles.colorSwatch}>
      <div 
        className={styles.colorPreview} 
        style={{ backgroundColor: color.hex }}
      />
      <div className={styles.colorInfo}>
        <h4>{color.name}</h4>
        <code>{color.hex}</code>
        <p>RGB: {color.rgb}</p>
        <p className={styles.colorUsage}>{color.usage}</p>
      </div>
    </div>
  );
}

function LogoCard({ asset }: { asset: typeof logoAssets[0] }) {
  const isDark = asset.file.includes('dark-bg') || asset.file.includes('wordmark-dark');
  
  return (
    <div className={styles.logoCard}>
      <div className={`${styles.logoPreview} ${isDark ? styles.darkBg : styles.lightBg}`}>
        <img src={`/img/brand/${asset.file}`} alt={asset.name} />
      </div>
      <div className={styles.logoInfo}>
        <h4>{asset.name}</h4>
        <p>{asset.desc}</p>
        <a 
          href={`/img/brand/${asset.file}`} 
          download={asset.file}
          className={styles.downloadBtn}
        >
          Download SVG
        </a>
      </div>
    </div>
  );
}

export default function BrandKit(): JSX.Element {
  return (
    <Layout
      title="Brand & Media Kit"
      description="Spritz brand guidelines, logos, colors, and media assets for press and partners."
    >
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Brand & Media Kit</h1>
          <p>
            Official brand guidelines and assets for Spritz. Use these resources when 
            writing about, partnering with, or featuring Spritz in your content.
          </p>
        </header>

        <section className={styles.section}>
          <h2>About Spritz</h2>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCard}>
              <h3>What is Spritz?</h3>
              <p>
                Spritz is a censorship-resistant messaging app for Web3. It combines 
                end-to-end encrypted direct messaging with decentralized public channels 
                via the Logos Messaging protocol (Waku).
              </p>
            </div>
            <div className={styles.aboutCard}>
              <h3>Key Features</h3>
              <ul>
                <li>End-to-end encrypted DMs and group chats</li>
                <li>Decentralized public channels (Logos Messaging)</li>
                <li>Wallet-native authentication (SIWE/SIWS)</li>
                <li>Passkey login (WebAuthn)</li>
                <li>Multi-chain smart wallets (Safe)</li>
                <li>Video calls (Huddle01/Livepeer)</li>
                <li>AI agents with x402 micropayments</li>
                <li>Proof-of-personhood (World ID, Alien)</li>
              </ul>
            </div>
            <div className={styles.aboutCard}>
              <h3>Boilerplate</h3>
              <p>
                <strong>Short (1 line):</strong> Spritz is a censorship-resistant 
                messaging app for Web3.
              </p>
              <p>
                <strong>Medium (2 lines):</strong> Spritz is a censorship-resistant 
                messaging app for Web3. Connect with friends using wallets or passkeys, 
                chat in encrypted groups, and join decentralized public channels.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Logo</h2>
          <p className={styles.sectionDesc}>
            The Spritz logo is a pixel-art orange, representing our playful, 
            retro-inspired aesthetic while nodding to our name (a refreshing citrus drink).
          </p>
          
          <div className={styles.logoGrid}>
            {logoAssets.map((asset) => (
              <LogoCard key={asset.file} asset={asset} />
            ))}
          </div>

          <div className={styles.guidelines}>
            <h3>Logo Guidelines</h3>
            <div className={styles.guidelinesGrid}>
              <div className={styles.doCard}>
                <h4>Do</h4>
                <ul>
                  <li>Use the logo with adequate spacing around it</li>
                  <li>Use the provided color variants</li>
                  <li>Scale proportionally</li>
                  <li>Use on solid backgrounds</li>
                </ul>
              </div>
              <div className={styles.dontCard}>
                <h4>Don't</h4>
                <ul>
                  <li>Stretch or distort the logo</li>
                  <li>Add effects (shadows, glows, outlines)</li>
                  <li>Change the colors</li>
                  <li>Place on busy/patterned backgrounds</li>
                  <li>Rotate the logo</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Colors</h2>
          <p className={styles.sectionDesc}>
            Our color palette is built around warm oranges and a complementary forest green, 
            creating a fresh, energetic, and distinctive visual identity.
          </p>
          
          <div className={styles.colorGrid}>
            {colors.map((color) => (
              <ColorSwatch key={color.hex} color={color} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Typography</h2>
          <div className={styles.typeGrid}>
            <div className={styles.typeCard}>
              <h3 style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>DM Sans</h3>
              <p className={styles.typeSample} style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                abcdefghijklmnopqrstuvwxyz<br />
                0123456789
              </p>
              <p>Primary typeface for UI text, headings, and body copy.</p>
              <a href="https://fonts.google.com/specimen/DM+Sans" target="_blank" rel="noopener noreferrer">
                Download from Google Fonts
              </a>
            </div>
            <div className={styles.typeCard}>
              <h3 style={{ fontFamily: 'JetBrains Mono, monospace' }}>JetBrains Mono</h3>
              <p className={styles.typeSample} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                abcdefghijklmnopqrstuvwxyz<br />
                0123456789
              </p>
              <p>Monospace typeface for code, addresses, and technical content.</p>
              <a href="https://fonts.google.com/specimen/JetBrains+Mono" target="_blank" rel="noopener noreferrer">
                Download from Google Fonts
              </a>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Social & Press</h2>
          <div className={styles.socialGrid}>
            <div className={styles.socialCard}>
              <h3>Links</h3>
              <ul>
                <li><strong>Website:</strong> <a href="https://spritz.chat">spritz.chat</a></li>
                <li><strong>App:</strong> <a href="https://app.spritz.chat">app.spritz.chat</a></li>
                <li><strong>Docs:</strong> <a href="https://docs.spritz.chat">docs.spritz.chat</a></li>
                <li><strong>Twitter/X:</strong> <a href="https://x.com/spritzchat">@spritzchat</a></li>
                <li><strong>GitHub:</strong> <a href="https://github.com/Spritz-Labs">Spritz-Labs</a></li>
              </ul>
            </div>
            <div className={styles.socialCard}>
              <h3>Press Contact</h3>
              <p>
                For press inquiries, partnerships, or media requests:
              </p>
              <ul>
                <li><strong>Email:</strong> <a href="mailto:contact@spritz.chat">contact@spritz.chat</a></li>
                <li><strong>Twitter/X:</strong> <a href="https://x.com/spritzchat">@spritzchat</a></li>
              </ul>
            </div>
            <div className={styles.socialCard}>
              <h3>Attribution</h3>
              <p>
                When mentioning Spritz, please use "Spritz" (capitalized, no suffix). 
                Acceptable: "Spritz", "Spritz app", "Spritz Chat".
              </p>
              <p>
                Not acceptable: "spritz", "SPRITZ", "Spritz.Chat".
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Download All Assets</h2>
          <p>
            Need all brand assets at once? Download our complete brand kit including logos 
            in SVG and PNG formats, color palette files, and usage guidelines.
          </p>
          <div className={styles.downloadSection}>
            <a href="/img/brand/logo-icon.svg" download="spritz-logo.svg" className={styles.primaryBtn}>
              Download Logo (SVG)
            </a>
            <a href="/img/brand/logo-wordmark-dark.svg" download="spritz-wordmark-dark.svg" className={styles.secondaryBtn}>
              Download Wordmark - Dark (SVG)
            </a>
            <a href="/img/brand/logo-wordmark-light.svg" download="spritz-wordmark-light.svg" className={styles.secondaryBtn}>
              Download Wordmark - Light (SVG)
            </a>
          </div>
        </section>
      </main>
    </Layout>
  );
}

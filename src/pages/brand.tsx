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
  { name: 'Logo Icon (Cream BG)', file: 'logo-icon', desc: 'Primary app icon with cream background' },
  { name: 'Logo Icon (Transparent)', file: 'logo-icon-transparent', desc: 'Icon without background for overlays' },
  { name: 'Logo Icon (Dark BG)', file: 'logo-dark-bg', desc: 'Icon with forest green background' },
  { name: 'Wordmark - Righteous', file: 'wordmark-righteous', desc: 'Primary display font - retro geometric' },
  { name: 'Wordmark - Poppins', file: 'wordmark-poppins', desc: 'Secondary font - modern geometric sans' },
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
  const isRighteous = asset.file.includes('righteous');
  const isPoppins = asset.file.includes('poppins');
  
  // Apply the actual font to wordmark cards
  const fontStyle = isRighteous 
    ? { fontFamily: '"Righteous", cursive' }
    : isPoppins 
    ? { fontFamily: '"Poppins", sans-serif', fontWeight: 600 }
    : {};
  
  return (
    <div className={styles.logoCard}>
      <div className={`${styles.logoPreview} ${isDark ? styles.darkBg : styles.lightBg}`}>
        {(isRighteous || isPoppins) ? (
          <div className={styles.wordmarkPreview}>
            <span 
              className={styles.wordmarkText}
              style={{
                ...fontStyle,
                fontSize: '2.5rem',
                color: '#FF5500',
              }}
            >
              Spritz
            </span>
          </div>
        ) : (
          <img src={`/img/brand/${asset.file}.svg`} alt={asset.name} />
        )}
      </div>
      <div className={styles.logoInfo}>
        <h4 style={fontStyle}>{asset.name}</h4>
        <p>{asset.desc}</p>
        <div className={styles.downloadBtns}>
          <a 
            href={`/img/brand/${asset.file}.svg`} 
            download={`${asset.file}.svg`}
            className={styles.downloadBtn}
          >
            SVG
          </a>
          <a 
            href={`/img/brand/${asset.file}.png`} 
            download={`${asset.file}.png`}
            className={`${styles.downloadBtn} ${styles.downloadBtnAlt}`}
          >
            PNG
          </a>
        </div>
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
          <p className={styles.sectionDesc}>
            Spritz uses two primary fonts: <strong>Righteous</strong> for display headings and branding, 
            and <strong>Poppins</strong> for body text and UI elements.
          </p>
          
          {/* Righteous - Display Font */}
          <div className={styles.typeShowcase}>
            <h3 className={styles.fontTitle}>Righteous</h3>
            <p className={styles.fontRole}>Display & Branding</p>
            
            <div className={styles.fontModeGrid}>
              {/* Light Mode */}
              <div className={styles.fontModeCard}>
                <div className={styles.fontModeLabel}>Light Mode</div>
                <div className={styles.fontPreviewLight}>
                  <p className={styles.fontSampleLarge} style={{ fontFamily: 'Righteous, cursive', color: '#1a1a1a' }}>
                    Spritz
                  </p>
                  <p className={styles.fontSampleMedium} style={{ fontFamily: 'Righteous, cursive', color: '#1a1a1a' }}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  </p>
                  <p className={styles.fontSampleSmall} style={{ fontFamily: 'Righteous, cursive', color: '#1a1a1a' }}>
                    abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                </div>
              </div>
              
              {/* Dark Mode */}
              <div className={styles.fontModeCard}>
                <div className={styles.fontModeLabel}>Dark Mode</div>
                <div className={styles.fontPreviewDark}>
                  <p className={styles.fontSampleLarge} style={{ fontFamily: 'Righteous, cursive', color: '#ffffff' }}>
                    Spritz
                  </p>
                  <p className={styles.fontSampleMedium} style={{ fontFamily: 'Righteous, cursive', color: '#ffffff' }}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  </p>
                  <p className={styles.fontSampleSmall} style={{ fontFamily: 'Righteous, cursive', color: '#e5e5e5' }}>
                    abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                </div>
              </div>
            </div>
            
            <div className={styles.fontMeta}>
              <span><strong>Weight:</strong> 400 (Regular only)</span>
              <span><strong>Style:</strong> Retro geometric display</span>
              <a href="https://fonts.google.com/specimen/Righteous" target="_blank" rel="noopener noreferrer">
                Download from Google Fonts →
              </a>
            </div>
          </div>

          {/* Poppins - Body Font */}
          <div className={styles.typeShowcase}>
            <h3 className={styles.fontTitle}>Poppins</h3>
            <p className={styles.fontRole}>Body Text & UI</p>
            
            <div className={styles.fontModeGrid}>
              {/* Light Mode */}
              <div className={styles.fontModeCard}>
                <div className={styles.fontModeLabel}>Light Mode</div>
                <div className={styles.fontPreviewLight}>
                  <p className={styles.fontSampleLarge} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#1a1a1a' }}>
                    Spritz Chat
                  </p>
                  <p className={styles.fontSampleMedium} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, color: '#1a1a1a' }}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  </p>
                  <p className={styles.fontSampleSmall} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400, color: '#1a1a1a' }}>
                    abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                  <p className={styles.fontSampleBody} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400, color: '#4a4a4a' }}>
                    The quick brown fox jumps over the lazy dog. Spritz is a censorship-resistant messaging app for Web3.
                  </p>
                </div>
              </div>
              
              {/* Dark Mode */}
              <div className={styles.fontModeCard}>
                <div className={styles.fontModeLabel}>Dark Mode</div>
                <div className={styles.fontPreviewDark}>
                  <p className={styles.fontSampleLarge} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#ffffff' }}>
                    Spritz Chat
                  </p>
                  <p className={styles.fontSampleMedium} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, color: '#ffffff' }}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  </p>
                  <p className={styles.fontSampleSmall} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400, color: '#e5e5e5' }}>
                    abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                  <p className={styles.fontSampleBody} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400, color: '#a3a3a3' }}>
                    The quick brown fox jumps over the lazy dog. Spritz is a censorship-resistant messaging app for Web3.
                  </p>
                </div>
              </div>
            </div>

            {/* Weight Examples */}
            <div className={styles.weightShowcase}>
              <h4>Font Weights</h4>
              <div className={styles.weightCards}>
                <div className={styles.weightCard}>
                  <span className={styles.weightLabel}>Thin</span>
                  <span className={styles.weightNumber}>100</span>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 100 }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div className={styles.weightCard}>
                  <span className={styles.weightLabel}>Light</span>
                  <span className={styles.weightNumber}>300</span>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div className={styles.weightCard}>
                  <span className={styles.weightLabel}>Regular</span>
                  <span className={styles.weightNumber}>400</span>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400 }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div className={styles.weightCard}>
                  <span className={styles.weightLabel}>Medium</span>
                  <span className={styles.weightNumber}>500</span>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div className={styles.weightCard}>
                  <span className={styles.weightLabel}>Semi-Bold</span>
                  <span className={styles.weightNumber}>600</span>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div className={styles.weightCard}>
                  <span className={styles.weightLabel}>Bold</span>
                  <span className={styles.weightNumber}>700</span>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div className={styles.weightCard}>
                  <span className={styles.weightLabel}>Extra-Bold</span>
                  <span className={styles.weightNumber}>800</span>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800 }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
                <div className={styles.weightCard}>
                  <span className={styles.weightLabel}>Black</span>
                  <span className={styles.weightNumber}>900</span>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900 }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              </div>
            </div>
            
            <div className={styles.fontMeta}>
              <span><strong>Weights:</strong> 100-900</span>
              <span><strong>Styles:</strong> Normal & Italic</span>
              <a href="https://fonts.google.com/specimen/Poppins" target="_blank" rel="noopener noreferrer">
                Download from Google Fonts →
              </a>
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className={styles.typeUsage}>
            <h3>Typography Usage</h3>
            <div className={styles.usageGrid}>
              <div className={styles.usageCard}>
                <h4>Righteous</h4>
                <ul>
                  <li>Logo and wordmarks</li>
                  <li>Hero headlines</li>
                  <li>Marketing headers</li>
                  <li>Brand statements</li>
                </ul>
              </div>
              <div className={styles.usageCard}>
                <h4>Poppins</h4>
                <ul>
                  <li>Body text</li>
                  <li>UI elements</li>
                  <li>Navigation</li>
                  <li>Buttons and labels</li>
                  <li>Documentation</li>
                </ul>
              </div>
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
          <div className={styles.downloadAllGrid}>
            <div className={styles.downloadAllCard}>
              <h4>Logo Icon</h4>
              <div className={styles.downloadBtns}>
                <a href="/img/brand/logo-icon.svg" download="spritz-logo.svg" className={styles.downloadBtn}>SVG</a>
                <a href="/img/brand/logo-icon.png" download="spritz-logo.png" className={`${styles.downloadBtn} ${styles.downloadBtnAlt}`}>PNG</a>
              </div>
            </div>
            <div className={styles.downloadAllCard}>
              <h4>Logo (Transparent)</h4>
              <div className={styles.downloadBtns}>
                <a href="/img/brand/logo-icon-transparent.svg" download="spritz-logo-transparent.svg" className={styles.downloadBtn}>SVG</a>
                <a href="/img/brand/logo-icon-transparent.png" download="spritz-logo-transparent.png" className={`${styles.downloadBtn} ${styles.downloadBtnAlt}`}>PNG</a>
              </div>
            </div>
            <div className={styles.downloadAllCard}>
              <h4>Logo (Dark BG)</h4>
              <div className={styles.downloadBtns}>
                <a href="/img/brand/logo-dark-bg.svg" download="spritz-logo-dark.svg" className={styles.downloadBtn}>SVG</a>
                <a href="/img/brand/logo-dark-bg.png" download="spritz-logo-dark.png" className={`${styles.downloadBtn} ${styles.downloadBtnAlt}`}>PNG</a>
              </div>
            </div>
            <div className={styles.downloadAllCard}>
              <h4>Wordmark (Righteous)</h4>
              <div className={styles.downloadBtns}>
                <a href="/img/brand/wordmark-righteous.svg" download="spritz-wordmark-righteous.svg" className={styles.downloadBtn}>SVG</a>
                <a href="/img/brand/wordmark-righteous.png" download="spritz-wordmark-righteous.png" className={`${styles.downloadBtn} ${styles.downloadBtnAlt}`}>PNG</a>
              </div>
            </div>
            <div className={styles.downloadAllCard}>
              <h4>Wordmark (Poppins)</h4>
              <div className={styles.downloadBtns}>
                <a href="/img/brand/wordmark-poppins.svg" download="spritz-wordmark-poppins.svg" className={styles.downloadBtn}>SVG</a>
                <a href="/img/brand/wordmark-poppins.png" download="spritz-wordmark-poppins.png" className={`${styles.downloadBtn} ${styles.downloadBtnAlt}`}>PNG</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

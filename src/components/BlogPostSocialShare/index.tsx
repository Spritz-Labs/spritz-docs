import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';

interface BlogPostSocialShareProps {
    title: string;
    url: string;
    description?: string;
}

export default function BlogPostSocialShare({
    title,
    url,
    description,
}: BlogPostSocialShareProps): JSX.Element {
    const [currentUrl, setCurrentUrl] = useState(url);
    
    useEffect(() => {
        // Use the provided URL or get current page URL
        if (!url && typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, [url]);

    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedDescription = encodeURIComponent(description || title);

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        reddit: `https://reddit.com/submit?title=${encodedTitle}&url=${encodedUrl}`,
        hackernews: `https://news.ycombinator.com/submitlink?t=${encodedTitle}&u=${encodedUrl}`,
        email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`,
    };

    const handleShare = (platform: string, shareUrl: string) => {
        window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
            // Show a temporary success message
            const button = document.querySelector(`.${styles.copyButton}`) as HTMLElement;
            if (button) {
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.color = 'var(--ifm-color-primary)';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.color = '';
                }, 2000);
            }
        });
    };

    return (
        <div className={styles.socialShareContainer}>
            <div className={styles.socialShareLabel}>Share this post:</div>
            <div className={styles.socialShareButtons}>
                <button
                    className={styles.shareButton}
                    onClick={() => handleShare('twitter', shareLinks.twitter)}
                    aria-label="Share on Twitter"
                    title="Share on Twitter / X"
                >
                    <svg
                        className={styles.shareIcon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className={styles.shareButtonText}>Twitter</span>
                </button>

                <button
                    className={styles.shareButton}
                    onClick={() => handleShare('facebook', shareLinks.facebook)}
                    aria-label="Share on Facebook"
                    title="Share on Facebook"
                >
                    <svg
                        className={styles.shareIcon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className={styles.shareButtonText}>Facebook</span>
                </button>

                <button
                    className={styles.shareButton}
                    onClick={() => handleShare('linkedin', shareLinks.linkedin)}
                    aria-label="Share on LinkedIn"
                    title="Share on LinkedIn"
                >
                    <svg
                        className={styles.shareIcon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.063 2.063 0 1.139-.925 2.065-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <span className={styles.shareButtonText}>LinkedIn</span>
                </button>

                <button
                    className={styles.shareButton}
                    onClick={() => handleShare('reddit', shareLinks.reddit)}
                    aria-label="Share on Reddit"
                    title="Share on Reddit"
                >
                    <svg
                        className={styles.shareIcon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                    </svg>
                    <span className={styles.shareButtonText}>Reddit</span>
                </button>

                <button
                    className={styles.shareButton}
                    onClick={() => handleShare('hackernews', shareLinks.hackernews)}
                    aria-label="Share on Hacker News"
                    title="Share on Hacker News"
                >
                    <svg
                        className={styles.shareIcon}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M0 0v24h24V0H0zm1 1h22v22H1V1zm11.5 4.5h-1v6h1v-6zm-1 7h1v1h-1v-1zm-2-7h-1v6h1v-6zm-1 7h1v1h-1v-1zm-2-7h-1v6h1v-6zm-1 7h1v1h-1v-1zm8-7h-1v6h1v-6zm-1 7h1v1h-1v-1zm-2-7h-1v6h1v-6zm-1 7h1v1h-1v-1z" />
                    </svg>
                    <span className={styles.shareButtonText}>Hacker News</span>
                </button>

                <button
                    className={styles.shareButton}
                    onClick={() => handleShare('email', shareLinks.email)}
                    aria-label="Share via Email"
                    title="Share via Email"
                >
                    <svg
                        className={styles.shareIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span className={styles.shareButtonText}>Email</span>
                </button>

                <button
                    className={`${styles.shareButton} ${styles.copyButton}`}
                    onClick={handleCopyLink}
                    aria-label="Copy link"
                    title="Copy link to clipboard"
                >
                    <svg
                        className={styles.shareIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span className={styles.shareButtonText}>Copy Link</span>
                </button>
            </div>
        </div>
    );
}


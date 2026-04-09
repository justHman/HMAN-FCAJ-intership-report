import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Link, useLocation } from 'react-router-dom';

interface MarkdownRendererProps {
    content: string;
}

declare global {
    interface Window {
        mermaid?: {
            initialize: (config: Record<string, unknown>) => void;
            render: (id: string, definition: string) => Promise<{ svg: string }>;
        };
    }
}

const MERMAID_SCRIPT_ID = 'mermaid-cdn-script';

function renderMermaidBlocks() {
    if (!window.mermaid) return;

    window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'default',
    });

    const blocks = Array.from(document.querySelectorAll<HTMLElement>('.markdown-mermaid'));

    blocks.forEach((block, idx) => {
        if (block.dataset.processed === 'true') return;

        const definition = block.dataset.mermaid ?? block.textContent ?? '';
        if (!definition.trim()) return;

        const renderId = `mermaid-${Date.now()}-${idx}`;
        window.mermaid
            ?.render(renderId, definition)
            .then(({ svg }) => {
                block.innerHTML = svg;
                block.dataset.processed = 'true';
            })
            .catch(() => {
                // Keep raw Mermaid text visible as a fallback if rendering fails.
                block.dataset.processed = 'error';
            });
    });
}

function loadMermaidAndRender() {
    if (typeof window === 'undefined') return;

    if (window.mermaid) {
        renderMermaidBlocks();
        return;
    }

    const existing = document.getElementById(MERMAID_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
        if (existing.dataset.loaded === 'true') {
            renderMermaidBlocks();
            return;
        }
        existing.addEventListener('load', renderMermaidBlocks, { once: true });
        return;
    }

    const script = document.createElement('script');
    script.id = MERMAID_SCRIPT_ID;
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
        script.dataset.loaded = 'true';
        renderMermaidBlocks();
    };
    document.body.appendChild(script);
}

/**
 * Resolve a relative href against the current route path.
 * E.g. current = "/workshop/4.6-Automation-Setup",
 *      href    = "4.6.1-FriendRequest/"
 *   → "/workshop/4.6-Automation-Setup/4.6.1-FriendRequest"
 *
 * Handles "../" navigation as well:
 *      href    = "../4.5-Processing-Setup/"
 *   → "/workshop/4.5-Processing-Setup"
 */
function resolveRelativeHref(href: string, currentPath: string): string {
    // Strip trailing slash from href for cleanliness
    const cleanHref = href.replace(/\/+$/, '');
    // Split current path into segments
    const segments = currentPath.split('/').filter(Boolean);

    if (cleanHref.startsWith('../')) {
        // Go up one directory
        const parts = cleanHref.split('/');
        let upCount = 0;
        while (parts[0] === '..') {
            parts.shift();
            upCount++;
        }
        const base = segments.slice(0, segments.length - upCount);
        return '/' + [...base, ...parts].filter(Boolean).join('/');
    }

    // Simple relative path — append to current
    return currentPath.replace(/\/+$/, '') + '/' + cleanHref;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    const location = useLocation();

    useEffect(() => {
        if (!content.includes('```mermaid')) return;
        loadMermaidAndRender();
    }, [content]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
                // Headings with proper styling
                h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 pb-3 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-16 after:h-1 after:bg-gradient-to-r after:from-accent-orange after:to-amber-400 after:rounded">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-6 pb-2 border-b border-gray-200">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4">{children}</h3>
                ),
                h4: ({ children }) => (
                    <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-3">{children}</h4>
                ),

                // Paragraphs
                p: ({ children }) => (
                    <p className="text-text-secondary leading-relaxed mb-4">{children}</p>
                ),

                // Strong/Bold text
                strong: ({ children }) => (
                    <strong className="font-semibold text-text-primary">{children}</strong>
                ),

                // Links - internal vs external
                a: ({ href, children }) => {
                    if (!href) {
                        return <span className="text-accent-orange">{children}</span>;
                    }
                    // Absolute external link
                    if (href.startsWith('http://') || href.startsWith('https://')) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-orange hover:underline"
                            >
                                {children}
                            </a>
                        );
                    }
                    // Internal absolute path (starts with /)
                    if (href.startsWith('/')) {
                        return (
                            <Link to={href} className="text-accent-orange hover:underline">
                                {children}
                            </Link>
                        );
                    }
                    // Relative path — resolve against current route
                    const resolved = resolveRelativeHref(href, location.pathname);
                    return (
                        <Link to={resolved} className="text-accent-orange hover:underline">
                            {children}
                        </Link>
                    );
                },

                // Unordered lists
                ul: ({ children, ...props }) => {
                    // Check if this is a nested list by looking at the depth
                    const isNested = props.node?.position?.start?.column && props.node.position.start.column > 1;
                    return (
                        <ul className={`space-y-2 mb-4 text-text-secondary pl-6 ${isNested ? 'list-[circle] mt-2' : 'list-disc'}`}>
                            {children}
                        </ul>
                    );
                },

                // Ordered lists
                ol: ({ children }) => (
                    <ol className="list-decimal space-y-2 mb-4 text-text-secondary pl-6">
                        {children}
                    </ol>
                ),

                // List items
                li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,

                // Horizontal rule
                hr: () => <hr className="my-8 border-gray-200" />,

                // Tables with nice styling
                table: ({ children }) => (
                    <div className="overflow-x-auto my-6">
                        <table className="content-table">{children}</table>
                    </div>
                ),
                thead: ({ children }) => <thead>{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => <th>{children}</th>,
                td: ({ children }) => <td className="text-text-secondary">{children}</td>,

                // Code blocks
                code: ({ className, children }) => {
                    const language = className?.replace('language-', '').toLowerCase();
                    const isInline = !className;
                    if (isInline) {
                        return (
                            <code className="bg-gray-100 text-rose-600 px-1.5 py-0.5 rounded text-sm font-mono">
                                {children}
                            </code>
                        );
                    }

                    if (language === 'mermaid') {
                        const definition = String(children).replace(/\n$/, '');
                        return (
                            <div className="my-6 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4">
                                <div className="markdown-mermaid" data-mermaid={definition}>
                                    {definition}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div className="code-block">
                            <div className="code-header">
                                <span>{language || 'code'}</span>
                            </div>
                            <pre className="code-content">
                                <code>{children}</code>
                            </pre>
                        </div>
                    );
                },

                // Blockquotes for admonitions
                blockquote: ({ children }) => (
                    <blockquote className="admonition-note">{children}</blockquote>
                ),

                // Images
                img: ({ src, alt }) => (
                    <img
                        src={src}
                        alt={alt || ''}
                        className="content-image max-w-full h-auto mx-auto"
                    />
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

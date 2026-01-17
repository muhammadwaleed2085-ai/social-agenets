'use client';

import React, { memo, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedMarkdownProps {
    content: string;
    className?: string;
    variant?: 'default' | 'compact' | 'chat';
}

// Enhanced code block with copy functionality and language detection
const CodeBlock: React.FC<{
    language?: string;
    children: string;
    variant?: 'default' | 'compact' | 'chat';
}> = ({ language, children, variant = 'default' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    return (
        <div className={cn(
            "relative group",
            variant === 'compact' ? "my-2" : "my-4"
        )}>
            {/* Header with language and copy button */}
            <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-t-lg border border-b-0 border-border">
                <span className="text-xs font-mono text-muted-foreground">
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background/80 rounded transition-colors"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Code content */}
            <pre className="bg-muted/30 rounded-b-lg p-4 overflow-x-auto border border-border text-sm">
                <code className="font-mono text-foreground leading-relaxed">
                    {children}
                </code>
            </pre>
        </div>
    );
};

// Enhanced inline code styling
const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <code className="px-1.5 py-0.5 bg-muted/70 text-foreground rounded font-mono text-[13px] border border-border/40">
        {children}
    </code>
);

// Enhanced link component with external link indicator
const EnhancedLink: React.FC<{ 
    href?: string; 
    children?: React.ReactNode;
    title?: string;
}> = ({ href, children, title }) => {
    const isExternal = href?.startsWith('http') || href?.startsWith('https');
    
    return (
        <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            title={title}
            className="text-primary hover:text-primary/80 underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60 transition-colors inline-flex items-center gap-1"
        >
            {children}
            {isExternal && (
                <ExternalLink className="h-3 w-3 opacity-60" />
            )}
        </a>
    );
};

// Enhanced table components
const EnhancedTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border shadow-sm">
        <table className="w-full border-collapse">
            {children}
        </table>
    </div>
);

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <th className="bg-muted/50 px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">
        {children}
    </th>
);

const TableCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <td className="px-4 py-3 text-sm text-foreground border-b border-border/50 last:border-b-0">
        {children}
    </td>
);

// Enhanced blockquote
const EnhancedBlockquote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <blockquote className="border-l-4 border-primary/50 pl-6 py-2 my-4 bg-muted/20 rounded-r-lg text-muted-foreground italic relative">
        <div className="absolute left-2 top-2 text-primary/30 text-2xl leading-none">"</div>
        {children}
    </blockquote>
);

// Main component factory function
const createMarkdownComponents = (variant: 'default' | 'compact' | 'chat' = 'default') => ({
    // Headings with improved spacing and typography
    h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className={cn(
            "font-bold text-primary border-b border-border/30 pb-2",
            variant === 'compact' ? "text-lg mt-4 mb-2" : "text-xl mt-6 mb-3"
        )}>
            {children}
        </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className={cn(
            "font-bold text-primary",
            variant === 'compact' ? "text-base mt-3 mb-2" : "text-lg mt-5 mb-3"
        )}>
            {children}
        </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className={cn(
            "font-semibold text-foreground",
            variant === 'compact' ? "text-sm mt-3 mb-1" : "text-base mt-4 mb-2"
        )}>
            {children}
        </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
        <h4 className={cn(
            "font-semibold text-foreground",
            variant === 'compact' ? "text-xs mt-2 mb-1" : "text-sm mt-3 mb-2"
        )}>
            {children}
        </h4>
    ),

    // Enhanced paragraphs
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className={cn(
            "text-foreground leading-relaxed",
            variant === 'compact' ? "text-sm mb-2" : "text-[15px] mb-3 leading-[1.7]"
        )}>
            {children}
        </p>
    ),

    // Links
    a: EnhancedLink,

    // Enhanced lists
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className={cn(
            "space-y-1 list-disc marker:text-primary/70",
            variant === 'compact' ? "pl-4 my-2" : "pl-6 my-3"
        )}>
            {children}
        </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className={cn(
            "space-y-1 list-decimal marker:text-primary/70",
            variant === 'compact' ? "pl-4 my-2" : "pl-6 my-3"
        )}>
            {children}
        </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className={cn(
            "text-foreground pl-2",
            variant === 'compact' ? "text-sm leading-relaxed" : "text-[15px] leading-relaxed"
        )}>
            {children}
        </li>
    ),

    // Blockquote
    blockquote: EnhancedBlockquote,

    // Horizontal rule
    hr: () => (
        <hr className={cn(
            "border-border",
            variant === 'compact' ? "my-3" : "my-6"
        )} />
    ),

    // Enhanced tables
    table: EnhancedTable,
    th: TableHeader,
    td: TableCell,
    tr: ({ children }: { children?: React.ReactNode }) => (
        <tr className="hover:bg-muted/30 transition-colors">
            {children}
        </tr>
    ),

    // Text formatting
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold text-foreground">
            {children}
        </strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-foreground">
            {children}
        </em>
    ),

    // Enhanced images
    img: ({ src, alt, title }: { src?: string; alt?: string; title?: string }) => (
        <span className={cn(
            "block rounded-lg overflow-hidden border border-border shadow-sm",
            variant === 'compact' ? "my-2" : "my-4"
        )}>
            <img
                src={src}
                alt={alt || 'Image'}
                title={title}
                className="w-full h-auto"
                loading="lazy"
            />
            {(alt || title) && (
                <span className="block text-xs text-muted-foreground p-2 bg-muted/30 text-center">
                    {alt || title}
                </span>
            )}
        </span>
    ),

    // Enhanced code blocks
    code: ({ 
        inline, 
        className, 
        children 
    }: { 
        inline?: boolean; 
        className?: string; 
        children?: React.ReactNode; 
    }) => {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : undefined;
        const code = String(children).replace(/\n$/, '');

        if (!inline && (language || code.includes('\n'))) {
            return <CodeBlock language={language} variant={variant}>{code}</CodeBlock>;
        }

        return <InlineCode>{children}</InlineCode>;
    },
    
    // Pre wrapper (handled by code component)
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
});

/**
 * Enhanced Markdown Component with improved styling and functionality
 * 
 * Features:
 * - Syntax highlighting for code blocks
 * - Copy functionality for code
 * - Enhanced typography and spacing
 * - Better table styling
 * - External link indicators
 * - Responsive design
 * - Multiple variants (default, compact, chat)
 */
export const EnhancedMarkdown: React.FC<EnhancedMarkdownProps> = memo(({
    content,
    className = '',
    variant = 'default'
}) => {
    const components = useMemo(() => createMarkdownComponents(variant), [variant]);

    return (
        <div className={cn(
            "enhanced-markdown",
            variant === 'compact' && "text-sm",
            variant === 'chat' && "max-w-none",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components as any}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

EnhancedMarkdown.displayName = 'EnhancedMarkdown';

export default EnhancedMarkdown;

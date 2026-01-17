'use client';

import React, { memo } from 'react';
import { EnhancedMarkdown } from './EnhancedMarkdown';

interface MarkdownContentProps {
    content: string;
    className?: string;
}

/**
 * MarkdownContent - Enhanced markdown renderer with improved styling and functionality
 * Now uses the unified EnhancedMarkdown component for consistency
 */
export const MarkdownContent: React.FC<MarkdownContentProps> = memo(({
    content,
    className = '',
}) => {
    return (
        <EnhancedMarkdown 
            content={content}
            className={className}
            variant="chat"
        />
    );
});

MarkdownContent.displayName = 'MarkdownContent';

export default MarkdownContent;

/**
 * MarkdownText Component
 * 
 * Enhanced markdown renderer with improved styling and functionality.
 * Now uses the unified EnhancedMarkdown component for consistency.
 */

import React, { memo } from 'react';
import { EnhancedMarkdown } from '../components/EnhancedMarkdown';

interface MarkdownTextProps {
    children: string;
    className?: string;
    variant?: 'default' | 'compact' | 'chat';
}

const MarkdownTextImpl: React.FC<MarkdownTextProps> = ({ 
    children, 
    className = '', 
    variant = 'default' 
}) => {
    return (
        <EnhancedMarkdown 
            content={children}
            className={className}
            variant={variant}
        />
    );
};

export const MarkdownText = memo(MarkdownTextImpl);

// Fallback for cases where react-markdown isn't available
export { renderMarkdown } from './markdown';

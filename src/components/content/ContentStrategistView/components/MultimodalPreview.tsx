/**
 * MultimodalPreview Component
 * 
 * Renders images and files in chat messages.
 * Based on langchain-ai/agent-chat-ui pattern.
 */

import React from 'react';
import { FileText, X } from 'lucide-react';
import Image from 'next/image';

export interface MultimodalPreviewProps {
    type: 'image' | 'file';
    url: string;
    name: string;
    mimeType?: string;
    removable?: boolean;
    onRemove?: () => void;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
};

const sizePixels = {
    sm: 40,
    md: 64,
    lg: 96,
};

export const MultimodalPreview: React.FC<MultimodalPreviewProps> = ({
    type,
    url,
    name,
    mimeType,
    removable = false,
    onRemove,
    size = 'md',
}) => {
    // Image preview
    if (type === 'image') {
        return (
            <div className="relative inline-block">
                <Image
                    src={url}
                    alt={name}
                    width={sizePixels[size]}
                    height={sizePixels[size]}
                    className={`rounded-lg object-cover border border-border ${sizeClasses[size]}`}
                />
                {removable && onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute -top-1.5 -right-1.5 z-10 p-0.5 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors"
                        aria-label="Remove image"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        );
    }

    // PDF/Document preview
    const isPdf = mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');

    return (
        <div className="relative flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
            <FileText className={`flex-shrink-0 ${isPdf ? 'text-red-500' : 'text-muted-foreground'} ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />
            <span className="text-sm text-foreground truncate max-w-[150px]">{name}</span>
            {removable && onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-1 p-0.5 rounded hover:bg-accent transition-colors"
                    aria-label="Remove file"
                >
                    <X className="h-3 w-3 text-muted-foreground" />
                </button>
            )}
        </div>
    );
};

/**
 * AttachmentsPreview Component
 * 
 * Renders multiple attachments in a flex container.
 */
export interface AttachmentsPreviewProps {
    attachments: Array<{
        type: 'image' | 'file';
        url: string;
        name: string;
    }>;
    onRemove?: (index: number) => void;
    size?: 'sm' | 'md' | 'lg';
}

export const AttachmentsPreview: React.FC<AttachmentsPreviewProps> = ({
    attachments,
    onRemove,
    size = 'md',
}) => {
    if (!attachments?.length) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((file, idx) => (
                <MultimodalPreview
                    key={idx}
                    type={file.type}
                    url={file.url}
                    name={file.name}
                    removable={!!onRemove}
                    onRemove={() => onRemove?.(idx)}
                    size={size}
                />
            ))}
        </div>
    );
};

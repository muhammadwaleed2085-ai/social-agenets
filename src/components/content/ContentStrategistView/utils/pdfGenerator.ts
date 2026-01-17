import { toast } from 'react-hot-toast';

export interface PDFGenerationOptions {
    fileName: string;
    fileContent: string;
    isMarkdown?: boolean;
}

/**
 * Professional PDF Generation utility
 * Uses browser's native print functionality for best quality PDF output
 */
export class EnhancedPDFGenerator {
    
    /**
     * Convert markdown to clean HTML
     */
    private static markdownToHTML(markdown: string): string {
        let html = markdown;
        
        // Escape HTML entities first (but preserve markdown syntax)
        html = html.replace(/&/g, '&amp;');
        
        // Code blocks (must be first to prevent other replacements inside)
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
            const escapedCode = code.trim()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `<pre class="code-block"><code>${escapedCode}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Headers (process from h4 to h1 to avoid conflicts)
        html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Blockquotes
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\*\*\*$/gm, '<hr>');
        
        // Process lists - find consecutive list items and wrap them
        // Ordered lists
        html = html.replace(/(?:^|\n)((?:\d+\. .+\n?)+)/g, (match, listContent) => {
            const items = listContent.trim().split('\n')
                .filter((line: string) => line.match(/^\d+\. /))
                .map((line: string) => {
                    const content = line.replace(/^\d+\. /, '');
                    return `<li>${content}</li>`;
                })
                .join('\n');
            return `\n<ol>\n${items}\n</ol>\n`;
        });
        
        // Unordered lists
        html = html.replace(/(?:^|\n)((?:[-*+] .+\n?)+)/g, (match, listContent) => {
            const items = listContent.trim().split('\n')
                .filter((line: string) => line.match(/^[-*+] /))
                .map((line: string) => {
                    const content = line.replace(/^[-*+] /, '');
                    return `<li>${content}</li>`;
                })
                .join('\n');
            return `\n<ul>\n${items}\n</ul>\n`;
        });
        
        // Paragraphs - wrap remaining text blocks
        const lines = html.split('\n');
        const processedLines: string[] = [];
        let paragraphContent: string[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Check if line is a block element
            const isBlockElement = /^<(h[1-6]|ul|ol|li|pre|blockquote|hr|div)/.test(trimmed) ||
                                   /^<\/(h[1-6]|ul|ol|li|pre|blockquote|div)>/.test(trimmed);
            
            if (isBlockElement || trimmed === '') {
                // Flush paragraph
                if (paragraphContent.length > 0) {
                    processedLines.push(`<p>${paragraphContent.join(' ')}</p>`);
                    paragraphContent = [];
                }
                if (trimmed !== '') {
                    processedLines.push(line);
                }
            } else if (!trimmed.startsWith('<') || trimmed.startsWith('<a') || trimmed.startsWith('<strong') || trimmed.startsWith('<em') || trimmed.startsWith('<code')) {
                paragraphContent.push(trimmed);
            } else {
                processedLines.push(line);
            }
        }
        
        // Flush remaining paragraph
        if (paragraphContent.length > 0) {
            processedLines.push(`<p>${paragraphContent.join(' ')}</p>`);
        }
        
        return processedLines.join('\n');
    }

    /**
     * Get the CSS styles for PDF
     */
    private static getStyles(): string {
        return `
            @page {
                size: A4;
                margin: 20mm;
            }
            
            * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
            }
            
            body {
                font-family: Georgia, 'Times New Roman', Times, serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #333;
                background: white;
            }
            
            h1 {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 24pt;
                font-weight: 700;
                color: #1a56db;
                margin: 0 0 16pt 0;
                padding-bottom: 8pt;
                border-bottom: 2pt solid #e5e7eb;
            }
            
            h2 {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 18pt;
                font-weight: 700;
                color: #1e40af;
                margin: 24pt 0 12pt 0;
            }
            
            h3 {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 14pt;
                font-weight: 600;
                color: #374151;
                margin: 18pt 0 8pt 0;
            }
            
            h4 {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 12pt;
                font-weight: 600;
                color: #4b5563;
                margin: 14pt 0 6pt 0;
            }
            
            p {
                margin: 0 0 12pt 0;
                text-align: justify;
            }
            
            ul, ol {
                margin: 12pt 0 12pt 0;
                padding-left: 24pt;
            }
            
            li {
                margin: 8pt 0;
            }
            
            li strong {
                color: #1a56db;
            }
            
            strong {
                font-weight: 700;
            }
            
            em {
                font-style: italic;
            }
            
            a {
                color: #2563eb;
                text-decoration: underline;
            }
            
            blockquote {
                margin: 16pt 0;
                padding: 12pt 16pt;
                border-left: 4pt solid #3b82f6;
                background: #f8fafc;
                font-style: italic;
                color: #64748b;
            }
            
            .code-block {
                background: #f3f4f6;
                border: 1pt solid #d1d5db;
                border-radius: 4pt;
                padding: 12pt;
                margin: 12pt 0;
                font-family: 'Consolas', 'Courier New', monospace;
                font-size: 10pt;
                white-space: pre-wrap;
                overflow-wrap: break-word;
            }
            
            .inline-code {
                background: #f3f4f6;
                padding: 2pt 4pt;
                border-radius: 3pt;
                font-family: 'Consolas', 'Courier New', monospace;
                font-size: 10pt;
            }
            
            hr {
                border: none;
                border-top: 1pt solid #d1d5db;
                margin: 24pt 0;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 16pt 0;
            }
            
            th, td {
                border: 1pt solid #d1d5db;
                padding: 8pt;
                text-align: left;
            }
            
            th {
                background: #f3f4f6;
                font-weight: 600;
            }
        `;
    }

    /**
     * Generate PDF using browser's native print dialog
     * This produces the best quality PDF output
     */
    static async generatePDF(options: PDFGenerationOptions): Promise<void> {
        const { fileName, fileContent, isMarkdown = false } = options;

        if (!fileContent || !fileName) {
            toast.error('No content to export');
            return;
        }

        try {
            // Convert content
            const htmlContent = isMarkdown 
                ? this.markdownToHTML(fileContent)
                : `<pre style="white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 10pt;">${fileContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;

            // Create a new window for printing
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            
            if (!printWindow) {
                toast.error('Please allow popups to generate PDF');
                return;
            }

            // Write the HTML content
            printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${fileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Document'}</title>
    <style>
        ${this.getStyles()}
        
        @media print {
            body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`);
            
            printWindow.document.close();
            
            // Wait for content to load then trigger print
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    // Close after a delay to allow print dialog
                    setTimeout(() => {
                        printWindow.close();
                    }, 1000);
                }, 250);
            };

            toast.success('Print dialog opened - Save as PDF');

        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Failed to generate PDF');
        }
    }
}

export default EnhancedPDFGenerator;

import React from 'react';

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

export default function MarkdownRenderer({ text, className = '' }: MarkdownRendererProps) {
  if (!text) return null;

  // Split text by lines
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  
  let currentBlockType: 'paragraph' | 'list-bullet' | 'list-number' | 'table' | 'blockquote' | null = null;
  let currentBlockLines: string[] = [];

  const renderInline = (content: string): React.ReactNode[] => {
    // Parse bold, italic, links, images, code
    const tokenRegex = /(\!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|`.*?`|\*\*.*?\*\*|\*.*?\*)/g;
    const tokens = content.split(tokenRegex);
    
    return tokens.map((token, index) => {
      // Image: ![alt](url)
      if (token.startsWith('![') && token.includes('](')) {
        const alt = token.slice(2, token.indexOf(']'));
        const url = token.slice(token.indexOf('](') + 2, -1);
        return (
          <img 
            key={index} 
            src={url} 
            alt={alt} 
            className="rounded-xl my-4 mx-auto max-h-[400px] object-contain shadow-sm border border-border" 
          />
        );
      }
      
      // Link: [text](url)
      if (token.startsWith('[') && token.includes('](')) {
        const linkText = token.slice(1, token.indexOf(']'));
        const url = token.slice(token.indexOf('](') + 2, -1);
        return (
          <a 
            key={index} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
          >
            {linkText}
          </a>
        );
      }

      // Code inline: `code`
      if (token.startsWith('`') && token.endsWith('`')) {
        const code = token.slice(1, -1);
        return (
          <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold text-rose-500">
            {code}
          </code>
        );
      }
      
      // Bold: **text**
      if (token.startsWith('**') && token.endsWith('**')) {
        const boldText = token.slice(2, -2);
        return <strong key={index} className="font-extrabold text-foreground">{boldText}</strong>;
      }
      
      // Italic: *text*
      if (token.startsWith('*') && token.endsWith('*')) {
        const italicText = token.slice(1, -1);
        return <em key={index} className="italic text-muted-foreground">{italicText}</em>;
      }
      
      return token;
    });
  };

  const flushBlock = (key: number) => {
    if (currentBlockLines.length === 0) return;

    if (currentBlockType === 'paragraph') {
      blocks.push(
        <p key={key} className="text-muted-foreground leading-relaxed text-sm md:text-base my-3">
          {renderInline(currentBlockLines.join('\n'))}
        </p>
      );
    } else if (currentBlockType === 'list-bullet') {
      blocks.push(
        <ul key={key} className="list-disc list-inside pl-4 my-3 space-y-1.5 text-muted-foreground text-sm md:text-base">
          {currentBlockLines.map((line, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(line.replace(/^(\*\s*|-\s*)/, ''))}
            </li>
          ))}
        </ul>
      );
    } else if (currentBlockType === 'list-number') {
      blocks.push(
        <ol key={key} className="list-decimal list-inside pl-4 my-3 space-y-1.5 text-muted-foreground text-sm md:text-base">
          {currentBlockLines.map((line, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(line.replace(/^\d+\.\s*/, ''))}
            </li>
          ))}
        </ol>
      );
    } else if (currentBlockType === 'blockquote') {
      blocks.push(
        <blockquote key={key} className="border-l-4 border-indigo-600 bg-indigo-500/[0.03] px-5 py-3 my-4 rounded-r-xl italic text-muted-foreground text-sm md:text-base leading-relaxed border-border">
          {renderInline(currentBlockLines.map(line => line.replace(/^>\s*/, '')).join('\n'))}
        </blockquote>
      );
    } else if (currentBlockType === 'table') {
      const rawRows = currentBlockLines.map(line => 
        line.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      );

      const tableRows = rawRows.filter(row => !row.every(cell => cell.startsWith('---') || cell === ''));
      
      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const dataRows = tableRows.slice(1);
        
        blocks.push(
          <div key={key} className="overflow-x-auto my-6 border border-border rounded-xl shadow-sm bg-card">
            <table className="min-w-full divide-y divide-border text-sm md:text-base">
              <thead className="bg-muted/40">
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider border-r border-border last:border-r-0">
                      {renderInline(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {dataRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/10 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-muted-foreground border-r border-border last:border-r-0 whitespace-normal leading-relaxed">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    currentBlockLines = [];
    currentBlockType = null;
  };

  let blockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      flushBlock(blockKey++);
      continue;
    }

    // Check for Headings
    if (trimmed.startsWith('# ')) {
      flushBlock(blockKey++);
      blocks.push(
        <h1 key={blockKey++} className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-6 mb-4 leading-tight">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushBlock(blockKey++);
      blocks.push(
        <h2 key={blockKey++} className="text-xl md:text-2xl font-bold text-foreground tracking-tight mt-5 mb-3 border-b border-border pb-1.5 leading-tight">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushBlock(blockKey++);
      blocks.push(
        <h3 key={blockKey++} className="text-lg md:text-xl font-bold text-foreground tracking-tight mt-4 mb-2 leading-tight">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Check for Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      flushBlock(blockKey++);
      blocks.push(<hr key={blockKey++} className="border-t border-border my-6" />);
      continue;
    }

    // Check for Blockquote
    if (trimmed.startsWith('>')) {
      if (currentBlockType !== 'blockquote') {
        flushBlock(blockKey++);
        currentBlockType = 'blockquote';
      }
      currentBlockLines.push(line);
      continue;
    }

    // Check for Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (currentBlockType !== 'table') {
        flushBlock(blockKey++);
        currentBlockType = 'table';
      }
      currentBlockLines.push(trimmed);
      continue;
    }

    // Check for Lists
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
    const isNumber = /^\d+\.\s+/.test(trimmed);

    if (isBullet) {
      if (currentBlockType !== 'list-bullet') {
        flushBlock(blockKey++);
        currentBlockType = 'list-bullet';
      }
      currentBlockLines.push(trimmed);
      continue;
    }

    if (isNumber) {
      if (currentBlockType !== 'list-number') {
        flushBlock(blockKey++);
        currentBlockType = 'list-number';
      }
      currentBlockLines.push(trimmed);
      continue;
    }

    // Regular paragraph lines
    if (currentBlockType !== 'paragraph') {
      flushBlock(blockKey++);
      currentBlockType = 'paragraph';
    }
    currentBlockLines.push(line);
  }

  // Flush the final block
  flushBlock(blockKey++);

  return <div className={`max-w-none ${className}`}>{blocks}</div>;
}

import React from 'react';
import katex from 'katex';

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

interface NumberedListItem {
  text: string;
  subBullets: string[];
}

export default function MarkdownRenderer({ text, className = '' }: MarkdownRendererProps) {
  if (!text) return null;

  // Split text by lines
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  
  let currentBlockType: 'paragraph' | 'list-bullet' | 'list-number' | 'table' | 'blockquote' | null = null;
  let currentBlockLines: string[] = [];
  let currentNumberedItems: NumberedListItem[] = [];
  let currentListStartNum = 1;

  const renderInline = (content: string): React.ReactNode[] => {
    // Parse math $$...$$ and $...$, image ![alt](url), link [text](url), inline code `code`, bold **text**, italic *text*
    const tokenRegex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|`.*?`|\*\*.*?\*\*|\*.*?\*)/g;
    const tokens = content.split(tokenRegex);
    
    return tokens.map((token, index) => {
      // Math Display: $$...$$
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const rawMath = token.slice(2, -2);
        try {
          const html = katex.renderToString(rawMath, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="block my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={index}>{token}</code>;
        }
      }

      // Math Inline: $...$
      if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
        const rawMath = token.slice(1, -1);
        try {
          const html = katex.renderToString(rawMath, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={index}>{token}</code>;
        }
      }

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
            {renderInline(linkText)}
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
        return <strong key={index} className="font-extrabold text-foreground">{renderInline(boldText)}</strong>;
      }
      
      // Italic: *text*
      if (token.startsWith('*') && token.endsWith('*')) {
        const italicText = token.slice(1, -1);
        return <em key={index} className="italic text-muted-foreground">{renderInline(italicText)}</em>;
      }
      
      // Auto replace unescaped LaTeX arrow symbols or shortcuts
      const formattedText = token
        .replace(/\\rightarrow/g, '→')
        .replace(/\\leftarrow/g, '←')
        .replace(/\\Rightarrow/g, '⇒')
        .replace(/\\Leftarrow/g, '⇐')
        .replace(/\\leftrightarrow/g, '↔')
        .replace(/\\to/g, '→');

      return formattedText;
    });
  };

  const flushBlock = (key: number) => {
    if (currentBlockType === 'list-number') {
      if (currentNumberedItems.length > 0) {
        blocks.push(
          <ol key={key} start={currentListStartNum} className="list-decimal pl-6 my-3 space-y-2 text-muted-foreground text-sm md:text-base">
            {currentNumberedItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                <span>{renderInline(item.text)}</span>
                {item.subBullets.length > 0 && (
                  <ul className="list-disc pl-5 mt-1.5 space-y-1 text-muted-foreground">
                    {item.subBullets.map((sub, sIdx) => (
                      <li key={sIdx} className="leading-relaxed">
                        {renderInline(sub)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        );
      }
      currentNumberedItems = [];
      currentListStartNum = 1;
      currentBlockLines = [];
      currentBlockType = null;
      return;
    }

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
    } else if (currentBlockType === 'blockquote') {
      blocks.push(
        <blockquote key={key} className="border-l-4 border-indigo-600 bg-indigo-500/[0.03] px-5 py-3 my-4 rounded-r-xl italic text-muted-foreground text-sm md:text-base leading-relaxed border-border">
          {renderInline(currentBlockLines.map(line => line.replace(/^>\s*/, '')).join('\n'))}
        </blockquote>
      );
    } else if (currentBlockType === 'table') {
      const rawRows = currentBlockLines.map(line => {
        let parts = line.split('|').map(cell => cell.trim());
        if (parts[0] === '') parts.shift();
        if (parts[parts.length - 1] === '') parts.pop();
        return parts;
      });

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
    if (trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.includes('|'))) {
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

    if (isNumber) {
      const match = trimmed.match(/^(\d+)\.\s*(.*)/);
      const numVal = match ? parseInt(match[1]) : 1;
      const itemText = match ? match[2] : trimmed;

      if (currentBlockType !== 'list-number') {
        flushBlock(blockKey++);
        currentBlockType = 'list-number';
        currentListStartNum = numVal;
      }

      currentNumberedItems.push({
        text: itemText,
        subBullets: []
      });
      continue;
    }

    if (isBullet) {
      const bulletText = trimmed.replace(/^(\*\s*|-\s*)/, '');
      // If inside a numbered list item, nest the bullet under current numbered item
      if (currentBlockType === 'list-number' && currentNumberedItems.length > 0) {
        currentNumberedItems[currentNumberedItems.length - 1].subBullets.push(bulletText);
        continue;
      }

      if (currentBlockType !== 'list-bullet') {
        flushBlock(blockKey++);
        currentBlockType = 'list-bullet';
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

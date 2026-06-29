import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

export default function MathText({ text, className = '' }: MathTextProps) {
  if (!text) return null;

  // Split by $$...$$ first, then $...$
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const rawMath = part.slice(2, -2);
          try {
            const html = katex.renderToString(rawMath, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={i}
                className="block my-2 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            console.error('KaTeX error:', e);
            return <code key={i}>{part}</code>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const rawMath = part.slice(1, -1);
          try {
            const html = katex.renderToString(rawMath, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={i}
                className="inline-block"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            console.error('KaTeX error:', e);
            return <code key={i}>{part}</code>;
          }
        } else {
          // Regular text: render newlines as <br />
          const textLines = part.split('\n');
          return (
            <React.Fragment key={i}>
              {textLines.map((line, lineIdx) => (
                <React.Fragment key={lineIdx}>
                  {lineIdx > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }
      })}
    </span>
  );
}

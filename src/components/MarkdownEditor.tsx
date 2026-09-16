'use me';
import React, { useState, useRef } from 'react';
import { 
  Bold, Italic, Heading2, List, ListOrdered, 
  Quote, Code, Link as LinkIcon, Image as ImageIcon, 
  Table as TableIcon, Eye, Edit3, Sparkles
} from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import TableBuilderModal from '@/components/TableBuilderModal';
import ExampleBuilderModal from '@/components/ExampleBuilderModal';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  required?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  id = 'markdown-editor-textarea',
  placeholder = 'Tulis konten menggunakan format Markdown...',
  rows = 12,
  className = '',
  required = false
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isExampleModalOpen, setIsExampleModalOpen] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const savedScrollTop = textarea.scrollTop;
    const currentText = textarea.value;

    // Check if inserting a line-level prefix (e.g. '## ', '- ', '1. ', '> ')
    const isLinePrefix = (before === '## ' || before === '### ' || before === '- ' || before === '1. ' || before === '> ') && after === '';

    let newText = '';
    let newCursorStart = start;
    let newCursorEnd = end;

    if (isLinePrefix) {
      // Find start and end of line containing selection/cursor
      const lineStart = currentText.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = currentText.indexOf('\n', end);
      const actualLineEnd = lineEnd === -1 ? currentText.length : lineEnd;
      const currentLine = currentText.substring(lineStart, actualLineEnd);

      // Check if line already has this prefix (toggle behavior)
      if (currentLine.startsWith(before)) {
        const updatedLine = currentLine.slice(before.length);
        newText = currentText.substring(0, lineStart) + updatedLine + currentText.substring(actualLineEnd);
        newCursorStart = Math.max(lineStart, start - before.length);
        newCursorEnd = Math.max(lineStart, end - before.length);
      } else {
        const updatedLine = before + currentLine;
        newText = currentText.substring(0, lineStart) + updatedLine + currentText.substring(actualLineEnd);
        newCursorStart = start + before.length;
        newCursorEnd = end + before.length;
      }
    } else {
      // Inline formatting (bold, italic, code, link, image)
      const selectedText = currentText.substring(start, end);
      const replacement = before + selectedText + after;
      newText = currentText.substring(0, start) + replacement + currentText.substring(end);
      newCursorStart = start + before.length;
      newCursorEnd = start + before.length + selectedText.length;
    }

    onChange(newText);

    // Keep scroll position and refocus cursor
    setTimeout(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
      textarea.scrollTop = savedScrollTop;
    }, 0);
  };

  const handleInsertTableMarkdown = (mdTable: string) => {
    const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement);
    if (!textarea) {
      onChange(value + mdTable);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const savedScrollTop = textarea.scrollTop;
    const currentText = textarea.value;

    const newText = currentText.substring(0, start) + mdTable + currentText.substring(end);
    onChange(newText);

    setTimeout(() => {
      if (!textarea) return;
      textarea.focus();
      const newPos = start + mdTable.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.scrollTop = savedScrollTop;
    }, 0);
  };

  const handleInsertExampleMarkdown = (exampleMd: string) => {
    const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement);
    if (!textarea) {
      onChange(value + (value.endsWith('\n\n') ? '' : '\n\n') + exampleMd);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const savedScrollTop = textarea.scrollTop;
    const currentText = textarea.value;

    const formattedMd = (start > 0 && !currentText.slice(0, start).endsWith('\n\n') ? '\n\n' : '') + exampleMd + '\n';
    const newText = currentText.substring(0, start) + formattedMd + currentText.substring(end);
    onChange(newText);

    setTimeout(() => {
      if (!textarea) return;
      textarea.focus();
      const newPos = start + formattedMd.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.scrollTop = savedScrollTop;
    }, 0);
  };

  const handleToolbarButtonMouseDown = (e: React.MouseEvent) => {
    // Prevent button click from stealing focus from textarea
    e.preventDefault();
  };

  return (
    <div className={`border border-border rounded-xl overflow-hidden shadow-sm bg-card transition-all ${className}`}>
      {/* Editor Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-3 py-2 gap-2">
        {/* Write / Preview Tab Buttons */}
        <div className="flex items-center bg-muted/70 p-1 rounded-lg border border-border">
          <button
            type="button"
            onMouseDown={handleToolbarButtonMouseDown}
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'write'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Tulis
          </button>
          <button
            type="button"
            onMouseDown={handleToolbarButtonMouseDown}
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'preview'
                ? 'bg-card text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Pratinjau
          </button>
        </div>

        {/* Markdown Toolbar Formatting Tools */}
        {activeTab === 'write' && (
          <div className="flex flex-wrap items-center gap-0.5">
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('**', '**')}
              title="Teks Tebal (Bold)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('*', '*')}
              title="Teks Miring (Italic)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('## ')}
              title="Judul Sub-Bab (H2)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('- ')}
              title="Daftar Bullet"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('1. ')}
              title="Daftar Angka"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('> ')}
              title="Kutipan (Quote)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('`', '`')}
              title="Format Kode"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Code className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('[Teks Link](', ')')}
              title="Sisipkan Tautan (Link)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => insertMarkdown('![Deskripsi Gambar](', ')')}
              title="Sisipkan Gambar"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            {/* TABLE BUILDER BUTTON */}
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => setIsTableModalOpen(true)}
              title="Buat / Sisipkan Tabel"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors ml-1"
            >
              <TableIcon className="h-4 w-4" />
              <span>+ Tabel</span>
            </button>

            {/* EXAMPLE / PATTERN BUILDER BUTTON */}
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => setIsExampleModalOpen(true)}
              title="Buat Contoh Soal / Pola Analogi / Silogisme"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors ml-1"
            >
              <Sparkles className="h-4 w-4" />
              <span>+ Pola / Contoh</span>
            </button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div className="bg-card">
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            id={id}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 text-sm md:text-base outline-none bg-transparent font-sans leading-relaxed text-foreground min-h-[240px] resize-y"
            required={required}
          />
        ) : (
          <div className="p-5 overflow-y-auto min-h-[240px] max-h-[500px] border-t border-border bg-card dark:bg-card/40">
            {value.trim() ? (
              <MarkdownRenderer text={value} />
            ) : (
              <p className="text-muted-foreground text-sm italic text-center py-10">
                Belum ada konten untuk dipratinjau. Silakan tulis di tab &quot;Tulis&quot;.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Table Builder Modal */}
      <TableBuilderModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsertTable={handleInsertTableMarkdown}
      />

      {/* Example / Pattern Builder Modal */}
      <ExampleBuilderModal
        isOpen={isExampleModalOpen}
        onClose={() => setIsExampleModalOpen(false)}
        onInsertExample={handleInsertExampleMarkdown}
      />
    </div>
  );
}

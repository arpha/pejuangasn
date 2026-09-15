'use me';
import React, { useState, useRef } from 'react';
import { 
  Bold, Italic, Heading2, List, ListOrdered, 
  Quote, Code, Link as LinkIcon, Image as ImageIcon, 
  Table as TableIcon, Eye, Edit3, Sparkles 
} from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import TableBuilderModal from '@/components/TableBuilderModal';

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);
    const replacement = before + selectedText + after;

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 10);
  };

  const handleInsertTableMarkdown = (mdTable: string) => {
    const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement);
    if (!textarea) {
      onChange(value + mdTable);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const newText = currentText.substring(0, start) + mdTable + currentText.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + mdTable.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  return (
    <div className={`border border-border rounded-xl overflow-hidden shadow-sm bg-card transition-all ${className}`}>
      {/* Editor Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-3 py-2 gap-2">
        {/* Write / Preview Tab Buttons */}
        <div className="flex items-center bg-muted/70 p-1 rounded-lg border border-border">
          <button
            type="button"
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
              onClick={() => insertMarkdown('**', '**')}
              title="Teks Tebal (Bold)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*')}
              title="Teks Miring (Italic)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('## ')}
              title="Judul Sub-Bab (H2)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              type="button"
              onClick={() => insertMarkdown('- ')}
              title="Daftar Bullet"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('1. ')}
              title="Daftar Angka"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('> ')}
              title="Kutipan (Quote)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('`', '`')}
              title="Format Kode"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Code className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              type="button"
              onClick={() => insertMarkdown('[Teks Link](', ')')}
              title="Sisipkan Tautan (Link)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('![Deskripsi Gambar](', ')')}
              title="Sisipkan Gambar"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            {/* TABLE BUILDER BUTTON */}
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              title="Buat / Sisipkan Tabel"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors ml-1"
            >
              <TableIcon className="h-4 w-4" />
              <span>+ Tabel</span>
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
    </div>
  );
}

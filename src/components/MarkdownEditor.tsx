'use client';
import React, { useState, useRef } from 'react';
import { 
  Bold, Italic, Heading2, List, ListOrdered, 
  Quote, Code, Link as LinkIcon, Image as ImageIcon, Upload,
  Table as TableIcon, Eye, Edit3, Sparkles, Boxes, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import TableBuilderModal from '@/components/TableBuilderModal';
import ExampleBuilderModal from '@/components/ExampleBuilderModal';
import { compressImage } from '@/lib/image';

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
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleInsertDiagram = () => {
    const template = `\n\`\`\`
[ PEMETAAN DIAGRAM VENN ]

1. Semua A adalah B         2. Sebagian A adalah B
+-------------------+       +-------------------+
|   +-----+         |       |   +---+---+       |
|   |  A  |    B    |       |   | A | B |       |
|   +-----+         |       |   +---+---+       |
+-------------------+       +-------------------+
  (A berada di dalam B)       (A dan B beririsan)
\`\`\`\n`;
    const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement);
    if (!textarea) {
      onChange(value + template);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const savedScrollTop = textarea.scrollTop;
    const currentText = textarea.value;
    const newText = currentText.substring(0, start) + template + currentText.substring(end);
    onChange(newText);
    setTimeout(() => {
      if (!textarea) return;
      textarea.focus();
      const newPos = start + template.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.scrollTop = savedScrollTop;
    }, 0);
  };

  // Handle image file upload
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File yang dipilih bukan gambar.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      // Compress the image first
      const compressedBlob = await compressImage(file, 1200, 1200, 0.8);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', compressedBlob, file.name);

      // Upload via API route
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal mengunggah gambar');
      }

      // Insert markdown image syntax at cursor position
      const imageMarkdown = `\n![${file.name.replace(/\.[^/.]+$/, '')}](${result.url})\n`;
      
      const textarea = textareaRef.current || (document.getElementById(id) as HTMLTextAreaElement);
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const newText = currentText.substring(0, start) + imageMarkdown + currentText.substring(end);
        onChange(newText);

        setTimeout(() => {
          textarea.focus();
          const newPos = start + imageMarkdown.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      } else {
        onChange(value + imageMarkdown);
      }

      toast.success('Gambar berhasil diunggah!');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Gagal mengunggah gambar.');
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Handle drag and drop on textarea
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle paste with image
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          return;
        }
      }
    }
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
              title="Sisipkan Gambar (URL Manual)"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            {/* IMAGE UPLOAD BUTTON */}
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Unggah Gambar dari Komputer (atau Drag & Drop / Paste)"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg transition-colors ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{isUploading ? 'Mengunggah...' : '+ Gambar'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileInputChange}
            />

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

            {/* VENN DIAGRAM BUTTON */}
            <button
              type="button"
              onMouseDown={handleToolbarButtonMouseDown}
              onClick={handleInsertDiagram}
              title="Sisipkan Template Diagram Venn (Monospace)"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors ml-1"
            >
              <Boxes className="h-4 w-4" />
              <span>+ Diagram</span>
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
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onPaste={handlePaste}
            placeholder={isUploading ? 'Sedang mengunggah gambar...' : placeholder}
            className={`w-full p-4 text-sm md:text-base outline-none bg-transparent font-sans leading-relaxed text-foreground min-h-[240px] resize-y ${isUploading ? 'opacity-60' : ''}`}
            required={required}
            disabled={isUploading}
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

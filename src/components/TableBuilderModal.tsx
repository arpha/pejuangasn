'use me';
import React, { useState } from 'react';
import { Table, Plus, Trash2, X, AlignLeft, AlignCenter, AlignRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TableBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (markdownTable: string) => void;
}

export default function TableBuilderModal({ isOpen, onClose, onInsertTable }: TableBuilderModalProps) {
  const [cols, setCols] = useState<number>(3);
  const [rows, setRows] = useState<number>(3);
  const [alignments, setAlignments] = useState<('left' | 'center' | 'right')[]>(['left', 'left', 'left']);
  
  const [headers, setHeaders] = useState<string[]>(['Header 1', 'Header 2', 'Header 3']);
  const [data, setData] = useState<string[][]>([
    ['Data 1', 'Data 2', 'Data 3'],
    ['Data 4', 'Data 5', 'Data 6'],
  ]);

  if (!isOpen) return null;

  // Handle column size change
  const updateColsCount = (newCols: number) => {
    if (newCols < 1 || newCols > 8) return;
    setCols(newCols);

    // Adjust headers
    const newHeaders = [...headers];
    while (newHeaders.length < newCols) {
      newHeaders.push(`Header ${newHeaders.length + 1}`);
    }
    setHeaders(newHeaders.slice(0, newCols));

    // Adjust alignments
    const newAligns = [...alignments];
    while (newAligns.length < newCols) {
      newAligns.push('left');
    }
    setAlignments(newAligns.slice(0, newCols));

    // Adjust data rows
    const newData = data.map(row => {
      const newRow = [...row];
      while (newRow.length < newCols) {
        newRow.push('');
      }
      return newRow.slice(0, newCols);
    });
    setData(newData);
  };

  // Handle row size change
  const updateRowsCount = (newRows: number) => {
    if (newRows < 1 || newRows > 15) return;
    setRows(newRows);

    const newData = [...data];
    while (newData.length < newRows - 1) {
      const emptyRow = Array(cols).fill('');
      newData.push(emptyRow);
    }
    setData(newData.slice(0, newRows - 1));
  };

  const handleHeaderChange = (index: number, value: string) => {
    const updated = [...headers];
    updated[index] = value;
    setHeaders(updated);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const updated = data.map((r, rIdx) => {
      if (rIdx === rowIndex) {
        const rowCopy = [...r];
        rowCopy[colIndex] = value;
        return rowCopy;
      }
      return r;
    });
    setData(updated);
  };

  const handleAlignmentToggle = (colIndex: number) => {
    const updated = [...alignments];
    const current = updated[colIndex];
    if (current === 'left') updated[colIndex] = 'center';
    else if (current === 'center') updated[colIndex] = 'right';
    else updated[colIndex] = 'left';
    setAlignments(updated);
  };

  const generateMarkdown = (): string => {
    // Header line
    const headerLine = `| ${headers.map(h => h.trim() || ' ').join(' | ')} |`;
    
    // Separator line with alignment
    const sepLine = `| ${alignments.map(a => {
      if (a === 'center') return ':---:';
      if (a === 'right') return '---:';
      return '---';
    }).join(' | ')} |`;

    // Data lines
    const dataLines = data.map(row => {
      const formattedCells = row.map(cell => cell.trim() || '-');
      return `| ${formattedCells.join(' | ')} |`;
    });

    return `\n${headerLine}\n${sepLine}\n${dataLines.join('\n')}\n`;
  };

  const handleInsert = () => {
    const md = generateMarkdown();
    onInsertTable(md);
    onClose();
  };

  const applyPreset = (presetCols: number, presetRows: number) => {
    setCols(presetCols);
    setRows(presetRows);
    
    const newHeaders = Array.from({ length: presetCols }, (_, i) => `Kolom ${i + 1}`);
    const newAligns = Array(presetCols).fill('left') as ('left' | 'center' | 'right')[];
    const newData = Array.from({ length: presetRows - 1 }, (_, r) => 
      Array.from({ length: presetCols }, (_, c) => `Isi ${r + 1}-${c + 1}`)
    );

    setHeaders(newHeaders);
    setAlignments(newAligns);
    setData(newData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Table className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Pembuat Tabel Interaktif</h3>
              <p className="text-xs text-muted-foreground">Sesuaikan baris, kolom, dan isi data tabel dengan mudah</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Presets & Dimensions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Kolom:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
                  <button 
                    type="button"
                    onClick={() => updateColsCount(cols - 1)}
                    disabled={cols <= 1}
                    className="px-2.5 py-1 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold text-foreground">{cols}</span>
                  <button 
                    type="button"
                    onClick={() => updateColsCount(cols + 1)}
                    disabled={cols >= 8}
                    className="px-2.5 py-1 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Baris:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
                  <button 
                    type="button"
                    onClick={() => updateRowsCount(rows - 1)}
                    disabled={rows <= 2}
                    className="px-2.5 py-1 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold text-foreground">{rows}</span>
                  <button 
                    type="button"
                    onClick={() => updateRowsCount(rows + 1)}
                    disabled={rows >= 15}
                    className="px-2.5 py-1 text-sm font-bold text-muted-foreground hover:bg-muted disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Template Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Preset:</span>
              <button 
                type="button" 
                onClick={() => applyPreset(2, 3)}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
              >
                2x2
              </button>
              <button 
                type="button" 
                onClick={() => applyPreset(3, 4)}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
              >
                3x3
              </button>
              <button 
                type="button" 
                onClick={() => applyPreset(4, 5)}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
              >
                4x4
              </button>
            </div>
          </div>

          {/* Interactive Grid Input */}
          <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-card">
            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    {headers.map((h, cIdx) => (
                      <th key={cIdx} className="p-2 min-w-[120px] text-left border-r border-border last:border-r-0">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Kolom {cIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAlignmentToggle(cIdx)}
                              title={`Rataan: ${alignments[cIdx]} (Klik untuk ganti)`}
                              className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                              {alignments[cIdx] === 'left' && <AlignLeft className="h-3 w-3" />}
                              {alignments[cIdx] === 'center' && <AlignCenter className="h-3 w-3 text-indigo-500" />}
                              {alignments[cIdx] === 'right' && <AlignRight className="h-3 w-3" />}
                            </button>
                          </div>
                          <Input
                            type="text"
                            value={h}
                            onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                            placeholder={`Header ${cIdx + 1}`}
                            className="h-7 text-xs font-bold bg-card border-border focus-visible:ring-indigo-500"
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-muted/20">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-1.5 border-r border-border last:border-r-0">
                          <Input
                            type="text"
                            value={cell}
                            onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                            placeholder={`Data ${rIdx + 1}-${cIdx + 1}`}
                            className="h-7 text-xs bg-muted/20 border-transparent hover:border-border focus:border-indigo-500 focus-visible:ring-indigo-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Markdown Code Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Pratinjau Kode Markdown:</span>
            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800">
              {generateMarkdown().trim()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} className="font-semibold text-xs h-9">
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleInsert} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-5 gap-1.5"
          >
            <Check className="h-4 w-4" /> Sisipkan Tabel Ke Konten
          </Button>
        </div>
      </div>
    </div>
  );
}

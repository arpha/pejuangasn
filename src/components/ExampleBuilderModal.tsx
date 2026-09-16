'use me';
import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Eye, 
  BookOpen, 
  Layers, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ExampleRow {
  label: string;
  value: string;
  isPill: boolean; // Wrap in `...`
}

interface ExamplePreset {
  id: string;
  name: string;
  title: string;
  description: string;
  rows: ExampleRow[];
}

const PRESETS: ExamplePreset[] = [
  {
    id: 'analogi-2kata',
    name: 'Analogi 2 Kata (Standar)',
    title: 'Formasi 2 Kata vs 2 Kata (Standar)',
    description: 'Membandingkan dua kata di kiri dengan dua kata di kanan.',
    rows: [
      { label: 'Soal', value: 'KAPAL : NAKHODA = PESAWAT : ...', isPill: true },
      { label: 'Jawaban', value: 'PILOT', isPill: true },
      { label: 'Kalimat', value: 'Kapal dikemudikan oleh Nakhoda, sebagaimana Pesawat dikemudikan oleh Pilot.', isPill: false },
    ],
  },
  {
    id: 'analogi-3kata',
    name: 'Analogi 3 Kata (Rantai)',
    title: 'Formasi 3 Kata (Sebab - Akibat - Dampak)',
    description: 'Hubungan bertingkat antara tiga elemen kata yang saling berurutan.',
    rows: [
      { label: 'Soal', value: 'KEMARAU : KERING : KEBAKARAN = HUJAN : ... : ...', isPill: true },
      { label: 'Jawaban', value: 'BASAH : BANJIR', isPill: true },
      { label: 'Kalimat', value: 'Kemarau menyebabkan kering dan memicu kebakaran, sebagaimana hujan menyebabkan basah dan memicu banjir.', isPill: false },
    ],
  },
  {
    id: 'silogisme',
    name: 'Silogisme (TIU)',
    title: 'Silogisme: Modus Ponens',
    description: 'Penarikan kesimpulan logis jika syarat anteseden terpenuhi.',
    rows: [
      { label: 'Premis 1', value: 'Jika belajar giat, maka lulus SKD', isPill: true },
      { label: 'Premis 2', value: 'Andi belajar giat', isPill: true },
      { label: 'Kesimpulan', value: 'Maka, Andi lulus SKD', isPill: true },
      { label: 'Logika', value: 'Kaidah Modus Ponens: P → Q, P, maka kesimpulannya Q.', isPill: false },
    ],
  },
  {
    id: 'twk-kasus',
    name: 'Studi Kasus (TWK)',
    title: 'Analisis Pengamalan Sila Pancasila',
    description: 'Penerapan butir-butir Pancasila dalam kehidupan sosial kedinasan.',
    rows: [
      { label: 'Kasus', value: 'Menolak merawat fasilitas umum yang dibiayai bersama.', isPill: true },
      { label: 'Pengamalan', value: 'Melanggar Sila ke-5 Pancasila', isPill: true },
      { label: 'Pembahasan', value: 'Sila ke-5 mengajarkan menjaga keseimbangan hak dan kewajiban serta gotong royong merawat fasilitas publik.', isPill: false },
    ],
  },
];

interface ExampleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertExample: (markdownText: string) => void;
}

export default function ExampleBuilderModal({
  isOpen,
  onClose,
  onInsertExample,
}: ExampleBuilderModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('analogi-2kata');
  const [title, setTitle] = useState<string>(PRESETS[0].title);
  const [description, setDescription] = useState<string>(PRESETS[0].description);
  const [rows, setRows] = useState<ExampleRow[]>(PRESETS[0].rows);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ExamplePreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setDescription(preset.description);
    setRows(JSON.parse(JSON.stringify(preset.rows)));
  };

  const handleAddRow = () => {
    setRows(prev => [...prev, { label: 'Catatan', value: '', isPill: false }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof ExampleRow, val: any) => {
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const generateMarkdown = (): string => {
    let md = '';
    if (title.trim()) {
      md += `### ${title.trim()}\n`;
    }
    if (description.trim()) {
      md += `${description.trim()}\n\n`;
    } else if (title.trim()) {
      md += `\n`;
    }

    md += `:::contoh\n`;
    rows.forEach(r => {
      const labelPart = r.label.trim() ? `**${r.label.trim()}:** ` : '';
      const valPart = r.isPill && r.value.trim() ? `\`${r.value.trim()}\`` : r.value.trim();
      if (labelPart || valPart) {
        md += `${labelPart}${valPart}\n`;
      }
    });
    md += `:::\n`;

    return md;
  };

  const handleInsert = () => {
    const md = generateMarkdown();
    onInsertExample(md);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Generator Pola &amp; Contoh Materi</h3>
              <p className="text-xs text-muted-foreground">
                Buat blok contoh soal bergaris vertikal dengan chip kode secara instan.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Preset Buttons */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pilih Template Cepat
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col justify-between ${
                    selectedPresetId === preset.id
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate block font-bold">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ex-title" className="text-xs font-semibold">Judul Pola / Sub-Bab</Label>
              <Input
                id="ex-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Formasi 2 Kata vs 2 Kata (Standar)"
                className="h-9 text-sm bg-muted/20 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-desc" className="text-xs font-semibold">Deskripsi / Penjelasan Singkat</Label>
              <Input
                id="ex-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Membandingkan dua kata di kiri dengan dua kata di kanan."
                className="h-9 text-sm bg-muted/20 border-border"
              />
            </div>

            {/* Dynamic Rows */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Isi Baris Contoh (Kotak Garis Dotted)</Label>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Baris
                </button>
              </div>

              <div className="space-y-2.5 bg-muted/20 p-3 rounded-xl border border-border">
                {rows.map((row, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pb-2.5 border-b border-border/50 last:border-0 last:pb-0">
                    <Input
                      value={row.label}
                      onChange={(e) => handleRowChange(idx, 'label', e.target.value)}
                      placeholder="Label (Soal, Jawaban...)"
                      className="w-full sm:w-28 h-8 text-xs bg-card border-border font-bold shrink-0"
                    />
                    <Input
                      value={row.value}
                      onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                      placeholder="Teks atau nilai..."
                      className="flex-1 h-8 text-xs bg-card border-border"
                    />
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground select-none cursor-pointer bg-card px-2 py-1 rounded-md border border-border">
                        <input
                          type="checkbox"
                          checked={row.isPill}
                          onChange={(e) => handleRowChange(idx, 'isPill', e.target.checked)}
                          className="h-3 w-3 accent-amber-500 rounded"
                        />
                        <span>Pill Kode</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={rows.length <= 1}
                        className="p-1 text-muted-foreground hover:text-rose-500 transition-colors disabled:opacity-30"
                        title="Hapus baris"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="space-y-2 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Eye className="h-3.5 w-3.5" /> Pratinjau Tampilan Hasil
              </div>
              <div className="p-4 rounded-xl border border-border bg-neutral-950 text-neutral-100 shadow-inner">
                {title && <h4 className="text-base font-bold text-white mb-1">{title}</h4>}
                {description && <p className="text-xs text-neutral-400 mb-3">{description}</p>}
                
                {/* The Dotted Box */}
                <div className="pl-4 border-l-2 border-dotted border-neutral-600 space-y-2 text-xs sm:text-sm">
                  {rows.map((r, i) => (
                    <div key={i} className="leading-relaxed">
                      {r.label && <strong className="font-bold text-white mr-1.5">{r.label}:</strong>}
                      {r.isPill ? (
                        <code className="bg-neutral-800 text-neutral-200 border border-neutral-700/60 px-2 py-0.5 rounded-md font-mono text-xs tracking-wide">
                          {r.value || '...'}
                        </code>
                      ) : (
                        <span className="text-neutral-300">{r.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="border-border text-xs font-bold"
          >
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleInsert}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-5 rounded-xl flex items-center gap-2 shadow-sm"
          >
            <Check className="h-4 w-4" /> Sisipkan ke Materi
          </Button>
        </div>
      </div>
    </div>
  );
}

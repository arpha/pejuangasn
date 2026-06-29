'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  HelpCircle, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Shield, 
  X,
  CheckCircle2,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Question } from '@/types';
import MathText from '@/components/MathText';
import { ShapeBuilder } from '@/components/ShapeBuilder';


interface ImageInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  fieldName: string;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onDrawClick?: (fieldName: string) => void;
}

function ImageInput({
  label,
  value,
  onChange,
  fieldName,
  isUploading,
  onFileChange,
  onDrawClick
}: ImageInputProps) {
  return (
    <div className="space-y-1.5 border border-dashed border-border rounded-xl p-3 bg-muted/10">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
        {value && (
          <button 
            type="button" 
            onClick={() => onChange('')} 
            className="text-[10px] font-bold text-rose-500 hover:underline"
          >
            Hapus
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <Input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder="Tautan URL Gambar (opsional)" 
          className="h-8 bg-background border-border text-xs flex-1"
        />
        {onDrawClick && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDrawClick(fieldName)}
            className="h-8 text-xs border-indigo-500/25 bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08] hover:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-extrabold px-3 rounded-lg flex items-center gap-1 shrink-0"
            disabled={isUploading}
          >
            <Plus className="h-3 w-3" /> Buat Gambar
          </Button>
        )}
        <div className="relative shrink-0 overflow-hidden">
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => onFileChange(e, fieldName)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            disabled={isUploading}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs border-border bg-background hover:bg-muted font-bold px-3.5"
            disabled={isUploading}
          >
            {isUploading ? '...' : 'Unggah'}
          </Button>
        </div>
      </div>
      {value && (
        <div className="mt-1.5 border border-border rounded-lg overflow-hidden max-h-24 w-fit bg-background flex items-center justify-center p-1">
          <img src={value} alt="Preview" className="max-h-20 object-contain rounded" />
        </div>
      )}
    </div>
  );
}

const SUB_CATEGORIES = {
  TWK: ['Nasionalisme', 'Integritas', 'Bela Negara', 'Pilar Negara', 'Bahasa Indonesia'],
  TIU: ['Analogi', 'Silogisme', 'Analitis', 'Berhitung', 'Deret', 'Perbandingan', 'Soal Cerita', 'Analogi Figural', 'Ketidaksamaan Figural', 'Serial Figural'],
  TKP: ['Pelayanan Publik', 'Jejaring Kerja', 'Sosial Budaya', 'TIK', 'Profesionalisme', 'Anti Radikalisme']
};

export default function AdminQuestionsPage() {
  const router = useRouter();
  const { profile, loading } = useAuthStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addAnother, setAddAnother] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [subCategoryFilter, setSubCategoryFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Import Massal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importCategory, setImportCategory] = useState<'TWK' | 'TIU' | 'TKP'>('TWK');
  const [importSubCategory, setImportSubCategory] = useState('Nasionalisme');
  const [importDifficulty, setImportDifficulty] = useState<'MUDAH' | 'SEDANG' | 'SULIT'>('SEDANG');
  const [importType, setImportType] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Parser helper function
  const handleParseQuestions = () => {
    if (!importText.trim()) {
      setParsedQuestions([]);
      return;
    }
    
    // Split by question numbers: e.g. "16. " or "1. " or "100. " at beginning of block
    const blocks = importText.split(/\n+(?=\d+\.\s+)/);
    const results: any[] = [];
    
    let sharedPassage = "";
    let questionBlocks = [...blocks];

    // Check if the very first block does NOT start with a question number
    if (blocks.length > 0) {
      const firstBlock = blocks[0].trim();
      const startsWithNumberDot = /^\d+\.\s+/.test(firstBlock);
      if (!startsWithNumberDot && firstBlock.length > 0) {
        sharedPassage = firstBlock;
        // The rest are question blocks
        questionBlocks = blocks.slice(1);
      }
    }

    questionBlocks.forEach((block) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return;

      const matchStart = trimmedBlock.match(/^(\d+)\.\s+([\s\S]+)/);
      if (!matchStart) return;

      const rawIndex = parseInt(matchStart[1], 10);
      const content = matchStart[2].trim();

      let questionText = "";
      let optionA = "";
      let optionB = "";
      let optionC = "";
      let optionD = "";
      let optionE = "";
      let correctOption: string | null = null;
      let explanation: string | null = null;
      let errorMsg = "";

      const normalizedContent = "\n" + content;

      // Extract question text
      const matchQuestion = normalizedContent.match(/^\n([\s\S]*?)(?=\n\s*A\.\s+)/i);
      if (matchQuestion) {
        questionText = matchQuestion[1].trim();
      }

      // Extract options
      const matchA = normalizedContent.match(/\n\s*A\.\s+([\s\S]*?)(?=\n\s*B\.\s+)/i);
      if (matchA) optionA = matchA[1].trim();

      const matchB = normalizedContent.match(/\n\s*B\.\s+([\s\S]*?)(?=\n\s*C\.\s+)/i);
      if (matchB) optionB = matchB[1].trim();

      const matchC = normalizedContent.match(/\n\s*C\.\s+([\s\S]*?)(?=\n\s*D\.\s+)/i);
      if (matchC) optionC = matchC[1].trim();

      const matchD = normalizedContent.match(/\n\s*D\.\s+([\s\S]*?)(?=\n\s*E\.\s+)/i);
      if (matchD) optionD = matchD[1].trim();

      const matchE = normalizedContent.match(/\n\s*E\.\s+([\s\S]*?)(?=\n\s*(Kunci|Kunci\s+Jawaban|Pembahasan):)/i);
      if (matchE) {
        optionE = matchE[1].trim();
      } else {
        const matchEAlternative = normalizedContent.match(/\n\s*E\.\s+([\s\S]*)$/i);
        if (matchEAlternative) {
          optionE = matchEAlternative[1].trim();
        }
      }

      // Extract key & scale points for TKP
      let parsedScalePoints: { A: number; B: number; C: number; D: number; E: number } | null = null;
      
      const keyLineMatch = normalizedContent.match(/\n\s*(Kunci|Kunci\s+Jawaban):\s*(.*)/i);
      if (keyLineMatch) {
        const keyVal = keyLineMatch[2].trim();
        
        if (importCategory === 'TKP') {
          // Parse format: A:5, B:4, C:3, D:2, E:1 or A=5, B=4, C=3, D=2, E=1
          const pointsMap: Record<string, number> = {};
          const pairs = keyVal.split(/[,;]/);
          pairs.forEach(pair => {
            const parts = pair.split(/[:=]/);
            if (parts.length === 2) {
              const opt = parts[0].trim().toUpperCase();
              const val = parseInt(parts[1].trim(), 10);
              if (['A', 'B', 'C', 'D', 'E'].includes(opt) && !isNaN(val)) {
                pointsMap[opt] = val;
              }
            }
          });
          
          if (pointsMap.A !== undefined && pointsMap.B !== undefined && pointsMap.C !== undefined && pointsMap.D !== undefined && pointsMap.E !== undefined) {
            parsedScalePoints = {
              A: pointsMap.A,
              B: pointsMap.B,
              C: pointsMap.C,
              D: pointsMap.D,
              E: pointsMap.E
            };
          } else {
            // Try to parse raw numbers separated by commas: e.g. 5,4,3,2,1
            const numbers = keyVal.split(/[,;\s]+/).map(n => parseInt(n.trim(), 10));
            if (numbers.length === 5 && numbers.every(n => !isNaN(n))) {
              parsedScalePoints = {
                A: numbers[0],
                B: numbers[1],
                C: numbers[2],
                D: numbers[3],
                E: numbers[4]
              };
            }
          }
          
          // Fallback to default if parsing failed
          if (!parsedScalePoints) {
            parsedScalePoints = { A: 1, B: 2, C: 3, D: 4, E: 5 };
          }
        } else {
          // Standard categories: extract single letter key
          const singleLetterMatch = keyVal.match(/^([A-E])/i);
          if (singleLetterMatch) {
            correctOption = singleLetterMatch[1].toUpperCase();
          }
        }
      }

      // Extract explanation
      const matchExplanation = normalizedContent.match(/\n\s*Pembahasan:\s*([\s\S]*)$/i);
      if (matchExplanation) {
        explanation = matchExplanation[1].trim();
      }

      // Prepend wacana if detected
      let finalQuestionText = questionText;
      if (sharedPassage) {
        finalQuestionText = `> **Rujukan Teks Bacaan:**\n> ${sharedPassage.replace(/\n/g, '\n> ')}\n>\n> ---\n\n${questionText}`;
      }

      // Validation
      let isValid = true;
      if (!questionText) {
        isValid = false;
        errorMsg = "Teks pertanyaan kosong.";
      } else if (!optionA || !optionB || !optionC || !optionD || !optionE) {
        isValid = false;
        errorMsg = "Salah satu dari Pilihan A-E tidak lengkap.";
      } else if (importCategory !== 'TKP' && !correctOption && !parsedScalePoints) {
        isValid = false;
        errorMsg = "Kunci jawaban / sebaran poin tidak ditemukan.";
      }

      results.push({
        question_text: finalQuestionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        option_e: optionE,
        correct_option: correctOption,
        scale_points: parsedScalePoints,
        explanation: explanation,
        isValid: isValid,
        error: errorMsg,
        rawIndex: rawIndex,
      });
    });

    setParsedQuestions(results);
    if (results.length === 0) {
      toast.error('Tidak ada soal yang terdeteksi. Periksa kembali format penomoran Anda (misal: "1. Teks Soal").');
    } else {
      const validCount = results.filter(r => r.isValid).length;
      toast.success(`Berhasil memproses ${results.length} soal (${validCount} valid, ${results.length - validCount} error).`);
    }
  };

  // Bulk save function
  const handleSaveBulk = async () => {
    const validQuestions = parsedQuestions.filter(r => r.isValid);
    if (validQuestions.length === 0) {
      toast.error('Tidak ada soal valid yang dapat disimpan.');
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading(`Menyimpan ${validQuestions.length} soal ke database...`);

    try {
      const isTKP = importCategory === 'TKP';
      const payloads = validQuestions.map(q => {
        // Use parsed scale points or fallback
        const scalePoints = isTKP ? (q.scale_points || { A: 1, B: 2, C: 3, D: 4, E: 5 }) : null;
        return {
          question_text: q.question_text,
          category: importCategory,
          sub_category: importSubCategory,
          difficulty: importDifficulty,
          type: importType,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          option_e: q.option_e,
          correct_option: isTKP ? null : q.correct_option,
          scale_points: scalePoints,
          explanation: q.explanation || null,
        };
      });

      const { error } = await supabase
        .from('questions')
        .insert(payloads);

      if (error) throw error;

      toast.success(`Berhasil menambahkan ${validQuestions.length} soal ke bank soal!`, { id: toastId });
      setIsImportOpen(false);
      setImportText('');
      setParsedQuestions([]);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error('Gagal menyimpan soal massal: ' + error.message, { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    question_text: '',
    category: 'TWK' as 'TWK' | 'TIU' | 'TKP',
    sub_category: 'Nasionalisme',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_option: 'A',
    explanation: '',
    points_a: '1',
    points_b: '2',
    points_c: '3',
    points_d: '4',
    points_e: '5',
    image_url: '',
    option_a_image_url: '',
    option_b_image_url: '',
    option_c_image_url: '',
    option_d_image_url: '',
    option_e_image_url: '',
    explanation_image_url: '',
    difficulty: 'SEDANG' as 'MUDAH' | 'SEDANG' | 'SULIT',
    type: 'FREE' as 'FREE' | 'PREMIUM'
  });

  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [activeDrawingField, setActiveDrawingField] = useState<string | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, subCategoryFilter, difficultyFilter, typeFilter]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar terlalu besar. Maksimal 10MB.');
      return;
    }

    setIsUploading(fieldName);
    const toastId = toast.loading('Mengompresi dan mengunggah gambar...');

    try {
      const { compressImage } = await import('@/lib/image');
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const baseName = `${Math.random().toString(36).substring(2)}-${Date.now()}`;
      let finalExt = fileExt;
      let uploadData: Blob | File = file;

      if (file.type.startsWith('image/')) {
        try {
          uploadData = await compressImage(file);
          finalExt = 'jpg'; // force jpeg output from canvas compression
        } catch (compErr) {
          console.warn('Gagal mengompres gambar, menggunakan berkas asli:', compErr);
        }
      }

      const fileName = `${baseName}.${finalExt}`;
      const filePath = `${fieldName}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('question-images')
        .upload(filePath, uploadData, {
          contentType: `image/${finalExt === 'jpg' ? 'jpeg' : finalExt}`,
          cacheControl: '3600'
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [fieldName]: publicUrl
      }));

      toast.success('Gambar berhasil dikompresi dan diunggah!', { id: toastId });
    } catch (err) {
      const error = err as Error;
      toast.error('Gagal mengunggah gambar: ' + error.message + '. Anda dapat mengisi URL manual.', { id: toastId });
      console.error(error);
    } finally {
      setIsUploading(null);
    }
  };

  const handleSaveDrawing = async (blob: Blob, fieldName: string) => {
    setActiveDrawingField(null); // Close modal
    setIsUploading(fieldName);
    const toastId = toast.loading('Mengunggah gambar hasil bentuk/diagram...');

    try {
      const baseName = `draw-${Math.random().toString(36).substring(2)}-${Date.now()}`;
      const fileName = `${baseName}.png`;
      const filePath = `${fieldName}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('question-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [fieldName]: publicUrl
      }));

      toast.success('Gambar diagram berhasil dibuat dan diunggah!', { id: toastId });
    } catch (err) {
      const error = err as Error;
      toast.error('Gagal mengunggah hasil gambar: ' + error.message, { id: toastId });
      console.error(error);
    } finally {
      setIsUploading(null);
    }
  };

  // Protect route
  useEffect(() => {
    if (!loading) {
      if (!profile) {
        toast.error('Harap login terlebih dahulu');
        router.push('/login');
      } else if (profile.role !== 'admin') {
        toast.error('Akses ditolak. Halaman ini hanya untuk Administrator.');
        router.push('/dashboard');
      }
    }
  }, [profile, loading, router]);

  // Fetch questions list
  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ['admin-questions-crud'],
    queryFn: async () => {
      let allData: Question[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += step;
          if (data.length < step) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      return allData;
    },
    enabled: !!profile && profile.role === 'admin'
  });

  // Open form for adding new
  const handleAddNew = () => {
    setFormData({
      question_text: '',
      category: 'TWK',
      sub_category: 'Nasionalisme',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      correct_option: 'A',
      explanation: '',
      points_a: '1',
      points_b: '2',
      points_c: '3',
      points_d: '4',
      points_e: '5',
      image_url: '',
      option_a_image_url: '',
      option_b_image_url: '',
      option_c_image_url: '',
      option_d_image_url: '',
      option_e_image_url: '',
      explanation_image_url: '',
      difficulty: 'SEDANG',
      type: 'FREE'
    });
    setEditingQuestion(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEdit = (q: Question) => {
    setFormData({
      question_text: q.question_text,
      category: q.category,
      sub_category: q.sub_category || (q.category === 'TWK' ? 'Nasionalisme' : q.category === 'TIU' ? 'Analogi' : 'Pelayanan Publik'),
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      correct_option: q.correct_option || 'A',
      explanation: q.explanation || '',
      points_a: String(q.scale_points?.A || 1),
      points_b: String(q.scale_points?.B || 2),
      points_c: String(q.scale_points?.C || 3),
      points_d: String(q.scale_points?.D || 4),
      points_e: String(q.scale_points?.E || 5),
      image_url: q.image_url || '',
      option_a_image_url: q.option_a_image_url || '',
      option_b_image_url: q.option_b_image_url || '',
      option_c_image_url: q.option_c_image_url || '',
      option_d_image_url: q.option_d_image_url || '',
      option_e_image_url: q.option_e_image_url || '',
      explanation_image_url: q.explanation_image_url || '',
      difficulty: q.difficulty || 'SEDANG',
      type: q.type || 'FREE'
    });
    setEditingQuestion(q);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete question from DB
  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pertanyaan ini dari bank soal?')) {
      try {
        const { error } = await supabase
          .from('questions')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Soal berhasil dihapus!');
        refetch();
      } catch (err) {
        const error = err as Error;
        toast.error('Gagal menghapus soal: ' + error.message);
      }
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validations
    if (
      !formData.question_text.trim() || 
      !formData.option_a.trim() || 
      !formData.option_b.trim() || 
      !formData.option_c.trim() || 
      !formData.option_d.trim() || 
      !formData.option_e.trim()
    ) {
      toast.error('Harap isi pertanyaan dan kelima opsi jawaban!');
      return;
    }

    setIsSaving(true);

    try {
      const isTKP = formData.category === 'TKP';
      const scalePoints = isTKP ? {
        A: Number(formData.points_a),
        B: Number(formData.points_b),
        C: Number(formData.points_c),
        D: Number(formData.points_d),
        E: Number(formData.points_e)
      } : null;
      const payload = {
        question_text: formData.question_text,
        category: formData.category,
        sub_category: formData.sub_category,
        option_a: formData.option_a,
        option_b: formData.option_b,
        option_c: formData.option_c,
        option_d: formData.option_d,
        option_e: formData.option_e,
        correct_option: isTKP ? null : formData.correct_option,
        scale_points: scalePoints,
        explanation: formData.explanation.trim() || null,
        image_url: formData.image_url.trim() || null,
        option_a_image_url: formData.option_a_image_url.trim() || null,
        option_b_image_url: formData.option_b_image_url.trim() || null,
        option_c_image_url: formData.option_c_image_url.trim() || null,
        option_d_image_url: formData.option_d_image_url.trim() || null,
        option_e_image_url: formData.option_e_image_url.trim() || null,
        explanation_image_url: formData.explanation_image_url.trim() || null,
        difficulty: formData.difficulty,
        type: formData.type
      };

      if (editingQuestion) {
        // Update
        const { error } = await supabase
          .from('questions')
          .update(payload)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast.success('Soal berhasil diperbarui!');
        setIsFormOpen(false);
        setEditingQuestion(null);
      } else {
        // Insert new
        const { error } = await supabase
          .from('questions')
          .insert([payload]);

        if (error) throw error;
        toast.success('Soal baru berhasil ditambahkan!');
        
        if (addAnother) {
          // Keep form open, but reset input fields for next question
          // Keep category, sub_category, and difficulty to speed up subsequent inputs
          setFormData(prev => ({
            ...prev,
            question_text: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            option_e: '',
            correct_option: 'A',
            explanation: '',
            points_a: '1',
            points_b: '2',
            points_c: '3',
            points_d: '4',
            points_e: '5',
            image_url: '',
            option_a_image_url: '',
            option_b_image_url: '',
            option_c_image_url: '',
            option_d_image_url: '',
            option_e_image_url: '',
            explanation_image_url: '',
          }));
          
          // Scroll form to top so the user can easily see their reset state and add next
          const formElement = document.querySelector('form');
          if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          setIsFormOpen(false);
          setEditingQuestion(null);
        }
      }

      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error('Gagal menyimpan soal: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter questions based on search query and category tab
  const filteredQuestions = questions?.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.option_a.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.option_b.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || q.category === categoryFilter;
    const matchesSubCategory = subCategoryFilter === 'ALL' || q.sub_category === subCategoryFilter;
    const matchesDifficulty = difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
    const matchesType = typeFilter === 'ALL' || (q.type || 'FREE') === typeFilter;
    return matchesSearch && matchesCategory && matchesSubCategory && matchesDifficulty && matchesType;
  }) || [];

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading || !profile || profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm font-medium">Memverifikasi hak akses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/admin')} 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Panel Admin
          </button>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <Shield className="h-4 w-4" /> Pengaturan Sistem
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Manajemen Bank Soal</h1>
          <p className="text-muted-foreground">Kelola basis data pertanyaan latihan mandiri dan tryout CAT secara dinamis.</p>
        </div>

        {!isFormOpen && (
          <div className="flex gap-2 shrink-0">
            <Button 
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              className="border-border text-foreground font-bold h-10 px-5 rounded-xl flex items-center gap-2"
            >
              Import Massal
            </Button>
            <Button 
              onClick={handleAddNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 shadow-sm flex items-center gap-2 rounded-xl"
            >
              <Plus className="h-4.5 w-4.5" /> Tambah Soal Baru
            </Button>
          </div>
        )}
      </div>

      {/* Insert / Edit Form Card */}
      {isFormOpen && (
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
              </CardTitle>
              <CardDescription>
                Isi parameter pertanyaan, pilihan jawaban, kunci, bobot nilai, serta pembahasannya.
              </CardDescription>
            </div>
            <button 
              onClick={() => { setIsFormOpen(false); setEditingQuestion(null); }} 
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              
              {/* Question Text & Category */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="question_text" className="text-sm font-semibold">Teks Pertanyaan *</Label>
                  <textarea 
                    id="question_text"
                    rows={4}
                    value={formData.question_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                    placeholder="Contoh: Manakah yang merupakan pilar utama kesatuan bangsa..."
                    className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-sm font-semibold">Kategori Soal *</Label>
                  <select 
                    id="category"
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value as 'TWK' | 'TIU' | 'TKP';
                      let defaultSub = 'Nasionalisme';
                      if (newCat === 'TIU') defaultSub = 'Analogi';
                      else if (newCat === 'TKP') defaultSub = 'Pelayanan Publik';
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        category: newCat,
                        sub_category: defaultSub
                      }));
                    }}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 bg-card dark:bg-card/50"
                  >
                    <option value="TWK">TWK</option>
                    <option value="TIU">TIU</option>
                    <option value="TKP">TKP</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sub_category" className="text-sm font-semibold">Sub Kategori *</Label>
                  <select 
                    id="sub_category"
                    value={formData.sub_category}
                    onChange={(e) => setFormData(prev => ({ ...prev, sub_category: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 bg-card dark:bg-card/50"
                  >
                    {SUB_CATEGORIES[formData.category].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="difficulty" className="text-sm font-semibold">Kesulitan *</Label>
                  <select 
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 bg-card dark:bg-card/50"
                  >
                    <option value="MUDAH">Mudah</option>
                    <option value="SEDANG">Sedang</option>
                    <option value="SULIT">Sulit</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-sm font-semibold">Tipe Akses *</Label>
                  <select 
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 bg-card dark:bg-card/50"
                  >
                    <option value="FREE">Free</option>
                    <option value="PREMIUM">Eksklusif</option>
                  </select>
                </div>
              </div>

              {/* Gambar Pertanyaan Utama */}
              <div className="max-w-xl">
                <ImageInput 
                  label="Gambar Pertanyaan (Opsional)"
                  value={formData.image_url}
                  onChange={(val) => setFormData(prev => ({ ...prev, image_url: val }))}
                  fieldName="image_url"
                  isUploading={isUploading === 'image_url'}
                  onFileChange={handleFileChange}
                  onDrawClick={(field) => setActiveDrawingField(field)}
                />
              </div>

              {/* Options & Points Grid */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border pb-2">Opsi Jawaban & Bobot Nilai</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Option A */}
                  <div className={`${formData.category === 'TKP' ? 'md:col-span-10' : 'md:col-span-12'} space-y-1.5`}>
                    <Label htmlFor="option_a" className="text-xs font-bold text-muted-foreground">Pilihan A *</Label>
                    <Input 
                      id="option_a" 
                      value={formData.option_a} 
                      onChange={(e) => setFormData(prev => ({ ...prev, option_a: e.target.value }))}
                      className="bg-muted/30 h-10 border-border"
                      required
                    />
                  </div>
                  {formData.category === 'TKP' && (
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Poin A (1-5)</Label>
                      <Input type="number" min="1" max="5" value={formData.points_a} onChange={(e) => setFormData(prev => ({ ...prev, points_a: e.target.value }))} className="bg-muted/30 h-10 border-border text-center" />
                    </div>
                  )}
                  <div className="md:col-span-12 mb-2">
                    <ImageInput 
                      label="Gambar Pilihan A (Opsional)"
                      value={formData.option_a_image_url}
                      onChange={(val) => setFormData(prev => ({ ...prev, option_a_image_url: val }))}
                      fieldName="option_a_image_url"
                      isUploading={isUploading === 'option_a_image_url'}
                      onFileChange={handleFileChange}
                      onDrawClick={(field) => setActiveDrawingField(field)}
                    />
                  </div>

                  {/* Option B */}
                  <div className={`${formData.category === 'TKP' ? 'md:col-span-10' : 'md:col-span-12'} space-y-1.5`}>
                    <Label htmlFor="option_b" className="text-xs font-bold text-muted-foreground">Pilihan B *</Label>
                    <Input 
                      id="option_b" 
                      value={formData.option_b} 
                      onChange={(e) => setFormData(prev => ({ ...prev, option_b: e.target.value }))}
                      className="bg-muted/30 h-10 border-border"
                      required
                    />
                  </div>
                  {formData.category === 'TKP' && (
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Poin B (1-5)</Label>
                      <Input type="number" min="1" max="5" value={formData.points_b} onChange={(e) => setFormData(prev => ({ ...prev, points_b: e.target.value }))} className="bg-muted/30 h-10 border-border text-center" />
                    </div>
                  )}
                  <div className="md:col-span-12 mb-2">
                    <ImageInput 
                      label="Gambar Pilihan B (Opsional)"
                      value={formData.option_b_image_url}
                      onChange={(val) => setFormData(prev => ({ ...prev, option_b_image_url: val }))}
                      fieldName="option_b_image_url"
                      isUploading={isUploading === 'option_b_image_url'}
                      onFileChange={handleFileChange}
                      onDrawClick={(field) => setActiveDrawingField(field)}
                    />
                  </div>

                  {/* Option C */}
                  <div className={`${formData.category === 'TKP' ? 'md:col-span-10' : 'md:col-span-12'} space-y-1.5`}>
                    <Label htmlFor="option_c" className="text-xs font-bold text-muted-foreground">Pilihan C *</Label>
                    <Input 
                      id="option_c" 
                      value={formData.option_c} 
                      onChange={(e) => setFormData(prev => ({ ...prev, option_c: e.target.value }))}
                      className="bg-muted/30 h-10 border-border"
                      required
                    />
                  </div>
                  {formData.category === 'TKP' && (
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Poin C (1-5)</Label>
                      <Input type="number" min="1" max="5" value={formData.points_c} onChange={(e) => setFormData(prev => ({ ...prev, points_c: e.target.value }))} className="bg-muted/30 h-10 border-border text-center" />
                    </div>
                  )}
                  <div className="md:col-span-12 mb-2">
                    <ImageInput 
                      label="Gambar Pilihan C (Opsional)"
                      value={formData.option_c_image_url}
                      onChange={(val) => setFormData(prev => ({ ...prev, option_c_image_url: val }))}
                      fieldName="option_c_image_url"
                      isUploading={isUploading === 'option_c_image_url'}
                      onFileChange={handleFileChange}
                      onDrawClick={(field) => setActiveDrawingField(field)}
                    />
                  </div>

                  {/* Option D */}
                  <div className={`${formData.category === 'TKP' ? 'md:col-span-10' : 'md:col-span-12'} space-y-1.5`}>
                    <Label htmlFor="option_d" className="text-xs font-bold text-muted-foreground">Pilihan D *</Label>
                    <Input 
                      id="option_d" 
                      value={formData.option_d} 
                      onChange={(e) => setFormData(prev => ({ ...prev, option_d: e.target.value }))}
                      className="bg-muted/30 h-10 border-border"
                      required
                    />
                  </div>
                  {formData.category === 'TKP' && (
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Poin D (1-5)</Label>
                      <Input type="number" min="1" max="5" value={formData.points_d} onChange={(e) => setFormData(prev => ({ ...prev, points_d: e.target.value }))} className="bg-muted/30 h-10 border-border text-center" />
                    </div>
                  )}
                  <div className="md:col-span-12 mb-2">
                    <ImageInput 
                      label="Gambar Pilihan D (Opsional)"
                      value={formData.option_d_image_url}
                      onChange={(val) => setFormData(prev => ({ ...prev, option_d_image_url: val }))}
                      fieldName="option_d_image_url"
                      isUploading={isUploading === 'option_d_image_url'}
                      onFileChange={handleFileChange}
                      onDrawClick={(field) => setActiveDrawingField(field)}
                    />
                  </div>

                  {/* Option E */}
                  <div className={`${formData.category === 'TKP' ? 'md:col-span-10' : 'md:col-span-12'} space-y-1.5`}>
                    <Label htmlFor="option_e" className="text-xs font-bold text-muted-foreground">Pilihan E *</Label>
                    <Input 
                      id="option_e" 
                      value={formData.option_e} 
                      onChange={(e) => setFormData(prev => ({ ...prev, option_e: e.target.value }))}
                      className="bg-muted/30 h-10 border-border"
                      required
                    />
                  </div>
                  {formData.category === 'TKP' && (
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground">Poin E (1-5)</Label>
                      <Input type="number" min="1" max="5" value={formData.points_e} onChange={(e) => setFormData(prev => ({ ...prev, points_e: e.target.value }))} className="bg-muted/30 h-10 border-border text-center" />
                    </div>
                  )}
                  <div className="md:col-span-12 mb-2">
                    <ImageInput 
                      label="Gambar Pilihan E (Opsional)"
                      value={formData.option_e_image_url}
                      onChange={(val) => setFormData(prev => ({ ...prev, option_e_image_url: val }))}
                      fieldName="option_e_image_url"
                      isUploading={isUploading === 'option_e_image_url'}
                      onFileChange={handleFileChange}
                      onDrawClick={(field) => setActiveDrawingField(field)}
                    />
                  </div>

                </div>
              </div>

              {/* Correct Option (TWK & TIU Only) */}
              {formData.category !== 'TKP' && (
                <div className="space-y-1.5 max-w-xs">
                  <Label htmlFor="correct_option" className="text-sm font-semibold">Opsi Jawaban Benar (Kunci) *</Label>
                  <select 
                    id="correct_option"
                    value={formData.correct_option}
                    onChange={(e) => setFormData(prev => ({ ...prev, correct_option: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 bg-card dark:bg-card/50"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
              )}
      
                    {/* Explanation */}
              <div className="space-y-1.5">
                <Label htmlFor="explanation" className="text-sm font-semibold">Teks Penjelasan / Pembahasan Soal</Label>
                <textarea 
                  id="explanation"
                  rows={4}
                  value={formData.explanation}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Isi pembahasan mengenai materi terkait soal ini..."
                  className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              {/* Gambar Penjelasan */}
              <div className="max-w-xl">
                <ImageInput 
                  label="Gambar Penjelasan / Pembahasan (Opsional)"
                  value={formData.explanation_image_url}
                  onChange={(val) => setFormData(prev => ({ ...prev, explanation_image_url: val }))}
                  fieldName="explanation_image_url"
                  isUploading={isUploading === 'explanation_image_url'}
                  onFileChange={handleFileChange}
                  onDrawClick={(field) => setActiveDrawingField(field)}
                />
              </div>
      </CardContent>
            <CardFooter className="flex justify-end flex-wrap gap-2.5 border-t border-border pt-4 bg-muted/20">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsFormOpen(false); setEditingQuestion(null); }}
                className="font-bold border-border"
                disabled={isSaving}
              >
                Batal
              </Button>
              {!editingQuestion && (
                <Button 
                  type="submit"
                  onClick={() => setAddAnother(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5"
                  disabled={isSaving}
                >
                  {isSaving && addAnother ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...
                    </>
                  ) : (
                    'Simpan & Tambah Lagi'
                  )}
                </Button>
              )}
              <Button 
                type="submit" 
                onClick={() => setAddAnother(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                disabled={isSaving}
              >
                {isSaving && !addAnother ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...
                  </>
                ) : (
                  editingQuestion ? 'Perbarui Soal' : 'Simpan Soal'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Questions List Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-foreground">Daftar Pertanyaan di Bank Soal</CardTitle>
          <CardDescription>Cari pertanyaan atau saring berdasarkan kategori tertentu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            
            {/* Search */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Cari kata kunci di teks pertanyaan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/30 border-border"
              />
            </div>

            {/* Sub-Category Filter */}
            <div className="w-full sm:w-48 shrink-0 self-stretch sm:self-auto">
              <select
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold transition-colors outline-none"
              >
                <option value="ALL">Semua Sub Kategori</option>
                {categoryFilter !== 'ALL' ? (
                  SUB_CATEGORIES[categoryFilter as 'TWK' | 'TIU' | 'TKP'].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))
                ) : (
                  Object.values(SUB_CATEGORIES).flat().map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))
                )}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="w-full sm:w-44 shrink-0 self-stretch sm:self-auto">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold transition-colors outline-none"
              >
                <option value="ALL">Semua Kesulitan</option>
                <option value="MUDAH">Mudah</option>
                <option value="SEDANG">Sedang</option>
                <option value="SULIT">Sulit</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="w-full sm:w-40 shrink-0 self-stretch sm:self-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold transition-colors outline-none"
              >
                <option value="ALL">Semua Tipe</option>
                <option value="FREE">Free</option>
                <option value="PREMIUM">Eksklusif</option>
              </select>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl shrink-0 self-stretch sm:self-auto justify-center">
              {['ALL', 'TWK', 'TIU', 'TKP'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setSubCategoryFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === cat
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua' : cat}
                </button>
              ))}
            </div>

          </div>

          {/* List display */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">Memuat bank soal...</p>
            </div>
          ) : filteredQuestions.length > 0 ? (
            <>
              <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="divide-y divide-border">
                {paginatedQuestions.map((q) => (
                  <div 
                    key={q.id} 
                    className="p-5 hover:bg-muted/10 transition-colors flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                  >
                    {/* Left side info */}
                    <div className="space-y-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {q.category}
                        </span>
                        {q.sub_category && (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            {q.sub_category}
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          q.difficulty === 'MUDAH'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : q.difficulty === 'SULIT'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {q.difficulty || 'SEDANG'}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          (q.type || 'FREE') === 'PREMIUM'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {(q.type || 'FREE') === 'PREMIUM' ? 'Eksklusif' : 'Free'}
                        </span>
                        {q.category !== 'TKP' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Kunci: {q.correct_option}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            TKP Skala Poin
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono truncate">
                          ID: {q.id}
                        </span>
                        {q.image_url && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Bergambar
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-start gap-3">
                        {q.image_url && (
                          <div className="w-12 h-12 rounded-lg border border-border overflow-hidden bg-muted shrink-0 flex items-center justify-center p-0.5">
                            <img src={q.image_url} alt="Thumbnail" className="max-h-full max-w-full object-contain rounded" />
                          </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <div className="text-sm font-semibold text-foreground leading-relaxed">
                            <MathText text={q.question_text} />
                          </div>
                        </div>
                      </div>

                      {/* Display options list in condensed format */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs text-muted-foreground">
                        <p className="truncate"><span className="font-bold text-foreground">A:</span> {q.option_a} {q.category === 'TKP' && `(${q.scale_points?.A || 0}p)`}</p>
                        <p className="truncate"><span className="font-bold text-foreground">B:</span> {q.option_b} {q.category === 'TKP' && `(${q.scale_points?.B || 0}p)`}</p>
                        <p className="truncate"><span className="font-bold text-foreground">C:</span> {q.option_c} {q.category === 'TKP' && `(${q.scale_points?.C || 0}p)`}</p>
                        <p className="truncate"><span className="font-bold text-foreground">D:</span> {q.option_d} {q.category === 'TKP' && `(${q.scale_points?.D || 0}p)`}</p>
                        <p className="truncate"><span className="font-bold text-foreground">E:</span> {q.option_e} {q.category === 'TKP' && `(${q.scale_points?.E || 0}p)`}</p>
                      </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2 shrink-0 md:pt-1 self-end md:self-auto border-t border-border pt-3 md:border-t-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setViewingQuestion(q)}
                        className="h-9 px-3 rounded-lg border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5"
                      >
                        <Eye className="h-4 w-4" /> Lihat
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(q)}
                        className="h-9 px-3 rounded-lg border-border hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 text-muted-foreground font-semibold flex items-center gap-1.5"
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(q.id)}
                        className="h-9 px-3 rounded-lg border-border hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 text-muted-foreground font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4 mt-4">
                <p className="text-xs text-muted-foreground font-semibold">
                  Menampilkan <span className="text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> sampai{' '}
                  <span className="text-foreground">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)}
                  </span>{' '}
                  dari <span className="text-foreground">{filteredQuestions.length}</span> soal
                </p>
                
                <div className="flex items-center gap-1.5 font-semibold">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 rounded-lg border-border text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Sebelumnya
                  </Button>
                  
                  {/* Render page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`h-8 w-8 rounded-lg text-xs font-bold ${
                              currentPage === page
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
                                : 'border-border'
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        (page === 2 && currentPage > 3) ||
                        (page === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        return (
                          <span key={page} className="text-xs text-muted-foreground px-1 font-bold">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8 rounded-lg border-border text-xs"
                  >
                    Berikutnya
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/10">
              <HelpCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">Pertanyaan Tidak Ditemukan</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                Tidak ada pertanyaan yang cocok dengan kata kunci pencarian Anda.
              </p>
            </div>
          )}

        </CardContent>
      </Card>

      {/* View Question Detail Modal */}
      <Dialog open={!!viewingQuestion} onOpenChange={(open) => !open && setViewingQuestion(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border rounded-xl p-6">
          {viewingQuestion && (
            <>
              <DialogHeader className="border-b border-border pb-4">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {viewingQuestion.category}
                  </span>
                  {viewingQuestion.sub_category && (
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                      {viewingQuestion.sub_category}
                    </span>
                  )}
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                    viewingQuestion.difficulty === 'MUDAH'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : viewingQuestion.difficulty === 'SULIT'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    {viewingQuestion.difficulty || 'SEDANG'}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-muted-foreground mt-1">
                  ID Soal: {viewingQuestion.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Question Text */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pertanyaan</h4>
                  <div className="text-foreground text-sm sm:text-base leading-relaxed p-4 rounded-xl bg-muted/20 border border-border">
                    <MathText text={viewingQuestion.question_text} />
                  </div>
                  {viewingQuestion.image_url && (
                    <div className="mt-3 border border-border rounded-xl overflow-hidden max-h-64 w-fit bg-muted flex items-center justify-center p-2 mx-auto">
                      <img src={viewingQuestion.image_url} alt="Soal Bergambar" className="max-h-56 object-contain rounded-lg" />
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Opsi Jawaban</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                      const optKey = `option_${opt.toLowerCase()}` as keyof typeof viewingQuestion;
                      const optText = viewingQuestion[optKey] as string;
                      const imageKey = `option_${opt.toLowerCase()}_image_url` as keyof typeof viewingQuestion;
                      const optionImageUrl = viewingQuestion[imageKey] as string | undefined | null;
                      
                      const isCorrect = viewingQuestion.category !== 'TKP' && viewingQuestion.correct_option === opt;
                      const tkpPoints = viewingQuestion.category === 'TKP' && viewingQuestion.scale_points
                        ? viewingQuestion.scale_points[opt] || 0
                        : null;

                      return (
                        <div
                          key={opt}
                          className={cn(
                            "p-3 rounded-lg border text-sm flex items-start gap-3 transition-colors",
                            isCorrect 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-300"
                              : "bg-muted/10 border-border text-foreground"
                          )}
                        >
                          <span className={cn(
                            "h-6 w-6 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border",
                            isCorrect 
                              ? "bg-emerald-600 border-transparent text-white"
                              : "border-border text-muted-foreground bg-background"
                          )}>
                            {opt}
                          </span>
                          <div className="flex-1 flex flex-col gap-2">
                            <span className="leading-snug"><MathText text={optText} /></span>
                            {optionImageUrl && (
                              <span className="border border-border rounded-lg overflow-hidden max-h-36 w-fit bg-muted flex items-center justify-center p-1">
                                <img src={optionImageUrl} alt={`Pilihan ${opt}`} className="max-h-28 object-contain rounded" />
                              </span>
                            )}
                          </div>
                          {tkpPoints !== null && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              {tkpPoints} Poin
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <div className="space-y-2 border-t border-border/60 pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pembahasan & Kunci</h4>
                    {viewingQuestion.category !== 'TKP' && (
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Kunci: {viewingQuestion.correct_option}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <MathText text={viewingQuestion.explanation || 'Pembahasan belum ditambahkan.'} />
                  </div>
                  {viewingQuestion.explanation_image_url && (
                    <div className="mt-3 border border-border rounded-xl overflow-hidden max-h-64 w-fit bg-muted flex items-center justify-center p-2 mx-auto">
                      <img src={viewingQuestion.explanation_image_url} alt="Gambar Pembahasan" className="max-h-56 object-contain rounded-lg" />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-border pt-4">
                <Button 
                  onClick={() => setViewingQuestion(null)}
                  className="w-full sm:w-auto font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Tutup Pratinjau
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Massal Soal Modal */}
      <Dialog open={isImportOpen} onOpenChange={(open) => !open && setIsImportOpen(false)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border rounded-xl p-6 flex flex-col">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-lg font-bold">Import Massal Soal ke Bank Soal</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Masukkan soal berpenomoran dengan format teratur. Untuk TKP, tentukan poin jawaban di baris Kunci (contoh: Kunci: A:5, B:4, C:3, D:2, E:1 atau Kunci: 5,4,3,2,1).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 flex-1">
            {/* Konfigurasi Default */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-xl bg-muted/10">
              <div className="space-y-1.5">
                <Label htmlFor="import_category" className="text-xs font-bold text-muted-foreground uppercase">1. Kategori Default *</Label>
                <select 
                  id="import_category"
                  value={importCategory}
                  onChange={(e) => {
                    const newCat = e.target.value as 'TWK' | 'TIU' | 'TKP';
                    let defaultSub = 'Nasionalisme';
                    if (newCat === 'TIU') defaultSub = 'Analogi';
                    else if (newCat === 'TKP') defaultSub = 'Pelayanan Publik';
                    setImportCategory(newCat);
                    setImportSubCategory(defaultSub);
                  }}
                  className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs transition-colors outline-none focus:ring-1 focus:ring-indigo-500 text-foreground cursor-pointer"
                >
                  <option value="TWK">TWK</option>
                  <option value="TIU">TIU</option>
                  <option value="TKP">TKP</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="import_sub_category" className="text-xs font-bold text-muted-foreground uppercase">2. Sub Kategori Default *</Label>
                <select 
                  id="import_sub_category"
                  value={importSubCategory}
                  onChange={(e) => setImportSubCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs transition-colors outline-none focus:ring-1 focus:ring-indigo-500 text-foreground cursor-pointer"
                >
                  {SUB_CATEGORIES[importCategory].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="import_difficulty" className="text-xs font-bold text-muted-foreground uppercase">3. Kesulitan Default *</Label>
                <select 
                  id="import_difficulty"
                  value={importDifficulty}
                  onChange={(e) => setImportDifficulty(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs transition-colors outline-none focus:ring-1 focus:ring-indigo-500 text-foreground cursor-pointer"
                >
                  <option value="MUDAH">Mudah</option>
                  <option value="SEDANG">Sedang</option>
                  <option value="SULIT">Sulit</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="import_type" className="text-xs font-bold text-muted-foreground uppercase">4. Tipe Akses Default *</Label>
                <select 
                  id="import_type"
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs transition-colors outline-none focus:ring-1 focus:ring-indigo-500 text-foreground cursor-pointer"
                >
                  <option value="FREE">Free</option>
                  <option value="PREMIUM">Eksklusif</option>
                </select>
              </div>
            </div>

            {/* Area Input Teks Soal Mentah */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Tempel Teks Soal Mentah Disini</Label>
              <textarea 
                rows={10}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={importCategory === 'TKP' ? `Contoh format TKP (Sebaran Poin):
1. Ketika menyelesaikan tugas kelompok yang sulit, sikap saya...
A. Bekerja sendiri agar lebih cepat selesai
B. Mengkoordinasikan tugas sesuai kelebihan masing-masing anggota
C. Menunggu arahan dari anggota yang lebih pandai
D. Membagi tugas secara rata tanpa berdiskusi terlebih dahulu
E. Mengeluh karena merasa tugas terlalu berat
Kunci: A:2, B:5, C:3, D:4, E:1
Pembahasan: Mengkoordinasikan tugas menunjukkan aspek kepemimpinan dan kolaborasi yang tinggi (poin 5).` : `Contoh format TWK/TIU:
1. Apa nama dasar negara Indonesia?
A. Pancasila
B. UUD 1945
C. GBHN
D. Konstitusi RIS
E. Piagam Jakarta
Kunci: A
Pembahasan: Dasar negara Indonesia adalah Pancasila.`}
                className="w-full font-mono text-xs rounded-lg border border-input bg-muted/20 px-3 py-2 transition-colors outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tombol Aksi Parsing */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">
                Format: Gunakan angka ikuti titik (misal `1. `) di setiap awal soal baru.
              </span>
              <Button 
                type="button" 
                onClick={handleParseQuestions}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl"
              >
                Proses & Pratinjau (Preview)
              </Button>
            </div>

            {/* Tampilan Preview Hasil Parsing */}
            {parsedQuestions.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                <h4 className="text-xs font-bold text-foreground">Hasil Pratinjau ({parsedQuestions.length} Soal Terdeteksi)</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {parsedQuestions.map((q, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 border rounded-lg text-xs transition-colors ${
                        q.isValid 
                          ? 'bg-emerald-500/[0.02] border-emerald-500/20' 
                          : 'bg-rose-500/[0.02] border-rose-500/20'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-extrabold text-foreground">Soal #{q.rawIndex || (idx + 1)}</span>
                        {q.isValid ? (
                          <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Valid</span>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Error</span>
                        )}
                      </div>
                      <p className="mt-1 text-foreground font-semibold line-clamp-1">{q.question_text || '(Pertanyaan Kosong)'}</p>
                      
                      {q.isValid ? (
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[10px] text-muted-foreground font-mono">
                          <span className="truncate">A: {q.option_a} {importCategory === 'TKP' && `(${q.scale_points?.A || 0}p)`}</span>
                          <span className="truncate">B: {q.option_b} {importCategory === 'TKP' && `(${q.scale_points?.B || 0}p)`}</span>
                          <span className="truncate">C: {q.option_c} {importCategory === 'TKP' && `(${q.scale_points?.C || 0}p)`}</span>
                          <span className="truncate">D: {q.option_d} {importCategory === 'TKP' && `(${q.scale_points?.D || 0}p)`}</span>
                          <span className="truncate">E: {q.option_e} {importCategory === 'TKP' && `(${q.scale_points?.E || 0}p)`}</span>
                          {importCategory !== 'TKP' ? (
                            <span className="font-bold text-amber-600 dark:text-amber-400">Kunci: {q.correct_option}</span>
                          ) : (
                            <span className="font-bold text-amber-600 dark:text-amber-400">Poin: A:{q.scale_points?.A},B:{q.scale_points?.B},C:{q.scale_points?.C},D:{q.scale_points?.D},E:{q.scale_points?.E}</span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-[10px] text-rose-500 font-bold">⚠️ {q.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-4 flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportOpen(false);
                setImportText('');
                setParsedQuestions([]);
              }}
              className="font-bold border-border rounded-xl"
              disabled={isImporting}
            >
              Batalkan
            </Button>
            <Button 
              onClick={handleSaveBulk}
              disabled={isImporting || parsedQuestions.filter(q => q.isValid).length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              {isImporting ? 'Menyimpan...' : `Simpan ${parsedQuestions.filter(q => q.isValid).length} Soal`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shape/Diagram Drawing Modal */}
      <ShapeBuilder
        isOpen={activeDrawingField !== null}
        onClose={() => setActiveDrawingField(null)}
        onSave={(blob) => {
          if (activeDrawingField) {
            handleSaveDrawing(blob, activeDrawingField);
          }
        }}
        title={`Buat Diagram / Bentuk (${
          activeDrawingField === 'image_url' ? 'Soal Utama' :
          activeDrawingField === 'explanation_image_url' ? 'Penjelasan Soal' :
          activeDrawingField?.startsWith('option_') ? `Pilihan ${activeDrawingField.split('_')[1].toUpperCase()}` :
          'Gambar'
        })`}
      />

    </div>
  );
}

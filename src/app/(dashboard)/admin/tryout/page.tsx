'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Award, 
  ArrowLeft, 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  Shield, 
  CheckCircle2, 
  Info,
  Settings,
  HelpCircle,
  X,
  FileText,
  Shuffle
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, Question } from '@/types';

interface ExamQuestionRelation {
  id: string;
  exam_id: string;
  question_id: string;
  order_index: number;
}

export default function AdminTryoutManagementPage() {
  const router = useRouter();
  const { profile, loading } = useAuthStore();

  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  
  // Package Form State
  const [isNewPkgFormOpen, setIsNewPkgFormOpen] = useState(false);
  const [pkgFormData, setPkgFormData] = useState({
    title: '',
    description: '',
    type: 'FREE' as 'FREE' | 'PREMIUM',
    category: 'MANDIRI' as 'MANDIRI' | 'KELOMPOK',
    duration_minutes: 100,
    passing_twk: 65,
    passing_tiu: 80,
    passing_tkp: 166,
    start_time: '',
    end_time: '',
    price: 0,
    twk_mudah: 5,
    twk_sedang: 20,
    twk_sulit: 5,
    tiu_mudah: 5,
    tiu_sedang: 25,
    tiu_sulit: 5,
    tkp_mudah: 5,
    tkp_sedang: 35,
    tkp_sulit: 5,
  });

  const [isEditingPkg, setIsEditingPkg] = useState(false);
  const [editPkgFormData, setEditPkgFormData] = useState({
    title: '',
    description: '',
    type: 'FREE' as 'FREE' | 'PREMIUM',
    category: 'MANDIRI' as 'MANDIRI' | 'KELOMPOK',
    duration_minutes: 100,
    passing_twk: 65,
    passing_tiu: 80,
    passing_tkp: 166,
    start_time: '',
    end_time: '',
    price: 0,
    twk_mudah: 0,
    twk_sedang: 0,
    twk_sulit: 0,
    tiu_mudah: 0,
    tiu_sedang: 0,
    tiu_sulit: 0,
    tkp_mudah: 0,
    tkp_sedang: 0,
    tkp_sulit: 0,
  });

  const [isSavingPkg, setIsSavingPkg] = useState(false);
  const [isDeletingPkg, setIsDeletingPkg] = useState(false);

  // Question Search & Filter State
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('ALL');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('ALL');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('ALL');

  // Randomizer State
  const [isRandomizerOpen, setIsRandomizerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [randomizerFormData, setRandomizerFormData] = useState({
    twkMudah: 5,
    twkSedang: 20,
    twkSulit: 5,
    tiuMudah: 5,
    tiuSedang: 25,
    tiuSulit: 5,
    tkpMudah: 5,
    tkpSedang: 35,
    tkpSulit: 5,
  });

  // Role protection: Redirect non-admin users
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

  // Fetch Packages
  const { data: packages, isLoading: isPkgLoading, refetch: refetchPackages } = useQuery({
    queryKey: ['admin-packages-tryout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Package[];
    },
    enabled: !!profile && profile.role === 'admin'
  });

  // Fetch all questions for bank selection
  const { data: allQuestions, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['admin-questions-list-tryout'],
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

  // Fetch all exam-question relationships
  const { data: relations, isLoading: isRelationsLoading, refetch: refetchRelations } = useQuery({
    queryKey: ['admin-exam-questions-junction'],
    queryFn: async () => {
      let allData: ExamQuestionRelation[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('exam_questions')
          .select('*')
          .order('order_index', { ascending: true })
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

  // Automatically select first package if none selected
  useEffect(() => {
    if (packages && packages.length > 0 && !selectedPkgId) {
      setSelectedPkgId(packages[0].id);
    }
  }, [packages, selectedPkgId]);

  // Helper to format ISO timestamp to YYYY-MM-DDTHH:MM for datetime-local inputs
  const formatToDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  // Sync edit form when selected package changes
  const selectedPkg = packages?.find(p => p.id === selectedPkgId) || null;
  useEffect(() => {
    if (selectedPkg) {
      setEditPkgFormData({
        title: selectedPkg.title,
        description: selectedPkg.description || '',
        type: selectedPkg.type,
        category: selectedPkg.category || 'MANDIRI',
        duration_minutes: selectedPkg.duration_minutes,
        passing_twk: selectedPkg.passing_twk,
        passing_tiu: selectedPkg.passing_tiu,
        passing_tkp: selectedPkg.passing_tkp,
        start_time: selectedPkg.start_time ? formatToDatetimeLocal(selectedPkg.start_time) : '',
        end_time: selectedPkg.end_time ? formatToDatetimeLocal(selectedPkg.end_time) : '',
        price: selectedPkg.price || 0,
        twk_mudah: selectedPkg.twk_mudah || 0,
        twk_sedang: selectedPkg.twk_sedang || 0,
        twk_sulit: selectedPkg.twk_sulit || 0,
        tiu_mudah: selectedPkg.tiu_mudah || 0,
        tiu_sedang: selectedPkg.tiu_sedang || 0,
        tiu_sulit: selectedPkg.tiu_sulit || 0,
        tkp_mudah: selectedPkg.tkp_mudah || 0,
        tkp_sedang: selectedPkg.tkp_sedang || 0,
        tkp_sulit: selectedPkg.tkp_sulit || 0
      });
    }
  }, [selectedPkgId, selectedPkg]);

  // Computed questions mapping
  const currentPkgRelations = relations?.filter(r => r.exam_id === selectedPkgId) || [];
  const linkedQuestionIds = new Set(currentPkgRelations.map(r => r.question_id));
  const linkedQuestions = allQuestions?.filter(q => linkedQuestionIds.has(q.id)) || [];

  // Sort linked questions by order_index in exam_questions
  const sortedLinkedQuestions = [...linkedQuestions].sort((a, b) => {
    const relA = currentPkgRelations.find(r => r.question_id === a.id);
    const relB = currentPkgRelations.find(r => r.question_id === b.id);
    return (relA?.order_index || 0) - (relB?.order_index || 0);
  });

  // Compute category/difficulty statistics breakdown
  const stats = selectedPkg?.category === 'MANDIRI' ? {
    total: selectedPkg.total_questions || 0,
    twk: (selectedPkg.twk_mudah || 0) + (selectedPkg.twk_sedang || 0) + (selectedPkg.twk_sulit || 0),
    tiu: (selectedPkg.tiu_mudah || 0) + (selectedPkg.tiu_sedang || 0) + (selectedPkg.tiu_sulit || 0),
    tkp: (selectedPkg.tkp_mudah || 0) + (selectedPkg.tkp_sedang || 0) + (selectedPkg.tkp_sulit || 0),
    
    mudah: (selectedPkg.twk_mudah || 0) + (selectedPkg.tiu_mudah || 0) + (selectedPkg.tkp_mudah || 0),
    sedang: (selectedPkg.twk_sedang || 0) + (selectedPkg.tiu_sedang || 0) + (selectedPkg.tkp_sedang || 0),
    sulit: (selectedPkg.twk_sulit || 0) + (selectedPkg.tiu_sulit || 0) + (selectedPkg.tkp_sulit || 0),
    
    twkMudah: selectedPkg.twk_mudah || 0,
    twkSedang: selectedPkg.twk_sedang || 0,
    twkSulit: selectedPkg.twk_sulit || 0,
    
    tiuMudah: selectedPkg.tiu_mudah || 0,
    tiuSedang: selectedPkg.tiu_sedang || 0,
    tiuSulit: selectedPkg.tiu_sulit || 0,
    
    tkpMudah: selectedPkg.tkp_mudah || 0,
    tkpSedang: selectedPkg.tkp_sedang || 0,
    tkpSulit: selectedPkg.tkp_sulit || 0,
  } : {
    total: sortedLinkedQuestions.length,
    twk: sortedLinkedQuestions.filter(q => q.category === 'TWK').length,
    tiu: sortedLinkedQuestions.filter(q => q.category === 'TIU').length,
    tkp: sortedLinkedQuestions.filter(q => q.category === 'TKP').length,
    mudah: sortedLinkedQuestions.filter(q => q.difficulty === 'MUDAH').length,
    sedang: sortedLinkedQuestions.filter(q => q.difficulty === 'SEDANG').length,
    sulit: sortedLinkedQuestions.filter(q => q.difficulty === 'SULIT').length,
    
    // Matrix breakdown
    twkMudah: sortedLinkedQuestions.filter(q => q.category === 'TWK' && q.difficulty === 'MUDAH').length,
    twkSedang: sortedLinkedQuestions.filter(q => q.category === 'TWK' && q.difficulty === 'SEDANG').length,
    twkSulit: sortedLinkedQuestions.filter(q => q.category === 'TWK' && q.difficulty === 'SULIT').length,
    
    tiuMudah: sortedLinkedQuestions.filter(q => q.category === 'TIU' && q.difficulty === 'MUDAH').length,
    tiuSedang: sortedLinkedQuestions.filter(q => q.category === 'TIU' && q.difficulty === 'SEDANG').length,
    tiuSulit: sortedLinkedQuestions.filter(q => q.category === 'TIU' && q.difficulty === 'SULIT').length,
    
    tkpMudah: sortedLinkedQuestions.filter(q => q.category === 'TKP' && q.difficulty === 'MUDAH').length,
    tkpSedang: sortedLinkedQuestions.filter(q => q.category === 'TKP' && q.difficulty === 'SEDANG').length,
    tkpSulit: sortedLinkedQuestions.filter(q => q.category === 'TKP' && q.difficulty === 'SULIT').length,
  };

  // Helper function to sync package total_questions count and contiguous order indexes
  const syncPackageQuestions = async (packageId: string) => {
    // 1. Fetch current relationships
    const { data: rels, error: fetchErr } = await supabase
      .from('exam_questions')
      .select('id, order_index')
      .eq('exam_id', packageId)
      .order('order_index', { ascending: true });

    if (fetchErr) throw fetchErr;

    // 2. Re-index sequentially from 1 to N
    if (rels && rels.length > 0) {
      const updates = rels.map((rel, index) => 
        supabase
          .from('exam_questions')
          .update({ order_index: index + 1 })
          .eq('id', rel.id)
      );
      await Promise.all(updates);
    }

    const totalCount = rels ? rels.length : 0;

    // 3. Update the total_questions column in the package record
    const { error: updateErr } = await supabase
      .from('packages')
      .update({ total_questions: totalCount })
      .eq('id', packageId);

    if (updateErr) throw updateErr;

    // Refetch state
    refetchPackages();
    refetchRelations();
  };

  // Add question connection
  const handleLinkQuestion = async (qId: string) => {
    if (!selectedPkgId) return;

    const toastId = toast.loading('Mengaitkan soal...');
    try {
      const nextOrderIndex = currentPkgRelations.length + 1;
      
      const { error } = await supabase
        .from('exam_questions')
        .insert({
          exam_id: selectedPkgId,
          question_id: qId,
          order_index: nextOrderIndex
        });

      if (error) throw error;

      await syncPackageQuestions(selectedPkgId);
      toast.success('Soal berhasil dikaitkan!', { id: toastId });
    } catch (err: any) {
      toast.error('Gagal mengaitkan soal: ' + err.message, { id: toastId });
    }
  };

  // Remove question connection
  const handleUnlinkQuestion = async (qId: string) => {
    if (!selectedPkgId) return;

    const toastId = toast.loading('Memutuskan hubungan soal...');
    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', selectedPkgId)
        .eq('question_id', qId);

      if (error) throw error;

      await syncPackageQuestions(selectedPkgId);
      toast.success('Soal berhasil dilepas dari paket!', { id: toastId });
    } catch (err: any) {
      toast.error('Gagal memutus hubungan: ' + err.message, { id: toastId });
    }
  };

  // Handle Save New Package
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPkg(true);
    const toastId = toast.loading('Membuat paket tryout baru...');

    try {
      const isMandiri = pkgFormData.category === 'MANDIRI';
      const totalMandiriQ = isMandiri ? (
        (pkgFormData.twk_mudah || 0) + (pkgFormData.twk_sedang || 0) + (pkgFormData.twk_sulit || 0) +
        (pkgFormData.tiu_mudah || 0) + (pkgFormData.tiu_sedang || 0) + (pkgFormData.tiu_sulit || 0) +
        (pkgFormData.tkp_mudah || 0) + (pkgFormData.tkp_sedang || 0) + (pkgFormData.tkp_sulit || 0)
      ) : 0;

      const { data, error } = await supabase
        .from('packages')
        .insert({
          title: pkgFormData.title,
          description: pkgFormData.description || null,
          type: pkgFormData.type,
          category: pkgFormData.category,
          duration_minutes: pkgFormData.duration_minutes,
          total_questions: totalMandiriQ,
          passing_twk: pkgFormData.passing_twk,
          passing_tiu: pkgFormData.passing_tiu,
          passing_tkp: pkgFormData.passing_tkp,
          start_time: pkgFormData.category === 'KELOMPOK' && pkgFormData.start_time ? new Date(pkgFormData.start_time).toISOString() : null,
          end_time: pkgFormData.category === 'KELOMPOK' && pkgFormData.end_time ? new Date(pkgFormData.end_time).toISOString() : null,
          price: pkgFormData.category === 'KELOMPOK' ? pkgFormData.price : 0,
          twk_mudah: isMandiri ? (pkgFormData.twk_mudah || 0) : 0,
          twk_sedang: isMandiri ? (pkgFormData.twk_sedang || 0) : 0,
          twk_sulit: isMandiri ? (pkgFormData.twk_sulit || 0) : 0,
          tiu_mudah: isMandiri ? (pkgFormData.tiu_mudah || 0) : 0,
          tiu_sedang: isMandiri ? (pkgFormData.tiu_sedang || 0) : 0,
          tiu_sulit: isMandiri ? (pkgFormData.tiu_sulit || 0) : 0,
          tkp_mudah: isMandiri ? (pkgFormData.tkp_mudah || 0) : 0,
          tkp_sedang: isMandiri ? (pkgFormData.tkp_sedang || 0) : 0,
          tkp_sulit: isMandiri ? (pkgFormData.tkp_sulit || 0) : 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Paket tryout berhasil dibuat!', { id: toastId });
      setIsNewPkgFormOpen(false);
      setPkgFormData({
        title: '',
        description: '',
        type: 'FREE',
        category: 'MANDIRI',
        duration_minutes: 100,
        passing_twk: 65,
        passing_tiu: 80,
        passing_tkp: 166,
        start_time: '',
        end_time: '',
        price: 0,
        twk_mudah: 5,
        twk_sedang: 20,
        twk_sulit: 5,
        tiu_mudah: 5,
        tiu_sedang: 25,
        tiu_sulit: 5,
        tkp_mudah: 5,
        tkp_sedang: 35,
        tkp_sulit: 5,
      });
      
      refetchPackages();
      if (data) {
        setSelectedPkgId(data.id);
      }
    } catch (err: any) {
      toast.error('Gagal membuat paket: ' + err.message, { id: toastId });
    } finally {
      setIsSavingPkg(false);
    }
  };

  // Handle Update Package Details
  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgId) return;
    setIsSavingPkg(true);
    const toastId = toast.loading('Memperbarui paket tryout...');

    try {
      const isMandiri = editPkgFormData.category === 'MANDIRI';
      const totalMandiriQ = isMandiri ? (
        (editPkgFormData.twk_mudah || 0) + (editPkgFormData.twk_sedang || 0) + (editPkgFormData.twk_sulit || 0) +
        (editPkgFormData.tiu_mudah || 0) + (editPkgFormData.tiu_sedang || 0) + (editPkgFormData.tiu_sulit || 0) +
        (editPkgFormData.tkp_mudah || 0) + (editPkgFormData.tkp_sedang || 0) + (editPkgFormData.tkp_sulit || 0)
      ) : (selectedPkg?.total_questions || 0);

      const { error } = await supabase
        .from('packages')
        .update({
          title: editPkgFormData.title,
          description: editPkgFormData.description || null,
          type: editPkgFormData.type,
          category: editPkgFormData.category,
          duration_minutes: editPkgFormData.duration_minutes,
          total_questions: totalMandiriQ,
          passing_twk: editPkgFormData.passing_twk,
          passing_tiu: editPkgFormData.passing_tiu,
          passing_tkp: editPkgFormData.passing_tkp,
          start_time: editPkgFormData.category === 'KELOMPOK' && editPkgFormData.start_time ? new Date(editPkgFormData.start_time).toISOString() : null,
          end_time: editPkgFormData.category === 'KELOMPOK' && editPkgFormData.end_time ? new Date(editPkgFormData.end_time).toISOString() : null,
          price: editPkgFormData.category === 'KELOMPOK' ? editPkgFormData.price : 0,
          twk_mudah: isMandiri ? (editPkgFormData.twk_mudah || 0) : 0,
          twk_sedang: isMandiri ? (editPkgFormData.twk_sedang || 0) : 0,
          twk_sulit: isMandiri ? (editPkgFormData.twk_sulit || 0) : 0,
          tiu_mudah: isMandiri ? (editPkgFormData.tiu_mudah || 0) : 0,
          tiu_sedang: isMandiri ? (editPkgFormData.tiu_sedang || 0) : 0,
          tiu_sulit: isMandiri ? (editPkgFormData.tiu_sulit || 0) : 0,
          tkp_mudah: isMandiri ? (editPkgFormData.tkp_mudah || 0) : 0,
          tkp_sedang: isMandiri ? (editPkgFormData.tkp_sedang || 0) : 0,
          tkp_sulit: isMandiri ? (editPkgFormData.tkp_sulit || 0) : 0,
        })
        .eq('id', selectedPkgId);

      if (error) throw error;

      toast.success('Paket tryout berhasil diperbarui!', { id: toastId });
      setIsEditingPkg(false);
      refetchPackages();
    } catch (err: any) {
      toast.error('Gagal memperbarui paket: ' + err.message, { id: toastId });
    } finally {
      setIsSavingPkg(false);
    }
  };

  // Handle Delete Package
  const handleDeletePackage = async () => {
    if (!selectedPkgId) return;
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus paket tryout ini? Semua data relasi soal dan riwayat percobaan pengguna (exam attempts) terkait paket ini akan ikut terhapus secara otomatis.');
    if (!confirmDelete) return;

    setIsDeletingPkg(true);
    const toastId = toast.loading('Menghapus paket tryout...');

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', selectedPkgId);

      if (error) throw error;

      toast.success('Paket tryout berhasil dihapus.', { id: toastId });
      setSelectedPkgId(null);
      refetchPackages();
    } catch (err: any) {
      toast.error('Gagal menghapus paket: ' + err.message, { id: toastId });
    } finally {
      setIsDeletingPkg(false);
    }
  };

  // Dynamic question counts available in the question bank grouped by category and difficulty
  const poolCounts = {
    twkMudah: allQuestions?.filter(q => q.category === 'TWK' && q.difficulty === 'MUDAH').length || 0,
    twkSedang: allQuestions?.filter(q => q.category === 'TWK' && q.difficulty === 'SEDANG').length || 0,
    twkSulit: allQuestions?.filter(q => q.category === 'TWK' && q.difficulty === 'SULIT').length || 0,
    
    tiuMudah: allQuestions?.filter(q => q.category === 'TIU' && q.difficulty === 'MUDAH').length || 0,
    tiuSedang: allQuestions?.filter(q => q.category === 'TIU' && q.difficulty === 'SEDANG').length || 0,
    tiuSulit: allQuestions?.filter(q => q.category === 'TIU' && q.difficulty === 'SULIT').length || 0,
    
    tkpMudah: allQuestions?.filter(q => q.category === 'TKP' && q.difficulty === 'MUDAH').length || 0,
    tkpSedang: allQuestions?.filter(q => q.category === 'TKP' && q.difficulty === 'SEDANG').length || 0,
    tkpSulit: allQuestions?.filter(q => q.category === 'TKP' && q.difficulty === 'SULIT').length || 0,
  };

  const applyPreset = (type: 'STANDARD' | 'MINI') => {
    if (type === 'STANDARD') {
      setRandomizerFormData({
        twkMudah: 5,
        twkSedang: 20,
        twkSulit: 5,
        tiuMudah: 5,
        tiuSedang: 25,
        tiuSulit: 5,
        tkpMudah: 5,
        tkpSedang: 35,
        tkpSulit: 5,
      });
    } else {
      setRandomizerFormData({
        twkMudah: 0,
        twkSedang: 2,
        twkSulit: 0,
        tiuMudah: 0,
        tiuSedang: 2,
        tiuSulit: 0,
        tkpMudah: 0,
        tkpSedang: 2,
        tkpSulit: 0,
      });
    }
  };

  const handleRandomizeQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgId || !allQuestions) return;

    // 1. Validation: check if requested counts exceed pool size
    const validationErrors: string[] = [];
    const fields = [
      { name: 'TWK MUDAH', req: randomizerFormData.twkMudah, avail: poolCounts.twkMudah },
      { name: 'TWK SEDANG', req: randomizerFormData.twkSedang, avail: poolCounts.twkSedang },
      { name: 'TWK SULIT', req: randomizerFormData.twkSulit, avail: poolCounts.twkSulit },
      { name: 'TIU MUDAH', req: randomizerFormData.tiuMudah, avail: poolCounts.tiuMudah },
      { name: 'TIU SEDANG', req: randomizerFormData.tiuSedang, avail: poolCounts.tiuSedang },
      { name: 'TIU SULIT', req: randomizerFormData.tiuSulit, avail: poolCounts.tiuSulit },
      { name: 'TKP MUDAH', req: randomizerFormData.tkpMudah, avail: poolCounts.tkpMudah },
      { name: 'TKP SEDANG', req: randomizerFormData.tkpSedang, avail: poolCounts.tkpSedang },
      { name: 'TKP SULIT', req: randomizerFormData.tkpSulit, avail: poolCounts.tkpSulit },
    ];

    fields.forEach(f => {
      if (f.req > f.avail) {
        validationErrors.push(`Stok soal ${f.name} tidak cukup (Diminta: ${f.req}, Tersedia: ${f.avail})`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(
        <div className="space-y-1">
          <p className="font-bold">Gagal mengacak soal:</p>
          <ul className="list-disc pl-4 text-xs">
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      );
      return;
    }

    const totalRequested = fields.reduce((sum, f) => sum + f.req, 0);
    if (totalRequested === 0) {
      toast.error('Silakan tentukan minimal 1 soal yang ingin diacak.');
      return;
    }

    // Confirm action
    const confirmMsg = `Tindakan ini akan menghapus semua soal yang saat ini dikaitkan dengan paket ini dan menggantinya dengan ${totalRequested} soal acak baru. Apakah Anda yakin?`;
    if (!window.confirm(confirmMsg)) return;

    setIsGenerating(true);
    const toastId = toast.loading('Memproses pengacakan soal...');

    try {
      // Helper function to pick random items from pool
      const pickRandom = (category: string, difficulty: string, count: number) => {
        const pool = allQuestions.filter(q => q.category === category && q.difficulty === difficulty);
        // Shuffle (Fisher-Yates)
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
      };

      // Select questions for each group
      const selectedTWKMudah = pickRandom('TWK', 'MUDAH', randomizerFormData.twkMudah);
      const selectedTWKSedang = pickRandom('TWK', 'SEDANG', randomizerFormData.twkSedang);
      const selectedTWKSulit = pickRandom('TWK', 'SULIT', randomizerFormData.twkSulit);

      const selectedTIUMudah = pickRandom('TIU', 'MUDAH', randomizerFormData.tiuMudah);
      const selectedTIUSedang = pickRandom('TIU', 'SEDANG', randomizerFormData.tiuSedang);
      const selectedTIUSulit = pickRandom('TIU', 'SULIT', randomizerFormData.tiuSulit);

      const selectedTKPMudah = pickRandom('TKP', 'MUDAH', randomizerFormData.tkpMudah);
      const selectedTKPSedang = pickRandom('TKP', 'SEDANG', randomizerFormData.tkpSedang);
      const selectedTKPSulit = pickRandom('TKP', 'SULIT', randomizerFormData.tkpSulit);

      // Order standard: TWK -> TIU -> TKP
      const finalQuestions = [
        ...selectedTWKMudah,
        ...selectedTWKSedang,
        ...selectedTWKSulit,
        ...selectedTIUMudah,
        ...selectedTIUSedang,
        ...selectedTIUSulit,
        ...selectedTKPMudah,
        ...selectedTKPSedang,
        ...selectedTKPSulit,
      ];

      // 2. Delete existing links
      const { error: deleteError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', selectedPkgId);

      if (deleteError) throw deleteError;

      // 3. Bulk insert new relationships
      if (finalQuestions.length > 0) {
        const payload = finalQuestions.map((q, idx) => ({
          exam_id: selectedPkgId,
          question_id: q.id,
          order_index: idx + 1
        }));

        const { error: insertError } = await supabase
          .from('exam_questions')
          .insert(payload);

        if (insertError) throw insertError;
      }

      // 4. Sync package
      await syncPackageQuestions(selectedPkgId);

      toast.success(`Berhasil mengacak & memasang ${finalQuestions.length} soal ke dalam paket!`, { id: toastId });
      setIsRandomizerOpen(false);
    } catch (err: any) {
      toast.error('Gagal mengacak soal: ' + err.message, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter unlinked questions bank
  const filteredBankQuestions = allQuestions?.filter(q => {
    // 1. Must NOT be linked to this package already
    if (linkedQuestionIds.has(q.id)) return false;

    // 2. Category filter
    if (questionCategoryFilter !== 'ALL' && q.category !== questionCategoryFilter) return false;

    // 3. Difficulty filter
    if (questionDifficultyFilter !== 'ALL' && q.difficulty !== questionDifficultyFilter) return false;

    // 3.5. Type filter
    if (questionTypeFilter !== 'ALL' && (q.type || 'FREE') !== questionTypeFilter) return false;

    // 4. Search text
    if (questionSearch.trim()) {
      const query = questionSearch.toLowerCase();
      const textMatch = q.question_text.toLowerCase().includes(query);
      const explanationMatch = q.explanation?.toLowerCase().includes(query) || false;
      return textMatch || explanationMatch;
    }

    return true;
  }) || [];

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
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Dashboard
          </button>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <Award className="h-4 w-4" /> Manajemen Paket Tryout & Aturan Passing Grade
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Kelola Paket Tryout</h1>
          <p className="text-muted-foreground">Buat paket simulasi, konfigurasi durasi, passing grade (TWK/TIU/TKP), dan petakan bank soal.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsNewPkgFormOpen(true)}
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Buat Paket Baru
          </Button>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Tryout Packages List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground">Daftar Paket Tryout</CardTitle>
              <CardDescription>Pilih paket untuk mengonfigurasi aturan & bank soal</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isPkgLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : packages && packages.length > 0 ? (
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {packages.map((pkg) => {
                    const isSelected = selectedPkgId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => {
                          setSelectedPkgId(pkg.id);
                          setIsEditingPkg(false);
                        }}
                        className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 focus:outline-none ${
                          isSelected 
                            ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-l-4 border-indigo-600' 
                            : 'hover:bg-muted/50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 w-full">
                          <h4 className={`text-sm font-bold truncate ${
                            isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'
                          }`}>
                            {pkg.title}
                          </h4>
                          <div className="flex gap-1 shrink-0">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              pkg.category === 'KELOMPOK'
                                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                            }`}>
                              {pkg.category || 'MANDIRI'}
                            </span>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              pkg.type === 'PREMIUM' 
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}>
                              {pkg.type}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{pkg.description || 'Tidak ada deskripsi'}</p>
                        
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                            Durasi: {pkg.duration_minutes}m
                          </span>
                          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                            {pkg.total_questions} Soal
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-2 border-t border-border/50 pt-2 w-full text-[9px] font-medium text-muted-foreground">
                          <span>TWK: {pkg.passing_twk}</span>
                          <span>•</span>
                          <span>TIU: {pkg.passing_tiu}</span>
                          <span>•</span>
                          <span>TKP: {pkg.passing_tkp}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Belum ada paket ujian. Silakan klik tombol "Buat Paket Baru" untuk memulai.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Selected Package Configuration & Question mapping (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* New Package Creation Modal/Form Box */}
          {isNewPkgFormOpen && (
            <Card className="bg-card border-indigo-500 shadow-md">
              <CardHeader className="bg-indigo-600/10 dark:bg-indigo-600/20 pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-bold text-indigo-600 dark:text-indigo-400">Buat Paket Tryout Baru</CardTitle>
                    <CardDescription>Form pembuatan paket simulasi CAT CPNS</CardDescription>
                  </div>
                  <button 
                    onClick={() => setIsNewPkgFormOpen(false)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <form onSubmit={handleCreatePackage}>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Title */}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label htmlFor="new_title" className="text-xs font-bold text-muted-foreground">Nama / Judul Paket Ujian *</Label>
                      <Input 
                        id="new_title"
                        required
                        value={pkgFormData.title}
                        onChange={(e) => setPkgFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Contoh: Paket Simulasi CAT SKD CPNS 01"
                        className="bg-muted/30 border-border h-10"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label htmlFor="new_desc" className="text-xs font-bold text-muted-foreground">Deskripsi Paket Ujian</Label>
                      <textarea 
                        id="new_desc"
                        rows={2}
                        value={pkgFormData.description}
                        onChange={(e) => setPkgFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Deskripsi singkat mengenai paket tryout..."
                        className="w-full text-sm bg-muted/30 border border-input rounded-md px-3 py-2 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>

                    {/* Type Dropdown */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new_type" className="text-xs font-bold text-muted-foreground">Tipe Paket *</Label>
                      <select 
                        id="new_type"
                        value={pkgFormData.type}
                        onChange={(e) => setPkgFormData(prev => ({ ...prev, type: e.target.value as 'FREE' | 'PREMIUM' }))}
                        className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="FREE">FREE (Terbuka untuk semua)</option>
                        <option value="PREMIUM">PREMIUM (Hanya pelanggan berbayar)</option>
                      </select>
                    </div>

                    {/* Category Dropdown */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new_category" className="text-xs font-bold text-muted-foreground">Kategori Tryout *</Label>
                      <select 
                        id="new_category"
                        value={pkgFormData.category}
                        onChange={(e) => setPkgFormData(prev => ({ ...prev, category: e.target.value as 'MANDIRI' | 'KELOMPOK' }))}
                        className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="MANDIRI">MANDIRI (Individu / Kapan Saja)</option>
                        <option value="KELOMPOK">KELOMPOK (Tryout Bersama / Massal)</option>
                      </select>
                    </div>

                    {pkgFormData.category === 'KELOMPOK' && (
                      <>
                        {/* Start Time */}
                        <div className="space-y-1.5">
                          <Label htmlFor="new_start_time" className="text-xs font-bold text-muted-foreground">Waktu Mulai *</Label>
                          <Input 
                            id="new_start_time"
                            type="datetime-local"
                            required
                            value={pkgFormData.start_time}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, start_time: e.target.value }))}
                            className="bg-muted/30 border-border h-10"
                          />
                        </div>

                        {/* End Time */}
                        <div className="space-y-1.5">
                          <Label htmlFor="new_end_time" className="text-xs font-bold text-muted-foreground">Waktu Selesai *</Label>
                          <Input 
                            id="new_end_time"
                            type="datetime-local"
                            required
                            value={pkgFormData.end_time}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, end_time: e.target.value }))}
                            className="bg-muted/30 border-border h-10"
                          />
                        </div>

                        {/* Price */}
                        <div className="space-y-1.5 md:col-span-2">
                          <Label htmlFor="new_price" className="text-xs font-bold text-muted-foreground">Harga Pendaftaran Tiket (Rp) *</Label>
                          <Input 
                            id="new_price"
                            type="number"
                            min="0"
                            required
                            value={pkgFormData.price}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, price: Math.max(0, parseInt(e.target.value) || 0) }))}
                            placeholder="Contoh: 25000 (0 jika gratis)"
                            className="bg-muted/30 border-border h-10"
                          />
                        </div>
                      </>
                    )}

                    {/* Duration */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new_duration" className="text-xs font-bold text-muted-foreground">Durasi Ujian (Menit) *</Label>
                      <Input 
                        id="new_duration"
                        type="number"
                        min="1"
                        required
                        value={pkgFormData.duration_minutes}
                        onChange={(e) => setPkgFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 100 }))}
                        className="bg-muted/30 border-border h-10"
                      />
                    </div>

                    {/* Passing TWK */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new_passing_twk" className="text-xs font-bold text-muted-foreground">Passing Grade TWK (Standar: 65) *</Label>
                      <Input 
                        id="new_passing_twk"
                        type="number"
                        min="0"
                        required
                        value={pkgFormData.passing_twk}
                        onChange={(e) => setPkgFormData(prev => ({ ...prev, passing_twk: parseInt(e.target.value) || 0 }))}
                        className="bg-muted/30 border-border h-10"
                      />
                    </div>

                    {/* Passing TIU */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new_passing_tiu" className="text-xs font-bold text-muted-foreground">Passing Grade TIU (Standar: 80) *</Label>
                      <Input 
                        id="new_passing_tiu"
                        type="number"
                        min="0"
                        required
                        value={pkgFormData.passing_tiu}
                        onChange={(e) => setPkgFormData(prev => ({ ...prev, passing_tiu: parseInt(e.target.value) || 0 }))}
                        className="bg-muted/30 border-border h-10"
                      />
                    </div>

                    {/* Passing TKP */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new_passing_tkp" className="text-xs font-bold text-muted-foreground">Passing Grade TKP (Standar: 166) *</Label>
                      <Input 
                        id="new_passing_tkp"
                        type="number"
                        min="0"
                        required
                        value={pkgFormData.passing_tkp}
                        onChange={(e) => setPkgFormData(prev => ({ ...prev, passing_tkp: parseInt(e.target.value) || 0 }))}
                        className="bg-muted/30 border-border h-10"
                      />
                    </div>

                    {pkgFormData.category === 'MANDIRI' && (
                      <div className="md:col-span-2 border-t border-border pt-4 mt-2 space-y-4">
                        <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          Konfigurasi Alokasi & Keseimbangan Soal Acak
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Tentukan jumlah soal acak yang akan ditarik dari bank soal berdasarkan kategori dan tingkat kesulitan. Total soal paket ini akan otomatis dihitung dari jumlah ini.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-3 bg-muted/10 p-3 rounded-lg border border-border">
                          {/* Headers */}
                          <div className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Kategori</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase text-center">Tingkat Kesulitan</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase text-right pr-1">Jumlah Soal</div>
                          
                          {/* TWK MUDAH */}
                          <div className="text-xs font-semibold self-center">TWK</div>
                          <div className="text-xs text-muted-foreground text-center self-center">MUDAH</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.twk_mudah}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, twk_mudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />

                          {/* TWK SEDANG */}
                          <div className="text-xs font-semibold self-center">TWK</div>
                          <div className="text-xs text-muted-foreground text-center self-center">SEDANG</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.twk_sedang}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, twk_sedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />

                          {/* TWK SULIT */}
                          <div className="text-xs font-semibold self-center">TWK</div>
                          <div className="text-xs text-muted-foreground text-center self-center">SULIT</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.twk_sulit}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, twk_sulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />

                          <div className="col-span-3 border-t border-border/50 my-1"></div>

                          {/* TIU MUDAH */}
                          <div className="text-xs font-semibold self-center">TIU</div>
                          <div className="text-xs text-muted-foreground text-center self-center">MUDAH</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.tiu_mudah}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, tiu_mudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />

                          {/* TIU SEDANG */}
                          <div className="text-xs font-semibold self-center">TIU</div>
                          <div className="text-xs text-muted-foreground text-center self-center">SEDANG</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.tiu_sedang}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, tiu_sedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />

                          {/* TIU SULIT */}
                          <div className="text-xs font-semibold self-center">TIU</div>
                          <div className="text-xs text-muted-foreground text-center self-center">SULIT</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.tiu_sulit}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, tiu_sulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />

                          <div className="col-span-3 border-t border-border/50 my-1"></div>

                          {/* TKP MUDAH */}
                          <div className="text-xs font-semibold self-center">TKP</div>
                          <div className="text-xs text-muted-foreground text-center self-center">MUDAH</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.tkp_mudah}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, tkp_mudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />

                          {/* TKP SEDANG */}
                          <div className="text-xs font-semibold self-center">TKP</div>
                          <div className="text-xs text-muted-foreground text-center self-center">SEDANG</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.tkp_sedang}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, tkp_sedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />

                          {/* TKP SULIT */}
                          <div className="text-xs font-semibold self-center">TKP</div>
                          <div className="text-xs text-muted-foreground text-center self-center">SULIT</div>
                          <Input 
                            type="number" min="0" className="h-8 text-right bg-background border-border"
                            value={pkgFormData.tkp_sulit}
                            onChange={(e) => setPkgFormData(prev => ({ ...prev, tkp_sulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                          />
                        </div>
                      </div>
                    )}

                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 bg-muted/20">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsNewPkgFormOpen(false)}
                    className="font-bold border-border"
                    disabled={isSavingPkg}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                    disabled={isSavingPkg}
                  >
                    {isSavingPkg ? 'Membuat...' : 'Buat Paket'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Randomize Questions Form Box */}
          {isRandomizerOpen && selectedPkg && (
            <Card className="bg-card border-indigo-500 shadow-md">
              <CardHeader className="bg-indigo-600/10 dark:bg-indigo-600/20 pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <Shuffle className="h-4.5 w-4.5" /> Acak Soal Otomatis
                    </CardTitle>
                    <CardDescription>
                      Tentukan jumlah soal dan tingkat kesulitan untuk membuat paket tryout secara otomatis.
                    </CardDescription>
                  </div>
                  <button 
                    onClick={() => setIsRandomizerOpen(false)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <form onSubmit={handleRandomizeQuestions}>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Warning Info */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-700 dark:text-amber-300 text-xs flex gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Peringatan Penting</p>
                      <p className="mt-0.5 leading-relaxed">
                        Proses ini akan <strong>menghapus seluruh soal yang terhubung saat ini</strong> pada paket <strong>"{selectedPkg.title}"</strong> dan menggantikannya dengan kumpulan soal acak baru sesuai konfigurasi di bawah ini.
                      </p>
                    </div>
                  </div>

                  {/* Preset Templates */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">Preset Alokasi Soal Cepat</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('STANDARD')}
                        className="text-xs border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-semibold"
                      >
                        Standar BKN (110 Soal)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset('MINI')}
                        className="text-xs border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-semibold"
                      >
                        Mini Tryout (6 Soal)
                      </Button>
                    </div>
                  </div>

                  {/* Categories Configuration Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* TWK Group */}
                    <div className="space-y-4 border border-border p-4 rounded-xl bg-muted/10">
                      <div className="border-b border-border pb-2">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Tes Wawasan Kebangsaan (TWK)</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          Total Diminta: {randomizerFormData.twkMudah + randomizerFormData.twkSedang + randomizerFormData.twkSulit} soal
                        </p>
                      </div>
                      
                      {/* TWK Mudah */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="twk_mudah" className="font-semibold text-muted-foreground">Mudah</Label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.twkMudah}
                          </span>
                        </div>
                        <Input
                          id="twk_mudah"
                          type="number"
                          min="0"
                          max={poolCounts.twkMudah}
                          value={randomizerFormData.twkMudah}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, twkMudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>

                      {/* TWK Sedang */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="twk_sedang" className="font-semibold text-muted-foreground">Sedang</Label>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.twkSedang}
                          </span>
                        </div>
                        <Input
                          id="twk_sedang"
                          type="number"
                          min="0"
                          max={poolCounts.twkSedang}
                          value={randomizerFormData.twkSedang}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, twkSedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>

                      {/* TWK Sulit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="twk_sulit" className="font-semibold text-muted-foreground">Sulit</Label>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.twkSulit}
                          </span>
                        </div>
                        <Input
                          id="twk_sulit"
                          type="number"
                          min="0"
                          max={poolCounts.twkSulit}
                          value={randomizerFormData.twkSulit}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, twkSulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>
                    </div>

                    {/* TIU Group */}
                    <div className="space-y-4 border border-border p-4 rounded-xl bg-muted/10">
                      <div className="border-b border-border pb-2">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Tes Inteligensia Umum (TIU)</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          Total Diminta: {randomizerFormData.tiuMudah + randomizerFormData.tiuSedang + randomizerFormData.tiuSulit} soal
                        </p>
                      </div>
                      
                      {/* TIU Mudah */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="tiu_mudah" className="font-semibold text-muted-foreground">Mudah</Label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.tiuMudah}
                          </span>
                        </div>
                        <Input
                          id="tiu_mudah"
                          type="number"
                          min="0"
                          max={poolCounts.tiuMudah}
                          value={randomizerFormData.tiuMudah}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, tiuMudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>

                      {/* TIU Sedang */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="tiu_sedang" className="font-semibold text-muted-foreground">Sedang</Label>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.tiuSedang}
                          </span>
                        </div>
                        <Input
                          id="tiu_sedang"
                          type="number"
                          min="0"
                          max={poolCounts.tiuSedang}
                          value={randomizerFormData.tiuSedang}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, tiuSedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>

                      {/* TIU Sulit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="tiu_sulit" className="font-semibold text-muted-foreground">Sulit</Label>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.tiuSulit}
                          </span>
                        </div>
                        <Input
                          id="tiu_sulit"
                          type="number"
                          min="0"
                          max={poolCounts.tiuSulit}
                          value={randomizerFormData.tiuSulit}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, tiuSulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>
                    </div>

                    {/* TKP Group */}
                    <div className="space-y-4 border border-border p-4 rounded-xl bg-muted/10">
                      <div className="border-b border-border pb-2">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Tes Karakteristik Pribadi (TKP)</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          Total Diminta: {randomizerFormData.tkpMudah + randomizerFormData.tkpSedang + randomizerFormData.tkpSulit} soal
                        </p>
                      </div>
                      
                      {/* TKP Mudah */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="tkp_mudah" className="font-semibold text-muted-foreground">Mudah</Label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.tkpMudah}
                          </span>
                        </div>
                        <Input
                          id="tkp_mudah"
                          type="number"
                          min="0"
                          max={poolCounts.tkpMudah}
                          value={randomizerFormData.tkpMudah}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, tkpMudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>

                      {/* TKP Sedang */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="tkp_sedang" className="font-semibold text-muted-foreground">Sedang</Label>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.tkpSedang}
                          </span>
                        </div>
                        <Input
                          id="tkp_sedang"
                          type="number"
                          min="0"
                          max={poolCounts.tkpSedang}
                          value={randomizerFormData.tkpSedang}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, tkpSedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>

                      {/* TKP Sulit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <Label htmlFor="tkp_sulit" className="font-semibold text-muted-foreground">Sulit</Label>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                            Tersedia: {poolCounts.tkpSulit}
                          </span>
                        </div>
                        <Input
                          id="tkp_sulit"
                          type="number"
                          min="0"
                          max={poolCounts.tkpSulit}
                          value={randomizerFormData.tkpSulit}
                          onChange={(e) => setRandomizerFormData(prev => ({ ...prev, tkpSulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="bg-background border-border h-9 text-sm"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Summary Total */}
                  <div className="flex justify-between items-center p-3 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/10 text-sm">
                    <span className="font-semibold text-muted-foreground">Total Soal Akan Terpasang:</span>
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                      {randomizerFormData.twkMudah + randomizerFormData.twkSedang + randomizerFormData.twkSulit +
                       randomizerFormData.tiuMudah + randomizerFormData.tiuSedang + randomizerFormData.tiuSulit +
                       randomizerFormData.tkpMudah + randomizerFormData.tkpSedang + randomizerFormData.tkpSulit} Soal
                    </span>
                  </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 bg-muted/20">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsRandomizerOpen(false)}
                    className="font-bold border-border"
                    disabled={isGenerating}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 flex items-center gap-1.5"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                      </>
                    ) : (
                      <>
                        <Shuffle className="h-4 w-4" /> Acak & Pasang Soal
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Selected Package Management panel */}
          {selectedPkg ? (
            <div className="space-y-6">
              
              {/* Package Meta Info & Config Card */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4 border-b border-border bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">{selectedPkg.title}</h2>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        selectedPkg.type === 'PREMIUM' 
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {selectedPkg.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedPkg.description || 'Tidak ada deskripsi'}</p>
                  </div>
                  
                  {!isEditingPkg && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPkg.category !== 'MANDIRI' && (
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsRandomizerOpen(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 border-indigo-600"
                        >
                          <Shuffle className="h-3.5 w-3.5" /> Acak Soal Otomatis
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditingPkg(true)}
                        className="font-bold border-border text-xs"
                      >
                        Edit Pengaturan
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleDeletePackage}
                        className="font-bold text-xs"
                        disabled={isDeletingPkg}
                      >
                        {isDeletingPkg ? '...' : 'Hapus Paket'}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                
                {isEditingPkg ? (
                  <form onSubmit={handleUpdatePackage}>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Title */}
                        <div className="md:col-span-2 space-y-1.5">
                          <Label htmlFor="edit_title" className="text-xs font-bold text-muted-foreground">Nama / Judul Paket Ujian *</Label>
                          <Input 
                            id="edit_title"
                            required
                            value={editPkgFormData.title}
                            onChange={(e) => setEditPkgFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="bg-muted/30 border-border h-10"
                          />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2 space-y-1.5">
                          <Label htmlFor="edit_desc" className="text-xs font-bold text-muted-foreground">Deskripsi Paket Ujian</Label>
                          <textarea 
                            id="edit_desc"
                            rows={2}
                            value={editPkgFormData.description}
                            onChange={(e) => setEditPkgFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full text-sm bg-muted/30 border border-input rounded-md px-3 py-2 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>

                        {/* Type Dropdown */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit_type" className="text-xs font-bold text-muted-foreground">Tipe Paket *</Label>
                          <select 
                            id="edit_type"
                            value={editPkgFormData.type}
                            onChange={(e) => setEditPkgFormData(prev => ({ ...prev, type: e.target.value as 'FREE' | 'PREMIUM' }))}
                            className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            <option value="FREE">FREE</option>
                            <option value="PREMIUM">PREMIUM</option>
                          </select>
                        </div>

                        {/* Category Dropdown */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit_category" className="text-xs font-bold text-muted-foreground">Kategori Tryout *</Label>
                          <select 
                            id="edit_category"
                            value={editPkgFormData.category}
                            onChange={(e) => setEditPkgFormData(prev => ({ ...prev, category: e.target.value as 'MANDIRI' | 'KELOMPOK' }))}
                            className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            <option value="MANDIRI">MANDIRI</option>
                            <option value="KELOMPOK">KELOMPOK</option>
                          </select>
                        </div>

                        {editPkgFormData.category === 'KELOMPOK' && (
                          <>
                            {/* Start Time */}
                            <div className="space-y-1.5">
                              <Label htmlFor="edit_start_time" className="text-xs font-bold text-muted-foreground">Waktu Mulai *</Label>
                              <Input 
                                id="edit_start_time"
                                type="datetime-local"
                                required
                                value={editPkgFormData.start_time}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                className="bg-muted/30 border-border h-10"
                              />
                            </div>

                            {/* End Time */}
                            <div className="space-y-1.5">
                              <Label htmlFor="edit_end_time" className="text-xs font-bold text-muted-foreground">Waktu Selesai *</Label>
                              <Input 
                                id="edit_end_time"
                                type="datetime-local"
                                required
                                value={editPkgFormData.end_time}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                className="bg-muted/30 border-border h-10"
                              />
                            </div>

                            {/* Price */}
                            <div className="space-y-1.5 md:col-span-2">
                              <Label htmlFor="edit_price" className="text-xs font-bold text-muted-foreground">Harga Pendaftaran Tiket (Rp) *</Label>
                              <Input 
                                id="edit_price"
                                type="number"
                                min="0"
                                required
                                value={editPkgFormData.price}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, price: Math.max(0, parseInt(e.target.value) || 0) }))}
                                placeholder="Contoh: 25000 (0 jika gratis)"
                                className="bg-muted/30 border-border h-10"
                              />
                            </div>
                          </>
                        )}

                        {/* Duration */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit_duration" className="text-xs font-bold text-muted-foreground">Durasi Ujian (Menit) *</Label>
                          <Input 
                            id="edit_duration"
                            type="number"
                            min="1"
                            required
                            value={editPkgFormData.duration_minutes}
                            onChange={(e) => setEditPkgFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 100 }))}
                            className="bg-muted/30 border-border h-10"
                          />
                        </div>

                        {/* Passing TWK */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit_passing_twk" className="text-xs font-bold text-muted-foreground">Passing Grade TWK *</Label>
                          <Input 
                            id="edit_passing_twk"
                            type="number"
                            min="0"
                            required
                            value={editPkgFormData.passing_twk}
                            onChange={(e) => setEditPkgFormData(prev => ({ ...prev, passing_twk: parseInt(e.target.value) || 0 }))}
                            className="bg-muted/30 border-border h-10"
                          />
                        </div>

                        {/* Passing TIU */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit_passing_tiu" className="text-xs font-bold text-muted-foreground">Passing Grade TIU *</Label>
                          <Input 
                            id="edit_passing_tiu"
                            type="number"
                            min="0"
                            required
                            value={editPkgFormData.passing_tiu}
                            onChange={(e) => setEditPkgFormData(prev => ({ ...prev, passing_tiu: parseInt(e.target.value) || 0 }))}
                            className="bg-muted/30 border-border h-10"
                          />
                        </div>

                        {/* Passing TKP */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit_passing_tkp" className="text-xs font-bold text-muted-foreground">Passing Grade TKP *</Label>
                          <Input 
                            id="edit_passing_tkp"
                            type="number"
                            min="0"
                            required
                            value={editPkgFormData.passing_tkp}
                            onChange={(e) => setEditPkgFormData(prev => ({ ...prev, passing_tkp: parseInt(e.target.value) || 0 }))}
                            className="bg-muted/30 border-border h-10"
                          />
                        </div>

                        {editPkgFormData.category === 'MANDIRI' && (
                          <div className="md:col-span-2 border-t border-border pt-4 mt-2 space-y-4">
                            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              Konfigurasi Alokasi & Keseimbangan Soal Acak
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Tentukan jumlah soal acak yang akan ditarik dari bank soal berdasarkan kategori dan tingkat kesulitan. Total soal paket ini akan otomatis dihitung dari jumlah ini.
                            </p>
                            
                            <div className="grid grid-cols-3 gap-3 bg-muted/10 p-3 rounded-lg border border-border">
                              {/* Headers */}
                              <div className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Kategori</div>
                              <div className="text-[10px] font-bold text-muted-foreground uppercase text-center">Tingkat Kesulitan</div>
                              <div className="text-[10px] font-bold text-muted-foreground uppercase text-right pr-1">Jumlah Soal</div>
                              
                              {/* TWK MUDAH */}
                              <div className="text-xs font-semibold self-center">TWK</div>
                              <div className="text-xs text-muted-foreground text-center self-center">MUDAH</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.twk_mudah}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, twk_mudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />

                              {/* TWK SEDANG */}
                              <div className="text-xs font-semibold self-center">TWK</div>
                              <div className="text-xs text-muted-foreground text-center self-center">SEDANG</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.twk_sedang}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, twk_sedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />

                              {/* TWK SULIT */}
                              <div className="text-xs font-semibold self-center">TWK</div>
                              <div className="text-xs text-muted-foreground text-center self-center">SULIT</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.twk_sulit}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, twk_sulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />

                              <div className="col-span-3 border-t border-border/50 my-1"></div>

                              {/* TIU MUDAH */}
                              <div className="text-xs font-semibold self-center">TIU</div>
                              <div className="text-xs text-muted-foreground text-center self-center">MUDAH</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.tiu_mudah}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, tiu_mudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />

                              {/* TIU SEDANG */}
                              <div className="text-xs font-semibold self-center">TIU</div>
                              <div className="text-xs text-muted-foreground text-center self-center">SEDANG</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.tiu_sedang}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, tiu_sedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />

                              {/* TIU SULIT */}
                              <div className="text-xs font-semibold self-center">TIU</div>
                              <div className="text-xs text-muted-foreground text-center self-center">SULIT</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.tiu_sulit}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, tiu_sulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />

                              <div className="col-span-3 border-t border-border/50 my-1"></div>

                              {/* TKP MUDAH */}
                              <div className="text-xs font-semibold self-center">TKP</div>
                              <div className="text-xs text-muted-foreground text-center self-center">MUDAH</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.tkp_mudah}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, tkp_mudah: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />

                              {/* TKP SEDANG */}
                              <div className="text-xs font-semibold self-center">TKP</div>
                              <div className="text-xs text-muted-foreground text-center self-center">SEDANG</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.tkp_sedang}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, tkp_sedang: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />

                              {/* TKP SULIT */}
                              <div className="text-xs font-semibold self-center">TKP</div>
                              <div className="text-xs text-muted-foreground text-center self-center">SULIT</div>
                              <Input 
                                type="number" min="0" className="h-8 text-right bg-background border-border"
                                value={editPkgFormData.tkp_sulit}
                                onChange={(e) => setEditPkgFormData(prev => ({ ...prev, tkp_sulit: Math.max(0, parseInt(e.target.value) || 0) }))}
                              />
                            </div>
                          </div>
                        )}

                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 bg-muted/20">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditingPkg(false)}
                        className="font-bold border-border"
                        disabled={isSavingPkg}
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                        disabled={isSavingPkg}
                      >
                        {isSavingPkg ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                    </CardFooter>
                  </form>
                ) : (
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      
                      <div className="bg-muted/40 p-4 rounded-xl border border-border">
                        <div className="text-xs text-muted-foreground font-semibold">Durasi Ujian</div>
                        <div className="text-xl font-bold mt-1 text-foreground">{selectedPkg.duration_minutes} Menit</div>
                      </div>

                      <div className="bg-muted/40 p-4 rounded-xl border border-border">
                        <div className="text-xs text-muted-foreground font-semibold">Total Pertanyaan</div>
                        <div className="text-xl font-bold mt-1 text-foreground">{selectedPkg.total_questions} Butir</div>
                      </div>

                      <div className="bg-muted/40 p-4 rounded-xl border border-border">
                        <div className="text-xs text-muted-foreground font-semibold">Kategori & Akses</div>
                        <div className="text-xl font-bold mt-1 text-foreground capitalize">{selectedPkg.category || 'MANDIRI'}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-semibold">{selectedPkg.type}</div>
                      </div>

                      <div className="bg-muted/40 p-4 rounded-xl border border-border">
                        <div className="text-xs text-muted-foreground font-semibold">Batas Lulus (Passing)</div>
                        <div className="text-xs font-bold mt-1.5 space-y-0.5 text-muted-foreground">
                          <div className="flex justify-between"><span>TWK:</span> <span className="text-foreground">{selectedPkg.passing_twk}</span></div>
                          <div className="flex justify-between"><span>TIU:</span> <span className="text-foreground">{selectedPkg.passing_tiu}</span></div>
                          <div className="flex justify-between"><span>TKP:</span> <span className="text-foreground">{selectedPkg.passing_tkp}</span></div>
                        </div>
                      </div>

                      {/* Kelompok Specific Info */}
                      {selectedPkg.category === 'KELOMPOK' && (
                        <>
                          <div className="bg-muted/40 p-4 rounded-xl border border-border sm:col-span-2">
                            <div className="text-xs text-muted-foreground font-semibold">Jadwal Ujian Aktif</div>
                            <div className="text-xs font-bold mt-1.5 space-y-1 text-muted-foreground">
                              <div className="flex justify-between"><span>Mulai:</span> <span className="text-foreground">{selectedPkg.start_time ? new Date(selectedPkg.start_time).toLocaleString('id-ID') : '-'}</span></div>
                              <div className="flex justify-between"><span>Selesai:</span> <span className="text-foreground">{selectedPkg.end_time ? new Date(selectedPkg.end_time).toLocaleString('id-ID') : '-'}</span></div>
                            </div>
                          </div>

                          <div className="bg-indigo-500/5 dark:bg-indigo-600/10 p-4 rounded-xl border border-indigo-500/25 sm:col-span-2">
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Harga Tiket Pendaftaran</div>
                            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                              {selectedPkg.price && selectedPkg.price > 0 
                                ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedPkg.price) 
                                : 'Gratis'}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Terpisah dari tipe akses akun Premium/Free.</p>
                          </div>
                        </>
                      )}

                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Statistical Allocation Breakdown */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-3 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <Info className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-sm font-bold text-foreground">Alokasi & Keseimbangan Soal (Category x Difficulty)</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Statistik alokasi tingkat kesulitan dan kategori soal yang saat ini dikaitkan dengan paket ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  
                  {/* Stats Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
                    <div className="p-2 border border-border rounded-lg text-center bg-muted/10">
                      <div className="text-[10px] text-muted-foreground font-semibold">TWK</div>
                      <div className="text-base font-bold text-foreground mt-0.5">{stats.twk}</div>
                    </div>
                    <div className="p-2 border border-border rounded-lg text-center bg-muted/10">
                      <div className="text-[10px] text-muted-foreground font-semibold">TIU</div>
                      <div className="text-base font-bold text-foreground mt-0.5">{stats.tiu}</div>
                    </div>
                    <div className="p-2 border border-border rounded-lg text-center bg-muted/10">
                      <div className="text-[10px] text-muted-foreground font-semibold">TKP</div>
                      <div className="text-base font-bold text-foreground mt-0.5">{stats.tkp}</div>
                    </div>
                    
                    <div className="p-2 border border-border rounded-lg text-center bg-muted/10">
                      <div className="text-[10px] text-muted-foreground font-semibold">MUDAH</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.mudah}</div>
                    </div>
                    <div className="p-2 border border-border rounded-lg text-center bg-muted/10">
                      <div className="text-[10px] text-muted-foreground font-semibold">SEDANG</div>
                      <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.sedang}</div>
                    </div>
                    <div className="p-2 border border-border rounded-lg text-center bg-muted/10">
                      <div className="text-[10px] text-muted-foreground font-semibold">SULIT</div>
                      <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stats.sulit}</div>
                    </div>
                  </div>

                  {/* Allocation Matrix Table */}
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted text-muted-foreground uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-3 border-b border-border">Kategori</th>
                          <th className="p-3 border-b border-border text-center text-emerald-600 dark:text-emerald-400">Mudah</th>
                          <th className="p-3 border-b border-border text-center text-amber-600 dark:text-amber-400">Sedang</th>
                          <th className="p-3 border-b border-border text-center text-rose-600 dark:text-rose-400">Sulit</th>
                          <th className="p-3 border-b border-border text-center font-bold text-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="p-3 font-semibold text-foreground">Tes Wawasan Kebangsaan (TWK)</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.twkMudah}</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.twkSedang}</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.twkSulit}</td>
                          <td className="p-3 text-center font-bold text-foreground">{stats.twk}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-foreground">Tes Inteligensia Umum (TIU)</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.tiuMudah}</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.tiuSedang}</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.tiuSulit}</td>
                          <td className="p-3 text-center font-bold text-foreground">{stats.tiu}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-foreground">Tes Karakteristik Pribadi (TKP)</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.tkpMudah}</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.tkpSedang}</td>
                          <td className="p-3 text-center text-muted-foreground">{stats.tkpSulit}</td>
                          <td className="p-3 text-center font-bold text-foreground">{stats.tkp}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </CardContent>
              </Card>

              {/* Questions Association Tabs */}
              {selectedPkg.category === 'MANDIRI' ? (
                <Card className="bg-card border-indigo-500/30 dark:border-indigo-500/20 shadow-sm bg-indigo-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Shuffle className="h-5 w-5 animate-pulse" />
                      <CardTitle className="text-sm font-bold">Pengacak Soal Dinamis Aktif</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-foreground leading-relaxed">
                      Paket tryout ini menggunakan sistem <strong>Acak Soal Dinamis (Opsi B)</strong>. Setiap peserta yang mengeklik tombol <strong>"Mulai Ujian"</strong> akan mendapatkan lembar soal yang dibuat secara acak langsung dari bank soal, berdasarkan kriteria alokasi kesulitan yang telah ditentukan di atas.
                    </p>
                    <div className="bg-background/80 p-4 rounded-xl border border-border space-y-2">
                      <div className="text-xs font-bold text-foreground">Informasi Penyelenggaraan Ujian:</div>
                      <ul className="list-auto pl-4 text-xs text-muted-foreground space-y-1.5">
                        <li><strong>Variasi Soal Mandiri</strong>: Setiap kali peserta memulai sesi baru, soal-soal akan diacak ulang dari bank data (TWK, TIU, TKP) sesuai dengan filter kesulitan Anda.</li>
                        <li><strong>Tanpa Junction Table</strong>: Anda tidak perlu menautkan atau membagi soal secara manual di tabel hubungan untuk paket berkategori MANDIRI.</li>
                        <li><strong>Akses Ujian Aman</strong>: Lembar soal dikunci ke dalam database riwayat jawaban peserta di awal ujian untuk peninjauan pembahasan hasil pasca-ujian yang akurat.</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="associated" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full h-11 bg-muted p-1 rounded-xl">
                    <TabsTrigger value="associated" className="data-active:bg-background h-full rounded-lg font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Soal Terkait ({stats.total})
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="data-active:bg-background h-full rounded-lg font-bold flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" /> Tambah dari Bank Soal
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Associated Questions */}
                  <TabsContent value="associated" className="space-y-4 mt-4">
                    <Card className="bg-card border-border shadow-sm">
                      <CardContent className="p-6">
                        {isRelationsLoading || isQuestionsLoading ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : sortedLinkedQuestions.length > 0 ? (
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 divide-y divide-border">
                            {sortedLinkedQuestions.map((q, index) => (
                              <div key={q.id} className="pt-4 first:pt-0 flex items-start gap-4 justify-between group">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                      No. {index + 1}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                      {q.category}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      q.difficulty === 'MUDAH' 
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                        : q.difficulty === 'SULIT'
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    }`}>
                                      {q.difficulty || 'SEDANG'}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                      (q.type || 'FREE') === 'PREMIUM'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    }`}>
                                      {(q.type || 'FREE') === 'PREMIUM' ? 'Eksklusif' : 'Free'}
                                    </span>
                                    {q.image_url && (
                                      <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                        🖼️ Gambar
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground font-medium line-clamp-3 leading-relaxed whitespace-pre-wrap">
                                    {q.question_text}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUnlinkQuestion(q.id)}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Lepas soal dari paket"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                            <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/60" />
                            <p className="font-medium">Belum ada soal dikaitkan.</p>
                            <p className="text-xs">Gunakan tombol "Acak Soal Otomatis" di atas atau tab "Tambah dari Bank Soal" di sebelah kanan.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab 2: Bank Questions */}
                  <TabsContent value="bank" className="space-y-4 mt-4">
                    <Card className="bg-card border-border shadow-sm">
                      <CardHeader className="pb-3 border-b border-border bg-muted/5 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Cari kata kunci soal..." 
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                            className="pl-9 bg-background border-border h-9"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <select
                            value={questionCategoryFilter}
                            onChange={(e) => setQuestionCategoryFilter(e.target.value)}
                            className="h-9 text-xs rounded-md border border-input bg-card px-2 py-1 outline-none"
                          >
                            <option value="ALL">Semua Kategori</option>
                            <option value="TWK">TWK</option>
                            <option value="TIU">TIU</option>
                            <option value="TKP">TKP</option>
                          </select>
                          <select
                            value={questionDifficultyFilter}
                            onChange={(e) => setQuestionDifficultyFilter(e.target.value)}
                            className="h-9 text-xs rounded-md border border-input bg-card px-2 py-1 outline-none"
                          >
                            <option value="ALL">Semua Kesulitan</option>
                            <option value="MUDAH">MUDAH</option>
                            <option value="SEDANG">SEDANG</option>
                            <option value="SULIT">SULIT</option>
                          </select>
                          <select
                            value={questionTypeFilter}
                            onChange={(e) => setQuestionTypeFilter(e.target.value)}
                            className="h-9 text-xs rounded-md border border-input bg-card px-2 py-1 outline-none"
                          >
                            <option value="ALL">Semua Tipe</option>
                            <option value="FREE">Free</option>
                            <option value="PREMIUM">Eksklusif</option>
                          </select>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        
                        {isQuestionsLoading ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredBankQuestions.length > 0 ? (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 divide-y divide-border">
                            {filteredBankQuestions.map((q) => (
                              <div key={q.id} className="pt-4 first:pt-0 flex items-start gap-4 justify-between">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                      {q.category}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      q.difficulty === 'MUDAH' 
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                        : q.difficulty === 'SULIT'
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    }`}>
                                      {q.difficulty || 'SEDANG'}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                      (q.type || 'FREE') === 'PREMIUM'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    }`}>
                                      {(q.type || 'FREE') === 'PREMIUM' ? 'Eksklusif' : 'Free'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                    {q.question_text}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleLinkQuestion(q.id)}
                                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 font-bold shrink-0 self-center text-xs h-8"
                                >
                                  + Tambah
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                            <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/60" />
                            <p className="font-medium">Tidak ada soal yang cocok.</p>
                            <p className="text-xs">Coba ubah kata kunci pencarian atau matikan filter kategori/kesulitan.</p>
                          </div>
                        )}

                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}

            </div>
          ) : (
            <Card className="bg-card border-dashed border-border py-16 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-sm px-6">
                <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground/80">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-foreground">Belum Ada Paket Dipilih</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pilih salah satu paket tryout dari daftar di sebelah kiri untuk mengatur passing grade, durasi, alokasi soal, atau menambahkan pertanyaan dari bank soal.
                </p>
              </div>
            </Card>
          )}

        </div>

      </div>
    </div>
  );
}

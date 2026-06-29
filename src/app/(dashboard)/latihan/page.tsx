'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Loader2,
  Award,
  BookMarked,
  Timer,
  Sliders,
  Check,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Question } from '@/types';
import MathText from '@/components/MathText';

export default function LatihanSoalPage() {
  const { profile } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<'TWK' | 'TIU' | 'TKP' | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  
  // Results tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

  const searchParams = useSearchParams();

  // States for Customized Drill Mode
  const [activeTab, setActiveTab] = useState<string>('kategori');
  const [isDrillMode, setIsDrillMode] = useState(false);
  const [drillCategories, setDrillCategories] = useState<string[]>(['TWK', 'TIU', 'TKP']);
  const [drillSubCategories, setDrillSubCategories] = useState<string[]>([]);
  const [drillDifficulty, setDrillDifficulty] = useState<'MUDAH' | 'SEDANG' | 'SULIT' | 'ALL'>('ALL');
  const [drillTime, setDrillTime] = useState<number | null>(null); // null = unlimited, otherwise in minutes
  const [drillCount, setDrillCount] = useState<number>(10);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Parse search params for auto configuration
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const categoriesParam = searchParams.get('categories');
    const subCategoriesParam = searchParams.get('subCategories');
    if (tabParam === 'drill') {
      setActiveTab('drill');
      if (categoriesParam) {
        setDrillCategories(categoriesParam.split(','));
      }
      if (subCategoriesParam) {
        setDrillSubCategories(subCategoriesParam.split(','));
      }
    } else if (tabParam === 'kategori') {
      setActiveTab('kategori');
    }
  }, [searchParams]);

  // Fetch questions based on category, sub-category, difficulty, and drill mode
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['latihan-questions', selectedCategory, selectedSubCategory, isDrillMode, drillCategories, drillSubCategories, drillDifficulty, profile?.subscription_status],
    queryFn: async () => {
      if (!selectedCategory && !isDrillMode) return [];
      
      let query = supabase.from('questions').select('*');

      if (isDrillMode) {
        if (drillCategories.length > 0) {
          query = query.in('category', drillCategories);
        }
        if (drillSubCategories.length > 0) {
          query = query.in('sub_category', drillSubCategories);
        }
        if (drillDifficulty !== 'ALL') {
          query = query.eq('difficulty', drillDifficulty);
        }
      } else {
        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }
        if (selectedSubCategory) {
          query = query.eq('sub_category', selectedSubCategory);
        }
      }

      // Enforce FREE questions limit for non-premium users
      if (!profile || profile.subscription_status !== 'PREMIUM') {
        query = query.eq('type', 'FREE');
      }

      const { data, error } = await query.limit(150);

      if (error) throw error;
      return (data || []) as Question[];
    },
    enabled: !!selectedCategory || isDrillMode,
    staleTime: 5 * 1000,
  });

  // Shuffle and pick questions client-side once pool is loaded
  useEffect(() => {
    if (questions && questions.length > 0 && activeQuestions.length === 0 && !isFinished) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const count = isDrillMode ? drillCount : 20;
      setActiveQuestions(shuffled.slice(0, count));
    }
  }, [questions, activeQuestions, isFinished, isDrillMode, drillCount]);

  // Timer effect for drill mode
  useEffect(() => {
    if (!isDrillMode || isFinished || activeQuestions.length === 0 || drillTime === null) return;
    
    if (timeLeft === 0) {
      setTimeLeft(drillTime * 60);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          toast.warning('⏱️ Waktu latihan drill Anda telah habis!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDrillMode, isFinished, activeQuestions.length, drillTime, timeLeft]);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartLatihan = (category: 'TWK' | 'TIU' | 'TKP', subCategory: string | null = null) => {
    setIsDrillMode(false);
    setSelectedCategory(category);
    setSelectedSubCategory(subCategory);
    setActiveQuestions([]); // clear to trigger reshuffle
    setCurrentIndex(0);
    setSelectedOption(null);
    setChecked(false);
    setCorrectCount(0);
    setTotalPoints(0);
    setIsFinished(false);
  };

  const handleStartDrill = () => {
    if (drillCategories.length === 0) {
      toast.error('Harap pilih minimal 1 kategori utama.');
      return;
    }
    setIsDrillMode(true);
    setSelectedCategory(drillCategories[0] as any);
    setSelectedSubCategory(null);
    setActiveQuestions([]); // clear to trigger reshuffle
    setCurrentIndex(0);
    setSelectedOption(null);
    setChecked(false);
    setCorrectCount(0);
    setTotalPoints(0);
    setIsFinished(false);
    setTimeLeft(drillTime ? drillTime * 60 : 0);
  };

  const handleSelectOption = (option: string) => {
    if (checked) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || activeQuestions.length === 0) return;
    
    const activeQuestion = activeQuestions[currentIndex];
    
    if (activeQuestion.category === 'TKP') {
      const points = activeQuestion.scale_points?.[selectedOption] || 0;
      setTotalPoints((prev) => prev + points);
    } else {
      const isCorrect = selectedOption === activeQuestion.correct_option;
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
    }
    
    setChecked(true);
  };

  const handleNext = () => {
    if (activeQuestions.length === 0) return;

    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setChecked(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setIsDrillMode(false);
    setActiveQuestions([]);
    setIsFinished(false);
    setTimeLeft(0);
  };

  // Render Loading
  if ((selectedCategory || isDrillMode) && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm font-medium">Memuat butir pertanyaan...</p>
      </div>
    );
  }

  // Render Error
  if ((selectedCategory || isDrillMode) && error) {
    return (
      <div className="text-center py-12 max-w-sm mx-auto space-y-4">
        <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Gagal Memuat Soal</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">Terjadi kesalahan koneksi ke server database. Silakan coba kembali.</p>
        <Button onClick={handleReset} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl">
          Kembali ke Dashboard Latihan
        </Button>
      </div>
    );
  }

  // Render Finished Screen
  if (isFinished && activeQuestions.length > 0) {
    const hasNonTKP = activeQuestions.some(q => q.category !== 'TKP');
    const hasTKP = activeQuestions.some(q => q.category === 'TKP');
    const nonTKPCount = activeQuestions.filter(q => q.category !== 'TKP').length;
    const accuracy = hasNonTKP && nonTKPCount > 0 ? Math.round((correctCount / nonTKPCount) * 100) : 0;

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card className="bg-card border-border shadow-lg text-center py-8 px-4 sm:px-6 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500" />
          <CardHeader className="space-y-3">
            <div className="mx-auto bg-indigo-500/10 p-4 rounded-full w-fit text-indigo-600 dark:text-indigo-400">
              <Award className="h-14 w-14" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground">Latihan Selesai!</CardTitle>
            <CardDescription className="text-sm">
              {isDrillMode 
                ? `Sesi Latihan Drill (Kustom) berhasil diselesaikan`
                : `Menyelesaikan latihan ${selectedSubCategory ? `sub-topik "${selectedSubCategory}"` : `kategori ${selectedCategory}`}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-3 p-4 bg-muted/20 border border-border/80 rounded-2xl">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Soal</p>
                <p className="text-2xl font-black text-foreground mt-1">{activeQuestions.length}</p>
              </div>
              
              {hasNonTKP ? (
                <>
                  <div className="text-center">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Benar</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{correctCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Salah</p>
                    <p className="text-2xl font-black text-rose-500 mt-1">{nonTKPCount - correctCount}</p>
                  </div>
                </>
              ) : hasTKP ? (
                <div className="col-span-2 text-center">
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Total Skor TKP</p>
                  <p className="text-2xl font-black text-amber-500 mt-1">{totalPoints} Poin</p>
                </div>
              ) : null}
            </div>
            
            {hasNonTKP && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                  <span>AKURASI JAWABAN</span>
                  <span className={accuracy >= 80 ? 'text-emerald-500' : 'text-rose-500'}>{accuracy}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${accuracy >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-3">
            <Button 
              onClick={() => {
                if (isDrillMode) {
                  handleStartDrill();
                } else {
                  selectedCategory && handleStartLatihan(selectedCategory, selectedSubCategory);
                }
              }} 
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-md"
            >
              Ulangi Sesi Latihan
            </Button>
            <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto font-bold border-border h-11 rounded-xl">
              Pilih Kategori Lain
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const SUB_CATEGORIES_MAP = {
    TWK: ['Nasionalisme', 'Integritas', 'Bela Negara', 'Pilar Negara', 'Bahasa Indonesia'],
    TIU: ['Analogi', 'Silogisme', 'Analitis', 'Berhitung', 'Deret', 'Perbandingan', 'Soal Cerita', 'Analogi Figural', 'Ketidaksamaan Figural', 'Serial Figural'],
    TKP: ['Pelayanan Publik', 'Jejaring Kerja', 'Sosial Budaya', 'TIK', 'Profesionalisme', 'Anti Radikalisme']
  };

  // Render Practice Dashboard
  if (!selectedCategory && !isDrillMode) {
    return (
      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <BookMarked className="h-4 w-4" /> Mode Mandiri
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-1 bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">Latihan Soal SKD</h1>
          <p className="text-muted-foreground text-sm max-w-xl">Pilih kategori atau sub-topik kisi-kisi untuk menguji kemampuan Anda dengan pembahasan instan langsung.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-transparent border-0 p-0 w-full sm:w-auto flex flex-wrap sm:flex-nowrap gap-3 h-14">
            <TabsTrigger value="kategori" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-indigo-600 data-active:text-white data-active:border-indigo-600 dark:data-active:bg-indigo-600 dark:data-active:text-white dark:data-active:border-indigo-600 shadow-sm">Kategori Utama</TabsTrigger>
            <TabsTrigger value="subtopik" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-indigo-600 data-active:text-white data-active:border-indigo-600 dark:data-active:bg-indigo-600 dark:data-active:text-white dark:data-active:border-indigo-600 shadow-sm">Sub-Topik Kisi-Kisi</TabsTrigger>
            <TabsTrigger value="drill" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-indigo-600 data-active:text-white data-active:border-indigo-600 dark:data-active:bg-indigo-600 dark:data-active:text-white dark:data-active:border-indigo-600 flex items-center gap-1.5 shadow-sm">
              <Sliders className="h-4 w-4" /> Latihan Drill (Kustom)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kategori" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* TWK Card */}
            <Card className="bg-card border-border hover:border-rose-500/30 hover:shadow-rose-500/[0.02] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative group rounded-2xl">
              <CardHeader className="space-y-4 p-6">
                <div className="bg-rose-500/10 dark:bg-rose-500/20 p-3 rounded-2xl w-fit text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-bold text-foreground">TWK (Wawasan Kebangsaan)</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">Uji pengetahuan pilar negara, nasionalisme, bela negara, integritas, dan bahasa Indonesia.</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="p-6">
                <Button onClick={() => handleStartLatihan('TWK')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-300">
                  Mulai Latihan <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* TIU Card */}
            <Card className="bg-card border-border hover:border-indigo-500/30 hover:shadow-indigo-500/[0.02] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative group rounded-2xl">
              <CardHeader className="space-y-4 p-6">
                <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-3 rounded-2xl w-fit text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-bold text-foreground">TIU (Inteligensia Umum)</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">Latih kemampuan verbal, figural, logika silogisme, analitik, dan perhitungan numerik.</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="p-6">
                <Button onClick={() => handleStartLatihan('TIU')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-300">
                  Mulai Latihan <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* TKP Card */}
            <Card className="bg-card border-border hover:border-emerald-500/30 hover:shadow-emerald-500/[0.02] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative group rounded-2xl">
              <CardHeader className="space-y-4 p-6">
                <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-3 rounded-2xl w-fit text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-bold text-foreground">TKP (Karakteristik Pribadi)</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">Tinjau aspek jejaring kerja, pelayanan publik, profesionalisme, dan kemampuan adaptasi.</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="p-6">
                <Button onClick={() => handleStartLatihan('TKP')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-300">
                  Mulai Latihan <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="subtopik" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* TWK Column */}
            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/60 bg-muted/10">
                <CardTitle className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse" />
                  Wawasan Kebangsaan (TWK)
                </CardTitle>
                <CardDescription className="text-[11px] font-medium">Uji kompetensi 5 materi dasar bela negara.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 p-4 bg-gradient-to-b from-transparent to-rose-500/[0.01]">
                {SUB_CATEGORIES_MAP.TWK.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => handleStartLatihan('TWK', sub)}
                    className="w-full text-left py-3 px-4 rounded-xl border border-border bg-card/60 hover:border-rose-500/40 hover:bg-rose-500/5 hover:translate-x-1 font-bold text-xs transition-all duration-200 flex items-center justify-between group shadow-sm border-l-4 border-l-rose-500"
                  >
                    <span className="text-foreground/90 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{sub}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* TIU Column */}
            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/60 bg-muted/10">
                <CardTitle className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
                  Inteligensia Umum (TIU)
                </CardTitle>
                <CardDescription className="text-[11px] font-medium">Latih 10 sub-materi logika & numerik.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 p-4 bg-gradient-to-b from-transparent to-indigo-500/[0.01]">
                {SUB_CATEGORIES_MAP.TIU.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => handleStartLatihan('TIU', sub)}
                    className="w-full text-left py-3 px-4 rounded-xl border border-border bg-card/60 hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:translate-x-1 font-bold text-xs transition-all duration-200 flex items-center justify-between group shadow-sm border-l-4 border-l-indigo-600"
                  >
                    <span className="text-foreground/90 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{sub}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* TKP Column */}
            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/60 bg-muted/10">
                <CardTitle className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  Karakteristik Pribadi (TKP)
                </CardTitle>
                <CardDescription className="text-[11px] font-medium">Evaluasi 6 aspek kepribadian & kerja sama.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 p-4 bg-gradient-to-b from-transparent to-emerald-500/[0.01]">
                {SUB_CATEGORIES_MAP.TKP.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => handleStartLatihan('TKP', sub)}
                    className="w-full text-left py-3 px-4 rounded-xl border border-border bg-card/60 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:translate-x-1 font-bold text-xs transition-all duration-200 flex items-center justify-between group shadow-sm border-l-4 border-l-emerald-600"
                  >
                    <span className="text-foreground/90 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{sub}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drill" className="mt-6">
            <Card className="bg-card border-border shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/5">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-600" />
                  Konfigurasi Latihan Drill Anda
                </CardTitle>
                <CardDescription className="text-xs">Atur parameter latihan untuk menyesuaikan kemampuan dan persiapan belajar Anda secara fleksibel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                
                {profile?.subscription_status !== 'PREMIUM' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-300 items-start">
                    <span className="shrink-0 text-sm">🔒</span>
                    <div className="space-y-1">
                      <p className="font-extrabold uppercase tracking-wider text-[10px] text-amber-600 dark:text-amber-400">
                        Akses Latihan Terbatas (Akun Free)
                      </p>
                      <p className="leading-relaxed font-medium">
                        Anda saat ini hanya dapat berlatih menggunakan soal-soal **Free**. Aktifkan status **Premium** melalui dashboard untuk membuka ribuan bank soal berkualitas tinggi lainnya.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. Kategori Utama (Card Selectors) */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">1. Pilih Kategori Utama (Bisa pilih lebih dari satu) *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['TWK', 'TIU', 'TKP'].map((cat) => {
                      const isSelected = drillCategories.includes(cat);
                      const catName = cat === 'TWK' ? 'Wawasan Kebangsaan' : cat === 'TIU' ? 'Inteligensia Umum' : 'Karakteristik Pribadi';
                      const colorClass = cat === 'TWK' 
                        ? (isSelected ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'border-border bg-card/60 text-muted-foreground')
                        : cat === 'TIU'
                        ? (isSelected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-border bg-card/60 text-muted-foreground')
                        : (isSelected ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-border bg-card/60 text-muted-foreground');
                      
                      const Icon = cat === 'TWK' ? BookOpen : cat === 'TIU' ? HelpCircle : Award;

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (drillCategories.length > 1) {
                                setDrillCategories(drillCategories.filter(c => c !== cat));
                                const subsToRemove = SUB_CATEGORIES_MAP[cat as 'TWK' | 'TIU' | 'TKP'] || [];
                                setDrillSubCategories(drillSubCategories.filter(s => !subsToRemove.includes(s)));
                              } else {
                                toast.error('Pilih minimal 1 kategori utama.');
                              }
                            } else {
                              setDrillCategories([...drillCategories, cat]);
                            }
                          }}
                          className={`p-4 rounded-xl border flex items-center justify-between font-bold text-xs transition-all duration-200 shadow-sm cursor-pointer hover:scale-[1.01] ${colorClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 shrink-0" />
                            <div className="text-left">
                              <p className="text-foreground font-black">{cat}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{catName}</p>
                            </div>
                          </div>
                          <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-indigo-600 text-white border-transparent' : 'border-border'
                          }`}>
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Sub-Topik Kisi-Kisi */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">2. Pilih Sub-Topik Kisi-Kisi (Opsional)</Label>
                    {drillSubCategories.length > 0 && (
                      <button 
                        onClick={() => setDrillSubCategories([])} 
                        className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase"
                      >
                        Reset Pilihan
                      </button>
                    )}
                  </div>
                  <div className="border border-border bg-muted/10 rounded-2xl p-4 space-y-4 max-h-60 overflow-y-auto">
                    {drillCategories.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Harap pilih kategori utama terlebih dahulu untuk menampilkan sub-topik.</p>
                    ) : (
                      drillCategories.map((cat) => {
                        const subs = SUB_CATEGORIES_MAP[cat as 'TWK' | 'TIU' | 'TKP'] || [];
                        return (
                          <div key={cat} className="space-y-2">
                            <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{cat}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {subs.map((sub) => {
                                const isSubSelected = drillSubCategories.includes(sub);
                                const checkBorderClass = cat === 'TWK' ? 'border-rose-500' : cat === 'TIU' ? 'border-indigo-500' : 'border-emerald-500';
                                const checkBgClass = cat === 'TWK' ? 'bg-rose-600' : cat === 'TIU' ? 'bg-indigo-600' : 'bg-emerald-600';
                                
                                return (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => {
                                      if (isSubSelected) {
                                        setDrillSubCategories(drillSubCategories.filter(s => s !== sub));
                                      } else {
                                        setDrillSubCategories([...drillSubCategories, sub]);
                                      }
                                    }}
                                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition-all ${
                                      isSubSelected 
                                        ? `bg-muted/60 ${checkBorderClass} font-bold text-foreground` 
                                        : 'border-border/50 bg-card/40 hover:bg-muted/40 font-semibold text-muted-foreground'
                                    }`}
                                  >
                                    <div className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all ${
                                      isSubSelected ? `${checkBgClass} text-white border-transparent` : 'border-border'
                                    }`}>
                                      {isSubSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                    </div>
                                    <span className="truncate">{sub}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">*Kosongkan jika ingin menyertakan seluruh sub-topik secara acak.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">3. Tingkat Kesulitan</Label>
                    <select 
                      value={drillDifficulty}
                      onChange={(e) => setDrillDifficulty(e.target.value as any)}
                      className="w-full h-11 rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-foreground cursor-pointer font-bold"
                    >
                      <option value="ALL">Semua Kesulitan</option>
                      <option value="MUDAH">MUDAH</option>
                      <option value="SEDANG">SEDANG</option>
                      <option value="SULIT">SULIT</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">4. Batas Waktu</Label>
                    <select 
                      value={drillTime === null ? 'unlimited' : drillTime.toString()}
                      onChange={(e) => setDrillTime(e.target.value === 'unlimited' ? null : Number(e.target.value))}
                      className="w-full h-11 rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-foreground cursor-pointer font-bold"
                    >
                      <option value="unlimited">Tanpa Batas Waktu</option>
                      <option value="10">10 Menit</option>
                      <option value="15">15 Menit</option>
                      <option value="20">20 Menit</option>
                      <option value="30">30 Menit</option>
                      <option value="45">45 Menit</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">5. Jumlah Soal</Label>
                    <select 
                      value={drillCount.toString()}
                      onChange={(e) => setDrillCount(Number(e.target.value))}
                      className="w-full h-11 rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-foreground cursor-pointer font-bold"
                    >
                      <option value="5">5 Soal</option>
                      <option value="10">10 Soal</option>
                      <option value="15">15 Soal</option>
                      <option value="20">20 Soal</option>
                      <option value="30">30 Soal</option>
                      <option value="50">50 Soal</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-4 border-t border-border/60 bg-muted/5 flex justify-end">
                <Button onClick={handleStartDrill} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 rounded-xl shadow-md flex items-center justify-center gap-2">
                  Mulai Drill Mandiri <ChevronRight className="h-4.5 w-4.5" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Render Practice Session
  const currentQuestion = activeQuestions?.[currentIndex];

  if (selectedCategory && activeQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm font-medium">Mempersiapkan butir pertanyaan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4">
        <button 
          onClick={handleReset} 
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-bold"
        >
          <ChevronLeft className="h-4.5 w-4.5" /> Batalkan Sesi
        </button>

        {isDrillMode && drillTime !== null && (
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-full animate-pulse">
            <Timer className="h-4 w-4" /> {formatTimeLeft(timeLeft)}
          </div>
        )}

        <div className="flex gap-2">
          {currentQuestion?.difficulty && (
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
              currentQuestion.difficulty === 'MUDAH'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : currentQuestion.difficulty === 'SULIT'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}>
              {currentQuestion.difficulty}
            </span>
          )}
          <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
            {currentQuestion?.category}
          </span>
        </div>
      </div>

      {activeQuestions && activeQuestions.length > 0 && currentQuestion ? (
        <div className="space-y-6">
          {/* Question Card */}
          <Card className="bg-card border-border shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground tracking-wider">
                <span>PERTANYAAN</span>
                <span>{currentIndex + 1} DARI {activeQuestions.length}</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Text */}
              <div className="text-base text-foreground leading-relaxed font-semibold">
                <MathText text={currentQuestion.question_text} />
              </div>

              {currentQuestion.image_url && (
                <div className="mt-3 border border-border rounded-xl overflow-hidden max-h-80 w-full bg-muted/30 flex items-center justify-center p-2">
                  <img src={currentQuestion.image_url} alt="Soal Bergambar" className="max-h-72 object-contain rounded-lg" />
                </div>
              )}

              {/* Options Grid */}
              <div className="space-y-3">
                {[
                  { key: 'A', text: currentQuestion.option_a, imageUrl: currentQuestion.option_a_image_url },
                  { key: 'B', text: currentQuestion.option_b, imageUrl: currentQuestion.option_b_image_url },
                  { key: 'C', text: currentQuestion.option_c, imageUrl: currentQuestion.option_c_image_url },
                  { key: 'D', text: currentQuestion.option_d, imageUrl: currentQuestion.option_d_image_url },
                  { key: 'E', text: currentQuestion.option_e, imageUrl: currentQuestion.option_e_image_url },
                ].map((opt) => {
                  const isSelected = selectedOption === opt.key;
                  const isCorrectAnswer = opt.key === currentQuestion.correct_option;
                  
                  let optionStyles = 'border-border bg-card text-foreground hover:bg-muted/30';
                  
                  if (isSelected) {
                    if (checked) {
                      if (selectedCategory === 'TKP') {
                        optionStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300';
                      } else {
                        optionStyles = isCorrectAnswer 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300';
                      }
                    } else {
                      optionStyles = 'border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
                    }
                  } else if (checked && isCorrectAnswer && selectedCategory !== 'TKP') {
                    optionStyles = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-300';
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all duration-200 flex items-start gap-3 leading-relaxed ${optionStyles}`}
                      disabled={checked}
                    >
                      <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-transparent' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {opt.key}
                      </span>
                      <span className="flex-1 flex flex-col gap-2">
                        <span><MathText text={opt.text} /></span>
                        {opt.imageUrl && (
                          <span className="border border-border rounded-lg overflow-hidden max-h-48 w-fit bg-muted flex items-center justify-center p-1">
                            <img src={opt.imageUrl} alt={`Pilihan ${opt.key}`} className="max-h-40 object-contain rounded" />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Explanation Box */}
              {checked && (
                <div className={`mt-6 p-4 rounded-xl border border-l-4 ${
                  selectedCategory === 'TKP'
                    ? 'border-l-emerald-500 border-border bg-emerald-500/[0.02]'
                    : selectedOption === currentQuestion.correct_option
                      ? 'border-l-emerald-500 border-border bg-emerald-500/[0.02]'
                      : 'border-l-rose-500 border-border bg-rose-500/[0.02]'
                }`}>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
                    {selectedCategory === 'TKP' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Detail Perolehan Poin
                      </>
                    ) : selectedOption === currentQuestion.correct_option ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Jawaban Anda Benar!
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-rose-500" />
                        Jawaban Anda Salah (Kunci: {currentQuestion.correct_option})
                      </>
                    )}
                  </h4>
                  {selectedCategory === 'TKP' && (
                    <div className="bg-muted/50 p-2.5 rounded-lg border border-border mb-3 text-xs font-semibold text-foreground">
                      Opsi yang Anda pilih bernilai **{currentQuestion.scale_points?.[selectedOption || ''] || 0}** poin dari skala 1-5.
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground block mb-1 text-xs">Pembahasan Soal:</span>
                    <MathText text={currentQuestion.explanation || 'Tidak ada pembahasan tertulis untuk soal ini.'} />
                  </div>

                  {currentQuestion.explanation_image_url && (
                    <div className="mt-3 border border-border rounded-xl overflow-hidden max-h-60 w-full bg-muted/30 flex items-center justify-center p-2">
                      <img src={currentQuestion.explanation_image_url} alt="Gambar Pembahasan" className="max-h-52 object-contain rounded-lg" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 bg-muted/10 p-6">
              {!checked ? (
                <Button 
                  onClick={handleCheckAnswer}
                  disabled={!selectedOption}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-md"
                >
                  Cek Jawaban
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {currentIndex < activeQuestions.length - 1 ? (
                    <>
                      Soal Selanjutnya <ChevronRight className="h-4.5 w-4.5" />
                    </>
                  ) : (
                    'Selesai Latihan'
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card className="bg-card border-border shadow-sm text-center py-12">
          <CardContent>
            <HelpCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Pertanyaan Belum Tersedia</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Belum ada data pertanyaan latihan untuk kategori {selectedCategory} di database.
            </p>
            <Button onClick={handleReset} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 rounded-lg shadow-sm">
              Pilih Kategori Lain
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

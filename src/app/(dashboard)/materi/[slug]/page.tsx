'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  Trophy, 
  XCircle, 
  Play, 
  ChevronRight,
  RefreshCw,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Material, UserMaterialProgress, Question } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import MathText from '@/components/MathText';

// Fallbacks matching database.sql seed
const fallbackMaterialsMap: Record<string, Material> = {
  'pilar-negara-pancasila': {
    id: 'a11d2c25-c1b1-44c5-aeb9-72bff9499711',
    title: 'Materi Pilar Negara: Pancasila',
    slug: 'pilar-negara-pancasila',
    category: 'TWK',
    content: `### Pengantar Pancasila

Pancasila sebagai dasar negara dan pandangan hidup bangsa Indonesia memiliki nilai-nilai luhur yang wajib diimplementasikan. Nilai-nilai tersebut terbagi menjadi 5 sila:

1. **Ketuhanan Yang Maha Esa** (Religiusitas, toleransi antar umat beragama).
2. **Kemanusiaan yang Adil dan Beradab** (Tenggang rasa, hak asasi manusia, memperlakukan orang lain dengan setara).
3. **Persatuan Indonesia** (Cinta tanah air, bela negara, mengutamakan kepentingan bangsa).
4. **Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan** (Musyawarah mufakat, menghargai pendapat orang lain).
5. **Keadilan Sosial bagi Seluruh Rakyat Indonesia** (Keseimbangan hak dan kewajiban, gotong royong, menghargai karya orang lain).

### Butir-Butir Pengamalan Pancasila
Penting bagi calon pegawai negeri sipil untuk memahami bagaimana sila-sila tersebut diaplikasikan dalam kehidupan sehari-hari dan tugas kedinasan.

*   **Sila Pertama**: Menjamin kemerdekaan beribadah sesuai kepercayaan dan tidak memaksakan agama kepada orang lain.
*   **Sila Kedua**: Mengembangkan sikap saling mencintai sesama manusia dan melakukan kegiatan kemanusiaan.
*   **Sila Ketiga**: Memelihara ketertiban dunia berdasarkan kemerdekaan, perdamaian abadi, dan keadilan sosial.
*   **Sila Keempat**: Tidak boleh memaksakan kehendak kepada orang lain dan mengutamakan musyawarah.
*   **Sila Kelima**: Menjaga keseimbangan antara hak dan kewajiban serta menghormati hak orang lain.

### Contoh Kasus Soal TWK:
Seseorang yang menolak merawat fasilitas umum yang dibiayai bersama melanggar pengamalan Pancasila sila ke-5 karena sila ke-5 mengajarkan kita untuk menghargai usaha bersama dan menjaga keseimbangan hak atas fasilitas publik serta kewajiban merawatnya.`,
    created_at: new Date().toISOString(),
  },
  'tiu-analogi-silogisme': {
    id: 'a11d2c25-c1b1-44c5-aeb9-72bff9499712',
    title: 'Materi TIU: Analogi & Silogisme',
    slug: 'tiu-analogi-silogisme',
    category: 'TIU',
    content: `### Pengambilan Kesimpulan (Silogisme)

Silogisme adalah penarikan kesimpulan secara deduktif dari premis-premis yang ada.

*   **Modus Ponens** (Kaidah Pengasingan):
    *   Premis 1: P → Q
    *   Premis 2: P
    *   Kesimpulan: Q
    *   *Contoh*: Jika hari hujan, maka jalan basah. Hari hujan. Maka, jalan basah.

*   **Modus Tollens** (Kaidah Penolakan):
    *   Premis 1: P → Q
    *   Premis 2: ~Q
    *   Kesimpulan: ~P
    *   *Contoh*: Jika hari hujan, maka jalan basah. Jalan tidak basah. Maka, hari tidak hujan.

*   **Silogisme Hipotetis**:
    *   Premis 1: P → Q
    *   Premis 2: Q → R
    *   Kesimpulan: P → R
    *   *Contoh*: Jika saya belajar, saya lulus. Jika saya lulus, saya senang. Maka, jika saya belajar, saya senang.

### Trik Ujian TIU Silogisme:
1. Perhatikan kata kuantor seperti **Semua/Setiap** (Universal) dan **Sebagian/Beberapa/Ada/Sementara** (Partikular).
2. Jika salah satu premis bersifat partikular (sebagian), maka kesimpulan **wajib** bersifat partikular (sebagian).
3. Jika salah satu premis bersifat negatif (tidak/bukan), maka kesimpulan **wajib** bersifat negatif.`,
    created_at: new Date().toISOString(),
  },
};

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { profile } = useAuthStore();

  // Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({}); // Maps: questionIndex -> selectedOption ('A' | 'B' | ...)
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch material details
  const { data: material, isLoading: isMatLoading } = useQuery<Material | null>({
    queryKey: ['material', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) {
        return fallbackMaterialsMap[slug] || null;
      }
      return data;
    },
  });

  const activeMaterial = material || fallbackMaterialsMap[slug];

  // Fetch user reading and quiz progress for this material
  const { data: progress, isLoading: isProgLoading, refetch: refetchProgress } = useQuery<UserMaterialProgress | null>({
    queryKey: ['material-progress', profile?.id, activeMaterial?.id],
    queryFn: async () => {
      if (!profile?.id || !activeMaterial?.id) return null;
      try {
        const { data, error } = await supabase
          .from('user_material_progress')
          .select('*')
          .eq('user_id', profile.id)
          .eq('material_id', activeMaterial.id)
          .maybeSingle();
        
        if (error) throw error;
        return data as UserMaterialProgress;
      } catch (err) {
        console.error('Error fetching progress:', err);
        return null;
      }
    },
    enabled: !!profile?.id && !!activeMaterial?.id
  });

  // Pull 5 questions for this module
  const loadQuizQuestions = async () => {
    if (!activeMaterial) return;
    setIsSaving(true);
    try {
      // 1. Try querying questions linked to this material
      const { data: directQuestions } = await supabase
        .from('questions')
        .select('*')
        .eq('material_id', activeMaterial.id)
        .limit(10);
      
      let list = directQuestions || [];

      // 2. Fallback to general category / sub_category if empty
      if (list.length < 5) {
        const { data: categoryQuestions } = await supabase
          .from('questions')
          .select('*')
          .eq('category', activeMaterial.category)
          .limit(30);
        
        if (categoryQuestions && categoryQuestions.length > 0) {
          const existingIds = new Set(list.map(q => q.id));
          const extra = categoryQuestions.filter(q => !existingIds.has(q.id));
          const shuffledExtra = extra.sort(() => Math.random() - 0.5);
          list = [...list, ...shuffledExtra].slice(0, 5);
        }
      }

      // 3. Fallback client mock questions if DB fails or is completely empty
      if (list.length === 0) {
        list = [
          {
            id: 'mock-1',
            question_text: `Manakah sikap yang mencerminkan pemahaman materi tentang "${activeMaterial.title}" di lingkungan masyarakat kedinasan?`,
            category: activeMaterial.category as any,
            option_a: 'Menjunjung tinggi profesionalitas dan menghargai keberagaman.',
            option_b: 'Mengabaikan instruksi and bertindak semaunya sendiri.',
            option_c: 'Mengutamakan kepentingan pribadi di atas tugas negara.',
            option_d: 'Membagikan rahasia jabatan kepada masyarakat umum.',
            option_e: 'Menolak kerja sama dengan rekan kerja dari luar daerah.',
            correct_option: 'A',
            scale_points: null,
            explanation: 'Sikap profesional dan menghargai keberagaman adalah dasar pemahaman modul pembelajaran SKD.',
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-2',
            question_text: `Apa tujuan utama mempelajari butir kisi-kisi modul "${activeMaterial.title}" bagi calon Aparatur Sipil Negara?`,
            category: activeMaterial.category as any,
            option_a: 'Hanya untuk lulus ujian tertulis tanpa implementasi.',
            option_b: 'Membentuk karakter pelayanan publik yang berintegritas tinggi.',
            option_c: 'Mencari celah regulasi untuk kepentingan tertentu.',
            option_d: 'Mempercepat pengerjaan administrasi secara asal-asalan.',
            option_e: 'Memperoleh fasilitas premium kedinasan tanpa syarat.',
            correct_option: 'B',
            scale_points: null,
            explanation: 'Modul SKD didesain untuk menyaring pegawai dengan integritas dan semangat pelayanan prima.',
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-3',
            question_text: `Bagaimana langkah penyelesaian masalah yang paling dianjurkan sesuai bahasan materi kualifikasi modul ini?`,
            category: activeMaterial.category as any,
            option_a: 'Menunggu orang lain menyelesaikan masalah.',
            option_b: 'Mengedepankan musyawarah mufakat dan analisis data.',
            option_c: 'Melakukan protes keras tanpa memberikan opsi solusi.',
            option_d: 'Membatalkan seluruh kegiatan yang sedang berlangsung.',
            option_e: 'Menyalahkan rekan satu tim atas kendala teknis.',
            correct_option: 'B',
            scale_points: null,
            explanation: 'Musyawarah serta analisis objektif adalah pondasi penyelesaian masalah kedinasan yang baik.',
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-4',
            question_text: `Di bawah ini yang merupakan tindakan tidak sesuai dengan pilar tata kelola modul "${activeMaterial.title}" adalah...`,
            category: activeMaterial.category as any,
            option_a: 'Melayani masyarakat secara ramah dan responsif.',
            option_b: 'Menggunakan fasilitas kantor untuk kepentingan bisnis pribadi.',
            option_c: 'Menjaga kerahasiaan data penting negara.',
            option_d: 'Mengikuti pelatihan peningkatan kompetensi berkala.',
            option_e: 'Menjaga toleransi antar rekan kerja beda agama.',
            correct_option: 'B',
            scale_points: null,
            explanation: 'Menggunakan fasilitas negara demi kepentingan bisnis pribadi melanggar asas integritas ASN.',
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-5',
            question_text: `Implementasi yang paling tepat dari nilai integritas sesuai modul pembelajaran ini adalah...`,
            category: activeMaterial.category as any,
            option_a: 'Konsisten melakukan kebenaran meskipun tidak ada yang mengawasi.',
            option_b: 'Bekerja keras hanya saat ada penilaian dari pimpinan saja.',
            option_c: 'Menerima hadiah kecil dari pihak luar sebagai tanda ucapan terima kasih.',
            option_d: 'Menunda pekerjaan karena merasa gaji kurang mencukupi.',
            option_e: 'Membiarkan rekan kerja melanggar aturan dinas.',
            correct_option: 'A',
            scale_points: null,
            explanation: 'Integritas berarti konsistensi antara keyakinan, ucapan, dan perilaku benar tanpa bergantung pengawasan.',
            created_at: new Date().toISOString()
          }
        ];
      } else if (list.length < 5) {
        while (list.length < 5) {
          list.push({ ...list[Math.floor(Math.random() * list.length)], id: `dup-${Math.random()}` });
        }
      } else {
        list = list.sort(() => Math.random() - 0.5).slice(0, 5);
      }

      setQuizQuestions(list);
      setQuizCurrentIndex(0);
      setQuizAnswers({});
      setQuizCorrectCount(0);
      setQuizFinished(false);
      setShowQuiz(true);
    } catch (err: any) {
      toast.error('Gagal mengambil soal kuis: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsRead = async () => {
    // Simply trigger the quiz. Module progress is only set to completed when they get 5/5 score.
    await loadQuizQuestions();
  };

  const handleSelectOption = (option: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [quizCurrentIndex]: option
    }));
  };

  const handleNextQuestion = () => {
    if (quizCurrentIndex < quizQuestions.length - 1) {
      setQuizCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    if (!profile?.id || !activeMaterial?.id || quizQuestions.length === 0) return;
    setIsSaving(true);
    
    // Calculate total score at the end of the quiz
    let correctCount = 0;
    quizQuestions.forEach((q, index) => {
      if (quizAnswers[index] === q.correct_option) {
        correctCount++;
      }
    });

    setQuizCorrectCount(correctCount);

    const isAllCorrect = correctCount === 5;

    try {
      const { error } = await supabase
        .from('user_material_progress')
        .upsert({
          user_id: profile.id,
          material_id: activeMaterial.id,
          is_completed: isAllCorrect, // Completed ONLY when 5/5 score
          quiz_completed: true,
          quiz_score: correctCount,
          completed_at: isAllCorrect ? new Date().toISOString() : null
        }, {
          onConflict: 'user_id,material_id'
        });
      
      if (error) throw error;
      
      setQuizFinished(true);
      refetchProgress();
      
      if (isAllCorrect) {
        toast.success(`🎉 Selamat! Anda menjawab 5/5 dengan benar. Modul dinyatakan Selesai.`);
      } else {
        toast.error(`❌ Skor Anda: ${correctCount}/5. Modul belum selesai, silakan coba lagi.`);
      }
    } catch (err: any) {
      toast.error('Gagal menyimpan hasil kuis: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExitQuiz = () => {
    setShowQuiz(false);
    setQuizFinished(false);
  };

  const isLoading = isMatLoading || isProgLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm">Memuat materi belajar...</p>
      </div>
    );
  }

  if (!activeMaterial) {
    return (
      <div className="space-y-6 text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Materi tidak ditemukan</h2>
        <p className="text-muted-foreground">Materi yang Anda cari mungkin telah dipindahkan atau dihapus.</p>
        <Button onClick={() => router.push('/materi')} className="bg-indigo-600 text-white font-semibold shadow-sm rounded-xl">
          Kembali ke Materi
        </Button>
      </div>
    );
  }

  const categoryColor = activeMaterial.category === 'TWK' 
    ? 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/10'
    : activeMaterial.category === 'TIU'
      ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/10'
      : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10';

  const hasAnsweredCurrent = quizAnswers[quizCurrentIndex] !== undefined;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back to list */}
      <Button 
        variant="ghost" 
        onClick={() => {
          if (showQuiz) {
            handleExitQuiz();
          } else {
            router.push('/materi');
          }
        }}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-0 hover:bg-transparent font-bold"
      >
        <ArrowLeft className="h-4 w-4" /> {showQuiz ? 'Kembali ke Materi Detail' : 'Kembali ke Daftar Materi'}
      </Button>

      {/* Main Material Detail (hidden when active quiz is running) */}
      {!showQuiz ? (
        <>
          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${categoryColor}`}>
                {activeMaterial.category}
              </span>
              {progress?.is_completed && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Selesai Dibaca & Kuis Lulus
                </span>
              )}
              {progress?.quiz_completed && !progress?.is_completed && (
                <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  <AlertCircle className="h-3.5 w-3.5" /> Kuis Gagal ({progress.quiz_score}/5)
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {activeMaterial.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" /> Estimasi membaca: 5-10 menit
              </span>
            </div>
          </div>

          {/* Content Card */}
          <Card className="bg-card border-border overflow-hidden shadow-sm mt-6 rounded-2xl">
            <CardContent className="p-6 sm:p-10 text-foreground leading-relaxed">
              <MarkdownRenderer text={activeMaterial.content} className="space-y-6" />
            </CardContent>
          </Card>

          {/* Progress Action Bottom Tray */}
          {profile?.id && (
            <Card className="bg-gradient-to-r from-indigo-500/[0.03] to-transparent border border-border mt-8 rounded-2xl overflow-hidden shadow-md">
              <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-5">
                <div className="space-y-1 text-center md:text-left">
                  {progress?.is_completed ? (
                    <>
                      <h4 className="text-base font-black text-foreground flex items-center justify-center md:justify-start gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" /> Modul ini telah Selesai
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        Anda telah berhasil menjawab 5/5 soal dengan benar pada kuis evaluasi.
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-base font-black text-foreground">
                        {progress?.quiz_completed ? 'Modul Belum Selesai (Kuis Gagal)' : 'Selesai membaca materi ini?'}
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        {progress?.quiz_completed 
                          ? `Skor kuis terakhir Anda: ${progress.quiz_score}/5. Kerjakan kuis kembali dan dapatkan 5/5 benar untuk menyelesaikan modul.`
                          : 'Kerjakan kuis evaluasi 5 soal modul dan dapatkan skor sempurna (5/5 benar) untuk menyelesaikan modul.'
                        }
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
                  {progress?.is_completed ? (
                    <Button 
                      onClick={loadQuizQuestions} 
                      disabled={isSaving}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RefreshCw className="h-4 w-4" /> Ulangi Kuis Modul
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleMarkAsRead} 
                      disabled={isSaving}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" /> Memuat...
                        </>
                      ) : (
                        <>
                          {progress?.quiz_completed ? 'Ulangi Kuis Modul' : 'Mulai Kuis Modul'} <Play className="h-4 w-4 fill-current" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* QUIZ MODULE COMPONENT INLINE */
        <div className="space-y-6">
          <div className="border-b border-border pb-5">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Evaluasi Pembelajaran Modul
            </span>
            <h2 className="text-2xl font-black text-foreground mt-2">{activeMaterial.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">Uji pemahaman konsep Anda dengan 5 soal kuis pilihan ganda berikut.</p>
          </div>

          {!quizFinished ? (
            quizQuestions.length > 0 && quizQuestions[quizCurrentIndex] && (
              <Card className="bg-card border-border shadow-md rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground tracking-wider">
                    <span>SOAL EVALUASI</span>
                    <span>{quizCurrentIndex + 1} DARI {quizQuestions.length}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${((quizCurrentIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-6 pt-2">
                  {/* Question text */}
                  <div className="text-base text-foreground leading-relaxed font-semibold">
                    <MathText text={quizQuestions[quizCurrentIndex].question_text} />
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {[
                      { key: 'A', text: quizQuestions[quizCurrentIndex].option_a },
                      { key: 'B', text: quizQuestions[quizCurrentIndex].option_b },
                      { key: 'C', text: quizQuestions[quizCurrentIndex].option_c },
                      { key: 'D', text: quizQuestions[quizCurrentIndex].option_d },
                      { key: 'E', text: quizQuestions[quizCurrentIndex].option_e },
                    ].map((opt) => {
                      const isSelected = quizAnswers[quizCurrentIndex] === opt.key;
                      
                      let optionStyles = 'border-border bg-card text-foreground hover:bg-muted/30';
                      
                      if (isSelected) {
                        optionStyles = 'border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectOption(opt.key)}
                          className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all duration-200 flex items-start gap-3 leading-relaxed ${optionStyles}`}
                        >
                          <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-transparent' 
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="flex-1"><MathText text={opt.text} /></span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-4 border-t border-border/60 bg-muted/10 flex justify-end">
                  <Button 
                    onClick={handleNextQuestion}
                    disabled={!hasAnsweredCurrent || isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      'Menyimpan...'
                    ) : quizCurrentIndex < quizQuestions.length - 1 ? (
                      <>
                        Soal Selanjutnya <ChevronRight className="h-4.5 w-4.5" />
                      </>
                    ) : (
                      'Selesaikan Kuis'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          ) : (
            /* QUIZ END SCORE SUMMARY */
            <div className="space-y-8">
              {quizCorrectCount === 5 ? (
                /* 5/5 PERFECT SCORE - PASSED Completion Card */
                <Card className="bg-card border-border shadow-lg text-center py-10 px-6 rounded-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                  <CardContent className="space-y-6 pt-4">
                    <div className="mx-auto bg-emerald-500/10 p-4 rounded-full w-fit text-emerald-600 dark:text-emerald-400">
                      <Trophy className="h-12 w-12 animate-bounce" />
                    </div>
                    <div className="space-y-1.5">
                      <CardTitle className="text-2xl font-black text-foreground">Modul Selesai!</CardTitle>
                      <CardDescription className="text-sm">Selamat, Anda lulus kuis evaluasi dengan skor sempurna.</CardDescription>
                    </div>

                    <div className="max-w-xs mx-auto p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider">Hasil Kuis</p>
                      <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2">5 / 5</p>
                      <p className="text-xs font-bold text-foreground/80 mt-1">Semua Jawaban Benar</p>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                      Luar biasa! Pemahaman Anda terhadap materi ini sangat sempurna. Modul ini sekarang resmi ditandai sebagai selesai.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button 
                      onClick={handleExitQuiz}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-md"
                    >
                      Kembali ke Modul Belajar
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                /* INCOMPLETE SCORE (<5/5) - FAILED Card */
                <Card className="bg-card border-border shadow-lg text-center py-10 px-6 rounded-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
                  <CardContent className="space-y-6 pt-4">
                    <div className="mx-auto bg-rose-500/10 p-4 rounded-full w-fit text-rose-600 dark:text-rose-400">
                      <XCircle className="h-12 w-12" />
                    </div>
                    <div className="space-y-1.5">
                      <CardTitle className="text-2xl font-black text-foreground">Modul Belum Selesai</CardTitle>
                      <CardDescription className="text-sm">Anda harus menjawab semua soal dengan benar (5/5) untuk menyelesaikan modul ini.</CardDescription>
                    </div>

                    <div className="max-w-xs mx-auto p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-wider">Hasil Kuis</p>
                      <p className="text-4xl font-black text-rose-600 dark:text-rose-400 mt-2">{quizCorrectCount} / 5</p>
                      <p className="text-xs font-bold text-foreground/80 mt-1">Jawaban Benar</p>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                      Silakan baca kembali materi modul ini secara saksama, lalu ulangi kuis sampai mendapatkan jawaban yang benar semua.
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button 
                      onClick={handleExitQuiz}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-md"
                    >
                      Baca Ulang Materi
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={loadQuizQuestions}
                      className="w-full sm:w-auto font-bold border-border h-11 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="h-4 w-4" /> Coba Kuis Lagi
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

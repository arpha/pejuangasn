'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  Info, 
  Loader2, 
  XCircle,
  Award,
  TrendingUp,
  Compass
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MathText from '@/components/MathText';
import { ExamAttempt, Question, UserAnswer } from '@/types';

// Fallback attempt result
const fallbackAttempt: ExamAttempt = {
  id: 'mock-attempt',
  user_id: 'mock-user',
  exam_id: 'b11d2c25-c1b1-44c5-aeb9-72bff9499701',
  status: 'COMPLETED',
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  score_twk: 10,
  score_tiu: 10,
  score_tkp: 10,
  score_total: 30,
  is_passed: false,
  created_at: new Date().toISOString(),
};

const fallbackQuestions: Question[] = [
  {
    id: 'c11d2c25-c1b1-44c5-aeb9-72bff9499721',
    question_text: 'Sikap menghormati keputusan musyawarah meskipun bertentangan dengan pendapat pribadi merupakan pengamalan Pancasila sila ke...',
    category: 'TWK',
    option_a: 'Ke-1',
    option_b: 'Ke-2',
    option_c: 'Ke-3',
    option_d: 'Ke-4',
    option_e: 'Ke-5',
    correct_option: 'D',
    scale_points: null,
    explanation: 'Menghormati hasil musyawarah adalah wujud pengamalan sila ke-4 (Kerakyatan yang dipimpin oleh hikmat kebijaksanaan...)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c11d2c25-c1b1-44c5-aeb9-72bff9499722',
    question_text: 'BPUPKI dibentuk pada tanggal 1 Maret 1945 oleh Jenderal Kumakichi Harada. Tugas utama badan ini adalah...',
    category: 'TWK',
    option_a: 'Merumuskan naskah proklamasi',
    option_b: 'Menyusun dasar negara dan rancangan UUD',
    option_c: 'Membentuk kabinet pemerintahan',
    option_d: 'Memilih Presiden dan Wakil Presiden',
    option_e: 'Melakukan perlawanan gerilya',
    correct_option: 'B',
    scale_points: null,
    explanation: 'Tugas utama BPUPKI adalah menyelidiki dan menyusun persiapan kemerdekaan Indonesia termasuk merumuskan dasar negara dan UUD.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c11d2c25-c1b1-44c5-aeb9-72bff9499723',
    question_text: 'Semua mahasiswa adalah pembaca buku. Sebagian pembaca buku memakai kacamata. Kesimpulan yang tepat adalah...',
    category: 'TIU',
    option_a: 'Semua mahasiswa memakai kacamata',
    option_b: 'Sebagian mahasiswa memakai kacamata',
    option_c: 'Semua pemakai kacamata adalah mahasiswa',
    option_d: 'Sebagian pembaca buku bukan mahasiswa',
    option_e: 'Tidak dapat disimpulkan secara mutlak',
    correct_option: 'E',
    scale_points: null,
    explanation: 'Karena premis kedua berbunyi "Sebagian pembaca buku memakai kacamata", kita tidak dapat memastikan apakah mahasiswa (yang merupakan pembaca buku) termasuk bagian yang berkacamata tersebut atau tidak. Jadi tidak dapat disimpulkan secara mutlak.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c11d2c25-c1b1-44c5-aeb9-72bff9499724',
    question_text: 'Jika X adalah bilangan genap antara 5 dan 9, dan Y adalah bilangan ganjil antara 6 dan 10, maka nilai X + Y yang mungkin adalah...',
    category: 'TIU',
    option_a: '13',
    option_b: '14',
    option_c: '15',
    option_d: '16',
    option_e: 'Semua benar',
    correct_option: 'C',
    scale_points: null,
    explanation: 'X (genap antara 5 dan 9) = {6, 8}. Y (ganjil antara 6 dan 10) = {7, 9}. Kombinasi penjumlahan: 6+7=13, 6+9=15, 8+7=15, 8+9=17. Pilihan yang ada di opsi adalah 15 (C).',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c11d2c25-c1b1-44c5-aeb9-72bff9499725',
    question_text: 'Anda sedang mengerjakan laporan penting yang harus dikumpulkan esok pagi, tiba-tiba listrik padam di rumah Anda. Sikap Anda adalah...',
    category: 'TKP',
    option_a: 'Pergi tidur dan menyelesaikannya besok pagi-pagi di kantor.',
    option_b: 'Mencari kafe atau tempat yang menyala 24 jam untuk menyelesaikan tugas.',
    option_c: 'Menghubungi atasan dan meminta toleransi waktu karena force majeure.',
    option_d: 'Menunggu listrik menyala kembali sambil bermain ponsel.',
    option_e: 'Marah-marah di media sosial tentang pelayanan PLN.',
    correct_option: null,
    scale_points: { A: 3, B: 5, C: 4, D: 2, E: 1 },
    explanation: 'Aspek Profesionalisme dan Orientasi pada Hasil. Mencari solusi segera (mencari tempat menyala) memiliki poin tertinggi (5). Hubungi atasan (4), kerjakan esok pagi (3), menunggu (2), mengeluh (1).',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c11d2c25-c1b1-44c5-aeb9-72bff9499726',
    question_text: 'Rekan kerja Anda melakukan kesalahan yang membuat instansi merugi kecil. Dia sangat panik. Sikap Anda...',
    category: 'TKP',
    option_a: 'Melaporkannya langsung kepada atasan agar Anda dinilai jujur.',
    option_b: 'Membantu menenangkan dan membantunya mencari solusi perbaikan bersama.',
    option_c: 'Mengabaikannya karena itu bukan tanggung jawab Anda.',
    option_d: 'Menertawakannya dan menceritakannya ke rekan kerja yang lain.',
    option_e: 'Menasihatinya dengan keras agar tidak mengulangi kesalahan lagi.',
    correct_option: null,
    scale_points: { A: 3, B: 5, C: 2, D: 1, E: 4 },
    explanation: 'Aspek Jejaring Kerja dan Kerja Sama. Membantu menenangkan dan mencari solusi bersama memiliki nilai tertinggi (5). Menasihati dengan baik (4), melapor ke atasan (3), mengabaikan (2), menertawakan (1).',
    created_at: new Date().toISOString(),
  },
];

export default function ExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const packageId = params.packageId as string;
  const attemptId = searchParams.get('attemptId');

  const [activeFilterTab, setActiveFilterTab] = useState<string>('ALL');

  // Fetch Attempt Results from DB
  const { data: attemptData, isLoading: isLoadingAttempt } = useQuery<ExamAttempt | null>({
    queryKey: ['attempt', attemptId],
    queryFn: async () => {
      if (!attemptId) return null;
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, packages(title, duration_minutes, total_questions, category)')
        .eq('id', attemptId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!attemptId,
  });

  // Fetch Questions and User Answers
  const { data: questionsAndAnswers, isLoading: isLoadingQa } = useQuery<{
    questions: Question[];
    userAnswers: Record<string, UserAnswer>;
  }>({
    queryKey: ['attempt-qa', attemptId, packageId],
    queryFn: async () => {
      if (!attemptId) return { questions: fallbackQuestions, userAnswers: {} };

      // 1. Fetch package category
      const { data: pkgData } = await supabase
        .from('packages')
        .select('category')
        .eq('id', packageId)
        .single();

      const isMandiri = pkgData?.category === 'MANDIRI';

      if (isMandiri) {
        // Fetch questions assigned to this specific attempt from user_answers ordered by order_index
        const { data: ansList, error: ansError } = await supabase
          .from('user_answers')
          .select('*, questions(*)')
          .eq('attempt_id', attemptId)
          .order('order_index', { ascending: true });

        const mappedAnswers: Record<string, UserAnswer> = {};
        const questionsList: Question[] = [];

        if (ansList) {
          ansList.forEach((ans: any) => {
            if (ans.questions) {
              questionsList.push(ans.questions);
            }
            mappedAnswers[ans.question_id] = {
              id: ans.id,
              attempt_id: ans.attempt_id,
              question_id: ans.question_id,
              selected_option: ans.selected_option,
              points_earned: ans.points_earned,
              answered_at: ans.answered_at,
            };
          });
        }

        if (ansError || questionsList.length === 0) {
          return { questions: fallbackQuestions, userAnswers: mappedAnswers };
        }

        return { questions: questionsList, userAnswers: mappedAnswers };
      } else {
        // KELOMPOK: Fetch standard package questions
        const { data: qJunction, error: qError } = await supabase
          .from('exam_questions')
          .select('questions(*)')
          .eq('exam_id', packageId)
          .order('order_index', { ascending: true });

        // Fetch answers given by user
        const { data: ansList } = await supabase
          .from('user_answers')
          .select('*')
          .eq('attempt_id', attemptId);

        const mappedAnswers: Record<string, UserAnswer> = {};
        if (ansList) {
          ansList.forEach((ans: UserAnswer) => {
            mappedAnswers[ans.question_id] = ans;
          });
        }

        if (qError || !qJunction || qJunction.length === 0) {
          return { questions: fallbackQuestions, userAnswers: mappedAnswers };
        }

        const questionsList = qJunction.map((q) => (q as unknown as { questions: Question }).questions);
        return { questions: questionsList, userAnswers: mappedAnswers };
      }
    },
    enabled: !!attemptId,
  });

  if (isLoadingAttempt || isLoadingQa) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm">Mengompilasi skor & pembahasan...</p>
      </div>
    );
  }

  const activeAttempt = attemptData || fallbackAttempt;
  const qaData = questionsAndAnswers || { questions: fallbackQuestions, userAnswers: {} };

  // Score details
  const scoreTwk = activeAttempt.score_twk;
  const scoreTiu = activeAttempt.score_tiu;
  const scoreTkp = activeAttempt.score_tkp;
  const scoreTotal = activeAttempt.score_total;
  const isPassed = activeAttempt.is_passed;

  // Passing grade targets
  const targetTwk = 65;
  const targetTiu = 80;
  const targetTkp = 166;

  const twkPassed = scoreTwk >= targetTwk;
  const tiuPassed = scoreTiu >= targetTiu;
  const tkpPassed = scoreTkp >= targetTkp;

  // Analysis & Recommendation Logic
  const getAnalysis = () => {
    let twkText = "";
    if (scoreTwk >= 120) {
      twkText = "Sangat Baik! Pemahaman materi kebangsaan, pilar negara, dan sejarah perjuangan Anda sangat kuat. Pertahankan!";
    } else if (scoreTwk >= targetTwk) {
      twkText = "Cukup Baik. Anda sudah melampaui passing grade, namun masih disarankan memperdalam sub-topik minor (seperti Bahasa Indonesia atau Integritas) untuk memaksimalkan skor.";
    } else {
      twkText = "Perlu Peningkatan Kritis. Skor Anda berada di bawah ambang batas (65). Anda disarankan membaca ulang modul UUD 1945, dasar ideologi Pancasila, serta sejarah kemerdekaan.";
    }

    let tiuText = "";
    if (scoreTiu >= 130) {
      tiuText = "Sangat Baik! Kemampuan numerik, logika analitis, dan kemampuan verbal Anda sangat matang.";
    } else if (scoreTiu >= targetTiu) {
      tiuText = "Cukup Baik. Logika dasar Anda sudah memadai untuk lulus, namun latih kecepatan pengerjaan soal hitungan cepat dan silogisme figural.";
    } else {
      tiuText = "Perlu Peningkatan Kritis. Skor Anda berada di bawah ambang batas (80). Fokuslah berlatih latihan soal numerik (deret, perbandingan kuantitatif) dan logika deduktif secara intensif.";
    }

    let tkpText = "";
    if (scoreTkp >= 190) {
      tkpText = "Sangat Baik! Respon kepribadian Anda mencerminkan kualitas ideal seorang Aparatur Sipil Negara dalam aspek pelayanan dan profesionalisme.";
    } else if (scoreTkp >= targetTkp) {
      tkpText = "Cukup Baik. Anda lulus passing grade, namun asah kembali sensitivitas pada aspek Jejaring Kerja, TIK, dan Sosial Budaya.";
    } else {
      tkpText = "Perlu Peningkatan Kritis. Skor Anda berada di bawah ambang batas (166). Tips: Selalu pilih jawaban yang paling memprioritaskan kepentingan umum, tindakan solutif, profesionalisme, serta adaptabilitas tinggi.";
    }

    const failedCategories = [];
    if (!twkPassed) failedCategories.push("TWK");
    if (!tiuPassed) failedCategories.push("TIU");
    if (!tkpPassed) failedCategories.push("TKP");

    return { twkText, tiuText, tkpText, failedCategories };
  };

  const analysis = getAnalysis();

  // Calculate sub-category statistics to find specific weaknesses
  const getSubCategoryStats = () => {
    const stats: Record<string, {
      category: string;
      subCategory: string;
      total: number;
      correct: number;
      points: number;
      maxPoints: number;
    }> = {};

    qaData.questions.forEach((q) => {
      const sub = q.sub_category || 'Umum';
      const uAns = qaData.userAnswers[q.id];
      const selectedOpt = uAns?.selected_option || null;
      const points = uAns?.points_earned || 0;
      const isCorrect = q.category !== 'TKP' ? selectedOpt === q.correct_option : points === 5;

      if (!stats[sub]) {
        stats[sub] = {
          category: q.category,
          subCategory: sub,
          total: 0,
          correct: 0,
          points: 0,
          maxPoints: 0,
        };
      }

      stats[sub].total += 1;
      if (q.category === 'TKP') {
        stats[sub].points += points;
        stats[sub].maxPoints += 5;
      } else {
        if (isCorrect) {
          stats[sub].correct += 1;
        }
      }
    });

    return Object.values(stats).map((s) => {
      const percentage = s.category === 'TKP'
        ? (s.points / s.maxPoints) * 100
        : (s.correct / s.total) * 100;
      return {
        ...s,
        percentage: Math.round(percentage),
      };
    });
  };

  const subCategoryStats = getSubCategoryStats();
  const weakSubCategories = subCategoryStats.filter((s) => s.percentage < 70);

  const filteredQuestions = activeFilterTab === 'ALL'
    ? qaData.questions
    : qaData.questions.filter((q) => q.category === activeFilterTab);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top action */}
      <Button 
        variant="ghost" 
        onClick={() => router.push('/dashboard')}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-0 hover:bg-transparent font-semibold"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
      </Button>

      {/* Main Status Header Card */}
      <Card className={`border-transparent relative overflow-hidden shadow-sm ${
        activeAttempt.status === 'KELUAR'
          ? 'bg-slate-50 dark:bg-slate-950/20 border-l-4 border-l-slate-400'
          : isPassed 
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500' 
          : 'bg-rose-50 dark:bg-rose-950/20 border-l-4 border-l-rose-500'
      }`}>
        <CardHeader className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              {activeAttempt.status === 'KELUAR' ? (
                <>
                  <XCircle className="text-slate-500 dark:text-slate-400 h-8 w-8" /> KELUAR DARI UJIAN
                </>
              ) : isPassed ? (
                <>
                  <CheckCircle className="text-emerald-500 dark:text-emerald-400 h-8 w-8" /> LOLOS PASSING GRADE
                </>
              ) : (
                <>
                  <XCircle className="text-rose-500 dark:text-rose-400 h-8 w-8" /> BELUM LOLOS PASSING GRADE
                </>
              )}
            </h1>
            <p className="text-muted-foreground text-sm">
              {activeAttempt.status === 'KELUAR'
                ? 'Anda keluar dari ujian sebelum menyelesaikan semua soal. Sesi ujian ini tidak dapat dilanjutkan.'
                : 'Hasil simulasi ujian tryout Anda. Nilai ambang batas kumulatif harus dipenuhi pada setiap komponen tes.'}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Skor Akhir</p>
            <p className={`text-5xl font-black font-mono tracking-tight mt-1 ${
              activeAttempt.status === 'KELUAR'
                ? 'text-slate-600 dark:text-slate-400'
                : isPassed 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-rose-600 dark:text-rose-400'
            }`}>{scoreTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">Maksimal: 550</p>
          </div>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      {attemptData?.packages?.category === 'KELOMPOK' && (
        <div className="flex gap-4">
          <Button 
            onClick={() => router.push(`/tryout/${packageId}/leaderboard`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 flex items-center gap-2"
          >
            <Award className="h-4 w-4" /> Lihat Papan Peringkat (Leaderboard)
          </Button>
        </div>
      )}

      {/* Breakdowns per module */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TWK */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground">TWK (Wawasan Kebangsaan)</CardTitle>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              twkPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {twkPassed ? 'Lolos' : 'Gagal'}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-black text-foreground">{scoreTwk}</p>
                <p className="text-xs text-muted-foreground mt-1">Passing Grade: {targetTwk}</p>
              </div>
              <p className="text-xs text-muted-foreground">Maksimal: 150</p>
            </div>
          </CardContent>
        </Card>

        {/* TIU */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground">TIU (Inteligensia Umum)</CardTitle>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              tiuPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {tiuPassed ? 'Lolos' : 'Gagal'}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-black text-foreground">{scoreTiu}</p>
                <p className="text-xs text-muted-foreground mt-1">Passing Grade: {targetTiu}</p>
              </div>
              <p className="text-xs text-muted-foreground">Maksimal: 175</p>
            </div>
          </CardContent>
        </Card>

        {/* TKP */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground">TKP (Karakteristik Pribadi)</CardTitle>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              tkpPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {tkpPassed ? 'Lolos' : 'Gagal'}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-black text-foreground">{scoreTkp}</p>
                <p className="text-xs text-muted-foreground mt-1">Passing Grade: {targetTkp}</p>
              </div>
              <p className="text-xs text-muted-foreground">Maksimal: 225</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analisis Hasil & Rekomendasi Belajar Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4 flex flex-row items-center gap-3">
          <div className="h-10 w-10 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-foreground">Analisis Hasil & Saran Belajar</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Umpan balik evaluasi performa berdasarkan skor ujian CAT Anda.</p>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Grafis Analisis Skor vs Passing Grade */}
          <div className="space-y-6 bg-muted/20 border border-border p-5 rounded-2xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4 font-mono">
              Visualisasi Capaian Skor vs Ambang Batas (Passing Grade)
            </h3>
            <div className="space-y-6">
              {[
                {
                  label: 'TWK (Tes Wawasan Kebangsaan)',
                  score: scoreTwk,
                  target: targetTwk,
                  max: 150,
                  passed: twkPassed,
                  colorName: 'TWK',
                  accentColor: twkPassed ? 'text-emerald-500' : 'text-rose-500',
                  fillClass: twkPassed ? 'bg-emerald-500' : 'bg-rose-500',
                  progressPercent: Math.min(100, (scoreTwk / 150) * 100),
                  targetPercent: (targetTwk / 150) * 100,
                },
                {
                  label: 'TIU (Tes Inteligensia Umum)',
                  score: scoreTiu,
                  target: targetTiu,
                  max: 175,
                  passed: tiuPassed,
                  colorName: 'TIU',
                  accentColor: tiuPassed ? 'text-emerald-500' : 'text-rose-500',
                  fillClass: tiuPassed ? 'bg-emerald-500' : 'bg-rose-500',
                  progressPercent: Math.min(100, (scoreTiu / 175) * 100),
                  targetPercent: (targetTiu / 175) * 100,
                },
                {
                  label: 'TKP (Tes Karakteristik Pribadi)',
                  score: scoreTkp,
                  target: targetTkp,
                  max: 225,
                  passed: tkpPassed,
                  colorName: 'TKP',
                  accentColor: tkpPassed ? 'text-emerald-500' : 'text-rose-500',
                  fillClass: tkpPassed ? 'bg-emerald-500' : 'bg-rose-500',
                  progressPercent: Math.min(100, (scoreTkp / 225) * 100),
                  targetPercent: (targetTkp / 225) * 100,
                },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-black ${
                        item.passed 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {item.passed ? 'Lulus PG' : 'Di Bawah PG'}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {item.score} <span className="text-[10px]">/ {item.max}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="relative w-full h-8 bg-muted/60 dark:bg-slate-900/60 rounded-xl border border-border/60 overflow-visible flex items-center px-0.5">
                    {/* User score fill bar */}
                    <div 
                      className={`h-6 rounded-lg transition-all duration-500 ease-out ${item.fillClass} bg-opacity-80 flex items-center justify-end pr-2 text-[10px] font-black text-white font-mono shadow-sm`}
                      style={{ width: `${item.progressPercent}%` }}
                    >
                      {item.progressPercent > 15 && `${Math.round(item.progressPercent)}%`}
                    </div>

                    {/* Passing Grade Target Line/Marker */}
                    <div 
                      className="absolute top-0 bottom-0 z-10 flex flex-col justify-start items-center"
                      style={{ left: `${item.targetPercent}%` }}
                    >
                      {/* Passing Grade flag/tooltip */}
                      <span className="absolute -top-6 bg-amber-500 dark:bg-amber-600 text-[9px] text-white px-1.5 py-0.5 rounded-md font-bold shadow-sm whitespace-nowrap -translate-x-1/2">
                        Target PG: {item.target}
                      </span>
                      <div className="h-full border-l-2 border-dashed border-amber-500 dark:border-amber-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            
            {/* TWK Analysis */}
            <div className="flex gap-3 items-start">
              <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg shrink-0 w-12 text-center uppercase tracking-wider ${
                twkPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'
              }`}>TWK</span>
              <p className="text-xs text-foreground leading-relaxed font-semibold">{analysis.twkText}</p>
            </div>

            {/* TIU Analysis */}
            <div className="flex gap-3 items-start border-t border-border/40 pt-4">
              <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg shrink-0 w-12 text-center uppercase tracking-wider ${
                tiuPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'
              }`}>TIU</span>
              <p className="text-xs text-foreground leading-relaxed font-semibold">{analysis.tiuText}</p>
            </div>

            {/* TKP Analysis */}
            <div className="flex gap-3 items-start border-t border-border/40 pt-4">
              <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg shrink-0 w-12 text-center uppercase tracking-wider ${
                tkpPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'
              }`}>TKP</span>
              <p className="text-xs text-foreground leading-relaxed font-semibold">{analysis.tkpText}</p>
            </div>

          </div>

          {/* Analisis Kelemahan Sub-Topik */}
          <div className="space-y-4 border-t border-border/40 pt-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">
                Identifikasi Kelemahan Sub-Topik (Akurasi &lt; 70%):
              </h4>
            </div>
            
            {weakSubCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weakSubCategories.map((item) => (
                  <div key={item.subCategory} className="p-3.5 border border-border/60 bg-muted/10 rounded-xl flex flex-col justify-between gap-3 hover:border-rose-500/20 transition-all">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-extrabold text-xs text-foreground leading-tight line-clamp-1">
                          {item.subCategory}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0 font-mono">
                          {item.category}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-muted-foreground font-mono">
                        <span>Akurasi: {item.percentage}%</span>
                        <span>
                          {item.category === 'TKP' 
                            ? `${item.points}/${item.maxPoints} Poin` 
                            : `${item.correct}/${item.total} Soal Benar`
                          }
                        </span>
                      </div>
                      
                      {/* Mini visual indicator */}
                      <div className="w-full bg-muted/60 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>

                    <Button 
                      size="sm"
                      onClick={() => router.push(`/latihan?tab=drill&categories=${item.category}&subCategories=${item.subCategory}`)}
                      className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-bold text-xs h-8.5 rounded-lg border border-rose-500/20 shadow-none transition-all"
                    >
                      Drill Sub-Topik {item.subCategory}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-emerald-500/10 bg-emerald-500/[0.01] rounded-xl text-center">
                <p className="text-xs text-muted-foreground">🎉 Luar biasa! Seluruh sub-topik yang diuji memiliki akurasi di atas 70%.</p>
              </div>
            )}
          </div>

          {/* Actionable Recommendations */}
          <div className="p-5 border border-indigo-500/15 bg-indigo-500/[0.02] rounded-2xl space-y-4">
            <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Compass className="h-4 w-4" />
              Saran Tindakan & Rencana Belajar Kustom:
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Generate dynamic suggestion cards with buttons based on performance */}
              {[
                {
                  category: 'TWK',
                  passed: twkPassed,
                  target: targetTwk,
                  score: scoreTwk,
                  subText: 'Fokus pilar negara, nasionalisme, bela negara, integritas, dan bahasa Indonesia.',
                  bgClass: 'bg-rose-500/[0.01] border-rose-500/10',
                },
                {
                  category: 'TIU',
                  passed: tiuPassed,
                  target: targetTiu,
                  score: scoreTiu,
                  subText: 'Fokus logika silogisme, perbandingan kuantitatif, deret angka, dan analitis.',
                  bgClass: 'bg-rose-500/[0.01] border-rose-500/10',
                },
                {
                  category: 'TKP',
                  passed: tkpPassed,
                  target: targetTkp,
                  score: scoreTkp,
                  subText: 'Fokus jejaring kerja, pelayanan publik, profesionalisme, dan anti-radikalisme.',
                  bgClass: 'bg-rose-500/[0.01] border-rose-500/10',
                },
              ].map((rec) => {
                if (rec.passed) return null; // Show recommendations only for components that failed
                return (
                  <div key={rec.category} className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${rec.bgClass}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-500`}>
                          Perlu Peningkatan
                        </span>
                        <h5 className="font-extrabold text-xs sm:text-sm text-foreground">
                          {rec.category} (Skor: {rec.score} <span className="text-muted-foreground font-normal">/ Passing Grade: {rec.target}</span>)
                        </h5>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.subText}</p>
                    </div>
                    
                    {/* Action buttons corresponding to the user needs */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button 
                        size="sm"
                        onClick={() => router.push(`/latihan?tab=drill&categories=${rec.category}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 h-8.5 rounded-lg shadow-sm"
                      >
                        Mulai Drill {rec.category}
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/materi?category=${rec.category}`)}
                        className="border-border text-foreground font-bold text-xs px-3.5 h-8.5 rounded-lg hover:bg-muted"
                      >
                        Pelajari Materi {rec.category}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* If passed all categories */}
              {analysis.failedCategories.length === 0 && (
                <div className="p-4 border border-emerald-500/15 bg-emerald-500/[0.02] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                        Luar Biasa
                      </span>
                      <h5 className="font-extrabold text-sm text-foreground">Semua Komponen Lulus Passing Grade!</h5>
                    </div>
                    <p className="text-xs text-muted-foreground">Anda sudah menguasai ambang batas dasar. Tingkatkan kecepatan & ketangkasan waktu Anda.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/latihan?tab=drill`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 h-9 rounded-lg"
                    >
                      Mulai Latihan Drill Campuran
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/materi`)}
                      className="border-border text-foreground font-bold text-xs px-4 h-9 rounded-lg"
                    >
                      Tinjau Semua Materi
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/40 text-[11px] text-muted-foreground leading-relaxed">
              💡 <strong>Tips Tambahan:</strong> Disarankan melakukan simulasi tryout lengkap minimal 1 kali seminggu untuk membiasakan diri menghadapi batasan waktu riil (110 soal dalam 100 menit).
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Soal & Pembahasan Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Review Soal & Pembahasan</h2>
          <p className="text-muted-foreground text-sm">Evaluasi kelemahan Anda dengan mempelajari pembahasan kunci jawaban di bawah ini.</p>
        </div>

        <Tabs defaultValue="ALL" onValueChange={setActiveFilterTab} className="w-full">
          <TabsList className="bg-muted border border-border p-1 rounded-xl w-full sm:w-auto">
            <TabsTrigger value="ALL" className="rounded-lg font-semibold px-4 py-2 text-xs sm:text-sm">Semua Soal</TabsTrigger>
            <TabsTrigger value="TWK" className="rounded-lg font-semibold px-4 py-2 text-xs sm:text-sm">TWK</TabsTrigger>
            <TabsTrigger value="TIU" className="rounded-lg font-semibold px-4 py-2 text-xs sm:text-sm">TIU</TabsTrigger>
            <TabsTrigger value="TKP" className="rounded-lg font-semibold px-4 py-2 text-xs sm:text-sm">TKP</TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilterTab} className="mt-6 space-y-6">
            {filteredQuestions.map((q, idx) => {
              const uAns = qaData.userAnswers[q.id];
              const selectedOpt = uAns?.selected_option || null;
              const points = uAns?.points_earned || 0;
              const isCorrect = q.category !== 'TKP' ? selectedOpt === q.correct_option : points === 5;

              return (
                <Card key={q.id} className="bg-card border-border shadow-sm overflow-hidden">
                  
                  {/* Card Header Question */}
                  <CardHeader className="border-b border-border/60 flex flex-col sm:flex-row justify-between gap-4 bg-muted/20">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">Soal #{idx + 1}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-2 ${
                        q.category === 'TWK' 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                          : q.category === 'TIU' 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                          : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                      }`}>
                        {q.category}
                      </span>
                      {q.sub_category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border ml-2 bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
                          Sub: {q.sub_category}
                        </span>
                      )}
                      {q.difficulty && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-2 ${
                          q.difficulty === 'MUDAH'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : q.difficulty === 'SULIT'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Poin diperoleh:</span>
                      <span className={`text-xs font-black px-2 py-1 rounded ${
                        points > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                      }`}>{points} Poin</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    {/* Question text */}
                    <div className="text-foreground text-base leading-relaxed">
                      <MathText text={q.question_text} />
                    </div>
                    {q.image_url && (
                      <div className="mt-3 border border-border rounded-xl overflow-hidden max-h-80 w-full bg-muted flex items-center justify-center p-2">
                        <img src={q.image_url} alt="Soal Bergambar" className="max-h-72 object-contain rounded-lg" />
                      </div>
                    )}

                    {/* Options list showing answers */}
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                        const optKey = `option_${opt.toLowerCase()}` as keyof typeof q;
                        const optText = q[optKey] as string;
                        const imageKey = `option_${opt.toLowerCase()}_image_url` as keyof typeof q;
                        const optionImageUrl = q[imageKey] as string | undefined | null;
                        
                        const isUserSelected = selectedOpt === opt;
                        const isCorrectOption = q.category !== 'TKP' && q.correct_option === opt;

                        // TKP Points color coding
                        let tkpBadge = null;
                        if (q.category === 'TKP' && q.scale_points) {
                          const pts = q.scale_points[opt] || 0;
                          tkpBadge = <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{pts} pts</span>;
                        }

                        let buttonClass = 'bg-muted/10 border-border text-foreground';
                        if (isUserSelected) {
                          buttonClass = isCorrect || q.category === 'TKP'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-950 dark:text-emerald-200'
                            : 'bg-rose-500/10 border-rose-500/50 text-rose-950 dark:text-rose-200';
                        } else if (isCorrectOption) {
                          buttonClass = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-950 dark:text-emerald-200';
                        }

                        return (
                          <div 
                            key={opt}
                            className={`p-3 rounded-lg border text-sm flex items-start justify-between gap-3 ${buttonClass}`}
                          >
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isUserSelected
                                  ? isCorrect || q.category === 'TKP'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  : isCorrectOption
                                  ? 'bg-emerald-600 text-white'
                                  : 'border-border text-muted-foreground bg-background'
                              }`}>
                                {opt}
                              </span>
                              <div className="flex-1 flex flex-col gap-2">
                                <span className="leading-snug"><MathText text={optText} /></span>
                                {optionImageUrl && (
                                  <span className="border border-border rounded-lg overflow-hidden max-h-48 w-fit bg-muted flex items-center justify-center p-1">
                                    <img src={optionImageUrl} alt={`Pilihan ${opt}`} className="max-h-40 object-contain rounded" />
                                  </span>
                                )}
                              </div>
                            </div>
                            {tkpBadge}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pembahasan */}
                    <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                      <h5 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Pembahasan & Kunci Jawaban
                      </h5>
                      <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                        <MathText text={q.explanation || 'Pembahasan belum ditambahkan.'} />
                      </div>
                      {q.explanation_image_url && (
                        <div className="mt-3 border border-border rounded-xl overflow-hidden max-h-60 w-full bg-muted/30 flex items-center justify-center p-2">
                          <img src={q.explanation_image_url} alt="Gambar Pembahasan" className="max-h-52 object-contain rounded-lg" />
                        </div>
                      )}
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

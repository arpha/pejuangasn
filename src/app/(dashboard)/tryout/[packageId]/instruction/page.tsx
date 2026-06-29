'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Play, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useExamStore } from '@/store/useExamStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Question } from '@/types';

// Fallback packages matching database.sql
const fallbackPackages: Record<string, Package> = {
  'b11d2c25-c1b1-44c5-aeb9-72bff9499701': {
    id: 'b11d2c25-c1b1-44c5-aeb9-72bff9499701',
    title: 'Simulasi Ujian Mini SKD CPNS 2026',
    description: 'Simulasi ringkas SKD CPNS terdiri dari 6 soal contoh (2 TWK, 2 TIU, 2 TKP) untuk mencoba sistem CAT.',
    type: 'FREE',
    category: 'MANDIRI',
    duration_minutes: 10,
    total_questions: 6,
    passing_twk: 65,
    passing_tiu: 80,
    passing_tkp: 166,
    created_at: new Date().toISOString(),
  },
  'b11d2c25-c1b1-44c5-aeb9-72bff9499702': {
    id: 'b11d2c25-c1b1-44c5-aeb9-72bff9499702',
    title: 'Tryout Premium SKD BKN Akbar',
    description: 'Tryout premium simulasi lengkap SKD dengan 110 soal standar BKN tingkat kesulitan tinggi.',
    type: 'PREMIUM',
    category: 'KELOMPOK',
    duration_minutes: 100,
    total_questions: 110,
    passing_twk: 65,
    passing_tiu: 80,
    passing_tkp: 166,
    created_at: new Date().toISOString(),
  },
};

// Fallback questions matching database.sql
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

export default function ExamInstructionPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.packageId as string;
  
  const { profile } = useAuthStore();
  const startExamStore = useExamStore((state) => state.startExam);

  // Fetch package details
  const { data: examPackage, isLoading: isLoadingPackage } = useQuery<Package | null>({
    queryKey: ['package', packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();
      if (error) {
        return fallbackPackages[packageId] || null;
      }
      return data;
    },
  });

  // Fetch user enrollment status for this package
  const { data: isEnrolled = false, isLoading: isLoadingEnrollment } = useQuery<boolean>({
    queryKey: ['enrollment', packageId, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { data, error } = await supabase
        .from('package_enrollments')
        .select('id')
        .eq('package_id', packageId)
        .eq('user_id', profile.id)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!profile?.id && !!packageId,
  });

  // Fetch user attempts for this package to check completed status
  const { data: packageAttempts = [], isLoading: isLoadingAttempts } = useQuery<any[]>({
    queryKey: ['package-attempts', packageId, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !packageId) return [];
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('id, status')
        .eq('exam_id', packageId)
        .eq('user_id', profile.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && !!packageId,
  });

  // Redirect / check guard effect
  useEffect(() => {
    if (isLoadingPackage || isLoadingEnrollment || isLoadingAttempts || !examPackage || !profile) return;

    if (examPackage.category !== 'KELOMPOK') {
      // 1. Limit FREE tryouts to once for FREE users
      if (examPackage.type === 'FREE' && profile.subscription_status !== 'PREMIUM') {
        if (packageAttempts.length > 0) {
          toast.error('Batas pengerjaan gratis telah habis. Silakan upgrade ke Premium untuk mengerjakan tryout ini kembali.');
          router.push('/tryout');
          return;
        }
      }
      // 2. Lock PREMIUM tryouts for FREE users
      if (examPackage.type === 'PREMIUM' && profile.subscription_status !== 'PREMIUM') {
        toast.error('Ujian ini hanya untuk member Premium. Silakan upgrade status Premium Anda.');
        router.push('/tryout');
        return;
      }
    } else {
      // 1. Enrollment check
      if (!isEnrolled) {
        toast.error('Anda harus mendaftar/membeli tiket terlebih dahulu untuk mengikuti tryout kelompok ini.');
        router.push('/tryout');
        return;
      }

      // 2. Finished attempt check (Cannot retake group tryouts)
      const hasFinished = packageAttempts.some(a => a.status !== 'IN_PROGRESS');
      if (hasFinished) {
        toast.warning('Anda telah menyelesaikan ujian kelompok ini.');
        router.push('/tryout');
        return;
      }

      // 3. Schedule check
      const now = new Date();
      const startTime = examPackage.start_time ? new Date(examPackage.start_time) : null;
      const endTime = examPackage.end_time ? new Date(examPackage.end_time) : null;

      if (startTime && now < startTime) {
        toast.error(`Sesi ujian belum dibuka. Jadwal pengerjaan dimulai pada ${startTime.toLocaleString('id-ID')}`);
        router.push('/tryout');
        return;
      }
      if (endTime && now > endTime) {
        toast.error('Sesi ujian tryout kelompok ini sudah berakhir.');
        router.push('/tryout');
        return;
      }
    }
  }, [examPackage, isEnrolled, isLoadingPackage, isLoadingEnrollment, isLoadingAttempts, packageAttempts, profile, router]);

  // Start Exam Attempt Mutation
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !examPackage) throw new Error('User atau paket tidak valid');

      // Guard: Check if it's KELOMPOK and they already have a finished attempt
      if (examPackage.category === 'KELOMPOK') {
        const { data: existing, error: checkError } = await supabase
          .from('exam_attempts')
          .select('id, status')
          .eq('exam_id', examPackage.id)
          .eq('user_id', profile.id);
        
        if (!checkError && existing && existing.some(a => a.status !== 'IN_PROGRESS')) {
          throw new Error('Anda sudah menyelesaikan ujian kelompok ini dan tidak dapat mengulangnya.');
        }
      }

      // 1. Create exam_attempts record in Supabase
      const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: profile.id,
          exam_id: examPackage.id,
          status: 'IN_PROGRESS',
        })
        .select()
        .single();

      if (attemptError) {
        // Mock ID for fallback demo
        const mockAttemptId = 'attempt-' + Math.random().toString(36).substring(7);
        return { id: mockAttemptId, questions: fallbackQuestions };
      }

      let questionsList: Question[] = [];
      const isMandiri = examPackage.category === 'MANDIRI';

      if (isMandiri) {
        const totalDifficultyCounts = 
          (examPackage.twk_mudah || 0) + (examPackage.twk_sedang || 0) + (examPackage.twk_sulit || 0) +
          (examPackage.tiu_mudah || 0) + (examPackage.tiu_sedang || 0) + (examPackage.tiu_sulit || 0) +
          (examPackage.tkp_mudah || 0) + (examPackage.tkp_sedang || 0) + (examPackage.tkp_sulit || 0);

        if (totalDifficultyCounts > 0) {
          try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_random_exam_questions', {
              p_twk_mudah: examPackage.twk_mudah || 0,
              p_twk_sedang: examPackage.twk_sedang || 0,
              p_twk_sulit: examPackage.twk_sulit || 0,
              p_tiu_mudah: examPackage.tiu_mudah || 0,
              p_tiu_sedang: examPackage.tiu_sedang || 0,
              p_tiu_sulit: examPackage.tiu_sulit || 0,
              p_tkp_mudah: examPackage.tkp_mudah || 0,
              p_tkp_sedang: examPackage.tkp_sedang || 0,
              p_tkp_sulit: examPackage.tkp_sulit || 0,
              p_only_free: examPackage.type !== 'PREMIUM',
            });

            if (rpcError) throw rpcError;
            
            if (rpcData && rpcData.length > 0) {
              questionsList = rpcData;
            }
          } catch (rpcErr) {
            console.warn('RPC get_random_exam_questions failed or is missing, falling back to client-side filter:', rpcErr);
            
            // Fallback: Fetch questions from bank and filter client-side
            const { data: bankQuestions, error: bankErr } = await supabase
              .from('questions')
              .select('*');

            if (!bankErr && bankQuestions && bankQuestions.length > 0) {
              const pickRandom = (category: string, difficulty: string, count: number) => {
                const pool = bankQuestions.filter(q => {
                  const matchesCategory = q.category === category;
                  const matchesDifficulty = q.difficulty === difficulty;
                  const matchesType = examPackage.type === 'PREMIUM' || (q.type || 'FREE') === 'FREE';
                  return matchesCategory && matchesDifficulty && matchesType;
                });
                const shuffled = [...pool];
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return shuffled.slice(0, count);
              };

              questionsList = [
                ...pickRandom('TWK', 'MUDAH', examPackage.twk_mudah || 0),
                ...pickRandom('TWK', 'SEDANG', examPackage.twk_sedang || 0),
                ...pickRandom('TWK', 'SULIT', examPackage.twk_sulit || 0),
                ...pickRandom('TIU', 'MUDAH', examPackage.tiu_mudah || 0),
                ...pickRandom('TIU', 'SEDANG', examPackage.tiu_sedang || 0),
                ...pickRandom('TIU', 'SULIT', examPackage.tiu_sulit || 0),
                ...pickRandom('TKP', 'MUDAH', examPackage.tkp_mudah || 0),
                ...pickRandom('TKP', 'SEDANG', examPackage.tkp_sedang || 0),
                ...pickRandom('TKP', 'SULIT', examPackage.tkp_sulit || 0),
              ];
            }
          }
        }

        // If still no questions (e.g. counts sum is 0, or DB returns empty), try backward compatibility fallback
        if (questionsList.length === 0) {
          const { data: qJunction } = await supabase
            .from('exam_questions')
            .select('questions(*)')
            .eq('exam_id', examPackage.id);

          if (qJunction && qJunction.length > 0) {
            const list = qJunction.map((q) => (q as unknown as { questions: Question }).questions);
            // Shuffle
            const shuffled = [...list];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            questionsList = shuffled;
          }
        }

        // Final fallback: standard mini or standard questions if still empty
        if (questionsList.length === 0) {
          questionsList = [...fallbackQuestions];
          // Shuffle fallback
          for (let i = questionsList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questionsList[i], questionsList[j]] = [questionsList[j], questionsList[i]];
          }
        }

        // Ensure category order remains TWK, TIU, TKP, but questions within each category are shuffled
        const twkQs = questionsList.filter(q => q.category === 'TWK');
        const tiuQs = questionsList.filter(q => q.category === 'TIU');
        const tkpQs = questionsList.filter(q => q.category === 'TKP');

        const shuffleCategory = (arr: Question[]) => {
          const shuffled = [...arr];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };

        questionsList = [
          ...shuffleCategory(twkQs),
          ...shuffleCategory(tiuQs),
          ...shuffleCategory(tkpQs)
        ];

        // 3. Pre-populate user_answers for MANDIRI to lock the questions list for this attempt
        if (questionsList.length > 0) {
          const payload = questionsList.map((q, idx) => ({
            attempt_id: attempt.id,
            question_id: q.id,
            selected_option: null,
            points_earned: 0,
            order_index: idx + 1,
          }));

          const { error: prepError } = await supabase
            .from('user_answers')
            .insert(payload);

          if (prepError) {
            console.error('Prepopulating user_answers error:', prepError);
          }
        }
      } else {
        // KELOMPOK: static questions from exam_questions
        const { data: qJunction, error: qError } = await supabase
          .from('exam_questions')
          .select('questions(*)')
          .eq('exam_id', examPackage.id)
          .order('order_index', { ascending: true });

        if (qError || !qJunction || qJunction.length === 0) {
          questionsList = fallbackQuestions;
        } else {
          questionsList = qJunction.map((q) => (q as unknown as { questions: Question }).questions);
        }
      }

      return { id: attempt.id, questions: questionsList };
    },
    onSuccess: (data) => {
      if (!examPackage) return;
      
      // Initialize Zustand store
      startExamStore(data.id, examPackage.id, data.questions, examPackage.duration_minutes);
      
      toast.success('Ujian dimulai! Semoga sukses.');
      router.push(`/tryout/${examPackage.id}/exam`);
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast.error(error.message || 'Gagal memulai ujian');
    },
  });

  const activePackage = examPackage || fallbackPackages[packageId];

  if (isLoadingPackage || isLoadingEnrollment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm">Memuat instruksi ujian...</p>
      </div>
    );
  }

  if (!activePackage) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Paket tidak ditemukan</h2>
        <Button onClick={() => router.push('/tryout')} className="bg-indigo-600 text-white font-semibold">Kembali ke Tryout</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => router.push('/tryout')}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-0 hover:bg-transparent font-semibold"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Paket Tryout
      </Button>

      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border pb-6">
          <CardTitle className="text-2xl font-black text-foreground">{activePackage.title}</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">{activePackage.description}</CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          
          {/* Rules & Warnings */}
          <div className="space-y-4 text-foreground">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <AlertTriangle className="text-amber-500 h-5 w-5 shrink-0" /> Aturan & Informasi CAT Ujian
            </h3>
            
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base pl-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Durasi Ujian</strong>: Ujian akan berjalan selama <span className="text-foreground font-bold">{activePackage.duration_minutes} menit</span>.
              </li>
              <li>
                <strong className="text-foreground">Total Soal</strong>: Paket ini memiliki <span className="text-foreground font-bold">{activePackage.total_questions} soal</span>.
              </li>
              <li>
                <strong className="text-foreground">Sistem Penilaian SKD CPNS</strong>:
                <ul className="list-disc list-inside pl-6 mt-1 space-y-1 text-muted-foreground text-xs sm:text-sm">
                  <li>TWK: Benar +5, Salah/Kosong 0.</li>
                  <li>TIU: Benar +5, Salah/Kosong 0.</li>
                  <li>TKP: Skala nilai 1 s.d 5 per opsi jawaban.</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">Navigasi Bebas</strong>: Anda bebas berpindah nomor soal menggunakan panel navigasi CAT. Soal yang ragu-ragu dapat ditandai dengan warna kuning.
              </li>
              <li>
                <strong className="text-foreground">Anti-Cheating Protection</strong>: Meminimalkan layar ujian atau berpindah tab browser saat ujian berlangsung akan dicatat dan dapat membatalkan ujian secara otomatis.
              </li>
            </ul>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4 border border-border rounded-xl p-4 bg-muted/40 text-center">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Waktu</p>
              <p className="text-base sm:text-lg font-black text-foreground mt-1">{activePackage.duration_minutes} Menit</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Total Soal</p>
              <p className="text-base sm:text-lg font-black text-foreground mt-1">{activePackage.total_questions} Butir</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Akses</p>
              <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-1">{activePackage.type}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 border-t border-border p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Dengan mengklik tombol mulai, Anda setuju untuk mengerjakan ujian secara mandiri dan jujur.
          </p>
          <Button
            onClick={() => startAttemptMutation.mutate()}
            disabled={startAttemptMutation.isPending}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 gap-2 shadow-sm"
          >
            {startAttemptMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan Ujian...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" /> Mulai Ujian Sekarang
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

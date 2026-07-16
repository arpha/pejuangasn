'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Lock, Crown, Loader2, Play, Calendar, DollarSign, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package } from '@/types';

// Fallback packages if DB is empty/fails
const fallbackPackages: Package[] = [
  {
    id: 'b11d2c25-c1b1-44c5-aeb9-72bff9499701',
    title: 'Simulasi Mini SKD CPNS Terbaru',
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
  {
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
];

export default function TryoutsPage() {
  const router = useRouter();
  const { profile } = useAuthStore();

  const { data: dbPackages = [], isLoading } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('type', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user enrollments for Tryout Kelompok
  const { data: enrollments = [], refetch: refetchEnrollments } = useQuery<string[]>({
    queryKey: ['user-enrollments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('package_enrollments')
        .select('package_id')
        .eq('user_id', profile.id);
      if (error) throw error;
      return (data || []).map((e: any) => e.package_id) as string[];
    },
    enabled: !!profile?.id,
  });

  // Fetch user attempts to check completed status
  const { data: userAttempts = [] } = useQuery<any[]>({
    queryKey: ['user-attempts-check', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('id, exam_id, status')
        .eq('user_id', profile.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Enroll in Tryout Kelompok mutation
  const enrollMutation = useMutation({
    mutationFn: async (pkg: Package) => {
      if (!profile?.id) throw new Error('Anda harus login terlebih dahulu.');

      const confirmJoin = window.confirm(
        `Apakah Anda yakin ingin mendaftar secara gratis untuk "${pkg.title}"?`
      );
      if (!confirmJoin) return;

      const { error } = await supabase
        .from('package_enrollments')
        .insert({
          user_id: profile.id,
          package_id: pkg.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pendaftaran berhasil! Tiket Anda telah aktif.');
      refetchEnrollments();
    },
    onError: (err: any) => {
      toast.error('Gagal mendaftar: ' + err.message);
    }
  });

  const handleEnrollOrPurchase = (pkg: Package) => {
    if (!profile?.id) {
      toast.error('Anda harus login terlebih dahulu.');
      router.push('/login');
      return;
    }

    if (pkg.price && pkg.price > 0) {
      const confirmJoin = window.confirm(
        `Apakah Anda yakin ingin membeli tiket pendaftaran untuk "${pkg.title}" seharga ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pkg.price)}?`
      );
      if (confirmJoin) {
        // Redirect to profile with checkout package query param
        router.push(`/profil?tab=paket&checkoutPackageId=${pkg.id}`);
      }
    } else {
      // For free packages, trigger the free enroll mutation
      enrollMutation.mutate(pkg);
    }
  };

  const packages = dbPackages.length > 0 ? dbPackages : fallbackPackages;

  const mandiriPackages = packages.filter(p => !p.category || p.category === 'MANDIRI');
  const kelompokPackages = packages.filter(p => p.category === 'KELOMPOK');

  const handleStartExam = (pack: Package) => {
    // If premium check (only for non-KELOMPOK)
    if (pack.category !== 'KELOMPOK') {
      if (pack.type === 'PREMIUM' && profile?.subscription_status !== 'PREMIUM') {
        toast.error('Ujian ini hanya untuk member Premium. Silakan aktifkan status Premium di halaman Dashboard.');
        return;
      }
      // Limit FREE tryouts to once for FREE users
      if (pack.type === 'FREE' && profile?.subscription_status !== 'PREMIUM') {
        const hasAttempt = userAttempts.some((a: any) => a.exam_id === pack.id);
        if (hasAttempt) {
          toast.error('Batas pengerjaan gratis telah habis. Silakan upgrade ke Premium untuk mengerjakan tryout ini kembali.');
          return;
        }
      }
    } else {
      // For KELOMPOK: check enrollment
      const isEnrolled = enrollments.includes(pack.id);
      if (!isEnrolled) {
        toast.error('Anda harus mendaftar/membeli tiket terlebih dahulu untuk mengikuti tryout kelompok ini.');
        return;
      }

      // Check schedule
      const now = new Date();
      const startTime = pack.start_time ? new Date(pack.start_time) : null;
      const endTime = pack.end_time ? new Date(pack.end_time) : null;
      if (startTime && now < startTime) {
        toast.error(`Ujian belum dimulai. Sesi akan dibuka pada ${startTime.toLocaleString('id-ID')}`);
        return;
      }
      if (endTime && now > endTime) {
        toast.error('Ujian sudah berakhir. Anda tidak dapat mengerjakannya lagi.');
        return;
      }
    }
    
    // Redirect to instruction page before starting exam
    router.push(`/tryout/${pack.id}/instruction`);
  };

  const renderPackageCard = (pack: Package) => {
    const isKelompok = pack.category === 'KELOMPOK';
    const isEnrolled = enrollments.includes(pack.id);
    const hasAlreadyAttemptedFree = !isKelompok && pack.type === 'FREE' && profile?.subscription_status !== 'PREMIUM' && userAttempts.some((a: any) => a.exam_id === pack.id);
    const isLocked = (!isKelompok && pack.type === 'PREMIUM' && profile?.subscription_status !== 'PREMIUM') || hasAlreadyAttemptedFree;

    const existingAttempt = userAttempts.find((a: any) => a.exam_id === pack.id);
    const isFinished = existingAttempt && existingAttempt.status !== 'IN_PROGRESS';
    const isInProgress = existingAttempt && existingAttempt.status === 'IN_PROGRESS';

    // Kelompok schedule logic
    const now = new Date();
    const startTime = pack.start_time ? new Date(pack.start_time) : null;
    const endTime = pack.end_time ? new Date(pack.end_time) : null;
    
    let scheduleStatus: 'NOT_STARTED' | 'ACTIVE' | 'ENDED' = 'ACTIVE';
    if (isKelompok && startTime && endTime) {
      if (now < startTime) {
        scheduleStatus = 'NOT_STARTED';
      } else if (now > endTime) {
        scheduleStatus = 'ENDED';
      }
    }

    const isPremiumType = pack.type === 'PREMIUM';

    return (
      <Card 
        key={pack.id} 
        className={`bg-card border-border hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative group rounded-2xl ${
          isLocked 
            ? 'opacity-85 border-border/80' 
            : isPremiumType 
              ? 'hover:border-amber-500/40 hover:shadow-amber-500/[0.01]' 
              : 'hover:border-indigo-500/40 hover:shadow-indigo-500/[0.01]'
        }`}
      >
        {/* Top-Right Ribbon Badge */}
        {isKelompok ? (
          <div className="absolute top-0 right-0 flex items-center shrink-0">
            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl border-l border-b ${
              isEnrolled 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isEnrolled ? 'Terdaftar' : 'Belum Daftar'}
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-500/15 border-l border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl">
              {pack.price && pack.price > 0 
                ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pack.price)
                : 'Gratis'}
            </span>
          </div>
        ) : (
          <div className="absolute top-0 right-0">
            {isPremiumType ? (
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-black dark:text-black text-[9px] font-black tracking-wider uppercase px-3.5 py-1.5 rounded-bl-xl flex items-center gap-1 shadow-sm">
                <Crown className="h-3 w-3 fill-current" /> PREMIUM
              </div>
            ) : (
              <div className="bg-muted border-l border-b border-border text-muted-foreground text-[9px] font-black tracking-wider uppercase px-3.5 py-1.5 rounded-bl-xl">
                FREE
              </div>
            )}
          </div>
        )}

        <CardHeader className="pt-8 px-6 pb-4">
          <div className={`p-3 rounded-2xl w-fit mb-3.5 group-hover:scale-105 transition-transform duration-300 border ${
            isPremiumType 
              ? 'bg-gradient-to-br from-amber-500/15 to-yellow-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-gradient-to-br from-indigo-500/15 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
          }`}>
            <Award className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-extrabold text-foreground pr-20 leading-snug">{pack.title}</CardTitle>
          <CardDescription className="line-clamp-3 pt-2 text-xs leading-relaxed font-medium">{pack.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6 pt-0">
          {/* Custom Stat Block with Icons */}
          <div className="grid grid-cols-2 gap-3 text-xs font-bold text-muted-foreground bg-muted/30 border border-border/80 p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-card p-2 rounded-xl border border-border text-foreground/85 shrink-0 shadow-sm">
                <Clock className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Durasi</span>
                <span className="text-foreground font-black text-sm">{pack.duration_minutes} Menit</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-card p-2 rounded-xl border border-border text-foreground/85 shrink-0 shadow-sm">
                <BookOpen className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Soal</span>
                <span className="text-foreground font-black text-sm">{pack.total_questions} Soal</span>
              </div>
            </div>
          </div>

          {/* Scheduling display for Kelompok */}
          {isKelompok && startTime && endTime && (
            <div className={`text-xs space-y-2 p-4 rounded-2xl border ${
              scheduleStatus === 'ACTIVE'
                ? 'border-emerald-500/25 bg-emerald-500/[0.02]'
                : scheduleStatus === 'NOT_STARTED'
                ? 'border-amber-500/25 bg-amber-500/[0.02]'
                : 'border-rose-500/25 bg-rose-500/[0.02]'
            } font-semibold text-muted-foreground`}>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-black mb-1">
                <span className={
                  scheduleStatus === 'ACTIVE'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : scheduleStatus === 'NOT_STARTED'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }>Jadwal Ujian</span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider flex items-center gap-1 ${
                  scheduleStatus === 'ACTIVE' 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                    : scheduleStatus === 'NOT_STARTED'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}>
                  {scheduleStatus === 'ACTIVE' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />}
                  {scheduleStatus === 'ACTIVE' ? 'Sedang Berjalan' : scheduleStatus === 'NOT_STARTED' ? 'Belum Mulai' : 'Berakhir'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <Calendar className={`h-4.5 w-4.5 shrink-0 ${
                  scheduleStatus === 'ACTIVE'
                    ? 'text-emerald-500'
                    : scheduleStatus === 'NOT_STARTED'
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`} />
                <div className="space-y-0.5 text-foreground/80">
                  <div className="text-[11px] font-bold"><span className="text-muted-foreground font-medium">Mulai:</span> {startTime.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).replace(/\./g, ':')}</div>
                  <div className="text-[11px] font-bold"><span className="text-muted-foreground font-medium">Selesai:</span> {endTime.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).replace(/\./g, ':')}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-6 flex flex-col sm:flex-row gap-3">
          {isKelompok && (
            <Link href={`/tryout/${pack.id}/leaderboard`} className="flex-1">
              <Button 
                variant="outline"
                className="w-full font-bold flex items-center justify-center gap-2 h-11 border-border bg-background hover:bg-muted text-foreground transition-all rounded-xl"
              >
                Papan Peringkat
              </Button>
            </Link>
          )}

          {isKelompok && !isEnrolled ? (
            <Button
              onClick={() => handleEnrollOrPurchase(pack)}
              disabled={enrollMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 flex items-center justify-center gap-2 rounded-xl shadow-sm"
            >
              {enrollMutation.isPending ? (
                'Memproses...'
              ) : (
                <>
                  <DollarSign className="h-4 w-4" /> Daftar / Beli Tiket
                </>
              )}
            </Button>
          ) : isKelompok && isFinished ? (
            <Link href={`/tryout/${pack.id}/result?attemptId=${existingAttempt.id}`} className={isKelompok ? 'flex-1' : 'w-full'}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 flex items-center justify-center gap-2 rounded-xl shadow-sm">
                Lihat Hasil Ujian
              </Button>
            </Link>
          ) : isInProgress ? (
            <Link href={`/tryout/${pack.id}/exam`} className={isKelompok ? 'flex-1' : 'w-full'}>
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 flex items-center justify-center gap-2 rounded-xl shadow-sm">
                Lanjutkan Ujian
              </Button>
            </Link>
          ) : isLocked ? (
            <Link href="/profil?tab=paket" className={isKelompok ? 'flex-1' : 'w-full'}>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 flex items-center justify-center gap-2 rounded-xl shadow-md shadow-orange-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]">
                <Lock className="h-4 w-4" /> {hasAlreadyAttemptedFree ? 'Sudah Dikerjakan (Minta Upgrade)' : 'Terkunci (Premium)'}
              </Button>
            </Link>
          ) : (
            <Button 
              onClick={() => handleStartExam(pack)}
              disabled={isKelompok && scheduleStatus !== 'ACTIVE'}
              className={`font-bold flex items-center justify-center gap-2 h-11 transition-all rounded-xl shadow-sm ${
                isKelompok ? 'flex-1' : 'w-full'
              } ${
                isKelompok && scheduleStatus !== 'ACTIVE'
                  ? 'bg-muted text-muted-foreground'
                  : isPremiumType
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isKelompok && scheduleStatus === 'NOT_STARTED' ? (
                'Belum Dimulai'
              ) : isKelompok && scheduleStatus === 'ENDED' ? (
                'Sesi Berakhir'
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" /> Kerjakan Sekarang
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Paket Tryout CAT SKD</h1>
        <p className="text-muted-foreground">Pilih simulasi paket tryout untuk melatih kesiapan mental dan ketepatan menjawab Anda.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : (
        <Tabs defaultValue="mandiri" className="w-full">
          <TabsList className="bg-transparent border-0 p-0 w-full sm:w-auto flex gap-3 h-14 mb-8">
            <TabsTrigger value="mandiri" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-indigo-600 data-active:text-white data-active:border-indigo-600 dark:data-active:bg-indigo-600 dark:data-active:text-white dark:data-active:border-indigo-600 shadow-sm">
              Tryout Mandiri ({mandiriPackages.length})
            </TabsTrigger>
            <TabsTrigger value="kelompok" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-emerald-600 data-active:text-white data-active:border-emerald-600 dark:data-active:bg-emerald-600 dark:data-active:text-white dark:data-active:border-emerald-600 shadow-sm">
              Tryout Kelompok ({kelompokPackages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mandiri">
            {mandiriPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mandiriPackages.map((pack) => renderPackageCard(pack))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card">
                <p className="text-muted-foreground text-sm font-medium">Tidak ada paket Tryout Mandiri yang tersedia saat ini.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="kelompok">
            {kelompokPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {kelompokPackages.map((pack) => renderPackageCard(pack))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card">
                <p className="text-muted-foreground text-sm font-medium">Tidak ada paket Tryout Kelompok yang tersedia saat ini.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

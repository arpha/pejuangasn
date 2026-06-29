'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Crown, 
  ExternalLink, 
  TrendingUp, 
  User,
  Phone,
  BookOpen,
  BarChart2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExamAttempt } from '@/types';

export default function DashboardPage() {
  const { profile, setProfile } = useAuthStore();

  // Fetch attempt history
  const { data: attempts = [], isLoading } = useQuery<ExamAttempt[]>({
    queryKey: ['attempts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, packages(title, type)')
        .eq('user_id', profile.id)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const togglePremiumMock = async () => {
    if (!profile) return;
    const newStatus = profile.subscription_status === 'FREE' ? 'PREMIUM' : 'FREE';
    
    // Update local store
    setProfile({
      ...profile,
      subscription_status: newStatus,
    });

    toast.success(`Akun diubah menjadi ${newStatus}!`);

    // Optionally update in DB if profile exists
    await supabase
      .from('profiles')
      .update({ subscription_status: newStatus })
      .eq('id', profile.id);
  };



  const completedAttempts = attempts.filter((a) => a.status === 'COMPLETED');

  // Fetch user answers of the last 5 completed attempts
  const { data: answersHistory = [] } = useQuery<any[]>({
    queryKey: ['answers-history', profile?.id, completedAttempts.map(a => a.id).join(',')],
    queryFn: async () => {
      const attemptIds = completedAttempts.slice(0, 5).map(a => a.id);
      if (attemptIds.length === 0) return [];
      const { data, error } = await supabase
        .from('user_answers')
        .select('points_earned, questions(category, sub_category)')
        .in('attempt_id', attemptIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && completedAttempts.length > 0,
  });

  // Group answers by sub-category to find weak topics
  const subCategoryStats = useMemo(() => {
    const stats: Record<string, { totalPoints: number; maxPoints: number; category: string }> = {};

    answersHistory.forEach((item: any) => {
      const q = item.questions;
      if (!q || !q.sub_category) return;
      const sub = q.sub_category;
      if (!stats[sub]) {
        stats[sub] = { totalPoints: 0, maxPoints: 0, category: q.category };
      }
      stats[sub].totalPoints += item.points_earned || 0;
      stats[sub].maxPoints += 5; // Each question is worth max 5 points
    });

    return Object.entries(stats).map(([name, data]) => {
      const accuracy = data.maxPoints > 0 ? Math.round((data.totalPoints / data.maxPoints) * 100) : 0;
      return { name, accuracy, category: data.category };
    }).sort((a, b) => a.accuracy - b.accuracy); // Sort ascending (weakest first)
  }, [answersHistory]);

  const weakSubCategories = subCategoryStats.filter(s => s.accuracy < 80).slice(0, 3);

  const maxScore = completedAttempts.length > 0 ? Math.max(...completedAttempts.map((a) => a.score_total)) : 0;
  const passedAttempts = completedAttempts.filter((a) => a.is_passed).length;

  const totalCompleted = completedAttempts.length;
  const avgTwk = totalCompleted > 0 ? Math.round(completedAttempts.reduce((acc, curr) => acc + (curr.score_twk || 0), 0) / totalCompleted) : 0;
  const avgTiu = totalCompleted > 0 ? Math.round(completedAttempts.reduce((acc, curr) => acc + (curr.score_tiu || 0), 0) / totalCompleted) : 0;
  const avgTkp = totalCompleted > 0 ? Math.round(completedAttempts.reduce((acc, curr) => acc + (curr.score_tkp || 0), 0) / totalCompleted) : 0;

  // Passing grades
  const passTwk = 65;
  const passTiu = 80;
  const passTkp = 166;

  // Find lowest category relative to passing grade
  let lowestCategory: 'TWK' | 'TIU' | 'TKP' = 'TWK';
  if (totalCompleted > 0) {
    const twkRatio = avgTwk / passTwk;
    const tiuRatio = avgTiu / passTiu;
    const tkpRatio = avgTkp / passTkp;

    let minRatio = twkRatio;
    if (tiuRatio < minRatio) {
      lowestCategory = 'TIU';
      minRatio = tiuRatio;
    }
    if (tkpRatio < minRatio) {
      lowestCategory = 'TKP';
    }
  }

  // Recommendation text & path based on lowestCategory
  const recommendations = {
    TWK: {
      title: 'Pilar Negara & Nasionalisme (TWK)',
      desc: 'Skor rata-rata TWK Anda masih memerlukan penguatan. Fokuslah mempelajari modul Pancasila, UUD 1945, Bhinneka Tunggal Ika, NKRI, serta Bela Negara untuk mendongkrak nilai ambang batas Anda.',
      topic: 'Pilar Negara, Integritas, Bela Negara',
    },
    TIU: {
      title: 'Kemampuan Numerik & Logika (TIU)',
      desc: 'Skor rata-rata TIU Anda berada di bawah batas optimal. Cobalah berlatih metode cepat berhitung cepat, silogisme deduktif, perbandingan kuantitatif, dan analisis pola deret angka.',
      topic: 'Silogisme, Analogi, Berhitung, Deret',
    },
    TKP: {
      title: 'Profesionalisme & Pelayanan Publik (TKP)',
      desc: 'Skor rata-rata TKP Anda masih bisa dioptimalkan. Pelajari cara menyikapi kasus-kasus pelayanan publik, jejaring kerja sama tim, penerapan TIK di tempat kerja, serta profesionalisme kerja.',
      topic: 'Pelayanan Publik, Jejaring Kerja, TIK',
    }
  };

  // Reverse to get chronological order (oldest to newest)
  const chartAttempts = [...completedAttempts].slice(0, 5).reverse();

  // Draw SVG lines/dots
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;
  const maxScoreScale = 550;

  let pointsPath = '';
  let areaPath = '';
  const coords: { x: number; y: number; score: number; date: string }[] = [];

  if (chartAttempts.length >= 2) {
    chartAttempts.forEach((attempt, index) => {
      const x = paddingX + (index * (chartWidth / (chartAttempts.length - 1)));
      const y = paddingY + chartHeight - (attempt.score_total / maxScoreScale) * chartHeight;
      const dateStr = new Date(attempt.started_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });
      coords.push({ x, y, score: attempt.score_total, date: dateStr });
    });

    // Build line path
    pointsPath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    // Build area path under line
    areaPath = `${pointsPath} L ${coords[coords.length - 1].x} ${paddingY + chartHeight} L ${coords[0].x} ${paddingY + chartHeight} Z`;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Selamat Datang, {profile?.full_name}!</h1>
          <p className="text-muted-foreground">Berikut adalah rangkuman performa dan aktivitas belajar SKD CPNS Anda.</p>
        </div>
        
        {/* Upgrade / Simulation Button */}
        <Button 
          onClick={togglePremiumMock}
          className={`font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-md border transition-all ${
            profile?.subscription_status === 'PREMIUM'
              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow-sm'
          }`}
        >
          <Crown className="h-5 w-5" />
          {profile?.subscription_status === 'PREMIUM' ? 'Demo: Kembalikan Akun FREE' : 'Demo: Aktifkan Premium'}
        </Button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Jumlah Tryout</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{completedAttempts.length} Ujian</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-3 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Lolos Ujian</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{passedAttempts} Paket</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-sky-500/10 dark:bg-sky-500/20 p-3 rounded-xl text-sky-600 dark:text-sky-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Skor Tertinggi</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{maxScore || '-'} / 550</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-amber-500/10 dark:bg-amber-500/20 p-3 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Waktu Belajar</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {completedAttempts.length * 10} Menit
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Tryout & Materi Quick Links */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card Grid: Analisis Performa & Tren SVG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performa per Kategori */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Analisis Performa Kategori
                </CardTitle>
                <CardDescription>Rata-rata skor Anda dibandingkan passing grade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* TWK */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">TWK (Ambang Batas: 65)</span>
                    <span className={`font-bold ${avgTwk >= 65 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {avgTwk} / 150 ({avgTwk >= 65 ? 'Lolos' : 'Belum Lolos'})
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${avgTwk >= 65 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${(avgTwk / 150) * 100}%` }}
                    />
                  </div>
                </div>

                {/* TIU */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">TIU (Ambang Batas: 80)</span>
                    <span className={`font-bold ${avgTiu >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {avgTiu} / 175 ({avgTiu >= 80 ? 'Lolos' : 'Belum Lolos'})
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${avgTiu >= 80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${(avgTiu / 175) * 100}%` }}
                    />
                  </div>
                </div>

                {/* TKP */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">TKP (Ambang Batas: 166)</span>
                    <span className={`font-bold ${avgTkp >= 166 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {avgTkp} / 225 ({avgTkp >= 166 ? 'Lolos' : 'Belum Lolos'})
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${avgTkp >= 166 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${(avgTkp / 225) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tren Skor SVG */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Tren Perkembangan Skor
                </CardTitle>
                <CardDescription>Grafik nilai dari 5 tryout terakhir.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-3">
                {chartAttempts.length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    Selesaikan minimal 2 tryout untuk melihat grafik tren skor Anda.
                  </div>
                ) : (
                  <div className="w-full relative">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                      {/* Grid Lines */}
                      {[100, 200, 300, 400, 500].map((gridScore) => {
                        const y = paddingY + chartHeight - (gridScore / maxScoreScale) * chartHeight;
                        return (
                          <g key={gridScore}>
                            <line 
                              x1={paddingX} 
                              y1={y} 
                              x2={svgWidth - paddingX} 
                              y2={y} 
                              stroke="currentColor" 
                              className="text-border/50"
                              strokeDasharray="4 4"
                            />
                            <text 
                              x={paddingX - 10} 
                              y={y + 4} 
                              textAnchor="end" 
                              className="fill-muted-foreground text-[10px] font-mono"
                            >
                              {gridScore}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Path */}
                      <path 
                        d={areaPath} 
                        fill="url(#grad)" 
                        className="opacity-15 dark:opacity-20 text-indigo-600 dark:text-indigo-400"
                        stroke="none"
                      />

                      {/* Line Path */}
                      <path 
                        d={pointsPath} 
                        fill="none" 
                        stroke="rgb(79, 70, 229)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Gradients */}
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(99, 102, 241)" />
                          <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Dots and Labels */}
                      {coords.map((c, i) => (
                        <g key={i}>
                          <circle 
                            cx={c.x} 
                            cy={c.y} 
                            r="5" 
                            className="fill-indigo-600 dark:fill-indigo-400 stroke-background stroke-2" 
                          />
                          <text 
                            x={c.x} 
                            y={c.y - 10} 
                            textAnchor="middle" 
                            className="fill-foreground text-[10px] font-bold"
                          >
                            {c.score}
                          </text>
                          <text 
                            x={c.x} 
                            y={paddingY + chartHeight + 18} 
                            textAnchor="middle" 
                            className="fill-muted-foreground text-[9px] font-semibold"
                          >
                            {c.date}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rekomendasi Belajar Pintar */}
          {totalCompleted > 0 && (
            <Card className="bg-card border-border shadow-sm overflow-hidden relative bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-amber-500/[0.02]">
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-indigo-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" /> Rekomendasi Belajar Pintar
                </CardTitle>
                <CardDescription>Berdasarkan analisis hasil tryout terendah Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-indigo-500/15 dark:border-indigo-500/30 bg-indigo-500/5 rounded-xl space-y-2">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    Rekomendasi Utama: Pelajari {recommendations[lowestCategory].title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {recommendations[lowestCategory].desc}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    {recommendations[lowestCategory].topic.split(', ').map((topic, index) => (
                      <span key={index} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {weakSubCategories.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1">
                      ⚠️ Sub-topik Lemah Anda (Akurasi &lt; 80%):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {weakSubCategories.map((sub, index) => (
                        <div key={index} className="p-3 bg-muted/40 border border-border rounded-lg space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-foreground truncate">{sub.name} ({sub.category})</span>
                            <span className="font-bold text-rose-500">{sub.accuracy}% Akurasi</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 rounded-full transition-all"
                              style={{ width: `${sub.accuracy}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Link href="/materi">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 text-sm flex items-center gap-2 shadow-sm rounded-xl transition-all duration-200">
                      Buka Modul Belajar <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Side: Profile Summary & Tips */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Akun Anda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-foreground truncate">{profile?.full_name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  {profile?.whatsapp && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> {profile.whatsapp}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tipe Keanggotaan</span>
                <span className={`font-bold flex items-center gap-1 ${
                  profile?.subscription_status === 'PREMIUM' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                }`}>
                  {profile?.subscription_status === 'PREMIUM' && <Crown className="h-4 w-4 text-amber-500" />}
                  {profile?.subscription_status}
                </span>
              </div>


            </CardContent>
          </Card>

          {/* History attempts */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Riwayat Ujian Tryout</CardTitle>
              <CardDescription>Daftar simulasi tryout yang telah Anda kerjakan sebelumnya.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Memuat riwayat...</p>
              ) : attempts.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Belum ada riwayat pengerjaan tryout.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.slice(0, 5).map((attempt) => (
                    <div 
                      key={attempt.id} 
                      className="p-3.5 border border-border bg-muted/20 hover:bg-muted/40 rounded-xl flex justify-between items-center transition-all duration-200"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-foreground truncate">{attempt.packages?.title || 'Paket Ujian'}</h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {attempt.status === 'KELUAR' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 shrink-0">
                              KELUAR
                            </span>
                          ) : (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              attempt.is_passed 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            }`}>
                              {attempt.is_passed ? 'LOLOS' : 'TDK LOLOS'}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                            {new Date(attempt.started_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-foreground">{attempt.score_total} Poin</p>
                        {attempt.status === 'COMPLETED' || attempt.status === 'KELUAR' ? (
                          <Link 
                            href={`/tryout/${attempt.exam_id}/result?attemptId=${attempt.id}`} 
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-end gap-0.5 font-bold mt-1"
                          >
                            Review <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        ) : (
                          <Link 
                            href={`/tryout/${attempt.exam_id}/exam`} 
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold mt-1"
                          >
                            Lanjutkan
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

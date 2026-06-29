'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Award, 
  Users, 
  Trophy, 
  TrendingUp, 
  CheckCircle2, 
  Search, 
  Loader2, 
  HelpCircle,
  Timer,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Package } from '@/types';

interface AttemptWithProfile {
  id: string;
  user_id: string;
  score_twk: number;
  score_tiu: number;
  score_tkp: number;
  score_total: number;
  is_passed: boolean;
  started_at: string;
  completed_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    province: string | null;
    regency: string | null;
  } | null;
}

export default function TryoutLeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const packageId = params.packageId as string;
  const { profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch package details
  const { data: examPackage, isLoading: isPkgLoading } = useQuery<Package>({
    queryKey: ['package-details-leaderboard', packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();
      if (error) throw error;
      return data as Package;
    }
  });

  // Redirect if package is MANDIRI
  React.useEffect(() => {
    if (examPackage && examPackage.category === 'MANDIRI') {
      toast.error('Papan peringkat (leaderboard) hanya tersedia untuk kategori tryout kelompok.');
      router.push('/tryout');
    }
  }, [examPackage, router]);

  // Fetch all completed attempts for leaderboard
  const { data: attempts = [], isLoading: isAttemptsLoading } = useQuery<AttemptWithProfile[]>({
    queryKey: ['leaderboard-attempts', packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`
          id,
          user_id,
          score_twk,
          score_tiu,
          score_tkp,
          score_total,
          is_passed,
          started_at,
          completed_at,
          profiles (
            full_name,
            email,
            province,
            regency
          )
        `)
        .eq('exam_id', packageId)
        .eq('status', 'COMPLETED');
      if (error) throw error;
      return (data || []) as unknown as AttemptWithProfile[];
    }
  });

  // Helper to format duration: completed_at - started_at
  const getDurationSeconds = (startedAt: string, completedAt: string) => {
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    return Math.max(0, Math.floor((end - start) / 1000));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Sort attempts: 1. score_total desc, 2. duration asc
  const sortedAttempts = React.useMemo(() => {
    return attempts
      .map(att => {
        const durationSecs = getDurationSeconds(att.started_at, att.completed_at);
        return {
          ...att,
          durationSecs,
          durationStr: formatDuration(durationSecs)
        };
      })
      .sort((a, b) => {
        if (b.score_total !== a.score_total) {
          return b.score_total - a.score_total;
        }
        return a.durationSecs - b.durationSecs;
      });
  }, [attempts]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = sortedAttempts.length;
    if (total === 0) return { total: 0, highest: 0, average: 0, passRate: 0 };

    const highest = sortedAttempts[0].score_total;
    const totalScore = sortedAttempts.reduce((acc, curr) => acc + curr.score_total, 0);
    const average = Math.round(totalScore / total);
    const passedCount = sortedAttempts.filter(a => a.is_passed).length;
    const passRate = Math.round((passedCount / total) * 100);

    return { total, highest, average, passRate };
  }, [sortedAttempts]);

  // Filter list by search query
  const filteredAttempts = React.useMemo(() => {
    return sortedAttempts.filter(att => {
      const name = att.profiles?.full_name?.toLowerCase() || '';
      const province = att.profiles?.province?.toLowerCase() || '';
      const regency = att.profiles?.regency?.toLowerCase() || '';
      const query = searchQuery.toLowerCase().trim();
      return name.includes(query) || province.includes(query) || regency.includes(query);
    });
  }, [sortedAttempts, searchQuery]);

  // Top 3 Podium participants
  const top3 = sortedAttempts.slice(0, 3);

  if (isPkgLoading || isAttemptsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm font-medium">Memuat data papan peringkat...</p>
      </div>
    );
  }

  if (!examPackage) {
    return (
      <div className="text-center py-12 space-y-4">
        <HelpCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Paket Tidak Ditemukan</h3>
        <p className="text-muted-foreground text-sm">Paket tryout yang Anda tuju tidak valid atau telah dihapus.</p>
        <Button onClick={() => router.push('/tryout')} className="bg-indigo-600 text-white"> Kembali ke Tryout </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <button 
          onClick={() => router.push('/tryout')}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold transition-colors w-fit mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Daftar Tryout
        </button>
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
          <Award className="h-4 w-4" /> Papan Peringkat Ujian CAT
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{examPackage.title}</h1>
        <p className="text-muted-foreground">Papan peringkat real-time untuk melihat persaingan nilai dan durasi pengerjaan seluruh peserta.</p>
      </div>

      {sortedAttempts.length > 0 ? (
        <div className="space-y-8">
          
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <Card className="bg-card border-border hover:border-indigo-500/30 transition-all duration-300 hover:shadow-sm rounded-2xl bg-gradient-to-br from-indigo-500/[0.02] to-transparent">
              <CardContent className="p-4.5 flex items-center gap-3">
                <div className="h-10.5 w-10.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Users className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Peserta</p>
                  <h4 className="text-xl font-extrabold text-foreground mt-0.5">{stats.total} Orang</h4>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-amber-500/30 transition-all duration-300 hover:shadow-sm rounded-2xl bg-gradient-to-br from-amber-500/[0.02] to-transparent">
              <CardContent className="p-4.5 flex items-center gap-3">
                <div className="h-10.5 w-10.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Trophy className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nilai Tertinggi</p>
                  <h4 className="text-xl font-extrabold text-foreground mt-0.5">{stats.highest} Poin</h4>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-emerald-500/30 transition-all duration-300 hover:shadow-sm rounded-2xl bg-gradient-to-br from-emerald-500/[0.02] to-transparent">
              <CardContent className="p-4.5 flex items-center gap-3">
                <div className="h-10.5 w-10.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nilai Rata-Rata</p>
                  <h4 className="text-xl font-extrabold text-foreground mt-0.5">{stats.average} Poin</h4>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-rose-500/30 transition-all duration-300 hover:shadow-sm rounded-2xl bg-gradient-to-br from-rose-500/[0.02] to-transparent">
              <CardContent className="p-4.5 flex items-center gap-3">
                <div className="h-10.5 w-10.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5.5 w-5.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tingkat Kelulusan</p>
                  <h4 className="text-xl font-extrabold text-foreground mt-0.5">{stats.passRate}% Lolos</h4>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Podium for Top 3 */}
          {top3.length > 0 && (
            <div className="flex flex-col md:flex-row gap-6 justify-center items-end py-8 max-w-3xl mx-auto">
              
              {/* Rank 2 (Left) */}
              {top3[1] && (
                <div className="order-2 md:order-1 flex-1 w-full flex flex-col items-center group/podium2">
                  <div className="h-10 w-10 rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-500 flex items-center justify-center font-bold text-slate-800 dark:text-slate-100 text-sm shadow-[0_0_10px_rgba(148,163,184,0.2)] z-10 group-hover/podium2:scale-110 transition-transform">
                    2
                  </div>
                  <Card className="w-full bg-card border-slate-400/40 bg-gradient-to-b from-slate-500/[0.04] to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.08)] mt-[-16px] text-center pt-7 pb-5 px-4 flex flex-col justify-between h-46 rounded-2xl hover:border-slate-400/60 transition-all duration-300">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-foreground truncate text-sm">
                        {top3[1].profiles?.full_name || 'Peserta Anonim'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate font-semibold">
                        {top3[1].profiles?.province || top3[1].profiles?.regency 
                          ? `${top3[1].profiles.province || ''}${top3[1].profiles.province && top3[1].profiles.regency ? ' - ' : ''}${top3[1].profiles.regency || ''}`
                          : top3[1].profiles?.email}
                      </p>
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-black text-slate-500">{top3[1].score_total}</span>
                      <span className="text-[10px] text-muted-foreground block font-bold mt-1">
                        ⏱️ {formatDuration(getDurationSeconds(top3[1].started_at, top3[1].completed_at))}
                      </span>
                    </div>
                    <div className="mt-3 text-[10px] font-black text-slate-500 tracking-wider">
                      🥈 PERAK
                    </div>
                  </Card>
                </div>
              )}

              {/* Rank 1 (Center) */}
              {top3[0] && (
                <div className="order-1 md:order-2 flex-1 w-full flex flex-col items-center scale-105 group/podium1">
                  <div className="h-12 w-12 rounded-full bg-amber-400 border-2 border-amber-300 flex items-center justify-center font-black text-amber-950 text-base shadow-[0_0_15px_rgba(245,158,11,0.4)] z-10 group-hover/podium1:scale-110 transition-transform">
                    👑
                  </div>
                  <Card className="w-full bg-card border-amber-400 bg-gradient-to-b from-amber-500/[0.06] to-transparent shadow-[0_8px_30px_rgba(0,0,0,0.12)] mt-[-20px] text-center pt-9 pb-6 px-4 flex flex-col justify-between h-52 rounded-2xl hover:border-amber-400/80 transition-all duration-300">
                    <div className="space-y-1">
                      <h4 className="font-black text-foreground truncate text-sm">
                        {top3[0].profiles?.full_name || 'Peserta Anonim'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate font-bold">
                        {top3[0].profiles?.province || top3[0].profiles?.regency 
                          ? `${top3[0].profiles.province || ''}${top3[0].profiles.province && top3[0].profiles.regency ? ' - ' : ''}${top3[0].profiles.regency || ''}`
                          : top3[0].profiles?.email}
                      </p>
                    </div>
                    <div className="mt-2">
                      <span className="text-4xl font-black text-amber-500">{top3[0].score_total}</span>
                      <span className="text-[10px] text-muted-foreground block font-bold mt-1">
                        ⏱️ {formatDuration(getDurationSeconds(top3[0].started_at, top3[0].completed_at))}
                      </span>
                    </div>
                    <div className="mt-3 text-[10px] font-black text-amber-600 tracking-wider">
                      🏆 EMAS (JUARA)
                    </div>
                  </Card>
                </div>
              )}

              {/* Rank 3 (Right) */}
              {top3[2] && (
                <div className="order-3 flex-1 w-full flex flex-col items-center group/podium3">
                  <div className="h-10 w-10 rounded-full bg-amber-700/20 border border-amber-800/40 flex items-center justify-center font-bold text-amber-800 dark:text-amber-500 text-sm shadow-[0_0_10px_rgba(180,83,9,0.2)] z-10 group-hover/podium3:scale-110 transition-transform">
                    3
                  </div>
                  <Card className="w-full bg-card border-amber-800/40 bg-gradient-to-b from-amber-700/[0.04] to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.08)] mt-[-16px] text-center pt-7 pb-5 px-4 flex flex-col justify-between h-46 rounded-2xl hover:border-amber-800/60 transition-all duration-300">
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground truncate text-sm">
                        {top3[2].profiles?.full_name || 'Peserta Anonim'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate font-semibold">
                        {top3[2].profiles?.province || top3[2].profiles?.regency 
                          ? `${top3[2].profiles.province || ''}${top3[2].profiles.province && top3[2].profiles.regency ? ' - ' : ''}${top3[2].profiles.regency || ''}`
                          : top3[2].profiles?.email}
                      </p>
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-black text-amber-700">{top3[2].score_total}</span>
                      <span className="text-[10px] text-muted-foreground block font-bold mt-1">
                        ⏱️ {formatDuration(getDurationSeconds(top3[2].started_at, top3[2].completed_at))}
                      </span>
                    </div>
                    <div className="mt-3 text-[10px] font-black text-amber-700 tracking-wider">
                      🥉 PERUNGGU
                    </div>
                  </Card>
                </div>
              )}

            </div>
          )}

          {/* Leaderboard Table Card */}
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-foreground">Daftar Peringkat Peserta</CardTitle>
              <CardDescription>Cari peserta dan lihat rincian skor masing-masing materi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Search bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Cari nama, provinsi, atau kabupaten peserta..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10.5 bg-muted/30 border-border text-sm rounded-xl"
                />
              </div>
 
              {/* Table Wrapper */}
              <div className="overflow-x-auto border border-border rounded-2xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground uppercase font-black text-[10px] tracking-wider border-b border-border/80">
                    <tr>
                      <th className="p-4.5 text-center w-20">Peringkat</th>
                      <th className="p-4.5">Nama Peserta</th>
                      <th className="p-4.5 text-center w-20">TWK</th>
                      <th className="p-4.5 text-center w-20">TIU</th>
                      <th className="p-4.5 text-center w-20">TKP</th>
                      <th className="p-4.5 text-center w-24">Skor Total</th>
                      <th className="p-4.5 text-center w-28">Durasi</th>
                      <th className="p-4.5 text-center w-36">Status Kelulusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredAttempts.length > 0 ? (
                      filteredAttempts.map((att, index) => {
                        const originalRank = sortedAttempts.findIndex(x => x.id === att.id) + 1;
                        const isCurrentUser = profile && att.user_id === profile.id;
                        
                        return (
                          <tr 
                            key={att.id}
                            className={`transition-colors leading-relaxed ${
                              isCurrentUser 
                                ? 'bg-indigo-500/5 hover:bg-indigo-500/10 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/15 font-semibold border-l-4 border-l-indigo-600' 
                                : 'hover:bg-muted/40 bg-card'
                            }`}
                          >
                            <td className="p-4.5 text-center font-bold">
                              {originalRank === 1 ? (
                                <span className="text-xl">🥇</span>
                              ) : originalRank === 2 ? (
                                <span className="text-xl">🥈</span>
                              ) : originalRank === 3 ? (
                                <span className="text-xl">🥉</span>
                              ) : (
                                <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground font-black">
                                  {originalRank}
                                </span>
                              )}
                            </td>
                            <td className="p-4.5">
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="font-bold text-foreground truncate text-sm">
                                  {att.profiles?.full_name || 'Peserta Anonim'}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                                  {att.profiles?.province || att.profiles?.regency 
                                    ? `${att.profiles.province || ''}${att.profiles.province && att.profiles.regency ? ' - ' : ''}${att.profiles.regency || ''}`
                                    : att.profiles?.email}
                                </span>
                              </div>
                            </td>
                            <td className="p-4.5 text-center font-bold text-muted-foreground">{att.score_twk}</td>
                            <td className="p-4.5 text-center font-bold text-muted-foreground">{att.score_tiu}</td>
                            <td className="p-4.5 text-center font-bold text-muted-foreground">{att.score_tkp}</td>
                            <td className="p-4.5 text-center font-black text-foreground text-sm">{att.score_total}</td>
                            <td className="p-4.5 text-center text-xs font-semibold text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Timer className="h-3.5 w-3.5" /> {att.durationStr}
                              </span>
                            </td>
                            <td className="p-4.5 text-center">
                              {att.is_passed ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <ShieldCheck className="h-3.5 w-3.5" /> LULUS
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <ShieldAlert className="h-3.5 w-3.5" /> GUGUR
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground font-semibold">
                          Tidak ditemukan nama peserta yang cocok dengan kata kunci pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
 
            </CardContent>
          </Card>
          
        </div>
      ) : (
        <Card className="border border-dashed border-border py-16 text-center">
          <div className="max-w-sm mx-auto space-y-4 px-6">
            <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground/80">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-foreground">Belum Ada Peringkat</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Belum ada peserta yang menyelesaikan ujian tryout kelompok ini. Kerjakan ujian sekarang dan jadilah yang pertama terdaftar di papan peringkat!
            </p>
            <Button onClick={() => router.push(`/tryout/${packageId}/instruction`)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6">
              Mulai Ujian
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
}

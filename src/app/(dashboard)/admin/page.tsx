'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  BookOpen, 
  Award, 
  HelpCircle, 
  Shield, 
  Loader2, 
  Plus,
  FileText,
  Ticket
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { profile, loading } = useAuthStore();

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

  // Fetch real-time system stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: userCount },
        { count: questionCount },
        { count: packageCount },
        { count: materialCount },
        { count: blogCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('packages').select('*', { count: 'exact', head: true }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('blogs').select('*', { count: 'exact', head: true })
      ]);

      return {
        users: userCount || 0,
        questions: questionCount || 0,
        packages: packageCount || 0,
        materials: materialCount || 0,
        blogs: blogCount || 0
      };
    },
    enabled: !!profile && profile.role === 'admin'
  });

  // Fetch packages list
  const { data: packages, isLoading: isPackagesLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile && profile.role === 'admin'
  });

  // Fetch materials list
  const { data: materials, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['admin-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, slug, category, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile && profile.role === 'admin'
  });

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
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <Shield className="h-4 w-4" /> Panel Admin PejuangASN
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">Kelola simulasi tryout CAT, soal, materi, dan tinjau performa sistem.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/soal">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 shadow-sm flex items-center gap-2">
              <Plus className="h-4 w-4" /> Kelola Bank Soal
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary Grid */}
      {isStatsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-card border-border animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* Card 1: Users */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Pengguna</p>
                <h3 className="text-3xl font-bold text-foreground">{stats?.users}</h3>
              </div>
              <div className="h-12 w-12 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Questions */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Soal</p>
                <h3 className="text-3xl font-bold text-foreground">{stats?.questions}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <HelpCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Packages */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Paket Ujian</p>
                <h3 className="text-3xl font-bold text-foreground">{stats?.packages}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                <Award className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Materials */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Materi Belajar</p>
                <h3 className="text-3xl font-bold text-foreground">{stats?.materials}</h3>
              </div>
              <div className="h-12 w-12 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Blogs */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Artikel Blog</p>
                <h3 className="text-3xl font-bold text-foreground">{stats?.blogs}</h3>
              </div>
              <div className="h-12 w-12 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Info Banner */}
      <div className="bg-slate-500/5 border border-border/80 rounded-xl p-4 flex gap-3 text-sm text-muted-foreground items-start">
        <span className="shrink-0 text-base">🛡️</span>
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Status Hak Keamanan Admin</p>
          <p className="leading-relaxed text-xs">
            Akun Anda terverifikasi dengan peran <strong>admin</strong>. Kebijakan RLS Supabase aktif. Harap pastikan setiap perubahan data tetap mengikuti standar resmi BKN.
          </p>
        </div>
      </div>

      {/* Menu Grid (Small square boxes with icon & title) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Kelola Materi */}
        <Link href="/admin/materi">
          <Card className="bg-card border-border hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center p-6 h-36 cursor-pointer text-center group">
            <div className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl mb-2 group-hover:scale-110 transition-transform duration-200 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Kelola Materi
            </CardTitle>
          </Card>
        </Link>

        {/* Card 2: Kelola Bank Soal */}
        <Link href="/admin/soal">
          <Card className="bg-card border-border hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center p-6 h-36 cursor-pointer text-center group">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl mb-2 group-hover:scale-110 transition-transform duration-200 shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Kelola Bank Soal
            </CardTitle>
          </Card>
        </Link>

        {/* Card 3: Kelola Paket Tryout */}
        <Link href="/admin/tryout">
          <Card className="bg-card border-border hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center p-6 h-36 cursor-pointer text-center group">
            <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl mb-2 group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Kelola Paket Tryout
            </CardTitle>
          </Card>
        </Link>

        {/* Card 4: Kelola Voucher Promo */}
        <Link href="/admin/voucher">
          <Card className="bg-card border-border hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center p-6 h-36 cursor-pointer text-center group">
            <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl mb-2 group-hover:scale-110 transition-transform duration-200 shrink-0">
              <Ticket className="h-6 w-6" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Kelola Voucher
            </CardTitle>
          </Card>
        </Link>

        {/* Card 5: Kelola Blog Informasi */}
        <Link href="/admin/blog">
          <Card className="bg-card border-border hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center p-6 h-36 cursor-pointer text-center group">
            <div className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl mb-2 group-hover:scale-110 transition-transform duration-200 shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Kelola Blog
            </CardTitle>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Packages vs Materials Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Tryout Packages List */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Paket Ujian Aktif</CardTitle>
              <CardDescription>Daftar paket simulasi yang dapat diakses oleh user</CardDescription>
            </div>
            <Link href="/admin/tryout">
              <Button variant="outline" size="sm">Kelola</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isPackagesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : packages && packages.length > 0 ? (
              <div className="divide-y divide-border">
                {packages.map((pkg: any) => (
                  <div key={pkg.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-1 min-w-0 pr-4">
                      <h4 className="text-sm font-semibold text-foreground truncate">{pkg.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{pkg.description || 'Tidak ada deskripsi'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        pkg.type === 'PREMIUM' 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {pkg.type}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {pkg.duration_minutes}m | {pkg.total_questions} Soal
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada paket ujian aktif.</p>
            )}
          </CardContent>
        </Card>

        {/* Right Side: Learning Materials List */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Materi Pembelajaran</CardTitle>
              <CardDescription>Daftar modul pembelajaran aktif</CardDescription>
            </div>
            <Link href="/admin/materi">
              <Button variant="outline" size="sm">Kelola</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isMaterialsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : materials && materials.length > 0 ? (
              <div className="divide-y divide-border">
                {materials.map((mat: any) => (
                  <div key={mat.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-1 min-w-0 pr-4">
                      <h4 className="text-sm font-semibold text-foreground truncate">{mat.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">Slug: {mat.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        <FileText className="h-2.5 w-2.5" /> {mat.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada materi pembelajaran.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  BookOpen, 
  ArrowRight, 
  Loader2, 
  Search, 
  Flag, 
  Brain, 
  HeartHandshake, 
  Clock, 
  CheckCircle2,
  Trophy,
  Award,
  BookMarked
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Material, UserMaterialProgress } from '@/types';

// Fallback materials if DB query fails or is empty
const fallbackMaterials: Material[] = [
  {
    id: 'a11d2c25-c1b1-44c5-aeb9-72bff9499711',
    title: 'Materi Pilar Negara: Pancasila',
    slug: 'pilar-negara-pancasila',
    category: 'TWK',
    content: 'Pancasila sebagai dasar negara dan pandangan hidup bangsa Indonesia...',
    created_at: new Date().toISOString(),
  },
  {
    id: 'a11d2c25-c1b1-44c5-aeb9-72bff9499712',
    title: 'Materi TIU: Analogi & Silogisme',
    slug: 'tiu-analogi-silogisme',
    category: 'TIU',
    content: 'Silogisme adalah penarikan kesimpulan secara deduktif dari premis-premis...',
    created_at: new Date().toISOString(),
  },
];

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchParams = useSearchParams();
  const { profile } = useAuthStore();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && ['TWK', 'TIU', 'TKP'].includes(categoryParam)) {
      setActiveTab(categoryParam);
    }
  }, [searchParams]);

  // Fetch materials
  const { data: dbMaterials = [], isLoading: isMatLoading } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user reading and quiz progress
  const { data: progressList = [], isLoading: isProgLoading } = useQuery<UserMaterialProgress[]>({
    queryKey: ['user-material-progress', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      try {
        const { data, error } = await supabase
          .from('user_material_progress')
          .select('*')
          .eq('user_id', profile.id);
        
        if (error) throw error;
        return (data || []) as UserMaterialProgress[];
      } catch (err) {
        console.error('Error fetching progress:', err);
        return [];
      }
    },
    enabled: !!profile?.id
  });

  const materials = dbMaterials.length > 0 ? dbMaterials : fallbackMaterials;

  // Filter based on Tab and Search query
  const filteredMaterials = materials.filter(m => {
    const matchesTab = activeTab === 'ALL' || m.category === activeTab;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Calculate statistics
  const twkCount = materials.filter(m => m.category === 'TWK').length;
  const tiuCount = materials.filter(m => m.category === 'TIU').length;
  const tkpCount = materials.filter(m => m.category === 'TKP').length;

  const completedCount = progressList.filter(p => p.is_completed).length;
  const totalProgressPercent = materials.length > 0 ? Math.round((completedCount / materials.length) * 100) : 0;

  const categoryStyles = {
    TWK: {
      glow: 'hover:border-rose-500/40 hover:shadow-rose-500/5',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      iconContainer: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
      icon: Flag
    },
    TIU: {
      glow: 'hover:border-indigo-500/40 hover:shadow-indigo-500/5',
      badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      iconContainer: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      icon: Brain
    },
    TKP: {
      glow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/5',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      iconContainer: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      icon: HeartHandshake
    }
  };

  const isLoading = isMatLoading || isProgLoading;

  return (
    <div className="space-y-8">
      {/* Header section with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
            Materi Pembelajaran SKD
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Modul pembelajaran resmi terstruktur untuk memperdalam pemahaman materi TWK, TIU, dan TKP sesuai standar kisi-kisi BKN.
          </p>
        </div>

        {/* Small stats badges */}
        <div className="flex gap-3 text-xs font-bold">
          <div className="px-3.5 py-2 border border-border bg-card rounded-xl flex items-center gap-1.5 shadow-sm">
            <Flag className="h-3.5 w-3.5 text-rose-500" />
            <span>{twkCount} TWK</span>
          </div>
          <div className="px-3.5 py-2 border border-border bg-card rounded-xl flex items-center gap-1.5 shadow-sm">
            <Brain className="h-3.5 w-3.5 text-indigo-500" />
            <span>{tiuCount} TIU</span>
          </div>
          <div className="px-3.5 py-2 border border-border bg-card rounded-xl flex items-center gap-1.5 shadow-sm">
            <HeartHandshake className="h-3.5 w-3.5 text-emerald-500" />
            <span>{tkpCount} TKP</span>
          </div>
        </div>
      </div>

      {/* Reading Progress Tracker Board */}
      {profile?.id && materials.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-500/[0.04] via-indigo-500/[0.01] to-transparent border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="space-y-1.5">
              <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <BookMarked className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                Progress Belajar Anda
              </h4>
              <p className="text-xs text-muted-foreground font-medium">
                Selesaikan seluruh modul belajar dan uji pemahaman Anda dengan kuis untuk hasil maksimal.
              </p>
            </div>
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-muted-foreground">{completedCount} dari {materials.length} Modul Dibaca</span>
                <span className="text-indigo-600 dark:text-indigo-400">{totalProgressPercent}%</span>
              </div>
              <div className="h-2.5 bg-muted border border-border/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${totalProgressPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Tabs and Search Bar Container */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <TabsList className="bg-transparent border-0 p-0 w-full sm:w-auto grid grid-cols-4 sm:flex gap-3 h-14">
            <TabsTrigger value="ALL" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-indigo-600 data-active:text-white data-active:border-indigo-600 dark:data-active:bg-indigo-600 dark:data-active:text-white dark:data-active:border-indigo-600 shadow-sm">Semua</TabsTrigger>
            <TabsTrigger value="TWK" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-rose-600 data-active:text-white data-active:border-rose-600 dark:data-active:bg-rose-600 dark:data-active:text-white dark:data-active:border-rose-600 shadow-sm">TWK</TabsTrigger>
            <TabsTrigger value="TIU" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-indigo-600 data-active:text-white data-active:border-indigo-600 dark:data-active:bg-indigo-600 dark:data-active:text-white dark:data-active:border-indigo-600 shadow-sm">TIU</TabsTrigger>
            <TabsTrigger value="TKP" className="border border-border bg-card rounded-xl font-bold px-6 py-2.5 text-sm sm:text-base transition-all data-active:bg-emerald-600 data-active:text-white data-active:border-emerald-600 dark:data-active:bg-emerald-600 dark:data-active:text-white dark:data-active:border-emerald-600 shadow-sm">TKP</TabsTrigger>
          </TabsList>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Cari materi belajar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 border-border bg-card rounded-xl focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        {/* Content */}
        <TabsContent value={activeTab} className="mt-0 outline-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Materi yang Anda cari tidak ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMaterials.map((material) => {
                const cat = material.category as 'TWK' | 'TIU' | 'TKP';
                const styles = categoryStyles[cat] || categoryStyles.TWK;
                const Icon = styles.icon;

                // Find user progress for this material
                const progress = progressList.find(p => p.material_id === material.id);
                const isCompleted = progress?.is_completed;
                const quizCompleted = progress?.quiz_completed;
                const quizScore = progress?.quiz_score;

                return (
                  <Card 
                    key={material.id} 
                    className={`bg-card border-border ${styles.glow} hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative group rounded-2xl`}
                  >
                    {/* Completion/Progress Status Badge at top right */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      {isCompleted ? (
                        <>
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                            <CheckCircle2 className="h-3 w-3" /> Selesai Dibaca
                          </span>
                          {quizCompleted && (
                            <span className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                              <Trophy className="h-3 w-3" /> Kuis: {quizScore}/5
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-muted border border-border text-muted-foreground text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                          Belum Dibaca
                        </span>
                      )}
                    </div>

                    <CardHeader className="p-6 pb-4 pt-7">
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2 rounded-xl ${styles.iconContainer} shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <CardTitle className="text-lg font-bold text-foreground leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-28">
                        {material.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-2 leading-relaxed text-xs">
                        Pelajari pembahasan konsep dasar, latihan soal resmi, dan butir-butir penting kisi-kisi {material.category} di modul ini.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-6 pb-6 pt-0">
                      <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                          <Clock className="h-3 w-3" /> 5-10 menit membaca
                        </span>
                        <Link href={`/materi/${material.slug}`}>
                          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 text-sm flex items-center gap-2 shadow-sm rounded-xl transition-all duration-200">
                            {isCompleted ? 'Baca Ulang' : 'Mulai Baca'} <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

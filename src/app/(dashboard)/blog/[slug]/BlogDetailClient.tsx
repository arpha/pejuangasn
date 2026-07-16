'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ShieldAlert, Edit } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Blog } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useAuthStore } from '@/store/useAuthStore';

// Fallback blogs map matching page.tsx for robust navigation
const fallbackBlogsMap: Record<string, Blog> = {
  'panduan-resmi-seleksi-cpns-2026': {
    id: 'f11b2c25-c1b1-44c5-aeb9-72bff9499701',
    title: 'Panduan Resmi Persiapan Seleksi CPNS Terbaru',
    slug: 'panduan-resmi-seleksi-cpns-2026',
    content: `### Pengantar Seleksi CPNS Terbaru
Pemerintah kembali membuka rekrutmen Calon Pegawai Negeri Sipil (CPNS) secara berkala. Persaingan diprediksi akan semakin ketat dibandingkan tahun-tahun sebelumnya. 

Oleh karena itu, persiapan matang sejak dini menjadi kunci utama keberhasilan Anda. Tes Seleksi Kompetensi Dasar (SKD) merupakan tahapan pertama yang harus dilalui menggunakan sistem Computer Assisted Test (CAT).

### Tahapan Ujian SKD CPNS:
1. **Tes Wawasan Kebangsaan (TWK)**: Mengukur penguasaan pengetahuan dan kemampuan mengimplementasikan nasionalisme, integritas, bela negara, pilar negara, dan bahasa Indonesia.
2. **Tes Inteligensia Umum (TIU)**: Mengukur kemampuan verbal, numerik, dan figural.
3. **Tes Karakteristik Pribadi (TKP)**: Menguji pelayanan publik, jejaring kerja, sosial budaya, teknologi informasi, dan profesionalisme.

### Pentingnya Strategi Menjawab Soal CAT
Sistem gugur pada SKD menggunakan nilai ambang batas (Passing Grade). Nilai kumulatif maksimal adalah 550, dengan rincian nilai ambang batas resmi BKN sebagai berikut:
- **TWK**: 65 (Nilai maksimum: 150)
- **TIU**: 80 (Nilai maksimum: 175)
- **TKP**: 166 (Nilai maksimum: 225)

Jangan memprioritaskan satu kategori soal saja. Kerjakan soal yang menurut Anda paling mudah terlebih dahulu, terutama TKP karena tidak ada nilai minus (skala poin 1-5).`,
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80',
    is_published: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  'trik-cepat-menjawab-soal-silogisme-tiu': {
    id: 'f11b2c25-c1b1-44c5-aeb9-72bff9499702',
    title: 'Trik Cepat Menjawab Soal Silogisme TIU CPNS',
    slug: 'trik-cepat-menjawab-soal-silogisme-tiu',
    content: `### Menguasai Silogisme dalam Ujian TIU
Soal penalaran logis atau silogisme sering menjadi jebakan bagi para peserta ujian CPNS. Waktu yang terbatas memaksa kita untuk tidak sekadar menganalisis kalimat secara literal, melainkan menggunakan rumus penarikan kesimpulan logika formal.

### Tiga Aturan Emas Penarikan Kesimpulan:
*   **Modus Ponens**:
    - Premis 1: Jika P maka Q
    - Premis 2: P
    - Kesimpulan: Q
*   **Modus Tollens**:
    - Premis 1: Jika P maka Q
    - Premis 2: Bukan Q
    - Kesimpulan: Bukan P
*   **Silogisme**:
    - Premis 1: Jika P maka Q
    - Premis 2: Jika Q maka R
    - Kesimpulan: Jika P maka R

### Metode Kuantor (Semua vs Sebagian)
1. **Semua / Setiap** berarti seluruh anggota kelompok memenuhi kriteria.
2. **Sebagian / Beberapa / Ada / Sementara** berarti minimal ada satu anggota kelompok memenuhi kriteria.
3. **Penting**: Jika salah satu premis menggunakan kata "sebagian" atau "beberapa", maka kesimpulan *wajib* diawali dengan "sebagian" atau "beberapa".
4. **Penting**: Jika salah satu premis bermakna negatif (tidak/bukan), maka kesimpulannya harus negatif pula.`,
    image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80',
    is_published: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
};

interface BlogDetailClientProps {
  blog: Blog | null;
  slug: string;
}

export default function BlogDetailClient({ blog, slug }: BlogDetailClientProps) {
  const router = useRouter();
  const { profile } = useAuthStore();

  const activeBlog = blog || fallbackBlogsMap[slug];
  const isAdmin = profile?.role === 'admin';
  const isAuthorized = activeBlog && (activeBlog.is_published || isAdmin);

  if (!activeBlog || !isAuthorized) {
    return (
      <div className="max-w-xl mx-auto space-y-6 text-center py-16">
        <ShieldAlert className="h-16 w-16 text-rose-500/80 mx-auto animate-bounce" />
        <h2 className="text-2xl font-bold text-foreground">Artikel Tidak Ditemukan</h2>
        <p className="text-muted-foreground">
          Maaf, artikel blog dengan alamat ini tidak dapat ditemukan di database atau belum dipublikasikan oleh administrator.
        </p>
        <Button 
          onClick={() => router.push('/blog')} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-10 shadow-sm rounded-xl"
        >
          Kembali ke Blog Informasi
        </Button>
      </div>
    );
  }

  // Helper to calculate reading time
  const wordsPerMinute = 200;
  const words = activeBlog.content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  const readingTimeStr = `${readingTime < 1 ? 1 : readingTime} menit membaca`;

  const coverImage = activeBlog.image_url || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/blog')}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-0 hover:bg-transparent font-bold"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Blog
        </Button>

        {profile?.role === 'admin' && (
          <Link href="/admin/blog">
            <Button 
              variant="outline"
              size="sm" 
              className="h-9 px-3.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl flex items-center gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" /> Edit di Panel Admin
            </Button>
          </Link>
        )}
      </div>

      {/* Article Header Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5 bg-muted/80 px-2.5 py-1 rounded-lg">
            <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            {new Date(activeBlog.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5 bg-muted/80 px-2.5 py-1 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            {readingTimeStr}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          {activeBlog.title}
        </h1>
      </div>

      {/* Main Cover Image */}
      <div className="h-[250px] sm:h-[350px] md:h-[420px] w-full overflow-hidden bg-muted rounded-2xl shadow-md border border-border">
        <img 
          src={coverImage} 
          alt={activeBlog.title} 
          className="w-full h-full object-cover" 
        />
      </div>

      {/* Content Rendering Card */}
      <Card className="bg-card border-border overflow-hidden shadow-sm mt-8 rounded-2xl">
        <CardContent className="p-6 sm:p-10 text-foreground leading-relaxed text-base md:text-lg">
          <div className="prose dark:prose-invert max-w-none">
            <MarkdownRenderer text={activeBlog.content} />
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}

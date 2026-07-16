'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FileText, ArrowRight, Loader2, Search, Calendar, Clock, BookOpen } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Blog } from '@/types';

// Fallback blogs if database is empty
const fallbackBlogs: Blog[] = [
  {
    id: 'f11b2c25-c1b1-44c5-aeb9-72bff9499701',
    title: 'Panduan Resmi Persiapan Seleksi CPNS Terbaru',
    slug: 'panduan-resmi-seleksi-cpns-2026',
    content: `### Pengantar Seleksi CPNS Terbaru
Pemerintah kembali membuka rekrutmen Calon Pegawai Negeri Sipil (CPNS) secara berkala. Persaingan diprediksi akan semakin ketat dibandingkan tahun-tahun sebelumnya. 

Oleh karena itu, persiapan matang sejak dini menjadi kunci utama keberhasilan Anda. Tes Seleksi Kompetensi Dasar (SKD) merupakan tahapan pertama yang harus dilalui menggunakan sistem Computer Assisted Test (CAT).

### Tahapan Ujian SKD CPNS:
1. **Tes Wawasan Kebangsaan (TWK)**: Mengukur penguasaan pengetahuan dan kemampuan mengimplementasikan nasionalisme, integritas, bela negara, pilar negara, dan bahasa Indonesia.
2. **Tes Inteligensia Umum (TIU)**: Mengukur kemampuan verbal, numerik, dan figural.
3. **Tes Karakteristik Pribadi (TKP)**: Menguji pelayanan publik, jejaring kerja, sosial budaya, teknologi informasi, dan profesionalisme.`,
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80',
    is_published: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'f11b2c25-c1b1-44c5-aeb9-72bff9499702',
    title: 'Trik Cepat Menjawab Soal Silogisme TIU CPNS',
    slug: 'trik-cepat-menjawab-soal-silogisme-tiu',
    content: `### Menguasai Silogisme dalam Ujian TIU
Soal penalaran logis atau silogisme sering menjadi jebakan bagi para peserta ujian CPNS. Waktu yang terbatas memaksa kita untuk tidak sekadar menganalisis kalimat secara literal, melainkan menggunakan rumus penarikan kesimpulan logika formal.

### Tiga Aturan Emas Penarikan Kesimpulan:
*   **Modus Ponens**: Jika P maka Q. Diketahui P terjadi, maka kesimpulannya adalah Q.
*   **Modus Tollens**: Jika P maka Q. Diketahui tidak Q, maka kesimpulannya adalah tidak P.
*   **Silogisme**: Jika P maka Q. Jika Q maka R. Maka kesimpulannya jika P maka R.`,
    image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80',
    is_published: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function BlogListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch blogs from DB
  const { data: dbBlogs = [], isLoading } = useQuery<Blog[]>({
    queryKey: ['blogs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const blogs = dbBlogs.length > 0 ? dbBlogs : fallbackBlogs;

  // Helper to extract a clean text snippet from markdown body
  const getSnippet = (markdown: string, maxLength = 120) => {
    if (!markdown) return '';
    const plain = markdown
      .replace(/[#*`>|\-]/g, '') // remove markdown special chars
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // replace links with their text
      .replace(/\!\[.*?\]\(.*?\)/g, '') // remove image references
      .replace(/\s+/g, ' ')
      .trim();
    return plain.length > maxLength ? plain.substring(0, maxLength) + '...' : plain;
  };

  // Helper to estimate reading time in minutes
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes < 1 ? 1 : minutes;
  };

  // Filter blogs based on search query
  const filteredBlogs = blogs.filter((blog) => {
    const titleMatch = blog.title.toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = blog.content.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || contentMatch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /> Blog Informasi & Tips Lolos
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
          Pelajari kumpulan artikel resmi, modul persiapan, berita terupdate, serta tips dan trik lulus ujian seleksi CAT CPNS dan PPPK.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
        <Input 
          type="text" 
          placeholder="Cari artikel berdasarkan judul, kategori, atau topik..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-muted/20 border-border text-foreground focus-visible:ring-indigo-500 rounded-xl"
        />
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm text-muted-foreground mt-4 font-semibold">Memuat artikel terbaru...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card max-w-xl mx-auto">
          <BookOpen className="h-12 w-12 text-muted-foreground/45 mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">Artikel Tidak Ditemukan</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
            Tidak ada artikel blog yang cocok dengan kata kunci pencarian Anda. Silakan coba kata kunci lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogs.map((blog) => {
            const snippet = getSnippet(blog.content, 120);
            const readingTime = getReadingTime(blog.content);
            const coverImage = blog.image_url || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80';
            
            return (
              <Card 
                key={blog.id} 
                className="bg-card border-border hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group rounded-2xl"
              >
                {/* Image Cover */}
                <div className="h-48 w-full overflow-hidden bg-muted relative border-b border-border">
                  <img 
                    src={coverImage} 
                    alt={blog.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-60 pointer-events-none" />
                </div>

                <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
                  {/* Article Metadata & Title */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(blog.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {readingTime} min baca
                      </span>
                    </div>

                    <CardTitle className="text-lg font-bold text-foreground leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {blog.title}
                    </CardTitle>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {snippet}
                    </p>
                  </div>

                  {/* Read More button */}
                  <div className="pt-2">
                    <Link href={`/blog/${blog.slug}`} className="w-full inline-block">
                      <Button className="w-full bg-muted hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white text-foreground border border-border group-hover:border-indigo-500/30 font-bold gap-1.5 shadow-sm transition-all rounded-xl h-10">
                        Baca Selengkapnya <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

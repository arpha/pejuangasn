'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Shield, 
  X, 
  Check, 
  Eye, 
  Globe, 
  Settings, 
  BookOpen, 
  Bold, 
  Italic, 
  Code, 
  Quote, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Heading1, 
  Heading2, 
  Heading3, 
  Grid3X3,
  Calendar,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Blog } from '@/types';

export default function AdminBlogManagementPage() {
  const router = useRouter();
  const { profile, loading } = useAuthStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    image_url: '',
    is_published: true,
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });

  // Protect route
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

  // Fetch blogs list
  const { data: blogs, isLoading, refetch } = useQuery({
    queryKey: ['admin-blogs-crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Blog[];
    },
    enabled: !!profile && profile.role === 'admin'
  });

  // Auto-generate slug and SEO Title from Title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titleVal = e.target.value;
    const generatedSlug = titleVal
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special chars
      .replace(/\s+/g, '-') // spaces to dashes
      .replace(/-+/g, '-') // collapse multiple dashes
      .trim();

    setFormData(prev => ({
      ...prev,
      title: titleVal,
      slug: generatedSlug,
      // Default SEO title matches title if not custom-configured yet
      seo_title: prev.seo_title === prev.title || !prev.seo_title ? titleVal : prev.seo_title
    }));
  };

  // Open form for adding new
  const handleAddNew = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      image_url: '',
      is_published: true,
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    });
    setEditingBlog(null);
    setActiveTab('write');
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEdit = (blog: Blog) => {
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      image_url: blog.image_url || '',
      is_published: blog.is_published,
      seo_title: blog.seo_title || '',
      seo_description: blog.seo_description || '',
      seo_keywords: blog.seo_keywords || ''
    });
    setEditingBlog(blog);
    setActiveTab('write');
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete blog from DB
  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus artikel blog ini?')) {
      try {
        const { error } = await supabase
          .from('blogs')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Artikel blog berhasil dihapus!');
        refetch();
      } catch (err) {
        const error = err as Error;
        toast.error('Gagal menghapus blog: ' + error.message);
      }
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
      toast.error('Harap isi judul, slug, dan isi konten artikel!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        image_url: formData.image_url.trim() || null,
        is_published: formData.is_published,
        seo_title: formData.seo_title.trim() || null,
        seo_description: formData.seo_description.trim() || null,
        seo_keywords: formData.seo_keywords.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (editingBlog) {
        // Update
        const { error } = await supabase
          .from('blogs')
          .update(payload)
          .eq('id', editingBlog.id);

        if (error) throw error;
        toast.success('Artikel blog berhasil diperbarui!');
      } else {
        // Insert new
        const { error } = await supabase
          .from('blogs')
          .insert([payload]);

        if (error) throw error;
        toast.success('Artikel blog baru berhasil diterbitkan!');
      }

      setIsFormOpen(false);
      setEditingBlog(null);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error('Gagal menyimpan blog: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Editor toolbar helper
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = before + selectedText + after;

    setFormData(prev => ({
      ...prev,
      content: text.substring(0, start) + replacement + text.substring(end)
    }));

    // Focus and restore select range
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 10);
  };

  // Filter blogs based on search query and status filter
  const filteredBlogs = blogs?.filter((blog) => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          blog.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'PUBLISHED' && blog.is_published) ||
                          (statusFilter === 'DRAFT' && !blog.is_published);
    return matchesSearch && matchesStatus;
  }) || [];

  if (loading || !profile || profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-muted-foreground mt-4 text-sm font-medium">Memverifikasi hak akses...</p>
      </div>
    );
  }

  // Length limits for SEO alerts
  const seoTitleLength = formData.seo_title?.length || 0;
  const seoDescLength = formData.seo_description?.length || 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/admin')} 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 font-bold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Panel Admin
          </button>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <Shield className="h-4 w-4" /> Manajemen Konten Informasi
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Kelola Blog Informasi</h1>
          <p className="text-muted-foreground">Tulis artikel, tips, pengumuman, dan berita terbaru terkait persiapan CPNS/PPPK.</p>
        </div>

        {!isFormOpen && (
          <Button 
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 shadow-sm shrink-0 flex items-center gap-2 rounded-xl"
          >
            <Plus className="h-4.5 w-4.5" /> Tulis Artikel Baru
          </Button>
        )}
      </div>

      {/* Insert / Edit Form Card */}
      {isFormOpen && (
        <Card className="bg-card border-border shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-start justify-between border-b border-border bg-muted/10">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {editingBlog ? 'Edit Artikel Blog' : 'Tulis Artikel Blog Baru'}
              </CardTitle>
              <CardDescription>
                Isi parameter artikel lengkap dengan pengaturan SEO untuk visibilitas di mesin pencarian.
              </CardDescription>
            </div>
            <button 
              onClick={() => { setIsFormOpen(false); setEditingBlog(null); }} 
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-6">
              
              {/* Grid 1: Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-1">
                    Judul Artikel <span className="text-rose-500">*</span>
                  </Label>
                  <Input 
                    id="title" 
                    type="text" 
                    value={formData.title} 
                    onChange={handleTitleChange} 
                    placeholder="Contoh: Tips Sukses Lolos Passing Grade TWK CPNS 2026"
                    className="h-10 bg-muted/30 border-border text-foreground focus-visible:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="text-sm font-semibold flex items-center justify-between">
                    <span>Slug URL (Unik) <span className="text-rose-500">*</span></span>
                    <button 
                      type="button"
                      onClick={() => {
                        const generated = formData.title
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/-+/g, '-')
                          .trim();
                        setFormData(p => ({ ...p, slug: generated }));
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Sparkles className="h-3 w-3" /> Buat dari Judul
                    </button>
                  </Label>
                  <Input 
                    id="slug" 
                    type="text" 
                    value={formData.slug} 
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="contoh: tips-sukses-lolos-passing-grade-twk"
                    className="h-10 bg-muted/30 border-border text-foreground focus-visible:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                {/* Cover Image URL */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="image_url" className="text-sm font-semibold">URL Cover Gambar Utama</Label>
                  <Input 
                    id="image_url" 
                    type="url" 
                    value={formData.image_url} 
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Contoh: https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80"
                    className="h-10 bg-muted/30 border-border text-foreground focus-visible:ring-indigo-500"
                  />
                  <p className="text-xs text-muted-foreground">Gunakan alamat gambar langsung (.jpg, .png, .webp). Jika kosong, cover default akan ditampilkan.</p>
                </div>
              </div>

              {/* Editor Tabs: Write and Live Preview */}
              <div className="border border-border rounded-xl overflow-hidden bg-muted/10">
                
                {/* Tabs Selector & Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border bg-muted/30 p-2 gap-3">
                  
                  {/* Write/Preview Toggle */}
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('write')}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === 'write'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Edit className="h-3.5 w-3.5" /> Tulis
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === 'preview'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Pratinjau
                    </button>
                  </div>

                  {/* Markdown Editor Toolbar (Only show in Write mode) */}
                  {activeTab === 'write' && (
                    <div className="flex flex-wrap items-center gap-1 select-none">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('**', '**')}
                        title="Teks Tebal"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('*', '*')}
                        title="Teks Miring"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('`', '`')}
                        title="Kode Inline"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Code className="h-4 w-4" />
                      </button>
                      <span className="w-px h-6 bg-border mx-1" />
                      
                      <button
                        type="button"
                        onClick={() => insertMarkdown('# ')}
                        title="Header 1"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors font-bold text-xs"
                      >
                        <Heading1 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('## ')}
                        title="Header 2"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors font-bold text-xs"
                      >
                        <Heading2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('### ')}
                        title="Header 3"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors font-bold text-xs"
                      >
                        <Heading3 className="h-4 w-4" />
                      </button>
                      <span className="w-px h-6 bg-border mx-1" />

                      <button
                        type="button"
                        onClick={() => insertMarkdown('> ')}
                        title="Kutipan (Blockquote)"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Quote className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('- ')}
                        title="Daftar Simbol"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('1. ')}
                        title="Daftar Angka"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </button>
                      <span className="w-px h-6 bg-border mx-1" />

                      <button
                        type="button"
                        onClick={() => insertMarkdown('[Teks Link](', ')')}
                        title="Sisipkan Tautan"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('![Deskripsi Gambar](', ')')}
                        title="Sisipkan Gambar"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('\n| Kolom 1 | Kolom 2 |\n|---|---|\n| Data 1 | Data 2 |\n| Data 3 | Data 4 |\n')}
                        title="Sisipkan Tabel"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                </div>

                {/* Editor Content Area */}
                <div className="bg-card">
                  {activeTab === 'write' ? (
                    <textarea 
                      id="content-textarea"
                      rows={16}
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Tulis materi artikel di sini menggunakan format Markdown. Contoh: # Belajar Pancasila..."
                      className="w-full p-4 text-sm md:text-base outline-none bg-transparent font-sans resize-y leading-relaxed text-foreground min-h-[300px]"
                      required
                    />
                  ) : (
                    <div className="p-6 overflow-y-auto min-h-[360px] max-h-[500px] border-t border-border bg-card dark:bg-card/50">
                      {formData.content.trim() ? (
                        <div className="prose dark:prose-invert max-w-none">
                          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">{formData.title || 'Judul Artikel'}</h1>
                          {formData.image_url && (
                            <img 
                              src={formData.image_url} 
                              alt="Cover Preview" 
                              className="w-full max-h-[350px] object-cover rounded-xl mb-6 shadow-sm border border-border"
                            />
                          )}
                          <MarkdownRenderer text={formData.content} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <FileText className="h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm font-medium">Belum ada konten yang ditulis untuk dipratinjau.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Advanced SEO Settings section */}
              <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm pb-2 border-b border-border/80">
                  <Settings className="h-4 w-4" /> Optimasi SEO (Search Engine Optimization)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Meta Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seo_title" className="text-xs font-bold text-foreground">Meta Title Tag</Label>
                      <span className={`text-[10px] font-bold ${seoTitleLength > 60 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {seoTitleLength}/60 karakter
                      </span>
                    </div>
                    <Input 
                      id="seo_title" 
                      type="text" 
                      value={formData.seo_title} 
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                      placeholder="Idealnya 50-60 karakter. Kosongkan untuk menyamakan dengan judul."
                      className="h-9 bg-card border-border text-xs focus-visible:ring-indigo-500"
                    />
                    {seoTitleLength > 60 && (
                      <p className="text-[10px] text-amber-500 font-medium">⚠️ Meta title disarankan di bawah 60 karakter agar tidak terpotong di Google.</p>
                    )}
                  </div>

                  {/* Meta Keywords */}
                  <div className="space-y-1.5">
                    <Label htmlFor="seo_keywords" className="text-xs font-bold text-foreground">Kata Kunci (SEO Keywords)</Label>
                    <Input 
                      id="seo_keywords" 
                      type="text" 
                      value={formData.seo_keywords} 
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords: e.target.value }))}
                      placeholder="Pisahkan dengan koma. Contoh: cpns 2026, passing grade, tips lolos skd"
                      className="h-9 bg-card border-border text-xs focus-visible:ring-indigo-500"
                    />
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seo_description" className="text-xs font-bold text-foreground">Meta Description Tag</Label>
                      <span className={`text-[10px] font-bold ${seoDescLength > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {seoDescLength}/160 karakter
                      </span>
                    </div>
                    <textarea 
                      id="seo_description" 
                      rows={3}
                      value={formData.seo_description} 
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                      placeholder="Tulis ringkasan singkat artikel (150-160 karakter) untuk ditampilkan di hasil penelusuran Google."
                      className="w-full p-2.5 rounded-lg border border-input bg-card text-xs outline-none focus-visible:border-ring font-sans"
                    />
                    {seoDescLength > 160 && (
                      <p className="text-[10px] text-amber-500 font-medium">⚠️ Meta deskripsi disarankan di bawah 160 karakter agar optimal di hasil mesin pencari.</p>
                    )}
                  </div>

                </div>
              </div>

              {/* Status Publish Toggle */}
              <div className="flex items-center gap-3 bg-muted/20 p-4 border border-border rounded-xl">
                <input 
                  id="is_published" 
                  type="checkbox" 
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="h-4.5 w-4.5 rounded border-border bg-card focus:ring-indigo-500 text-indigo-600 transition-all cursor-pointer"
                />
                <div className="space-y-0.5 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}>
                  <Label htmlFor="is_published" className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                    Publikasikan Artikel Sekarang
                  </Label>
                  <p className="text-xs text-muted-foreground">Jika tidak dicentang, artikel akan disimpan sebagai draf dan hanya bisa dilihat oleh Admin.</p>
                </div>
              </div>

            </CardContent>
            
            <CardFooter className="flex justify-end gap-3 border-t border-border p-6 bg-muted/10">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsFormOpen(false); setEditingBlog(null); }}
                className="font-bold border-border"
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...
                  </>
                ) : (
                  editingBlog ? 'Simpan Perubahan' : 'Terbitkan Artikel'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Blogs List Table Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-foreground">Daftar Artikel Aktif</CardTitle>
          <CardDescription>Gunakan filter status dan kata kunci untuk menyaring postingan blog.</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Cari artikel berdasarkan judul atau slug..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/30 border-border"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl shrink-0 self-stretch sm:self-auto justify-center">
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'PUBLISHED', label: 'Diterbitkan' },
                { key: 'DRAFT', label: 'Draf' }
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setStatusFilter(status.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === status.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

          </div>

          {/* List display */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">Memuat daftar artikel...</p>
            </div>
          ) : filteredBlogs.length > 0 ? (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="divide-y divide-border">
                {filteredBlogs.map((blog) => {
                  const coverImage = blog.image_url || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80';
                  
                  return (
                    <div 
                      key={blog.id} 
                      className="p-4 hover:bg-muted/5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Info & Thumbnail */}
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Small image preview */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border hidden sm:block bg-muted">
                          <img 
                            src={coverImage} 
                            alt={blog.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              blog.is_published 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}>
                              {blog.is_published ? 'Diterbitkan' : 'Draf'}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px] md:max-w-none">
                              ID: {blog.id}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                              <Calendar className="h-3 w-3" />
                              {new Date(blog.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-foreground leading-tight truncate-two-lines max-w-[500px]">
                            {blog.title}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            Slug: <span className="font-mono bg-muted/40 px-1 rounded">{blog.slug}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto border-t border-border pt-3 md:border-t-0 md:pt-0 w-full md:w-auto justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(blog)}
                          className="h-9 px-3.5 rounded-lg border-border hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 text-muted-foreground font-bold flex items-center gap-1.5"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(blog.id)}
                          className="h-9 px-3.5 rounded-lg border-border hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 text-muted-foreground font-bold flex items-center gap-1.5"
                        >
                          <Trash2 className="h-4 w-4" /> Hapus
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-xl bg-muted/10">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-foreground">Artikel Tidak Ditemukan</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                Belum ada postingan artikel yang cocok dengan pencarian Anda. Klik tombol "Tulis Artikel Baru" di atas untuk membuat artikel pertama.
              </p>
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  );
}

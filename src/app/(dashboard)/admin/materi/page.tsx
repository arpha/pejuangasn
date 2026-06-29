'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Shield, 
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Material {
  id: string;
  title: string;
  slug: string;
  category: 'TWK' | 'TIU' | 'TKP';
  content: string;
  created_at: string;
}

export default function AdminMaterialsPage() {
  const router = useRouter();
  const { profile, loading } = useAuthStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'TWK' as 'TWK' | 'TIU' | 'TKP',
    content: ''
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

  // Fetch materials list
  const { data: materials, isLoading, refetch } = useQuery({
    queryKey: ['admin-materials-crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Material[];
    },
    enabled: !!profile && profile.role === 'admin'
  });

  // Auto-generate slug from title
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
      slug: generatedSlug
    }));
  };

  // Open form for adding new
  const handleAddNew = () => {
    setFormData({
      title: '',
      slug: '',
      category: 'TWK',
      content: ''
    });
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEdit = (mat: Material) => {
    setFormData({
      title: mat.title,
      slug: mat.slug,
      category: mat.category,
      content: mat.content
    });
    setEditingMaterial(mat);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete material from DB
  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus materi pembelajaran ini?')) {
      try {
        const { error } = await supabase
          .from('materials')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Materi berhasil dihapus!');
        refetch();
      } catch (err) {
        const error = err as Error;
        toast.error('Gagal menghapus materi: ' + error.message);
      }
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
      toast.error('Harap isi semua kolom wajib!');
      return;
    }

    setIsSaving(true);
    try {
      if (editingMaterial) {
        // Update
        const { error } = await supabase
          .from('materials')
          .update({
            title: formData.title,
            slug: formData.slug,
            category: formData.category,
            content: formData.content
          })
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast.success('Materi pembelajaran berhasil diperbarui!');
      } else {
        // Insert new
        const { error } = await supabase
          .from('materials')
          .insert([
            {
              title: formData.title,
              slug: formData.slug,
              category: formData.category,
              content: formData.content
            }
          ]);

        if (error) throw error;
        toast.success('Materi pembelajaran baru berhasil ditambahkan!');
      }

      setIsFormOpen(false);
      setEditingMaterial(null);
      setFormData({ title: '', slug: '', category: 'TWK', content: '' });
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error('Gagal menyimpan materi: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter materials based on search query and category tab
  const filteredMaterials = materials?.filter((mat) => {
    const matchesSearch = mat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          mat.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || mat.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

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
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/admin')} 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Panel Admin
          </button>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <Shield className="h-4 w-4" /> Pengaturan Sistem
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Kelola Materi Belajar</h1>
          <p className="text-muted-foreground">Tambah, perbarui, atau hapus modul pembelajaran resmi TWK, TIU, dan TKP.</p>
        </div>

        {!isFormOpen && (
          <Button 
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 shadow-sm shrink-0 flex items-center gap-2 rounded-xl"
          >
            <Plus className="h-4.5 w-4.5" /> Tambah Materi Baru
          </Button>
        )}
      </div>

      {/* Insert / Edit Form Card */}
      {isFormOpen && (
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {editingMaterial ? 'Edit Materi Belajar' : 'Tambah Materi Belajar Baru'}
              </CardTitle>
              <CardDescription>
                Isikan parameter modul pembelajaran dengan format lengkap.
              </CardDescription>
            </div>
            <button 
              onClick={() => { setIsFormOpen(false); setEditingMaterial(null); }} 
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Judul Materi *</Label>
                  <Input 
                    id="title" 
                    type="text" 
                    value={formData.title} 
                    onChange={handleTitleChange} 
                    placeholder="Contoh: Pengamalan Nilai Pancasila"
                    className="h-10 bg-muted/30 border-border text-foreground focus-visible:ring-indigo-500"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-sm font-semibold">Kategori *</Label>
                  <select 
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 bg-card dark:bg-card/50"
                  >
                    <option value="TWK">TWK (Tes Wawasan Kebangsaan)</option>
                    <option value="TIU">TIU (Tes Inteligensia Umum)</option>
                    <option value="TKP">TKP (Tes Karakteristik Pribadi)</option>
                  </select>
                </div>

                {/* Slug */}
                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="slug" className="text-sm font-semibold">Slug URL * (Unik, digunakan untuk alamat link)</Label>
                  <Input 
                    id="slug" 
                    type="text" 
                    value={formData.slug} 
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="contoh: pengamalan-nilai-pancasila"
                    className="h-10 bg-muted/30 border-border text-foreground focus-visible:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                {/* Content */}
                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="content" className="text-sm font-semibold">Isi Konten Materi * (Mendukung tag HTML & format Markdown)</Label>
                  <textarea 
                    id="content"
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Gunakan Markdown atau teks tebal, daftar rincian dll..."
                    className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 font-sans"
                    required
                  />
                </div>

              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 bg-muted/20">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsFormOpen(false); setEditingMaterial(null); }}
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
                  'Simpan Materi'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Materials List Table Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-foreground">Daftar Modul Aktif</CardTitle>
          <CardDescription>Gunakan fitur pencarian atau filter kategori untuk mempermudah navigasi data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Cari materi berdasarkan judul atau slug..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/30 border-border"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl shrink-0 self-stretch sm:self-auto justify-center">
              {['ALL', 'TWK', 'TIU', 'TKP'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === cat
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua' : cat}
                </button>
              ))}
            </div>

          </div>

          {/* List display */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2 font-medium">Memuat daftar materi...</p>
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="divide-y divide-border">
                {filteredMaterials.map((mat) => (
                  <div 
                    key={mat.id} 
                    className="p-4 hover:bg-muted/10 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    {/* Left: Info */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {mat.category}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono truncate">
                          ID: {mat.id}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground truncate">{mat.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">Slug: <span className="font-mono bg-muted/40 px-1 rounded">{mat.slug}</span></p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(mat)}
                        className="h-9 px-3 rounded-lg border-border hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 text-muted-foreground font-semibold flex items-center gap-1.5"
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(mat.id)}
                        className="h-9 px-3 rounded-lg border-border hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 text-muted-foreground font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/10">
              <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">Materi Tidak Ditemukan</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                Tidak ada materi pembelajaran yang cocok dengan kata kunci pencarian atau kategori filter Anda.
              </p>
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  );
}

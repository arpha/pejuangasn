'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Ticket, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Shield, 
  X,
  Check,
  Calendar,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Voucher {
  id: string;
  code: string;
  discount_percent: number;
  discount_nominal: number;
  valid_until: string | null;
  max_usages: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminVouchersPage() {
  const router = useRouter();
  const { profile, loading } = useAuthStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'nominal'>('percent');

  const [formData, setFormData] = useState({
    code: '',
    discount_value: 0,
    valid_until: '',
    max_usages: '',
    is_active: true
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

  // Fetch vouchers list
  const { data: vouchers, isLoading, error, refetch } = useQuery<Voucher[]>({
    queryKey: ['admin-vouchers-crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Voucher[];
    },
    enabled: !!profile && profile.role === 'admin',
    retry: false
  });

  // Check if schema columns are missing
  const isMigrationMissing = error && (
    error.message.includes('max_usages') || 
    error.message.includes('used_count') || 
    error.message.includes('does not exist')
  );

  // Form code change format helper (uppercase only)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uppercaseCode = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData(prev => ({ ...prev, code: uppercaseCode }));
  };

  // Open form for adding new
  const handleAddNew = () => {
    setFormData({
      code: '',
      discount_value: 0,
      valid_until: '',
      max_usages: '',
      is_active: true
    });
    setDiscountType('percent');
    setEditingVoucher(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEdit = (voucher: Voucher) => {
    const isNominal = voucher.discount_nominal > 0;
    setDiscountType(isNominal ? 'nominal' : 'percent');
    
    // Format timestamp back to HTML datetime-local format (YYYY-MM-DDTHH:MM)
    let formattedDate = '';
    if (voucher.valid_until) {
      const d = new Date(voucher.valid_until);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setFormData({
      code: voucher.code,
      discount_value: isNominal ? voucher.discount_nominal : voucher.discount_percent,
      valid_until: formattedDate,
      max_usages: voucher.max_usages !== null ? String(voucher.max_usages) : '',
      is_active: voucher.is_active
    });
    setEditingVoucher(voucher);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete voucher
  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus voucher promo ini?')) {
      try {
        const { error } = await supabase
          .from('vouchers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Voucher promo berhasil dihapus!');
        refetch();
      } catch (err: any) {
        toast.error('Gagal menghapus voucher: ' + err.message);
      }
    }
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Kode voucher tidak boleh kosong!');
      return;
    }
    if (formData.discount_value <= 0) {
      toast.error('Nilai diskon harus lebih besar dari 0!');
      return;
    }

    setIsSaving(true);
    try {
      const discountPercent = discountType === 'percent' ? Number(formData.discount_value) : 0;
      const discountNominal = discountType === 'nominal' ? Number(formData.discount_value) : 0;
      const validUntil = formData.valid_until ? new Date(formData.valid_until).toISOString() : null;
      const maxUsages = formData.max_usages ? Number(formData.max_usages) : null;

      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_percent: discountPercent,
        discount_nominal: discountNominal,
        valid_until: validUntil,
        max_usages: maxUsages,
        is_active: formData.is_active
      };

      if (editingVoucher) {
        // Update
        const { error } = await supabase
          .from('vouchers')
          .update(payload)
          .eq('id', editingVoucher.id);

        if (error) throw error;
        toast.success('Voucher promo berhasil diperbarui!');
      } else {
        // Insert
        const { error } = await supabase
          .from('vouchers')
          .insert([payload]);

        if (error) throw error;
        toast.success('Voucher promo baru berhasil ditambahkan!');
      }

      setIsFormOpen(false);
      setEditingVoucher(null);
      refetch();
    } catch (err: any) {
      toast.error('Gagal menyimpan voucher: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVouchers = vouchers?.filter((v) => {
    return v.code.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Kelola Voucher Promo</h1>
          <p className="text-muted-foreground">Tambah, perbarui, kuota pemakaian, batas waktu kadaluwarsa, atau hapus kupon diskon.</p>
        </div>

        {!isFormOpen && !isMigrationMissing && (
          <Button 
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 shadow-sm shrink-0 flex items-center gap-2 rounded-xl"
          >
            <Plus className="h-4.5 w-4.5" /> Tambah Voucher Baru
          </Button>
        )}
      </div>

      {/* Database Migration Alert */}
      {isMigrationMissing && (
        <Card className="bg-rose-500/5 border-rose-500/30 border shadow-md">
          <CardHeader>
            <CardTitle className="text-rose-500 flex items-center gap-2 text-lg font-bold">
              <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" /> Diperlukan Pembaruan Database (Migrasi)
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Kolom pembatasan kuota dan pelacakan penggunaan (`max_usages`, `used_count`, `voucher_code`) belum terpasang di database Supabase Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Silakan buka dasbor **Supabase** Anda, masuk ke menu **SQL Editor**, salin kueri SQL di bawah ini, lalu jalankan untuk memperbarui tabel:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-border overflow-x-auto relative">
              <pre className="text-xs font-mono text-slate-300 select-all leading-relaxed">
{`ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS max_usages INTEGER DEFAULT NULL;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS voucher_code TEXT DEFAULT NULL;`}
              </pre>
            </div>
          </CardContent>
          <CardFooter className="border-t border-rose-500/10 bg-rose-500/[0.02] p-4 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Setelah selesai menjalankan kueri di atas, silakan muat ulang halaman ini.</p>
            <Button 
              onClick={() => refetch()} 
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Segarkan Halaman
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Insert / Edit Form Card */}
      {isFormOpen && !isMigrationMissing && (
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {editingVoucher ? 'Edit Voucher Promo' : 'Tambah Voucher Promo Baru'}
              </CardTitle>
              <CardDescription>
                Isikan parameter kupon promosi beserta batasan jumlah pemakaian dan tanggal kedaluwarsa.
              </CardDescription>
            </div>
            <button 
              onClick={() => { setIsFormOpen(false); setEditingVoucher(null); }} 
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Coupon Code */}
                <div className="space-y-1.5 col-span-1">
                  <Label htmlFor="code" className="text-sm font-semibold">Kode Voucher * (Hanya Huruf Besar & Angka)</Label>
                  <Input 
                    id="code" 
                    type="text" 
                    value={formData.code} 
                    onChange={handleCodeChange} 
                    placeholder="Contoh: PEJUANGHEMAT"
                    className="h-10 bg-muted/30 border-border text-foreground font-mono tracking-wider focus-visible:ring-indigo-500 uppercase"
                    required
                    disabled={!!editingVoucher}
                  />
                </div>

                {/* Status Aktif */}
                <div className="space-y-1.5 col-span-1 flex flex-col justify-end pb-2">
                  <Label className="text-sm font-semibold mb-2">Status Aktif</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-border bg-muted/30 focus:ring-indigo-500 accent-indigo-600"
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">Kupon dapat diklaim dan digunakan oleh user</Label>
                  </div>
                </div>

                {/* Discount Type Selector */}
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-sm font-semibold">Tipe Potongan *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`h-10 rounded-lg border font-bold text-sm transition-all ${
                        discountType === 'percent'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Persentase (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('nominal')}
                      className={`h-10 rounded-lg border font-bold text-sm transition-all ${
                        discountType === 'nominal'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Nominal Rupiah (Rp)
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5 col-span-1">
                  <Label htmlFor="discount_value" className="text-sm font-semibold">
                    {discountType === 'percent' ? 'Persentase Diskon * (1 - 100%)' : 'Nominal Diskon * (Dalam Rupiah)'}
                  </Label>
                  <Input 
                    id="discount_value" 
                    type="number" 
                    value={formData.discount_value || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_value: Number(e.target.value) }))} 
                    placeholder={discountType === 'percent' ? 'Contoh: 30' : 'Contoh: 15000'}
                    className="h-10 bg-muted/30 border-border text-foreground focus-visible:ring-indigo-500 font-mono"
                    required
                    min={1}
                    max={discountType === 'percent' ? 100 : undefined}
                  />
                </div>

                {/* Expiration Date */}
                <div className="space-y-1.5 col-span-1">
                  <Label htmlFor="valid_until" className="text-sm font-semibold flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" /> Batas Waktu Berakhir (Opsional)
                  </Label>
                  <Input 
                    id="valid_until" 
                    type="datetime-local" 
                    value={formData.valid_until} 
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                    className="h-10 bg-muted/30 border-border text-foreground focus-visible:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Max Usages */}
                <div className="space-y-1.5 col-span-1">
                  <Label htmlFor="max_usages" className="text-sm font-semibold flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-muted-foreground" /> Kuota Pemakaian / Jumlah (Opsional, kosong = tak terbatas)
                  </Label>
                  <Input 
                    id="max_usages" 
                    type="number" 
                    value={formData.max_usages} 
                    onChange={(e) => setFormData(prev => ({ ...prev, max_usages: e.target.value }))}
                    placeholder="Contoh: 100"
                    className="h-10 bg-muted/30 border-border text-foreground focus-visible:ring-indigo-500 font-mono"
                    min={1}
                  />
                </div>

              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 bg-muted/20">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsFormOpen(false); setEditingVoucher(null); }}
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
                  'Simpan Voucher'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Vouchers List Table Card */}
      {!isMigrationMissing && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground">Daftar Voucher Promo</CardTitle>
            <CardDescription>Semua daftar voucher aktif dan statistik pemakaian kupon diskon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              
              {/* Search Input */}
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Cari voucher berdasarkan kode..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-muted/30 border-border"
                />
              </div>

            </div>

            {/* List display */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-2 font-medium">Memuat daftar voucher...</p>
              </div>
            ) : filteredVouchers.length > 0 ? (
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="divide-y divide-border">
                  {filteredVouchers.map((v) => {
                    const isNominal = v.discount_nominal > 0;
                    const discountVal = isNominal ? v.discount_nominal : v.discount_percent;
                    const discountStr = isNominal 
                      ? `Rp ${new Intl.NumberFormat('id-ID').format(discountVal)}` 
                      : `${discountVal}%`;
                    
                    const isExpired = v.valid_until && new Date() > new Date(v.valid_until);
                    const isLimitReached = v.max_usages !== null && v.used_count >= v.max_usages;
                    const isUsable = v.is_active && !isExpired && !isLimitReached;

                    return (
                      <div 
                        key={v.id} 
                        className="p-4 hover:bg-muted/10 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        {/* Left: Info */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono tracking-wider">
                              {v.code}
                            </span>
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Potongan: {discountStr}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isUsable 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            }`}>
                              {isUsable ? 'AKTIF' : isExpired ? 'KADALUWARSA' : isLimitReached ? 'KUOTA HABIS' : 'NON-AKTIF'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-col gap-1 sm:flex-row sm:gap-4 pt-1">
                            <p>Batas Waktu: <strong className="text-foreground">{
                              v.valid_until 
                                ? new Date(v.valid_until).toLocaleString('id-ID', {
                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                  }) + ' WIB'
                                : 'Selamanya (Tanpa Batas)'
                            }</strong></p>
                            <p>Penggunaan: <strong className="text-foreground">{v.used_count || 0} kali digunakan</strong> / <span className="text-muted-foreground">{
                              v.max_usages !== null ? `${v.max_usages} kuota` : 'Tidak Terbatas'
                            }</span></p>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(v)}
                            className="h-9 px-3 rounded-lg border-border hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 text-muted-foreground font-semibold flex items-center gap-1.5"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(v.id)}
                            className="h-9 px-3 rounded-lg border-border hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 text-muted-foreground font-semibold flex items-center gap-1.5"
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
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/10">
                <Ticket className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-foreground">Voucher Tidak Ditemukan</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Tidak ada kode voucher promo yang dibuat saat ini. Klik tombol tambah untuk membuat yang baru.
                </p>
              </div>
            )}

          </CardContent>
        </Card>
      )}

    </div>
  );
}

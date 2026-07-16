'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  User, 
  Key, 
  CreditCard, 
  Briefcase, 
  Ticket, 
  Share2, 
  GraduationCap, 
  Loader2, 
  Copy, 
  Check, 
  Crown, 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  FileText,
  QrCode,
  AlertCircle,
  ArrowLeft,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Local storage key for active tab to maintain state on refresh
const ACTIVE_TAB_KEY = 'kawanasn-profil-active-tab';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutPackageId = searchParams.get('checkoutPackageId');
  const { profile, setProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('akun');
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch details of checkoutPackage if checkoutPackageId is in search query params
  const { data: checkoutPackage } = useQuery<any>({
    queryKey: ['package', checkoutPackageId],
    queryFn: async () => {
      if (!checkoutPackageId) return null;
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', checkoutPackageId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!checkoutPackageId,
  });

  // Read active tab from localStorage or query params on mount
  useEffect(() => {
    if (checkoutPackageId) {
      setActiveTab('paket');
    } else {
      const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, [checkoutPackageId]);

  // Load Midtrans Snap Script dynamically on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const snapUrl = isProduction 
      ? 'https://app.midtrans.com/snap/snap.js' 
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    // Prevent duplicate loading
    if (document.getElementById('midtrans-snap-script')) return;

    const script = document.createElement('script');
    script.src = snapUrl;
    script.id = 'midtrans-snap-script';
    if (clientKey) {
      script.setAttribute('data-client-key', clientKey);
    }
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('midtrans-snap-script');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Realtime subscription for profiles table updates
  useEffect(() => {
    if (!profile?.id) return;

    const profileChannel = supabase
      .channel(`profile-realtime-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`
        },
        (payload) => {
          console.log('Realtime profile update received:', payload.new);
          if (payload.new) {
            setProfile({
              ...profile,
              subscription_status: payload.new.subscription_status,
              full_name: payload.new.full_name,
              province: payload.new.province,
              regency: payload.new.regency,
              gender: payload.new.gender
            });
            if (payload.new.subscription_status === 'PREMIUM' && profile.subscription_status === 'FREE') {
              toast.success('🎉 Status keanggotaan Anda telah aktif sebagai PREMIUM!');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [profile?.id, setProfile, profile]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    localStorage.setItem(ACTIVE_TAB_KEY, val);
  };

  // -------------------------------------------------------------
  // TAB A: ACCOUNT SETTINGS STATE & LOGIC
  // -------------------------------------------------------------
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [province, setProvince] = useState(profile?.province || '');
  const [regency, setRegency] = useState(profile?.regency || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setWhatsapp(profile.whatsapp || '');
      setProvince(profile.province || '');
      setRegency(profile.regency || '');
      setGender(profile.gender || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!fullName.trim()) {
      toast.error('Nama Lengkap tidak boleh kosong');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      // 1. Update full_name, province, regency, and gender in public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          province: province.trim(),
          regency: regency.trim(),
          gender: gender || null
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 2. Update whatsapp in user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { whatsapp: whatsapp.trim() }
      });

      if (authError) throw authError;

      // 3. Update local store profile
      setProfile({
        ...profile,
        full_name: fullName.trim(),
        whatsapp: whatsapp.trim(),
        province: province.trim(),
        regency: regency.trim(),
        gender: gender as any
      });

      toast.success('Profil Anda berhasil diperbarui!');
    } catch (err: any) {
      toast.error('Gagal memperbarui profil: ' + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Harap lengkapi kolom kata sandi baru');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Kata sandi baru minimal harus 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Kata sandi Anda berhasil diperbarui!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Gagal memperbarui kata sandi: ' + err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePremiumDemo = async () => {
    if (!profile) return;
    const newStatus = profile.subscription_status === 'FREE' ? 'PREMIUM' : 'FREE';

    setProfile({
      ...profile,
      subscription_status: newStatus,
    });

    toast.success(`Akun diubah menjadi ${newStatus}!`);

    await supabase
      .from('profiles')
      .update({ subscription_status: newStatus })
      .eq('id', profile.id);
  };

  const [paymentType, setPaymentType] = useState<'bank_transfer' | 'qris'>('bank_transfer');
  const [selectedBank, setSelectedBank] = useState<'bca' | 'bni' | 'bri'>('bca');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isCancellingCheckout, setIsCancellingCheckout] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  const handleApplyVoucher = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingVoucher(true);
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Kode voucher tidak valid atau telah berakhir.');
        return;
      }

      if (data.valid_until && new Date() > new Date(data.valid_until)) {
        toast.error('Kode voucher telah kadaluwarsa.');
        return;
      }

      setAppliedVoucher(data);
      toast.success(`Voucher ${data.code} berhasil diterapkan!`);
    } catch (err: any) {
      toast.error('Gagal memeriksa voucher: ' + err.message);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setPromoCode('');
    toast.info('Voucher dihapus.');
  };

  const displayBasePrice = checkoutPackageId && checkoutPackage 
    ? (checkoutPackage.price || 0) 
    : 149000;
  let displayDiscount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discount_percent > 0) {
      displayDiscount = Math.floor((displayBasePrice * appliedVoucher.discount_percent) / 100);
    } else if (appliedVoucher.discount_nominal > 0) {
      displayDiscount = appliedVoucher.discount_nominal;
    }
  }
  const displayFee = paymentType === 'bank_transfer' 
    ? 4500 
    : Math.floor((displayBasePrice - displayDiscount) * 0.007);
  const displayTotalPrice = displayBasePrice - displayDiscount + displayFee;

  const handleUpgradeNow = async () => {
    const toastId = toast.loading('Membuat invoice pembayaran...');
    setIsProcessingCheckout(true);
    try {
      if (!profile) return;

      // 1. Ambil session token aktif Supabase untuk otentikasi API checkout
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesi aktif tidak ditemukan. Harap login kembali.', { id: toastId });
        return;
      }

      // 2. Panggil API Route checkout Next.js untuk mendapatkan detail pembayaran
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          paymentType: paymentType,
          bank: paymentType === 'bank_transfer' ? selectedBank : undefined,
          voucherCode: appliedVoucher?.code || undefined,
          packageId: checkoutPackageId || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memulai proses pembayaran');
      }

      await refetchTransactions();

      // Reset applied voucher on successful checkout
      setAppliedVoucher(null);
      setPromoCode('');

      if (data.isSimulation) {
        toast.success('🎉 Simulasi Invoice berhasil dibuat! Silakan selesaikan pembayaran.', { id: toastId });
      } else {
        toast.success('Invoice berhasil dibuat! Silakan lakukan pembayaran.', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Gagal memproses transaksi: ' + err.message, { id: toastId });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleCancelPayment = async (transactionId: string) => {
    const toastId = toast.loading('Membatalkan tagihan pembayaran...');
    setIsCancellingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesi aktif tidak ditemukan. Harap login kembali.', { id: toastId });
        return;
      }

      const response = await fetch('/api/payment/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ transactionId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membatalkan pembayaran');
      }

      await refetchTransactions();
      toast.success('Tagihan pembayaran berhasil dibatalkan.', { id: toastId });
    } catch (err: any) {
      toast.error('Gagal membatalkan pembayaran: ' + err.message, { id: toastId });
    } finally {
      setIsCancellingCheckout(false);
    }
  };

  const handleSimulatePaymentSuccess = async (transactionId: string) => {
    const toastId = toast.loading('Memproses simulasi pembayaran sukses...');
    try {
      if (!profile) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesi aktif tidak ditemukan. Harap login kembali.', { id: toastId });
        return;
      }

      const response = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ transactionId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses simulasi pembayaran');
      }

      await refetchTransactions();

      // Check if this is a package purchase or premium upgrade
      const tx = transactions.find((t: any) => t.id === transactionId);
      if (tx?.package_id) {
        toast.success('🎉 Pembayaran Berhasil! Anda telah terdaftar di tryout ini.', { id: toastId });
        // Redirect to tryout page after a short delay
        setTimeout(() => {
          router.push('/tryout');
        }, 1500);
      } else {
        setProfile({
          ...profile,
          subscription_status: 'PREMIUM'
        });
        toast.success('🎉 Upgrade Berhasil (Mode Simulasi)! Akun Anda aktif sebagai PREMIUM.', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Gagal memproses simulasi: ' + err.message, { id: toastId });
    }
  };

  // -------------------------------------------------------------
  // TAB B: TRANSACTIONS LOGIC
  // -------------------------------------------------------------
  const [txPage, setTxPage] = useState(1);
  const txItemsPerPage = 5;

  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useQuery<any[]>({
    queryKey: ['transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && (activeTab === 'transaksi' || activeTab === 'paket'),
  });

  const pendingTx = transactions.find((tx: any) => {
    if (tx.status !== 'PENDING') return false;
    if (checkoutPackageId) {
      return tx.package_id === checkoutPackageId;
    }
    return true; // finds any pending transaction
  });

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!pendingTx) return;

    const calculateTimeLeft = () => {
      const difference = new Date(pendingTx.created_at).getTime() + 24 * 60 * 60 * 1000 - Date.now();
      if (difference <= 0) {
        return 'Batas waktu pembayaran habis';
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingTx]);

  // -------------------------------------------------------------
  // TAB C: MY PACKAGES & MEMBERSHIP LOGIC
  // -------------------------------------------------------------
  // Fetch enrolled packages (Tryout Kelompok)
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<any[]>({
    queryKey: ['my-enrollments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('package_enrollments')
        .select('*, packages(*)')
        .eq('user_id', profile.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && (activeTab === 'paket' || !!checkoutPackageId),
  });

  const isAlreadyEnrolled = checkoutPackageId && enrollments?.some((e: any) => e.package_id === checkoutPackageId);

  // Fetch attempts to see completion details
  const { data: attempts = [] } = useQuery<any[]>({
    queryKey: ['my-attempts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('id, exam_id, status, score_total, completed_at, is_passed')
        .eq('user_id', profile.id)
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && activeTab === 'paket',
  });

  // -------------------------------------------------------------
  // TAB D: VOUCHERS LOGIC
  // -------------------------------------------------------------
  const { data: dbVouchers = [], isLoading: isLoadingVouchers } = useQuery<any[]>({
    queryKey: ['active-vouchers', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && activeTab === 'voucher',
  });

  // -------------------------------------------------------------
  // TAB E: AFFILIATE PROGRAM LOGIC
  // -------------------------------------------------------------
  const [isGeneratingAffCode, setIsGeneratingAffCode] = useState(false);

  // Fetch user's affiliate account
  const { data: affiliateAccount, isLoading: isLoadingAff, refetch: refetchAff } = useQuery<any>({
    queryKey: ['affiliate-account', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && activeTab === 'afiliasi',
  });

  // Fetch referrals generated by the user
  const { data: referralsList = [], isLoading: isLoadingReferrals } = useQuery<any[]>({
    queryKey: ['my-referrals', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('*, profiles:referee_id(full_name, email)')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && activeTab === 'afiliasi' && !!affiliateAccount,
  });

  const handleGenerateReferralCode = async () => {
    if (!profile) return;
    setIsGeneratingAffCode(true);

    try {
      // Create random suffix
      const suffix = Math.random().toString(36).substring(3, 7).toUpperCase();
      const codeBase = profile.full_name?.replace(/\s+/g, '').substring(0, 8).toUpperCase() || 'REF';
      const refCode = `KAWAN_${codeBase}_${suffix}`;

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: profile.id,
          referral_code: refCode,
          balance: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Program Kemitraan Aktif! Kode referral Anda: ${refCode}`);
      refetchAff();
    } catch (err: any) {
      toast.error('Gagal membuat kode rujukan: ' + err.message);
    } finally {
      setIsGeneratingAffCode(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success('Kode referral disalin ke papan klip!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // -------------------------------------------------------------
  // TAB F: GRADUATION SURVEY STATE & LOGIC
  // -------------------------------------------------------------
  const [isGraduated, setIsGraduated] = useState<boolean>(true);
  const [targetAgency, setTargetAgency] = useState('');
  const [skdScore, setSkdScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);

  // Fetch if user has already filled the survey
  const { data: userSurvey, isLoading: isLoadingSurvey, refetch: refetchSurvey } = useQuery<any>({
    queryKey: ['my-survey', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('graduation_surveys')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && activeTab === 'survey',
  });

  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!targetAgency.trim()) {
      toast.error('Instansi Target tidak boleh kosong');
      return;
    }

    setIsSubmittingSurvey(true);
    try {
      const { error } = await supabase
        .from('graduation_surveys')
        .insert({
          user_id: profile.id,
          is_graduated: isGraduated,
          target_agency: targetAgency.trim(),
          skd_score: skdScore ? Number(skdScore) : null,
          feedback: feedback.trim() || null,
          rating: rating
        });

      if (error) throw error;

      toast.success('Terima kasih! Survey kelulusan Anda berhasil disimpan.');
      refetchSurvey();
    } catch (err: any) {
      toast.error('Gagal mengirim survey: ' + err.message);
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Akun & Profil Saya</h1>
        <p className="text-muted-foreground">Kelola kredensial akun, riwayat transaksi, kupon voucher, hingga kemitraan afiliasi Anda.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col gap-6">
        {/* Horizontal Nav Tabs Grid List */}
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full bg-muted/40 border border-border/60 rounded-2xl p-2 shrink-0 shadow-sm !h-fit">
          <TabsTrigger 
            value="akun" 
            className="w-full justify-center gap-2.5 h-11 md:h-12 rounded-xl font-black px-4 text-xs transition-all duration-300 border border-transparent data-active:bg-indigo-600 data-active:text-white data-active:shadow-md data-active:shadow-indigo-600/15 text-muted-foreground hover:text-foreground hover:bg-muted/60 whitespace-nowrap"
          >
            <User className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === 'akun' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400')} /> 
            Pengaturan Akun
          </TabsTrigger>
          <TabsTrigger 
            value="transaksi" 
            className="w-full justify-center gap-2.5 h-11 md:h-12 rounded-xl font-black px-4 text-xs transition-all duration-300 border border-transparent data-active:bg-indigo-600 data-active:text-white data-active:shadow-md data-active:shadow-indigo-600/15 text-muted-foreground hover:text-foreground hover:bg-muted/60 whitespace-nowrap"
          >
            <CreditCard className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === 'transaksi' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400')} /> 
            Transaksi Saya
          </TabsTrigger>
          <TabsTrigger 
            value="paket" 
            className="w-full justify-center gap-2.5 h-11 md:h-12 rounded-xl font-black px-4 text-xs transition-all duration-300 border border-transparent data-active:bg-indigo-600 data-active:text-white data-active:shadow-md data-active:shadow-indigo-600/15 text-muted-foreground hover:text-foreground hover:bg-muted/60 whitespace-nowrap"
          >
            <Briefcase className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === 'paket' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400')} /> 
            Paket & Keanggotaan
          </TabsTrigger>
          <TabsTrigger 
            value="voucher" 
            className="w-full justify-center gap-2.5 h-11 md:h-12 rounded-xl font-black px-4 text-xs transition-all duration-300 border border-transparent data-active:bg-indigo-600 data-active:text-white data-active:shadow-md data-active:shadow-indigo-600/15 text-muted-foreground hover:text-foreground hover:bg-muted/60 whitespace-nowrap"
          >
            <Ticket className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === 'voucher' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400')} /> 
            Voucher Promo
          </TabsTrigger>
          <TabsTrigger 
            value="afiliasi" 
            className="w-full justify-center gap-2.5 h-11 md:h-12 rounded-xl font-black px-4 text-xs transition-all duration-300 border border-transparent data-active:bg-indigo-600 data-active:text-white data-active:shadow-md data-active:shadow-indigo-600/15 text-muted-foreground hover:text-foreground hover:bg-muted/60 whitespace-nowrap"
          >
            <Share2 className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === 'afiliasi' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400')} /> 
            Program Afiliasi
          </TabsTrigger>
          <TabsTrigger 
            value="survey" 
            className="w-full justify-center gap-2.5 h-11 md:h-12 rounded-xl font-black px-4 text-xs transition-all duration-300 border border-transparent data-active:bg-indigo-600 data-active:text-white data-active:shadow-md data-active:shadow-indigo-600/15 text-muted-foreground hover:text-foreground hover:bg-muted/60 whitespace-nowrap"
          >
            <GraduationCap className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === 'survey' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400')} /> 
            Survey Kelulusan
          </TabsTrigger>
        </TabsList>
 
        {/* Nav Tabs Contents */}
        <div className="w-full space-y-6">
 
          {/* TAB 1: ACCOUNT SETTINGS */}
          <TabsContent value="akun" className="space-y-6 outline-none">
            {/* Profile Info Form */}
            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-xl font-extrabold text-foreground">Detail Data Akun</CardTitle>
                <CardDescription className="text-sm">Pembaruan data diri Anda untuk disesuaikan pada sertifikat atau bukti tryout CPNS.</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-5 px-6 sm:px-8 pb-8 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5 col-span-1">
                      <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Alamat Email (Akun)</Label>
                      <Input id="email" type="email" value={profile?.email || ''} disabled className="bg-muted/40 text-muted-foreground border-border/80 h-11 rounded-xl" />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <Label htmlFor="fullName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Lengkap *</Label>
                      <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Contoh: Ahmad Rupiawan" className="border-border bg-card h-11 rounded-xl focus-visible:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <Label htmlFor="whatsapp" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nomor WhatsApp / Telp</Label>
                      <Input id="whatsapp" type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Contoh: 081234567890" className="border-border bg-card h-11 rounded-xl focus-visible:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <Label htmlFor="gender" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenis Kelamin</Label>
                      <select 
                        id="gender" 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-11 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 text-foreground [&_option]:bg-card [&_option]:text-foreground"
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="LAKI_LAKI">Laki-laki</option>
                        <option value="PEREMPUAN">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <Label htmlFor="province" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Provinsi</Label>
                      <Input id="province" type="text" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Contoh: Jawa Barat" className="border-border bg-card h-11 rounded-xl focus-visible:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <Label htmlFor="regency" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kabupaten / Kota</Label>
                      <Input id="regency" type="text" value={regency} onChange={(e) => setRegency(e.target.value)} placeholder="Contoh: Bogor" className="border-border bg-card h-11 rounded-xl focus-visible:ring-indigo-500" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/60 bg-muted/10 p-5 flex justify-end">
                  <Button type="submit" disabled={isUpdatingProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-600/15 transition-all duration-200">
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" /> Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Change Password Form */}
            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-xl font-extrabold text-foreground">Ubah Kata Sandi</CardTitle>
                <CardDescription className="text-sm">Ganti kata sandi akun Kawan ASN Anda secara teratur.</CardDescription>
              </CardHeader>
              <form onSubmit={handleChangePassword}>
                <CardContent className="space-y-5 px-6 sm:px-8 pb-8 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPass" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kata Sandi Baru</Label>
                      <Input id="newPass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className="border-border bg-card h-11 rounded-xl focus-visible:ring-indigo-500" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPass" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Konfirmasi Kata Sandi Baru</Label>
                      <Input id="confirmPass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi baru" className="border-border bg-card h-11 rounded-xl focus-visible:ring-indigo-500" required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/60 bg-muted/10 p-5 flex justify-end">
                  <Button type="submit" disabled={isChangingPassword} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-600/15 transition-all duration-200">
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" /> Memproses...
                      </>
                    ) : (
                      'Perbarui Kata Sandi'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* TAB 2: MY TRANSACTIONS */}
          <TabsContent value="transaksi" className="space-y-6 outline-none">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Riwayat Transaksi</CardTitle>
                <CardDescription>Catatan tagihan pembayaran pendaftaran tryout kelompok dan pembaruan lisensi premium.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <p className="text-sm font-medium">Belum ada riwayat transaksi pembayaran.</p>
                  </div>
                ) : (() => {
                  const totalTx = transactions.length;
                  const totalTxPages = Math.ceil(totalTx / txItemsPerPage);
                  // Adjust page if it gets out of bounds (e.g. after refresh/deletions)
                  const currentPage = Math.min(txPage, totalTxPages);
                  const paginatedTx = transactions.slice((currentPage - 1) * txItemsPerPage, currentPage * txItemsPerPage);

                  return (
                    <div className="space-y-4">
                      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {paginatedTx.map((tx) => (
                          <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                            <div className="space-y-1">
                              <p className="font-bold text-foreground">{tx.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.created_at).toLocaleString('id-ID', {
                                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })} | Metode: {tx.payment_method}
                              </p>
                            </div>
                            <div className="flex items-center sm:justify-end gap-3 shrink-0">
                              <p className="font-black text-foreground">
                                Rp {new Intl.NumberFormat('id-ID').format(tx.amount)}
                              </p>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                tx.status === 'SUCCESS'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : tx.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              }`}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalTxPages > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/60">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setTxPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="font-bold border-border rounded-lg h-9 px-4"
                          >
                            Sebelumnya
                          </Button>
                          <span className="text-xs font-bold text-muted-foreground">
                            Halaman {currentPage} dari {totalTxPages}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setTxPage(prev => Math.min(prev + 1, totalTxPages))}
                            disabled={currentPage === totalTxPages}
                            className="font-bold border-border rounded-lg h-9 px-4"
                          >
                            Selanjutnya
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PACKAGES & MEMBERSHIP */}
          <TabsContent value="paket" className="space-y-6 outline-none">

            {checkoutPackageId ? (
              <>
                <Button variant="outline" onClick={() => router.push('/tryout')} className="gap-2 font-bold border-border text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Tryout
                </Button>

                {isAlreadyEnrolled ? (
                  <Card className="bg-card border-emerald-500/30 shadow-md overflow-hidden relative border-2 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-indigo-500/[0.03]">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-emerald-500/20 via-transparent to-transparent rounded-bl-full pointer-events-none" />
                    <CardHeader>
                      <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" /> Pendaftaran Berhasil!
                      </CardTitle>
                      <CardDescription>Anda sudah terdaftar di tryout ini.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-6">
                      <div className="flex items-center gap-4 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0"><Ticket className="h-6 w-6" /></div>
                        <div>
                          <h4 className="font-black text-lg text-foreground">{checkoutPackage?.title || 'Paket Tryout'}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{checkoutPackage?.description || ''}</p>
                        </div>
                      </div>
                      <Button onClick={() => router.push('/tryout')} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 rounded-xl">Lihat Daftar Tryout</Button>
                    </CardContent>
                  </Card>

                ) : pendingTx ? (
                  <Card className="bg-card border-amber-500/30 shadow-md overflow-hidden relative border-2 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-indigo-500/[0.03]">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-amber-500/20 via-transparent to-transparent rounded-bl-full pointer-events-none" />
                    <CardHeader>
                      <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-amber-500 animate-pulse" /> Selesaikan Pembayaran Tiket
                      </CardTitle>
                      <CardDescription>Segera bayar untuk mendaftar tryout <strong>{checkoutPackage?.title || ''}</strong>.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 border border-border rounded-xl">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold">Total Pembayaran</p>
                          <h3 className="text-2xl font-black text-foreground">Rp {new Intl.NumberFormat('id-ID').format(pendingTx.amount)}</h3>
                          <p className="text-[10px] text-muted-foreground mt-1">ID: {pendingTx.id}</p>
                        </div>
                        <span className="px-3 py-1 text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">Menunggu Pembayaran</span>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="space-y-1 text-center sm:text-left">
                          <p className="text-xs font-semibold text-muted-foreground">Batas Waktu (24 Jam)</p>
                          <p className="text-sm font-bold text-foreground">Bayar sebelum: {new Date(new Date(pendingTx.created_at).getTime() + 86400000).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-center shrink-0">
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Sisa Waktu</p>
                          <p className="text-lg font-black font-mono text-amber-500">{timeLeft}</p>
                        </div>
                      </div>
                      {pendingTx.payment_method === 'QRIS' ? (
                        <div className="text-center space-y-4 max-w-sm mx-auto">
                          <p className="text-sm font-bold text-foreground">Pindai Kode QRIS:</p>
                          {pendingTx.payment_detail ? (
                            <div className="bg-white p-4 rounded-2xl w-fit mx-auto border border-border shadow-sm"><img src={pendingTx.payment_detail} alt="QRIS" className="w-56 h-56 mx-auto object-contain" /></div>
                          ) : (
                            <div className="flex flex-col items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><p className="text-xs text-muted-foreground mt-2">Menghasilkan QRIS...</p></div>
                          )}
                          <p className="text-xs text-muted-foreground">Gunakan GoPay, OVO, Dana, LinkAja, ShopeePay atau Mobile Banking.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-md mx-auto">
                          <div className="p-4 border border-border rounded-xl space-y-3 bg-muted/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-muted-foreground uppercase">BANK TRANSFER</span>
                              <span className="font-black text-sm uppercase text-indigo-600 dark:text-indigo-400 font-mono">{pendingTx.bank_name || pendingTx.payment_method}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Nomor Virtual Account (VA)</p>
                              <div className="flex gap-2">
                                <span className="w-full bg-muted border border-border rounded-lg h-10 px-3 py-2 text-sm font-bold font-mono tracking-wider text-foreground flex items-center select-all">{pendingTx.payment_detail || 'Memproses...'}</span>
                                {pendingTx.payment_detail && (<Button onClick={() => { navigator.clipboard.writeText(pendingTx.payment_detail); toast.success('VA disalin!'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4">Salin</Button>)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                            <p className="font-bold text-foreground">Langkah transfer:</p>
                            <ol className="list-decimal list-inside space-y-1.5 pl-1">
                              <li>Buka m-Banking atau ATM.</li>
                              <li>Pilih <strong className="text-foreground">Transfer</strong> ke <strong className="text-foreground">Virtual Account</strong>.</li>
                              <li>Masukkan nomor VA di atas.</li>
                              <li>Periksa nominal <strong className="text-foreground">Rp {new Intl.NumberFormat('id-ID').format(pendingTx.amount)}</strong>.</li>
                              <li>Selesaikan. Anda otomatis terdaftar di tryout.</li>
                            </ol>
                          </div>
                        </div>
                      )}
                      <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-end items-center gap-3">
                        <Button onClick={() => handleSimulatePaymentSuccess(pendingTx.id)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl px-6">Simulasi Bayar Sukses</Button>
                        <Button onClick={() => handleCancelPayment(pendingTx.id)} disabled={isCancellingCheckout} variant="outline" className="w-full sm:w-auto border-rose-500/30 text-rose-500 hover:bg-rose-500/5 font-bold h-10 rounded-xl px-6">
                          {isCancellingCheckout ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Membatalkan...</>) : 'Batalkan Tagihan'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                ) : (
                  <Card className="bg-card border-indigo-500/30 shadow-md overflow-hidden relative border-2 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-amber-500/[0.03]">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-indigo-500/20 via-transparent to-transparent rounded-bl-full pointer-events-none" />
                    <CardHeader>
                      <CardTitle className="text-xl font-black text-foreground flex items-center gap-2">
                        <Ticket className="h-6 w-6 text-indigo-500" /> Beli Tiket: {checkoutPackage?.title || 'Memuat...'}
                      </CardTitle>
                      <CardDescription>{checkoutPackage?.description || 'Selesaikan pembayaran untuk mendaftar.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-6">
                      {checkoutPackage && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold bg-muted/30 border border-border p-4 rounded-xl">
                          <div className="flex flex-col space-y-1"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Durasi</span><span className="text-foreground text-sm">{checkoutPackage.duration_minutes} Menit</span></div>
                          <div className="flex flex-col space-y-1"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Soal</span><span className="text-foreground text-sm">{checkoutPackage.total_questions} Soal</span></div>
                          <div className="flex flex-col space-y-1"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Kategori</span><span className="text-foreground text-sm">{checkoutPackage.category || 'KELOMPOK'}</span></div>
                          <div className="flex flex-col space-y-1"><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Harga</span><span className="text-foreground text-sm font-black">Rp {new Intl.NumberFormat('id-ID').format(checkoutPackage.price || 0)}</span></div>
                        </div>
                      )}
                      <div className="pt-4 border-t border-border space-y-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase">1. Pilih Metode Pembayaran</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button type="button" onClick={() => setPaymentType('bank_transfer')} className={cn("flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer", paymentType === 'bank_transfer' ? "bg-indigo-600/10 border-indigo-500 text-foreground ring-1 ring-indigo-500/20" : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground")}>
                            <div className="space-y-1"><p className="text-sm font-bold">Virtual Account Bank</p><p className="text-[10px] opacity-75">BCA, BNI, atau BRI</p></div>
                            <CreditCard className="h-5 w-5" />
                          </button>
                          <button type="button" onClick={() => setPaymentType('qris')} className={cn("flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer", paymentType === 'qris' ? "bg-indigo-600/10 border-indigo-500 text-foreground ring-1 ring-indigo-500/20" : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground")}>
                            <div className="space-y-1"><p className="text-sm font-bold">QRIS E-Wallet</p><p className="text-[10px] opacity-75">GoPay, OVO, ShopeePay</p></div>
                            <QrCode className="h-5 w-5" />
                          </button>
                        </div>
                        {paymentType === 'bank_transfer' && (
                          <div className="p-3 border border-border bg-muted/20 rounded-xl space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Pilih Bank:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {['bca', 'bni', 'bri'].map((b) => (<button key={b} type="button" onClick={() => setSelectedBank(b as any)} className={cn("py-2 px-3 text-xs font-black rounded-lg border text-center transition-all uppercase font-mono tracking-wider cursor-pointer", selectedBank === b ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40")}>{b}</button>))}
                            </div>
                          </div>
                        )}
                        <div className="pt-3 border-t border-border/60 space-y-2">
                          <p className="text-xs font-bold text-muted-foreground uppercase">2. Voucher Promo (Opsional)</p>
                          <div className="flex gap-2 max-w-md">
                            <Input type="text" placeholder="Masukkan kode voucher" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} disabled={!!appliedVoucher} className="border-border bg-transparent font-mono tracking-wider text-sm h-10" />
                            {appliedVoucher ? (<Button type="button" onClick={handleRemoveVoucher} className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-4 shrink-0">Hapus</Button>) : (<Button type="button" onClick={handleApplyVoucher} disabled={isApplyingVoucher || !promoCode.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 shrink-0">{isApplyingVoucher ? 'Memeriksa...' : 'Gunakan'}</Button>)}
                          </div>
                          {appliedVoucher && (<p className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Voucher {appliedVoucher.code} diterapkan! Potongan: {appliedVoucher.discount_percent > 0 ? `${appliedVoucher.discount_percent}%` : `Rp ${new Intl.NumberFormat('id-ID').format(appliedVoucher.discount_nominal)}`}</p>)}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-foreground">Rp {new Intl.NumberFormat('id-ID').format(displayTotalPrice)}</span>
                            {displayDiscount > 0 && (<span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">Diskon {appliedVoucher.discount_percent > 0 ? `${appliedVoucher.discount_percent}%` : `Rp ${new Intl.NumberFormat('id-ID').format(appliedVoucher.discount_nominal)}`}</span>)}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">*Termasuk biaya {paymentType === 'bank_transfer' ? 'VA (Rp 4.500)' : `QRIS (Rp ${new Intl.NumberFormat('id-ID').format(Math.floor((displayBasePrice - displayDiscount) * 0.007))})`}{displayDiscount > 0 && ` dan potongan voucher ${appliedVoucher.code}`}.</p>
                        </div>
                        <Button onClick={handleUpgradeNow} disabled={isProcessingCheckout} className="w-full sm:w-auto font-black bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-8 h-11 rounded-xl shadow-lg shadow-indigo-500/15">
                          {isProcessingCheckout ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Memproses...</>) : 'Bayar & Daftar Sekarang'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                <Card className={`overflow-hidden relative border rounded-2xl shadow-sm transition-all duration-300 ${
                  profile?.subscription_status === 'PREMIUM'
                    ? 'bg-gradient-to-br from-amber-500/[0.04] via-card to-yellow-500/[0.01] border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.03)]'
                    : 'bg-card border-border'
                }`}>
                  <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-amber-500/10 to-indigo-500/5 rounded-bl-full pointer-events-none" />
                  <CardHeader className="p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                          <Crown className="h-5 w-5 text-amber-500" /> Status Keanggotaan
                        </CardTitle>
                        <CardDescription className="text-sm">Status lisensi akun Kawan ASN Anda saat ini.</CardDescription>
                      </div>
                      {profile?.subscription_status === 'PREMIUM' && (
                        <span className="shrink-0 px-3 py-1 text-[10px] tracking-wider font-extrabold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full uppercase animate-pulse">
                          PREMIUM AKTIF
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 sm:px-8 pb-8 pt-0 space-y-5">
                    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 border rounded-2xl ${
                      profile?.subscription_status === 'PREMIUM'
                        ? 'border-amber-500/15 bg-amber-500/[0.03]'
                        : 'border-border bg-muted/20'
                    }`}>
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        profile?.subscription_status === 'PREMIUM' 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        <Crown className="h-6 w-6" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-lg text-foreground">
                          Layanan Akun: {profile?.subscription_status}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {profile?.subscription_status === 'PREMIUM' 
                            ? 'Selamat! Anda memiliki akses penuh tanpa batas ke seluruh modul materi premium dan seluruh tryout CAT acak mandiri.' 
                            : 'Akses gratis terbatas. Aktifkan lisensi Premium untuk mendapatkan akses penuh ke bank soal materi dan tryout lengkap.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                        *Gunakan tombol simulasi di samping jika Anda ingin mencoba berpindah status keanggotaan untuk keperluan uji coba fitur.
                      </p>
                      <Button 
                        onClick={togglePremiumDemo} 
                        className="font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 h-11 rounded-xl shadow-sm shrink-0 transition-all duration-200"
                      >
                        Simulasi: {profile?.subscription_status === 'PREMIUM' ? 'FREE' : 'PREMIUM'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {profile?.subscription_status === 'FREE' && pendingTx ? (
                  <Card className="bg-card border-amber-500/30 shadow-md overflow-hidden relative border-2 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-indigo-500/[0.03]">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-amber-500/20 via-transparent to-transparent rounded-bl-full pointer-events-none" />
                    <CardHeader>
                      <CardTitle className="text-xl font-black text-foreground flex items-center gap-2"><AlertCircle className="h-6 w-6 text-amber-500 animate-pulse" /> Selesaikan Pembayaran</CardTitle>
                      <CardDescription>Segera bayar untuk mengaktifkan PREMIUM.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 border border-border rounded-xl">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold">Total Pembayaran</p>
                          <h3 className="text-2xl font-black text-foreground">Rp {new Intl.NumberFormat('id-ID').format(pendingTx.amount)}</h3>
                          <p className="text-[10px] text-muted-foreground mt-1">ID: {pendingTx.id}</p>
                        </div>
                        <span className="px-3 py-1 text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse">Menunggu Pembayaran</span>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="space-y-1 text-center sm:text-left">
                          <p className="text-xs font-semibold text-muted-foreground">Batas Waktu (24 Jam)</p>
                          <p className="text-sm font-bold text-foreground">Bayar sebelum: {new Date(new Date(pendingTx.created_at).getTime() + 86400000).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-center shrink-0">
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Sisa Waktu</p>
                          <p className="text-lg font-black font-mono text-amber-500">{timeLeft}</p>
                        </div>
                      </div>
                      {pendingTx.payment_method === 'QRIS' ? (
                        <div className="text-center space-y-4 max-w-sm mx-auto">
                          <p className="text-sm font-bold text-foreground">Pindai Kode QRIS:</p>
                          {pendingTx.payment_detail ? (<div className="bg-white p-4 rounded-2xl w-fit mx-auto border border-border shadow-sm"><img src={pendingTx.payment_detail} alt="QRIS" className="w-56 h-56 mx-auto object-contain" /></div>) : (<div className="flex flex-col items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><p className="text-xs text-muted-foreground mt-2">Menghasilkan QRIS...</p></div>)}
                          <p className="text-xs text-muted-foreground">Gunakan GoPay, OVO, Dana, LinkAja, ShopeePay atau Mobile Banking.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-md mx-auto">
                          <div className="p-4 border border-border rounded-xl space-y-3 bg-muted/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-muted-foreground uppercase">BANK TRANSFER</span>
                              <span className="font-black text-sm uppercase text-indigo-600 dark:text-indigo-400 font-mono">{pendingTx.bank_name || pendingTx.payment_method}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Nomor Virtual Account (VA)</p>
                              <div className="flex gap-2">
                                <span className="w-full bg-muted border border-border rounded-lg h-10 px-3 py-2 text-sm font-bold font-mono tracking-wider text-foreground flex items-center select-all">{pendingTx.payment_detail || 'Memproses...'}</span>
                                {pendingTx.payment_detail && (<Button onClick={() => { navigator.clipboard.writeText(pendingTx.payment_detail); toast.success('VA disalin!'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4">Salin</Button>)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                            <p className="font-bold text-foreground">Langkah transfer:</p>
                            <ol className="list-decimal list-inside space-y-1.5 pl-1">
                              <li>Buka m-Banking atau ATM.</li>
                              <li>Pilih <strong className="text-foreground">Transfer</strong> ke <strong className="text-foreground">Virtual Account</strong>.</li>
                              <li>Masukkan nomor VA di atas.</li>
                              <li>Periksa nominal <strong className="text-foreground">Rp {new Intl.NumberFormat('id-ID').format(pendingTx.amount)}</strong>.</li>
                              <li>Selesaikan. Akun akan otomatis PREMIUM.</li>
                            </ol>
                          </div>
                        </div>
                      )}
                      <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-end items-center gap-3">
                        <Button onClick={() => handleCancelPayment(pendingTx.id)} disabled={isCancellingCheckout} variant="outline" className="w-full sm:w-auto border-rose-500/30 text-rose-500 hover:bg-rose-500/5 font-bold h-10 rounded-xl px-6">
                          {isCancellingCheckout ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Membatalkan...</>) : 'Batalkan Tagihan'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : profile?.subscription_status === 'FREE' && (
                  <Card className="bg-card border-amber-500/30 shadow-md overflow-hidden relative border-2 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-indigo-500/[0.03]">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-amber-500/20 via-transparent to-transparent rounded-bl-full pointer-events-none" />
                    <CardHeader>
                      <CardTitle className="text-xl font-black text-foreground flex items-center gap-2"><Crown className="h-6 w-6 text-amber-500 animate-pulse" /> Upgrade ke Premium Kawan ASN!</CardTitle>
                      <CardDescription>Dapatkan akses penuh ke semua fitur simulasi CAT dan materi berkualitas tinggi.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold">
                        <div className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Akses Seluruh Modul Materi</div>
                        <div className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Latihan Soal Tanpa Batas</div>
                        <div className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Pembahasan Soal Lengkap</div>
                        <div className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Fitur Kunci & Kriteria</div>
                        <div className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Prioritas Komunitas & BKN</div>
                        <div className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Bebas Iklan & Selamanya</div>
                      </div>
                      <div className="pt-4 border-t border-border space-y-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase">1. Pilih Metode Pembayaran</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button type="button" onClick={() => setPaymentType('bank_transfer')} className={cn("flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer", paymentType === 'bank_transfer' ? "bg-indigo-600/10 border-indigo-500 text-foreground ring-1 ring-indigo-500/20" : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground")}>
                            <div className="space-y-1"><p className="text-sm font-bold">Virtual Account Bank</p><p className="text-[10px] opacity-75">BCA, BNI, atau BRI</p></div>
                            <CreditCard className="h-5 w-5" />
                          </button>
                          <button type="button" onClick={() => setPaymentType('qris')} className={cn("flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer", paymentType === 'qris' ? "bg-indigo-600/10 border-indigo-500 text-foreground ring-1 ring-indigo-500/20" : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground")}>
                            <div className="space-y-1"><p className="text-sm font-bold">QRIS E-Wallet</p><p className="text-[10px] opacity-75">GoPay, OVO, ShopeePay, dll</p></div>
                            <QrCode className="h-5 w-5" />
                          </button>
                        </div>
                        {paymentType === 'bank_transfer' && (
                          <div className="p-3 border border-border bg-muted/20 rounded-xl space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Pilih Bank:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {['bca', 'bni', 'bri'].map((b) => (<button key={b} type="button" onClick={() => setSelectedBank(b as any)} className={cn("py-2 px-3 text-xs font-black rounded-lg border text-center transition-all uppercase font-mono tracking-wider cursor-pointer", selectedBank === b ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40")}>{b}</button>))}
                            </div>
                          </div>
                        )}
                        <div className="pt-3 border-t border-border/60 space-y-2">
                          <p className="text-xs font-bold text-muted-foreground uppercase">2. Voucher Promo (Opsional)</p>
                          <div className="flex gap-2 max-w-md">
                            <Input type="text" placeholder="Masukkan kode voucher (contoh: DISKON30)" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} disabled={!!appliedVoucher} className="border-border bg-transparent font-mono tracking-wider text-sm h-10" />
                            {appliedVoucher ? (<Button type="button" onClick={handleRemoveVoucher} className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-4 shrink-0">Hapus</Button>) : (<Button type="button" onClick={handleApplyVoucher} disabled={isApplyingVoucher || !promoCode.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 shrink-0">{isApplyingVoucher ? 'Memeriksa...' : 'Gunakan'}</Button>)}
                          </div>
                          {appliedVoucher && (<p className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Voucher {appliedVoucher.code} berhasil diterapkan! Potongan: {appliedVoucher.discount_percent > 0 ? `${appliedVoucher.discount_percent}%` : `Rp ${new Intl.NumberFormat('id-ID').format(appliedVoucher.discount_nominal)}`}</p>)}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground line-through">Rp 299.000</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-foreground">Rp {new Intl.NumberFormat('id-ID').format(displayTotalPrice)}</span>
                            {displayDiscount > 0 ? (<span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">Diskon {appliedVoucher.discount_percent > 0 ? `${appliedVoucher.discount_percent}%` : `Rp ${new Intl.NumberFormat('id-ID').format(appliedVoucher.discount_nominal)}`}</span>) : (<span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">Diskon 50%</span>)}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">*Termasuk biaya {paymentType === 'bank_transfer' ? 'VA (Rp 4.500)' : `QRIS (Rp ${new Intl.NumberFormat('id-ID').format(Math.floor((displayBasePrice - displayDiscount) * 0.007))})`}{displayDiscount > 0 && ` dan potongan voucher ${appliedVoucher.code} (Rp ${new Intl.NumberFormat('id-ID').format(displayDiscount)})`}.</p>
                        </div>
                        <Button onClick={handleUpgradeNow} disabled={isProcessingCheckout} className="w-full sm:w-auto font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-8 h-11 rounded-xl shadow-lg shadow-amber-500/15">
                          {isProcessingCheckout ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Memproses...</>) : 'Upgrade Sekarang'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* My Packages (Enrolled Tryouts) */}
            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden mt-6">
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-xl font-extrabold text-foreground">Paket Ujian Saya</CardTitle>
                <CardDescription className="text-sm">Daftar simulasi Tryout Kelompok (tiket pendaftaran terdaftar) Anda.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 pt-0">
                {isLoadingEnrollments ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/15 border border-dashed border-border rounded-2xl space-y-2">
                    <Ticket className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <p className="text-sm font-bold text-foreground">Belum ada tiket tryout kelompok</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">Anda belum membeli atau mendaftar di paket tryout kelompok manapun saat ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {enrollments.map((enr: any) => {
                      const attempt = attempts.find((a: any) => a.exam_id === enr.package_id);
                      const isFinished = attempt && attempt.status !== 'IN_PROGRESS';
                      const isInProgress = attempt && attempt.status === 'IN_PROGRESS';
                      return (
                        <div 
                          key={enr.id} 
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm bg-muted/20 border border-border/80 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                              isFinished
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : isInProgress
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                            }`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="font-extrabold text-foreground truncate">{enr.packages?.title || 'Paket Tryout'}</h4>
                              <p className="text-xs text-muted-foreground">
                                Terdaftar: {new Date(enr.enrolled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {isFinished ? (
                              <Button 
                                onClick={() => router.push(`/tryout/${enr.package_id}/result?attemptId=${attempt.id}`)} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-emerald-600/15 transition-all duration-200"
                              >
                                Lihat Hasil (Skor: {attempt.score_total})
                              </Button>
                            ) : isInProgress ? (
                              <Button 
                                onClick={() => router.push(`/tryout/${enr.package_id}/exam`)} 
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-10 px-5 text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-amber-500/15 transition-all duration-200"
                              >
                                Lanjutkan Ujian
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => router.push(`/tryout/${enr.package_id}/instruction`)} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 text-xs rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-600/15 transition-all duration-200"
                              >
                                Mulai Kerjakan
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: PROMO VOUCHERS */}
          <TabsContent value="voucher" className="space-y-6 outline-none">
            {/* List Active Vouchers */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Voucher Promo Aktif</CardTitle>
                <CardDescription>Kode promo yang dapat Anda gunakan di dalam sistem.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingVouchers ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : dbVouchers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <Ticket className="h-10 w-10 mx-auto text-muted-foreground/30" />
                    <p className="text-sm font-medium">Tidak ada voucher promo aktif saat ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dbVouchers.map((vc) => {
                      const isNominal = vc.discount_nominal > 0;
                      const discountStr = isNominal 
                        ? `Potongan Rp ${new Intl.NumberFormat('id-ID').format(vc.discount_nominal)}` 
                        : `Diskon ${vc.discount_percent}%`;
                      
                      const expiryText = vc.valid_until 
                        ? `Berlaku hingga: ${new Date(vc.valid_until).toLocaleDateString('id-ID')}`
                        : 'Berlaku selamanya';

                      const quotaText = vc.max_usages !== null
                        ? `Sisa Kuota: ${vc.max_usages - vc.used_count} kali`
                        : 'Kuota tidak terbatas';

                      return (
                        <div key={vc.id || vc.code} className="border border-border rounded-2xl p-4 bg-muted/10 relative overflow-hidden flex flex-col justify-between h-36 group">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 font-mono tracking-wider border border-indigo-600/30 px-2 py-0.5 rounded bg-indigo-500/5">
                                {vc.code}
                              </span>
                              <button 
                                onClick={() => handleCopyToClipboard(vc.code)}
                                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                                title="Salin Kode"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-bold text-foreground">
                              {discountStr}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {quotaText}
                            </p>
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground border-t border-border pt-1.5 flex justify-between">
                            <span>Status: AKTIF</span>
                            <span>{expiryText}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: AFFILIATE PROGRAM */}
          <TabsContent value="afiliasi" className="space-y-6 outline-none">
            {affiliateAccount ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden hover:border-indigo-500/20 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rujukan Sign-Up</p>
                        <h3 className="text-3xl font-extrabold text-foreground">{referralsList.length} Orang</h3>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden hover:border-indigo-500/20 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Komisi</p>
                        <h3 className="text-3xl font-extrabold text-foreground">
                          Rp {new Intl.NumberFormat('id-ID').format(
                            referralsList.reduce((acc, cur) => acc + cur.commission_earned, 0)
                          )}
                        </h3>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden hover:border-indigo-500/20 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Saldo Sekarang</p>
                        <h3 className="text-3xl font-extrabold text-foreground">
                          Rp {new Intl.NumberFormat('id-ID').format(affiliateAccount.balance)}
                        </h3>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Crown className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden mt-6">
                  <CardHeader className="p-6 sm:p-8">
                    <CardTitle className="text-xl font-extrabold text-foreground">Tautan & Kode Referal Anda</CardTitle>
                    <CardDescription className="text-sm">Bagikan kode kemitraan rujukan Anda ke teman-teman seperjuangan belajar.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 sm:px-8 pb-8 pt-0">
                    <div className="space-y-2 max-w-md">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kode Referral</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={affiliateAccount.referral_code} className="bg-muted/40 text-foreground border-border/80 font-mono tracking-wider font-extrabold text-sm h-11 rounded-xl focus-visible:ring-indigo-500" />
                        <Button 
                          onClick={() => handleCopyToClipboard(affiliateAccount.referral_code)} 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl px-6 shadow-sm hover:shadow-lg hover:shadow-indigo-600/15 transition-all duration-200 flex items-center gap-2"
                        >
                          {copiedCode ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
                          {copiedCode ? 'Disalin' : 'Salin'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden mt-6">
                  <CardHeader className="p-6 sm:p-8">
                    <CardTitle className="text-xl font-extrabold text-foreground">Daftar Pengguna Terdaftar</CardTitle>
                    <CardDescription className="text-sm">Daftar teman rujukan yang mendaftar menggunakan link rujukan Anda.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 sm:px-8 pb-8 pt-0">
                    {isLoadingReferrals ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      </div>
                    ) : referralsList.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-muted/15 border border-dashed border-border rounded-2xl p-8 space-y-2">
                        <User className="h-10 w-10 mx-auto text-muted-foreground/30" />
                        <p className="text-sm font-bold text-foreground">Belum ada pengguna terdaftar</p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">Pengguna yang mendaftar melalui tautan Anda akan tertera di sini.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {referralsList.map((ref) => (
                          <div key={ref.id} className="p-4 sm:p-5 flex items-center justify-between text-sm bg-muted/20 border border-border/80 rounded-2xl hover:border-indigo-500/30 transition-all duration-300">
                            <div className="space-y-1">
                              <p className="font-extrabold text-foreground">{ref.profiles?.full_name || 'Peserta Baru'}</p>
                              <p className="text-xs text-muted-foreground">
                                Gabung:{' '}
                                {new Date(ref.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'long', year: 'numeric'
                                })}
                              </p>
                            </div>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                              +Rp {new Intl.NumberFormat('id-ID').format(ref.commission_earned)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-card border-border shadow-sm text-center py-10 px-6 rounded-2xl overflow-hidden border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.02] to-transparent">
                <CardHeader className="flex flex-col items-center">
                  <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 p-4 rounded-2xl w-fit mb-4 border border-indigo-500/20">
                    <Share2 className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-2xl font-black text-foreground">Program Kemitraan Afiliasi</CardTitle>
                  <CardDescription className="max-w-md mx-auto pt-2 text-sm">
                    Dapatkan komisi sebesar Rp 10.000 untuk setiap teman yang mendaftar dan membeli tiket Tryout Kelompok Premium menggunakan kode rujukan unik Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button 
                    onClick={handleGenerateReferralCode} 
                    disabled={isGeneratingAffCode}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 shadow-sm hover:shadow-lg hover:shadow-indigo-600/15 rounded-xl transition-all duration-200"
                  >
                    {isGeneratingAffCode ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" /> Mengaktifkan...
                      </>
                    ) : 'Aktifkan Program Kemitraan'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 6: GRADUATION SURVEY */}
          <TabsContent value="survey" className="space-y-6 outline-none">
            {isLoadingSurvey ? (
              <Card className="bg-card border-border shadow-sm py-12 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </Card>
            ) : userSurvey ? (
              /* If already filled graduation survey */
              <Card className="bg-card border-border shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Survey Kelulusan CPNS / PPPK
                  </CardTitle>
                  <CardDescription>Anda telah mengisi survey testimoni kelulusan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl text-sm leading-relaxed text-foreground">
                    🎉 <strong>Selamat atas pencapaian Anda!</strong> Terima kasih atas partisipasi Anda mengisi survey kelulusan di Kawan ASN. Testimoni Anda sangat berarti bagi pengembangan kualitas sistem tryout kami ke depannya.
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold bg-muted/40 border border-border p-4 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase">Hasil Kelulusan</span>
                      <p className="text-foreground text-sm font-bold">
                        {userSurvey.is_graduated ? 'LOLOS SELEKSI' : 'BELUM LOLOS'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase">Instansi Target</span>
                      <p className="text-foreground text-sm font-bold">{userSurvey.target_agency}</p>
                    </div>
                    <div className="space-y-0.5 pt-2 border-t border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase">Skor SKD</span>
                      <p className="text-foreground text-sm font-black font-mono">{userSurvey.skd_score || '-'}</p>
                    </div>
                    <div className="space-y-0.5 pt-2 border-t border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase">Rating Layanan</span>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-3.5 w-3.5",
                              star <= (userSurvey.rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                        <span className="text-[10px] text-muted-foreground font-bold ml-1">
                          ({userSurvey.rating || 5}/5)
                        </span>
                      </div>
                    </div>
                    {userSurvey.feedback && (
                      <div className="space-y-0.5 col-span-2 pt-2 border-t border-border/60">
                        <span className="text-[10px] text-muted-foreground uppercase">Feedback & Testimoni</span>
                        <p className="text-foreground text-xs leading-relaxed font-normal italic pt-1">
                          "{userSurvey.feedback}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Fill Survey form */
              <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="p-6 sm:p-8">
                  <CardTitle className="text-xl font-extrabold text-foreground">Survey Kelulusan Seleksi CAT</CardTitle>
                  <CardDescription className="text-sm">
                    Isi hasil seleksi CPNS/PPPK Anda untuk membantu kami menyempurnakan performa simulasi tryout.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSaveSurvey}>
                  <CardContent className="space-y-5 px-6 sm:px-8 pb-8 pt-0">
                    {/* Graduation status */}
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Apakah Anda Lolos Seleksi? *</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setIsGraduated(true)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                            isGraduated === true
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                              : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                          )}
                        >
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">Ya, Lolos CPNS / PPPK</p>
                            <p className="text-[10px] opacity-75">Selamat atas keberhasilan seleksi Anda!</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsGraduated(false)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                            isGraduated === false
                              ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20"
                              : "bg-muted/10 border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                          )}
                        >
                          <XCircle className="h-5 w-5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">Belum Lolos Tahun Ini</p>
                            <p className="text-[10px] opacity-75">Tetap semangat, mari berjuang kembali!</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Agency and Score */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="target" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Instansi Seleksi *</Label>
                        <Input 
                          id="target" 
                          type="text" 
                          value={targetAgency} 
                          onChange={(e) => setTargetAgency(e.target.value)} 
                          placeholder="Contoh: Kejaksaan Agung RI" 
                          className="border-border bg-card h-11 rounded-xl focus-visible:ring-indigo-500"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="score" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Skor SKD Kumulatif (opsional)</Label>
                        <Input 
                          id="score" 
                          type="number" 
                          value={skdScore} 
                          onChange={(e) => setSkdScore(e.target.value)} 
                          placeholder="Contoh: 388" 
                          className="border-border bg-card h-11 rounded-xl focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Rating Input */}
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rating Layanan Kami *</Label>
                      <div className="flex items-center gap-2 bg-muted/20 border border-border p-4.5 rounded-2xl w-fit">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoverRating ?? rating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(null)}
                              className="text-2xl transition-transform duration-100 hover:scale-125 focus:outline-none cursor-pointer"
                            >
                              <Star
                                className={cn(
                                  "h-8 w-8 transition-colors duration-150",
                                  isFilled 
                                    ? "fill-amber-400 text-amber-400" 
                                    : "text-muted-foreground/35 hover:text-amber-400"
                                )}
                              />
                            </button>
                          );
                        })}
                        <span className="text-xs font-black text-foreground ml-3 uppercase tracking-wider bg-card px-2.5 py-1 rounded-lg border border-border">
                          {rating === 5 ? 'Sangat Baik' : rating === 4 ? 'Baik' : rating === 3 ? 'Cukup' : rating === 2 ? 'Buruk' : 'Sangat Buruk'}
                        </span>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-1.5">
                      <Label htmlFor="feedbackText" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Testimoni & Feedback Belajar</Label>
                      <textarea 
                        id="feedbackText" 
                        rows={4} 
                        value={feedback} 
                        onChange={(e) => setFeedback(e.target.value)} 
                        placeholder="Berikan feedback atau pesan kesan selama Anda berlatih tryout CAT menggunakan platform Kawan ASN..."
                        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-muted-foreground/60 transition-all duration-200"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/60 bg-muted/10 p-5 flex justify-end">
                    <Button type="submit" disabled={isSubmittingSurvey} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 rounded-xl shadow-sm hover:shadow-lg hover:shadow-indigo-600/15 transition-all duration-200">
                      {isSubmittingSurvey ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" /> Mengirim...
                        </>
                      ) : (
                        'Kirim Survey Kelulusan'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}

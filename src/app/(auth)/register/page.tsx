'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, ArrowLeft, Loader2, User, Mail, Phone, Lock, Ticket } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { registerSchema, RegisterInput } from '@/lib/validations';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { LogoIcon } from '@/components/logo';

export default function RegisterPage() {
  const router = useRouter();
  const setProfile = useAuthStore((state) => state.setProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsSubmitting(true);
    try {
      // 1. Sign up user on Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            whatsapp: data.whatsapp,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Terjadi kesalahan saat registrasi.');
      }

      // 2. If referral code is provided, look up the affiliate and create a referral record
      if (data.referralCode && data.referralCode.trim() !== '') {
        try {
          const { data: affiliateData } = await supabase
            .from('affiliates')
            .select('user_id')
            .eq('referral_code', data.referralCode.trim().toUpperCase())
            .single();

          if (affiliateData) {
            // Insert referral record linking referee to referrer
            await supabase.from('referrals').insert({
              referrer_id: affiliateData.user_id,
              referee_id: authData.user.id,
              commission_earned: 0,
            });
          }
        } catch {
          // Silently fail – referral code might be invalid, but registration should still succeed
          console.warn('Referral code lookup failed, continuing registration.');
        }
      }

      // 3. Since auth.users is created, the PostgreSQL trigger 'on_auth_user_created'
      // will automatically insert the record to public.profiles.
      // Let's create a temporary client profile so they can enter the dashboard immediately.
      const clientProfile = {
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        role: 'user' as const,
        subscription_status: 'FREE' as const,
        created_at: new Date().toISOString(),
        whatsapp: data.whatsapp,
      };

      setProfile(clientProfile);
      toast.success('Pendaftaran berhasil! Selamat datang di Kawan ASN.');
      router.push('/dashboard');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Gagal mendaftarkan akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-[#090D16] dark:bg-gradient-to-tr dark:from-[#090D16] dark:via-[#0F172A] dark:to-[#17153B] flex flex-col justify-center items-center p-4 transition-colors duration-300 overflow-hidden">
      {/* Decorative ambient background blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs font-bold text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-all flex items-center gap-2 border border-gray-300 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-xl px-4.5 py-2 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
      </Link>
 
      <Card className="w-full max-w-2xl border-gray-200 dark:border-white/[0.12] bg-white dark:bg-[#1E293B] shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden relative mt-12 mb-12">
        <CardHeader className="space-y-4 text-center p-6 sm:p-8">
          <LogoIcon size={56} disableDarkInvert={true} className="mx-auto" />
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Daftar Kawan ASN</CardTitle>
            <CardDescription className="text-gray-500 dark:text-slate-400 text-sm">Mulai langkah sukses Anda menjadi ASN hari ini</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 px-6 sm:px-8 pb-8 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="fullName" className="text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Budi Santoso"
                    className="pl-10.5 h-11 bg-gray-50 dark:bg-slate-800/80 border-gray-300 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-rose-500 font-medium mt-1">{errors.fullName.message}</p>}
              </div>
 
              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    className="pl-10.5 h-11 bg-gray-50 dark:bg-slate-800/80 border-gray-300 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-500 font-medium mt-1">{errors.email.message}</p>}
              </div>
 
              {/* WhatsApp Field */}
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nomor WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                  <Input
                    id="whatsapp"
                    type="text"
                    placeholder="081234567890"
                    className="pl-10.5 h-11 bg-gray-50 dark:bg-slate-800/80 border-gray-300 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500"
                    {...register('whatsapp')}
                  />
                </div>
                {errors.whatsapp && <p className="text-xs text-rose-500 font-medium mt-1">{errors.whatsapp.message}</p>}
              </div>
 
              {/* Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    className="pl-10.5 h-11 bg-gray-50 dark:bg-slate-800/80 border-gray-300 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="text-xs text-rose-500 font-medium mt-1">{errors.password.message}</p>}
              </div>
 
              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ulangi password"
                    className="pl-10.5 h-11 bg-gray-50 dark:bg-slate-800/80 border-gray-300 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-500 font-medium mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-slate-600/30">
              <Label htmlFor="referralCode" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Kode Referral (Opsional)
              </Label>
              <div className="relative">
                <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="Masukkan kode referral teman Anda"
                  className="pl-10.5 h-11 bg-gray-50 dark:bg-slate-800/80 border-gray-300 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500 uppercase tracking-wider font-mono font-bold placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
                  {...register('referralCode')}
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Punya kode referral dari teman? Masukkan di sini untuk mendapatkan benefit khusus.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-6 sm:px-8 pb-8 pt-4 border-t border-gray-200 dark:border-slate-600/20 mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold h-11 rounded-xl shadow-lg shadow-indigo-500/15 transition-all duration-300 hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" /> Mendaftar...
                </>
              ) : (
                'Buat Akun'
              )}
            </Button>
            <p className="text-sm text-center text-gray-500 dark:text-slate-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                Masuk Di Sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

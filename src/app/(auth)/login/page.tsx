'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, ArrowLeft, Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { loginSchema, LoginInput } from '@/lib/validations';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { LogoIcon } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const setProfile = useAuthStore((state) => state.setProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Gagal mendapatkan informasi user');
      }

      // 2. Fetch User Profile from DB
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Login profile query database error:', profileError);
        toast.warning('Gagal memuat profil database: ' + profileError.message);
      }

      const mergedProfile = {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: profileData?.full_name || authData.user.user_metadata?.full_name || authData.user.email || '',
        role: (profileData?.role || 'user') as 'user' | 'admin',
        subscription_status: (profileData?.subscription_status || 'FREE') as 'FREE' | 'PREMIUM',
        created_at: profileData?.created_at || new Date().toISOString(),
        whatsapp: authData.user.user_metadata?.whatsapp || '',
      };

      setProfile(mergedProfile);

      toast.success('Login berhasil! Selamat datang kembali.');
      router.push('/dashboard');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Email atau password salah');
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
 
      <Card className="w-full max-w-md border-gray-200 dark:border-white/[0.12] bg-white dark:bg-[#1E293B] shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden relative">
        <CardHeader className="space-y-4 text-center p-6 sm:p-8">
          <LogoIcon size={56} disableDarkInvert={true} className="mx-auto" />
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Masuk Kawan ASN</CardTitle>
            <CardDescription className="text-gray-500 dark:text-slate-400 text-sm">Akses modul pembelajaran dan Tryout CAT Anda</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 px-6 sm:px-8 pb-8 pt-0">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">
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
              {errors.email && <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>}
            </div>
 
            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  className="pl-10.5 h-11 bg-gray-50 dark:bg-slate-800/80 border-gray-300 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-6 sm:px-8 pb-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold h-11 rounded-xl shadow-lg shadow-indigo-500/15 transition-all duration-300 hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" /> Sedang Masuk...
                </>
              ) : (
                'Masuk Sekarang'
              )}
            </Button>
            <p className="text-sm text-center text-gray-500 dark:text-slate-400">
              Belum punya akun?{' '}
              <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                Daftar Gratis
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

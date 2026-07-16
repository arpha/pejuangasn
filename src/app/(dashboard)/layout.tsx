'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  LogOut, 
  Crown,
  Menu,
  X,
  Shield,
  HelpCircle,
  User,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo, LogoIcon } from '@/components/logo';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading, logout, setProfile } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    // Client-side route protection
    const isPublicRoute = pathname.startsWith('/blog');
    
    if (!loading && !profile && !isPublicRoute) {
      toast.error('Harap login terlebih dahulu');
      router.push('/login');
      return;
    }

    if (profile && !hasSynced) {
      setHasSynced(true);
      // Sync profile from Supabase DB to prevent stale local session (e.g. role change in DB)
      const syncProfile = async () => {
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError) {
            console.error('Auth error during sync:', authError);
            return;
          }
          if (user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profileError) {
              console.error('Profile sync database error:', profileError);
              if (profileError.code !== 'PGRST116') {
                toast.error('Gagal mengambil data dari database: ' + profileError.message);
              }
            } else if (profileData) {
              setProfile({
                ...profile,
                ...profileData,
                whatsapp: user.user_metadata?.whatsapp || profile.whatsapp || '',
              });
            }
          }
        } catch (err) {
          console.error('Error syncing profile:', err);
        }
      };
      
      syncProfile();
    }
  }, [profile, loading, router, setProfile, hasSynced]);

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar dari akun');
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Materi Belajar', href: '/materi', icon: BookOpen },
    { name: 'Latihan Soal', href: '/latihan', icon: HelpCircle },
    { name: 'Tryout CAT', href: '/tryout', icon: Award },
    { name: 'Blog Informasi', href: '/blog', icon: FileText },
  ];

  const menuItems = [...navItems];
  if (profile?.role === 'admin') {
    menuItems.push({ name: 'Panel Admin', href: '/admin', icon: Shield });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        <p className="text-muted-foreground mt-4 text-sm font-medium">Memuat halaman...</p>
      </div>
    );
  }

  if (!profile) {
    if (!pathname.startsWith('/blog')) return null;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
        {/* Sticky Header Bar for Guests */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
            </Link>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/login">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-4 py-2 h-9 transition-all">
                  Masuk / Login
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      
      {/* Mobile Top Bar */}
      <div className="flex md:hidden items-center justify-between px-6 h-16 border-b border-border bg-card sticky top-0 z-40">
        <Logo size={32} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`fixed inset-y-0 left-0 z-50 border-r border-border bg-card flex flex-col shrink-0 transform transition-all duration-300 md:translate-x-0 md:static md:h-screen md:sticky md:top-0 ${
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } w-64 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          
          {/* Sidebar Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6 gap-2 shrink-0">
            <Logo size={32} showText={!isSidebarCollapsed} />
            {/* Collapse/Expand Toggle Button for Desktop */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 focus:outline-none"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* User Card */}
          <div className="p-4 border-b border-border bg-muted/10">
            {profile ? (
              <Link href="/profil" onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`bg-card border border-border rounded-xl p-3 flex items-center ${
                  isSidebarCollapsed ? 'justify-center p-2' : 'gap-3'
                } shadow-sm hover:bg-muted/50 cursor-pointer transition-all duration-200`}>
                  <div className="h-9 w-9 rounded-full bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center font-bold text-white uppercase text-sm shrink-0">
                    {profile.full_name?.charAt(0) || 'U'}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{profile.full_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {profile.subscription_status === 'PREMIUM' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-emerald-600 dark:text-emerald-400 border border-amber-500/20">
                            <Crown className="h-2.5 w-2.5 text-amber-500" /> PREMIUM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                            FREE
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-3 flex items-center ${
                  isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 justify-center'
                } shadow-sm cursor-pointer transition-all duration-200`}>
                  <User className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="text-sm font-bold">Masuk / Login</span>}
                </div>
              </Link>
            )}
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className={`flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'
                  } py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`} title={isSidebarCollapsed ? item.name : undefined}>
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle (Always above Logout) */}
          <div className={`p-4 border-t border-border flex ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between items-center px-6'
          } shrink-0`}>
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mode Tema</span>
            )}
            <ThemeToggle />
          </div>

          {/* Sidebar Footer (Logout) */}
          {profile && (
            <div className="p-4 border-t border-border shrink-0">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className={`w-full ${
                  isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'
                } text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl py-3 h-auto font-semibold transition-all`}
                title={isSidebarCollapsed ? "Keluar Akun" : undefined}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isSidebarCollapsed && <span className="ml-3">Keluar Akun</span>}
              </Button>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

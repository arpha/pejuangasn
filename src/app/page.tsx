import Link from 'next/link';
import { 
  BookOpen, GraduationCap, Award, CheckCircle2, ShieldCheck, ArrowRight, 
  Users, Trophy, Star, BarChart3, Clock, Zap, Target, TrendingUp, 
  FileText, Share2, Crown, Sparkles, BookMarked, Brain, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: 'Materi Belajar Terstruktur',
      description: 'Modul TWK, TIU, dan TKP dengan progress baca, quiz interaktif per modul, dan penanda materi yang sudah selesai dipelajari.',
      color: 'indigo',
    },
    {
      icon: Target,
      title: 'Simulasi CAT BKN',
      description: 'Tryout dengan format resmi 110 soal, timer otomatis, navigasi soal, penanda ragu-ragu, dan pengalaman ujian layaknya CAT sesungguhnya.',
      color: 'sky',
    },
    {
      icon: BarChart3,
      title: 'Passing Grade Otomatis',
      description: 'Kalkulasi skor langsung pecah per komponen TWK, TIU, TKP dengan ambang batas kelulusan sesuai standar BKN terbaru.',
      color: 'emerald',
    },
    {
      icon: Trophy,
      title: 'Papan Peringkat Nasional',
      description: 'Bandingkan pencapaian Anda dengan ribuan peserta lain secara real-time. Lihat posisi ranking dan skor tertinggi per kelompok tryout.',
      color: 'amber',
    },
    {
      icon: Brain,
      title: 'Analisis & Rekomendasi Belajar',
      description: 'Analisis cerdas dari riwayat hasil tryout sebelumnya untuk merekomendasikan topik materi personal yang perlu Anda pelajari lebih dalam.',
      color: 'purple',
    },
    {
      icon: FileText,
      title: 'Blog & Tips Lolos CPNS',
      description: 'Kumpulan artikel, berita terbaru, strategi belajar, dan trik menjawab soal ujian dari mentor berpengalaman.',
      color: 'rose',
    },
  ];

  const stats = [
    { value: '5.000+', label: 'Bank Soal SKD', sublabel: 'TWK, TIU, & TKP Terbaru' },
    { value: '100+', label: 'Simulasi Tryout CAT', sublabel: 'Standar Kelulusan BKN' },
    { value: '10.000+', label: 'Pengguna Aktif', sublabel: 'Saling Bersaing Nasional' },
    { value: '100%', label: 'Akurat & Real-time', sublabel: 'Analisis Skor & Passing Grade' },
  ];

  const plans = [
    {
      name: 'Gratis',
      price: 'Rp 0',
      description: 'Akses dasar untuk mulai belajar dan berlatih tanpa biaya.',
      features: [
        'Materi belajar lengkap TWK, TIU, TKP',
        'Quiz interaktif per modul materi',
        'Tryout individu gratis tanpa batas',
        'Latihan soal per kategori',
        'Blog & tips persiapan CPNS',
        'Papan peringkat tryout individu',
      ],
      cta: 'Daftar Gratis',
      highlighted: false,
    },
    {
      name: 'Premium',
      price: 'Rp 149.000',
      originalPrice: 'Rp 298.000',
      discount: '50%',
      period: '/ paket',
      description: 'Akses penuh ke tryout kelompok premium dengan kompetisi nyata.',
      features: [
        'Semua fitur paket Gratis',
        'Akses tryout kelompok premium',
        'Persaingan ranking dengan peserta lain',
        'Pembahasan soal lengkap',
        'Analisis skor dan passing grade detail',
        'Program afiliasi komisi Rp 10.000',
      ],
      cta: 'Beli Paket Premium',
      highlighted: true,
    },
  ];

  const testimonials = [
    {
      name: 'Rina Sartika',
      role: 'Lolos CPNS Kemenkeu 2025',
      text: 'Kawan ASN membantu saya mengenal pola soal CAT BKN. Simulasi tryoutnya sangat mirip dengan ujian asli. Skor SKD saya 420!',
      rating: 5,
    },
    {
      name: 'Ahmad Fauzi',
      role: 'Lolos PPPK Guru 2025',
      text: 'Materi belajarnya terstruktur dan quiz per modulnya membuat saya benar-benar paham sebelum lanjut ke modul berikutnya.',
      rating: 5,
    },
    {
      name: 'Dewi Lestari',
      role: 'Calon Peserta Seleksi CPNS',
      text: 'Fitur latihan soal per kategori sangat membantu saya fokus ke kelemahan di TIU. Papan peringkat juga bikin semangat bersaing!',
      rating: 4,
    },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#090D16] text-foreground flex flex-col transition-colors duration-300 overflow-hidden">
      
      {/* Decorative ambient background */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-600/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/5 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-600/6 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#090D16]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:block">
              Masuk
            </Link>
            <Link href="/register">
              <Button className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/15 transition-all duration-200">
                Daftar Sekarang
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 flex flex-col space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 self-center lg:self-start">
              <Sparkles className="h-3.5 w-3.5" />
              Persiapan SKD CPNS Terbaru & Terlengkap
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.1]">
              Lolos CPNS Impian dengan Simulasi CAT{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Kawan ASN
              </span>
            </h1>

            <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Platform simulasi tryout CAT CPNS terlengkap dengan materi belajar terstruktur, quiz interaktif, latihan soal, papan peringkat, blog tips lolos, dan program afiliasi. Gratis untuk semua!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold text-base px-8 h-12 shadow-lg shadow-indigo-500/20 rounded-xl transition-all duration-300 hover:scale-[1.02]">
                  Coba Tryout Gratis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white h-12 px-8 rounded-xl font-bold">
                  Masuk Akun
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Card */}
          <div className="lg:col-span-5 relative group">
            {/* Glowing backdrop border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[28px] blur-xl opacity-20 group-hover:opacity-30 transition duration-1000 pointer-events-none" />
            
            <div className="relative border border-slate-200/60 dark:border-white/[0.08] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[26px] p-6 sm:p-8 shadow-2xl space-y-6">
              <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <ShieldCheck className="text-emerald-500 dark:text-emerald-400 h-6 w-6 shrink-0" /> Fitur Unggulan
              </h3>
              
              <div className="space-y-3">
                {[
                  { icon: BookOpen, label: 'Materi + Quiz Interaktif', desc: 'Baca modul, kerjakan quiz, tandai selesai.', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' },
                  { icon: Award, label: 'CAT Simulator BKN', desc: '110 soal, timer, navigasi, penanda ragu.', color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10' },
                  { icon: CheckCircle2, label: 'Passing Grade Otomatis', desc: 'Skor pecah per TWK, TIU, TKP.', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
                  { icon: Brain, label: 'Analisis & Rekomendasi Belajar', desc: 'Rekomendasi belajar personal atas dasar hasil tryout sebelumnya.', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10' },
                  { icon: Trophy, label: 'Papan Peringkat', desc: 'Ranking nasional per tryout kelompok.', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
                  { icon: Share2, label: 'Program Afiliasi', desc: 'Dapatkan komisi Rp 10.000 per referral.', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10' },
                ].map((item, i) => (
                  <div key={i} className="group/item flex items-start gap-4 p-2.5 rounded-2xl transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-white/[0.03] hover:translate-x-1.5">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-transform duration-300 group-hover/item:scale-110 ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-[14px] text-gray-900 dark:text-white transition-colors duration-200 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400">{item.label}</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-gray-200 dark:border-white/[0.06]">
          {stats.map((stat, i) => (
            <div key={i} className="text-center lg:text-left">
              <p className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm font-bold text-gray-600 dark:text-slate-300 mt-0.5">{stat.label}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FEATURES SECTION */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-t border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-4">
              <Zap className="h-3.5 w-3.5" /> Fitur Lengkap
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Semua yang Anda Butuhkan untuk{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Lolos CPNS</span>
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mt-3 text-sm sm:text-base">
              Dari materi belajar hingga simulasi ujian nyata — Kawan ASN menyediakan ekosistem persiapan CPNS yang lengkap dan terintegrasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const colorMap: Record<string, string> = {
                indigo: 'from-indigo-500/5 dark:from-indigo-500/10 to-indigo-500/[0.02] dark:to-indigo-500/5 border-indigo-500/10 dark:border-indigo-500/15',
                sky: 'from-sky-500/5 dark:from-sky-500/10 to-sky-500/[0.02] dark:to-sky-500/5 border-sky-500/10 dark:border-sky-500/15',
                emerald: 'from-emerald-500/5 dark:from-emerald-500/10 to-emerald-500/[0.02] dark:to-emerald-500/5 border-emerald-500/10 dark:border-emerald-500/15',
                amber: 'from-amber-500/5 dark:from-amber-500/10 to-amber-500/[0.02] dark:to-amber-500/5 border-amber-500/10 dark:border-amber-500/15',
                purple: 'from-purple-500/5 dark:from-purple-500/10 to-purple-500/[0.02] dark:to-purple-500/5 border-purple-500/10 dark:border-purple-500/15',
                rose: 'from-rose-500/5 dark:from-rose-500/10 to-rose-500/[0.02] dark:to-rose-500/5 border-rose-500/10 dark:border-rose-500/15',
              };
              const iconColorMap: Record<string, string> = {
                indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
                emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
                rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
              };
              return (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${colorMap[feature.color]} border rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300`}
                >
                  <div className={`p-2.5 rounded-xl w-fit ${iconColorMap[feature.color]} mb-4`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-t border-gray-100 dark:border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
              <TrendingUp className="h-3.5 w-3.5" /> Alur Belajar
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              4 Langkah Menuju{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-sky-600 dark:from-emerald-400 dark:to-sky-400 bg-clip-text text-transparent">Kelulusan CPNS</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Daftar Gratis', desc: 'Buat akun Kawan ASN secara gratis dalam hitungan detik, tanpa biaya apapun.', icon: Users },
              { step: '02', title: 'Pelajari Materi', desc: 'Baca modul terstruktur TWK, TIU, TKP. Selesaikan quiz setiap modul untuk menandai progress Anda.', icon: BookMarked },
              { step: '03', title: 'Ikuti Tryout CAT', desc: 'Uji kemampuan dengan simulasi tryout 110 soal yang mirip ujian sesungguhnya dengan timer otomatis.', icon: Clock },
              { step: '04', title: 'Analisis & Tingkatkan', desc: 'Lihat skor passing grade, ranking di papan peringkat, dan terus latihan hingga siap hari H.', icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="relative bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-6 text-center hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300">
                <div className="text-5xl font-black text-gray-100 dark:text-white/[0.04] absolute top-3 right-4">{item.step}</div>
                <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl w-fit mx-auto mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PRICING SECTION */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-t border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-4">
              <Crown className="h-3.5 w-3.5" /> Paket Harga
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Pilih Paket yang{' '}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Cocok untuk Anda</span>
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mt-3 text-sm sm:text-base">
              Mulai belajar gratis tanpa batas, atau tingkatkan dengan paket Premium untuk akses tryout kelompok.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-7 border transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-indigo-50 dark:from-indigo-500/10 to-purple-50 dark:to-purple-500/5 border-indigo-300 dark:border-indigo-500/30 shadow-xl shadow-indigo-500/5'
                    : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/[0.08]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                    Populer
                  </div>
                )}
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{plan.name}</h3>
                {'originalPrice' in plan && plan.originalPrice && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-400 dark:text-slate-500 line-through font-bold">{plan.originalPrice}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">Hemat {plan.discount}</span>
                  </div>
                )}
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-gray-500 dark:text-slate-400 font-bold">{plan.period}</span>}
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-7">
                  <Button className={`w-full h-11 font-extrabold rounded-xl transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/15'
                      : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white border border-gray-300 dark:border-white/10'
                  }`}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TESTIMONIALS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-t border-gray-100 dark:border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-4">
              <MessageSquare className="h-3.5 w-3.5" /> Testimoni
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Cerita Sukses{' '}
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text text-transparent">Kawan ASN</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-6 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-slate-600'}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed italic mb-5">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* AFFILIATE SECTION */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-t border-gray-100 dark:border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-indigo-50 dark:from-indigo-500/10 to-purple-50 dark:to-purple-500/5 border border-indigo-200 dark:border-indigo-500/15 rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Share2 className="h-3.5 w-3.5" /> Program Afiliasi
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
                  Ajak Teman, Dapatkan{' '}
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Komisi Rp 10.000</span>
                </h2>
                <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                  Bagikan kode referral unik Anda kepada teman-teman. Setiap teman yang mendaftar dan membeli paket Premium akan memberikan komisi langsung ke saldo Anda.
                </p>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold h-11 px-8 rounded-xl shadow-lg shadow-indigo-500/15 transition-all duration-200">
                    Mulai Sekarang <ArrowRight className="ml-2 h-4.5 w-4.5" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, label: 'Ajak Teman Daftar', value: 'Kode Unik' },
                  { icon: Crown, label: 'Teman Beli Premium', value: 'Bayar Tiket' },
                  { icon: Zap, label: 'Komisi Otomatis', value: 'Rp 10.000' },
                  { icon: TrendingUp, label: 'Tanpa Batas', value: 'Unlimited' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/60 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-xl p-4 text-center">
                    <item.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-bold">{item.label}</p>
                    <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA SECTION */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-t border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            Siap Menjadi ASN?
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8 text-base max-w-lg mx-auto">
            Bergabung dengan ribuan pejuang yang sudah mempersiapkan diri di Kawan ASN. Daftar gratis dan mulai tryout pertamamu hari ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold text-base px-10 h-12 shadow-lg shadow-indigo-500/20 rounded-xl transition-all duration-300">
                Daftar Gratis Sekarang <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white h-12 px-8 rounded-xl font-bold">
                Sudah Punya Akun? Masuk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-white/[0.04] py-16 bg-white dark:bg-[#070B12] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-100 dark:border-white/[0.04]">
            {/* Brand Section */}
            <div className="md:col-span-6 space-y-4">
              <Logo />
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Platform simulasi tryout CAT CPNS terlengkap di Indonesia. Belajar materi, ikuti tryout, raih passing grade, dan lolos seleksi impian Anda.
              </p>
              {/* Social Media Links */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://t.me/kawanasn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full border border-slate-200 dark:border-white/10 hover:border-sky-500 text-slate-500 dark:text-slate-400 hover:text-sky-500 hover:bg-sky-500/5 transition-all duration-300 hover:-translate-y-1 shadow-sm"
                  title="Telegram"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .5C5.648.5.5 5.648.5 12s5.148 11.5 11.5 11.5 11.5-5.148 11.5-11.5S18.352.5 12 .5zm5.56 7.604l-1.872 8.814c-.14.622-.51.776-1.034.484l-2.854-2.1c-.688.662-1.352 1.34-2.072 2.052-.162.164-.326.314-.492.314-.236 0-.276-.118-.328-.27L7.68 13.92 4.148 12.82c-.768-.24-.784-.768.16-.114l13.82-5.328c.64-.232 1.2.148 1.432.726z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/kawanasn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full border border-slate-200 dark:border-white/10 hover:border-rose-500 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all duration-300 hover:-translate-y-1 shadow-sm"
                  title="Instagram"
                >
                  <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://youtube.com/kawanasn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full border border-slate-200 dark:border-white/10 hover:border-red-500 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-all duration-300 hover:-translate-y-1 shadow-sm"
                  title="YouTube"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links Section */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Halaman</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/blog" className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold">
                    Blog & Tips
                  </Link>
                </li>
                <li>
                  <Link href="/kontak" className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold">
                    Hubungi Kami / Kontak
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Section */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Legalitas</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/ketentuan-layanan" className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold">
                    Ketentuan Layanan
                  </Link>
                </li>
                <li>
                  <Link href="/kebijakan-privasi" className="text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold">
                    Kebijakan Privasi
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              © {new Date().getFullYear()} Kawan ASN. Hak Cipta Dilindungi.
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-600">
              Dibuat dengan dedikasi untuk kesuksesan CPNS & PPPK Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

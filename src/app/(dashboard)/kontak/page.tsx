'use client';

import { Mail, MessageSquare, PhoneCall, HelpCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function KontakPage() {
  const supports = [
    {
      icon: MessageSquare,
      title: 'WhatsApp Customer Support',
      description: 'Layanan bantuan cepat untuk masalah aktivasi Premium, konfirmasi pembayaran, atau kendala teknis akun.',
      value: '+62 812-3456-7890',
      actionText: 'Kirim Pesan WhatsApp',
      href: 'https://wa.me/6281234567890?text=Halo%20Admin%20Kawan%20ASN%2C%20saya%20butuh%20bantuan%20terkait...',
      color: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/[0.02]',
      iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      btnStyle: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Hubungi kami via email untuk kerja sama kemitraan, kendala login/keamanan akun, atau kritik dan saran.',
      value: 'support@kawanasn.id',
      actionText: 'Kirim Email',
      href: 'mailto:support@kawanasn.id',
      color: 'border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/[0.02]',
      iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      btnStyle: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  ];

  const socials = [
    {
      icon: (props: any) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.648.5.5 5.648.5 12s5.148 11.5 11.5 11.5 11.5-5.148 11.5-11.5S18.352.5 12 .5zm5.56 7.604l-1.872 8.814c-.14.622-.51.776-1.034.484l-2.854-2.1c-.688.662-1.352 1.34-2.072 2.052-.162.164-.326.314-.492.314-.236 0-.276-.118-.328-.27L7.68 13.92 4.148 12.82c-.768-.24-.784-.768.16-.114l13.82-5.328c.64-.232 1.2.148 1.432.726z" />
        </svg>
      ),
      title: 'Telegram Group',
      description: 'Gabung komunitas belajar nasional Kawan ASN untuk berdiskusi soal dan info terkini seleksi CPNS.',
      actionText: 'Gabung Grup',
      href: 'https://t.me/kawanasn',
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20',
    },
    {
      icon: (props: any) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      title: 'Instagram Official',
      description: 'Ikuti tips harian, kuis singkat, info formasi terbaru, dan materi kisi-kisi terupdate.',
      actionText: 'Ikuti Instagram',
      href: 'https://instagram.com/kawanasn',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20',
    },
    {
      icon: (props: any) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      title: 'YouTube Channel',
      description: 'Tonton video pembahasan soal, kupas tuntas kisi-kisi SKD, dan tips wawancara dari mentor.',
      actionText: 'Tonton Video',
      href: 'https://youtube.com/kawanasn',
      color: 'text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
          <PhoneCall className="h-4 w-4" /> Hubungi Kami
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Kontak Kawan ASN
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
          Kami siap membantu langkah sukses Anda menghadapi seleksi CPNS. Hubungi tim dukungan pelanggan kami atau bergabung dengan media sosial resmi kami.
        </p>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {supports.map((sup, idx) => {
          const Icon = sup.icon;
          return (
            <Card key={idx} className={`border transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between ${sup.color}`}>
              <CardHeader className="space-y-4 p-6 sm:p-8">
                <div className={`p-3 rounded-2xl w-fit ${sup.iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-black text-foreground">{sup.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed font-semibold">{sup.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0 space-y-4">
                <p className="text-lg font-black text-foreground">{sup.value}</p>
                <a href={sup.href} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className={`w-full h-11 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${sup.btnStyle}`}>
                    {sup.actionText} <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Social Communities */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-600" /> Komunitas & Media Sosial Resmi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {socials.map((soc, idx) => {
            const Icon = soc.icon;
            return (
              <Card key={idx} className="bg-card border-border hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between">
                <CardHeader className="space-y-3 p-6">
                  <div className={`p-2.5 rounded-xl w-fit ${soc.color} transition-colors`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">{soc.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed font-medium">{soc.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <a href={soc.href} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full h-10 text-xs font-bold border-border rounded-xl hover:bg-muted transition-all">
                      {soc.actionText}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Banner */}
      <div className="bg-muted/30 border border-border rounded-2xl p-6 sm:p-8 text-center space-y-3">
        <h3 className="font-extrabold text-foreground text-sm">Waktu Operasional Customer Support</h3>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-lg mx-auto font-medium">
          Dukungan Customer Support aktif setiap hari pukul **08.00 - 21.00 WIB**. Pesan yang dikirimkan di luar jam operasional akan dijawab secepatnya pada hari berikutnya.
        </p>
      </div>
    </div>
  );
}

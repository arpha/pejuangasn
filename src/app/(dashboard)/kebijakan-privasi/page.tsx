'use client';

import { ShieldCheck, Database, Key, Share2, UserCheck, Eye, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function KebijakanPrivasiPage() {
  const sections = [
    {
      icon: Database,
      title: '1. Pengumpulan Informasi Data',
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      content: [
        'Informasi Profil: Kami mengumpulkan nama lengkap, alamat email, dan nomor WhatsApp saat Anda melakukan registrasi akun.',
        'Informasi Aktivitas Belajar: Kami mencatat riwayat hasil tryout Anda, skor per kategori (TWK, TIU, TKP), status kelulusan passing grade, serta jawaban latihan untuk analisis rekomendasi belajar.',
        'Informasi Transaksi: Detail pembayaran paket Premium (melalui gerbang pembayaran Midtrans). Kami tidak pernah menyimpan data rekening bank atau kartu kredit Anda secara langsung.',
      ],
    },
    {
      icon: Eye,
      title: '2. Penggunaan Informasi Anda',
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
      content: [
        'Mengelola akun belajar Kawan ASN dan memproses transaksi paket Premium secara otomatis.',
        'Menampilkan skor dan peringkat Anda di papan peringkat (leaderboard) nasional untuk persaingan tryout kelompok.',
        'Menyediakan rekomendasi personal berupa materi yang perlu ditingkatkan berdasarkan hasil tryout sebelumnya.',
        'Mengirimkan informasi transaksi, berita belajar terbaru, atau verifikasi kode referral program afiliasi.',
      ],
    },
    {
      icon: Lock,
      title: '3. Keamanan & Perlindungan Data',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      content: [
        'Semua data pribadi Anda disimpan dengan aman menggunakan infrastruktur database terenkripsi (Supabase).',
        'Kami menerapkan protokol SSL/TLS yang aman untuk melindungi pengiriman data dari perangkat Anda ke server kami.',
        'Meskipun demikian, Anda bertanggung jawab sepenuhnya atas kerahasiaan password akun Anda sendiri dari akses pihak ketiga.',
      ],
    },
    {
      icon: Share2,
      title: '4. Pengungkapan Kepada Pihak Ketiga',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      content: [
        'Kami tidak menjual, menyewakan, atau memperjualbelikan data pribadi Anda kepada pihak pengiklan atau pihak luar lainnya.',
        'Data pembayaran Anda akan diteruskan secara aman ke gerbang pembayaran terverifikasi kami (Midtrans) hanya untuk tujuan penyelesaian transaksi pembelian paket Premium.',
      ],
    },
    {
      icon: UserCheck,
      title: '5. Hak Pengguna Atas Data',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
      content: [
        'Anda berhak mengubah informasi profil (nama lengkap dan WhatsApp) kapan saja melalui menu Pengaturan Profil di dalam dashboard.',
        'Jika Anda ingin menghapus seluruh akun dan data riwayat belajar Anda secara permanen dari server kami, Anda dapat mengajukan permohonan melalui Customer Support kami.',
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
          <ShieldCheck className="h-4 w-4" /> Kebijakan Keamanan
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Kebijakan Privasi
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Terakhir diperbarui: 16 Juli 2026. Kami berkomitmen untuk menjaga kerahasiaan dan keamanan setiap data belajar Anda di Kawan ASN.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <Card key={idx} className="bg-card border-border hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${section.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-black text-foreground">{section.title}</h2>
                </div>
                
                <ul className="space-y-3 pl-11">
                  {section.content.map((bullet, bulletIdx) => (
                    <li key={bulletIdx} className="list-disc text-sm text-muted-foreground leading-relaxed font-medium">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Disclaimer */}
      <div className="bg-muted/30 border border-border rounded-2xl p-6 sm:p-8 text-center space-y-3">
        <h3 className="font-extrabold text-foreground text-sm">Butuh bantuan lebih lanjut tentang perlindungan data?</h3>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-lg mx-auto">
          Jika Anda memiliki kekhawatiran atau pertanyaan lebih detail mengenai bagaimana kami mengelola data belajar Anda, silakan hubungi tim Support kami di halaman Kontak.
        </p>
      </div>
    </div>
  );
}

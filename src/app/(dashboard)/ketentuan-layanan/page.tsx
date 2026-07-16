'use client';

import { ShieldCheck, UserCheck, CreditCard, Award, Users, FileText, HelpCircle, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function KetentuanLayananPage() {
  const sections = [
    {
      icon: ShieldCheck,
      title: '1. Ketentuan Umum',
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      content: [
        'Kawan ASN adalah platform belajar mandiri dan simulasi CAT BKN untuk persiapan seleksi CPNS.',
        'Dengan mendaftar atau menggunakan layanan kami, Anda menyatakan setuju untuk terikat oleh syarat dan ketentuan ini secara penuh.',
        'Kami berhak memperbarui ketentuan ini sewaktu-waktu demi menyesuaikan dengan regulasi BKN terbaru.',
      ],
    },
    {
      icon: UserCheck,
      title: '2. Akun Pengguna & Keamanan',
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
      content: [
        'Anda wajib memberikan informasi profil yang benar, akurat, dan terbaru saat melakukan pendaftaran.',
        'Satu akun Kawan ASN hanya boleh digunakan oleh satu pengguna terdaftar. Anda dilarang membagikan akses login (username/password) kepada orang lain.',
        'Pihak Kawan ASN berhak menangguhkan atau menghapus akun secara permanen jika ditemukan indikasi penyalahgunaan atau penggunaan akun secara bersamaan (multi-login).',
      ],
    },
    {
      icon: Award,
      title: '3. Layanan Gratis vs Premium',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      content: [
        'Paket Gratis memberikan akses terbatas pada modul materi dasar, kuis interaktif, dan maksimal 1 kali pengerjaan untuk setiap paket Tryout Mandiri (Free).',
        'Paket Premium memberikan akses tanpa batas (unlimited attempt) ke seluruh simulasi tryout mandiri, akses penuh tryout kelompok premium dengan pemeringkatan nasional, pembahasan soal lengkap, kustomisasi latihan (Drill Mode), serta analisis belajar otomatis.',
        'Fitur Premium berlaku selamanya sesuai masa paket aktif yang tertera pada akun Anda.',
      ],
    },
    {
      icon: CreditCard,
      title: '4. Pembayaran & Pengembalian Dana',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      content: [
        'Pembayaran untuk peningkatan ke akun Premium dilakukan melalui gerbang pembayaran resmi (Midtrans) menggunakan metode yang tersedia.',
        'Seluruh transaksi pembelian paket Premium bersifat final. Tidak ada pengembalian dana (refund) dengan alasan apa pun setelah akses premium berhasil diaktifkan pada akun Anda.',
        'Jika terjadi kendala aktivasi otomatis, Anda dapat menghubungi Customer Support dengan melampirkan bukti transfer yang sah.',
      ],
    },
    {
      icon: Users,
      title: '5. Program Afiliasi & Kemitraan',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
      content: [
        'Setiap pengguna Kawan ASN dapat berpartisipasi dalam program afiliasi dengan membagikan kode referral unik mereka.',
        'Komisi sebesar Rp 10.000 akan diberikan untuk setiap pengguna baru yang mendaftar menggunakan kode referral Anda dan melakukan pembayaran paket Premium pertamanya.',
        'Segala bentuk manipulasi pendaftaran (seperti self-referral menggunakan email palsu atau spam) akan menyebabkan komisi hangus dan pemblokiran akun afiliasi Anda.',
        'Pencairan komisi afiliasi dilakukan secara berkala setelah melewati proses audit keamanan sistem.',
      ],
    },
    {
      icon: Scale,
      title: '6. Hak Kekayaan Intelektual',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
      content: [
        'Seluruh bank soal, penjelasan materi, kode pemrograman website, desain antarmuka, dan logo Kawan ASN adalah hak cipta dilindungi.',
        'Anda dilarang keras menyalin, menyebarluaskan, memperjualbelikan, atau melakukan scraping otomatis (web scraping) pada bank soal dan materi di platform Kawan ASN tanpa izin tertulis dari kami.',
      ],
    },
    {
      icon: HelpCircle,
      title: '7. Batasan Tanggung Jawab',
      color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
      content: [
        'Kawan ASN berupaya menyajikan simulasi CAT yang seakurat mungkin dengan standar BKN. Namun, kami tidak menjamin kelulusan mutlak Anda dalam seleksi resmi CPNS.',
        'Kami tidak bertanggung jawab atas kegagalan teknis di luar sistem kami, seperti gangguan koneksi internet pengguna saat mengerjakan simulasi tryout.',
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
          <FileText className="h-4 w-4" /> Legalitas & Regulasi
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Ketentuan Layanan
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Terakhir diperbarui: 16 Juli 2026. Harap baca syarat dan ketentuan penggunaan platform Kawan ASN berikut ini secara saksama.
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
        <h3 className="font-extrabold text-foreground text-sm">Ada pertanyaan mengenai Ketentuan Layanan kami?</h3>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-lg mx-auto">
          Hubungi tim bantuan kami melalui menu Kontak untuk mendapatkan klarifikasi lebih lanjut mengenai hak dan kewajiban Anda selama menggunakan Kawan ASN.
        </p>
      </div>
    </div>
  );
}

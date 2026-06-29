import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import Providers from "@/components/providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PejuangASN - Media Pembelajaran & Tryout CAT SKD CPNS",
  description: "Platform latihan ujian CAT SKD CPNS terlengkap dengan materi belajar interaktif dan pembahasan detail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} antialiased min-h-screen bg-background text-foreground transition-colors duration-300 font-sans`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

-- MIGRATION FITUR REKAM JAM BELAJAR (STUDY LOGS)
-- Jalankan skrip ini di SQL Editor Supabase jika tabel belum ada

CREATE TABLE IF NOT EXISTS public.study_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('MATERI', 'LATIHAN', 'TRYOUT')),
    title TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index untuk mempercepat query agregasi jam belajar per pengguna
CREATE INDEX IF NOT EXISTS idx_study_logs_user_id ON public.study_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_activity_type ON public.study_logs(activity_type);

-- Aktifkan Row Level Security
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses pengguna (hanya bisa membaca riwayat milik sendiri)
DROP POLICY IF EXISTS "Users can view their own study logs" ON public.study_logs;
CREATE POLICY "Users can view their own study logs" ON public.study_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Kebijakan penambahan data (pengguna hanya bisa menambah riwayat untuk akunnya)
DROP POLICY IF EXISTS "Users can insert their own study logs" ON public.study_logs;
CREATE POLICY "Users can insert their own study logs" ON public.study_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Kebijakan admin (akses penuh untuk monitoring)
DROP POLICY IF EXISTS "Admins have full access to study logs" ON public.study_logs;
CREATE POLICY "Admins have full access to study logs" ON public.study_logs
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

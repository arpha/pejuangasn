-- MIGRATION PROGRESS MEMBACA & KUIS MODUL BELAJAR

-- A. Tabel Pelacakan Progress Membaca
CREATE TABLE IF NOT EXISTS public.user_material_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    quiz_completed BOOLEAN DEFAULT FALSE,
    quiz_score INTEGER DEFAULT 0, -- Nilai kuis (skala 0-5)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, material_id)
);

-- Mengaktifkan RLS
ALTER TABLE public.user_material_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_material_progress;
CREATE POLICY "Users can manage their own progress" ON public.user_material_progress
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- B. Tambah Kolom material_id di Tabel Questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL;

-- MIGRATION SUB KATEGORI MATERI (SUB-TOPIC FOR LEARNING MATERIALS)
-- Jalankan skrip ini di SQL Editor Supabase jika kolom belum ada

ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS sub_category TEXT DEFAULT NULL;

-- Index untuk mempermudah filter materi dan kuis per sub-topik
CREATE INDEX IF NOT EXISTS idx_materials_sub_category ON public.materials(sub_category);

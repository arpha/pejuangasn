-- SCHEMA SETUP FOR KAWAN ASN

-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_status TEXT DEFAULT 'FREE' CHECK (subscription_status IN ('FREE', 'PREMIUM')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Materials Table (TWK, TIU, TKP)
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('TWK', 'TIU', 'TKP')),
    content TEXT NOT NULL, -- Supports rich text/markdown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Exam Packages Table (FREE vs PREMIUM)
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'FREE' CHECK (type IN ('FREE', 'PREMIUM')),
    category TEXT DEFAULT 'MANDIRI' CHECK (category IN ('MANDIRI', 'KELOMPOK')),
    duration_minutes INTEGER DEFAULT 100 NOT NULL,
    total_questions INTEGER DEFAULT 110 NOT NULL,
    passing_twk INTEGER DEFAULT 65 NOT NULL,
    passing_tiu INTEGER DEFAULT 80 NOT NULL,
    passing_tkp INTEGER DEFAULT 166 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create Questions Table (TWK, TIU, TKP)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('TWK', 'TIU', 'TKP')),
    sub_category TEXT DEFAULT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    option_e TEXT NOT NULL,
    correct_option CHAR(1) CHECK (correct_option IN ('A', 'B', 'C', 'D', 'E')), -- Nullable for TKP which uses scale points
    scale_points JSONB DEFAULT NULL, -- Format: {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1}
    explanation TEXT,
    image_url TEXT DEFAULT NULL,
    option_a_image_url TEXT DEFAULT NULL,
    option_b_image_url TEXT DEFAULT NULL,
    option_c_image_url TEXT DEFAULT NULL,
    option_d_image_url TEXT DEFAULT NULL,
    option_e_image_url TEXT DEFAULT NULL,
    explanation_image_url TEXT DEFAULT NULL,
    difficulty TEXT DEFAULT 'SEDANG' CHECK (difficulty IN ('MUDAH', 'SEDANG', 'SULIT')),
    type TEXT DEFAULT 'FREE' CHECK (type IN ('FREE', 'PREMIUM')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Create Exam Questions Junction Table (Package contents)
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER NOT NULL,
    UNIQUE(exam_id, question_id)
);

-- 6. Create Exam Attempts Table
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    exam_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    score_twk INTEGER DEFAULT 0,
    score_tiu INTEGER DEFAULT 0,
    score_tkp INTEGER DEFAULT 0,
    score_total INTEGER DEFAULT 0,
    is_passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Create User Answers Table (CAT Answers state)
CREATE TABLE IF NOT EXISTS public.user_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    selected_option CHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D', 'E')),
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(attempt_id, question_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by anyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Materials Policies
DROP POLICY IF EXISTS "Materials are readable by authenticated users" ON public.materials;
CREATE POLICY "Materials are readable by authenticated users" ON public.materials
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify materials" ON public.materials;
CREATE POLICY "Only admins can modify materials" ON public.materials
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Packages Policies
DROP POLICY IF EXISTS "Packages are readable by authenticated users" ON public.packages;
CREATE POLICY "Packages are readable by authenticated users" ON public.packages
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify packages" ON public.packages;
CREATE POLICY "Only admins can modify packages" ON public.packages
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Questions Policies
DROP POLICY IF EXISTS "Questions are readable by authenticated users" ON public.questions;
CREATE POLICY "Questions are readable by authenticated users" ON public.questions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify questions" ON public.questions;
CREATE POLICY "Only admins can modify questions" ON public.questions
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Exam Questions Policies
DROP POLICY IF EXISTS "Exam questions are readable by authenticated users" ON public.exam_questions;
CREATE POLICY "Exam questions are readable by authenticated users" ON public.exam_questions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify exam questions" ON public.exam_questions;
CREATE POLICY "Only admins can modify exam questions" ON public.exam_questions
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Exam Attempts Policies
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.exam_attempts;
CREATE POLICY "Users can view their own attempts" ON public.exam_attempts
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.exam_attempts;
CREATE POLICY "Users can insert their own attempts" ON public.exam_attempts
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own attempts" ON public.exam_attempts;
CREATE POLICY "Users can update their own attempts" ON public.exam_attempts
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User Answers Policies
DROP POLICY IF EXISTS "Users can view their own answers" ON public.user_answers;
CREATE POLICY "Users can view their own answers" ON public.user_answers
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert/update their own answers" ON public.user_answers;
CREATE POLICY "Users can insert/update their own answers" ON public.user_answers
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_id AND user_id = auth.uid())
    );

-- Trigger to create profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, subscription_status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'user',
    'FREE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- SEED DATA (SAMPLE PACKAGES, MATERIALS, QUESTIONS)

-- 1. Seed Packages
INSERT INTO public.packages (id, title, description, type, duration_minutes, total_questions) VALUES
('b11d2c25-c1b1-44c5-aeb9-72bff9499701', 'Simulasi Mini SKD CPNS 2026', 'Simulasi ringkas SKD CPNS terdiri dari 6 soal contoh (2 TWK, 2 TIU, 2 TKP) untuk mencoba sistem CAT.', 'FREE', 10, 6),
('b11d2c25-c1b1-44c5-aeb9-72bff9499702', 'Tryout Premium SKD BKN Akbar', 'Tryout premium simulasi lengkap SKD dengan 110 soal standar BKN tingkat kesulitan tinggi.', 'PREMIUM', 100, 110)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Materials
INSERT INTO public.materials (id, title, slug, category, content) VALUES
('a11d2c25-c1b1-44c5-aeb9-72bff9499711', 'Materi Pilar Negara: Pancasila', 'pilar-negara-pancasila', 'TWK', '### Pengantar Pancasila\n\nPancasila sebagai dasar negara dan pandangan hidup bangsa Indonesia memiliki nilai-nilai luhur yang wajib diimplementasikan. Nilai-nilai tersebut terbagi menjadi 5 sila:\n\n1. **Ketuhanan Yang Maha Esa** (Religiusitas, toleransi antar umat beragama).\n2. **Kemanusiaan yang Adil dan Beradab** (Tenggang rasa, hak asasi manusia, memperlakukan orang lain dengan setara).\n3. **Persatuan Indonesia** (Cinta tanah air, bela negara, mengutamakan kepentingan bangsa).\n4. **Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan** (Musyawarah mufakat, menghargai pendapat orang lain).\n5. **Keadilan Sosial bagi Seluruh Rakyat Indonesia** (Keseimbangan hak dan kewajiban, gotong royong, menghargai karya orang lain).\n\n### Contoh Kasus Soal TWK:\nSeseorang yang menolak merawat fasilitas umum yang dibiayai bersama melanggar pengamalan Pancasila sila ke-5.'),
('a11d2c25-c1b1-44c5-aeb9-72bff9499712', 'Materi TIU: Analogi & Silogisme', 'tiu-analogi-silogisme', 'TIU', '### Pengambilan Kesimpulan (Silogisme)\n\nSilogisme adalah penarikan kesimpulan secara deduktif dari premis-premis yang ada.\n\n*   **Modus Ponens**:\n    *   Premis 1: P -> Q\n    *   Premis 2: P\n    *   Kesimpulan: Q\n\n*   **Modus Tollens**:\n    *   Premis 1: P -> Q\n    *   Premis 2: ~Q\n    *   Kesimpulan: ~P\n\n*   **Silogisme Hipotetis**:\n    *   Premis 1: P -> Q\n    *   Premis 2: Q -> R\n    *   Kesimpulan: P -> R')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Questions for Mini Tryout
INSERT INTO public.questions (id, question_text, category, option_a, option_b, option_c, option_d, option_e, correct_option, scale_points, explanation) VALUES
-- TWK Questions
('c11d2c25-c1b1-44c5-aeb9-72bff9499721', 'Sikap menghormati keputusan musyawarah meskipun bertentangan dengan pendapat pribadi merupakan pengamalan Pancasila sila ke...', 'TWK', 'Ke-1', 'Ke-2', 'Ke-3', 'Ke-4', 'Ke-5', 'D', NULL, 'Menghormati hasil musyawarah adalah wujud pengamalan sila ke-4 (Kerakyatan yang dipimpin oleh hikmat kebijaksanaan...)'),
('c11d2c25-c1b1-44c5-aeb9-72bff9499722', 'BPUPKI dibentuk pada tanggal 1 Maret 1945 oleh Jenderal Kumakichi Harada. Tugas utama badan ini adalah...', 'TWK', 'Merumuskan naskah proklamasi', 'Menyusun dasar negara dan rancangan UUD', 'Membentuk kabinet pemerintahan', 'Memilih Presiden dan Wakil Presiden', 'Melakukan perlawanan gerilya', 'B', NULL, 'Tugas utama BPUPKI adalah menyelidiki dan menyusun persiapan kemerdekaan Indonesia termasuk merumuskan dasar negara dan UUD.'),

-- TIU Questions
('c11d2c25-c1b1-44c5-aeb9-72bff9499723', 'Semua mahasiswa adalah pembaca buku. Sebagian pembaca buku memakai kacamata. Kesimpulan yang tepat adalah...', 'TIU', 'Semua mahasiswa memakai kacamata', 'Sebagian mahasiswa memakai kacamata', 'Semua pemakai kacamata adalah mahasiswa', 'Sebagian pembaca buku bukan mahasiswa', 'Tidak dapat disimpulkan secara mutlak', 'E', NULL, 'Karena premis kedua berbunyi "Sebagian pembaca buku memakai kacamata", kita tidak dapat memastikan apakah mahasiswa (yang merupakan pembaca buku) termasuk bagian yang berkacamata tersebut atau tidak. Jadi tidak dapat disimpulkan secara mutlak.'),
('c11d2c25-c1b1-44c5-aeb9-72bff9499724', 'Jika X adalah bilangan genap antara 5 dan 9, dan Y adalah bilangan ganjil antara 6 dan 10, maka nilai X + Y yang mungkin adalah...', 'TIU', '13', '14', '15', '16', 'Semua benar', 'C', NULL, 'X (genap antara 5 dan 9) = {6, 8}. Y (ganjil antara 6 dan 10) = {7, 9}. Kombinasi penjumlahan: 6+7=13, 6+9=15, 8+7=15, 8+9=17. Pilihan yang ada di opsi adalah 15 (C).'),

-- TKP Questions
('c11d2c25-c1b1-44c5-aeb9-72bff9499725', 'Anda sedang mengerjakan laporan penting yang harus dikumpulkan esok pagi, tiba-tiba listrik padam di rumah Anda. Sikap Anda adalah...', 'TKP', 'Pergi tidur dan menyelesaikannya besok pagi-pagi di kantor.', 'Mencari kafe atau tempat yang menyala 24 jam untuk menyelesaikan tugas.', 'Menghubungi atasan dan meminta toleransi waktu karena force majeure.', 'Menunggu listrik menyala kembali sambil bermain ponsel.', 'Marah-marah di media sosial tentang pelayanan PLN.', NULL, '{"A": 3, "B": 5, "C": 4, "D": 2, "E": 1}', 'Aspek Profesionalisme dan Orientasi pada Hasil. Mencari solusi segera (mencari tempat menyala) memiliki poin tertinggi (5). Hubungi atasan (4), kerjakan esok pagi (3), menunggu (2), mengeluh (1).'),
('c11d2c25-c1b1-44c5-aeb9-72bff9499726', 'Rekan kerja Anda melakukan kesalahan yang membuat instansi merugi kecil. Dia sangat panik. Sikap Anda...', 'TKP', 'Melaporkannya langsung kepada atasan agar Anda dinilai jujur.', 'Membantu menenangkan dan membantunya mencari solusi perbaikan bersama.', 'Mengabaikannya karena itu bukan tanggung jawab Anda.', 'Menertawakannya dan menceritakannya ke rekan kerja yang lain.', 'Menasihatinya dengan keras agar tidak mengulangi kesalahan lagi.', NULL, '{"A": 3, "B": 5, "C": 2, "D": 1, "E": 4}', 'Aspek Jejaring Kerja dan Kerja Sama. Membantu menenangkan dan mencari solusi bersama memiliki nilai tertinggi (5). Menasihati dengan baik (4), melapor ke atasan (3), mengabaikan (2), menertawakan (1).')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Exam Questions Junction Table
INSERT INTO public.exam_questions (exam_id, question_id, order_index) VALUES
('b11d2c25-c1b1-44c5-aeb9-72bff9499701', 'c11d2c25-c1b1-44c5-aeb9-72bff9499721', 1),
('b11d2c25-c1b1-44c5-aeb9-72bff9499701', 'c11d2c25-c1b1-44c5-aeb9-72bff9499722', 2),
('b11d2c25-c1b1-44c5-aeb9-72bff9499701', 'c11d2c25-c1b1-44c5-aeb9-72bff9499723', 3),
('b11d2c25-c1b1-44c5-aeb9-72bff9499701', 'c11d2c25-c1b1-44c5-aeb9-72bff9499724', 4),
('b11d2c25-c1b1-44c5-aeb9-72bff9499701', 'c11d2c25-c1b1-44c5-aeb9-72bff9499725', 5),
('b11d2c25-c1b1-44c5-aeb9-72bff9499701', 'c11d2c25-c1b1-44c5-aeb9-72bff9499726', 6)
ON CONFLICT (exam_id, question_id) DO NOTHING;


-- MIGRATION MENDUKUNG SOAL DAN JAWABAN BERGAMBAR (RUN IN SUPABASE SQL EDITOR IF UPDATING EXISTING SYSTEM)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS option_a_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS option_b_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS option_c_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS option_d_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS option_e_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS explanation_image_url TEXT DEFAULT NULL;

-- MIGRATION TINGKAT KESULITAN SOAL (RUN IN SUPABASE SQL EDITOR IF UPDATING EXISTING SYSTEM)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'SEDANG' CHECK (difficulty IN ('MUDAH', 'SEDANG', 'SULIT'));

-- MIGRATION PASSING GRADE PACKAGES (RUN IN SUPABASE SQL EDITOR IF UPDATING EXISTING SYSTEM)
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS passing_twk INTEGER DEFAULT 65 NOT NULL,
ADD COLUMN IF NOT EXISTS passing_tiu INTEGER DEFAULT 80 NOT NULL,
ADD COLUMN IF NOT EXISTS passing_tkp INTEGER DEFAULT 166 NOT NULL;

-- MIGRATION KATEGORI TRYOUT MANDIRI / KELOMPOK (RUN IN SUPABASE SQL EDITOR IF UPDATING EXISTING SYSTEM)
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'MANDIRI' CHECK (category IN ('MANDIRI', 'KELOMPOK'));

-- MIGRATION SUB KATEGORI SOAL (RUN IN SUPABASE SQL EDITOR IF UPDATING EXISTING SYSTEM)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS sub_category TEXT DEFAULT NULL;

-- MIGRATION STORAGE BUCKET DAN KEBIJAKAN (RUN IN SUPABASE SQL EDITOR FOR UPLOAD TO WORK)
-- 1. Buat bucket jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Kebijakan akses publik (membaca gambar)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'question-images');

-- 3. Kebijakan unggah untuk admin
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
CREATE POLICY "Admins can upload images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'question-images' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Kebijakan perbarui untuk admin
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
CREATE POLICY "Admins can update images" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'question-images' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Kebijakan hapus untuk admin
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
CREATE POLICY "Admins can delete images" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'question-images' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );


-- MIGRATION JADWAL DAN HARGA TIKET TRYOUT KELOMPOK
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0 NOT NULL;

-- TABEL BARU PENDAFTARAN TIKET TRYOUT KELOMPOK
CREATE TABLE IF NOT EXISTS public.package_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, package_id)
);

-- AKTIFKAN ROW LEVEL SECURITY
ALTER TABLE public.package_enrollments ENABLE ROW LEVEL SECURITY;

-- KEBIJAKAN AKSES PUBLIC.PACKAGE_ENROLLMENTS
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.package_enrollments;
CREATE POLICY "Users can view their own enrollments" ON public.package_enrollments
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can enroll themselves" ON public.package_enrollments;
CREATE POLICY "Users can enroll themselves" ON public.package_enrollments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to enrollments" ON public.package_enrollments;
CREATE POLICY "Admins have full access to enrollments" ON public.package_enrollments
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- MIGRATION KESEIMBANGAN KESULITAN SOAL TRYOUT MANDIRI
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS twk_mudah INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS twk_sedang INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS twk_sulit INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS tiu_mudah INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS tiu_sedang INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS tiu_sulit INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS tkp_mudah INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS tkp_sedang INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS tkp_sulit INTEGER DEFAULT 0 NOT NULL;

-- FUNGSI RPC PENARIKAN SOAL SECARA ACAK BERDASARKAN KRITERIA
CREATE OR REPLACE FUNCTION public.get_random_exam_questions(
    p_twk_mudah integer,
    p_twk_sedang integer,
    p_twk_sulit integer,
    p_tiu_mudah integer,
    p_tiu_sedang integer,
    p_tiu_sulit integer,
    p_tkp_mudah integer,
    p_tkp_sedang integer,
    p_tkp_sulit integer,
    p_only_free boolean DEFAULT false
)
RETURNS SETOF public.questions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    (SELECT * FROM public.questions WHERE category = 'TWK' AND difficulty = 'MUDAH' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_twk_mudah)
    UNION ALL
    (SELECT * FROM public.questions WHERE category = 'TWK' AND difficulty = 'SEDANG' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_twk_sedang)
    UNION ALL
    (SELECT * FROM public.questions WHERE category = 'TWK' AND difficulty = 'SULIT' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_twk_sulit)
    UNION ALL
    (SELECT * FROM public.questions WHERE category = 'TIU' AND difficulty = 'MUDAH' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_tiu_mudah)
    UNION ALL
    (SELECT * FROM public.questions WHERE category = 'TIU' AND difficulty = 'SEDANG' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_tiu_sedang)
    UNION ALL
    (SELECT * FROM public.questions WHERE category = 'TIU' AND difficulty = 'SULIT' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_tiu_sulit)
    UNION ALL
    (SELECT * FROM public.questions WHERE category = 'TKP' AND difficulty = 'MUDAH' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_tkp_mudah)
    UNION ALL
    (SELECT * FROM public.questions WHERE category = 'TKP' AND difficulty = 'SEDANG' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_tkp_sedang)
    UNION ALL
    (SELECT * FROM public.questions WHERE category = 'TKP' AND difficulty = 'SULIT' AND (NOT p_only_free OR type = 'FREE') ORDER BY random() LIMIT p_tkp_sulit);
END;
$$;


-- MIGRATION KONSISTENSI URUTAN SOAL PER ATTEMPT
ALTER TABLE public.user_answers
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0 NOT NULL;


-- MIGRATION STATUS KELUAR UNTUK ATTEMPT
ALTER TABLE public.exam_attempts DROP CONSTRAINT IF EXISTS exam_attempts_status_check;
ALTER TABLE public.exam_attempts ADD CONSTRAINT exam_attempts_status_check CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'KELUAR'));


-- MIGRATION FITUR PROFIL LENGKAP

-- 1. Tambahkan kolom Alamat Lengkap, Provinsi, Kabupaten, dan Jenis Kelamin ke tabel profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS regency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('LAKI_LAKI', 'PEREMPUAN'));

-- 2. Tabel Transaksi
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    payment_method TEXT DEFAULT 'QRIS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabel Voucher Kupon
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER DEFAULT 0 NOT NULL,
    discount_nominal INTEGER DEFAULT 0 NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabel Afiliasi Pengguna (Referral Codes & Saldo)
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    balance INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabel Relasi Referrals (Siapa mendaftar lewat siapa)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    referee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    commission_earned INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabel Survey Kelulusan CPNS
CREATE TABLE IF NOT EXISTS public.graduation_surveys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    is_graduated BOOLEAN NOT NULL,
    target_agency TEXT NOT NULL,
    skd_score INTEGER,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Aktifkan RLS dan buat Kebijakan (Policies) agar pengguna hanya bisa mengakses data milik sendiri
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduation_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own affiliate info" ON public.affiliates;
CREATE POLICY "Users can view own affiliate info" ON public.affiliates FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own affiliate info" ON public.affiliates;
CREATE POLICY "Users can insert own affiliate info" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view referrals they generated" ON public.referrals;
CREATE POLICY "Users can view referrals they generated" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can view own graduation survey" ON public.graduation_surveys;
CREATE POLICY "Users can view own graduation survey" ON public.graduation_surveys FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own graduation survey" ON public.graduation_surveys;
CREATE POLICY "Users can insert own graduation survey" ON public.graduation_surveys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed Vouchers
INSERT INTO public.vouchers (code, discount_percent, discount_nominal, is_active) VALUES
('DISKON30', 30, 0, true),
('PEJUANGKILAT', 50, 0, true),
('BARUSTART', 0, 15000, true)
ON CONFLICT (code) DO NOTHING;


-- MIGRATION MIDTRANS CORE API CUSTOM UI
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_detail TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- MIGRATION VOUCHER QUANTITY & EXPIRY LIMITS
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS max_usages INTEGER DEFAULT NULL;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS voucher_code TEXT DEFAULT NULL;

-- Enable RLS on vouchers
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Select policy: all authenticated users can view vouchers
DROP POLICY IF EXISTS "Anyone can select vouchers" ON public.vouchers;
CREATE POLICY "Anyone can select vouchers" ON public.vouchers FOR SELECT TO authenticated USING (true);

-- Manage policy: only admins can create, update, delete vouchers
DROP POLICY IF EXISTS "Admins can manage vouchers" ON public.vouchers;
CREATE POLICY "Admins can manage vouchers" ON public.vouchers FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- MIGRATION KLASIFIKASI SOAL FREE & PREMIUM
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'FREE' CHECK (type IN ('FREE', 'PREMIUM'));


-- MIGRATION FITUR BLOG INFORMASI
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT DEFAULT NULL,
    seo_title TEXT DEFAULT NULL,
    seo_description TEXT DEFAULT NULL,
    seo_keywords TEXT DEFAULT NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published blogs" ON public.blogs;
CREATE POLICY "Anyone can read published blogs" ON public.blogs
    FOR SELECT USING (
        is_published = true OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins have full control on blogs" ON public.blogs;
CREATE POLICY "Admins have full control on blogs" ON public.blogs
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
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

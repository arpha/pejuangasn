export type CategoryType = 'TWK' | 'TIU' | 'TKP';
export type RoleType = 'user' | 'admin';
export type SubscriptionType = 'FREE' | 'PREMIUM';
export type AttemptStatusType = 'IN_PROGRESS' | 'COMPLETED' | 'KELUAR';
export type DifficultyType = 'MUDAH' | 'SEDANG' | 'SULIT';
export type TryoutCategoryType = 'MANDIRI' | 'KELOMPOK';
export type SubCategoryType = 
  // TWK
  | 'Nasionalisme' | 'Integritas' | 'Bela Negara' | 'Pilar Negara' | 'Bahasa Indonesia'
  // TIU
  | 'Analogi' | 'Silogisme' | 'Analitis' | 'Berhitung' | 'Deret' | 'Perbandingan' | 'Soal Cerita' | 'Analogi Figural' | 'Ketidaksamaan Figural' | 'Serial Figural'
  // TKP
  | 'Pelayanan Publik' | 'Jejaring Kerja' | 'Sosial Budaya' | 'TIK' | 'Profesionalisme' | 'Anti Radikalisme';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: RoleType;
  subscription_status: SubscriptionType;
  created_at: string;
  whatsapp?: string;
  address?: string;
  province?: string;
  regency?: string;
  gender?: 'LAKI_LAKI' | 'PEREMPUAN';
}

export interface Material {
  id: string;
  title: string;
  slug: string;
  category: CategoryType;
  content: string;
  created_at: string;
}

export interface Package {
  id: string;
  title: string;
  description: string | null;
  type: SubscriptionType;
  category?: TryoutCategoryType;
  duration_minutes: number;
  total_questions: number;
  passing_twk: number;
  passing_tiu: number;
  passing_tkp: number;
  start_time?: string | null;
  end_time?: string | null;
  price?: number;
  twk_mudah?: number;
  twk_sedang?: number;
  twk_sulit?: number;
  tiu_mudah?: number;
  tiu_sedang?: number;
  tiu_sulit?: number;
  tkp_mudah?: number;
  tkp_sedang?: number;
  tkp_sulit?: number;
  created_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  category: CategoryType;
  sub_category?: SubCategoryType | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_option: string | null; // Nullable for TKP
  scale_points: Record<string, number> | null; // E.g., {"A": 5, "B": 4, ...} for TKP
  explanation: string | null;
  image_url?: string | null;
  option_a_image_url?: string | null;
  option_b_image_url?: string | null;
  option_c_image_url?: string | null;
  option_d_image_url?: string | null;
  option_e_image_url?: string | null;
  explanation_image_url?: string | null;
  difficulty?: DifficultyType;
  type?: SubscriptionType;
  material_id?: string | null;
  created_at: string;
  order_index?: number; // Junction info
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  status: AttemptStatusType;
  started_at: string;
  completed_at: string | null;
  score_twk: number;
  score_tiu: number;
  score_tkp: number;
  score_total: number;
  is_passed: boolean;
  created_at: string;
  packages?: Package; // Joined
}

export interface UserAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: string | null;
  points_earned: number;
  order_index?: number;
  answered_at: string;
}

// CAT Session Store Interface
export interface CATState {
  attemptId: string | null;
  examId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> selectedOption ('A' | 'B' | 'C' | 'D' | 'E')
  flaggedQuestions: Record<string, boolean>; // questionId -> isFlagged (ragu-ragu)
  timeLeft: number; // in seconds
  isActive: boolean;
  
  // Actions
  startExam: (attemptId: string, examId: string, questions: Question[], durationMinutes: number) => void;
  selectOption: (questionId: string, option: string) => void;
  toggleFlag: (questionId: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  tick: () => void;
  setTimeLeft: (time: number) => void;
  resetExam: () => void;
}

export interface Transaction {
  id: string;
  user_id: string;
  package_id: string | null;
  title: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  payment_method: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount_percent: number;
  discount_nominal: number;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  balance: number;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  commission_earned: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface GraduationSurvey {
  id: string;
  user_id: string;
  is_graduated: boolean;
  target_agency: string;
  skd_score: number | null;
  feedback: string | null;
  created_at: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMaterialProgress {
  id: string;
  user_id: string;
  material_id: string;
  is_completed: boolean;
  completed_at: string | null;
  quiz_completed: boolean;
  quiz_score: number;
  created_at: string;
}



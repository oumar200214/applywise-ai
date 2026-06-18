/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  role: 'student' | 'intern' | 'junior' | 'jobseeker'
  language_preference: 'en' | 'fr'
  /** Plan d'abonnement actif — géré via Dodo Payments webhooks */
  plan: 'free' | 'pro' | 'premium'
  /** Conservé pour usage futur "à la carte" — non utilisé comme garde principal */
  credits_remaining: number
  onboarding_completed: boolean
  career_goal?: string
  target_industries?: string[]
  target_regions?: string[]
  education_level?: string
  field_of_study?: string
  years_of_experience?: number
  main_skills?: string[]
  languages?: string[]
  linkedin_url?: string
  preferred_tone?: string
  preferred_cv_style?: string
  // ── Dodo Payments subscription fields ──
  subscription_id?: string | null
  plan_interval?: 'monthly' | 'yearly' | null
  plan_activated_at?: string | null
  plan_expires_at?: string | null
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  user_id: string
  job_title: string
  company_name: string
  job_post_url?: string
  job_description: string
  country?: string
  job_type?: string
  job_language?: string
  deadline?: string
  cv_profile_id?: string
  selected_outputs?: string[]
  tone?: string
  output_language?: string
  match_score?: number
  strong_fit_areas?: string[]
  missing_skills?: string[]
  ats_keywords?: string[]
  ai_summary?: string
  recommended_action?: string
  status: 'draft' | 'generating' | 'generated' | 'applied' | 'interview' | 'rejected' | 'offer'
  created_at: string
  updated_at: string
}

export interface CVProfile {
  id: string
  user_id: string
  name: string
  raw_cv_text?: string
  file_url?: string
  education?: string
  experience?: string
  projects?: string
  skills?: string
  certifications?: string
  languages?: string
  created_at: string
  updated_at: string
}

export interface CVResult {
  id: string
  user_id: string
  application_id: string
  header_section?: string
  summary_section?: string
  education_section?: string
  experience_section?: string
  projects_section?: string
  skills_section?: string
  certifications_section?: string
  languages_section?: string
  full_cv_text?: string
  ats_score?: number
  version_number: number
  created_at: string
}

export interface CoverLetter {
  id: string
  user_id: string
  application_id: string
  opening_paragraph?: string
  body_paragraph_1?: string
  body_paragraph_2?: string
  closing_paragraph?: string
  full_letter_text?: string
  tone?: string
  language?: string
  version_number: number
  created_at: string
}

export interface InterviewPack {
  id: string
  user_id: string
  application_id: string
  general_questions?: string[]
  behavioral_questions?: string[]
  technical_questions?: string[]
  company_questions?: string[]
  suggested_answers?: string[]
  star_answers?: string[]
  questions_to_ask_recruiter?: string[]
  interview_summary?: string
  created_at: string
}

export interface SkillGapAnalysis {
  id: string
  user_id: string
  application_id: string
  required_skills?: string[]
  user_skills?: string[]
  missing_skills?: string[]
  priority_skills?: string[]
  skill_gap_summary?: string
  seven_day_plan?: string
  created_at: string
}

export interface ApplicationTracker {
  id: string
  user_id: string
  application_id: string
  job_title: string
  company_name: string
  match_score?: number
  deadline?: string
  status: 'draft' | 'ready' | 'applied' | 'interview' | 'rejected' | 'offer'
  date_applied?: string
  notes?: string
  next_action?: string
  next_action_date?: string
  documents_ready: boolean
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: 'used' | 'added' | 'refund'
  credits_amount: number
  reason: string
  application_id?: string
  created_at: string
}

export interface AIRequest {
  id: string
  user_id: string
  application_id: string
  status: 'pending' | 'success' | 'failed'
  prompt_used?: string
  ai_response_raw?: any
  error_message?: string
  model_used?: string
  estimated_tokens?: number
  created_at: string
}

export interface CourseRecommendation {
  skill: string
  reason: string
  level: string
  recommended_search_query: string
}

export interface AIGenerationResponse {
  match_score: number
  strong_fit_areas: string[]
  missing_skills: string[]
  ats_keywords: string[]
  ai_summary: string
  recommended_action: string
  tailored_cv: {
    header_section: string
    summary_section: string
    education_section: string
    experience_section: string
    projects_section: string
    skills_section: string
    certifications_section: string
    languages_section: string
    full_cv_text: string
  }
  cover_letter: {
    opening_paragraph: string
    body_paragraph_1: string
    body_paragraph_2: string
    closing_paragraph: string
    full_letter_text: string
  }
  interview_pack: {
    general_questions: string[]
    behavioral_questions: string[]
    technical_questions: string[]
    company_questions: string[]
    suggested_answers: string[]
    star_answers: string[]
    questions_to_ask_recruiter: string[]
    interview_summary: string
  }
  skill_gap_analysis: {
    required_skills: string[]
    user_skills: string[]
    missing_skills: string[]
    priority_skills: string[]
    skill_gap_summary: string
    seven_day_plan: string
  }
  course_recommendations: CourseRecommendation[]
}

-- ==========================================
-- ApplyWise AI - Complete Database Schema
-- ==========================================

-- 1. Users Profile
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'student' CHECK (role IN ('student','intern','junior','jobseeker')),
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en','fr')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','student','pro')),
  credits_remaining INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT false,
  career_goal TEXT,
  target_industries TEXT[],
  target_regions TEXT[],
  education_level TEXT,
  field_of_study TEXT,
  years_of_experience INTEGER DEFAULT 0,
  main_skills TEXT[],
  languages TEXT[],
  linkedin_url TEXT,
  preferred_tone TEXT DEFAULT 'Professional',
  preferred_cv_style TEXT DEFAULT 'Modern',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CV Profiles
CREATE TABLE IF NOT EXISTS cv_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'My CV',
  raw_cv_text TEXT,
  file_url TEXT,
  education TEXT,
  experience TEXT,
  projects TEXT,
  skills TEXT,
  certifications TEXT,
  languages TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  job_post_url TEXT,
  job_description TEXT NOT NULL,
  country TEXT,
  job_type TEXT,
  job_language TEXT DEFAULT 'English',
  deadline TEXT,
  cv_profile_id UUID REFERENCES cv_profiles(id),
  selected_outputs TEXT[],
  tone TEXT DEFAULT 'Professional',
  output_language TEXT DEFAULT 'English',
  match_score INTEGER,
  strong_fit_areas TEXT[],
  missing_skills TEXT[],
  ats_keywords TEXT[],
  ai_summary TEXT,
  recommended_action TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','generating','generated','applied','interview','rejected','offer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CV Results
CREATE TABLE IF NOT EXISTS cv_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  header_section TEXT,
  summary_section TEXT,
  education_section TEXT,
  experience_section TEXT,
  projects_section TEXT,
  skills_section TEXT,
  certifications_section TEXT,
  languages_section TEXT,
  full_cv_text TEXT,
  ats_score INTEGER,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Cover Letters
CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  opening_paragraph TEXT,
  body_paragraph_1 TEXT,
  body_paragraph_2 TEXT,
  closing_paragraph TEXT,
  full_letter_text TEXT,
  tone TEXT,
  language TEXT,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Interview Packs
CREATE TABLE IF NOT EXISTS interview_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  general_questions JSONB DEFAULT '[]',
  behavioral_questions JSONB DEFAULT '[]',
  technical_questions JSONB DEFAULT '[]',
  company_questions JSONB DEFAULT '[]',
  suggested_answers JSONB DEFAULT '[]',
  star_answers JSONB DEFAULT '[]',
  questions_to_ask_recruiter JSONB DEFAULT '[]',
  interview_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Interview Questions (individual)
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  interview_pack_id UUID REFERENCES interview_packs(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT,
  why_they_ask TEXT,
  answer_structure TEXT,
  sample_answer TEXT,
  difficulty TEXT,
  ai_feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Skill Gap Analyses
CREATE TABLE IF NOT EXISTS skill_gap_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  required_skills JSONB DEFAULT '[]',
  user_skills JSONB DEFAULT '[]',
  missing_skills JSONB DEFAULT '[]',
  priority_skills JSONB DEFAULT '[]',
  skill_gap_summary TEXT,
  seven_day_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Application Tracker
CREATE TABLE IF NOT EXISTS application_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  match_score INTEGER,
  deadline TEXT,
  status TEXT DEFAULT 'ready' CHECK (status IN ('draft','ready','applied','interview','rejected','offer')),
  date_applied TEXT,
  notes TEXT,
  next_action TEXT,
  next_action_date TEXT,
  documents_ready BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. AI Requests
CREATE TABLE IF NOT EXISTS ai_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  prompt_used TEXT,
  ai_response_raw JSONB,
  error_message TEXT,
  model_used TEXT,
  estimated_tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('used','added','refund')),
  credits_amount INTEGER NOT NULL,
  reason TEXT,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  plan TEXT,
  credits_purchased INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT,
  skill TEXT,
  level TEXT,
  duration TEXT,
  certificate_available BOOLEAN DEFAULT false,
  price_type TEXT DEFAULT 'free',
  course_url TEXT,
  affiliate_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- Row Level Security Policies
-- ==========================================

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users Profile: User can only read/write their own
CREATE POLICY "Users can view own profile" ON users_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON users_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON users_profile FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CV Profiles
CREATE POLICY "Users can view own cv_profiles" ON cv_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cv_profiles" ON cv_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cv_profiles" ON cv_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cv_profiles" ON cv_profiles FOR DELETE USING (auth.uid() = user_id);

-- Applications
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON applications FOR DELETE USING (auth.uid() = user_id);

-- CV Results
CREATE POLICY "Users can view own cv_results" ON cv_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cv_results" ON cv_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cv_results" ON cv_results FOR UPDATE USING (auth.uid() = user_id);

-- Cover Letters
CREATE POLICY "Users can view own cover_letters" ON cover_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cover_letters" ON cover_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cover_letters" ON cover_letters FOR UPDATE USING (auth.uid() = user_id);

-- Interview Packs
CREATE POLICY "Users can view own interview_packs" ON interview_packs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview_packs" ON interview_packs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Interview Questions
CREATE POLICY "Users can view own interview_questions" ON interview_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview_questions" ON interview_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interview_questions" ON interview_questions FOR UPDATE USING (auth.uid() = user_id);

-- Skill Gap
CREATE POLICY "Users can view own skill_gap" ON skill_gap_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill_gap" ON skill_gap_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tracker
CREATE POLICY "Users can view own tracker" ON application_tracker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tracker" ON application_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tracker" ON application_tracker FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tracker" ON application_tracker FOR DELETE USING (auth.uid() = user_id);

-- AI Requests
CREATE POLICY "Users can view own ai_requests" ON ai_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_requests" ON ai_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai_requests" ON ai_requests FOR UPDATE USING (auth.uid() = user_id);

-- Credit Transactions
CREATE POLICY "Users can view own credit_transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit_transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Courses: Public read
CREATE POLICY "Anyone can view active courses" ON courses FOR SELECT USING (is_active = true);

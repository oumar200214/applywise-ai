-- ==========================================
-- ApplyWise AI — Database Setup & Dodo Migration
-- ==========================================

-- 1. CRÉATION DE LA TABLE SI ELLE N'EXISTE PAS
-- Cette commande va créer la table complète si vous venez de créer votre projet Supabase.
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  language_preference TEXT DEFAULT 'fr',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  credits_remaining INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  career_goal TEXT,
  target_industries TEXT[],
  target_regions TEXT[],
  education_level TEXT,
  field_of_study TEXT,
  years_of_experience INTEGER,
  main_skills TEXT[],
  languages TEXT[],
  linkedin_url TEXT,
  preferred_tone TEXT,
  preferred_cv_style TEXT,
  subscription_id TEXT,
  plan_interval TEXT CHECK (plan_interval IN ('monthly', 'yearly')),
  plan_activated_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MISE À JOUR DE LA TABLE SI ELLE EXISTAIT DÉJÀ
-- (Ce bloc DO $$ permet d'ajouter les colonnes en toute sécurité sans erreurs)
DO $$ 
BEGIN 
  -- Modifier la contrainte de vérification des plans
  ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_plan_check;
  ALTER TABLE users_profile ADD CONSTRAINT users_profile_plan_check CHECK (plan IN ('free', 'pro', 'premium'));

  -- Ajouter les nouvelles colonnes d'abonnement Dodo
  BEGIN
    ALTER TABLE users_profile ADD COLUMN subscription_id TEXT;
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE users_profile ADD COLUMN plan_interval TEXT CHECK (plan_interval IN ('monthly', 'yearly'));
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE users_profile ADD COLUMN plan_activated_at TIMESTAMPTZ;
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE users_profile ADD COLUMN plan_expires_at TIMESTAMPTZ;
  EXCEPTION WHEN duplicate_column THEN END;
  
  -- Migrer l'ancien plan "student" vers "pro"
  UPDATE users_profile SET plan = 'pro' WHERE plan = 'student';
END $$;

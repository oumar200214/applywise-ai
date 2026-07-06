-- ═══════════════════════════════════════════════════════════════════
-- ApplyWise AI — Schéma Supabase
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════
-- 1. PROFIL UTILISATEUR
-- ═══════════════════════════════════════════════════════════════════
create table if not exists users_profile (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  full_name             text,
  email                 text,
  role                  text,                        -- student | intern | junior | jobseeker
  language_preference   text default 'en',
  plan                  text not null default 'free', -- free | pro | premium
  credits_remaining     integer not null default 3,
  onboarding_completed  boolean not null default false,
  career_goal           text,
  target_industries     text[],
  target_regions        text[],
  education_level       text,
  field_of_study        text,
  years_of_experience   integer,
  main_skills           text[],
  languages             text[],
  linkedin_url          text,
  preferred_tone        text default 'Professional',
  preferred_cv_style    text default 'Modern',
  -- Dodo Payments
  subscription_id       text,
  plan_interval         text,                         -- monthly | yearly
  plan_activated_at     timestamptz,
  plan_expires_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-créer le profil dès l'inscription
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into users_profile (user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- 2. CANDIDATURES
-- ═══════════════════════════════════════════════════════════════════
create table if not exists applications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  job_title         text not null,
  company_name      text,
  job_description   text not null,
  job_url           text,
  country           text,
  job_type          text,
  cv_text           text not null,
  selected_outputs  text[],
  tone              text,
  output_language   text,
  status            text not null default 'draft',    -- draft|generating|generated|error
  match_score       integer,
  strong_fit_areas  text[],
  missing_skills    text[],
  ats_keywords      text[],
  ai_summary        text,
  recommended_action text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_applications_user_id on applications(user_id);
create index if not exists idx_applications_created_at on applications(created_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- 3. RÉSULTATS DE GÉNÉRATION IA
-- ═══════════════════════════════════════════════════════════════════
create table if not exists generation_results (
  id               uuid primary key default gen_random_uuid(),
  application_id   uuid not null unique references applications(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  data             jsonb not null,                   -- AIGenerationResponse complète
  tokens_used      integer,
  generated_at     timestamptz not null default now()
);

create index if not exists idx_generation_results_app_id on generation_results(application_id);
create index if not exists idx_generation_results_user_id on generation_results(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 4. TRACKER DE CANDIDATURES
-- ═══════════════════════════════════════════════════════════════════
create table if not exists tracker_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  application_id   uuid references applications(id) on delete set null,
  job_title        text not null,
  company_name     text,
  match_score      integer,
  status           text not null default 'ready',    -- draft|ready|applied|interview|rejected|offer
  deadline         date,
  date_applied     date,
  notes            text,
  docs_ready       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_tracker_user_id on tracker_entries(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 5. TRANSACTIONS DE CRÉDITS
-- ═══════════════════════════════════════════════════════════════════
create table if not exists credit_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,   -- used | added | refund
  amount     integer not null,
  reason     text,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_transactions_user_id on credit_transactions(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 6. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════
alter table users_profile       enable row level security;
alter table applications        enable row level security;
alter table generation_results  enable row level security;
alter table tracker_entries     enable row level security;
alter table credit_transactions enable row level security;

-- users_profile : chaque utilisateur ne voit que son profil
create policy "users_profile_self" on users_profile
  for all using (auth.uid() = user_id);

-- applications
create policy "applications_self" on applications
  for all using (auth.uid() = user_id);

-- generation_results
create policy "generation_results_self" on generation_results
  for all using (auth.uid() = user_id);

-- tracker_entries
create policy "tracker_entries_self" on tracker_entries
  for all using (auth.uid() = user_id);

-- credit_transactions
create policy "credit_transactions_self" on credit_transactions
  for all using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 7. TRIGGER updated_at automatique
-- ═══════════════════════════════════════════════════════════════════
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_profile_updated_at
  before update on users_profile
  for each row execute procedure set_updated_at();

create trigger trg_applications_updated_at
  before update on applications
  for each row execute procedure set_updated_at();

create trigger trg_tracker_updated_at
  before update on tracker_entries
  for each row execute procedure set_updated_at();

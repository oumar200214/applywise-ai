/**
 * Postulis — Couche de persistance Supabase (async)
 *
 * Remplace les appels localStorage de storage.ts.
 * Toutes les fonctions sont async et utilisent le client Supabase browser.
 * Fallback sur localStorage si l'utilisateur n'est pas connecté.
 */

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { StoredApplication, StoredResult, TrackerEntry, StoredProfile } from '@/lib/storage'
import {
  getApplications as lsGetApplications,
  getApplication as lsGetApplication,
  saveApplication as lsSaveApplication,
  updateApplication as lsUpdateApplication,
  deleteApplication as lsDeleteApplication,
  getGenerationResult as lsGetGenerationResult,
  saveGenerationResult as lsSaveGenerationResult,
  getTrackerEntries as lsGetTrackerEntries,
  addTrackerEntry as lsAddTrackerEntry,
  updateTrackerEntry as lsUpdateTrackerEntry,
  deleteTrackerEntry as lsDeleteTrackerEntry,
  getUserProfile as lsGetUserProfile,
  updateUserProfile as lsUpdateUserProfile,
  getCredits as lsGetCredits,
  setCredits as lsSetCredits,
  getCreditTransactions as lsGetCreditTransactions,
  deductCredit as lsDeductCredit,
  hasPaidPlan as lsHasPaidPlan,
  canGenerate as lsCanGenerate,
  getDashboardStats as lsGetDashboardStats,
  generateId,
  isLocalSynced,
  markLocalSynced,
} from '@/lib/storage'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// User cache — deduplicates concurrent getSession() calls to prevent
// navigator.locks contention ("lock was released because another request stole it").
// Multiple db.ts functions called in the same render cycle share one getSession() call.
let _userCache: { user: User | null; expiresAt: number } | null = null
let _userPromise: Promise<User | null> | null = null

async function getCurrentUser(): Promise<User | null> {
  // Return cached value if still fresh (5s TTL)
  if (_userCache && Date.now() < _userCache.expiresAt) return _userCache.user
  // Dedup: if a getSession() is already in flight, piggyback on it
  if (_userPromise) return _userPromise

  const supabase = createClient()
  _userPromise = withFallback(
    supabase.auth.getSession().then(({ data: { session } }) => session?.user ?? null),
    null,
    2000
  ).then(user => {
    _userCache = { user, expiresAt: Date.now() + 5000 }
    _userPromise = null
    return user
  }).catch(() => {
    _userPromise = null
    return null
  })

  return _userPromise
}

/** Call on sign-out so db.ts doesn't serve the old user for up to 5 seconds. */
export function clearUserCache(): void {
  _userCache = null
  _userPromise = null
}

// Race a Supabase query against a timeout. Returns fallback if Supabase is paused or slow.
async function withFallback<T>(queryPromise: PromiseLike<T>, fallback: T, ms = 5000): Promise<T> {
  return Promise.race([
    Promise.resolve(queryPromise),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────

export async function dbGetApplications(): Promise<StoredApplication[]> {
  const user = await getCurrentUser()
  if (!user) return lsGetApplications()

  const supabase = createClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return lsGetApplications()

  return data.map(r => ({
    id: r.id,
    userId: r.user_id,
    jobTitle: r.job_title,
    companyName: r.company_name ?? '',
    jobDescription: r.job_description,
    jobUrl: r.job_url ?? '',
    country: r.country ?? '',
    jobType: r.job_type ?? '',
    cvText: r.cv_text,
    selectedOutputs: r.selected_outputs ?? [],
    tone: r.tone ?? 'Professional',
    outputLanguage: r.output_language ?? 'English',
    status: r.status,
    matchScore: r.match_score ?? undefined,
    strongFitAreas: r.strong_fit_areas ?? undefined,
    missingSkills: r.missing_skills ?? undefined,
    atsKeywords: r.ats_keywords ?? undefined,
    aiSummary: r.ai_summary ?? undefined,
    recommendedAction: r.recommended_action ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function dbGetApplication(id: string): Promise<StoredApplication | null> {
  const local = lsGetApplication(id)
  const user = await getCurrentUser()
  if (!user) return local

  const supabase = createClient()
  const queryPromise = supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
    .then(({ data, error }) => {
      if (error || !data) return local
      return {
        id: data.id,
        userId: data.user_id,
        jobTitle: data.job_title,
        companyName: data.company_name ?? '',
        jobDescription: data.job_description,
        jobUrl: data.job_url ?? '',
        country: data.country ?? '',
        jobType: data.job_type ?? '',
        cvText: data.cv_text,
        selectedOutputs: data.selected_outputs ?? [],
        tone: data.tone ?? 'Professional',
        outputLanguage: data.output_language ?? 'English',
        status: data.status,
        matchScore: data.match_score ?? undefined,
        strongFitAreas: data.strong_fit_areas ?? undefined,
        missingSkills: data.missing_skills ?? undefined,
        atsKeywords: data.ats_keywords ?? undefined,
        aiSummary: data.ai_summary ?? undefined,
        recommendedAction: data.recommended_action ?? undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as StoredApplication
    })

  return withFallback(queryPromise, local, 3000)
}

export function dbSaveApplication(app: StoredApplication): void {
  // Write to localStorage synchronously — this is the source of truth for navigation.
  // Returns immediately so the caller (handleGenerate) is never blocked.
  lsSaveApplication(app)

  // Background-only Supabase sync — never awaited, never blocks the UI.
  ;(async () => {
    try {
      const user = await getCurrentUser()
      if (!user) return
      const supabase = createClient()
      await supabase.from('applications').upsert({
        id: app.id,
        user_id: user.id,
        job_title: app.jobTitle,
        company_name: app.companyName,
        job_description: app.jobDescription,
        job_url: app.jobUrl,
        country: app.country,
        job_type: app.jobType,
        cv_text: app.cvText,
        selected_outputs: app.selectedOutputs,
        tone: app.tone,
        output_language: app.outputLanguage,
        status: app.status,
        match_score: app.matchScore,
        strong_fit_areas: app.strongFitAreas,
        missing_skills: app.missingSkills,
        ats_keywords: app.atsKeywords,
        ai_summary: app.aiSummary,
        recommended_action: app.recommendedAction,
      }, { onConflict: 'id' })
    } catch { /* ignore — localStorage already has the data */ }
  })()
}

export async function dbUpdateApplication(id: string, updates: Partial<StoredApplication>): Promise<void> {
  lsUpdateApplication(id, updates)

  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  const patch: Record<string, unknown> = {}
  if (updates.status !== undefined)           patch.status = updates.status
  if (updates.matchScore !== undefined)       patch.match_score = updates.matchScore
  if (updates.strongFitAreas !== undefined)   patch.strong_fit_areas = updates.strongFitAreas
  if (updates.missingSkills !== undefined)    patch.missing_skills = updates.missingSkills
  if (updates.atsKeywords !== undefined)      patch.ats_keywords = updates.atsKeywords
  if (updates.aiSummary !== undefined)        patch.ai_summary = updates.aiSummary
  if (updates.recommendedAction !== undefined) patch.recommended_action = updates.recommendedAction

  if (Object.keys(patch).length === 0) return
  await supabase.from('applications').update(patch).eq('id', id).eq('user_id', user.id)
}

export async function dbDeleteApplication(id: string): Promise<void> {
  lsDeleteApplication(id)

  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  await supabase.from('applications').delete().eq('id', id).eq('user_id', user.id)
}

// ─── RÉSULTATS DE GÉNÉRATION ──────────────────────────────────────────────────

export async function dbSaveGenerationResult(result: StoredResult): Promise<void> {
  lsSaveGenerationResult(result)

  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()

  // Guarantee the parent application row exists before inserting the result.
  // dbSaveApplication is fire-and-forget so it may not have committed yet,
  // and a missing FK would silently drop both rows.
  const localApp = lsGetApplication(result.applicationId)
  if (localApp) {
    await supabase.from('applications').upsert({
      id: localApp.id,
      user_id: user.id,
      job_title: localApp.jobTitle,
      company_name: localApp.companyName || null,
      job_description: localApp.jobDescription,
      job_url: localApp.jobUrl || null,
      country: localApp.country || null,
      job_type: localApp.jobType || null,
      cv_text: localApp.cvText,
      selected_outputs: localApp.selectedOutputs,
      tone: localApp.tone,
      output_language: localApp.outputLanguage,
      status: localApp.status,
    }, { onConflict: 'id' })
  }

  await supabase.from('generation_results').upsert({
    application_id: result.applicationId,
    user_id: user.id,
    data: result.data,
    tokens_used: result.tokensUsed,
    generated_at: result.generatedAt,
  }, { onConflict: 'application_id' })
}

export async function dbGetGenerationResult(applicationId: string): Promise<StoredResult | null> {
  const local = lsGetGenerationResult(applicationId)

  const user = await getCurrentUser()
  if (!user) return local

  const supabase = createClient()
  const { data, error } = await supabase
    .from('generation_results')
    .select('*')
    .eq('application_id', applicationId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return local

  return {
    applicationId: data.application_id,
    data: data.data,
    tokensUsed: data.tokens_used,
    generatedAt: data.generated_at,
  }
}

// ─── TRACKER ──────────────────────────────────────────────────────────────────

export async function dbGetTrackerEntries(): Promise<TrackerEntry[]> {
  const user = await getCurrentUser()
  if (!user) return lsGetTrackerEntries()

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tracker_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return lsGetTrackerEntries()

  return data.map(r => ({
    id: r.id,
    applicationId: r.application_id ?? '',
    jobTitle: r.job_title,
    companyName: r.company_name ?? '',
    matchScore: r.match_score ?? undefined,
    status: r.status,
    deadline: r.deadline ?? undefined,
    dateApplied: r.date_applied ?? undefined,
    notes: r.notes ?? undefined,
    docsReady: r.docs_ready,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function dbAddTrackerEntry(
  entry: Omit<TrackerEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TrackerEntry> {
  const local = lsAddTrackerEntry(entry)

  const user = await getCurrentUser()
  if (!user) return local

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tracker_entries')
    .insert({
      id: local.id,
      user_id: user.id,
      application_id: entry.applicationId || null,
      job_title: entry.jobTitle,
      company_name: entry.companyName,
      match_score: entry.matchScore ?? null,
      status: entry.status,
      deadline: entry.deadline ?? null,
      date_applied: entry.dateApplied ?? null,
      notes: entry.notes ?? null,
      docs_ready: entry.docsReady,
    })
    .select()
    .single()

  if (error || !data) return local

  return {
    id: data.id,
    applicationId: data.application_id ?? '',
    jobTitle: data.job_title,
    companyName: data.company_name ?? '',
    matchScore: data.match_score ?? undefined,
    status: data.status,
    deadline: data.deadline ?? undefined,
    dateApplied: data.date_applied ?? undefined,
    notes: data.notes ?? undefined,
    docsReady: data.docs_ready,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function dbUpdateTrackerEntry(id: string, updates: Partial<TrackerEntry>): Promise<void> {
  lsUpdateTrackerEntry(id, updates)

  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  const patch: Record<string, unknown> = {}
  if (updates.status !== undefined)      patch.status = updates.status
  if (updates.dateApplied !== undefined) patch.date_applied = updates.dateApplied
  if (updates.notes !== undefined)       patch.notes = updates.notes
  if (updates.deadline !== undefined)    patch.deadline = updates.deadline
  if (updates.docsReady !== undefined)   patch.docs_ready = updates.docsReady

  if (Object.keys(patch).length === 0) return
  await supabase.from('tracker_entries').update(patch).eq('id', id).eq('user_id', user.id)
}

export async function dbDeleteTrackerEntry(id: string): Promise<void> {
  lsDeleteTrackerEntry(id)

  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  await supabase.from('tracker_entries').delete().eq('id', id).eq('user_id', user.id)
}

// ─── PROFIL & PLAN ───────────────────────────────────────────────────────────

export async function dbGetUserPlan(): Promise<'free' | 'pro' | 'premium'> {
  const user = await getCurrentUser()
  if (!user) return lsGetUserProfile().plan ?? 'free'

  const supabase = createClient()
  const { data, error } = await supabase
    .from('users_profile')
    .select('plan, plan_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return 'free'

  // Expiration automatique
  if (data.plan_expires_at && new Date(data.plan_expires_at) < new Date()) {
    await supabase
      .from('users_profile')
      .update({ plan: 'free', subscription_id: null, plan_expires_at: null })
      .eq('user_id', user.id)
    return 'free'
  }

  const plan = (data.plan ?? 'free') as 'free' | 'pro' | 'premium'
  // Sync vers localStorage pour les lectures synchrones
  lsUpdateUserProfile({ plan })
  return plan
}

export async function dbGetUserProfile(): Promise<StoredProfile> {
  const local = lsGetUserProfile()
  const user = await getCurrentUser()
  if (!user) return local

  const supabase = createClient()
  const { data, error } = await supabase
    .from('users_profile')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return local

  const plan = (data.plan ?? 'free') as 'free' | 'pro' | 'premium'
  const merged: StoredProfile = {
    fullName: data.full_name ?? local.fullName,
    email: data.email ?? local.email,
    role: data.role ?? local.role,
    educationLevel: data.education_level ?? local.educationLevel,
    fieldOfStudy: data.field_of_study ?? local.fieldOfStudy,
    targetIndustries: data.target_industries ?? local.targetIndustries,
    targetRegions: data.target_regions ?? local.targetRegions,
    languagePreference: data.language_preference ?? local.languagePreference,
    preferredTone: data.preferred_tone ?? local.preferredTone,
    preferredCvStyle: data.preferred_cv_style ?? local.preferredCvStyle,
    onboardingCompleted: data.onboarding_completed ?? local.onboardingCompleted,
    plan,
  }

  lsUpdateUserProfile(merged)
  return merged
}

export async function dbUpdateUserProfile(updates: Partial<StoredProfile>): Promise<void> {
  lsUpdateUserProfile(updates)

  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  const patch: Record<string, unknown> = {}
  if (updates.fullName !== undefined)          patch.full_name = updates.fullName
  if (updates.role !== undefined)              patch.role = updates.role
  if (updates.educationLevel !== undefined)    patch.education_level = updates.educationLevel
  if (updates.fieldOfStudy !== undefined)      patch.field_of_study = updates.fieldOfStudy
  if (updates.targetIndustries !== undefined)  patch.target_industries = updates.targetIndustries
  if (updates.targetRegions !== undefined)     patch.target_regions = updates.targetRegions
  if (updates.languagePreference !== undefined) patch.language_preference = updates.languagePreference
  if (updates.preferredTone !== undefined)     patch.preferred_tone = updates.preferredTone
  if (updates.preferredCvStyle !== undefined)  patch.preferred_cv_style = updates.preferredCvStyle
  if (updates.onboardingCompleted !== undefined) patch.onboarding_completed = updates.onboardingCompleted

  if (Object.keys(patch).length === 0) return
  await supabase.from('users_profile').update(patch).eq('user_id', user.id)
}

// ─── CRÉDITS ──────────────────────────────────────────────────────────────────

export async function dbGetCredits(): Promise<number> {
  const user = await getCurrentUser()
  if (!user) return lsGetCredits()

  const supabase = createClient()
  const { data } = await supabase
    .from('users_profile')
    .select('credits_remaining, plan, plan_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return lsGetCredits()

  const plan = data.plan as string
  const expired = data.plan_expires_at && new Date(data.plan_expires_at) < new Date()
  if ((plan === 'pro' || plan === 'premium') && !expired) return Infinity

  const credits = data.credits_remaining ?? 0
  lsSetCredits(credits) // keep localStorage in sync with Supabase
  return credits
}

export async function dbCanGenerate(): Promise<boolean> {
  const credits = await dbGetCredits()
  return credits > 0
}

export async function dbDeductCredit(): Promise<boolean> {
  lsDeductCredit()

  const user = await getCurrentUser()
  if (!user) return true

  const supabase = createClient()

  // Ne pas déduire sur plan payant
  const { data } = await supabase
    .from('users_profile')
    .select('plan, plan_expires_at, credits_remaining')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return true // allow generation if profile not found yet

  const plan = data.plan as string
  const expired = data.plan_expires_at && new Date(data.plan_expires_at) < new Date()
  const isPaid = (plan === 'pro' || plan === 'premium') && !expired

  if (!isPaid) {
    if ((data.credits_remaining ?? 0) <= 0) return false
    await supabase
      .from('users_profile')
      .update({ credits_remaining: (data.credits_remaining ?? 1) - 1 })
      .eq('user_id', user.id)
  }

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: user.id,
    type: 'used',
    amount: isPaid ? 0 : -1,
    reason: isPaid ? 'AI Generation (Plan illimité)' : 'AI Generation',
  })

  return true
}

export async function dbGetCreditTransactions() {
  const user = await getCurrentUser()
  if (!user) return lsGetCreditTransactions()

  const supabase = createClient()
  const { data } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return lsGetCreditTransactions()
  return data.map(r => ({
    type: r.type,
    amount: r.amount,
    reason: r.reason ?? '',
    createdAt: r.created_at,
  }))
}

// ─── DASHBOARD STATS (agrégées depuis Supabase) ───────────────────────────────

export async function dbGetDashboardStats() {
  const local = lsGetDashboardStats()
  const user = await getCurrentUser()
  if (!user) return local

  const supabase = createClient()

  const statsPromise = (async () => {
    const [appsRes, trackerRes, profileRes] = await Promise.all([
      supabase.from('applications').select('id, match_score, status, created_at').eq('user_id', user.id),
      supabase.from('tracker_entries').select('status').eq('user_id', user.id),
      supabase.from('users_profile').select('plan, plan_expires_at, credits_remaining').eq('user_id', user.id).maybeSingle(),
    ])

    const apps = appsRes.data ?? []
    const tracker = trackerRes.data ?? []
    const profile = profileRes.data

    const isPaid = profile && (profile.plan === 'pro' || profile.plan === 'premium') &&
      (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())

    const credits = isPaid ? Infinity : (profile?.credits_remaining ?? lsGetCredits())
    // Sync credits to localStorage so sidebar and dashboard always agree
    if (!isPaid && profile?.credits_remaining != null) {
      lsSetCredits(profile.credits_remaining)
    }

    const generated = apps.filter(a => a.status === 'generated')
    const scores = generated.map(a => a.match_score ?? 0).filter(s => s > 0)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    const interviewCount = tracker.filter(t => ['interview', 'offer'].includes(t.status)).length
    const appliedCount = tracker.filter(t => !['draft', 'ready'].includes(t.status)).length
    const interviewRate = appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const weeklyGrowth = apps.filter(a => a.created_at > oneWeekAgo).length

    return {
      totalApplications: apps.length,
      creditsRemaining: credits,
      avgMatchScore: avgScore,
      interviewRate,
      weeklyGrowth,
    }
  })()

  return withFallback(statsPromise, local)
}

// ─── EXPORT ET SUPPRESSION DE COMPTE ──────────────────────────────────────────

export async function dbExportUserData(): Promise<Blob> {
  const user = await getCurrentUser()
  if (!user) {
    const data = {
      profile: lsGetUserProfile(),
      applications: lsGetApplications(),
      tracker: lsGetTrackerEntries(),
      transactions: lsGetCreditTransactions(),
    }
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  }

  const supabase = createClient()
  const [apps, tracker, profile, transactions] = await Promise.all([
    supabase.from('applications').select('*').eq('user_id', user.id),
    supabase.from('tracker_entries').select('*').eq('user_id', user.id),
    supabase.from('users_profile').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('credit_transactions').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: profile.data,
    applications: apps.data ?? [],
    tracker: tracker.data ?? [],
    credit_transactions: transactions.data ?? [],
  }

  return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
}

export async function dbDeleteAccount(): Promise<{ error: string | null }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      return { error: data.error ?? 'Erreur lors de la suppression' }
    }
    return { error: null }
  } catch {
    return { error: 'Erreur réseau' }
  }
}

// ─── BACKFILL localStorage → SUPABASE ────────────────────────────────────────

/**
 * One-time migration: copies all localStorage data (applications, results,
 * tracker) to Supabase for users who generated apps before the DB was online.
 * Safe to call on every login — exits immediately once the sync flag is set.
 */
export async function dbSyncLocalToSupabase(): Promise<void> {
  if (isLocalSynced()) return

  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  const localApps = lsGetApplications()

  if (localApps.length === 0) {
    markLocalSynced()
    return
  }

  // Skip if Supabase already has data for this user
  const { data: check, error: checkErr } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (checkErr || (check && check.length > 0)) {
    markLocalSynced()
    return
  }

  // Backfill applications + generation results
  for (const app of localApps) {
    const { error: appErr } = await supabase.from('applications').upsert({
      id: app.id,
      user_id: user.id,
      job_title: app.jobTitle,
      company_name: app.companyName || null,
      job_description: app.jobDescription,
      job_url: app.jobUrl || null,
      country: app.country || null,
      job_type: app.jobType || null,
      cv_text: app.cvText,
      selected_outputs: app.selectedOutputs,
      tone: app.tone,
      output_language: app.outputLanguage,
      status: app.status,
      match_score: app.matchScore || null,
      strong_fit_areas: app.strongFitAreas || null,
      missing_skills: app.missingSkills || null,
      ats_keywords: app.atsKeywords || null,
      ai_summary: app.aiSummary || null,
      recommended_action: app.recommendedAction || null,
    }, { onConflict: 'id' })

    if (appErr) continue

    const localResult = lsGetGenerationResult(app.id)
    if (localResult) {
      await supabase.from('generation_results').upsert({
        application_id: app.id,
        user_id: user.id,
        data: localResult.data,
        tokens_used: localResult.tokensUsed || 0,
        generated_at: localResult.generatedAt,
      }, { onConflict: 'application_id' })
    }
  }

  // Backfill tracker entries
  const localTracker = lsGetTrackerEntries()
  for (const entry of localTracker) {
    await supabase.from('tracker_entries').upsert({
      id: entry.id,
      user_id: user.id,
      application_id: entry.applicationId || null,
      job_title: entry.jobTitle,
      company_name: entry.companyName || null,
      match_score: entry.matchScore || null,
      status: entry.status,
      deadline: entry.deadline || null,
      date_applied: entry.dateApplied || null,
      notes: entry.notes || null,
      docs_ready: entry.docsReady,
    }, { onConflict: 'id' })
  }

  markLocalSynced()
}

// ─── RE-EXPORT des utilitaires synchrones encore nécessaires ─────────────────
export { generateId, lsHasPaidPlan as hasPaidPlan, lsCanGenerate as canGenerate }

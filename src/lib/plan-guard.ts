import { createAdminClient } from '@/lib/supabase/server'

// ── Types de features protégées ──────────────────────────────────────────────
export type Feature =
  | 'unlimited_cv'
  | 'cover_letter'
  | 'match_score'
  | 'interview_sim'
  | 'certifications'
  | 'docx_export'

// ── Matrice de permissions par plan ─────────────────────────────────────────
const PERMISSIONS: Record<string, Feature[]> = {
  free: [],
  pro: ['unlimited_cv', 'cover_letter', 'match_score', 'certifications', 'docx_export', 'interview_sim'],
  premium: [
    'unlimited_cv',
    'cover_letter',
    'match_score',
    'certifications',
    'docx_export',
    'interview_sim',
  ],
}

// ── Lecture du plan depuis Supabase ──────────────────────────────────────────
/**
 * Récupère le plan actif de l'utilisateur.
 * Expire automatiquement le plan si plan_expires_at est dépassé.
 */
export async function getUserPlan(userId: string): Promise<'free' | 'pro' | 'premium'> {
  const supabase = createAdminClient()

  const { data: profile, error } = await supabase
    .from('users_profile')
    .select('plan, plan_expires_at')
    .eq('user_id', userId)
    .single()

  if (error || !profile) return 'free'

  // Vérification de l'expiration
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
    // Plan expiré → rétrogradation automatique vers free
    await supabase
      .from('users_profile')
      .update({ plan: 'free', subscription_id: null, plan_expires_at: null })
      .eq('user_id', userId)
    return 'free'
  }

  return (profile.plan as 'free' | 'pro' | 'premium') ?? 'free'
}

// ── Vérification d'accès ─────────────────────────────────────────────────────
/**
 * Retourne true si le plan donné a accès à la feature demandée.
 */
export function canAccess(plan: string, feature: Feature): boolean {
  return PERMISSIONS[plan]?.includes(feature) ?? false
}

// ── Guard complet (lecture + vérification) ───────────────────────────────────
/**
 * Vérifie si un utilisateur peut accéder à une feature donnée.
 * Utilise le user_id Supabase Auth.
 */
export async function guardFeature(
  userId: string,
  feature: Feature
): Promise<{ allowed: boolean; plan: string }> {
  const plan = await getUserPlan(userId)
  const allowed = canAccess(plan, feature)
  return { allowed, plan }
}

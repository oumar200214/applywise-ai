import { Webhooks } from '@dodopayments/nextjs'
import { createAdminClient } from '@/lib/supabase/server'
import { getPlanKeyFromProductId, getPlanName, getPlanInterval, computeExpiryDate } from '@/lib/dodo'

// Minimal structural type for the payload fields we access in helpers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = { type: string; data: any; business_id: string; timestamp: any }

/**
 * Route Webhook Dodo Payments
 * URL à déclarer sur le dashboard Dodo : /api/webhooks/dodo
 *
 * @dodopayments/nextjs gère automatiquement :
 *  - La vérification de signature (retourne 401 si invalide)
 *  - La validation du payload Zod (retourne 400 si malformé)
 *  - Le routage vers le bon handler d'événement
 */
export const POST = Webhooks({
  webhookKey: process.env.DODO_WEBHOOK_SECRET!,

  // ── Abonnement activé (premier paiement réussi) ───────────────────────────
  onSubscriptionActive: async (payload) => {
    await activatePlan(payload)
  },

  // ── Renouvellement mensuel/annuel ─────────────────────────────────────────
  onSubscriptionRenewed: async (payload) => {
    const supabase = createAdminClient()
    const data = payload.data as Record<string, unknown>
    const customer = data?.customer as { email?: string } | undefined
    const productId = data?.product_id as string | undefined
    const planKey = getPlanKeyFromProductId(productId ?? '')

    if (!customer?.email) return

    await supabase
      .from('users_profile')
      .update({
        plan_activated_at: new Date().toISOString(),
        plan_expires_at: computeExpiryDate(planKey).toISOString(),
      })
      .eq('email', customer.email)
  },

  // ── Changement de plan (upgrade/downgrade) ────────────────────────────────
  onSubscriptionPlanChanged: async (payload) => {
    await activatePlan(payload)
  },

  // ── Annulation par l'utilisateur ─────────────────────────────────────────
  onSubscriptionCancelled: async (payload) => {
    await revokePlan(payload)
  },

  // ── Plan expiré (fin de période sans renouvellement) ─────────────────────
  onSubscriptionExpired: async (payload) => {
    await revokePlan(payload)
  },

  // ── Échec de paiement (mise en attente) ──────────────────────────────────
  onSubscriptionFailed: async (payload) => {
    // On ne dégrade pas immédiatement : Dodo gère le dunning.
    // On logue seulement pour monitoring.
    const data = payload.data as Record<string, unknown>
    const customer = data?.customer as { email?: string } | undefined
    console.warn('[WEBHOOK] Paiement échoué pour:', customer?.email)
  },

  // ── Paiement ponctuel réussi (pour future offre à la carte) ──────────────
  onPaymentSucceeded: async (payload) => {
    console.log('[WEBHOOK] Paiement ponctuel réussi:', payload.data)
  },
})

// ─── Helpers internes ─────────────────────────────────────────────────────────

async function activatePlan(payload: AnyPayload) {
  const supabase = createAdminClient()
  const data = payload.data as Record<string, unknown>
  const customer = data?.customer as { email?: string } | undefined
  const productId = data?.product_id as string | undefined
  const subscriptionId = data?.subscription_id as string | undefined
  const metadata = data?.metadata as Record<string, string> | undefined

  if (!customer?.email) {
    console.error('[WEBHOOK] Email client manquant dans payload')
    return
  }

  const planKey = getPlanKeyFromProductId(productId ?? '')
  const planName = getPlanName(planKey)
  const planInterval = getPlanInterval(planKey)
  const expiresAt = computeExpiryDate(planKey)

  // Always use user_id from metadata (set at checkout creation)
  const userId = metadata?.userId
  if (!userId) {
    console.error('[WEBHOOK] userId manquant dans metadata — activation impossible pour:', customer.email)
    return
  }

  await supabase.from('users_profile').update({
    plan: planName,
    plan_interval: planInterval,
    subscription_id: subscriptionId ?? null,
    plan_activated_at: new Date().toISOString(),
    plan_expires_at: expiresAt.toISOString(),
  }).eq('user_id', userId)

  console.log(`[WEBHOOK] Plan activé: ${planName} (${planInterval}) pour ${customer.email}`)
}

async function revokePlan(payload: AnyPayload) {
  const supabase = createAdminClient()
  const data = payload.data as Record<string, unknown>
  const customer = data?.customer as { email?: string } | undefined
  const metadata = data?.metadata as Record<string, string> | undefined

  if (!customer?.email) return

  const userId = metadata?.userId
  if (!userId) {
    console.error('[WEBHOOK] userId manquant dans metadata — révocation impossible pour:', customer.email)
    return
  }

  await supabase.from('users_profile').update({
    plan: 'free',
    subscription_id: null,
    plan_expires_at: null,
    plan_interval: null,
  }).eq('user_id', userId)

  console.log(`[WEBHOOK] Plan révoqué → free pour ${customer.email}`)
}

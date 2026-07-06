import DodoPayments from 'dodopayments'

// ── Client Dodo centralisé ──────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production'

export const dodo = new DodoPayments({
  bearerToken: isProduction
    ? process.env.DODO_PAYMENTS_API_KEY!
    : process.env.DODO_PAYMENTS_API_KEY_TEST!,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as 'live_mode' | 'test_mode') ?? (isProduction ? 'live_mode' : 'test_mode'),
})

// ── Catalogue des plans ─────────────────────────────────────────────────────
export const PLANS = {
  pro_monthly: {
    productId: process.env.DODO_PRODUCT_PRO_MONTHLY!,
    name: 'Pro',
    price: 9,
    interval: 'monthly' as const,
    features: [
      'CV illimités',
      'Lettre de motivation IA',
      'Match Score avancé',
      'Recommandations certifications',
      'Simulation d\'entretien (5 sessions)',
    ],
  },
  pro_yearly: {
    productId: process.env.DODO_PRODUCT_PRO_YEARLY!,
    name: 'Pro',
    price: 79,
    interval: 'yearly' as const,
    features: [
      'CV illimités',
      'Lettre de motivation IA',
      'Match Score avancé',
      'Recommandations certifications',
      'Simulation d\'entretien (5 sessions)',
      '2 mois offerts',
    ],
  },
  premium_monthly: {
    productId: process.env.DODO_PRODUCT_PREMIUM_MONTHLY!,
    name: 'Premium',
    price: 19,
    interval: 'monthly' as const,
    features: [
      'Tout Pro inclus',
      'Simulation d\'entretien IA illimitée',
      'Export multi-format (.docx + PDF)',
      'Support prioritaire',
    ],
  },
  premium_yearly: {
    productId: process.env.DODO_PRODUCT_PREMIUM_YEARLY!,
    name: 'Premium',
    price: 149,
    interval: 'yearly' as const,
    features: [
      'Tout Pro inclus',
      'Simulation d\'entretien IA illimitée',
      'Export multi-format (.docx + PDF)',
      'Support prioritaire',
      '2 mois offerts',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Retourne le nom du plan (free | pro | premium) depuis une PlanKey */
export function getPlanName(planKey?: PlanKey): 'free' | 'pro' | 'premium' {
  if (!planKey) return 'free'
  if (planKey.startsWith('pro')) return 'pro'
  if (planKey.startsWith('premium')) return 'premium'
  return 'free'
}

/** Retourne l'intervalle (monthly | yearly) depuis une PlanKey */
export function getPlanInterval(planKey?: PlanKey): 'monthly' | 'yearly' {
  return planKey?.includes('yearly') ? 'yearly' : 'monthly'
}

/** Calcule la date d'expiration du plan */
export function computeExpiryDate(planKey?: PlanKey): Date {
  const now = new Date()
  if (planKey?.includes('yearly')) {
    now.setFullYear(now.getFullYear() + 1)
  } else {
    now.setMonth(now.getMonth() + 1)
  }
  return now
}

/** Retrouve la PlanKey à partir d'un product_id Dodo */
export function getPlanKeyFromProductId(productId: string): PlanKey | undefined {
  const entry = Object.entries(PLANS).find(([, p]) => p.productId === productId)
  return entry?.[0] as PlanKey | undefined
}

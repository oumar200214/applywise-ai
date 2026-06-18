import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodo, PLANS, PlanKey } from '@/lib/dodo'

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authentification via Supabase ────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // ── 2. Validation du plan ───────────────────────────────────────────────
    const body = await req.json() as { planKey: PlanKey }
    const { planKey } = body

    if (!planKey || !(planKey in PLANS)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const plan = PLANS[planKey]

    // ── 3. Détection du pays via IP (header Vercel/Next.js) ─────────────────
    // Permet l'auto-détection sans forcer un pays par défaut
    const countryHeader =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      'FR' // Fallback Europe si pas de header géo

    // ── 4. Récupération du profil utilisateur ───────────────────────────────
    const { data: profile } = await supabase
      .from('users_profile')
      .select('full_name, email')
      .eq('user_id', user.id)
      .single()

    const customerName = profile?.full_name || user.email?.split('@')[0] || ''
    const customerEmail = profile?.email || user.email || ''

    // ── 5. Création de l'abonnement Dodo ────────────────────────────────────
    const subscription = await dodo.subscriptions.create({
      billing: {
        city: '',
        country: countryHeader as 'FR',   // cast nécessaire pour le type Dodo
        state: '',
        street: '',
        zipcode: '',
      },
      customer: {
        email: customerEmail,
        name: customerName,
      },
      product_id: plan.productId,
      quantity: 1,
      payment_link: true,     // génère une URL de paiement hosted
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&plan=${planKey}`,
      metadata: {
        userId: user.id,
        planKey,
      },
    })

    return NextResponse.json({
      payment_link: subscription.payment_link,
      subscription_id: subscription.subscription_id,
    })
  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}

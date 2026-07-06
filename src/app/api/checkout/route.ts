import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodo, PLANS, PlanKey } from '@/lib/dodo'

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authentification ─────────────────────────────────────────────────
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

    // ── 3. Détection du pays via IP ─────────────────────────────────────────
    const countryCode = (
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      'FR'
    ).toUpperCase().slice(0, 2)

    // ── 4. Récupération du profil utilisateur ───────────────────────────────
    const { data: profile } = await supabase
      .from('users_profile')
      .select('full_name, email')
      .eq('user_id', user.id)
      .single()

    const customerName = profile?.full_name || user.email?.split('@')[0] || ''
    const customerEmail = profile?.email || user.email || ''

    // ── 5. Création de la session de paiement Dodo (nouvelle API) ───────────
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: plan.productId, quantity: 1 }],
      customer: {
        email: customerEmail,
        name: customerName,
      },
      billing_address: {
        country: countryCode as 'FR',
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?plan=${planKey}`,
      metadata: {
        userId: user.id,
        planKey,
      },
    })

    return NextResponse.json({
      payment_link: session.checkout_url,
      session_id: session.session_id,
    })
  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error)
    const msg = error instanceof Error ? error.message : String(error)
    const detail = (error as Record<string, unknown>)?.error ?? (error as Record<string, unknown>)?.body ?? ''
    return NextResponse.json(
      { error: `Dodo error: ${msg}`, detail },
      { status: 500 }
    )
  }
}

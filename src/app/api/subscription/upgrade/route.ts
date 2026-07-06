import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { dodo, PLANS, PlanKey } from '@/lib/dodo'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { targetPlanKey } = await req.json() as { targetPlanKey: PlanKey }

  if (!targetPlanKey || !(targetPlanKey in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('users_profile')
    .select('subscription_id, plan')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (!profile.subscription_id) {
    // No subscription — start a new checkout flow instead
    return NextResponse.json({ error: 'No active subscription. Please use checkout.', requireCheckout: true }, { status: 400 })
  }

  const targetPlan = PLANS[targetPlanKey]

  try {
    await dodo.subscriptions.changePlan(profile.subscription_id, {
      product_id: targetPlan.productId,
      proration_billing_mode: 'prorated_immediately',
      quantity: 1,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[UPGRADE_SUBSCRIPTION]', err)
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 })
  }
}

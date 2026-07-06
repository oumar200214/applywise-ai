import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { dodo } from '@/lib/dodo'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
  }

  if (profile.plan === 'free') {
    return NextResponse.json({ error: 'No paid subscription to cancel' }, { status: 400 })
  }

  try {
    await dodo.subscriptions.update(profile.subscription_id, {
      cancel_at_next_billing_date: true,
      cancel_reason: 'cancelled_by_customer',
    })

    return NextResponse.json({ success: true, message: 'Subscription will be cancelled at end of billing period.' })
  } catch (err) {
    console.error('[CANCEL_SUBSCRIPTION]', err)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}

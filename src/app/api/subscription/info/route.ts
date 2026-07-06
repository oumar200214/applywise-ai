import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('users_profile')
    .select('plan, plan_interval, plan_activated_at, plan_expires_at, subscription_id')
    .eq('user_id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ plan: 'free', subscription_id: null, plan_expires_at: null, plan_interval: null })
  }

  // Auto-downgrade expired plans
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
    await admin
      .from('users_profile')
      .update({ plan: 'free', subscription_id: null, plan_expires_at: null, plan_interval: null })
      .eq('user_id', user.id)

    return NextResponse.json({ plan: 'free', subscription_id: null, plan_expires_at: null, plan_interval: null })
  }

  return NextResponse.json({
    plan: profile.plan,
    plan_interval: profile.plan_interval,
    plan_activated_at: profile.plan_activated_at,
    plan_expires_at: profile.plan_expires_at,
    subscription_id: profile.subscription_id,
  })
}

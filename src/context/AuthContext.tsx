'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setStorageUserId, updateUserProfile, setCredits as lsSetCredits } from '@/lib/storage'
import { clearUserCache } from '@/lib/db'
import type { User, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  plan: 'free' | 'pro' | 'premium'
  refreshPlan: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  plan: 'free',
  refreshPlan: async () => {},
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<'free' | 'pro' | 'premium'>('free')
  // Singleton ref — avoids recreating the client on every render
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchPlan = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users_profile')
        .select('plan, plan_expires_at, credits_remaining')
        .eq('user_id', userId)
        .maybeSingle()

      if (!data) return

      const expired = data.plan_expires_at && new Date(data.plan_expires_at) < new Date()
      const activePlan = (expired ? 'free' : data.plan ?? 'free') as 'free' | 'pro' | 'premium'

      // Downgrade is handled server-side by /api/subscription/info
      setPlan(activePlan)
      updateUserProfile({ plan: activePlan })

      // Sync credits from Supabase → localStorage immediately on sign-in
      // This ensures sidebar/new-application never show a stale cached value
      const isPaid = activePlan === 'pro' || activePlan === 'premium'
      if (!isPaid && data.credits_remaining != null) {
        lsSetCredits(data.credits_remaining)
      }
    } catch {
      // Silently fail — use cached plan
    }
  }, [supabase])

  const refreshPlan = useCallback(async () => {
    if (user) await fetchPlan(user.id)
  }, [user, fetchPlan])

  useEffect(() => {
    // Use getSession() for initial check — reads from local cache, no network lock
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const sessionUser = session?.user ?? null
        setUser(sessionUser)
        setStorageUserId(sessionUser?.id || null)
        if (sessionUser) await fetchPlan(sessionUser.id)
      } catch (error) {
        console.error('Error getting session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initSession()

    // onAuthStateChange handles all subsequent auth events (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user ?? null
        setUser(sessionUser)
        setStorageUserId(sessionUser?.id ?? null)
        if (sessionUser) {
          await fetchPlan(sessionUser.id)
        } else {
          setPlan('free')
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    // Ensure profile row exists regardless of whether the DB trigger ran
    if (!error && data.user) {
      void supabase.from('users_profile').upsert({
        user_id: data.user.id,
        email,
        full_name: fullName,
        plan: 'free',
        credits_remaining: 3,
      }, { onConflict: 'user_id' })
    }
    return { error }
  }, [supabase.auth])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [supabase.auth])

  const signOut = useCallback(async () => {
    // Clear local state immediately — don't wait for the network
    setUser(null)
    setPlan('free')
    setStorageUserId(null)
    clearUserCache() // flush db.ts user cache so next calls don't serve stale session
    // Fire Supabase signOut in background (network call — can be slow)
    supabase.auth.signOut().catch(() => {})
  }, [supabase.auth])

  return (
    <AuthContext.Provider value={{ user, loading, plan, refreshPlan, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

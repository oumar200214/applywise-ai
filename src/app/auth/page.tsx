'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth } from '@/context/AuthContext'
import { updateUserProfile, addCredits } from '@/lib/storage'
import toast from 'react-hot-toast'

function AuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signUp, signIn } = useAuth()
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName)
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try signing in instead.')
          } else {
            toast.error(error.message || 'Failed to create account')
          }
          setLoading(false)
          return
        }

        // Initialize localStorage profile for new user
        updateUserProfile({
          fullName,
          email,
          onboardingCompleted: false,
        })
        // Give 3 free credits
        addCredits(3, 'Welcome bonus — 3 free AI generations')

        toast.success('Account created! Let\'s set up your profile.')
        window.location.href = '/onboarding'
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.')
          } else {
            toast.error(error.message || 'Failed to sign in')
          }
          setLoading(false)
          return
        }

        toast.success('Welcome back!')
        const redirect = searchParams.get('redirect') || '/dashboard'
        router.push(redirect)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-primary-container p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-primary to-tertiary-container opacity-80"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-2xl font-black text-white tracking-tight">ApplyWise AI</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Your career,<br/>
            <span className="text-secondary-fixed">AI-powered.</span>
          </h2>
          <p className="text-on-primary-container text-lg max-w-md leading-relaxed">
            Join thousands of students using ApplyWise AI to land interviews faster with tailored applications.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span className="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
              <span>3 free generations</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span className="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span className="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
              <span>Data privacy</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/40 text-xs">
          © 2025 ApplyWise AI
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-col justify-center items-center p-8 md:p-16 bg-background">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span className="text-xl font-black text-primary-container">ApplyWise AI</span>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-on-surface-variant">
              {isSignUp ? 'Start building smarter applications' : 'Sign in to continue your journey'}
            </p>
          </div>

          {/* Social Login (disabled for now) */}
          <button
            disabled
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all text-sm font-semibold text-slate-400 cursor-not-allowed opacity-60"
            title="Google login coming soon"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google login coming soon
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400 font-medium">continue with email</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="Your full name"
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="••••••••"
                required
                minLength={6}
              />
              {isSignUp && (
                <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <a href="#" className="text-xs text-primary-container font-semibold hover:underline">Forgot password?</a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">{isSignUp ? 'person_add' : 'login'}</span>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary-container font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          {isSignUp && (
            <p className="text-center text-[11px] text-slate-400 leading-relaxed">
              By signing up, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>}>
      <AuthContent />
    </Suspense>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCheckout } from '@/hooks/useCheckout'

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const { startCheckout, isProcessing } = useCheckout()

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* TopNav */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm flex justify-between items-center w-full px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary-container">ApplyWise AI</Link>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <Link className="text-slate-500 hover:bg-slate-50 transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="/dashboard">Dashboard</Link>
          <Link className="text-slate-500 hover:bg-slate-50 transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="#">Features</Link>
          <Link className="text-blue-700 font-bold px-3 py-2 rounded-lg text-sm" href="/pricing">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-16 md:py-24">
        {/* Hero */}
        <section className="text-center mb-12">
          <h1 className="text-[36px] font-bold text-primary mb-6 tracking-tight">Invest in your career&apos;s future</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Join thousands of students and early-career professionals using ApplyWise AI to land their dream roles with precision and ease.
          </p>
        </section>

        {/* Toggle Billing Interval */}
        <div className="flex justify-center mb-16">
          <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                billingInterval === 'yearly'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Yearly <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-stretch">
          
          {/* Free Plan */}
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-stitch flex flex-col h-full">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-primary mb-2">Free</h3>
              <p className="text-xs text-on-surface-variant mb-6 font-medium">For exploration and getting started</p>
              <div className="flex items-baseline">
                <span className="text-[36px] font-bold text-primary">$0</span>
                <span className="text-base text-on-surface-variant ml-2">/forever</span>
              </div>
            </div>
            <div className="space-y-4 mb-8 flex-grow">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
                <span className="text-base">Basic CV Generation</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
                <span className="text-base">Simple Application Tracker</span>
              </div>
              <div className="flex items-start gap-3 text-slate-400">
                <span className="material-symbols-outlined">block</span>
                <span className="text-base line-through">PDF & .docx Export</span>
              </div>
              <div className="flex items-start gap-3 text-slate-400">
                <span className="material-symbols-outlined">block</span>
                <span className="text-base line-through">AI Cover Letter</span>
              </div>
              <div className="flex items-start gap-3 text-slate-400">
                <span className="material-symbols-outlined">block</span>
                <span className="text-base line-through">Interview Simulation</span>
              </div>
            </div>
            <Link href="/auth">
              <button className="w-full py-3 px-6 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-slate-50 transition-all">
                Get Started
              </button>
            </Link>
          </div>

          {/* Pro Plan — Highlighted */}
          <div className="bg-white rounded-xl p-8 border-2 border-primary-container shadow-2xl flex flex-col h-full relative ai-glow scale-105 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <div className="mb-8 mt-2">
              <h3 className="text-xl font-bold text-primary mb-2">Pro</h3>
              <p className="text-xs text-on-surface-variant mb-6 font-medium">Full career assistant to land interviews</p>
              <div className="flex items-baseline">
                <span className="text-[36px] font-bold text-primary">
                  ${billingInterval === 'monthly' ? '9' : '79'}
                </span>
                <span className="text-base text-on-surface-variant ml-2">/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
              </div>
            </div>
            <div className="space-y-4 mb-8 flex-grow">
              {['Unlimited AI CVs', 'Tailored Cover Letters', 'Advanced Match Score', 'Certification Recommendations', 'PDF & Native .docx Export'].map(f => (
                <div key={f} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                  <span className="text-base font-medium">{f}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => startCheckout(billingInterval === 'monthly' ? 'pro_monthly' : 'pro_yearly')}
              disabled={isProcessing}
              className="w-full py-3 px-6 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
            >
              {isProcessing ? 'Redirection...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-stitch flex flex-col h-full">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-primary mb-2">Premium</h3>
              <p className="text-xs text-on-surface-variant mb-6 font-medium">For power users who want the edge</p>
              <div className="flex items-baseline">
                <span className="text-[36px] font-bold text-primary">
                  ${billingInterval === 'monthly' ? '19' : '149'}
                </span>
                <span className="text-base text-on-surface-variant ml-2">/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
              </div>
            </div>
            <div className="space-y-4 mb-8 flex-grow">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
                <span className="text-base font-bold">Everything in Pro</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
                <span className="text-base">Unlimited AI Interview Prep</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
                <span className="text-base">Priority Support</span>
              </div>
            </div>
            <button 
              onClick={() => startCheckout(billingInterval === 'monthly' ? 'premium_monthly' : 'premium_yearly')}
              disabled={isProcessing}
              className="w-full py-3 px-6 rounded-lg border border-slate-200 text-on-surface-variant text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Redirection...' : 'Go Premium'}
            </button>
          </div>
        </div>

        {/* Bento Value */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-[28px] font-semibold text-primary">Built to get you hired</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-surface-container-low rounded-xl p-10 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-primary mb-4">Real ROI on your career</h3>
              <p className="text-base text-on-surface-variant">Our users report a 3x increase in interview call-backs when using our Pro features to perfectly match their CV and Cover Letter to the job description.</p>
            </div>
            <div className="md:col-span-5 bg-tertiary-container rounded-xl p-10 text-white relative overflow-hidden min-h-[300px]">
              <h3 className="text-xl font-bold mb-4 relative z-10">AI-Powered Edge</h3>
              <p className="text-base opacity-90 relative z-10">Get the unfair advantage in the job market with our proprietary AI models trained on thousands of successful tech applications.</p>
              <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
                <span className="material-symbols-outlined text-[120px]">auto_awesome</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-50 w-full py-12 px-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-bold text-slate-900 text-lg">ApplyWise AI</span>
            <p className="text-xs text-slate-500">© 2026 ApplyWise AI. Land your dream job.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

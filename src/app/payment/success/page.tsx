'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const PLAN_INFO: Record<string, { label: string; color: string; features: string[] }> = {
  pro_monthly: {
    label: 'Pro',
    color: 'text-primary-container',
    features: ['CV IA illimités', 'Lettres de motivation IA', 'Score de correspondance avancé', 'Export PDF & DOCX'],
  },
  pro_yearly: {
    label: 'Pro (Annuel)',
    color: 'text-primary-container',
    features: ['CV IA illimités', 'Lettres de motivation IA', 'Score de correspondance avancé', 'Export PDF & DOCX', '2 mois offerts'],
  },
  premium_monthly: {
    label: 'Premium',
    color: 'text-tertiary-container',
    features: ['Tout Pro inclus', 'Simulation d\'entretien IA illimitée', 'Support prioritaire'],
  },
  premium_yearly: {
    label: 'Premium (Annuel)',
    color: 'text-tertiary-container',
    features: ['Tout Pro inclus', 'Simulation d\'entretien IA illimitée', 'Support prioritaire', '2 mois offerts'],
  },
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshPlan } = useAuth()
  const planKey = searchParams.get('plan') || ''
  const planInfo = PLAN_INFO[planKey]
  const [synced, setSynced] = useState(false)
  const [countdown, setCountdown] = useState(8)

  useEffect(() => {
    refreshPlan().then(() => setSynced(true))
  }, [refreshPlan])

  useEffect(() => {
    if (!synced) return
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [synced, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-white to-[#f3e8ff] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Icône succès */}
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 bg-secondary-container/20 rounded-full animate-ping opacity-40"></div>
          <div className="relative w-28 h-28 bg-gradient-to-br from-secondary to-secondary-container rounded-full flex items-center justify-center shadow-2xl shadow-secondary/30">
            <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
        </div>

        {/* Titre */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Paiement confirmé !</h1>
          {planInfo ? (
            <p className="text-lg text-slate-600">
              Bienvenue dans le plan <span className={`font-bold ${planInfo.color}`}>{planInfo.label}</span>. Votre compte a été mis à niveau.
            </p>
          ) : (
            <p className="text-lg text-slate-600">Votre abonnement est maintenant actif.</p>
          )}
        </div>

        {/* Fonctionnalités du plan */}
        {planInfo && (
          <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-6 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Vos nouvelles fonctionnalités</p>
            <div className="space-y-3">
              {planInfo.features.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary-container/20 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicateur de synchronisation */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          {synced ? (
            <><span className="material-symbols-outlined text-secondary text-sm">sync</span>Compte synchronisé</>
          ) : (
            <><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>Synchronisation en cours...</>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-primary-container text-white px-8 py-4 rounded-xl text-base font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">dashboard</span>
            Aller au tableau de bord
          </Link>
          {synced && (
            <p className="text-xs text-slate-400">Redirection automatique dans {countdown}s...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

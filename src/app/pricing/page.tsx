'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCheckout } from '@/hooks/useCheckout'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { PlanKey } from '@/lib/dodo'

type SubscriptionInfo = {
  plan: 'free' | 'pro' | 'premium'
  plan_interval: 'monthly' | 'yearly' | null
  plan_expires_at: string | null
  subscription_id: string | null
}

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const { startCheckout, isProcessing } = useCheckout()
  const { user, plan } = useAuth()
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch('/api/subscription/info')
      .then(r => r.json())
      .then(setSubInfo)
      .catch(() => null)
  }, [user])

  const handleUpgradePlan = async (targetPlanKey: PlanKey) => {
    if (!subInfo?.subscription_id) {
      await startCheckout(targetPlanKey)
      return
    }
    setUpgrading(true)
    const toastId = toast.loading('Changement de plan en cours...')
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlanKey }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.requireCheckout) {
          toast.dismiss(toastId)
          await startCheckout(targetPlanKey)
          return
        }
        throw new Error(data.error || 'Échec du changement de plan')
      }
      toast.success('Plan modifié ! Votre compte sera mis à jour sous peu.', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du changement de plan', { id: toastId })
    } finally {
      setUpgrading(false)
    }
  }

  const getProCTA = () => {
    if (!user) return { label: 'Passer à Pro', action: () => startCheckout(billingInterval === 'monthly' ? 'pro_monthly' : 'pro_yearly'), disabled: false }
    if (plan === 'pro') {
      const isMatchingInterval = subInfo?.plan_interval === billingInterval
      if (isMatchingInterval) return { label: 'Plan actuel', action: () => {}, disabled: true }
      return { label: `Passer en ${billingInterval === 'monthly' ? 'Mensuel' : 'Annuel'}`, action: () => handleUpgradePlan(billingInterval === 'monthly' ? 'pro_monthly' : 'pro_yearly'), disabled: upgrading || isProcessing }
    }
    if (plan === 'premium') return { label: 'Rétrograder à Pro', action: () => handleUpgradePlan(billingInterval === 'monthly' ? 'pro_monthly' : 'pro_yearly'), disabled: upgrading || isProcessing }
    return { label: upgrading || isProcessing ? 'Traitement...' : 'Passer à Pro', action: () => handleUpgradePlan(billingInterval === 'monthly' ? 'pro_monthly' : 'pro_yearly'), disabled: upgrading || isProcessing }
  }

  const getPremiumCTA = () => {
    if (!user) return { label: 'Passer à Premium', action: () => startCheckout(billingInterval === 'monthly' ? 'premium_monthly' : 'premium_yearly'), disabled: false }
    if (plan === 'premium') {
      const isMatchingInterval = subInfo?.plan_interval === billingInterval
      if (isMatchingInterval) return { label: 'Plan actuel', action: () => {}, disabled: true }
      return { label: `Passer en ${billingInterval === 'monthly' ? 'Mensuel' : 'Annuel'}`, action: () => handleUpgradePlan(billingInterval === 'monthly' ? 'premium_monthly' : 'premium_yearly'), disabled: upgrading || isProcessing }
    }
    if (plan === 'pro') return { label: upgrading || isProcessing ? 'Traitement...' : 'Passer à Premium', action: () => handleUpgradePlan(billingInterval === 'monthly' ? 'premium_monthly' : 'premium_yearly'), disabled: upgrading || isProcessing }
    return { label: upgrading || isProcessing ? 'Traitement...' : 'Passer à Premium', action: () => handleUpgradePlan(billingInterval === 'monthly' ? 'premium_monthly' : 'premium_yearly'), disabled: upgrading || isProcessing }
  }

  const proCTA = getProCTA()
  const premiumCTA = getPremiumCTA()

  const planLabel = plan === 'premium' ? 'Premium' : plan === 'pro' ? 'Pro' : 'Gratuit'

  const expiresFormatted = subInfo?.plan_expires_at
    ? new Date(subInfo.plan_expires_at).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* TopNav */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm flex justify-between items-center w-full px-6 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary-container">Postulis</Link>
        <nav className="hidden md:flex items-center space-x-8">
          <Link className="text-slate-500 hover:bg-slate-50 transition-colors px-3 py-2 rounded-lg text-sm font-semibold" href="/dashboard">Tableau de bord</Link>
          <Link className="text-blue-700 font-bold px-3 py-2 rounded-lg text-sm" href="/pricing">Tarifs</Link>
        </nav>
        <Link href="/dashboard" className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity">Tableau de bord</Link>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-16 md:py-24">
        {/* Hero */}
        <section className="text-center mb-12">
          <h1 className="text-[36px] font-bold text-primary mb-6 tracking-tight">Investissez dans votre avenir professionnel</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Rejoignez des milliers d&apos;étudiants et de jeunes professionnels qui utilisent Postulis pour décrocher leur emploi idéal avec précision et facilité.
          </p>
          {user && plan !== 'free' && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-secondary-container/20 text-secondary rounded-full text-sm font-semibold border border-secondary-container/30">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              Vous êtes sur le plan {planLabel}
              {expiresFormatted && <span className="text-xs opacity-70">· renouvelle le {expiresFormatted}</span>}
              <Link href="/settings" className="ml-1 text-xs underline hover:no-underline">Gérer</Link>
            </div>
          )}
        </section>

        {/* Toggle facturation */}
        <div className="flex justify-center mb-16">
          <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${billingInterval === 'monthly' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${billingInterval === 'yearly' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Annuel <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Économisez 20%</span>
            </button>
          </div>
        </div>

        {/* Grille des prix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-stretch">

          {/* Plan Gratuit */}
          <div className={`bg-white rounded-xl p-8 border shadow-stitch flex flex-col h-full ${plan === 'free' && user ? 'border-slate-300 ring-2 ring-slate-200' : 'border-slate-200'}`}>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-primary">Gratuit</h3>
                {plan === 'free' && user && <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full uppercase">Actuel</span>}
              </div>
              <p className="text-xs text-on-surface-variant mb-6 font-medium">Pour explorer et démarrer sans engagement</p>
              <div className="flex items-baseline">
                <span className="text-[36px] font-bold text-primary">0€</span>
                <span className="text-base text-on-surface-variant ml-2">/toujours gratuit</span>
              </div>
            </div>
            <div className="space-y-4 mb-8 flex-grow">
              {[['check_circle', 'text-secondary', 'Génération de CV de base (3 crédits)'], ['check_circle', 'text-secondary', 'Suivi simple des candidatures'], ['block', 'text-slate-300', 'Export PDF & .docx'], ['block', 'text-slate-300', 'Lettre de motivation IA'], ['block', 'text-slate-300', 'Simulation d\'entretien']].map(([icon, color, label]) => (
                <div key={label} className={`flex items-start gap-3 ${icon === 'block' ? 'text-slate-400' : ''}`}>
                  <span className={`material-symbols-outlined ${color}`}>{icon}</span>
                  <span className={`text-base ${icon === 'block' ? 'line-through' : ''}`}>{label}</span>
                </div>
              ))}
            </div>
            {user ? (
              <button disabled className="w-full py-3 px-6 rounded-lg border border-slate-200 text-slate-400 text-sm font-semibold cursor-default">
                {plan === 'free' ? 'Plan actuel' : 'Plan Gratuit'}
              </button>
            ) : (
              <Link href="/auth">
                <button className="w-full py-3 px-6 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-slate-50 transition-all">Commencer gratuitement</button>
              </Link>
            )}
          </div>

          {/* Plan Pro */}
          <div className={`bg-white rounded-xl p-8 border-2 shadow-2xl flex flex-col h-full relative ai-glow scale-105 z-10 ${plan === 'pro' && user ? 'border-secondary' : 'border-primary-container'}`}>
            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${plan === 'pro' && user ? 'bg-secondary text-on-secondary' : 'bg-secondary text-on-secondary'}`}>
              {plan === 'pro' && user ? 'Votre plan' : 'Le plus populaire'}
            </div>
            <div className="mb-8 mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-primary">Pro</h3>
                {plan === 'pro' && user && <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary-container/20 text-secondary rounded-full uppercase">Actif</span>}
              </div>
              <p className="text-xs text-on-surface-variant mb-6 font-medium">Assistant carrière complet pour décrocher des entretiens</p>
              <div className="flex items-baseline">
                <span className="text-[36px] font-bold text-primary">{billingInterval === 'monthly' ? '9€' : '79€'}</span>
                <span className="text-base text-on-surface-variant ml-2">/{billingInterval === 'monthly' ? 'mois' : 'an'}</span>
              </div>
            </div>
            <div className="space-y-4 mb-8 flex-grow">
              {['CVs IA illimités', 'Lettres de motivation personnalisées', 'Score de correspondance avancé', 'Entretien simulé IA + coaching vocal', 'Bibliothèque 20+ questions d\'entretien', 'Export PDF & .docx natif'].map(f => (
                <div key={f} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                  <span className={`text-base ${f.includes('Entretien') || f.includes('Bibliothèque') ? 'font-semibold text-primary' : 'font-medium'}`}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={proCTA.action}
              disabled={proCTA.disabled}
              className="w-full py-3 px-6 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-60 disabled:cursor-default"
            >
              {proCTA.label}
            </button>
          </div>

          {/* Plan Premium */}
          <div className={`bg-white rounded-xl p-8 border shadow-stitch flex flex-col h-full ${plan === 'premium' && user ? 'border-tertiary-container ring-2 ring-tertiary-container/30' : 'border-slate-200'}`}>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-primary">Premium</h3>
                {plan === 'premium' && user && <span className="text-[10px] font-bold px-2 py-0.5 bg-tertiary-container/20 text-tertiary-container rounded-full uppercase">Actif</span>}
              </div>
              <p className="text-xs text-on-surface-variant mb-6 font-medium">Pour les power users qui veulent l&apos;avantage décisif</p>
              <div className="flex items-baseline">
                <span className="text-[36px] font-bold text-primary">{billingInterval === 'monthly' ? '19€' : '149€'}</span>
                <span className="text-base text-on-surface-variant ml-2">/{billingInterval === 'monthly' ? 'mois' : 'an'}</span>
              </div>
            </div>
            <div className="space-y-4 mb-8 flex-grow">
              {['Tout ce qui est dans Pro', 'Générations IA illimitées sans restriction', 'Accès prioritaire aux nouvelles fonctionnalités', 'Support prioritaire (email sous 24h)'].map(f => (
                <div key={f} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                  <span className={`text-base ${f === 'Tout ce qui est dans Pro' ? 'font-bold' : ''}`}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={premiumCTA.action}
              disabled={premiumCTA.disabled}
              className="w-full py-3 px-6 rounded-lg border border-slate-200 text-on-surface-variant text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-default"
            >
              {premiumCTA.label}
            </button>
          </div>
        </div>

        {/* Bento valeur */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-[28px] font-semibold text-primary">Conçu pour vous faire recruter</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-surface-container-low rounded-xl p-10 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-primary mb-4">ROI réel sur votre carrière</h3>
              <p className="text-base text-on-surface-variant">Nos utilisateurs rapportent un taux de rappel pour entretien multiplié par 3 en utilisant nos fonctionnalités Pro pour adapter parfaitement leur CV et lettre de motivation à l&apos;offre d&apos;emploi.</p>
            </div>
            <div className="md:col-span-5 bg-tertiary-container rounded-xl p-10 text-white relative overflow-hidden min-h-[300px]">
              <h3 className="text-xl font-bold mb-4 relative z-10">Avantage IA</h3>
              <p className="text-base opacity-90 relative z-10">Obtenez l&apos;avantage décisif sur le marché du travail avec nos modèles IA propriétaires entraînés sur des milliers de candidatures réussies.</p>
              <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
                <span className="material-symbols-outlined text-[120px]">auto_awesome</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-24 max-w-2xl mx-auto">
          <h2 className="text-[28px] font-semibold text-primary text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: 'Puis-je annuler à tout moment ?', a: 'Oui. Vous pouvez annuler depuis Paramètres → Facturation. Votre plan reste actif jusqu\'à la fin de la période de facturation — aucun remboursement partiel, mais aucune surprise non plus.' },
              { q: 'Qu\'arrive-t-il à mes données si j\'annule ?', a: 'Toutes vos candidatures, CVs et dossiers générés restent accessibles sur le plan Gratuit. Vous perdez simplement l\'accès aux fonctionnalités Pro/Premium.' },
              { q: 'Puis-je changer de plan en cours de période ?', a: 'Oui. En cas de montée en gamme, la différence est calculée au prorata et facturée immédiatement sur votre moyen de paiement enregistré.' },
              { q: 'Le paiement est-il sécurisé ?', a: 'Les paiements sont traités par Dodo Payments — conforme PCI-DSS. Nous ne stockons jamais vos coordonnées bancaires.' },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white rounded-xl border border-slate-200 shadow-stitch group">
                <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-primary list-none flex justify-between items-center">
                  {q}
                  <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="px-6 pb-4 text-sm text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 w-full py-12 px-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-bold text-slate-900 text-lg">Postulis</span>
            <p className="text-xs text-slate-500">© 2026 Postulis. Décrochez votre emploi idéal.</p>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/terms" className="hover:text-slate-800">Conditions</Link>
            <Link href="/privacy" className="hover:text-slate-800">Confidentialité</Link>
            <Link href="/settings" className="hover:text-slate-800">Gérer l&apos;abonnement</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

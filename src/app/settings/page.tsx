'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/context/AuthContext'
import { getUserProfile } from '@/lib/storage'
import { dbGetUserProfile, dbUpdateUserProfile, dbGetCredits, dbGetCreditTransactions, dbExportUserData, dbDeleteAccount } from '@/lib/db'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { StoredProfile } from '@/lib/storage'

type SubscriptionInfo = {
  plan: 'free' | 'pro' | 'premium'
  plan_interval: 'monthly' | 'yearly' | null
  plan_expires_at: string | null
  subscription_id: string | null
}

const settingsTabs = [
  { id: 'profile', icon: 'person', label: 'Profil' },
  { id: 'career', icon: 'target', label: 'Objectifs' },
  { id: 'billing', icon: 'payments', label: 'Facturation' },
  { id: 'privacy', icon: 'lock', label: 'Confidentialité' },
]

export default function SettingsPage() {
  const { user, signOut, plan, refreshPlan } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<StoredProfile>(getUserProfile())
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: '', educationLevel: '', fieldOfStudy: '' })
  const [credits, setCredits] = useState<number | string>(0)
  const [transactions, setTransactions] = useState<{ type: string; amount: number; reason: string; createdAt: string }[]>([])
  const [exporting, setExporting] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    async function load() {
      const p = await dbGetUserProfile()
      setProfile(p)
      setEditForm({
        fullName: p.fullName || user?.user_metadata?.full_name || '',
        email: p.email || user?.email || '',
        role: p.role,
        educationLevel: p.educationLevel,
        fieldOfStudy: p.fieldOfStudy,
      })
      const c = await dbGetCredits()
      setCredits(c === Infinity ? '∞' : c)
      const tx = await dbGetCreditTransactions()
      setTransactions(tx)
      fetch('/api/subscription/info').then(r => r.ok ? r.json() : null).then(d => { if (d) setSubInfo(d) }).catch(() => null)
    }
    load()
  }, [user])

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de l\'annulation')
      toast.success('Abonnement annulé. Votre plan reste actif jusqu\'à la fin de la période de facturation.')
      setShowCancelConfirm(false)
      fetch('/api/subscription/info').then(r => r.json()).then(setSubInfo).catch(() => null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'annulation')
    } finally {
      setCancelling(false)
    }
  }

  const handleSaveProfile = async () => {
    await dbUpdateUserProfile({ fullName: editForm.fullName, role: editForm.role, educationLevel: editForm.educationLevel, fieldOfStudy: editForm.fieldOfStudy })
    const updated = await dbGetUserProfile()
    setProfile(updated)
    setEditing(false)
    toast.success('Profil mis à jour !')
  }

  const handleLogout = async () => {
    await signOut()
    toast.success('Déconnexion réussie')
    router.push('/')
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      const blob = await dbExportUserData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `postulis-donnees-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Données exportées !')
    } catch {
      toast.error('Export échoué. Veuillez réessayer.')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    const { error } = await dbDeleteAccount()
    if (error) {
      toast.error(error)
      setDeletingAccount(false)
      setShowDeleteConfirm(false)
      return
    }
    await signOut()
    toast.success('Compte supprimé.')
    router.push('/')
  }

  const initials = (profile.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const planLabel = plan === 'premium' ? 'Premium' : plan === 'pro' ? 'Pro' : 'Gratuit'
  const planBadgeColor = plan === 'premium' ? 'bg-tertiary-container text-white' : plan === 'pro' ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-600'

  return (
    <AppLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-[36px] font-bold text-on-background leading-tight tracking-tight">Paramètres</h1>
          <p className="text-base text-slate-500 mt-2">Gérez vos préférences de compte, objectifs de carrière et confidentialité des données.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <nav className="lg:w-64 flex flex-col space-y-1">
            {settingsTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all text-left ${activeTab === tab.id ? 'bg-white shadow-sm border border-slate-200 text-primary-container font-semibold' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined">{tab.icon}</span><span>{tab.label}</span></div>
                {activeTab === tab.id && <span className="material-symbols-outlined text-sm">chevron_right</span>}
              </button>
            ))}
          </nav>

          <div className="flex-1 space-y-8">
            {/* PROFIL */}
            {activeTab === 'profile' && (
              <section className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-primary">Informations du profil</h3>
                  {!editing
                    ? <button onClick={() => setEditing(true)} className="text-blue-700 text-sm font-semibold hover:underline">Modifier</button>
                    : <div className="flex gap-2">
                        <button onClick={() => setEditing(false)} className="text-sm text-slate-500 hover:underline">Annuler</button>
                        <button onClick={handleSaveProfile} className="text-sm font-semibold text-white bg-primary-container px-4 py-1.5 rounded-lg hover:opacity-90">Enregistrer</button>
                      </div>
                  }
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary-container text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md">{initials}</div>
                    <span className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${planBadgeColor}`}>{planLabel}</span>
                  </div>
                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Nom complet</label><input value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" /></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Adresse e-mail</label><input value={editForm.email} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400" /></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Rôle</label><input value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" /></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Niveau d&apos;études</label><input value={editForm.educationLevel} onChange={e => setEditForm(p => ({ ...p, educationLevel: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Nom complet</label><p className="text-base text-on-surface">{profile.fullName || '—'}</p></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Adresse e-mail</label><p className="text-base text-on-surface">{profile.email || user?.email || '—'}</p></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Rôle</label><p className="text-base text-on-surface capitalize">{profile.role || '—'}</p></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Formation</label><p className="text-base text-on-surface">{profile.educationLevel || '—'}</p></div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* OBJECTIFS */}
            {activeTab === 'career' && (
              <section className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="flex items-center gap-2 mb-6"><h3 className="text-xl font-bold text-primary">Objectifs de carrière</h3><span className="px-2 py-0.5 bg-tertiary-container/10 text-tertiary text-[10px] font-bold rounded uppercase tracking-widest border border-tertiary-container/20">Optimisé IA</span></div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Secteurs ciblés</label>
                    <div className="flex flex-wrap gap-2">{(profile.targetIndustries || []).map(ind => (<span key={ind} className="px-3 py-1 bg-surface-container text-primary-container rounded-full text-xs flex items-center gap-1 border border-slate-200 font-medium">{ind}</span>))}{(profile.targetIndustries?.length ?? 0) === 0 && <span className="text-xs text-slate-400">Non défini — mettez à jour dans l&apos;Onboarding</span>}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Régions ciblées</label>
                    <div className="flex flex-wrap gap-2">{(profile.targetRegions || []).map(r => (<span key={r} className="px-3 py-1 bg-surface-container text-secondary rounded-full text-xs flex items-center gap-1 border border-slate-200 font-medium">{r}</span>))}{(profile.targetRegions?.length ?? 0) === 0 && <span className="text-xs text-slate-400">Non défini — mettez à jour dans l&apos;Onboarding</span>}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Ton préféré</label><p className="text-sm font-semibold text-on-surface">{profile.preferredTone || '—'}</p></div>
                    <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Style de CV</label><p className="text-sm font-semibold text-on-surface">{profile.preferredCvStyle || '—'}</p></div>
                    <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Langue</label><p className="text-sm font-semibold text-on-surface">{profile.languagePreference === 'fr' ? 'Français' : 'English'}</p></div>
                  </div>
                </div>
              </section>
            )}

            {/* FACTURATION */}
            {activeTab === 'billing' && (
              <section className="space-y-6">
                <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-8">
                  <h3 className="text-xl font-bold text-primary mb-6">Crédits & Facturation</h3>
                  <div className="bg-primary-container p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <p className="text-xs text-on-primary-container uppercase tracking-widest font-bold">Plan actuel</p>
                      <h4 className="text-3xl font-bold mt-1">{planLabel}</h4>
                      <p className="text-sm opacity-80 mt-1">
                        {credits === '∞' ? 'Générations IA illimitées' : `${credits} génération${credits !== 1 ? 's' : ''} restante${credits !== 1 ? 's' : ''}`}
                      </p>
                      {subInfo?.plan_expires_at && plan !== 'free' && (
                        <p className="text-xs opacity-70 mt-1">
                          {subInfo.plan_interval === 'yearly' ? 'Annuel' : 'Mensuel'} · Renouvelle le {new Date(subInfo.plan_expires_at).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href="/pricing" className="px-6 py-2 bg-white text-primary-container font-bold rounded-lg hover:bg-slate-100 transition-colors text-center text-sm">
                        {plan === 'free' ? 'Changer de plan' : 'Changer de plan'}
                      </Link>
                      {plan !== 'free' && (
                        <button onClick={refreshPlan} className="px-6 py-2 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-colors text-sm">
                          Actualiser le statut
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {plan === 'pro' && (
                  <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] rounded-2xl border border-white/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-primary-container flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">workspace_premium</span>Débloquer Premium
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Ajoutez les entretiens simulés IA illimités et le support prioritaire.</p>
                    </div>
                    <Link href="/pricing" className="shrink-0 px-5 py-2 bg-primary-container text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all">
                      Passer à Premium
                    </Link>
                  </div>
                )}

                {plan !== 'free' && subInfo?.subscription_id && (
                  <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Gestion de l&apos;abonnement</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Annuler votre abonnement</p>
                        <p className="text-xs text-slate-400 mt-0.5">Votre plan reste actif jusqu&apos;au {subInfo.plan_expires_at ? new Date(subInfo.plan_expires_at).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' }) : 'la fin de la période'}.</p>
                      </div>
                      <button onClick={() => setShowCancelConfirm(true)} className="px-4 py-2 border border-error/20 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-all">
                        Annuler le plan
                      </button>
                    </div>
                  </div>
                )}

                {transactions.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-6">
                    <p className="text-sm font-semibold text-slate-700 mb-4">Historique des crédits</p>
                    <table className="w-full text-left">
                      <thead><tr className="text-xs text-slate-400 border-b border-slate-100"><th className="pb-3">Date</th><th className="pb-3">Type</th><th className="pb-3">Montant</th><th className="pb-3">Raison</th></tr></thead>
                      <tbody className="text-sm">
                        {transactions.slice(0, 10).map((t, i) => (
                          <tr key={i} className="border-b border-slate-50">
                            <td className="py-3 text-slate-400">{new Date(t.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</td>
                            <td className="py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${t.type === 'added' ? 'bg-emerald-50 text-secondary' : 'bg-slate-100 text-slate-600'}`}>{t.type === 'added' ? 'ajouté' : 'utilisé'}</span></td>
                            <td className={`py-3 font-semibold ${t.amount > 0 ? 'text-secondary' : 'text-slate-600'}`}>{t.amount > 0 ? '+' : ''}{t.amount}</td>
                            <td className="py-3 text-slate-600">{t.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* CONFIDENTIALITÉ */}
            {activeTab === 'privacy' && (
              <section className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-8">
                <h3 className="text-xl font-bold text-primary mb-6">Confidentialité & Sécurité</h3>
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-semibold text-on-surface">Connecté en tant que</p><p className="text-xs text-slate-500">{user?.email || profile.email}</p></div>
                    <button onClick={handleLogout} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">logout</span>Se déconnecter</button>
                  </div>
                  <hr className="border-slate-100" />
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700">Gestion des données</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={handleExportData}
                        disabled={exporting}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">{exporting ? 'hourglass_top' : 'download_done'}</span>
                        {exporting ? 'Export en cours...' : 'Exporter toutes mes données'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-error/20 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_forever</span>Supprimer mon compte
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">Une fois le compte supprimé, il n&apos;y a pas de retour possible. Toutes vos données seront définitivement supprimées.</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Modal annulation abonnement */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-2xl">cancel</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Annuler l&apos;abonnement</h3>
                <p className="text-sm text-slate-500">Vous pouvez toujours utiliser votre plan jusqu&apos;à son expiration.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Votre plan <strong>{planLabel}</strong> restera actif jusqu&apos;à la fin de la période de facturation en cours. Après cela, vous serez automatiquement basculé sur le plan Gratuit.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">Conserver le plan</button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Annulation...</> : 'Oui, annuler le plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression compte */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-error-container rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Supprimer le compte</h3>
                <p className="text-sm text-slate-500">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">Toutes vos candidatures, résultats et données seront définitivement supprimés. Votre abonnement (le cas échéant) sera annulé.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">Annuler</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-2.5 bg-error text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingAccount ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Suppression...</> : 'Oui, supprimer mon compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

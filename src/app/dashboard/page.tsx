'use client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { dbGetDashboardStats, dbGetApplications, dbGetUserProfile } from '@/lib/db'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import toast from 'react-hot-toast'
import type { StoredApplication } from '@/lib/storage'

const tips = [
  { title: 'Personnalisez votre résumé pour chaque poste.', body: 'Un résumé générique est ignoré. Utilisez notre IA pour injecter des mots-clés spécifiques au poste et refléter le langage de l\'offre dans votre accroche.' },
  { title: 'Quantifiez vos réalisations.', body: 'Les chiffres parlent plus fort que les mots. Au lieu de "amélioration des ventes", dites "augmentation du CA de 35% au T3 2024."' },
  { title: 'Utilisez le vocabulaire de l\'offre d\'emploi.', body: 'Les ATS recherchent des mots-clés exacts. Si l\'offre dit "gestion des parties prenantes", utilisez exactement cette expression dans votre CV.' },
  { title: 'Limitez votre CV à 1-2 pages.', body: 'Les recruteurs passent 7 secondes sur une première lecture. Soyez concis, pertinent et percutant à chaque point de votre CV.' },
  { title: 'Personnalisez l\'accroche de votre lettre de motivation.', body: 'Évitez "Je vous écris pour postuler." Commencez avec une accroche percutante qui montre que vous comprenez la mission de l\'entreprise.' },
]

const statusLabels: Record<string, string> = {
  generated: 'Généré', generating: 'En cours', draft: 'Brouillon', error: 'Erreur',
}

interface DashboardStats {
  totalApplications: number
  creditsRemaining: number | typeof Infinity
  avgMatchScore: number
  interviewRate: number
  weeklyGrowth: number
}

function DashboardContent() {
  const { user, refreshPlan } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({ totalApplications: 0, creditsRemaining: 3, avgMatchScore: 0, interviewRate: 0, weeklyGrowth: 0 })
  const [recentApps, setRecentApps] = useState<StoredApplication[]>([])
  const [displayName, setDisplayName] = useState('là')
  const [dailyTip, setDailyTip] = useState(tips[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const planParam = searchParams.get('plan')
    if (paymentStatus === 'success') {
      refreshPlan()
      toast.success(planParam ? `Bienvenue sur ${planParam.split('_')[0].charAt(0).toUpperCase() + planParam.split('_')[0].slice(1)} ! Votre plan est maintenant actif.` : 'Paiement confirmé ! Votre plan est maintenant actif.')
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      url.searchParams.delete('plan')
      router.replace(url.pathname)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function load() {
      const [s, apps, profile] = await Promise.all([
        dbGetDashboardStats(),
        dbGetApplications(),
        dbGetUserProfile(),
      ])
      setStats(s)
      setRecentApps(apps.slice(0, 5))
      const name = profile.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'là'
      setDisplayName(name.split(' ')[0])
      setDailyTip(tips[new Date().getDate() % tips.length])
      setLoading(false)
    }
    load()

    const handleVisibility = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    generating: 'bg-yellow-50 text-yellow-700',
    generated: 'bg-blue-50 text-blue-700',
    error: 'bg-red-50 text-error',
  }

  const creditsDisplay = stats.creditsRemaining === Infinity ? '∞' : stats.creditsRemaining

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Bon retour, {displayName} 👋</h1>
            <p className="text-base text-slate-500 mt-2">Voici un aperçu de votre parcours professionnel.</p>
          </div>
          <Link href="/new-application" className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined text-lg">add_circle</span>Nouvelle candidature
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="md:col-span-3 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 animate-pulse h-32"></div>)}
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><span className="material-symbols-outlined text-5xl">description</span></div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total candidatures</p>
                <p className="text-[36px] font-bold text-primary leading-none">{stats.totalApplications}</p>
                <div className="flex items-center gap-1 mt-3 text-secondary text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm">trending_up</span>+{stats.weeklyGrowth} cette semaine
                </div>
              </div>
              <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><span className="material-symbols-outlined text-5xl">record_voice_over</span></div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Taux d&apos;entretien</p>
                <p className="text-[36px] font-bold text-secondary leading-none">{stats.interviewRate}%</p>
                <div className="flex items-center gap-1 mt-3 text-secondary text-xs font-semibold"><span className="material-symbols-outlined text-sm">trending_up</span>vs. moyenne</div>
              </div>
              <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><span className="material-symbols-outlined text-5xl">toll</span></div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Crédits restants</p>
                <p className="text-[36px] font-bold text-primary leading-none">{creditsDisplay}</p>
                <Link href="/pricing" className="flex items-center gap-1 mt-3 text-primary-container text-xs font-bold hover:underline"><span className="material-symbols-outlined text-sm">add</span>Acheter plus</Link>
              </div>
              <div className="md:col-span-3 bg-primary-container p-6 rounded-2xl text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute -bottom-4 -right-4 opacity-10"><span className="material-symbols-outlined text-8xl">analytics</span></div>
                <p className="text-xs text-on-primary-container font-bold uppercase tracking-widest mb-2">Score moyen</p>
                <p className="text-[36px] font-bold leading-none">{stats.avgMatchScore}%</p>
                <p className="text-on-primary-container text-xs mt-3 font-medium">{stats.avgMatchScore >= 75 ? 'Très compétitif' : stats.avgMatchScore > 0 ? 'Bonne base' : 'Pas encore de données'}</p>
              </div>
            </div>

            {/* Accès rapide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/new-application" className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 flex items-center gap-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-primary-container text-2xl">add_circle</span></div>
                <div><p className="text-sm font-bold text-primary">Nouvelle candidature</p><p className="text-xs text-slate-500">Générez avec l&apos;IA</p></div>
              </Link>
              <Link href="/tracker" className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 flex items-center gap-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-12 h-12 bg-secondary-container/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-secondary text-2xl">list_alt</span></div>
                <div><p className="text-sm font-bold text-primary">Suivi des candidatures</p><p className="text-xs text-slate-500">Gérez votre pipeline</p></div>
              </Link>
              <Link href="/interview-prep" className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 flex items-center gap-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-12 h-12 bg-tertiary-fixed/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-tertiary-container text-2xl">school</span></div>
                <div><p className="text-sm font-bold text-primary">Prép. entretien</p><p className="text-xs text-slate-500">Entraînez-vous avec l&apos;IA</p></div>
              </Link>
            </div>

            {/* Candidatures récentes */}
            <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 overflow-hidden">
              <div className="p-6 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-xl font-bold text-primary">Candidatures récentes</h2>
                <Link href="/applications" className="text-xs text-primary-container font-bold hover:underline flex items-center gap-1">Tout voir <span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
              </div>
              {recentApps.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">description</span>
                  <p className="text-sm font-semibold text-slate-500 mb-2">Aucune candidature pour l&apos;instant</p>
                  <p className="text-xs text-slate-400 mb-4">Créez votre première candidature IA pour commencer.</p>
                  <Link href="/new-application" className="inline-flex items-center gap-2 bg-primary-container text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all">
                    <span className="material-symbols-outlined text-lg">add_circle</span>Créer une candidature
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="text-xs text-slate-400 border-b border-slate-100 uppercase tracking-wider"><th className="py-4 px-6">Poste</th><th className="py-4 px-6">Entreprise</th><th className="py-4 px-6">Score</th><th className="py-4 px-6">Statut</th><th className="py-4 px-6">Date</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                    <tbody className="text-sm">
                      {recentApps.map(app => (
                        <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-primary">{app.jobTitle}</td>
                          <td className="py-4 px-6 text-slate-600">{app.companyName || '—'}</td>
                          <td className="py-4 px-6">{app.matchScore ? <span className="px-2 py-1 bg-secondary-container/20 text-secondary text-xs font-bold rounded-full">{app.matchScore}%</span> : '—'}</td>
                          <td className="py-4 px-6"><span className={`px-2.5 py-1 text-[11px] font-bold rounded-md uppercase ${statusColors[app.status] || ''}`}>{statusLabels[app.status] || app.status}</span></td>
                          <td className="py-4 px-6 text-slate-400">{new Date(app.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</td>
                          <td className="py-4 px-6 text-right"><Link href={`/applications/${app.id}`} className="text-primary-container font-bold text-xs hover:underline">Voir</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Conseil IA */}
            <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] border border-white/50 shadow-sm">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-primary-container"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span></div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-primary-container">Conseil IA du jour</h3>
                  <p className="text-base text-slate-700 leading-relaxed"><strong>{dailyTip.title}</strong> {dailyTip.body}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>}>
      <DashboardContent />
    </Suspense>
  )
}

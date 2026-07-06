'use client'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { dbGetCredits } from '@/lib/db'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Tableau de bord' },
  { href: '/new-application', icon: 'add_circle', label: 'Nouvelle candidature' },
  { href: '/applications', icon: 'description', label: 'Mes candidatures' },
  { href: '/tracker', icon: 'list_alt', label: 'Suivi' },
  { href: '/interview-prep', icon: 'record_voice_over', label: 'Prép. entretien' },
  { href: '/skill-gap', icon: 'auto_awesome', label: 'Compétences' },
  { href: '/settings', icon: 'settings', label: 'Paramètres' },
]

const planConfig = {
  free: { label: 'Gratuit', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  pro: { label: 'Pro', bg: 'bg-primary-fixed', text: 'text-primary-container', dot: 'bg-primary-container' },
  premium: { label: 'Premium', bg: 'bg-tertiary-fixed/30', text: 'text-tertiary-container', dot: 'bg-tertiary-container' },
}

export default function SideNavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, plan } = useAuth()
  const [credits, setCredits] = useState<number | string>(3)

  useEffect(() => {
    dbGetCredits().then(c => setCredits(c === Infinity ? '∞' : c))
  }, [plan])

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Déconnexion réussie')
      router.push('/')
    } catch {
      toast.error('Erreur lors de la déconnexion')
    }
  }

  const pc = planConfig[plan] ?? planConfig.free

  return (
    <aside className="hidden lg:flex flex-col h-screen p-4 space-y-2 fixed left-0 top-0 w-64 border-r border-slate-200 bg-white z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
        <div>
          <h1 className="text-lg font-black text-primary-container leading-tight">Postulis</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Assistant Carrière</p>
        </div>
      </div>

      {/* Badge du plan */}
      <div className={`mx-2 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg ${pc.bg}`}>
        <div className={`w-2 h-2 rounded-full ${pc.dot}`}></div>
        <span className={`text-xs font-bold ${pc.text}`}>Plan {pc.label}</span>
        {plan === 'free' && (
          <Link href="/pricing" className="ml-auto text-[10px] font-bold text-primary-container hover:underline">Passer Pro</Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const isPremiumFeature = item.href === '/interview-prep' && plan !== 'premium'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 text-primary-container border-l-4 border-blue-700 translate-x-1'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50 hover:translate-x-1'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isPremiumFeature && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-tertiary-fixed/30 text-tertiary-container rounded uppercase tracking-wider">Premium</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Crédits + actions */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        {plan === 'free' ? (
          <div className="bg-primary-container p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white text-xs font-bold">Générations restantes</p>
              <span className="text-secondary-fixed text-lg font-bold">{credits}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mb-3">
              <div className="bg-secondary-fixed h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (Number(credits) / 3) * 100)}%` }}></div>
            </div>
            <Link href="/pricing" className="block w-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity text-center">
              Passer à l&apos;illimité
            </Link>
          </div>
        ) : (
          <div className={`${pc.bg} p-4 rounded-xl flex items-center gap-3`}>
            <span className="material-symbols-outlined text-2xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <div>
              <p className={`text-xs font-bold ${pc.text}`}>{pc.label} — Illimité</p>
              <p className="text-[10px] text-slate-500">Générations actives</p>
            </div>
          </div>
        )}

        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:text-blue-700 text-sm font-medium transition-all hover:translate-x-1 duration-200">
          <span className="material-symbols-outlined">person</span>
          <span>Compte</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:text-error text-sm font-medium transition-all hover:translate-x-1 duration-200 w-full"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

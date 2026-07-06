'use client'

import { useAuth } from '@/context/AuthContext'
import { dbGetApplications } from '@/lib/db'
import { getUserProfile } from '@/lib/storage'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StoredApplication } from '@/lib/storage'

const statusColors: Record<string, string> = {
  draft: 'text-slate-400',
  generating: 'text-yellow-500',
  generated: 'text-emerald-500',
  error: 'text-red-500',
}

export default function TopNavBar() {
  const { user, plan, signOut } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('User')
  const [allApps, setAllApps] = useState<StoredApplication[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showBell, setShowBell] = useState(false)
  const [showUser, setShowUser] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const profile = getUserProfile()
    if (profile.fullName) setDisplayName(profile.fullName)
    else if (user?.user_metadata?.full_name) setDisplayName(user.user_metadata.full_name)
    else if (user?.email) setDisplayName(user.email.split('@')[0])
    dbGetApplications().then(setAllApps)
  }, [user])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
        setSearchQuery('')
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const searchResults = searchQuery.trim()
    ? allApps.filter(a =>
        a.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.companyName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : []

  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const recentApps = allApps.slice(0, 5)
  const unreadCount = recentApps.filter(a => a.status === 'generated').length

  const handleLogout = async () => {
    setShowUser(false)
    await signOut()
    router.push('/')
  }

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      router.push(`/applications/${searchResults[0].id}`)
      setShowSearch(false)
      setSearchQuery('')
    }
    if (e.key === 'Escape') { setShowSearch(false); setSearchQuery('') }
  }

  return (
    <header className="flex justify-between items-center w-full px-6 py-3 sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-200">
      {/* Search */}
      <div ref={searchRef} className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3 text-slate-400 pointer-events-none">search</span>
        <input
          className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm font-semibold w-64 focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder-slate-400"
          placeholder="Rechercher des candidatures..."
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowSearch(true) }}
          onFocus={() => setShowSearch(true)}
          onKeyDown={handleSearchKey}
        />
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            {searchResults.map(app => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                onClick={() => { setShowSearch(false); setSearchQuery('') }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <span className={`material-symbols-outlined text-sm ${statusColors[app.status] ?? 'text-slate-400'}`}>description</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{app.jobTitle}</p>
                  <p className="text-xs text-slate-400 truncate">{app.companyName || 'Entreprise inconnue'}</p>
                </div>
                {app.matchScore && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{app.matchScore}%</span>
                )}
              </Link>
            ))}
          </div>
        )}
        {showSearch && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 px-4 py-6 text-center">
            <span className="material-symbols-outlined text-3xl text-slate-200 block mb-2">search_off</span>
            <p className="text-sm text-slate-400">Aucune candidature trouvée</p>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setShowBell(!showBell); setShowUser(false) }}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
          {showBell && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-bold text-primary">Activité récente</p>
                <Link href="/applications" onClick={() => setShowBell(false)} className="text-xs text-primary-container font-semibold hover:underline">Tout voir</Link>
              </div>
              {recentApps.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-200 block mb-2">notifications_none</span>
                  <p className="text-sm text-slate-400">Aucune activité pour l&apos;instant</p>
                </div>
              ) : (
                recentApps.map(app => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    onClick={() => setShowBell(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <span className={`material-symbols-outlined text-lg mt-0.5 ${statusColors[app.status] ?? 'text-slate-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {app.status === 'generated' ? 'check_circle' : app.status === 'error' ? 'error' : 'hourglass_empty'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{app.jobTitle}</p>
                      <p className="text-xs text-slate-400">{app.companyName || 'Entreprise inconnue'} · {new Date(app.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${app.status === 'generated' ? 'bg-emerald-50 text-emerald-700' : app.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                      {app.status === 'generated' ? 'Généré' : app.status === 'error' ? 'Erreur' : app.status === 'generating' ? 'En cours' : app.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1"></div>

        {/* User avatar + dropdown */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowBell(false) }}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <span className="text-sm font-semibold hidden sm:inline text-primary-container">{displayName}</span>
            <span className="material-symbols-outlined text-sm text-slate-400 hidden sm:inline">expand_more</span>
          </button>

          {showUser && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    plan === 'premium' ? 'bg-tertiary-fixed/30 text-tertiary-container' :
                    plan === 'pro' ? 'bg-primary-fixed text-primary-container' :
                    'bg-slate-100 text-slate-500'
                  }`}>Plan {plan === 'free' ? 'Gratuit' : plan === 'pro' ? 'Pro' : 'Premium'}</span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setShowUser(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">person</span>Profil & Paramètres
                </Link>
                {plan === 'free' && (
                  <Link
                    href="/pricing"
                    onClick={() => setShowUser(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-container font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">workspace_premium</span>Passer Pro
                  </Link>
                )}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

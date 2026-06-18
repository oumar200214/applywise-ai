'use client'

import { useAuth } from '@/context/AuthContext'
import { getUserProfile } from '@/lib/storage'
import { useEffect, useState } from 'react'

export default function TopNavBar() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('User')

  useEffect(() => {
    // Priority: localStorage profile > Supabase user metadata > email
    const profile = getUserProfile()
    if (profile.fullName) {
      setDisplayName(profile.fullName)
    } else if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name)
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0])
    }
  }, [user])

  // Generate avatar initials
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex justify-between items-center w-full px-6 py-3 sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-200">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-slate-400">search</span>
          <input
            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm font-semibold w-64 focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder-slate-400"
            placeholder="Search applications..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative">
          <span className="material-symbols-outlined">language</span>
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <span className="text-sm font-semibold hidden sm:inline text-primary-container">{displayName}</span>
        </div>
      </div>
    </header>
  )
}

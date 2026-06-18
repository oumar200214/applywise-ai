'use client'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCredits } from '@/lib/storage'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/new-application', icon: 'add_circle', label: 'New Application' },
  { href: '/applications', icon: 'description', label: 'My Applications' },
  { href: '/interview-prep', icon: 'record_voice_over', label: 'Interview Prep' },
  { href: '/skill-gap', icon: 'auto_awesome', label: 'Skill Gap' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
]

export default function SideNavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const [credits, setCredits] = useState(3)

  useEffect(() => {
    setCredits(getCredits())
    // Refresh credits periodically
    const interval = setInterval(() => setCredits(getCredits()), 5000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/')
    } catch {
      toast.error('Failed to log out')
    }
  }

  return (
    <aside className="hidden lg:flex flex-col h-screen p-4 space-y-2 fixed left-0 top-0 w-64 border-r border-slate-200 bg-white z-50">
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
        <div>
          <h1 className="text-lg font-black text-primary-container leading-tight">ApplyWise AI</h1>
          <p className="text-[10px] font-bold text-on-primary-container tracking-widest uppercase">Career Assistant</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-primary-container border-l-4 border-blue-700 translate-x-1'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50 hover:translate-x-1'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-slate-100">
        <div className="bg-primary-container p-4 rounded-xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-xs font-bold">Credits</p>
            <span className="text-secondary-fixed text-lg font-bold">{credits}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5 mb-3">
            <div className="bg-secondary-fixed h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (credits / 10) * 100)}%` }}></div>
          </div>
          <Link href="/pricing" className="block w-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity text-center">
            Get More Credits
          </Link>
        </div>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:text-blue-700 text-sm font-medium transition-all hover:translate-x-1 duration-200">
          <span className="material-symbols-outlined">help</span>
          <span>Help Center</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:text-error text-sm font-medium transition-all hover:translate-x-1 duration-200 w-full"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

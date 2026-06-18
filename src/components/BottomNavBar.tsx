'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/new-application', icon: 'add_box', label: 'Apply' },
  { href: '/tracker', icon: 'list_alt', label: 'Tracker' },
  { href: '/applications', icon: 'description', label: 'Apps' },
  { href: '/settings', icon: 'settings', label: 'More' },
]

export default function BottomNavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  // Expose signOut to long-press on Settings (future feature)
  void signOut
  void router
  void toast

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 pb-safe">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                isActive ? 'text-primary-container' : 'text-slate-400 hover:text-primary-container'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

'use client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getDashboardStats, getApplications, getUserProfile } from '@/lib/storage'
import { useEffect, useState } from 'react'
import type { DashboardStats, StoredApplication } from '@/lib/storage'

const tips = [
  { title: 'Customize your summary for each role.', body: 'A generic CV summary gets ignored. Use our AI to inject role-specific keywords and mirror the job post\'s language in your opening statement.' },
  { title: 'Quantify your achievements.', body: 'Numbers speak louder than words. Instead of "improved sales," say "increased revenue by 35% in Q3 2024."' },
  { title: 'Match the job description language.', body: 'ATS systems scan for exact keyword matches. If the job says "stakeholder management," use that exact phrase in your CV.' },
  { title: 'Keep your CV to 1-2 pages.', body: 'Recruiters spend 7 seconds on a first scan. Be concise, relevant, and impactful with every bullet point.' },
  { title: 'Tailor your cover letter opening.', body: 'Skip "I am writing to apply." Open with a compelling hook that shows you understand the company\'s mission.' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ totalApplications: 0, creditsRemaining: 3, avgMatchScore: 0, interviewRate: 0, weeklyGrowth: 0 })
  const [recentApps, setRecentApps] = useState<StoredApplication[]>([])
  const [displayName, setDisplayName] = useState('there')
  const [dailyTip, setDailyTip] = useState(tips[0])

  useEffect(() => {
    setStats(getDashboardStats())
    setRecentApps(getApplications().slice(0, 5))
    const profile = getUserProfile()
    const name = profile.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
    setDisplayName(name.split(' ')[0])
    setDailyTip(tips[new Date().getDate() % tips.length])
  }, [user])

  const statusColors: Record<string, string> = { draft: 'bg-slate-100 text-slate-600', generating: 'bg-yellow-50 text-yellow-700', generated: 'bg-blue-50 text-blue-700', error: 'bg-red-50 text-error' }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Welcome back, {displayName} 👋</h1>
            <p className="text-base text-slate-500 mt-2">Here&apos;s an overview of your career journey.</p>
          </div>
          <Link href="/new-application" className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined text-lg">add_circle</span>New Application
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><span className="material-symbols-outlined text-5xl">description</span></div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Applications</p>
            <p className="text-[36px] font-bold text-primary leading-none">{stats.totalApplications}</p>
            <div className="flex items-center gap-1 mt-3 text-secondary text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>+{stats.weeklyGrowth} this week
            </div>
          </div>
          <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><span className="material-symbols-outlined text-5xl">record_voice_over</span></div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Interview Rate</p>
            <p className="text-[36px] font-bold text-secondary leading-none">{stats.interviewRate}%</p>
            <div className="flex items-center gap-1 mt-3 text-secondary text-xs font-semibold"><span className="material-symbols-outlined text-sm">trending_up</span>vs. average</div>
          </div>
          <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><span className="material-symbols-outlined text-5xl">toll</span></div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Credits Remaining</p>
            <p className="text-[36px] font-bold text-primary leading-none">{stats.creditsRemaining}</p>
            <Link href="/pricing" className="flex items-center gap-1 mt-3 text-primary-container text-xs font-bold hover:underline"><span className="material-symbols-outlined text-sm">add</span>Buy more</Link>
          </div>
          <div className="md:col-span-3 bg-primary-container p-6 rounded-2xl text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute -bottom-4 -right-4 opacity-10"><span className="material-symbols-outlined text-8xl">analytics</span></div>
            <p className="text-xs text-on-primary-container font-bold uppercase tracking-widest mb-2">Avg. Match Score</p>
            <p className="text-[36px] font-bold leading-none">{stats.avgMatchScore}%</p>
            <p className="text-on-primary-container text-xs mt-3 font-medium">{stats.avgMatchScore >= 75 ? 'Highly competitive' : stats.avgMatchScore > 0 ? 'Good foundation' : 'No data yet'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/new-application" className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 flex items-center gap-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-primary-container text-2xl">add_circle</span></div>
            <div><p className="text-sm font-bold text-primary">New Application</p><p className="text-xs text-slate-500">Start AI tailoring</p></div>
          </Link>
          <Link href="/tracker" className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 flex items-center gap-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-secondary-container/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-secondary text-2xl">list_alt</span></div>
            <div><p className="text-sm font-bold text-primary">Application Tracker</p><p className="text-xs text-slate-500">Manage your pipeline</p></div>
          </Link>
          <Link href="/interview-prep" className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 flex items-center gap-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="w-12 h-12 bg-tertiary-fixed/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-tertiary-container text-2xl">school</span></div>
            <div><p className="text-sm font-bold text-primary">Interview Prep</p><p className="text-xs text-slate-500">Practice with AI coach</p></div>
          </Link>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b border-slate-100">
            <h2 className="text-xl font-bold text-primary">Recent Applications</h2>
            <Link href="/applications" className="text-xs text-primary-container font-bold hover:underline flex items-center gap-1">View all <span className="material-symbols-outlined text-sm">arrow_forward</span></Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">description</span>
              <p className="text-sm font-semibold text-slate-500 mb-2">No applications yet</p>
              <p className="text-xs text-slate-400 mb-4">Create your first AI-tailored application to get started.</p>
              <Link href="/new-application" className="inline-flex items-center gap-2 bg-primary-container text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-lg">add_circle</span>Create Application
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-xs text-slate-400 border-b border-slate-100 uppercase tracking-wider"><th className="py-4 px-6">Role</th><th className="py-4 px-6">Company</th><th className="py-4 px-6">Match</th><th className="py-4 px-6">Status</th><th className="py-4 px-6">Date</th><th className="py-4 px-6 text-right">Actions</th></tr></thead>
                <tbody className="text-sm">
                  {recentApps.map(app => (
                    <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-primary">{app.jobTitle}</td>
                      <td className="py-4 px-6 text-slate-600">{app.companyName || '—'}</td>
                      <td className="py-4 px-6">{app.matchScore ? <span className="px-2 py-1 bg-secondary-container/20 text-secondary text-xs font-bold rounded-full">{app.matchScore}%</span> : '—'}</td>
                      <td className="py-4 px-6"><span className={`px-2.5 py-1 text-[11px] font-bold rounded-md uppercase ${statusColors[app.status] || ''}`}>{app.status}</span></td>
                      <td className="py-4 px-6 text-slate-400">{new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="py-4 px-6 text-right"><Link href={`/applications/${app.id}`} className="text-primary-container font-bold text-xs hover:underline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Tip */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] border border-white/50 shadow-sm">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-primary-container"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span></div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-primary-container">Daily AI Tip</h3>
              <p className="text-base text-slate-700 leading-relaxed"><strong>{dailyTip.title}</strong> {dailyTip.body}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

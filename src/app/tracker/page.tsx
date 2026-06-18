'use client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { getTrackerEntries, updateTrackerEntry, deleteTrackerEntry } from '@/lib/storage'
import type { TrackerEntry } from '@/lib/storage'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  ready: 'bg-blue-50 text-blue-700',
  applied: 'bg-indigo-50 text-indigo-700',
  interview: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-error',
  offer: 'bg-emerald-50 text-secondary',
}
const allStatuses = ['draft','ready','applied','interview','offer','rejected']

export default function TrackerPage() {
  const [entries, setEntries] = useState<TrackerEntry[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { setEntries(getTrackerEntries()) }, [])

  const filtered = entries.filter(e => {
    if (filter !== 'all' && e.status !== filter) return false
    if (search && !e.jobTitle.toLowerCase().includes(search.toLowerCase()) && !e.companyName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total: entries.length,
    applied: entries.filter(e => e.status === 'applied').length,
    interview: entries.filter(e => e.status === 'interview').length,
    offer: entries.filter(e => e.status === 'offer').length,
    rejected: entries.filter(e => e.status === 'rejected').length,
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    updateTrackerEntry(id, { status: newStatus as TrackerEntry['status'], ...(newStatus === 'applied' ? { dateApplied: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } : {}) })
    setEntries(getTrackerEntries())
    toast.success(`Status updated to ${newStatus}`)
  }

  const handleDelete = (id: string) => {
    deleteTrackerEntry(id)
    setEntries(getTrackerEntries())
    toast.success('Entry removed from tracker')
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Application Tracker</h1>
            <p className="text-base text-slate-500 mt-2">Keep track of all your applications in one place.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg">search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:outline-none" placeholder="Search applications..." />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-600 focus:ring-2 focus:ring-primary/20">
              <option value="all">All Statuses</option>
              {allStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-primary' },
            { label: 'Applied', value: stats.applied, color: 'text-indigo-600' },
            { label: 'Interview', value: stats.interview, color: 'text-amber-600' },
            { label: 'Offer', value: stats.offer, color: 'text-secondary' },
            { label: 'Rejected', value: stats.rejected, color: 'text-error' },
          ].map(stat => (
            <div key={stat.label} className="bg-white p-4 rounded-xl shadow-stitch border border-slate-100 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">list_alt</span>
            <p className="text-lg font-semibold text-slate-500 mb-2">No tracked applications</p>
            <p className="text-sm text-slate-400 mb-6">Generate an application and save it to your tracker to start.</p>
            <Link href="/new-application" className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-lg">add_circle</span>Create Application
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-4 px-6">Role</th><th className="py-4 px-6">Company</th><th className="py-4 px-6">Match</th><th className="py-4 px-6">Status</th><th className="py-4 px-6">Applied</th><th className="py-4 px-6">Docs</th><th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-primary">{entry.jobTitle}</td>
                      <td className="py-4 px-6 text-slate-600">{entry.companyName}</td>
                      <td className="py-4 px-6">{entry.matchScore ? <span className={`px-2 py-1 text-xs font-bold rounded-full ${entry.matchScore >= 80 ? 'bg-secondary-container/20 text-secondary' : entry.matchScore >= 65 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{entry.matchScore}%</span> : '—'}</td>
                      <td className="py-4 px-6">
                        <select value={entry.status} onChange={e => handleStatusChange(entry.id, e.target.value)} className={`px-2.5 py-1 text-[11px] font-bold rounded-md uppercase border-none cursor-pointer ${statusColors[entry.status]}`}>
                          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-4 px-6 text-slate-400">{entry.dateApplied || '—'}</td>
                      <td className="py-4 px-6">{entry.docsReady ? <span className="material-symbols-outlined text-secondary text-lg">check_circle</span> : <span className="material-symbols-outlined text-amber-400 text-lg">pending</span>}</td>
                      <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                        <Link href={`/applications/${entry.applicationId}`} className="text-primary-container font-bold text-xs hover:underline">View</Link>
                        <button onClick={() => handleDelete(entry.id)} className="text-slate-400 hover:text-error transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

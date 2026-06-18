'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/context/AuthContext'
import { getUserProfile, updateUserProfile, getCredits, getCreditTransactions } from '@/lib/storage'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const settingsTabs = [
  { id: 'profile', icon: 'person', label: 'Profile' },
  { id: 'career', icon: 'target', label: 'Career Goals' },
  { id: 'billing', icon: 'payments', label: 'Billing' },
  { id: 'privacy', icon: 'lock', label: 'Privacy & Security' },
]

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState(getUserProfile())
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: '', educationLevel: '', fieldOfStudy: '' })
  const [credits, setCredits] = useState(0)
  const [transactions, setTransactions] = useState<{ type: string; amount: number; reason: string; createdAt: string }[]>([])

  useEffect(() => {
    const p = getUserProfile()
    setProfile(p)
    setEditForm({ fullName: p.fullName || user?.user_metadata?.full_name || '', email: p.email || user?.email || '', role: p.role, educationLevel: p.educationLevel, fieldOfStudy: p.fieldOfStudy })
    setCredits(getCredits())
    setTransactions(getCreditTransactions())
  }, [user])

  const handleSaveProfile = () => {
    updateUserProfile(editForm)
    setProfile(getUserProfile())
    setEditing(false)
    toast.success('Profile updated!')
  }

  const handleLogout = async () => {
    await signOut()
    toast.success('Logged out')
    router.push('/')
  }

  const initials = (profile.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <AppLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-[36px] font-bold text-on-background leading-tight tracking-tight">Settings</h1>
          <p className="text-base text-slate-500 mt-2">Manage your account preferences, career goals, and data privacy.</p>
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
            {activeTab === 'profile' && (
              <section className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-primary">Profile Information</h3>
                  {!editing ? <button onClick={() => setEditing(true)} className="text-blue-700 text-sm font-semibold hover:underline">Edit Info</button> : <button onClick={handleSaveProfile} className="text-sm font-semibold text-white bg-primary-container px-4 py-1.5 rounded-lg hover:opacity-90">Save</button>}
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary-container text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md">{initials}</div>
                  </div>
                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Full Name</label><input value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" /></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Email</label><input value={editForm.email} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400" /></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Role</label><input value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" /></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Education</label><input value={editForm.educationLevel} onChange={e => setEditForm(p => ({ ...p, educationLevel: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Full Name</label><p className="text-base text-on-surface">{profile.fullName || '—'}</p></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Email</label><p className="text-base text-on-surface">{profile.email || user?.email || '—'}</p></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Role</label><p className="text-base text-on-surface capitalize">{profile.role || '—'}</p></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Education</label><p className="text-base text-on-surface">{profile.educationLevel || '—'}</p></div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'career' && (
              <section className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="flex items-center gap-2 mb-6"><h3 className="text-xl font-bold text-primary">Career Goals</h3><span className="px-2 py-0.5 bg-tertiary-container/10 text-tertiary text-[10px] font-bold rounded uppercase tracking-widest border border-tertiary-container/20">AI Optimized</span></div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Target Industries</label>
                    <div className="flex flex-wrap gap-2">{(profile.targetIndustries || []).map(ind => (<span key={ind} className="px-3 py-1 bg-surface-container text-primary-container rounded-full text-xs flex items-center gap-1 border border-slate-200 font-medium">{ind}</span>))}{profile.targetIndustries?.length === 0 && <span className="text-xs text-slate-400">Not set — update in Onboarding</span>}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Target Regions</label>
                    <div className="flex flex-wrap gap-2">{(profile.targetRegions || []).map(r => (<span key={r} className="px-3 py-1 bg-surface-container text-secondary rounded-full text-xs flex items-center gap-1 border border-slate-200 font-medium">{r}</span>))}{profile.targetRegions?.length === 0 && <span className="text-xs text-slate-400">Not set — update in Onboarding</span>}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Preferred Tone</label><p className="text-sm font-semibold text-on-surface">{profile.preferredTone || '—'}</p></div>
                    <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">CV Style</label><p className="text-sm font-semibold text-on-surface">{profile.preferredCvStyle || '—'}</p></div>
                    <div className="space-y-1"><label className="text-xs text-slate-500 font-medium">Language</label><p className="text-sm font-semibold text-on-surface">{profile.languagePreference === 'fr' ? 'Français' : 'English'}</p></div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'billing' && (
              <section className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-8">
                <h3 className="text-xl font-bold text-primary mb-6">Credits & Billing</h3>
                <div className="bg-primary-container p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                  <div><p className="text-xs text-on-primary-container uppercase tracking-widest font-bold">Available Credits</p><h4 className="text-3xl font-bold mt-1">{credits}</h4><p className="text-sm opacity-80 mt-1">Each AI generation costs 1 credit</p></div>
                  <a href="/pricing" className="px-6 py-2 bg-white text-primary-container font-bold rounded-lg hover:bg-slate-100 transition-colors">Buy Credits</a>
                </div>
                {transactions.length > 0 && (
                  <div><p className="text-sm font-semibold text-slate-700 mb-4">Transaction History</p>
                    <table className="w-full text-left"><thead><tr className="text-xs text-slate-400 border-b border-slate-100"><th className="pb-3">Date</th><th className="pb-3">Type</th><th className="pb-3">Amount</th><th className="pb-3">Reason</th></tr></thead>
                      <tbody className="text-sm">{transactions.slice(0, 10).map((t, i) => (<tr key={i} className="border-b border-slate-50"><td className="py-3 text-slate-400">{new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td><td className="py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${t.type === 'added' ? 'bg-emerald-50 text-secondary' : 'bg-slate-100 text-slate-600'}`}>{t.type}</span></td><td className={`py-3 font-semibold ${t.amount > 0 ? 'text-secondary' : 'text-slate-600'}`}>{t.amount > 0 ? '+' : ''}{t.amount}</td><td className="py-3 text-slate-600">{t.reason}</td></tr>))}</tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'privacy' && (
              <section className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-8">
                <h3 className="text-xl font-bold text-primary mb-6">Privacy & Security</h3>
                <div className="space-y-8">
                  <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-on-surface">Signed in as</p><p className="text-xs text-slate-500">{user?.email || profile.email}</p></div><button onClick={handleLogout} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">logout</span>Sign Out</button></div>
                  <hr className="border-slate-100" />
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-error">Danger Zone</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"><span className="material-symbols-outlined text-[18px]">download_done</span>Export All My Data</button>
                      <button className="flex items-center justify-center gap-2 px-4 py-2 border border-error/20 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-all"><span className="material-symbols-outlined text-[18px]">delete_forever</span>Delete My Account</button>
                    </div>
                    <p className="text-xs text-slate-400">Once you delete your account, there is no going back.</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

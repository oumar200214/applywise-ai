'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { updateUserProfile } from '@/lib/storage'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, title: 'Your Profile', subtitle: 'Tell us about yourself' },
  { id: 2, title: 'Career Goals', subtitle: 'What are you looking for?' },
  { id: 3, title: 'Preferences', subtitle: 'Customize your experience' },
]
const roles = [
  { value: 'student', label: 'Student', icon: 'school', desc: 'Currently studying' },
  { value: 'intern', label: 'Intern', icon: 'work_outline', desc: 'Looking for internships' },
  { value: 'junior', label: 'Junior Pro', icon: 'badge', desc: '0-3 years experience' },
  { value: 'jobseeker', label: 'Job Seeker', icon: 'person_search', desc: 'Actively searching' },
]
const industries = ['Technology','Finance','Healthcare','Education','Marketing','Design','Engineering','Consulting','Legal','Non-Profit']
const regions = ['United States','United Kingdom','France','Germany','Canada','Australia','Remote','Other']
const educationLevels = ['High School','Associate Degree',"Bachelor's Degree","Master's Degree",'PhD','Bootcamp','Self-Taught']

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    role: '', educationLevel: '', fieldOfStudy: '',
    targetIndustries: [] as string[], targetRegions: [] as string[],
    languagePreference: 'en', preferredTone: 'Professional', preferredCvStyle: 'Modern',
  })

  const toggle = (field: 'targetIndustries'|'targetRegions', val: string) => {
    setForm(p => ({ ...p, [field]: p[field].includes(val) ? p[field].filter(i => i !== val) : [...p[field], val] }))
  }

  const finish = async () => {
    setSaving(true)
    updateUserProfile({ ...form, fullName: user?.user_metadata?.full_name || '', email: user?.email || '', onboardingCompleted: true })
    toast.success('Profile set up! Welcome to ApplyWise AI 🚀')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-lg font-black text-primary-container">ApplyWise AI</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium">Step {step} of 3</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-3 mb-12">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${s.id === step ? 'bg-primary-container text-white shadow-lg shadow-primary/15' : s.id < step ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-400'}`}>
                {s.id < step ? <span className="material-symbols-outlined text-sm">check</span> : <span className="text-xs">{s.id}</span>}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${s.id < step ? 'bg-secondary' : 'bg-slate-200'}`}></div>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center"><h1 className="text-3xl font-bold text-primary mb-2">Tell us about yourself</h1><p className="text-on-surface-variant">This helps us personalize your AI-generated applications.</p></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">I am a...</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map(r => (
                  <button key={r.value} onClick={() => setForm(p => ({ ...p, role: r.value }))} className={`p-4 rounded-xl border-2 text-left transition-all ${form.role === r.value ? 'border-primary-container bg-primary-fixed/20 shadow-md' : 'border-slate-200 bg-white hover:border-primary-fixed'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-2xl ${form.role === r.value ? 'text-primary-container' : 'text-slate-400'}`}>{r.icon}</span>
                      <div><p className="text-sm font-bold text-primary">{r.label}</p><p className="text-xs text-slate-500">{r.desc}</p></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Education Level</label>
              <select value={form.educationLevel} onChange={e => setForm(p => ({ ...p, educationLevel: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm">
                <option value="">Select your education level</option>
                {educationLevels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Field of Study</label>
              <input value={form.fieldOfStudy} onChange={e => setForm(p => ({ ...p, fieldOfStudy: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="e.g., Computer Science" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center"><h1 className="text-3xl font-bold text-primary mb-2">Your Career Goals</h1><p className="text-on-surface-variant">What industries and regions are you targeting?</p></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Target Industries</label>
              <div className="flex flex-wrap gap-2">{industries.map(ind => (<button key={ind} onClick={() => toggle('targetIndustries', ind)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.targetIndustries.includes(ind) ? 'bg-primary-container text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-fixed'}`}>{ind}</button>))}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Preferred Regions</label>
              <div className="flex flex-wrap gap-2">{regions.map(r => (<button key={r} onClick={() => toggle('targetRegions', r)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.targetRegions.includes(r) ? 'bg-secondary text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-secondary-container'}`}>{r}</button>))}</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center"><h1 className="text-3xl font-bold text-primary mb-2">Almost there!</h1><p className="text-on-surface-variant">Customize how your applications will be generated.</p></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Preferred Language</label>
              <div className="grid grid-cols-2 gap-3">
                {[{v:'en',f:'🇬🇧',l:'English'},{v:'fr',f:'🇫🇷',l:'Français'}].map(x => (
                  <button key={x.v} onClick={() => setForm(p => ({ ...p, languagePreference: x.v }))} className={`p-4 rounded-xl border-2 text-center transition-all ${form.languagePreference === x.v ? 'border-primary-container bg-primary-fixed/20' : 'border-slate-200 bg-white'}`}>
                    <p className="text-2xl mb-1">{x.f}</p><p className="text-sm font-bold">{x.l}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Application Tone</label>
              <div className="grid grid-cols-3 gap-3">{['Professional','Creative','Academic'].map(t => (<button key={t} onClick={() => setForm(p => ({ ...p, preferredTone: t }))} className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${form.preferredTone === t ? 'border-primary-container bg-primary-fixed/20 text-primary-container' : 'border-slate-200 bg-white text-slate-600'}`}>{t}</button>))}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">CV Style</label>
              <div className="grid grid-cols-3 gap-3">{['Modern','Classic','Minimal'].map(s => (<button key={s} onClick={() => setForm(p => ({ ...p, preferredCvStyle: s }))} className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${form.preferredCvStyle === s ? 'border-primary-container bg-primary-fixed/20 text-primary-container' : 'border-slate-200 bg-white text-slate-600'}`}>{s}</button>))}</div>
            </div>
            <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] border border-white/50 p-6 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-tertiary-container">shield</span></div>
              <div><p className="text-sm font-bold text-primary-container mb-1">Your data is safe</p><p className="text-xs text-slate-600">We never train AI on your CV. Your data is encrypted and you can delete it anytime.</p></div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100">
          {step > 1 ? <button onClick={() => setStep(p => p - 1)} className="flex items-center gap-2 text-slate-500 font-semibold text-sm hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">arrow_back</span>Back</button> : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(p => p + 1)} className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">Continue <span className="material-symbols-outlined text-lg">arrow_forward</span></button>
          ) : (
            <button onClick={finish} disabled={saving} className="flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-symbols-outlined text-lg">rocket_launch</span>Launch My Dashboard</>}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

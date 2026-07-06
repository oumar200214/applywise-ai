'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { updateUserProfile } from '@/lib/storage'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, title: 'Votre profil', subtitle: 'Parlez-nous de vous' },
  { id: 2, title: 'Objectifs', subtitle: 'Que recherchez-vous ?' },
  { id: 3, title: 'Préférences', subtitle: 'Personnalisez votre expérience' },
]
const roles = [
  { value: 'student', label: 'Étudiant(e)', icon: 'school', desc: 'En cours d\'études' },
  { value: 'intern', label: 'Stagiaire', icon: 'work_outline', desc: 'Recherche de stage' },
  { value: 'junior', label: 'Junior', icon: 'badge', desc: '0-3 ans d\'expérience' },
  { value: 'jobseeker', label: 'En recherche', icon: 'person_search', desc: 'Activement en recherche' },
]
const industries = ['Technologie','Finance','Santé','Éducation','Marketing','Design','Ingénierie','Conseil','Juridique','Associatif']
const regions = ['France','Belgique','Suisse','Canada','Maroc','Sénégal','Côte d\'Ivoire','Télétravail','International']
const educationLevels = ['Lycée / Baccalauréat','BTS / DUT / BUT','Licence / Bachelor','Master','Doctorat','Formation intensive (Bootcamp)','Autodidacte']

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    role: '', educationLevel: '', fieldOfStudy: '',
    targetIndustries: [] as string[], targetRegions: [] as string[],
    languagePreference: 'fr', preferredTone: 'Professional', preferredCvStyle: 'Modern',
  })

  const toggle = (field: 'targetIndustries'|'targetRegions', val: string) => {
    setForm(p => ({ ...p, [field]: p[field].includes(val) ? p[field].filter(i => i !== val) : [...p[field], val] }))
  }

  const finish = async () => {
    setSaving(true)
    updateUserProfile({ ...form, fullName: user?.user_metadata?.full_name || '', email: user?.email || '', onboardingCompleted: true })
    toast.success('Profil configuré ! Bienvenue sur Postulis 🚀')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-lg font-black text-primary-container">Postulis</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium">Étape {step} sur 3</span>
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
            <div className="text-center"><h1 className="text-3xl font-bold text-primary mb-2">Parlez-nous de vous</h1><p className="text-on-surface-variant">Cela nous aide à personnaliser vos candidatures générées par IA.</p></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Je suis...</label>
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">Niveau d&apos;études</label>
              <select value={form.educationLevel} onChange={e => setForm(p => ({ ...p, educationLevel: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm">
                <option value="">Sélectionnez votre niveau</option>
                {educationLevels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Domaine d&apos;études</label>
              <input value={form.fieldOfStudy} onChange={e => setForm(p => ({ ...p, fieldOfStudy: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="ex. Informatique, Marketing..." />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center"><h1 className="text-3xl font-bold text-primary mb-2">Vos objectifs de carrière</h1><p className="text-on-surface-variant">Quels secteurs et régions ciblez-vous ?</p></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Secteurs ciblés</label>
              <div className="flex flex-wrap gap-2">{industries.map(ind => (<button key={ind} onClick={() => toggle('targetIndustries', ind)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.targetIndustries.includes(ind) ? 'bg-primary-container text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-fixed'}`}>{ind}</button>))}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Régions préférées</label>
              <div className="flex flex-wrap gap-2">{regions.map(r => (<button key={r} onClick={() => toggle('targetRegions', r)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.targetRegions.includes(r) ? 'bg-secondary text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-secondary-container'}`}>{r}</button>))}</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center"><h1 className="text-3xl font-bold text-primary mb-2">Presque terminé !</h1><p className="text-on-surface-variant">Personnalisez la génération de vos candidatures.</p></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Langue préférée</label>
              <div className="grid grid-cols-2 gap-3">
                {[{v:'fr',f:'🇫🇷',l:'Français'},{v:'en',f:'🇬🇧',l:'English'}].map(x => (
                  <button key={x.v} onClick={() => setForm(p => ({ ...p, languagePreference: x.v }))} className={`p-4 rounded-xl border-2 text-center transition-all ${form.languagePreference === x.v ? 'border-primary-container bg-primary-fixed/20' : 'border-slate-200 bg-white'}`}>
                    <p className="text-2xl mb-1">{x.f}</p><p className="text-sm font-bold">{x.l}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Ton des candidatures</label>
              <div className="grid grid-cols-3 gap-3">{[['Professional','Professionnel'],['Creative','Créatif'],['Academic','Académique']].map(([v,l]) => (<button key={v} onClick={() => setForm(p => ({ ...p, preferredTone: v }))} className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${form.preferredTone === v ? 'border-primary-container bg-primary-fixed/20 text-primary-container' : 'border-slate-200 bg-white text-slate-600'}`}>{l}</button>))}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Style de CV</label>
              <div className="grid grid-cols-3 gap-3">{[['Modern','Moderne'],['Classic','Classique'],['Minimal','Minimaliste']].map(([v,l]) => (<button key={v} onClick={() => setForm(p => ({ ...p, preferredCvStyle: v }))} className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${form.preferredCvStyle === v ? 'border-primary-container bg-primary-fixed/20 text-primary-container' : 'border-slate-200 bg-white text-slate-600'}`}>{l}</button>))}</div>
            </div>
            <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] border border-white/50 p-6 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-tertiary-container">shield</span></div>
              <div><p className="text-sm font-bold text-primary-container mb-1">Vos données sont protégées</p><p className="text-xs text-slate-600">Nous n&apos;entraînons jamais l&apos;IA sur votre CV. Vos données sont chiffrées et vous pouvez les supprimer à tout moment.</p></div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100">
          {step > 1 ? <button onClick={() => setStep(p => p - 1)} className="flex items-center gap-2 text-slate-500 font-semibold text-sm hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">arrow_back</span>Retour</button> : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(p => p + 1)} className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">Continuer <span className="material-symbols-outlined text-lg">arrow_forward</span></button>
          ) : (
            <button onClick={finish} disabled={saving} className="flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-symbols-outlined text-lg">rocket_launch</span>Accéder à mon tableau de bord</>}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

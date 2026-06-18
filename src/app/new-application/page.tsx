'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { generateId, saveApplication, getCredits, canGenerate, hasPaidPlan } from '@/lib/storage'
import toast from 'react-hot-toast'

const outputOptions = [
  { id: 'tailored_cv', icon: 'description', title: 'Tailored CV', desc: 'ATS-optimized, keyword-injected CV', credits: 1, default: true },
  { id: 'cover_letter', icon: 'mail', title: 'Cover Letter', desc: 'Personalized letter matching the role', credits: 0, default: true },
  { id: 'match_score', icon: 'analytics', title: 'Match Score', desc: 'Detailed fit analysis with percentages', credits: 0, default: true },
  { id: 'interview_prep', icon: 'record_voice_over', title: 'Interview Prep', desc: 'Top questions with STAR answers', credits: 0, default: false },
  { id: 'skill_gap', icon: 'auto_awesome', title: 'Skill Gap Analysis', desc: 'Missing skills & 7-day plan', credits: 0, default: false },
  { id: 'ats_keywords', icon: 'key', title: 'ATS Keywords', desc: 'Extract recruiter-priority keywords', credits: 0, default: true },
]

export default function NewApplicationPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [country, setCountry] = useState('')
  const [jobType, setJobType] = useState('')
  const [cvText, setCvText] = useState('')
  const [cvMethod, setCvMethod] = useState<'paste'|'upload'>('paste')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  const [extracting, setExtracting] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    // Plain text files can be read client-side
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (event) => setCvText(event.target?.result as string)
      reader.readAsText(file)
      toast.success('CV text loaded!')
      return
    }

    // PDF/DOCX: send to server-side extraction API
    setExtracting(true)
    toast.loading('Extracting text from your CV...', { id: 'extract' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/extract-cv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to extract CV text. Try pasting it directly.', { id: 'extract' })
        setExtracting(false)
        return
      }

      setCvText(data.text)
      toast.success(`CV extracted successfully! (${data.charCount.toLocaleString()} characters)`, { id: 'extract' })
    } catch {
      toast.error('Failed to extract CV. Please try pasting your CV text directly.', { id: 'extract' })
    } finally {
      setExtracting(false)
    }
  }

  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(outputOptions.filter(o => o.default).map(o => o.id))
  const [tone, setTone] = useState('Professional')
  const [outputLanguage, setOutputLanguage] = useState('English')

  const toggleOutput = (id: string) => setSelectedOutputs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const credits = typeof window !== 'undefined' ? getCredits() : 3

  const handleGenerate = async () => {
    if (!jobTitle.trim()) { toast.error('Please enter a job title'); return }
    if (!jobDescription.trim()) { toast.error('Please paste the job description'); return }
    if (!cvText.trim()) { toast.error('Please provide your CV content'); return }
    if (!canGenerate()) { toast.error('You have used all 3 free generations. Upgrade to Pro for unlimited access!'); router.push('/pricing'); return }

    setLoading(true)
    const appId = generateId()
    saveApplication({
      id: appId, userId: '', jobTitle, companyName, jobDescription, jobUrl, country, jobType,
      cvText, selectedOutputs, tone, outputLanguage, status: 'generating',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    router.push(`/generating?id=${appId}`)
  }

  const stepsData = [
    { id: 1, title: 'Job Description', icon: 'content_paste' },
    { id: 2, title: 'Your CV', icon: 'person' },
    { id: 3, title: 'Choose Outputs', icon: 'tune' },
  ]

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <nav className="flex gap-2 text-xs text-slate-400 mb-2 font-medium"><span>Dashboard</span><span>/</span><span className="text-primary font-semibold">New Application</span></nav>
          <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Create New Application</h1>
          <p className="text-base text-slate-500 mt-2">Follow the steps to generate your AI-powered application pack.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 bg-white p-4 rounded-2xl shadow-stitch border border-slate-100">
          {stepsData.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2">
              <button onClick={() => s.id < step && setStep(s.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${s.id === step ? 'bg-primary-container text-white shadow-lg shadow-primary/15' : s.id < step ? 'bg-secondary/10 text-secondary' : 'bg-slate-50 text-slate-400'}`}>
                {s.id < step ? <span className="material-symbols-outlined text-sm">check_circle</span> : <span className="material-symbols-outlined text-sm">{s.icon}</span>}
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {idx < stepsData.length - 1 && <div className={`w-8 md:w-16 h-0.5 ${s.id < step ? 'bg-secondary' : 'bg-slate-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 space-y-6">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">content_paste</span>Job Description</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Job Title *</label><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="e.g., Senior Product Designer" required /></div>
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Company Name</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="e.g., Google" /></div>
              </div>
              <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Job Post URL</label><input value={jobUrl} onChange={e => setJobUrl(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="https://..." /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Country</label><input value={country} onChange={e => setCountry(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="e.g., United States" /></div>
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Job Type</label>
                  <select value={jobType} onChange={e => setJobType(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm"><option value="">Select type</option><option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option><option>Freelance</option></select>
                </div>
              </div>
              <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Full Job Description *</label><textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm min-h-[200px] resize-y" placeholder="Paste the full job description here..." required /></div>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-6 rounded-2xl border border-white/50">
                <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-tertiary-container">tips_and_updates</span><h3 className="text-sm font-bold text-primary-container">Smart Tip</h3></div>
                <p className="text-xs text-slate-600 leading-relaxed">Paste the <strong>full job description</strong> including requirements, responsibilities, and &quot;nice to have&quot; sections. The more detail, the better the AI tailoring.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>AI will extract:</h3>
                <ul className="space-y-2 text-xs text-slate-600">
                  {['Key requirements','Required skills','Company culture cues','ATS keywords'].map(t => <li key={t} className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-sm">check</span>{t}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 space-y-6">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">person</span>Your CV / Profile</h2>
              <div className="flex gap-3">
                <button onClick={() => setCvMethod('paste')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${cvMethod === 'paste' ? 'bg-primary-container text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><span className="material-symbols-outlined text-lg">content_paste</span>Paste Text</button>
                <button onClick={() => setCvMethod('upload')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${cvMethod === 'upload' ? 'bg-primary-container text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><span className="material-symbols-outlined text-lg">upload_file</span>Upload File</button>
              </div>
              {cvMethod === 'paste' ? (
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Paste your CV content</label><textarea value={cvText} onChange={e => setCvText(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm min-h-[300px] resize-y" placeholder="Paste your full CV text, LinkedIn profile, or resume content here..." /></div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-primary-container hover:bg-primary-fixed/5 transition-all cursor-pointer relative overflow-hidden"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".txt,.pdf,.doc,.docx"
                  />
                  <span className={`material-symbols-outlined text-5xl mb-4 block ${extracting ? 'text-primary-container animate-spin' : fileName ? 'text-primary-container' : 'text-slate-300'}`}>
                    {extracting ? 'progress_activity' : fileName ? 'task' : 'cloud_upload'}
                  </span>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {extracting ? 'Extracting text from your CV...' : fileName ? fileName : 'Drag & drop your CV here'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {extracting ? 'This may take a few seconds' : fileName && cvText ? `✓ ${cvText.length.toLocaleString()} characters extracted` : 'or click to browse (PDF, DOCX, TXT)'}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-secondary">shield</span><h3 className="text-sm font-bold text-primary">Data Privacy</h3></div>
                <p className="text-xs text-slate-600 leading-relaxed">Your CV data is <strong>encrypted</strong> and never used for AI training. You can delete it anytime from your Settings.</p>
              </div>
              <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-6 rounded-2xl border border-white/50">
                <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-tertiary-container">lightbulb</span><h3 className="text-sm font-bold text-primary-container">Pro Tip</h3></div>
                <p className="text-xs text-slate-600 leading-relaxed">Include your <strong>full work history</strong>, education, skills, and projects. The AI uses all this data to find the best matches.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 space-y-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">tune</span>Choose Your Outputs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {outputOptions.map(opt => (
                    <button key={opt.id} onClick={() => toggleOutput(opt.id)} className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${selectedOutputs.includes(opt.id) ? 'border-primary-container bg-primary-fixed/10 shadow-md' : 'border-slate-200 bg-white hover:border-primary-fixed'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-2xl mt-0.5 ${selectedOutputs.includes(opt.id) ? 'text-primary-container' : 'text-slate-400'}`}>{opt.icon}</span>
                        <div className="flex-1"><p className="text-sm font-bold text-primary">{opt.title}</p><p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p></div>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedOutputs.includes(opt.id) ? 'bg-primary-container border-primary-container' : 'border-slate-300'}`}>
                          {selectedOutputs.includes(opt.id) && <span className="material-symbols-outlined text-white text-sm">check</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 space-y-4">
                <h3 className="text-lg font-bold text-primary">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Tone</label><select value={tone} onChange={e => setTone(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"><option>Professional</option><option>Creative</option><option>Academic</option><option>Casual</option></select></div>
                  <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Output Language</label><select value={outputLanguage} onChange={e => setOutputLanguage(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"><option>English</option><option>French</option></select></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 sticky top-20">
                <h3 className="text-sm font-bold text-primary mb-4">Generation Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Role</span><span className="font-semibold text-primary">{jobTitle || '—'}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Company</span><span className="font-semibold text-primary">{companyName || '—'}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Outputs</span><span className="font-semibold text-primary">{selectedOutputs.length} selected</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Tone</span><span className="font-semibold text-primary">{tone}</span></div>
                  <hr className="border-slate-100" />
                  <div className="flex justify-between text-sm"><span className="text-slate-700 font-semibold">Cost</span><span className="text-primary-container font-bold">1 Credit</span></div>
                </div>
                <button onClick={handleGenerate} disabled={loading || !jobTitle || !jobDescription} className="w-full py-3.5 bg-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-symbols-outlined text-lg">auto_awesome</span>Generate Application</>}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">{hasPaidPlan() ? '✨ Unlimited generations (Paid Plan)' : `You have ${credits} free generation${credits !== 1 ? 's' : ''} remaining`}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex justify-between items-center pt-4">
          {step > 1 ? <button onClick={() => setStep(p => p - 1)} className="flex items-center gap-2 text-slate-500 font-semibold text-sm hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">arrow_back</span>Back</button> : <div />}
          {step < 3 && <button onClick={() => setStep(p => p + 1)} className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">Continue <span className="material-symbols-outlined text-lg">arrow_forward</span></button>}
        </div>
      </div>
    </AppLayout>
  )
}

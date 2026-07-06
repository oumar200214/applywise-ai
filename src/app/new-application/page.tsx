'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { generateId, getCredits, canGenerate } from '@/lib/storage'
import { dbSaveApplication } from '@/lib/db'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import toast from 'react-hot-toast'

const outputOptions = [
  { id: 'tailored_cv', icon: 'description', title: 'CV personnalisé', desc: 'CV optimisé ATS avec mots-clés injectés', plan: null, default: true },
  { id: 'cover_letter', icon: 'mail', title: 'Lettre de motivation', desc: 'Lettre personnalisée correspondant au poste', plan: 'pro', default: true },
  { id: 'match_score', icon: 'analytics', title: 'Score de correspondance', desc: 'Analyse détaillée de compatibilité avec pourcentages', plan: 'pro', default: true },
  { id: 'interview_prep', icon: 'record_voice_over', title: 'Prép. entretien', desc: 'Top questions avec réponses méthode STAR', plan: null, default: false },
  { id: 'skill_gap', icon: 'auto_awesome', title: 'Analyse des compétences', desc: 'Compétences manquantes & plan 7 jours', plan: null, default: false },
  { id: 'ats_keywords', icon: 'key', title: 'Mots-clés ATS', desc: 'Extraire les mots-clés prioritaires recruteur', plan: null, default: true },
]

const planBadge: Record<string, { label: string; classes: string }> = {
  pro: { label: 'Pro', classes: 'bg-primary-fixed text-primary-container' },
  premium: { label: 'Premium', classes: 'bg-tertiary-fixed/30 text-tertiary-container' },
}

function canAccessOutput(optPlan: string | null, userPlan: string): boolean {
  if (!optPlan) return true
  if (optPlan === 'pro') return userPlan === 'pro' || userPlan === 'premium'
  if (optPlan === 'premium') return userPlan === 'premium'
  return true
}

export default function NewApplicationPage() {
  const router = useRouter()
  const { plan } = useAuth()
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
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (event) => setCvText(event.target?.result as string)
      reader.readAsText(file)
      toast.success('Texte du CV chargé !')
      return
    }
    setExtracting(true)
    toast.loading('Extraction du texte de votre CV...', { id: 'extract' })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/extract-cv', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Échec de l\'extraction. Essayez de coller le texte directement.', { id: 'extract' })
        setExtracting(false)
        return
      }
      setCvText(data.text)
      toast.success(`CV extrait avec succès ! (${data.charCount.toLocaleString()} caractères)`, { id: 'extract' })
    } catch {
      toast.error('Échec de l\'extraction. Collez votre CV directement.', { id: 'extract' })
    } finally {
      setExtracting(false)
    }
  }

  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(
    outputOptions.filter(o => o.default).map(o => o.id)
  )
  const [tone, setTone] = useState('Professional')
  const [outputLanguage, setOutputLanguage] = useState('French')

  const toggleOutput = (id: string) => setSelectedOutputs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const credits = typeof window !== 'undefined' ? getCredits() : 3
  const isPaid = plan === 'pro' || plan === 'premium'

  const handleGenerate = async () => {
    if (!jobTitle.trim()) { toast.error('Veuillez saisir un intitulé de poste'); return }
    if (!jobDescription.trim()) { toast.error('Veuillez coller la description du poste'); return }
    if (!cvText.trim()) { toast.error('Veuillez fournir le contenu de votre CV'); return }
    if (!canGenerate()) { toast.error('Vous avez utilisé vos 3 générations gratuites. Passez à Pro pour un accès illimité !'); router.push('/pricing'); return }

    setLoading(true)
    const appId = generateId()
    dbSaveApplication({
      id: appId, userId: '', jobTitle, companyName, jobDescription, jobUrl, country, jobType,
      cvText, selectedOutputs, tone, outputLanguage, status: 'generating',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    router.push(`/generating?id=${appId}`)
  }

  const stepsData = [
    { id: 1, title: 'Description du poste', icon: 'content_paste' },
    { id: 2, title: 'Votre CV', icon: 'person' },
    { id: 3, title: 'Choisir les sorties', icon: 'tune' },
  ]

  const toneLabels: Record<string, string> = {
    Professional: 'Professionnel', Creative: 'Créatif', Academic: 'Académique', Casual: 'Décontracté',
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <nav className="flex gap-2 text-xs text-slate-400 mb-2 font-medium"><span>Tableau de bord</span><span>/</span><span className="text-primary font-semibold">Nouvelle candidature</span></nav>
          <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Nouvelle candidature</h1>
          <p className="text-base text-slate-500 mt-2">Suivez les étapes pour générer votre dossier de candidature IA.</p>
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

        {/* Étape 1 */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 space-y-6">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">content_paste</span>Description du poste</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Intitulé du poste *</label><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="ex. Designer Produit Senior" required /></div>
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Nom de l&apos;entreprise</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="ex. Google" /></div>
              </div>
              <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">URL de l&apos;offre</label><input value={jobUrl} onChange={e => setJobUrl(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="https://..." /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Pays</label><input value={country} onChange={e => setCountry(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm" placeholder="ex. France" /></div>
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Type de poste</label>
                  <select value={jobType} onChange={e => setJobType(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm"><option value="">Sélectionner</option><option value="Full-time">Temps plein</option><option value="Part-time">Temps partiel</option><option value="Internship">Stage</option><option value="Contract">Contrat</option><option value="Freelance">Freelance</option></select>
                </div>
              </div>
              <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Description complète du poste *</label><textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm min-h-[200px] resize-y" placeholder="Collez la description complète du poste ici..." required /></div>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-6 rounded-2xl border border-white/50">
                <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-tertiary-container">tips_and_updates</span><h3 className="text-sm font-bold text-primary-container">Conseil intelligent</h3></div>
                <p className="text-xs text-slate-600 leading-relaxed">Collez la <strong>description complète du poste</strong> incluant les exigences, responsabilités et &quot;nice to have&quot;. Plus il y a de détails, meilleure sera l&apos;adaptation IA.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>L&apos;IA extraira :</h3>
                <ul className="space-y-2 text-xs text-slate-600">
                  {['Exigences clés','Compétences requises','Culture d\'entreprise','Mots-clés ATS'].map(t => <li key={t} className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-sm">check</span>{t}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 space-y-6">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">person</span>Votre CV / Profil</h2>
              <div className="flex gap-3">
                <button onClick={() => setCvMethod('paste')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${cvMethod === 'paste' ? 'bg-primary-container text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><span className="material-symbols-outlined text-lg">content_paste</span>Coller le texte</button>
                <button onClick={() => setCvMethod('upload')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${cvMethod === 'upload' ? 'bg-primary-container text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><span className="material-symbols-outlined text-lg">upload_file</span>Importer un fichier</button>
              </div>
              {cvMethod === 'paste' ? (
                <div className="space-y-1.5"><label className="block text-sm font-semibold text-slate-700">Collez le contenu de votre CV</label><textarea value={cvText} onChange={e => setCvText(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 text-sm min-h-[300px] resize-y" placeholder="Collez votre CV complet, profil LinkedIn ou contenu de CV ici..." /></div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-primary-container hover:bg-primary-fixed/5 transition-all cursor-pointer relative overflow-hidden"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.pdf,.doc,.docx" />
                  <span className={`material-symbols-outlined text-5xl mb-4 block ${extracting ? 'text-primary-container animate-spin' : fileName ? 'text-primary-container' : 'text-slate-300'}`}>
                    {extracting ? 'progress_activity' : fileName ? 'task' : 'cloud_upload'}
                  </span>
                  <p className="text-sm font-semibold text-slate-600 mb-1">
                    {extracting ? 'Extraction en cours...' : fileName ? fileName : 'Glisser & déposer votre CV ici'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {extracting ? 'Cela peut prendre quelques secondes' : fileName && cvText ? `✓ ${cvText.length.toLocaleString()} caractères extraits` : 'ou cliquez pour parcourir (PDF, DOCX, TXT)'}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-secondary">shield</span><h3 className="text-sm font-bold text-primary">Confidentialité des données</h3></div>
                <p className="text-xs text-slate-600 leading-relaxed">Vos données CV sont <strong>chiffrées</strong> et jamais utilisées pour entraîner l&apos;IA. Vous pouvez les supprimer à tout moment dans les Paramètres.</p>
              </div>
              <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-6 rounded-2xl border border-white/50">
                <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-tertiary-container">lightbulb</span><h3 className="text-sm font-bold text-primary-container">Conseil Pro</h3></div>
                <p className="text-xs text-slate-600 leading-relaxed">Incluez votre <strong>historique complet</strong>, formation, compétences et projets. L&apos;IA utilise toutes ces données pour trouver les meilleures correspondances.</p>
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 space-y-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">tune</span>Choisir vos sorties</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {outputOptions.map(opt => {
                    const hasAccess = canAccessOutput(opt.plan, plan)
                    const isSelected = selectedOutputs.includes(opt.id) && hasAccess
                    const badge = opt.plan ? planBadge[opt.plan] : null
                    return (
                      <button
                        key={opt.id}
                        onClick={() => hasAccess ? toggleOutput(opt.id) : router.push('/pricing')}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 relative ${
                          !hasAccess
                            ? 'border-slate-100 bg-slate-50 opacity-70 cursor-pointer'
                            : isSelected
                              ? 'border-primary-container bg-primary-fixed/10 shadow-md'
                              : 'border-slate-200 bg-white hover:border-primary-fixed'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`material-symbols-outlined text-2xl mt-0.5 ${!hasAccess ? 'text-slate-300' : isSelected ? 'text-primary-container' : 'text-slate-400'}`}>{opt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-primary">{opt.title}</p>
                              {badge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${badge.classes}`}>{badge.label}</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                            {!hasAccess && (
                              <p className="text-[10px] text-primary-container font-semibold mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">lock</span>
                                Nécessite le plan {badge?.label}
                              </p>
                            )}
                          </div>
                          {hasAccess ? (
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-primary-container border-primary-container' : 'border-slate-300'}`}>
                              {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                            </div>
                          ) : (
                            <span className="material-symbols-outlined text-slate-300 text-xl shrink-0">lock</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 space-y-4">
                <h3 className="text-lg font-bold text-primary">Préférences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Ton</label>
                    <select value={tone} onChange={e => setTone(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm">
                      <option value="Professional">Professionnel</option>
                      <option value="Creative">Créatif</option>
                      <option value="Academic">Académique</option>
                      <option value="Casual">Décontracté</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Langue de sortie</label>
                    <select value={outputLanguage} onChange={e => setOutputLanguage(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm">
                      <option value="French">Français</option>
                      <option value="English">Anglais</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {!isPaid && (
                <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-4 rounded-2xl border border-white/50">
                  <p className="text-xs font-bold text-primary-container flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-sm">workspace_premium</span>Débloquer les fonctionnalités Pro
                  </p>
                  <p className="text-[11px] text-slate-600 mb-3">Lettre de motivation + Score de correspondance inclus avec Pro.</p>
                  <Link href="/pricing" className="block w-full text-center text-xs font-bold bg-primary-container text-white py-2 rounded-lg hover:opacity-90 transition-all">
                    Passer à Pro
                  </Link>
                </div>
              )}
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 sticky top-20">
                <h3 className="text-sm font-bold text-primary mb-4">Résumé de la génération</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Poste</span><span className="font-semibold text-primary">{jobTitle || '—'}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Entreprise</span><span className="font-semibold text-primary">{companyName || '—'}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Sorties</span><span className="font-semibold text-primary">{selectedOutputs.length} sélectionnée{selectedOutputs.length > 1 ? 's' : ''}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Ton</span><span className="font-semibold text-primary">{toneLabels[tone] || tone}</span></div>
                  <hr className="border-slate-100" />
                  <div className="flex justify-between text-sm"><span className="text-slate-700 font-semibold">Coût</span><span className="text-primary-container font-bold">1 Crédit</span></div>
                </div>
                <button onClick={handleGenerate} disabled={loading || !jobTitle || !jobDescription} className="w-full py-3.5 bg-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-symbols-outlined text-lg">auto_awesome</span>Générer la candidature</>}
                </button>
                {!isPaid && (
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    {credits > 0 ? `${credits} génération${credits !== 1 ? 's' : ''} gratuite${credits !== 1 ? 's' : ''} restante${credits !== 1 ? 's' : ''}` : 'Plus de crédits — '}<Link href="/pricing" className="text-primary-container font-bold hover:underline">{credits > 0 ? '' : 'passez à Pro'}</Link>
                  </p>
                )}
                {isPaid && (
                  <p className="text-[10px] text-center text-secondary mt-2 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">workspace_premium</span>Générations illimitées actives
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          {step > 1 ? <button onClick={() => setStep(p => p - 1)} className="flex items-center gap-2 text-slate-500 font-semibold text-sm hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">arrow_back</span>Retour</button> : <div />}
          {step < 3 && <button onClick={() => setStep(p => p + 1)} className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">Continuer <span className="material-symbols-outlined text-lg">arrow_forward</span></button>}
        </div>
      </div>
    </AppLayout>
  )
}

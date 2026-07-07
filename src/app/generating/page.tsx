'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { getUserProfile } from '@/lib/storage'
import { dbGetApplication, dbUpdateApplication, dbSaveGenerationResult, dbDeductCredit, dbAddTrackerEntry } from '@/lib/db'
import toast from 'react-hot-toast'

const timelineSteps = [
  { title: 'Analyse du profil', desc: 'Extraction des mots-clés et compétences clés.' },
  { title: 'Génération du CV', desc: 'Création d\'un format optimisé pour les ATS.' },
  { title: 'Génération de la lettre', desc: 'Rédaction d\'une lettre de motivation percutante.' },
  { title: 'Préparation des recommandations', desc: 'Analyse des écarts de compétences et préparation.' },
  { title: 'Finalisation', desc: 'Mise en forme de votre dossier complet.' },
]

const errorConfig: Record<string, { icon: string; title: string; action: string; actionHref?: string }> = {
  CREDITS_EXHAUSTED: { icon: 'account_balance_wallet', title: 'Crédits API épuisés', action: 'Ajoutez des crédits sur console.anthropic.com', actionHref: 'https://console.anthropic.com/' },
  AUTH_ERROR: { icon: 'key_off', title: 'Clé API invalide', action: 'Vérifiez votre ANTHROPIC_API_KEY dans .env.local' },
  UNAUTHORIZED: { icon: 'lock', title: 'Session expirée', action: 'Veuillez vous reconnecter', actionHref: '/auth' },
  RATE_LIMITED: { icon: 'speed', title: 'Limite de débit atteinte', action: 'Patientez un moment et réessayez' },
  MODEL_ERROR: { icon: 'model_training', title: 'Modèle IA indisponible', action: 'Le modèle est peut-être temporairement indisponible' },
  OVERLOADED: { icon: 'cloud_off', title: 'Service IA surchargé', action: 'Réessayez dans quelques minutes' },
  CONFIG_ERROR: { icon: 'settings_alert', title: 'Configuration manquante', action: 'Configurez votre clé API dans .env.local' },
  PARSE_ERROR: { icon: 'code_off', title: 'Erreur de traitement', action: 'Réessayez la génération' },
  INPUT_TOO_LARGE: { icon: 'text_fields', title: 'Texte trop volumineux', action: 'Raccourcissez la description du poste ou le CV (max 20 000 caractères chacun)' },
  UNKNOWN_ERROR: { icon: 'error', title: 'Une erreur est survenue', action: 'Veuillez réessayer' },
}

function GeneratingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appId = searchParams.get('id') || ''
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [status, setStatus] = useState<'loading'|'calling'|'done'|'error'>('loading')
  const [appTitle, setAppTitle] = useState('Votre candidature')
  const [appCompany, setAppCompany] = useState('')
  const [errorInfo, setErrorInfo] = useState<{ message: string; code: string } | null>(null)
  const calledRef = useRef(false)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    if (stepTimerRef.current) clearInterval(stepTimerRef.current)
  }

  const startGeneration = async () => {
    const app = await dbGetApplication(appId)
    if (!app) { toast.error('Candidature introuvable'); router.push('/new-application'); return }
    setAppTitle(app.jobTitle)
    setAppCompany(app.companyName)

    setStatus('calling')
    setErrorInfo(null)
    setProgress(0)
    setActiveStep(0)

    let prog = 0
    progressTimerRef.current = setInterval(() => {
      prog += 0.5
      if (prog > 90) prog = 90
      setProgress(Math.min(prog, 100))
    }, 100)

    stepTimerRef.current = setInterval(() => {
      setActiveStep(prev => prev < 3 ? prev + 1 : prev)
    }, 3000)

    const profile = getUserProfile()

    fetch('/api/generate-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        jobDescription: app.jobDescription,
        cvText: app.cvText,
        selectedOutputs: app.selectedOutputs,
        tone: app.tone,
        outputLanguage: app.outputLanguage,
        plan: profile.plan || 'free',
      }),
    })
      .then(async res => {
        // Auth/validation errors return plain JSON; success returns SSE stream
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: `HTTP ${res.status}`, code: 'UNKNOWN_ERROR' }))
          const err = new Error(data.error || 'Generation failed')
          ;(err as Error & { code?: string }).code = data.code || 'UNKNOWN_ERROR'
          throw err
        }
        // Read SSE stream — wait for the `data:` line with the result
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let data: Record<string, unknown> | null = null
        outer: while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try { data = JSON.parse(line.slice(6)); break outer } catch { /* partial, keep reading */ }
          }
        }
        if (!data) throw Object.assign(new Error('Stream ended without result'), { code: 'UNKNOWN_ERROR' })
        if (!data.success) {
          const errMsg = typeof data.error === 'string' ? data.error : 'Génération échouée'
          const errCode = typeof data.code === 'string' ? data.code : 'UNKNOWN_ERROR'
          const error = new Error(errMsg)
          ;(error as Error & { code?: string }).code = errCode
          throw error
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = data.data as any

        await dbSaveGenerationResult({
          applicationId: appId,
          data: result,
          tokensUsed: typeof data.tokens_used === 'number' ? data.tokens_used : 0,
          generatedAt: new Date().toISOString(),
        })

        await dbUpdateApplication(appId, {
          status: 'generated',
          matchScore: result.match_score,
          strongFitAreas: result.strong_fit_areas,
          missingSkills: result.missing_skills,
          atsKeywords: result.ats_keywords,
          aiSummary: result.ai_summary,
          recommendedAction: result.recommended_action,
        })

        await dbDeductCredit()

        try {
          await dbAddTrackerEntry({
            applicationId: appId,
            jobTitle: app.jobTitle,
            companyName: app.companyName || '',
            matchScore: result.match_score,
            status: 'ready',
            docsReady: true,
          })
        } catch {
          // Non-bloquant si le tracker échoue
        }

        setStatus('done')
        setProgress(100)
        setActiveStep(4)
        clearTimers()

        if (data.warning) {
          toast(String(data.warning), { icon: '⚠️', duration: 5000 })
        } else {
          toast.success('Dossier de candidature généré !')
        }
        setTimeout(() => router.push(`/applications/${appId}`), 1200)
      })
      .catch(err => {
        console.error('Erreur de génération :', err)
        setStatus('error')
        setErrorInfo({
          message: err.message || 'Génération IA échouée. Veuillez réessayer.',
          code: (err as Error & { code?: string }).code || 'UNKNOWN_ERROR',
        })
        dbUpdateApplication(appId, { status: 'error' })
        clearTimers()
      })
  }

  useEffect(() => {
    if (!appId) { router.push('/new-application'); return }
    if (calledRef.current) return
    calledRef.current = true
    startGeneration()
    return () => clearTimers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId])

  const handleRetry = () => {
    calledRef.current = false
    startGeneration()
  }

  const errCfg = errorInfo ? (errorConfig[errorInfo.code] || errorConfig.UNKNOWN_ERROR) : null

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-surface to-surface-container-low">
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md z-50 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span className="text-xl font-bold text-primary tracking-tight">Postulis</span>
        </div>
        <span className="text-sm font-semibold text-on-surface-variant">
          {status === 'error' ? 'Erreur survenue' : status === 'done' ? 'Terminé !' : 'Génération en cours...'}
        </span>
      </header>

      <div className="fixed top-0 left-0 w-full h-1 bg-surface-container overflow-hidden z-[60]">
        <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <main className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-center gap-16">
        <section className="flex flex-col items-center justify-center text-center space-y-8 flex-1">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-surface-container-highest rounded-full"></div>
            <div className={`absolute inset-0 border-4 ${status === 'error' ? 'border-error' : 'border-primary'} rounded-full border-t-transparent ${status === 'error' || status === 'done' ? '' : 'animate-spin'}`} style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 rounded-full bg-white shadow-xl flex items-center justify-center animate-subtle-pulse">
              <div className="flex flex-col items-center">
                <span className={`material-symbols-outlined text-5xl ${status === 'error' ? 'text-error' : status === 'done' ? 'text-secondary' : 'text-primary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {status === 'error' ? 'error' : status === 'done' ? 'check_circle' : 'auto_awesome'}
                </span>
                {status !== 'error' && (
                  <span className="text-[36px] font-bold text-primary mt-2">{Math.round(progress)}%</span>
                )}
              </div>
            </div>
          </div>

          {status === 'error' && errCfg && (
            <div className="space-y-5 max-w-md">
              <div className="space-y-2">
                <h2 className="text-[28px] font-semibold text-error tracking-tight">{errCfg.title}</h2>
                <p className="text-base text-on-surface-variant">{errorInfo?.message}</p>
              </div>
              <div className="bg-error-container/20 border border-error/20 rounded-xl p-4 text-sm text-on-surface-variant flex items-start gap-3">
                <span className="material-symbols-outlined text-error shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{errCfg.icon}</span>
                <p><strong className="text-error">{errCfg.action}</strong></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                {errCfg.actionHref && (
                  <a href={errCfg.actionHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">
                    <span className="material-symbols-outlined text-lg">open_in_new</span>Corriger le problème
                  </a>
                )}
                <button onClick={handleRetry} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">
                  <span className="material-symbols-outlined text-lg">refresh</span>Réessayer
                </button>
                <button onClick={() => router.push('/new-application')} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant bg-white text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container transition-all">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>Retour
                </button>
              </div>
            </div>
          )}

          {status !== 'error' && (
            <div className="space-y-3">
              <h2 className="text-[28px] font-semibold text-primary tracking-tight">
                {timelineSteps[activeStep]?.title || 'Génération en cours...'}
              </h2>
              <p className="text-lg text-on-surface-variant max-w-md">
                {appTitle}{appCompany ? ` chez ${appCompany}` : ''} — {timelineSteps[activeStep]?.desc}
              </p>
            </div>
          )}
        </section>

        <aside className="w-full lg:w-96 flex flex-col gap-6">
          <div className="glass-card rounded-xl p-8 border border-outline-variant shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <h3 className="text-xl font-bold text-on-surface">Chronologie du processus</h3>
              <span className="text-secondary text-sm font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-sm">speed</span>Haute priorité</span>
            </div>
            <div className="space-y-6">
              {timelineSteps.map((s, idx) => {
                const isCompleted = idx < activeStep
                const isActive = idx === activeStep
                const isPending = idx > activeStep
                const isFailed = status === 'error' && isActive
                return (
                  <div key={idx} className={`flex items-start gap-4 ${isPending ? 'opacity-50' : ''}`}>
                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isFailed ? 'bg-error ring-4 ring-error/20' : isCompleted ? 'bg-secondary' : isActive ? 'bg-primary ring-4 ring-primary-fixed/30' : 'border-2 border-outline'}`}>
                      {isFailed ? <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'wght' 700" }}>close</span> : isCompleted ? <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'wght' 700" }}>check</span> : isActive ? <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> : null}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isFailed ? 'text-error' : isActive ? 'text-primary' : 'text-on-surface'}`}>{s.title}</p>
                      <p className="text-xs text-on-surface-variant">{s.desc}</p>
                      {isActive && !isFailed && <div className="mt-3 w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden"><div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (progress - activeStep * 20) * 5)}%` }}></div></div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="bg-tertiary-container/30 border border-tertiary-fixed rounded-xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0"><span className="material-symbols-outlined text-on-tertiary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span></div>
            <div><p className="text-sm font-semibold text-on-tertiary-fixed-variant">IA Active</p><p className="text-xs text-on-tertiary-fixed-variant/80">Utilisation de Claude AI pour le raisonnement complexe et l&apos;alignement sémantique.</p></div>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default function GeneratingPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>}>
      <GeneratingContent />
    </Suspense>
  )
}

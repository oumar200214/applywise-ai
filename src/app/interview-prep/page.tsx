'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { dbGetApplications, dbGetGenerationResult } from '@/lib/db'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

type QuestionItem = {
  q: string
  cat: string
  company: string
  appId: string
  role: string
  isStatic?: boolean
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const catLabels: Record<string, string> = {
  'Behavioral': 'Comportemental',
  'Technical': 'Technique',
  'General': 'Général',
  'Company Specific': 'Cas pratiques',
}

const catColors: Record<string, string> = {
  'Behavioral': 'bg-blue-50 text-blue-700',
  'Technical': 'bg-purple-50 text-purple-700',
  'General': 'bg-slate-100 text-slate-600',
  'Company Specific': 'bg-amber-50 text-amber-700',
}

const catIcons: Record<string, string> = {
  'Behavioral': 'psychology',
  'Technical': 'code',
  'General': 'help',
  'Company Specific': 'business_center',
}

// 20 curated questions — bibliothèque exclusive Pro
const STATIC_QUESTIONS: QuestionItem[] = [
  { q: "Parlez-moi d'une situation où vous avez dû gérer un conflit dans votre équipe. Comment avez-vous résolu la situation ?", cat: 'Behavioral', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Décrivez une fois où vous avez dû prendre une décision difficile sous pression et avec peu d'informations.", cat: 'Behavioral', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Donnez un exemple d'une période où vous avez dû vous adapter rapidement à un changement majeur inattendu.", cat: 'Behavioral', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Racontez-moi une situation où vous avez échoué. Qu'avez-vous appris et qu'auriez-vous fait différemment ?", cat: 'Behavioral', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Décrivez un projet dont vous êtes particulièrement fier. Quel a été votre rôle exact et quel a été l'impact mesurable ?", cat: 'Behavioral', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Parlez-moi d'une situation où vous avez dû convaincre un supérieur ou des parties prenantes sceptiques. Comment l'avez-vous abordé ?", cat: 'Behavioral', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Décrivez une fois où vous avez dû gérer plusieurs projets simultanément avec des délais serrés. Comment avez-vous priorisé ?", cat: 'Behavioral', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Donnez un exemple où vous avez fait preuve d'initiative sans que ce soit demandé. Quel a été le résultat concret ?", cat: 'Behavioral', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Expliquez un concept technique complexe de votre domaine comme si vous parliez à quelqu'un sans aucune expérience technique.", cat: 'Technical', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Comment abordez-vous la résolution d'un problème technique que vous n'avez jamais rencontré auparavant ? Décrivez votre démarche.", cat: 'Technical', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Décrivez votre processus pour assurer la qualité de votre travail et minimiser les erreurs dans un environnement sous pression.", cat: 'Technical', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Comment vous tenez-vous à jour avec les nouvelles tendances et technologies dans votre domaine ? Donnez des exemples concrets.", cat: 'Technical', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Pourquoi souhaitez-vous rejoindre cette entreprise ? Qu'est-ce qui vous attire spécifiquement dans ce poste par rapport à d'autres opportunités ?", cat: 'General', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Où vous voyez-vous dans 5 ans ? Comment ce poste s'inscrit-il dans votre trajectoire professionnelle à long terme ?", cat: 'General', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Quelles sont vos 3 principales forces ? Illustrez chacune avec un exemple concret de votre parcours.", cat: 'General', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Quel est votre plus grand axe d'amélioration et qu'est-ce que vous faites concrètement aujourd'hui pour y remédier ?", cat: 'General', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Qu'est-ce qui vous distingue des autres candidats pour ce poste ? Pourquoi devrions-nous vous choisir vous ?", cat: 'General', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Cas pratique : Vous êtes chef de projet et votre équipe est en retard d'une semaine sur un livrable critique. Le client relance. Que faites-vous concrètement dans les 24 heures ?", cat: 'Company Specific', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Cas pratique : Un collègue clé quitte l'entreprise en plein milieu d'un projet critique dont vous êtes responsable. Comment gérez-vous la situation pour minimiser l'impact sur les délais ?", cat: 'Company Specific', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
  { q: "Cas pratique : Vous recevez des retours contradictoires de deux parties prenantes importantes sur la direction à prendre. L'une veut accélérer, l'autre veut revoir le scope. Comment arbitrez-vous ?", cat: 'Company Specific', company: 'Bibliothèque Pro', appId: '', role: 'Général', isStatic: true },
]

const FREE_QUESTION_LIMIT = 4

// ─── MockInterviewModal ───────────────────────────────────────────────────────

function MockInterviewModal({
  questions,
  onClose,
  isPro,
}: {
  questions: QuestionItem[]
  onClose: () => void
  isPro: boolean
}) {
  const [qIndex, setQIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [started, setStarted] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const transcriptRef = useRef('')

  const currentQ = questions[qIndex]

  useEffect(() => {
    setSpeechSupported(!!(typeof window !== 'undefined' && ((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition)))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  useEffect(() => {
    return () => { recognitionRef.current?.abort() }
  }, [])

  const startSession = () => {
    setMessages([{
      role: 'assistant',
      content: `Bienvenue ! Je suis votre coach IA pour cet entretien.\n\n**Question :** « ${currentQ.q} »\n\nPrenez le temps de réfléchir. Vous pouvez ${speechSupported ? '**parler à voix haute** 🎙️ ou ' : ''}**taper votre réponse** ci-dessous. Je vous ferai un retour précis basé sur la méthode STAR.`,
    }])
    setStarted(true)
  }

  const toggleRecording = useCallback(() => {
    if (recording) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRec = typeof window !== 'undefined'
      && ((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition)
    if (!SpeechRec) {
      toast.error('Enregistrement vocal non supporté. Utilisez Chrome ou Edge.')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: SpeechRecognition = new (SpeechRec as any)()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    transcriptRef.current = ''

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interimText = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript
        } else {
          interimText += event.results[i][0].transcript
        }
      }
      setAnswer((finalText + interimText).trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setRecording(false)
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error('Erreur microphone. Vérifiez les permissions dans votre navigateur.')
      }
    }

    recognition.onend = () => setRecording(false)

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
    toast('Parlez maintenant...', { icon: '🎙️', duration: 2000 })
  }, [recording])

  const sendAnswer = async () => {
    if (!answer.trim() || streaming) return
    if (recording) { recognitionRef.current?.stop(); setRecording(false) }

    const userMsg: ChatMessage = { role: 'user', content: answer.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setAnswer('')
    transcriptRef.current = ''
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          question: currentQ.q,
          role: currentQ.role,
          company: currentQ.company,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.code === 'PLAN_REQUIRED') {
          toast.error('Simulation d\'entretien réservée au plan Pro.')
        } else {
          throw new Error('Erreur API')
        }
        setMessages(prev => prev.slice(0, -1))
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: full }
          return updated
        })
      }
    } catch {
      toast.error('Coach IA indisponible. Veuillez réessayer.')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setStreaming(false)
    }
  }

  const goToQuestion = (idx: number) => {
    recognitionRef.current?.stop()
    setRecording(false)
    setQIndex(idx)
    setMessages([])
    setAnswer('')
    transcriptRef.current = ''
    setStarted(false)
  }

  // Paywall for non-Pro
  if (!isPro) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-primary-fixed/30 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl text-primary-container">workspace_premium</span>
          </div>
          <h3 className="text-xl font-bold text-primary">Fonctionnalité Pro</h3>
          <p className="text-sm text-slate-600">L&apos;entretien simulé IA avec coaching vocal est disponible sur le plan <strong>Pro</strong>. Répondez à voix haute et recevez un retour structuré instantané.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50">Annuler</button>
            <Link href="/pricing" className="flex-1 py-2.5 bg-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 text-center">Passer à Pro →</Link>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <span className="material-symbols-outlined text-5xl text-slate-200 block">info</span>
          <p className="text-sm text-slate-500">Aucune question disponible.</p>
          <button onClick={onClose} className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-semibold">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-fixed rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container text-xl">record_voice_over</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{currentQ.company} · {catLabels[currentQ.cat] || currentQ.cat}</p>
              <p className="text-sm font-bold text-primary truncate max-w-[280px]">{currentQ.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {questions.slice(0, 6).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToQuestion(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === qIndex ? 'bg-primary-container w-4' : 'bg-slate-200 hover:bg-slate-300'}`}
                />
              ))}
              {questions.length > 6 && <span className="text-[10px] text-slate-400 ml-1">+{questions.length - 6}</span>}
            </div>
            <span className="text-xs text-slate-400">{qIndex + 1}/{questions.length}</span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-1"><span className="material-symbols-outlined">close</span></button>
          </div>
        </div>

        {/* Question */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#f3e8ff] to-[#e0e7ff] border-b border-slate-100">
          <p className="text-sm font-semibold text-primary-container leading-relaxed">&ldquo;{currentQ.q}&rdquo;</p>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {!started ? (
            <div className="flex flex-col items-center justify-center h-44 text-center gap-5">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {speechSupported && (
                  <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-100">
                    <span className="material-symbols-outlined text-sm">mic</span>Réponse vocale disponible
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-primary-fixed/30 text-primary-container px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary-fixed/50">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>Coach IA · Méthode STAR
                </span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Répondez en tapant ou utilisez le microphone 🎙️. Votre coach IA analysera votre réponse et vous donnera un retour précis.
              </p>
              <button onClick={startSession} className="bg-primary-container text-white px-8 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/10">
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Lancer la session
              </button>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary-container text-sm">smart_toy</span>
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-container text-white rounded-tr-sm'
                      : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.content || (streaming && i === messages.length - 1 ? (
                      <span className="inline-flex gap-1 items-center py-0.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                      </span>
                    ) : '…')}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-white text-sm">person</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {started && (
          <div className="px-6 py-4 border-t border-slate-100 space-y-3">
            <div className="relative">
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendAnswer() }}
                placeholder={recording
                  ? '🎙️ Transcription en cours... parlez clairement'
                  : speechSupported
                    ? 'Tapez votre réponse ou cliquez sur 🎙️ Vocal pour parler... (Ctrl+Entrée pour envoyer)'
                    : 'Tapez votre réponse ici... (Ctrl+Entrée pour envoyer)'}
                rows={3}
                disabled={streaming}
                className={`w-full px-4 py-3 pr-20 border rounded-xl text-sm resize-none focus:ring-2 focus:outline-none disabled:opacity-50 transition-colors ${
                  recording
                    ? 'border-red-300 bg-red-50/30 focus:ring-red-200'
                    : 'border-slate-200 focus:ring-primary/20'
                }`}
              />
              {recording && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-red-500 font-bold tracking-widest">REC</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center gap-2">
              <button
                onClick={() => goToQuestion(Math.min(qIndex + 1, questions.length - 1))}
                disabled={qIndex >= questions.length - 1}
                className="text-xs text-slate-500 hover:text-primary disabled:opacity-30 flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-sm">skip_next</span>Suivante
              </button>
              <div className="flex items-center gap-2">
                {speechSupported && (
                  <button
                    onClick={toggleRecording}
                    disabled={streaming}
                    title={recording ? 'Arrêter l\'enregistrement' : 'Répondre à voix haute (fr-FR)'}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 border ${
                      recording
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{recording ? 'mic_off' : 'mic'}</span>
                    {recording ? 'Arrêter' : 'Vocal'}
                  </button>
                )}
                <button
                  onClick={sendAnswer}
                  disabled={!answer.trim() || streaming}
                  className="flex items-center gap-2 bg-primary-container text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  {streaming ? 'Analyse...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BrowseBankModal ──────────────────────────────────────────────────────────

function BrowseBankModal({
  questions,
  onClose,
  onPractice,
  isPro,
}: {
  questions: QuestionItem[]
  onClose: () => void
  onPractice: (q: QuestionItem) => void
  isPro: boolean
}) {
  const [filter, setFilter] = useState('Tout')
  const categories = ['Tout', ...Array.from(new Set(questions.map(q => q.cat)))]
  const filtered = filter === 'Tout' ? questions : questions.filter(q => q.cat === filter)
  const staticCount = questions.filter(q => q.isStatic).length
  const appCount = questions.filter(q => !q.isStatic).length

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-primary">Banque de questions</h3>
            <p className="text-xs text-slate-400">
              {questions.length} questions
              {isPro && staticCount > 0 && ` · ${staticCount} bibliothèque Pro · ${appCount} personnalisées`}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === cat ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {catLabels[cat] || cat} {filter !== cat && <span className="opacity-50">({(cat === 'Tout' ? questions : questions.filter(q => q.cat === cat)).length})</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-3 block">search_off</span>
              <p className="text-sm text-slate-500">Aucune question dans cette catégorie.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4 group hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary leading-relaxed">{item.q}</p>
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${catColors[item.cat] || 'bg-slate-100 text-slate-600'}`}>{catLabels[item.cat] || item.cat}</span>
                      {item.isStatic ? (
                        <span className="text-[10px] font-bold text-primary-container bg-primary-fixed/30 px-2 py-0.5 rounded-md">Bibliothèque Pro</span>
                      ) : (
                        <><span className="text-xs text-slate-500">{item.company}</span><span className="text-xs text-slate-300 mx-0.5">·</span><span className="text-xs text-slate-400">{item.role}</span></>
                      )}
                    </div>
                  </div>
                  {isPro && (
                    <button
                      onClick={() => onPractice(item)}
                      className="shrink-0 text-xs text-primary-container font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">play_circle</span>Pratiquer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function InterviewPrepPage() {
  const { plan } = useAuth()
  const [appQuestions, setAppQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showMockInterview, setShowMockInterview] = useState(false)
  const [showBrowseBank, setShowBrowseBank] = useState(false)
  const [mockStartQuestion, setMockStartQuestion] = useState<QuestionItem | null>(null)

  const isPro = plan === 'pro' || plan === 'premium'

  useEffect(() => {
    async function load() {
      const apps = await dbGetApplications()
      const allQ: QuestionItem[] = []
      await Promise.all(apps.map(async app => {
        const result = await dbGetGenerationResult(app.id)
        if (result?.data?.interview_pack) {
          const pack = result.data.interview_pack
          const add = (qs: string[], cat: string) => {
            if (Array.isArray(qs)) qs.forEach(q => allQ.push({ q, cat, company: app.companyName || 'Inconnu', appId: app.id, role: app.jobTitle, isStatic: false }))
          }
          add(pack.general_questions, 'General')
          add(pack.behavioral_questions, 'Behavioral')
          add(pack.technical_questions, 'Technical')
          add(pack.company_questions, 'Company Specific')
        }
      }))
      setAppQuestions(allQ)
      setLoading(false)
    }
    load()
  }, [])

  const displayedQuestions = isPro
    ? [...appQuestions, ...STATIC_QUESTIONS]
    : appQuestions.slice(0, FREE_QUESTION_LIMIT)

  const openMockInterview = (startQ?: QuestionItem) => {
    if (startQ) setMockStartQuestion(startQ)
    setShowBrowseBank(false)
    setShowMockInterview(true)
  }

  const mockQuestions = mockStartQuestion
    ? [mockStartQuestion, ...displayedQuestions.filter(q => q !== mockStartQuestion)]
    : displayedQuestions

  const catStats = {
    Behavioral: displayedQuestions.filter(q => q.cat === 'Behavioral').length,
    Technical: displayedQuestions.filter(q => q.cat === 'Technical').length,
    General: displayedQuestions.filter(q => q.cat === 'General').length,
    'Company Specific': displayedQuestions.filter(q => q.cat === 'Company Specific').length,
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Préparation aux entretiens</h1>
            <p className="text-base text-slate-500 mt-2">Entraînez-vous avec vos questions personnalisées et la bibliothèque Pro.</p>
          </div>
          {!isPro && (
            <Link href="/pricing" className="flex items-center gap-2 bg-primary-fixed/30 border border-primary-fixed/50 rounded-xl px-4 py-2.5 hover:bg-primary-fixed/50 transition-colors">
              <span className="material-symbols-outlined text-primary-container text-lg">workspace_premium</span>
              <span className="text-xs text-primary-container font-bold">Pro : 20+ questions & coaching vocal →</span>
            </Link>
          )}
        </div>

        {/* Statistiques */}
        {!loading && displayedQuestions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(catStats).map(([cat, count]) => (
              <div key={cat} className="bg-white p-4 rounded-xl shadow-stitch border border-slate-100 text-center">
                <span className="material-symbols-outlined text-slate-300 text-xl block mb-1">{catIcons[cat] || 'help'}</span>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">{catLabels[cat] || cat}</p>
                <p className="text-2xl font-bold text-primary">{count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cards d'action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entretien simulé */}
          <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-4 shadow-sm relative z-10">
              <span className="material-symbols-outlined text-primary-container text-3xl">record_voice_over</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Entretien simulé</h3>
            <p className="text-sm text-on-surface-variant mb-3 max-w-[260px]">
              Coach IA · Méthode STAR · Répondez en tapant ou à voix haute
            </p>
            {isPro ? (
              <p className="text-xs text-green-600 font-semibold mb-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">mic</span>
                Coaching vocal activé
              </p>
            ) : (
              <p className="text-xs text-primary-container font-semibold mb-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                Fonctionnalité Pro — inclut la réponse vocale
              </p>
            )}
            <button
              onClick={() => openMockInterview()}
              className="bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              {isPro ? 'Lancer l\'entretien simulé' : 'Débloquer — Plan Pro'}
            </button>
          </div>

          {/* Banque de questions */}
          <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-secondary-container/20 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-3xl">quiz</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Banque de questions</h3>
            <p className="text-sm text-on-surface-variant mb-4 max-w-[260px]">
              {loading ? 'Chargement...' : isPro
                ? <><strong>{displayedQuestions.length}</strong> questions — {appQuestions.length} personnalisées + {STATIC_QUESTIONS.length} bibliothèque Pro</>
                : displayedQuestions.length > 0
                  ? <><strong>{displayedQuestions.length}</strong> question{displayedQuestions.length > 1 ? 's' : ''} disponible{displayedQuestions.length > 1 ? 's' : ''} · Plan Pro = 20+ questions</>
                  : <>Aucune question — générez une candidature ou passez à Pro pour la bibliothèque</>}
            </p>
            <button
              onClick={() => setShowBrowseBank(true)}
              disabled={displayedQuestions.length === 0}
              className="border border-primary text-primary px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">library_books</span>
              Parcourir la banque
            </button>
          </div>
        </div>

        {/* Liste des questions */}
        <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">history</span>
              {isPro ? 'Questions disponibles' : `Vos questions (${displayedQuestions.length} sur ${FREE_QUESTION_LIMIT} max)`}
            </h2>
            {isPro && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <span className="material-symbols-outlined text-sm">mic</span>
                Réponse vocale disponible
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>
          ) : displayedQuestions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">quiz</span>
              <p className="text-sm text-slate-500">Aucune question disponible.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Créez une candidature avec &quot;Prép. entretien&quot; activé, ou{' '}
                <Link href="/pricing" className="text-primary-container font-bold hover:underline">passez à Pro</Link>{' '}
                pour accéder à la bibliothèque de {STATIC_QUESTIONS.length} questions.
              </p>
              <Link href="/new-application" className="mt-4 inline-block bg-primary-container text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                Créer une candidature
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedQuestions.slice(0, isPro ? 8 : FREE_QUESTION_LIMIT).map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow group">
                  <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary-container text-lg">{catIcons[item.cat] || 'help'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary leading-relaxed">{item.q}</p>
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${catColors[item.cat] || 'bg-slate-100 text-slate-600'}`}>{catLabels[item.cat] || item.cat}</span>
                      {item.isStatic ? (
                        <span className="text-[10px] font-bold text-primary-container bg-primary-fixed/30 px-2 py-0.5 rounded-md">Bibliothèque Pro</span>
                      ) : (
                        <><span className="text-xs text-slate-500 font-medium">{item.company}</span><span className="text-xs text-slate-300 mx-0.5">·</span><span className="text-xs text-slate-400">{item.role}</span></>
                      )}
                    </div>
                  </div>
                  {isPro && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openMockInterview(item)}
                        className="text-primary-container text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">play_circle</span>Pratiquer
                      </button>
                      {!item.isStatic && (
                        <Link href={`/applications/${item.appId}`} className="text-slate-400 text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>Voir
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Upgrade banner pour les gratuits */}
              {!isPro && (
                <div className="p-5 bg-gradient-to-r from-[#f3e8ff] to-[#e0e7ff] rounded-xl border border-primary-fixed/30 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-primary-container">20+ questions & coaching vocal à voix haute</p>
                    <p className="text-xs text-slate-600 mt-0.5">Répondez en parlant · Feedback IA instantané · Méthode STAR</p>
                  </div>
                  <Link href="/pricing" className="shrink-0 bg-primary-container text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all whitespace-nowrap">
                    Passer à Pro
                  </Link>
                </div>
              )}

              {isPro && displayedQuestions.length > 8 && (
                <button onClick={() => setShowBrowseBank(true)} className="w-full text-center py-3 text-sm text-primary-container font-bold hover:underline">
                  Voir toutes les {displayedQuestions.length} questions →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showMockInterview && (
        <MockInterviewModal
          questions={mockQuestions}
          isPro={isPro}
          onClose={() => { setShowMockInterview(false); setMockStartQuestion(null) }}
        />
      )}

      {showBrowseBank && (
        <BrowseBankModal
          questions={displayedQuestions}
          onClose={() => setShowBrowseBank(false)}
          onPractice={q => openMockInterview(q)}
          isPro={isPro}
        />
      )}
    </AppLayout>
  )
}

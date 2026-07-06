'use client'
import { useState, useEffect, useRef } from 'react'
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
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const catLabels: Record<string, string> = {
  'Behavioral': 'Comportemental',
  'Technical': 'Technique',
  'General': 'Général',
  'Company Specific': 'Spécifique à l\'entreprise',
}

const catColors: Record<string, string> = {
  'Behavioral': 'bg-blue-50 text-blue-700',
  'Technical': 'bg-purple-50 text-purple-700',
  'General': 'bg-slate-100 text-slate-600',
  'Company Specific': 'bg-amber-50 text-amber-700',
}

function MockInterviewModal({
  questions,
  onClose,
  isPremium,
}: {
  questions: QuestionItem[]
  onClose: () => void
  isPremium: boolean
}) {
  const [qIndex, setQIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [started, setStarted] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const currentQ = questions[qIndex]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const startSession = () => {
    setMessages([{
      role: 'assistant',
      content: `Bienvenue ! Entraînons vos compétences pour l'entretien. Je vais vous coacher sur cette question :\n\n**« ${currentQ.q} »**\n\nPrenez votre temps et rédigez votre réponse ci-dessous. Je vous donnerai un retour précis en utilisant la méthode STAR si pertinente.`,
    }])
    setStarted(true)
  }

  const sendAnswer = async () => {
    if (!answer.trim() || streaming) return
    const userMsg: ChatMessage = { role: 'user', content: answer.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setAnswer('')
    setStreaming(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

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

      if (!res.ok) throw new Error('Erreur API')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
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

  const nextQuestion = () => {
    if (qIndex < questions.length - 1) {
      setQIndex(i => i + 1)
      setMessages([])
      setAnswer('')
      setStarted(false)
    }
  }

  if (!isPremium) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-tertiary-container/20 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl text-tertiary-container">lock</span>
          </div>
          <h3 className="text-xl font-bold text-primary">Fonctionnalité Premium</h3>
          <p className="text-sm text-slate-600">L&apos;entretien simulé IA est disponible sur le plan <strong>Premium</strong>. Passez à Premium pour vous entraîner avec un coaching IA en temps réel et des retours instantanés.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50">Annuler</button>
            <Link href="/pricing" className="flex-1 py-2.5 bg-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 text-center">Passer à Premium</Link>
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
          <p className="text-sm text-slate-500">Aucune question trouvée. Générez une candidature avec la préparation aux entretiens activée.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold">Fermer</button>
            <Link href="/new-application" className="flex-1 py-2.5 bg-primary-container text-white rounded-xl text-sm font-bold text-center">Nouvelle candidature</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-fixed rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container text-xl">record_voice_over</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{currentQ.company} · {catLabels[currentQ.cat] || currentQ.cat}</p>
              <p className="text-sm font-bold text-primary truncate max-w-[300px]">{currentQ.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{qIndex + 1}/{questions.length}</span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gradient-to-r from-[#f3e8ff] to-[#e0e7ff] border-b border-slate-100">
          <p className="text-sm font-semibold text-primary-container leading-relaxed">&ldquo;{currentQ.q}&rdquo;</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {!started ? (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-4">
              <p className="text-sm text-slate-500">Prêt à vous entraîner ? Votre coach IA vous donnera un retour détaillé sur vos réponses.</p>
              <button onClick={startSession} className="bg-primary-container text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                Lancer la session de pratique
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
                      <span className="inline-flex gap-1 items-center">
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

        {started && (
          <div className="px-6 py-4 border-t border-slate-100 space-y-3">
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendAnswer() }}
              placeholder="Tapez votre réponse ici... (Ctrl+Entrée pour envoyer)"
              rows={3}
              disabled={streaming}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50"
            />
            <div className="flex justify-between items-center">
              <button onClick={nextQuestion} disabled={qIndex >= questions.length - 1} className="text-xs text-slate-500 hover:text-primary disabled:opacity-30 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">skip_next</span>Question suivante
              </button>
              <button
                onClick={sendAnswer}
                disabled={!answer.trim() || streaming}
                className="flex items-center gap-2 bg-primary-container text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                {streaming ? 'En cours...' : 'Envoyer la réponse'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BrowseBankModal({
  questions,
  onClose,
  onPractice,
}: {
  questions: QuestionItem[]
  onClose: () => void
  onPractice: (q: QuestionItem) => void
}) {
  const [filter, setFilter] = useState('Tout')
  const categories = ['Tout', ...Array.from(new Set(questions.map(q => q.cat)))]
  const filtered = filter === 'Tout' ? questions : questions.filter(q => q.cat === filter)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-primary">Banque de questions</h3>
            <p className="text-xs text-slate-400">{questions.length} questions issues de vos candidatures</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === cat ? 'bg-primary-container text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {catLabels[cat] || cat}
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
                      <span className="text-xs text-slate-500">{item.company}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{item.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onPractice(item)}
                    className="shrink-0 text-xs text-primary-container font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">play_circle</span>Pratiquer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InterviewPrepPage() {
  const { plan } = useAuth()
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showMockInterview, setShowMockInterview] = useState(false)
  const [showBrowseBank, setShowBrowseBank] = useState(false)
  const [mockStartQuestion, setMockStartQuestion] = useState<QuestionItem | null>(null)

  useEffect(() => {
    async function load() {
      const apps = await dbGetApplications()
      const allQuestions: QuestionItem[] = []

      await Promise.all(apps.map(async app => {
        const result = await dbGetGenerationResult(app.id)
        if (result?.data?.interview_pack) {
          const pack = result.data.interview_pack
          const add = (qs: string[], cat: string) => {
            if (Array.isArray(qs)) qs.forEach(q => allQuestions.push({ q, cat, company: app.companyName || 'Inconnu', appId: app.id, role: app.jobTitle }))
          }
          add(pack.general_questions, 'General')
          add(pack.behavioral_questions, 'Behavioral')
          add(pack.technical_questions, 'Technical')
          add(pack.company_questions, 'Company Specific')
        }
      }))

      setQuestions(allQuestions)
      setLoading(false)
    }
    load()
  }, [])

  const isPremium = plan === 'premium'

  const openMockInterview = (startQ?: QuestionItem) => {
    if (startQ) setMockStartQuestion(startQ)
    setShowBrowseBank(false)
    setShowMockInterview(true)
  }

  const mockQuestions = mockStartQuestion
    ? [mockStartQuestion, ...questions.filter(q => q !== mockStartQuestion)]
    : questions

  const catStats = {
    Behavioral: questions.filter(q => q.cat === 'Behavioral').length,
    Technical: questions.filter(q => q.cat === 'Technical').length,
    General: questions.filter(q => q.cat === 'General').length,
    'Company Specific': questions.filter(q => q.cat === 'Company Specific').length,
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Préparation aux entretiens</h1>
          <p className="text-base text-slate-500 mt-2">Entraînez-vous avec des questions générées par IA adaptées à vos candidatures réelles.</p>
        </div>

        {!loading && questions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(catStats).map(([cat, count]) => (
              <div key={cat} className="bg-white p-4 rounded-xl shadow-stitch border border-slate-100 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{catLabels[cat] || cat}</p>
                <p className="text-2xl font-bold text-primary">{count}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 shadow-sm relative z-10">
              <span className="material-symbols-outlined text-primary-container text-3xl">record_voice_over</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Entretien simulé</h3>
            <p className="text-sm text-on-surface-variant mb-2">Entraînez-vous à répondre aux questions avec notre coach IA. Obtenez un retour instantané et structuré sur chaque réponse.</p>
            {!isPremium && <p className="text-xs text-amber-600 font-medium mb-4 flex items-center gap-1"><span className="material-symbols-outlined text-sm">workspace_premium</span>Fonctionnalité Premium</p>}
            <button
              onClick={() => openMockInterview()}
              className="bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              {isPremium ? 'Lancer l\'entretien simulé' : 'Débloquer l\'entretien simulé'}
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-secondary-container/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-3xl">quiz</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Banque de questions</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              {loading ? 'Chargement de vos questions...' : questions.length > 0
                ? <>Vous avez <strong>{questions.length}</strong> questions personnalisées générées à partir de vos candidatures.</>
                : 'Aucune question pour l\'instant. Créez une candidature avec la préparation aux entretiens activée.'}
            </p>
            <button
              onClick={() => setShowBrowseBank(true)}
              disabled={questions.length === 0 && !loading}
              className="border border-primary text-primary px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">library_books</span>
              Parcourir la banque
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">history</span>
            Questions récentes
          </h2>

          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">info</span>
              <p className="text-sm text-slate-500">Aucune question d&apos;entretien générée pour l&apos;instant.</p>
              <p className="text-xs text-slate-400 mt-1">Créez une candidature avec &quot;Prép. entretien&quot; sélectionné pour voir les questions ici.</p>
              <Link href="/new-application" className="mt-4 inline-block text-primary-container text-sm font-bold hover:underline">Créer une candidature</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.slice(0, 8).map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow group">
                  <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary-container text-lg">help</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{item.q}</p>
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase">{catLabels[item.cat] || item.cat}</span>
                      <span className="text-xs text-slate-500 font-medium">{item.company}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{item.role}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openMockInterview(item)}
                      className="text-primary-container text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_circle</span>Pratiquer
                    </button>
                    <Link href={`/applications/${item.appId}`} className="text-slate-400 text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>Voir
                    </Link>
                  </div>
                </div>
              ))}
              {questions.length > 8 && (
                <button onClick={() => setShowBrowseBank(true)} className="w-full text-center py-3 text-sm text-primary-container font-bold hover:underline">
                  Voir toutes les {questions.length} questions →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showMockInterview && (
        <MockInterviewModal
          questions={mockQuestions}
          isPremium={isPremium}
          onClose={() => { setShowMockInterview(false); setMockStartQuestion(null) }}
        />
      )}

      {showBrowseBank && (
        <BrowseBankModal
          questions={questions}
          onClose={() => setShowBrowseBank(false)}
          onPractice={q => openMockInterview(q)}
        />
      )}
    </AppLayout>
  )
}

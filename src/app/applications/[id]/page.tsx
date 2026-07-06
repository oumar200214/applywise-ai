'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { dbGetApplication, dbGetGenerationResult, dbAddTrackerEntry } from '@/lib/db'
import type { StoredApplication, StoredResult } from '@/lib/storage'
import { printToPDF } from '@/lib/documentGenerator'
import { useDocxGenerator } from '@/hooks/useDocxGenerator'
import toast from 'react-hot-toast'
import Link from 'next/link'

// ── CV parser helpers ────────────────────────────────────────────────────────

type ExperienceEntry = { company: string; title: string; dates: string; bullets: string[] }

function parseExperienceEntries(text: string): ExperienceEntry[] {
  if (!text?.trim()) return []
  const lines = text.split('\n')
  const entries: ExperienceEntry[] = []
  let current: ExperienceEntry | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const isBullet = /^[•\-\*]/.test(line)
    if (!isBullet) {
      const hasYear = /20\d\d|19\d\d|[Pp]résent|[Pp]resent|[Aa]ctuel|[Cc]urrent/.test(line)
      const hasSep = line.includes(' | ') || (line.includes(' - ') && !line.startsWith('-'))
      if (hasYear || hasSep) {
        if (current) entries.push(current)
        const clean = line.replace(/\*\*/g, '').replace(/\*/g, '')
        let company = '', title = '', dates = ''
        if (clean.includes(' | ')) {
          const parts = clean.split(' | ')
          company = (parts[0] || '').trim()
          title = (parts[1] || '').trim()
          dates = (parts[2] || '').trim()
        } else if (clean.includes(' - ')) {
          const parts = clean.split(' - ')
          company = (parts[0] || '').trim()
          title = (parts[1] || '').trim()
          dates = parts.slice(2).join(' - ').trim()
        } else {
          company = clean
        }
        current = { company, title, dates, bullets: [] }
      } else if (current) {
        if (!current.title && line.length < 80) current.title = line.replace(/\*\*/g, '')
        else current.bullets.push(line.replace(/\*\*/g, ''))
      } else {
        current = { company: line.replace(/\*\*/g, ''), title: '', dates: '', bullets: [] }
      }
    } else if (current) {
      current.bullets.push(line.replace(/^[•\-\*]\s*/, '').trim())
    }
  }
  if (current) entries.push(current)
  return entries
}

function CVSectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-[3px] h-4 bg-[#1B4F8A] rounded-full shrink-0"></div>
      <h2 className="text-[8.5px] font-black text-[#1B4F8A] uppercase tracking-[0.22em]">{title}</h2>
      <div className="flex-1 h-px bg-[#1B4F8A]/20"></div>
    </div>
  )
}

function SkillsRenderer({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean)
  const hasCats = lines.some(l => l.includes(' : ') || l.includes(' : '))
  if (hasCats) {
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          const colonIdx = line.indexOf(' : ')
          if (colonIdx > -1) {
            const label = line.slice(0, colonIdx).trim()
            const vals = line.slice(colonIdx + 3).trim()
            return (
              <div key={i} className="flex gap-2">
                <span className="text-[11px] font-bold text-[#1B2A4A] shrink-0 min-w-[120px]">{label} :</span>
                <span className="text-[11px] text-slate-600">{vals}</span>
              </div>
            )
          }
          return <p key={i} className="text-[11px] text-slate-600">{line}</p>
        })}
      </div>
    )
  }
  const skills = text.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s, i) => (
        <span key={i} className="px-2 py-0.5 bg-[#1B4F8A]/8 border border-[#1B4F8A]/15 rounded text-[10px] text-[#1B2A4A] font-medium">{s}</span>
      ))}
    </div>
  )
}

function CVPage({ children, pageNum }: { children: React.ReactNode; pageNum: number }) {
  return (
    <div className="bg-white shadow-2xl mx-auto w-full mb-2 relative" style={{ maxWidth: '794px', minHeight: '1123px' }}>
      {children}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center">
        <span className="text-[8px] text-slate-300 tracking-widest">{pageNum}</span>
      </div>
    </div>
  )
}

const tabs = [
  { id: 'cv', label: 'CV personnalisé', icon: 'description' },
  { id: 'cover', label: 'Lettre de motivation', icon: 'mail' },
  { id: 'interview', label: 'Prép. entretien', icon: 'record_voice_over' },
  { id: 'skills', label: 'Compétences', icon: 'auto_awesome' },
]

const interviewSections = [
  { cat: 'General', icon: 'psychology', label: 'Questions générales' },
  { cat: 'Behavioral', icon: 'people', label: 'Questions comportementales' },
  { cat: 'Technical', icon: 'code', label: 'Questions techniques' },
  { cat: 'Company-Specific', icon: 'business', label: 'Questions spécifiques à l\'entreprise' },
]

export default function ApplicationResultPage() {
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState('cv')
  const [app, setApp] = useState<StoredApplication | null>(null)
  const [result, setResult] = useState<StoredResult | null>(null)
  const [loading, setLoading] = useState(true)
  const { generateDocx, isGenerating } = useDocxGenerator()

  useEffect(() => {
    async function load() {
      const [a, r] = await Promise.all([dbGetApplication(id), dbGetGenerationResult(id)])
      setApp(a)
      setResult(r)
      setLoading(false)
    }
    load()
  }, [id])

  const d = result?.data
  const score = d?.match_score || app?.matchScore || 0
  const scoreOffset = 364.4 - (364.4 * score / 100)

  const handleSaveToTracker = async () => {
    if (!app) return
    await dbAddTrackerEntry({
      applicationId: app.id,
      jobTitle: app.jobTitle,
      companyName: app.companyName || '',
      matchScore: score,
      status: 'ready',
      docsReady: true,
    })
    toast.success('Sauvegardé dans le suivi !')
  }

  const handleDownloadCV = async () => {
    if (!d?.tailored_cv) { toast.error('Aucun CV disponible'); return }
    await generateDocx({ documentType: 'cv', cvContent: d.tailored_cv })
  }

  const handleDownloadLetter = async () => {
    if (!d?.cover_letter) { toast.error('Aucune lettre de motivation disponible'); return }
    await generateDocx({ documentType: 'cover_letter', coverLetterContent: d.cover_letter })
  }

  const handleDownloadPDF = () => printToPDF()

  if (loading) return (
    <AppLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div></AppLayout>
  )

  if (!app) return (
    <AppLayout><div className="text-center py-20">
      <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">error</span>
      <p className="text-lg font-semibold text-slate-500">Candidature introuvable</p>
      <Link href="/dashboard" className="text-primary-container text-sm font-bold hover:underline mt-4 inline-block">Retour au tableau de bord</Link>
    </div></AppLayout>
  )

  if (app.status === 'generating') return (
    <AppLayout><div className="text-center py-20">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-lg font-semibold text-slate-500">Génération en cours...</p>
      <p className="text-sm text-slate-400">Veuillez patienter pendant que l&apos;IA termine votre dossier.</p>
    </div></AppLayout>
  )

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex gap-2 text-xs text-slate-400 mb-2 font-medium"><Link href="/applications" className="hover:text-primary">Candidatures</Link><span>/</span><span className="text-primary font-semibold">{app.jobTitle}</span></nav>
            <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Votre dossier de candidature est prêt</h1>
            <p className="text-base text-slate-500 mt-2">Optimisé pour {app.companyName || 'votre entreprise cible'} | {app.jobTitle}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSaveToTracker} className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold bg-white hover:bg-slate-50 transition-all"><span className="material-symbols-outlined text-[20px]">list_alt</span>Sauvegarder dans le suivi</button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2.5 bg-primary-container text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/10"><span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>Enregistrer en PDF</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90"><circle className="text-slate-100" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle><circle className="text-secondary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset={scoreOffset} strokeWidth="8" strokeLinecap="round"></circle></svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[36px] font-bold text-primary">{score}%</span><span className="text-xs text-slate-500 uppercase tracking-tighter font-medium">Score</span></div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 px-2 py-1 bg-secondary-container/30 text-secondary rounded-full text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>{score >= 80 ? 'Excellent match' : score >= 60 ? 'Bon match' : 'À améliorer'}
            </div>
          </div>
          <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">check_circle</span>Points forts</h3>
            <div className="space-y-3">
              {(d?.strong_fit_areas || app?.strongFitAreas || ['Aucune donnée']).slice(0, 4).map((area: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-secondary text-sm">check</span><span className="font-semibold text-slate-700">{area}</span></div>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">warning</span>Lacunes identifiées</h3>
            <div className="flex flex-wrap gap-2">
              {(d?.missing_skills || app?.missingSkills || ['Aucun écart identifié']).slice(0, 5).map((gap: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">{gap}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Résumé IA */}
        {(d?.ai_summary || app?.aiSummary) && (
          <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] border border-white/50 shadow-sm">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-primary-container"><span className="material-symbols-outlined">auto_awesome</span></div>
              <div className="space-y-2"><h3 className="text-xl font-bold text-primary-container">Résumé stratégique IA</h3><p className="text-base text-slate-700 leading-relaxed">{d?.ai_summary || app?.aiSummary}</p></div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="space-y-6">
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 border-b-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-primary'}`}><span className="material-symbols-outlined text-[20px]">{tab.icon}</span>{tab.label}</button>))}
          </div>

          {/* Onglet CV — Multi-page preview */}
          {activeTab === 'cv' && d?.tailored_cv && (() => {
            const cv = d.tailored_cv
            const headerLines = (cv.header_section || '').split('\n').filter(Boolean)
            const candidateName = headerLines[0] ?? ''
            const contacts = headerLines.slice(1)

            const expEntries = parseExperienceEntries(cv.experience_section || '')
            const splitIdx = expEntries.length > 3 ? Math.ceil(expEntries.length / 2) : expEntries.length
            const exp1 = expEntries.slice(0, splitIdx)
            const exp2 = expEntries.slice(splitIdx)

            const page2HasContent = !!(exp2.length || cv.education_section || cv.skills_section || cv.projects_section)
            const page3HasContent = !!(cv.certifications_section || cv.languages_section)
            const totalPages = 1 + (page2HasContent ? 1 : 0) + (page3HasContent ? 1 : 0)

            return (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
                {/* Toolbar — dark browser-like bar */}
                <div className="px-5 py-3 bg-[#1B2A4A] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <span className="material-symbols-outlined text-[16px] text-white/40">description</span>
                    <span className="text-xs text-white/60 font-medium truncate max-w-xs">CV — {app.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/40 font-medium hidden sm:inline">{totalPages} page{totalPages > 1 ? 's' : ''}</span>
                    <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                    <button
                      onClick={handleDownloadCV}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      {isGenerating ? 'Génération...' : 'Télécharger DOCX'}
                    </button>
                  </div>
                </div>

                {/* Document viewer */}
                <div className="bg-slate-600 p-4 md:p-8 overflow-y-auto" style={{ maxHeight: '900px', userSelect: 'none', WebkitUserSelect: 'none' }}>

                  {/* ── PAGE 1 ── */}
                  <CVPage pageNum={1}>
                    {/* Header band */}
                    <div className="bg-[#1B2A4A] px-10 py-9">
                      <h1 className="text-[28px] font-bold text-white tracking-wide uppercase leading-tight">{candidateName || app.jobTitle}</h1>
                      <p className="text-[#7EB5E5] text-[10px] mt-1.5 font-semibold tracking-widest uppercase">{app.jobTitle}</p>
                      {contacts.length > 0 && (
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 pt-4 border-t border-white/10">
                          {contacts.map((c: string, i: number) => (
                            <span key={i} className="text-[#A8CFF0] text-[10px]">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="px-10 py-8 space-y-6">
                      {cv.summary_section && (
                        <div>
                          <CVSectionHeader title="Profil professionnel" />
                          <p className="text-[12px] text-slate-600 leading-relaxed italic pl-1">{cv.summary_section}</p>
                        </div>
                      )}

                      {exp1.length > 0 && (
                        <div>
                          <CVSectionHeader title="Expérience professionnelle" />
                          <div className="space-y-5">
                            {exp1.map((entry, i) => (
                              <div key={i} className="pl-1">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-[#1B2A4A] leading-tight">{entry.company}</p>
                                    {entry.title && <p className="text-[11px] text-slate-500 italic mt-0.5">{entry.title}</p>}
                                  </div>
                                  {entry.dates && (
                                    <span className="text-[10px] text-slate-400 shrink-0 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-medium">{entry.dates}</span>
                                  )}
                                </div>
                                {entry.bullets.length > 0 && (
                                  <ul className="mt-2 space-y-1.5 ml-1">
                                    {entry.bullets.map((b, j) => (
                                      <li key={j} className="flex gap-2 text-[11.5px] text-slate-600 leading-relaxed">
                                        <span className="text-[#1B4F8A] font-black shrink-0 leading-5">›</span>
                                        <span>{b}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* If no page 2, show remaining sections here */}
                      {!page2HasContent && (
                        <>
                          {cv.education_section && (
                            <div>
                              <CVSectionHeader title="Formation" />
                              <div className="text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line pl-1">{cv.education_section}</div>
                            </div>
                          )}
                          {cv.skills_section && (
                            <div>
                              <CVSectionHeader title="Compétences" />
                              <div className="pl-1"><SkillsRenderer text={cv.skills_section} /></div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CVPage>

                  {/* ── PAGE SEPARATOR ── */}
                  {page2HasContent && (
                    <div className="flex items-center gap-4 my-4 px-2">
                      <div className="flex-1 h-px bg-white/15"></div>
                      <span className="text-[10px] text-white/30 font-semibold tracking-widest uppercase">Page 2</span>
                      <div className="flex-1 h-px bg-white/15"></div>
                    </div>
                  )}

                  {/* ── PAGE 2 ── */}
                  {page2HasContent && (
                    <CVPage pageNum={2}>
                      <div className="px-10 py-10 space-y-6">
                        {exp2.length > 0 && (
                          <div>
                            <CVSectionHeader title="Expérience professionnelle (suite)" />
                            <div className="space-y-5">
                              {exp2.map((entry, i) => (
                                <div key={i} className="pl-1">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-bold text-[#1B2A4A]">{entry.company}</p>
                                      {entry.title && <p className="text-[11px] text-slate-500 italic mt-0.5">{entry.title}</p>}
                                    </div>
                                    {entry.dates && (
                                      <span className="text-[10px] text-slate-400 shrink-0 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-medium">{entry.dates}</span>
                                    )}
                                  </div>
                                  {entry.bullets.length > 0 && (
                                    <ul className="mt-2 space-y-1.5 ml-1">
                                      {entry.bullets.map((b, j) => (
                                        <li key={j} className="flex gap-2 text-[11.5px] text-slate-600 leading-relaxed">
                                          <span className="text-[#1B4F8A] font-black shrink-0 leading-5">›</span>
                                          <span>{b}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cv.education_section && (
                          <div>
                            <CVSectionHeader title="Formation" />
                            <div className="text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line pl-1">{cv.education_section}</div>
                          </div>
                        )}

                        {cv.skills_section && (
                          <div>
                            <CVSectionHeader title="Compétences" />
                            <div className="pl-1"><SkillsRenderer text={cv.skills_section} /></div>
                          </div>
                        )}

                        {cv.projects_section && (
                          <div>
                            <CVSectionHeader title="Projets" />
                            <div className="text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line pl-1">{cv.projects_section}</div>
                          </div>
                        )}
                      </div>
                    </CVPage>
                  )}

                  {/* ── PAGE SEPARATOR 3 ── */}
                  {page3HasContent && (
                    <div className="flex items-center gap-4 my-4 px-2">
                      <div className="flex-1 h-px bg-white/15"></div>
                      <span className="text-[10px] text-white/30 font-semibold tracking-widest uppercase">Page 3</span>
                      <div className="flex-1 h-px bg-white/15"></div>
                    </div>
                  )}

                  {/* ── PAGE 3 ── */}
                  {page3HasContent && (
                    <CVPage pageNum={3}>
                      <div className="px-10 py-10 space-y-6">
                        {cv.certifications_section && (
                          <div>
                            <CVSectionHeader title="Certifications" />
                            <div className="text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line pl-1">{cv.certifications_section}</div>
                          </div>
                        )}
                        {cv.languages_section && (
                          <div>
                            <CVSectionHeader title="Langues" />
                            <div className="text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line pl-1">{cv.languages_section}</div>
                          </div>
                        )}
                      </div>
                    </CVPage>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-300 text-[14px]">info</span>
                    <span className="text-[11px] text-slate-400">Aperçu en lecture seule · {totalPages} page{totalPages > 1 ? 's' : ''}. Téléchargez le <strong className="text-slate-500">DOCX</strong> pour éditer.</span>
                  </div>
                  <button onClick={handleDownloadPDF} className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>PDF
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Onglet Lettre */}
          {activeTab === 'cover' && d?.cover_letter && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[400px]">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Aperçu de la lettre de motivation</span>
                <button onClick={handleDownloadLetter} disabled={isGenerating} className="text-xs text-primary-container font-bold hover:underline flex items-center gap-1 disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">download</span>{isGenerating ? 'Génération...' : 'Télécharger DOCX'}
                </button>
              </div>
              <div className="p-10">
                <div className="max-w-2xl mx-auto space-y-6 text-sm text-slate-700 leading-relaxed">
                  {d.cover_letter.full_letter_text ? (
                    <p className="whitespace-pre-line">{d.cover_letter.full_letter_text}</p>
                  ) : (
                    <>
                      {d.cover_letter.opening_paragraph && <p>{d.cover_letter.opening_paragraph}</p>}
                      {d.cover_letter.body_paragraph_1 && <p>{d.cover_letter.body_paragraph_1}</p>}
                      {d.cover_letter.body_paragraph_2 && <p>{d.cover_letter.body_paragraph_2}</p>}
                      {d.cover_letter.closing_paragraph && <p>{d.cover_letter.closing_paragraph}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Entretien */}
          {activeTab === 'interview' && d?.interview_pack && (
            <div className="space-y-6">
              {interviewSections.map(section => {
                const key = section.cat === 'General' ? 'general_questions'
                  : section.cat === 'Behavioral' ? 'behavioral_questions'
                  : section.cat === 'Technical' ? 'technical_questions'
                  : 'company_questions'
                const items = d.interview_pack[key]
                if (!items?.length) return null
                return (
                  <div key={section.cat} className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">{section.icon}</span>{section.label}</h3>
                    <div className="space-y-3">{items.map((q: string, i: number) => (<div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-sm font-semibold text-primary">{q}</p></div>))}</div>
                  </div>
                )
              })}
              {d.interview_pack.star_answers?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                  <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">star</span>Réponses méthode STAR</h3>
                  <div className="space-y-3">{d.interview_pack.star_answers.map((a: string, i: number) => (<div key={i} className="p-4 bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] rounded-xl border border-white/50"><p className="text-sm text-slate-700 whitespace-pre-line">{a}</p></div>))}</div>
                </div>
              )}
              {d.interview_pack.questions_to_ask_recruiter?.length > 0 && (
                <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-6 rounded-2xl border border-white/50">
                  <h3 className="text-lg font-bold text-primary-container mb-3 flex items-center gap-2"><span className="material-symbols-outlined">help</span>Questions à poser au recruteur</h3>
                  <ul className="space-y-2">{d.interview_pack.questions_to_ask_recruiter.map((q: string, i: number) => (<li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="material-symbols-outlined text-secondary text-sm mt-0.5">arrow_right</span>{q}</li>))}</ul>
                </div>
              )}
            </div>
          )}

          {/* Onglet Compétences */}
          {activeTab === 'skills' && d?.skill_gap_analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">warning</span>Compétences à développer</h3>
                <div className="space-y-3">
                  {(d.skill_gap_analysis.missing_skills || []).map((skill: string, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-primary">{skill}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${(d.skill_gap_analysis.priority_skills || []).includes(skill) ? 'bg-error-container text-error' : 'bg-amber-100 text-amber-700'}`}>
                          {(d.skill_gap_analysis.priority_skills || []).includes(skill) ? 'Élevée' : 'Moyenne'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">school</span>Plan d&apos;apprentissage 7 jours</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{d.skill_gap_analysis.seven_day_plan || d.skill_gap_analysis.skill_gap_summary || 'Aucun plan disponible.'}</p>
              </div>
              {d.course_recommendations?.length > 0 && (
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                  <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">play_circle</span>Cours recommandés</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {d.course_recommendations.map((c: { skill: string; reason: string; level: string; recommended_search_query: string }, i: number) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-semibold text-primary">{c.skill}</p>
                        <p className="text-xs text-slate-500 mt-1">{c.reason}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-primary-container font-bold">{c.level}</span>
                          {c.recommended_search_query && (
                            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(c.recommended_search_query)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary-container font-bold hover:underline flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">open_in_new</span>Trouver un cours
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!d && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">info</span>
              <p className="text-sm text-slate-500">Aucun contenu IA disponible pour cette candidature.</p>
              <p className="text-xs text-slate-400 mt-1">La génération a peut-être échoué. Essayez de créer une nouvelle candidature.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

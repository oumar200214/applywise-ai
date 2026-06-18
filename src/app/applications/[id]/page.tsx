'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { getApplication, getGenerationResult, addTrackerEntry } from '@/lib/storage'
import type { StoredApplication, StoredResult } from '@/lib/storage'
import { printToPDF } from '@/lib/documentGenerator'
import { useDocxGenerator } from '@/hooks/useDocxGenerator'
import toast from 'react-hot-toast'
import Link from 'next/link'

const tabs = [
  { id: 'cv', label: 'Tailored CV', icon: 'description' },
  { id: 'cover', label: 'Cover Letter', icon: 'mail' },
  { id: 'interview', label: 'Interview Prep', icon: 'record_voice_over' },
  { id: 'skills', label: 'Skill Gap', icon: 'auto_awesome' },
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
    const a = getApplication(id)
    const r = getGenerationResult(id)
    setApp(a)
    setResult(r)
    setLoading(false)
  }, [id])

  const d = result?.data // AI response data
  const score = d?.match_score || app?.matchScore || 0
  const scoreOffset = 364.4 - (364.4 * score / 100)

  const handleSaveToTracker = () => {
    if (!app) return
    addTrackerEntry({ applicationId: app.id, jobTitle: app.jobTitle, companyName: app.companyName, matchScore: score, status: 'ready', docsReady: true })
    toast.success('Saved to Application Tracker!')
  }

  const handleDownloadCV = async () => {
    if (!app || !d) return
    await generateDocx({
      userProfile: app.cvText,
      jobDescription: app.jobDescription,
      documentType: 'cv'
    })
  }

  const handleDownloadLetter = async () => {
    if (!app || !d) return
    await generateDocx({
      userProfile: app.cvText,
      jobDescription: app.jobDescription,
      documentType: 'cover_letter',
      matchScoreResult: d.match_score
    })
  }

  const handleDownloadPDF = () => {
    printToPDF()
  }

  if (loading) return <AppLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div></AppLayout>

  if (!app) return (
    <AppLayout><div className="text-center py-20">
      <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">error</span>
      <p className="text-lg font-semibold text-slate-500">Application not found</p>
      <Link href="/dashboard" className="text-primary-container text-sm font-bold hover:underline mt-4 inline-block">Back to Dashboard</Link>
    </div></AppLayout>
  )

  if (app.status === 'generating') return (
    <AppLayout><div className="text-center py-20">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-lg font-semibold text-slate-500">Still generating...</p>
      <p className="text-sm text-slate-400">Please wait for the AI to complete.</p>
    </div></AppLayout>
  )

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex gap-2 text-xs text-slate-400 mb-2 font-medium"><span>Applications</span><span>/</span><span className="text-primary font-semibold">{app.jobTitle}</span></nav>
            <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Your application pack is ready</h1>
            <p className="text-base text-slate-500 mt-2">Optimized for {app.companyName || 'your target company'} | {app.jobTitle}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSaveToTracker} className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold bg-white hover:bg-slate-50 transition-all"><span className="material-symbols-outlined text-[20px]">list_alt</span>Save to Tracker</button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2.5 bg-primary-container text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/10"><span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>Save as PDF</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90"><circle className="text-slate-100" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle><circle className="text-secondary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset={scoreOffset} strokeWidth="8" strokeLinecap="round"></circle></svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[36px] font-bold text-primary">{score}%</span><span className="text-xs text-slate-500 uppercase tracking-tighter font-medium">Match Score</span></div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 px-2 py-1 bg-secondary-container/30 text-secondary rounded-full text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>{score >= 80 ? 'Excellent Match' : score >= 60 ? 'Good Match' : 'Needs Work'}
            </div>
          </div>
          <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">check_circle</span>Top Fit Areas</h3>
            <div className="space-y-3">
              {(d?.strong_fit_areas || app?.strongFitAreas || ['No data']).slice(0, 4).map((area: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-secondary text-sm">check</span><span className="font-semibold text-slate-700">{area}</span></div>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">warning</span>Identified Gaps</h3>
            <div className="flex flex-wrap gap-2">
              {(d?.missing_skills || app?.missingSkills || ['No gaps identified']).slice(0, 5).map((gap: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">{gap}</span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {(d?.ai_summary || app?.aiSummary) && (
          <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] border border-white/50 shadow-sm">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-primary-container"><span className="material-symbols-outlined">auto_awesome</span></div>
              <div className="space-y-2"><h3 className="text-xl font-bold text-primary-container">AI Strategic Fit Summary</h3><p className="text-base text-slate-700 leading-relaxed">{d?.ai_summary || app?.aiSummary}</p></div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 border-b-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-primary'}`}><span className="material-symbols-outlined text-[20px]">{tab.icon}</span>{tab.label}</button>))}
          </div>

          {/* CV Tab */}
          {activeTab === 'cv' && d?.tailored_cv && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[500px]">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Tailored CV Preview</span>
                <button onClick={handleDownloadCV} disabled={isGenerating} className="text-xs text-primary-container font-bold hover:underline flex items-center gap-1 disabled:opacity-50"><span className="material-symbols-outlined text-sm">download</span>{isGenerating ? 'Generating...' : 'Download DOCX'}</button>
              </div>
              <div className="p-10 bg-slate-200/30">
                <div className="bg-white shadow-lg mx-auto max-w-2xl min-h-[500px] p-12 space-y-6">
                  {d.tailored_cv.header_section && <div className="space-y-1"><h2 className="text-[28px] font-semibold text-primary">{d.tailored_cv.header_section}</h2></div>}
                  {d.tailored_cv.summary_section && <div className="space-y-2"><h3 className="text-sm font-bold text-primary uppercase tracking-widest text-[10px]">Summary</h3><p className="text-[13px] text-slate-600 leading-relaxed">{d.tailored_cv.summary_section}</p></div>}
                  {d.tailored_cv.experience_section && <div className="space-y-2"><h3 className="text-sm font-bold text-primary uppercase tracking-widest text-[10px]">Experience</h3><p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">{d.tailored_cv.experience_section}</p></div>}
                  {d.tailored_cv.education_section && <div className="space-y-2"><h3 className="text-sm font-bold text-primary uppercase tracking-widest text-[10px]">Education</h3><p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">{d.tailored_cv.education_section}</p></div>}
                  {d.tailored_cv.skills_section && <div className="space-y-2"><h3 className="text-sm font-bold text-primary uppercase tracking-widest text-[10px]">Skills</h3><p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">{d.tailored_cv.skills_section}</p></div>}
                </div>
              </div>
            </div>
          )}

          {/* Cover Letter Tab */}
          {activeTab === 'cover' && d?.cover_letter && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[400px]">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Cover Letter Preview</span>
                <button onClick={handleDownloadLetter} disabled={isGenerating} className="text-xs text-primary-container font-bold hover:underline flex items-center gap-1 disabled:opacity-50"><span className="material-symbols-outlined text-sm">download</span>{isGenerating ? 'Generating...' : 'Download DOCX'}</button>
              </div>
              <div className="p-10">
                <div className="max-w-2xl mx-auto space-y-6 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {d.cover_letter.full_letter_text ? (
                  <p>{d.cover_letter.full_letter_text}</p>
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

          {/* Interview Tab */}
          {activeTab === 'interview' && d?.interview_pack && (
            <div className="space-y-6">
              {[
                { cat: 'General', icon: 'psychology', items: d.interview_pack.general_questions },
                { cat: 'Behavioral', icon: 'people', items: d.interview_pack.behavioral_questions },
                { cat: 'Technical', icon: 'code', items: d.interview_pack.technical_questions },
                { cat: 'Company-Specific', icon: 'business', items: d.interview_pack.company_questions },
              ].filter(s => s.items?.length > 0).map(section => (
                <div key={section.cat} className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                  <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary-container">{section.icon}</span>{section.cat} Questions</h3>
                  <div className="space-y-3">{section.items.map((q: string, i: number) => (<div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-sm font-semibold text-primary">{q}</p></div>))}</div>
                </div>
              ))}
              {d.interview_pack.questions_to_ask_recruiter?.length > 0 && (
                <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e0e7ff] p-6 rounded-2xl border border-white/50">
                  <h3 className="text-lg font-bold text-primary-container mb-3 flex items-center gap-2"><span className="material-symbols-outlined">help</span>Questions to Ask the Recruiter</h3>
                  <ul className="space-y-2">{d.interview_pack.questions_to_ask_recruiter.map((q: string, i: number) => (<li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="material-symbols-outlined text-secondary text-sm mt-0.5">arrow_right</span>{q}</li>))}</ul>
                </div>
              )}
            </div>
          )}

          {/* Skill Gap Tab */}
          {activeTab === 'skills' && d?.skill_gap_analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-amber-500">warning</span>Skills to Develop</h3>
                <div className="space-y-3">
                  {(d.skill_gap_analysis.missing_skills || []).map((skill: string, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-semibold text-primary">{skill}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${i === 0 ? 'bg-error-container text-error' : 'bg-amber-100 text-amber-700'}`}>{i === 0 ? 'High' : 'Medium'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">school</span>7-Day Learning Plan</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{d.skill_gap_analysis.seven_day_plan || d.skill_gap_analysis.skill_gap_summary || 'No plan available.'}</p>
              </div>
              {d.course_recommendations?.length > 0 && (
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                  <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">play_circle</span>Recommended Courses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {d.course_recommendations.map((c: { skill: string; reason: string; level: string }, i: number) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-semibold text-primary">{c.skill}</p>
                        <p className="text-xs text-slate-500 mt-1">{c.reason}</p>
                        <span className="text-[10px] text-primary-container font-bold mt-2 inline-block">{c.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback when no AI data */}
          {!d && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">info</span>
              <p className="text-sm text-slate-500">No AI-generated content available for this application.</p>
              <p className="text-xs text-slate-400 mt-1">The generation may have failed. Try creating a new application.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

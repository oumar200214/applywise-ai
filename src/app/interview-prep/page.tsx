'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { getApplications, getGenerationResult } from '@/lib/storage'
import type { StoredApplication, StoredResult } from '@/lib/storage'

type QuestionItem = {
  q: string;
  cat: string;
  company: string;
  appId: string;
  role: string;
}

export default function InterviewPrepPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apps = getApplications()
    const allQuestions: QuestionItem[] = []

    apps.forEach(app => {
      const result = getGenerationResult(app.id)
      if (result && result.data?.interview_pack) {
        const pack = result.data.interview_pack
        const addQuestions = (qs: string[], cat: string) => {
          if (qs && Array.isArray(qs)) {
            qs.forEach(q => {
              allQuestions.push({
                q,
                cat,
                company: app.companyName || 'Unknown Company',
                appId: app.id,
                role: app.jobTitle
              })
            })
          }
        }

        addQuestions(pack.behavioral_questions, 'Behavioral')
        addQuestions(pack.technical_questions, 'Technical')
        addQuestions(pack.general_questions, 'General')
        addQuestions(pack.company_questions, 'Company Specific')
      }
    })

    setQuestions(allQuestions)
    setLoading(false)
  }, [])

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Interview Preparation</h1>
          <p className="text-base text-slate-500 mt-2">Practice with AI-generated questions tailored to your actual applications.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-primary-container text-3xl">record_voice_over</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Mock Interview</h3>
            <p className="text-sm text-on-surface-variant mb-6">Practice answering questions with our AI coach. Get instant feedback on your responses.</p>
            <button className="bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">Coming Soon</button>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-stitch border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-secondary-container/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-3xl">quiz</span>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Question Bank</h3>
            <p className="text-sm text-on-surface-variant mb-6">You have <strong>{questions.length}</strong> customized questions generated from your applications.</p>
            <button className="border border-primary text-primary px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">Browse Bank</button>
          </div>
        </div>

        {/* Recent Questions */}
        <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">history</span>
            Recent Questions
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">info</span>
              <p className="text-sm text-slate-500">No interview questions generated yet.</p>
              <p className="text-xs text-slate-400 mt-1">Create an application with &quot;Interview Prep&quot; selected to see questions here.</p>
              <Link href="/new-application" className="mt-4 inline-block text-primary-container text-sm font-bold hover:underline">Create Application</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.slice(0, 10).map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary-container text-lg">help</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary">{item.q}</p>
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase">{item.cat}</span>
                      <span className="text-xs text-slate-500 font-medium">{item.company}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">{item.role}</span>
                    </div>
                  </div>
                  <Link href={`/applications/${item.appId}`} className="text-primary-container text-xs font-bold hover:underline shrink-0 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">visibility</span> View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

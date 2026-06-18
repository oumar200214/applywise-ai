'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { getApplications, getGenerationResult } from '@/lib/storage'

type SkillGapData = {
  strongSkills: { skill: string; level: number }[];
  missingSkills: { skill: string; level: number; priority: string; company: string; role: string }[];
  matchedCount: number;
  missingCount: number;
  avgProficiency: number;
}

export default function SkillGapPage() {
  const [data, setData] = useState<SkillGapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apps = getApplications()
    
    // In a real app we'd compute this from a complex user profile + all apps.
    // Here we'll aggregate from recent generated applications.
    const strongSkillsSet = new Set<string>()
    const missingSkillsList: any[] = []
    
    let totalScore = 0
    let appsWithScore = 0

    apps.forEach(app => {
      if (app.matchScore) {
        totalScore += app.matchScore
        appsWithScore++
      }
      
      const result = getGenerationResult(app.id)
      if (result && result.data) {
        // Collect strong areas
        if (result.data.strong_fit_areas) {
          result.data.strong_fit_areas.forEach((area: string) => strongSkillsSet.add(area))
        }
        
        // Collect missing skills
        if (result.data.missing_skills || (result.data.skill_gap_analysis && result.data.skill_gap_analysis.missing_skills)) {
          const gaps = result.data.skill_gap_analysis?.missing_skills || result.data.missing_skills || []
          gaps.forEach((gap: string) => {
            missingSkillsList.push({
              skill: gap,
              level: Math.floor(Math.random() * 30) + 20, // Mocking current level for UI
              priority: 'High', // Defaulting to high for direct missing skills
              company: app.companyName || 'Unknown',
              role: app.jobTitle
            })
          })
        }
      }
    })

    // Remove duplicates from missing skills
    const uniqueMissing = missingSkillsList.filter((v, i, a) => a.findIndex(t => (t.skill === v.skill)) === i)
    
    const strongArr = Array.from(strongSkillsSet).map(s => ({
      skill: s.length > 30 ? s.substring(0, 30) + '...' : s, // Truncate long descriptions
      level: Math.floor(Math.random() * 20) + 80 // Mocking high proficiency for UI
    }))

    setData({
      strongSkills: strongArr,
      missingSkills: uniqueMissing,
      matchedCount: strongArr.length,
      missingCount: uniqueMissing.length,
      avgProficiency: appsWithScore > 0 ? Math.round(totalScore / appsWithScore) : 0
    })
    
    setLoading(false)
  }, [])

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Skill Gap Analysis</h1>
          <p className="text-base text-slate-500 mt-2">Identify your skill gaps across all your applications and get personalized learning recommendations.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>
        ) : !data || (data.matchedCount === 0 && data.missingCount === 0) ? (
          <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">analytics</span>
            <p className="text-lg font-semibold text-slate-500 mb-2">No skill data available</p>
            <p className="text-sm text-slate-400 mb-6">Generate an application with AI to analyze your skill gaps.</p>
            <Link href="/new-application" className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-lg">add_circle</span>Create Application
            </Link>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Strong Areas</p>
                <p className="text-3xl font-bold text-secondary">{data.matchedCount}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Skills to Develop</p>
                <p className="text-3xl font-bold text-amber-500">{data.missingCount}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Avg. Application Match</p>
                <p className="text-3xl font-bold text-primary">{data.avgProficiency}%</p>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strong Skills */}
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                  Your Strong Areas
                </h3>
                {data.strongSkills.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No strong areas identified yet.</p>
                ) : (
                  <div className="space-y-4">
                    {data.strongSkills.slice(0, 8).map((s, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">{s.skill}</span>
                          <span className="text-secondary font-bold">{s.level}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: `${s.level}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gap Skills */}
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">trending_up</span>
                  Skills to Improve
                </h3>
                {data.missingSkills.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No skill gaps identified! Great job.</p>
                ) : (
                  <div className="space-y-3">
                    {data.missingSkills.slice(0, 8).map((s, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-primary">{s.skill}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.priority === 'High' ? 'bg-error-container text-error' : s.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                          }`}>{s.priority}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2">Required for: {s.role} at {s.company}</p>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${s.level}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

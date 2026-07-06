'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { dbGetApplications, dbGetGenerationResult } from '@/lib/db'

type SkillEntry = { skill: string; company: string; role: string }

type SkillGapData = {
  strongSkills: SkillEntry[]
  missingSkills: (SkillEntry & { priority: 'High' | 'Medium' | 'Low' })[]
  matchedCount: number
  missingCount: number
  avgMatchScore: number
}

const priorityLabels: Record<string, string> = {
  High: 'Élevée',
  Medium: 'Moyenne',
  Low: 'Faible',
}

export default function SkillGapPage() {
  const [data, setData] = useState<SkillGapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function compute() {
      const apps = await dbGetApplications()

      const strongSet = new Map<string, { company: string; role: string }>()
      const missingMap = new Map<string, { company: string; role: string; priority: 'High' | 'Medium' | 'Low' }>()

      let totalScore = 0
      let appsWithScore = 0

      for (const app of apps) {
        if (app.matchScore) {
          totalScore += app.matchScore
          appsWithScore++
        }

        const result = await dbGetGenerationResult(app.id)
        if (!result?.data) continue

        const d = result.data

        const fitAreas: string[] = d.strong_fit_areas ?? []
        fitAreas.forEach(area => {
          if (!strongSet.has(area)) {
            strongSet.set(area, { company: app.companyName || '—', role: app.jobTitle })
          }
        })

        const gap = d.skill_gap_analysis ?? {}
        const prioritySkills: string[] = gap.priority_skills ?? []
        const missingSkills: string[] = gap.missing_skills ?? d.missing_skills ?? []

        missingSkills.forEach((skill, i) => {
          if (!missingMap.has(skill)) {
            const priority: 'High' | 'Medium' | 'Low' =
              prioritySkills.includes(skill) ? 'High'
              : i < 3 ? 'Medium'
              : 'Low'
            missingMap.set(skill, { company: app.companyName || '—', role: app.jobTitle, priority })
          }
        })
      }

      setData({
        strongSkills: Array.from(strongSet.entries()).map(([skill, meta]) => ({ skill, ...meta })),
        missingSkills: Array.from(missingMap.entries()).map(([skill, meta]) => ({ skill, ...meta })),
        matchedCount: strongSet.size,
        missingCount: missingMap.size,
        avgMatchScore: appsWithScore > 0 ? Math.round(totalScore / appsWithScore) : 0,
      })
      setLoading(false)
    }

    compute()
  }, [])

  const priorityColor = {
    High: 'bg-error-container text-error',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-slate-100 text-slate-500',
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Analyse des compétences</h1>
          <p className="text-base text-slate-500 mt-2">Identifiez vos lacunes de compétences sur toutes vos candidatures et obtenez des recommandations d&apos;apprentissage personnalisées.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>
        ) : !data || (data.matchedCount === 0 && data.missingCount === 0) ? (
          <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">analytics</span>
            <p className="text-lg font-semibold text-slate-500 mb-2">Aucune donnée de compétences disponible</p>
            <p className="text-sm text-slate-400 mb-6">Générez une candidature avec l&apos;IA pour analyser vos compétences.</p>
            <Link href="/new-application" className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-lg">add_circle</span>Créer une candidature
            </Link>
          </div>
        ) : (
          <>
            {/* Vue d'ensemble */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Points forts</p>
                <p className="text-3xl font-bold text-secondary">{data.matchedCount}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Compétences à développer</p>
                <p className="text-3xl font-bold text-amber-500">{data.missingCount}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Score moyen</p>
                <p className="text-3xl font-bold text-primary">{data.avgMatchScore}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Points forts */}
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">check_circle</span>Vos points forts
                </h3>
                {data.strongSkills.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Aucun point fort identifié pour l&apos;instant.</p>
                ) : (
                  <div className="space-y-3">
                    {data.strongSkills.slice(0, 8).map((s, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-semibold text-primary">{s.skill}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.role} chez {s.company}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compétences manquantes */}
              <div className="bg-white p-6 rounded-2xl shadow-stitch border border-slate-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">trending_up</span>Compétences à améliorer
                </h3>
                {data.missingSkills.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Aucun écart identifié ! Excellent travail.</p>
                ) : (
                  <div className="space-y-3">
                    {data.missingSkills.slice(0, 8).map((s, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold text-primary">{s.skill}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityColor[s.priority]}`}>{priorityLabels[s.priority]}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Requis pour : {s.role} chez {s.company}</p>
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

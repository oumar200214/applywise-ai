'use client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { dbGetApplications, dbDeleteApplication } from '@/lib/db'
import { useState, useEffect } from 'react'
import type { StoredApplication } from '@/lib/storage'
import toast from 'react-hot-toast'

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  generating: 'bg-yellow-50 text-yellow-700',
  generated: 'bg-blue-50 text-blue-700',
  error: 'bg-red-50 text-error',
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  generating: 'En cours',
  generated: 'Généré',
  error: 'Erreur',
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<StoredApplication[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dbGetApplications().then(data => { setApps(data); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  const handleDelete = async (id: string) => {
    await dbDeleteApplication(id)
    setApps(prev => prev.filter(a => a.id !== id))
    toast.success('Candidature supprimée')
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[36px] font-bold text-primary leading-tight tracking-tight">Mes candidatures</h1>
            <p className="text-base text-slate-500 mt-2">Tous vos dossiers de candidature générés par IA en un seul endroit.</p>
          </div>
          <div className="flex gap-3">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-600 focus:ring-2 focus:ring-primary/20">
              <option value="all">Toutes ({apps.length})</option>
              <option value="generated">Générées</option>
              <option value="generating">En cours</option>
              <option value="error">Échouées</option>
            </select>
            <Link href="/new-application" className="flex items-center gap-2 bg-primary-container text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined text-lg">add_circle</span>Nouveau
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl shadow-stitch border border-slate-100 h-48 animate-pulse"></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-stitch border border-slate-100 p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">description</span>
            <p className="text-lg font-semibold text-slate-500 mb-2">{filter === 'all' ? 'Aucune candidature pour l\'instant' : `Aucune candidature ${statusLabels[filter] || filter}`}</p>
            <p className="text-sm text-slate-400 mb-6">Créez votre première candidature IA pour commencer.</p>
            <Link href="/new-application" className="inline-flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-lg">add_circle</span>Créer une candidature
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(app => (
              <div key={app.id} className="bg-white rounded-2xl shadow-stitch border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-primary group-hover:text-primary-container transition-colors">{app.jobTitle}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{app.companyName || 'Entreprise inconnue'}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase ${statusColors[app.status]}`}>{statusLabels[app.status] || app.status}</span>
                  </div>
                  {app.matchScore && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${app.matchScore}%` }}></div></div>
                      <span className="text-sm font-bold text-secondary">{app.matchScore}%</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{new Date(app.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {app.selectedOutputs && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">description</span>{app.selectedOutputs.length} sortie{app.selectedOutputs.length > 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  {app.status === 'generated' ? (
                    <Link href={`/applications/${app.id}`} className="text-primary-container text-xs font-bold hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">visibility</span>Voir les résultats</Link>
                  ) : app.status === 'generating' ? (
                    <Link href={`/generating?id=${app.id}`} className="text-yellow-600 text-xs font-bold hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">hourglass_top</span>En cours</Link>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                  <button onClick={() => handleDelete(app.id)} className="text-xs text-slate-400 hover:text-error transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-sm">delete</span>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

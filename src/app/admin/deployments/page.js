'use client'

import { useState, useEffect } from 'react'
import { ServerIcon, CheckIcon, ClockIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@/components/admin/Icons'

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState([])
  const [migrations, setMigrations] = useState([])
  const [caches, setCaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('deployments')
  const [source, setSource] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      if (activeTab === 'deployments') {
        const res = await fetch('/api/admin/deployments')
        const data = await res.json()
        if (data.success) {
          setDeployments(data.deployments || [])
          setSource(data.source || 'unknown')
        }
      } else if (activeTab === 'migrations') {
        const res = await fetch('/api/admin/migrations')
        const data = await res.json()
        if (data.success) {
          setMigrations(data.migrations || [])
        }
      } else if (activeTab === 'cache') {
        const res = await fetch('/api/admin/cache')
        const data = await res.json()
        if (data.success) {
          setCaches(data.caches || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePurgeCache(key) {
    if (!confirm(`Rensa cache '${key}'?`)) return
    try {
      const res = await fetch(`/api/admin/cache?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message)
        fetchData()
      }
    } catch (error) {
      console.error('Error purging cache:', error)
      alert('Kunde inte rensa cache')
    }
  }

  async function handlePurgeAll() {
    if (!confirm('Rensa ALL cache? Detta kan påverka prestanda tillfälligt.')) return
    try {
      const res = await fetch('/api/admin/cache?key=all', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error purging all caches:', error)
    }
  }

  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'ready':
      case 'success':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'building':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'cancelled':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('sv-SE')
  }

  const tabs = [
    { id: 'deployments', label: 'Deployments' },
    { id: 'migrations', label: 'Migrationer' },
    { id: 'cache', label: 'Cache' },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <ServerIcon className="w-6 h-6 text-white" />
            </div>
            Deployment Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Hantera deployments, migrationer och cache
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Uppdatera
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 mt-2">Laddar...</p>
        </div>
      ) : (
        <>
          {/* Deployments Tab */}
          {activeTab === 'deployments' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Senaste Deployments
                </h3>
                {source && (
                  <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">
                    Källa: {source}
                  </span>
                )}
              </div>

              {deployments.length === 0 ? (
                <div className="p-12 text-center">
                  <ServerIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Inga deployments hittade.
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                    Sätt VERCEL_TOKEN och VERCEL_PROJECT_ID för live-data.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {deployments.map((deployment, i) => (
                    <div key={deployment.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(deployment.status)}`}>
                              {deployment.status}
                            </span>
                            <code className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                              {deployment.commit_sha?.substring(0, 7) || 'N/A'}
                            </code>
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              {deployment.branch}
                            </span>
                          </div>
                          <p className="text-sm text-slate-900 dark:text-white truncate">
                            {deployment.commit_message || 'No commit message'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatDate(deployment.deployed_at)}</span>
                            <span>av {deployment.deployed_by}</span>
                          </div>
                        </div>
                        {deployment.url && (
                          <a
                            href={deployment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Öppna →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Migrations Tab */}
          {activeTab === 'migrations' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Databasmigrationer
                </h3>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {migrations.map((migration, i) => (
                  <div key={migration.name || i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {migration.applied ? (
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      ) : migration.pending ? (
                        <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                          <ExclamationTriangleIcon className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <code className="text-sm text-slate-900 dark:text-white font-mono">
                        {migration.name}
                      </code>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      migration.applied
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : migration.pending
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {migration.applied ? 'Applicerad' : migration.pending ? 'Väntar' : 'Okänd'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                Kör migrationer via Supabase Dashboard eller CLI för att tillämpa väntande ändringar.
              </div>
            </div>
          )}

          {/* Cache Tab */}
          {activeTab === 'cache' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Cache-hantering
                  </h3>
                  <button
                    onClick={handlePurgeAll}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Rensa All Cache
                  </button>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {caches.map((cache, i) => (
                    <div key={cache.key || i} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <code className="text-sm font-medium text-slate-900 dark:text-white font-mono">
                            {cache.key}
                          </code>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">
                            SWR: {cache.swrDuration}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {cache.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePurgeCache(cache.key)}
                        className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Rensa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Om Cache i Next.js
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Server-side cache rensas med revalidatePath/revalidateTag</li>
                  <li>• SWR-cache hanteras på klient-sidan</li>
                  <li>• Browser cache styrs av användaren</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

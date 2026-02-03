'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserGroupIcon } from '@/components/admin/Icons'

const filterOptions = {
  subscription: [
    { value: 'free', label: 'Gratisanvändare' },
    { value: 'premium', label: 'Premium' },
    { value: 'churned', label: 'Avslutad prenumeration' },
  ],
  activity: [
    { value: 'active_7d', label: 'Aktiv senaste 7 dagarna' },
    { value: 'active_30d', label: 'Aktiv senaste 30 dagarna' },
    { value: 'inactive_30d', label: 'Inaktiv 30+ dagar' },
    { value: 'inactive_90d', label: 'Inaktiv 90+ dagar' },
  ],
  mealPlans: [
    { value: 'has_plans', label: 'Har skapat matplan' },
    { value: 'no_plans', label: 'Har aldrig skapat matplan' },
    { value: 'plans_5plus', label: '5+ matplaner' },
    { value: 'plans_10plus', label: '10+ matplaner' },
  ],
  usage: [
    { value: 'high_usage', label: 'Hög användning (80%+ av gräns)' },
    { value: 'at_limit', label: 'Nått månadsgräns' },
    { value: 'low_usage', label: 'Låg användning (<20%)' },
  ],
  registration: [
    { value: 'new_7d', label: 'Registrerad senaste 7 dagarna' },
    { value: 'new_30d', label: 'Registrerad senaste 30 dagarna' },
    { value: 'veteran_6m', label: 'Användare 6+ månader' },
  ]
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    premium: 0,
    active7d: 0,
    atLimit: 0,
    churnRisk: 0
  })
  const [estimatedCount, setEstimatedCount] = useState(null)
  const [estimating, setEstimating] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    filters: {}
  })

  useEffect(() => {
    loadSegments()
    loadStats()
  }, [])

  async function loadSegments() {
    try {
      const res = await fetch('/api/admin/segments')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.success) {
        setSegments(data.segments || [])
      }
    } catch (err) {
      console.error('Failed to load segments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/segments/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  // Estimate user count when filters change
  const estimateUserCount = useCallback(async (filters) => {
    const activeFilters = Object.values(filters).flat().filter(Boolean).length
    if (activeFilters === 0) {
      setEstimatedCount(null)
      return
    }

    setEstimating(true)
    try {
      // Create a temporary segment to get the count
      const res = await fetch('/api/admin/segments/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      })
      const data = await res.json()
      if (data.success) {
        setEstimatedCount(data.count)
      }
    } catch (err) {
      console.error('Failed to estimate:', err)
    } finally {
      setEstimating(false)
    }
  }, [])

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.success) {
        setSegments(prev => [data.segment, ...prev])
        setShowCreate(false)
        setForm({ name: '', description: '', filters: {} })
        setEstimatedCount(null)
      }
    } catch (err) {
      console.error('Failed to create segment:', err)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Är du säker på att du vill ta bort detta segment?')) return
    try {
      const res = await fetch(`/api/admin/segments/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSegments(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Failed to delete segment:', err)
      setError(err.message)
    }
  }

  function toggleFilter(category, value) {
    setForm(prev => {
      const currentFilters = prev.filters[category] || []
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value]
      const updatedFilters = {
        ...prev.filters,
        [category]: newFilters.length > 0 ? newFilters : undefined
      }

      // Clean up undefined values
      Object.keys(updatedFilters).forEach(key => {
        if (updatedFilters[key] === undefined) {
          delete updatedFilters[key]
        }
      })

      return {
        ...prev,
        filters: updatedFilters
      }
    })
  }

  const activeFiltersCount = Object.values(form.filters).flat().filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            Användarsegment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Skapa och hantera segment för riktade kampanjer
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nytt segment
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Quick Segments */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white">
          <p className="text-gray-100 text-sm">Totalt användare</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-green-100 text-sm">Premium-användare</p>
          <p className="text-2xl font-bold">{stats.premium}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-blue-100 text-sm">Aktiva (7d)</p>
          <p className="text-2xl font-bold">{stats.active7d}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-red-100 text-sm">Risk för churn</p>
          <p className="text-2xl font-bold">{stats.churnRisk}</p>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowCreate(false); setEstimatedCount(null) }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Skapa segment</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Segmentnamn</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="T.ex. 'Aktiva premium-användare'"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beskrivning</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Kort beskrivning av segmentet"
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Filter Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Filter ({activeFiltersCount} valda)
                </label>

                {Object.entries(filterOptions).map(([category, options]) => (
                  <div key={category} className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      {category === 'subscription' ? 'Prenumeration' :
                       category === 'activity' ? 'Aktivitet' :
                       category === 'mealPlans' ? 'Matplaner' :
                       category === 'usage' ? 'Användning' : 'Registrering'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {options.map(opt => {
                        const isActive = (form.filters[category] || []).includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleFilter(category, opt.value)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Estimated Size */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 dark:text-blue-400 font-medium">Uppskattat antal användare</span>
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {estimating ? (
                      <span className="text-base">Beräknar...</span>
                    ) : activeFiltersCount === 0 ? (
                      `~${stats.total}`
                    ) : (
                      `~${estimatedCount ?? stats.total}`
                    )}
                  </span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                  {activeFiltersCount === 0
                    ? 'Välj filter för att begränsa segmentet'
                    : 'Baserat på valda filter'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setForm({ name: '', description: '', filters: {} }); setEstimatedCount(null) }}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!form.name || activeFiltersCount === 0 || creating}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Skapar...' : 'Skapa segment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segments List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Sparade segment</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : segments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Inga segment skapade ännu</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Skapa ditt första segment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {segments.map(segment => (
              <div key={segment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white">{segment.name}</h3>
                    {segment.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{segment.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{segment.user_count || 0}</span> användare
                      </span>
                      {segment.is_dynamic && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                          Dynamiskt
                        </span>
                      )}
                      {segment.filters && Object.keys(segment.filters).length > 0 && (
                        <span className="text-xs text-gray-400">
                          {Object.values(segment.filters).flat().length} filter
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(segment.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

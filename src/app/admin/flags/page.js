'use client'

import { useState, useEffect } from 'react'
import { FlagIcon } from '@/components/admin/Icons'

export default function FlagsPage() {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [segments, setSegments] = useState([])

  const [form, setForm] = useState({
    name: '',
    description: '',
    enabled: false,
    rollout_percentage: 0,
    target_segment: ''
  })

  useEffect(() => {
    loadFlags()
    loadSegments()
  }, [])

  async function loadFlags() {
    try {
      const res = await fetch('/api/admin/flags')
      const data = await res.json()
      if (data.success) {
        setFlags(data.flags || [])
      }
    } catch (error) {
      console.error('Failed to load flags:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadSegments() {
    try {
      const res = await fetch('/api/admin/segments')
      const data = await res.json()
      if (data.success) {
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Failed to load segments:', error)
    }
  }

  async function handleCreate() {
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setFlags(prev => [data.flag, ...prev])
        setShowCreate(false)
        setForm({ name: '', description: '', enabled: false, rollout_percentage: 0, target_segment: '' })
      }
    } catch (error) {
      console.error('Failed to create flag:', error)
    }
  }

  async function handleToggle(id, enabled) {
    try {
      await fetch(`/api/admin/flags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled } : f))
    } catch (error) {
      console.error('Failed to toggle flag:', error)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Är du säker på att du vill ta bort denna feature flag?')) return
    try {
      await fetch(`/api/admin/flags/${id}`, { method: 'DELETE' })
      setFlags(prev => prev.filter(f => f.id !== id))
    } catch (error) {
      console.error('Failed to delete flag:', error)
    }
  }

  async function handleRolloutChange(id, percentage) {
    try {
      await fetch(`/api/admin/flags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollout_percentage: percentage })
      })
      setFlags(prev => prev.map(f => f.id === id ? { ...f, rollout_percentage: percentage } : f))
    } catch (error) {
      console.error('Failed to update rollout:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <FlagIcon className="w-6 h-6 text-white" />
            </div>
            Feature Flags
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kontrollera feature rollouts och A/B-tester
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ny flag
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt flags</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{flags.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Aktiverade</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-500">
            {flags.filter(f => f.enabled).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Gradvis rollout</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
            {flags.filter(f => f.rollout_percentage > 0 && f.rollout_percentage < 100).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Segmentbaserade</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-500">
            {flags.filter(f => f.target_segment).length}
          </p>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Skapa feature flag</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Flagnamn</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="new_feature_enabled"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Använd snake_case</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beskrivning</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Vad gör denna feature?"
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rollout-procent</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.rollout_percentage}
                    onChange={(e) => setForm({ ...form, rollout_percentage: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-mono text-gray-900 dark:text-white">{form.rollout_percentage}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Begränsa till segment (valfritt)</label>
                <select
                  value={form.target_segment}
                  onChange={(e) => setForm({ ...form, target_segment: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Alla användare</option>
                  {segments.map(seg => (
                    <option key={seg.id} value={seg.id}>{seg.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Aktivera direkt</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skapa flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flags List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Alla feature flags</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : flags.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
              <FlagIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Inga feature flags skapade ännu</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Skapa din första flag →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {flags.map(flag => (
              <div key={flag.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white">
                        {flag.name}
                      </code>
                      {flag.target_segment && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs">
                          Segment
                        </span>
                      )}
                    </div>
                    {flag.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{flag.description}</p>
                    )}

                    {/* Rollout slider */}
                    <div className="mt-3 flex items-center gap-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Rollout:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={flag.rollout_percentage || 0}
                        onChange={(e) => handleRolloutChange(flag.id, parseInt(e.target.value))}
                        className="w-32"
                      />
                      <span className="text-sm font-mono text-gray-900 dark:text-white">{flag.rollout_percentage || 0}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(flag.id, !flag.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        flag.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleDelete(flag.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
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

      {/* Usage Example */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Användning i kod</h3>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Kolla flag på server
const isEnabled = await checkFeatureFlag('new_feature_enabled', userId)

// Kolla flag på klient
const { isEnabled } = useFeatureFlag('new_feature_enabled')

if (isEnabled) {
  // Visa ny feature
}`}
        </pre>
      </div>
    </div>
  )
}

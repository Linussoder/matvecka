'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ABTestCard from '@/components/admin/ABTestCard'
import { ArrowPathIcon } from '@/components/admin/Icons'

// Beaker icon for experiments
function BeakerIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 15.5m14.8-.2l-.71-1.422a2.25 2.25 0 00-1.612-1.28l-1.628-.244M5 15.5l-.71-1.422a2.25 2.25 0 01-1.612-1.28l-1.628-.244M5 15.5v2.756c0 .813.422 1.568 1.116 1.998l1.004.602A2.25 2.25 0 008.25 21h7.5a2.25 2.25 0 001.13-.144l1.004-.602A2.25 2.25 0 0019 18.756V15.5" />
    </svg>
  )
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState([])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    metric: 'premium_conversion',
    trafficPercentage: 100
  })

  const fetchExperiments = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/experiments')

      if (res.ok) {
        const data = await res.json()
        setExperiments(data.experiments || [])

        // Fetch results for running experiments
        const running = (data.experiments || []).filter(e => e.status === 'running' || e.status === 'completed')
        for (const exp of running) {
          const resultsRes = await fetch(`/api/admin/experiments/${exp.id}/results`)
          if (resultsRes.ok) {
            const resultsData = await resultsRes.json()
            setResults(prev => ({ ...prev, [exp.id]: resultsData }))
          }
        }
      } else {
        setError('Kunde inte hämta experiment')
      }
    } catch (err) {
      console.error('Error fetching experiments:', err)
      setError('Kunde inte hämta experiment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExperiments()
  }, [])

  const handleCreateExperiment = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExperiment)
      })

      if (res.ok) {
        setShowNewForm(false)
        setNewExperiment({ name: '', description: '', metric: 'premium_conversion', trafficPercentage: 100 })
        fetchExperiments()
      } else {
        setError('Kunde inte skapa experiment')
      }
    } catch (err) {
      console.error('Error creating experiment:', err)
      setError('Kunde inte skapa experiment')
    } finally {
      setLoading(false)
    }
  }

  const handleStartExperiment = async (id) => {
    try {
      await fetch(`/api/admin/experiments/${id}/start`, { method: 'POST' })
      fetchExperiments()
    } catch (err) {
      console.error('Error starting experiment:', err)
    }
  }

  const handlePauseExperiment = async (id) => {
    try {
      await fetch(`/api/admin/experiments/${id}/pause`, { method: 'POST' })
      fetchExperiments()
    } catch (err) {
      console.error('Error pausing experiment:', err)
    }
  }

  const handleStopExperiment = async (id) => {
    try {
      await fetch(`/api/admin/experiments/${id}/stop`, { method: 'POST' })
      fetchExperiments()
    } catch (err) {
      console.error('Error stopping experiment:', err)
    }
  }

  const handleDeclareWinner = async (id, winnerId) => {
    try {
      await fetch(`/api/admin/experiments/${id}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId })
      })
      fetchExperiments()
    } catch (err) {
      console.error('Error declaring winner:', err)
    }
  }

  const activeExperiments = experiments.filter(e => e.status === 'running')
  const draftExperiments = experiments.filter(e => e.status === 'draft')
  const completedExperiments = experiments.filter(e => e.status === 'completed' || e.status === 'paused')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Tillbaka
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-violet-500 rounded-lg">
                  <BeakerIcon className="w-6 h-6 text-white" />
                </div>
                A/B-experiment
              </h1>
              <p className="text-gray-500 text-sm">Testa och optimera konvertering</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchExperiments}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Uppdatera
            </button>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 font-medium"
            >
              + Nytt experiment
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Pågående</p>
            <p className="text-2xl font-bold text-green-600">{activeExperiments.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Utkast</p>
            <p className="text-2xl font-bold text-gray-600">{draftExperiments.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Avslutade</p>
            <p className="text-2xl font-bold text-blue-600">{completedExperiments.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Totalt</p>
            <p className="text-2xl font-bold text-gray-900">{experiments.length}</p>
          </div>
        </div>

        {loading && experiments.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          </div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <BeakerIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Inga experiment ännu</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="mt-4 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 font-medium"
            >
              Skapa ditt första experiment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Experiments */}
            {activeExperiments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Pågående experiment</h2>
                <div className="space-y-4">
                  {activeExperiments.map(exp => (
                    <ABTestCard
                      key={exp.id}
                      experiment={exp}
                      results={results[exp.id]}
                      onPause={handlePauseExperiment}
                      onStop={handleStopExperiment}
                      onDeclareWinner={handleDeclareWinner}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Draft Experiments */}
            {draftExperiments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Utkast</h2>
                <div className="space-y-4">
                  {draftExperiments.map(exp => (
                    <ABTestCard
                      key={exp.id}
                      experiment={exp}
                      onStart={handleStartExperiment}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Experiments */}
            {completedExperiments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Avslutade</h2>
                <div className="space-y-4">
                  {completedExperiments.map(exp => (
                    <ABTestCard
                      key={exp.id}
                      experiment={exp}
                      results={results[exp.id]}
                      onStart={exp.status === 'paused' ? handleStartExperiment : null}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* New Experiment Modal */}
        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Nytt experiment</h2>
                  <button
                    onClick={() => setShowNewForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateExperiment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Namn *
                  </label>
                  <input
                    type="text"
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="t.ex. pricing_page_v2"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beskrivning
                  </label>
                  <textarea
                    value={newExperiment.description}
                    onChange={(e) => setNewExperiment(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Vad testar vi?"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mätvärde *
                  </label>
                  <select
                    value={newExperiment.metric}
                    onChange={(e) => setNewExperiment(prev => ({ ...prev, metric: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="premium_conversion">Premium-konvertering</option>
                    <option value="signup">Registrering</option>
                    <option value="meal_plan_created">Skapad matplan</option>
                    <option value="button_click">Knappklick</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trafikandel
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={newExperiment.trafficPercentage}
                      onChange={(e) => setNewExperiment(prev => ({ ...prev, trafficPercentage: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-700 w-12">
                      {newExperiment.trafficPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Andel av användare som inkluderas i experimentet
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newExperiment.name}
                    className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 font-medium disabled:opacity-50"
                  >
                    Skapa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

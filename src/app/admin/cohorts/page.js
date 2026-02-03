'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CohortChart from '@/components/admin/CohortChart'
import { UsersIcon, ArrowPathIcon } from '@/components/admin/Icons'

export default function CohortsPage() {
  const [cohortData, setCohortData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retentionType, setRetentionType] = useState('active') // 'active', 'premium'

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/analytics/cohorts?type=${retentionType}`)

      if (res.ok) {
        const data = await res.json()
        setCohortData(data.cohorts || [])
      } else {
        setError('Kunde inte hämta kohortdata')
      }
    } catch (err) {
      console.error('Error fetching cohort data:', err)
      setError('Kunde inte hämta kohortdata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [retentionType])

  // Calculate summary statistics
  const avgMonth1Retention = cohortData.length > 0
    ? Math.round(cohortData.filter(c => c.months?.[1] !== undefined).reduce((sum, c) => sum + c.months[1], 0) /
      cohortData.filter(c => c.months?.[1] !== undefined).length)
    : 0

  const avgMonth3Retention = cohortData.length > 0
    ? Math.round(cohortData.filter(c => c.months?.[3] !== undefined).reduce((sum, c) => sum + c.months[3], 0) /
      cohortData.filter(c => c.months?.[3] !== undefined).length)
    : 0

  const totalUsers = cohortData.reduce((sum, c) => sum + (c.size || 0), 0)

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
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                Kohortanalys
              </h1>
              <p className="text-gray-500 text-sm">Analysera användarbeteende över tid</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Retention type selector */}
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setRetentionType('active')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  retentionType === 'active'
                    ? 'bg-violet-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Aktiva användare
              </button>
              <button
                onClick={() => setRetentionType('premium')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  retentionType === 'premium'
                    ? 'bg-violet-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Premium-retention
              </button>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Uppdatera
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Totalt analyserade</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalUsers.toLocaleString('sv-SE')}
            </p>
            <p className="text-xs text-gray-500">användare</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Kohorter</p>
            <p className="text-2xl font-bold text-gray-900">
              {cohortData.length}
            </p>
            <p className="text-xs text-gray-500">månader</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Månad 1 retention</p>
            <p className="text-2xl font-bold text-violet-600">
              {avgMonth1Retention}%
            </p>
            <p className="text-xs text-gray-500">genomsnitt</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Månad 3 retention</p>
            <p className="text-2xl font-bold text-violet-600">
              {avgMonth3Retention}%
            </p>
            <p className="text-xs text-gray-500">genomsnitt</p>
          </div>
        </div>

        {/* Cohort Chart */}
        <CohortChart
          data={cohortData}
          loading={loading}
          maxMonths={6}
        />

        {/* Insights */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          {/* Best Performing Cohort */}
          {cohortData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Bäst presterande kohort</h3>
              {(() => {
                const best = [...cohortData]
                  .filter(c => c.months?.[1] !== undefined)
                  .sort((a, b) => (b.months?.[1] || 0) - (a.months?.[1] || 0))[0]

                if (!best) return <p className="text-gray-500">Ingen data tillgänglig</p>

                return (
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(best.month).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {best.size} användare, {best.months?.[1]}% retention efter 1 månad
                    </p>
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${best.months?.[1] || 0}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Tips */}
          <div className="bg-violet-50 rounded-xl border border-violet-200 p-6">
            <h3 className="font-semibold text-violet-900 mb-4">Tips för att förbättra retention</h3>
            <ul className="space-y-2 text-sm text-violet-800">
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-1">•</span>
                <span>Skicka välkomstmail med tips inom 24h efter registrering</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-1">•</span>
                <span>Påminn användare som inte skapat matplan efter 3 dagar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-1">•</span>
                <span>Erbjud personliga receptrekommendationer baserat på preferenser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 mt-1">•</span>
                <span>Skapa veckovisa sammanfattningar för att öka engagemang</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Link
            href="/admin/revenue"
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <p className="font-medium text-gray-900">Intäkter</p>
            <p className="text-sm text-gray-500">Se MRR och LTV</p>
          </Link>
          <Link
            href="/admin/analytics"
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <p className="font-medium text-gray-900">Detaljerad statistik</p>
            <p className="text-sm text-gray-500">Användarbeteende</p>
          </Link>
          <Link
            href="/admin/experiments"
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
          >
            <p className="font-medium text-gray-900">A/B-tester</p>
            <p className="text-sm text-gray-500">Optimera konvertering</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

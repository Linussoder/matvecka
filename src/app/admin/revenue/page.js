'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import RevenueDashboard from '@/components/admin/RevenueDashboard'
import { CreditCardIcon, ArrowPathIcon } from '@/components/admin/Icons'

export default function RevenuePage() {
  const [metrics, setMetrics] = useState(null)
  const [trend, setTrend] = useState([])
  const [churnAnalysis, setChurnAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [metricsRes, trendRes, churnRes] = await Promise.all([
        fetch('/api/admin/analytics/revenue'),
        fetch('/api/admin/analytics/revenue/trend'),
        fetch('/api/admin/analytics/revenue/churn')
      ])

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data.metrics)
      }

      if (trendRes.ok) {
        const data = await trendRes.json()
        setTrend(data.trend || [])
      }

      if (churnRes.ok) {
        const data = await churnRes.json()
        setChurnAnalysis(data.analysis)
      }
    } catch (err) {
      console.error('Error fetching revenue data:', err)
      setError('Kunde inte hämta intäktsdata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
                <div className="p-2 bg-green-500 rounded-lg">
                  <CreditCardIcon className="w-6 h-6 text-white" />
                </div>
                Intäkter
              </h1>
              <p className="text-gray-500 text-sm">MRR, ARR, LTV och churn-analys</p>
            </div>
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Revenue Dashboard Component */}
        <RevenueDashboard
          metrics={metrics}
          trend={trend}
          loading={loading}
        />

        {/* Churn Analysis */}
        {churnAnalysis && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Churn-analys (senaste 30 dagarna)</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{churnAnalysis.totalChurned}</p>
                  <p className="text-sm text-red-700">Avslutade prenumerationer</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">
                    {new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(churnAnalysis.revenueLost)}
                  </p>
                  <p className="text-sm text-red-700">Förlorad intäkt</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-700">{churnAnalysis.period}</p>
                  <p className="text-sm text-gray-600">Period</p>
                </div>
              </div>

              {/* Churn Reasons */}
              {churnAnalysis.reasons && churnAnalysis.reasons.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Anledningar till uppsägning</h4>
                  <div className="space-y-2">
                    {churnAnalysis.reasons.map((reason, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{reason.reason}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {reason.count} ({reason.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-400 rounded-full"
                              style={{ width: `${reason.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Link
            href="/admin/users?filter=premium"
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <p className="font-medium text-gray-900">Premium-användare</p>
            <p className="text-sm text-gray-500">Se alla betalande kunder</p>
          </Link>
          <Link
            href="/admin/users?filter=churned"
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
          >
            <p className="font-medium text-gray-900">Avhoppade kunder</p>
            <p className="text-sm text-gray-500">Analysera churn</p>
          </Link>
          <Link
            href="/admin/cohorts"
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <p className="font-medium text-gray-900">Kohortanalys</p>
            <p className="text-sm text-gray-500">Se retention över tid</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

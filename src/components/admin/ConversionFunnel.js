'use client'

import { useState, useEffect } from 'react'

/**
 * Conversion funnel visualization
 * Shows user journey from visitors to premium subscribers
 */
export default function ConversionFunnel({
  data = null,
  loading = false,
  onPeriodChange = null,
  className = ''
}) {
  const [period, setPeriod] = useState('30d')

  const periods = [
    { value: '7d', label: '7 dagar' },
    { value: '30d', label: '30 dagar' },
    { value: '90d', label: '90 dagar' },
    { value: 'all', label: 'Alla' }
  ]

  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange(period)
    }
  }, [period, onPeriodChange])

  // Default stages if no data provided
  const defaultStages = [
    { id: 'visitors', label: 'Besökare', count: 0, color: 'bg-blue-500' },
    { id: 'signups', label: 'Registreringar', count: 0, color: 'bg-indigo-500' },
    { id: 'activated', label: 'Aktiverade', count: 0, color: 'bg-violet-500' },
    { id: 'meal_plan', label: 'Skapat matplan', count: 0, color: 'bg-purple-500' },
    { id: 'premium', label: 'Premium', count: 0, color: 'bg-amber-500' }
  ]

  const stages = data?.stages || defaultStages
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  // Calculate drop-off rates between stages
  const getDropOff = (currentIndex) => {
    if (currentIndex === 0) return null
    const current = stages[currentIndex].count
    const previous = stages[currentIndex - 1].count
    if (previous === 0) return 0
    const dropOff = ((previous - current) / previous) * 100
    return Math.round(dropOff * 10) / 10
  }

  // Calculate conversion rate from first to last stage
  const getConversionRate = (stageIndex) => {
    if (stages[0].count === 0) return 0
    return Math.round((stages[stageIndex].count / stages[0].count) * 1000) / 10
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Konverteringstratt</h3>
          <p className="text-sm text-gray-500">Användarresa från besök till premium</p>
        </div>

        {/* Period selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                period === p.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const widthPercent = (stage.count / maxCount) * 100
              const dropOff = getDropOff(index)
              const conversionRate = getConversionRate(index)

              return (
                <div key={stage.id}>
                  {/* Drop-off indicator */}
                  {dropOff !== null && dropOff > 0 && (
                    <div className="flex items-center gap-2 mb-2 ml-4">
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                      </svg>
                      <span className="text-xs text-red-500 font-medium">
                        -{dropOff}% tappas
                      </span>
                    </div>
                  )}

                  {/* Stage bar */}
                  <div className="flex items-center gap-4">
                    {/* Label */}
                    <div className="w-32 text-right">
                      <p className="text-sm font-medium text-gray-900">{stage.label}</p>
                      <p className="text-xs text-gray-500">{conversionRate}%</p>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 relative">
                      <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className={`h-full ${stage.color} transition-all duration-500 ease-out flex items-center justify-end pr-3`}
                          style={{ width: `${Math.max(widthPercent, 2)}%` }}
                        >
                          {widthPercent > 15 && (
                            <span className="text-white text-sm font-semibold">
                              {stage.count.toLocaleString('sv-SE')}
                            </span>
                          )}
                        </div>
                      </div>
                      {widthPercent <= 15 && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-700">
                          {stage.count.toLocaleString('sv-SE')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Insights */}
        {!loading && data?.insight && (
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Insikt</p>
                <p className="text-sm text-amber-700 mt-1">{data.insight}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {stages.length > 0 ? getConversionRate(stages.length - 1) : 0}%
          </p>
          <p className="text-xs text-gray-500">Total konvertering</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {stages.length > 1 && stages[0].count > 0
              ? Math.round(((stages[0].count - stages[1].count) / stages[0].count) * 100)
              : 0}%
          </p>
          <p className="text-xs text-gray-500">Största tappet</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {stages.length > 0 ? stages[stages.length - 1].count : 0}
          </p>
          <p className="text-xs text-gray-500">Konverterade</p>
        </div>
      </div>
    </div>
  )
}

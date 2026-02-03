'use client'

import { useState } from 'react'

/**
 * A/B Test experiment card with results visualization
 */
export default function ABTestCard({
  experiment,
  results = null,
  onStart = null,
  onPause = null,
  onStop = null,
  onDeclareWinner = null,
  loading = false
}) {
  const [expanded, setExpanded] = useState(false)

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    running: 'bg-green-100 text-green-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-blue-100 text-blue-700'
  }

  const statusLabels = {
    draft: 'Utkast',
    running: 'Pågående',
    paused: 'Pausad',
    completed: 'Avslutad'
  }

  // Calculate days running
  const getDaysRunning = () => {
    if (!experiment.start_date) return 0
    const start = new Date(experiment.start_date)
    const end = experiment.end_date ? new Date(experiment.end_date) : new Date()
    return Math.floor((end - start) / (1000 * 60 * 60 * 24))
  }

  // Get the control variant results
  const controlResult = results?.results?.find(r => r.variantId === 'control')

  // Get variant results (non-control)
  const variantResults = results?.results?.filter(r => r.variantId !== 'control') || []

  // Find best performing variant
  const bestVariant = results?.results?.reduce((best, current) => {
    if (!best || current.conversionRate > best.conversionRate) return current
    return best
  }, null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 truncate">{experiment.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[experiment.status]}`}>
              {statusLabels[experiment.status]}
            </span>
          </div>
          {experiment.description && (
            <p className="text-sm text-gray-500 mt-1">{experiment.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Mätvärde: {experiment.metric}</span>
            <span>Trafik: {experiment.traffic_percentage}%</span>
            {experiment.start_date && (
              <span>Dag {getDaysRunning()}</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Quick Stats */}
      {results && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">{results.totalUsers}</p>
            <p className="text-xs text-gray-500">Deltagare</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{controlResult?.conversionRate || 0}%</p>
            <p className="text-xs text-gray-500">Control</p>
          </div>
          {variantResults[0] && (
            <div>
              <p className={`text-lg font-bold ${
                variantResults[0].conversionRate > (controlResult?.conversionRate || 0)
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {variantResults[0].conversionRate}%
              </p>
              <p className="text-xs text-gray-500">{variantResults[0].variantId}</p>
            </div>
          )}
          <div>
            <p className={`text-lg font-bold ${
              variantResults[0]?.significant ? 'text-green-600' : 'text-amber-600'
            }`}>
              {variantResults[0]?.confidence || 0}%
            </p>
            <p className="text-xs text-gray-500">Konfidens</p>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="px-6 py-4 border-t border-gray-200 space-y-4">
          {/* Variants Comparison */}
          {results?.results && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Varianter</h4>

              {results.results.map(variant => {
                const isControl = variant.variantId === 'control'
                const isWinner = variant.variantId === bestVariant?.variantId
                const improvement = isControl ? null :
                  controlResult?.conversionRate > 0
                    ? ((variant.conversionRate - controlResult.conversionRate) / controlResult.conversionRate * 100).toFixed(1)
                    : 0

                return (
                  <div
                    key={variant.variantId}
                    className={`p-4 rounded-lg border ${
                      isWinner && experiment.status === 'completed'
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {isControl ? 'Control (A)' : `Variant ${variant.variantId.toUpperCase()}`}
                        </span>
                        {isWinner && experiment.winner_variant === variant.variantId && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                            Vinnare
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {variant.users} deltagare
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Konverteringar</p>
                        <p className="font-semibold">{variant.conversions}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Konverteringsgrad</p>
                        <p className="font-semibold">{variant.conversionRate}%</p>
                      </div>
                      {!isControl && (
                        <div>
                          <p className="text-gray-500">vs Control</p>
                          <p className={`font-semibold ${
                            parseFloat(improvement) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(improvement) > 0 ? '+' : ''}{improvement}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confidence bar */}
                    {!isControl && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Statistisk signifikans</span>
                          <span className={variant.significant ? 'text-green-600' : 'text-amber-600'}>
                            {variant.confidence}% konfidens
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              variant.confidence >= 95 ? 'bg-green-500' :
                              variant.confidence >= 80 ? 'bg-amber-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${variant.confidence}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>0%</span>
                          <span className="text-green-500">95% (signifikant)</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Significance Note */}
          {variantResults[0] && !variantResults[0].significant && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Ännu ej signifikant</p>
                  <p className="text-sm text-amber-700">
                    Testet behöver fler deltagare för att nå 95% konfidens. Fortsätt köra testet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            {experiment.status === 'draft' && onStart && (
              <button
                onClick={() => onStart(experiment.id)}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
              >
                Starta test
              </button>
            )}

            {experiment.status === 'running' && onPause && (
              <button
                onClick={() => onPause(experiment.id)}
                disabled={loading}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50"
              >
                Pausa
              </button>
            )}

            {experiment.status === 'paused' && onStart && (
              <button
                onClick={() => onStart(experiment.id)}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
              >
                Återuppta
              </button>
            )}

            {(experiment.status === 'running' || experiment.status === 'paused') && onStop && (
              <button
                onClick={() => onStop(experiment.id)}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50"
              >
                Avsluta test
              </button>
            )}

            {experiment.status === 'running' && variantResults[0]?.significant && onDeclareWinner && (
              <button
                onClick={() => onDeclareWinner(experiment.id, bestVariant?.variantId)}
                disabled={loading}
                className="px-4 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 disabled:opacity-50"
              >
                Utse vinnare
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'

/**
 * Cohort retention chart (matrix visualization)
 * Shows user retention by signup month
 */
export default function CohortChart({
  data = [],
  loading = false,
  maxMonths = 6,
  className = ''
}) {
  const [hoveredCell, setHoveredCell] = useState(null)

  // Get color based on retention rate
  const getRetentionColor = (rate) => {
    if (rate >= 70) return 'bg-green-500 text-white'
    if (rate >= 50) return 'bg-green-400 text-white'
    if (rate >= 30) return 'bg-green-300 text-green-900'
    if (rate >= 10) return 'bg-green-200 text-green-900'
    return 'bg-green-100 text-green-800'
  }

  // Format month for display
  const formatMonth = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('sv-SE', { month: 'short', year: '2-digit' })
  }

  // Calculate average retention for each month offset
  const getAverageRetention = (monthOffset) => {
    const validCohorts = data.filter(c => c.months && c.months[monthOffset] !== undefined)
    if (validCohorts.length === 0) return null
    const sum = validCohorts.reduce((acc, c) => acc + c.months[monthOffset], 0)
    return Math.round(sum / validCohorts.length)
  }

  // Generate month headers (Month 0, Month 1, etc.)
  const monthHeaders = Array.from({ length: maxMonths + 1 }, (_, i) => i)

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Kohortanalys</h3>
        <p className="text-sm text-gray-500">Retention per registreringsmånad</p>
      </div>

      {/* Chart */}
      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
            <p>Ingen kohortdata tillgänglig</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-medium text-gray-600 bg-gray-50 rounded-tl-lg">
                  Kohort
                </th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 bg-gray-50">
                  Storlek
                </th>
                {monthHeaders.map(month => (
                  <th
                    key={month}
                    className={`text-center py-2 px-3 font-medium text-gray-600 bg-gray-50 ${
                      month === maxMonths ? 'rounded-tr-lg' : ''
                    }`}
                  >
                    {month === 0 ? 'Mån 0' : `Mån ${month}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((cohort, rowIndex) => (
                <tr key={cohort.month} className="border-t border-gray-100">
                  <td className="py-2 px-3 font-medium text-gray-900 whitespace-nowrap">
                    {formatMonth(cohort.month)}
                  </td>
                  <td className="py-2 px-3 text-center text-gray-600">
                    {cohort.size?.toLocaleString('sv-SE') || 0}
                  </td>
                  {monthHeaders.map(monthOffset => {
                    const retention = cohort.months?.[monthOffset]
                    const hasData = retention !== undefined && retention !== null

                    return (
                      <td
                        key={monthOffset}
                        className="py-2 px-1 text-center"
                        onMouseEnter={() => setHoveredCell({ row: rowIndex, col: monthOffset })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {hasData ? (
                          <div
                            className={`inline-flex items-center justify-center w-12 h-8 rounded ${getRetentionColor(retention)} transition-transform ${
                              hoveredCell?.row === rowIndex && hoveredCell?.col === monthOffset
                                ? 'scale-110 shadow-lg'
                                : ''
                            }`}
                          >
                            <span className="text-xs font-semibold">{retention}%</span>
                          </div>
                        ) : (
                          <div className="w-12 h-8 inline-flex items-center justify-center">
                            <span className="text-gray-300">-</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Average row */}
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="py-2 px-3 font-semibold text-gray-900">Genomsnitt</td>
                <td className="py-2 px-3 text-center text-gray-600">-</td>
                {monthHeaders.map(monthOffset => {
                  const avg = getAverageRetention(monthOffset)
                  return (
                    <td key={monthOffset} className="py-2 px-1 text-center">
                      {avg !== null ? (
                        <div className={`inline-flex items-center justify-center w-12 h-8 rounded font-bold ${getRetentionColor(avg)}`}>
                          <span className="text-xs">{avg}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">Retention:</span>
            <div className="flex items-center gap-2">
              <span className="w-6 h-4 rounded bg-green-100"></span>
              <span className="text-xs text-gray-600">&lt;10%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-4 rounded bg-green-200"></span>
              <span className="text-xs text-gray-600">10-29%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-4 rounded bg-green-300"></span>
              <span className="text-xs text-gray-600">30-49%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-4 rounded bg-green-400"></span>
              <span className="text-xs text-gray-600">50-69%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-4 rounded bg-green-500"></span>
              <span className="text-xs text-gray-600">70%+</span>
            </div>
          </div>

          {data.length > 0 && (
            <div className="text-sm text-gray-600">
              {data.length} kohorter analyserade
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

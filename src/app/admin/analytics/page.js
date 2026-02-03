'use client'

import { useState, useEffect } from 'react'

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('14') // days

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?days=${dateRange}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda analytics')
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    if (!analytics) return

    const rows = [
      ['Metric', 'Value'],
      ['Total Users', analytics.totalUsers],
      ['Active Users (7d)', analytics.activeUsers],
      ...Object.entries(analytics.productsByStore).map(([store, count]) => [`Products - ${store}`, count]),
    ]

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `matvecka-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const storeColors = {
    'ICA': { bg: 'bg-red-500', text: 'text-red-500' },
    'Coop': { bg: 'bg-green-500', text: 'text-green-500' },
    'Willys': { bg: 'bg-orange-500', text: 'text-orange-500' },
    'Hemköp': { bg: 'bg-blue-500', text: 'text-blue-500' },
    'City Gross': { bg: 'bg-purple-500', text: 'text-purple-500' },
  }

  // Generate days for chart based on date range
  const days = []
  for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().split('T')[0])
  }

  const today = new Date().toISOString().split('T')[0]
  const todaySignups = analytics?.userSignups?.[today] || 0
  const todayMealPlans = analytics?.mealPlansCreated?.[today] || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Statistik och trender för Matvecka
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
          >
            <option value="7">Senaste 7 dagar</option>
            <option value="14">Senaste 14 dagar</option>
            <option value="30">Senaste 30 dagar</option>
            <option value="90">Senaste 90 dagar</option>
          </select>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportera
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt användare</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics?.totalUsers || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Aktiva (7 dagar)</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics?.activeUsers || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analytics?.totalUsers > 0 ? Math.round((analytics.activeUsers / analytics.totalUsers) * 100) : 0}% av alla
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Nya idag</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{todaySignups}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Matplaner idag</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{todayMealPlans}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* User Signups Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-medium text-gray-900 dark:text-white mb-4">Nya användare</h2>
          <div className="h-48 flex items-end gap-1">
            {days.map(date => {
              const count = analytics?.userSignups?.[date] || 0
              const maxCount = Math.max(...Object.values(analytics?.userSignups || { '': 1 }), 1)
              const height = (count / maxCount) * 100

              return (
                <div key={date} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-400 rounded-t hover:bg-blue-600 dark:hover:bg-blue-300 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {date}: {count}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{days[0]?.slice(5)}</span>
            <span>{days[days.length - 1]?.slice(5)}</span>
          </div>
        </div>

        {/* Meal Plans Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-medium text-gray-900 dark:text-white mb-4">Matplaner skapade</h2>
          <div className="h-48 flex items-end gap-1">
            {days.map(date => {
              const count = analytics?.mealPlansCreated?.[date] || 0
              const maxCount = Math.max(...Object.values(analytics?.mealPlansCreated || { '': 1 }), 1)
              const height = (count / maxCount) * 100

              return (
                <div key={date} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-purple-500 dark:bg-purple-400 rounded-t hover:bg-purple-600 dark:hover:bg-purple-300 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {date}: {count}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{days[0]?.slice(5)}</span>
            <span>{days[days.length - 1]?.slice(5)}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Products by Store */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-medium text-gray-900 dark:text-white mb-4">Produkter per butik</h2>
          <div className="space-y-3">
            {Object.entries(analytics?.productsByStore || {}).map(([store, count]) => {
              const total = Object.values(analytics?.productsByStore || {}).reduce((a, b) => a + b, 1)
              const percentage = (count / total) * 100

              return (
                <div key={store}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{store}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${storeColors[store]?.bg || 'bg-gray-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(analytics?.productsByStore || {}).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Inga produkter ännu</p>
            )}
          </div>
        </div>

        {/* Flyer Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-medium text-gray-900 dark:text-white mb-4">Reklamblad status</h2>
          <div className="space-y-3">
            {Object.entries(analytics?.flyerStatus || {}).map(([status, count]) => {
              const statusConfig = {
                'completed': { label: 'Klara', color: 'bg-green-500' },
                'ready': { label: 'Redo', color: 'bg-blue-500' },
                'pending': { label: 'Väntar', color: 'bg-yellow-500' },
              }
              const config = statusConfig[status] || { label: status, color: 'bg-gray-500' }

              return (
                <div key={status} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{config.label}</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{count}</span>
                </div>
              )
            })}
            {Object.keys(analytics?.flyerStatus || {}).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Inga reklamblad ännu</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="font-medium text-gray-900 dark:text-white mb-4">Senaste produkter</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                <th className="pb-3">Produkt</th>
                <th className="pb-3">Butik</th>
                <th className="pb-3 text-right">Pris</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {analytics?.topProducts?.map((product, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm text-gray-900 dark:text-white">{product.name}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      storeColors[product.store]?.bg || 'bg-gray-500'
                    } bg-opacity-20 dark:bg-opacity-30 ${storeColors[product.store]?.text || 'text-gray-700 dark:text-gray-300'}`}>
                      {product.store}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white text-right">{product.price} kr</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
            <p className="py-4 text-sm text-gray-500 dark:text-gray-400 text-center">Inga produkter ännu</p>
          )}
        </div>
      </div>
    </div>
  )
}

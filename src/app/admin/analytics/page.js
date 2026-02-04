'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Icons
const ChartBarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const ChartPieIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
)

const CreditCardIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
)

const UserGroupIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
)

const BeakerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 15.5m14.8-.2l-.71-1.422a2.25 2.25 0 00-1.612-1.28l-1.628-.244M5 15.5l-.71-1.422a2.25 2.25 0 01-1.612-1.28l-1.628-.244M5 15.5v2.756c0 .813.422 1.568 1.116 1.998l1.004.602A2.25 2.25 0 008.25 21h7.5a2.25 2.25 0 001.13-.144l1.004-.602A2.25 2.25 0 0019 18.756V15.5" />
  </svg>
)

// Tab configuration
const TABS = [
  { id: 'overview', label: 'Översikt', icon: ChartBarIcon },
  { id: 'live', label: 'Realtid', icon: ChartPieIcon },
  { id: 'revenue', label: 'Intäkter', icon: CreditCardIcon },
  { id: 'cohorts', label: 'Kohorter', icon: UserGroupIcon },
  { id: 'experiments', label: 'A/B Tester', icon: BeakerIcon },
]

export default function AdminAnalyticsPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'overview')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('14')

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Statistik och trender för Matvecka</p>
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
              >
                <option value="7">Senaste 7 dagar</option>
                <option value="14">Senaste 14 dagar</option>
                <option value="30">Senaste 30 dagar</option>
                <option value="90">Senaste 90 dagar</option>
              </select>

              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportera
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 -mb-px overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Totalt användare</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics?.totalUsers || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Aktiva (7 dagar)</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics?.activeUsers || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {analytics?.totalUsers > 0 ? Math.round((analytics.activeUsers / analytics.totalUsers) * 100) : 0}% av alla
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Nya idag</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{todaySignups}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Matplaner idag</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{todayMealPlans}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* User Signups Chart */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
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
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {date}: {count}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-slate-400">
                      <span>{days[0]?.slice(5)}</span>
                      <span>{days[days.length - 1]?.slice(5)}</span>
                    </div>
                  </div>

                  {/* Meal Plans Chart */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
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
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {date}: {count}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-slate-400">
                      <span>{days[0]?.slice(5)}</span>
                      <span>{days[days.length - 1]?.slice(5)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Products by Store */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
                    <h2 className="font-medium text-gray-900 dark:text-white mb-4">Produkter per butik</h2>
                    <div className="space-y-3">
                      {Object.entries(analytics?.productsByStore || {}).map(([store, count]) => {
                        const total = Object.values(analytics?.productsByStore || {}).reduce((a, b) => a + b, 1)
                        const percentage = (count / total) * 100

                        return (
                          <div key={store}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{store}</span>
                              <span className="text-sm text-gray-500 dark:text-slate-400">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${storeColors[store]?.bg || 'bg-gray-500'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      {Object.keys(analytics?.productsByStore || {}).length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-slate-400">Inga produkter ännu</p>
                      )}
                    </div>
                  </div>

                  {/* Flyer Status */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4">
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
                          <div key={status} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${config.color}`} />
                              <span className="text-sm text-gray-700 dark:text-slate-300">{config.label}</span>
                            </div>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">{count}</span>
                          </div>
                        )
                      })}
                      {Object.keys(analytics?.flyerStatus || {}).length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-slate-400">Inga reklamblad ännu</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Live Tab */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Realtidsdata</h2>
              </div>
              <p className="text-gray-500 dark:text-slate-400 mb-6">
                Se vad som händer på sajten just nu i realtid.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Aktiva just nu</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Senaste timmen</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Sidvisningar/min</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Konverteringar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Intäkter</h2>
              <p className="text-gray-500 dark:text-slate-400 mb-6">
                Översikt över intäkter från prenumerationer och andra källor.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-600 dark:text-green-400">MRR</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">-- kr</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400">ARR</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">-- kr</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-600 dark:text-purple-400">LTV</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">-- kr</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cohorts Tab */}
        {activeTab === 'cohorts' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kohortanalys</h2>
              <p className="text-gray-500 dark:text-slate-400 mb-6">
                Analysera användarretention över tid grupperat efter registreringsvecka.
              </p>
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p>Kohortdata laddas...</p>
              </div>
            </div>
          </div>
        )}

        {/* Experiments Tab */}
        {activeTab === 'experiments' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">A/B Tester</h2>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                  Nytt test
                </button>
              </div>
              <p className="text-gray-500 dark:text-slate-400 mb-6">
                Hantera och analysera A/B-tester för att optimera konverteringar.
              </p>
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                <BeakerIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p>Inga aktiva tester</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

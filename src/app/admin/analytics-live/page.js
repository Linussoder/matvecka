'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StarIcon, ChartBarIcon, ArrowPathIcon, UserGroupIcon, ClockIcon, SparklesIcon, UserIcon } from '@/components/admin/Icons'
import SwedenMap from '@/components/admin/SwedenMap'
import ActivityFeed from '@/components/admin/ActivityFeed'

// Utensils/Plate icon for meal plans
const UtensilsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12 10.5v2.25" />
  </svg>
)

export default function LiveAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/realtime')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setAnalytics(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()

    // Auto-refresh every 30 seconds
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchAnalytics, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchAnalytics, autoRefresh])

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Just nu'
    if (diff < 3600) return `${Math.floor(diff / 60)} min sedan`
    if (diff < 86400) return `${Math.floor(diff / 3600)} tim sedan`
    return date.toLocaleDateString('sv-SE')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Tillbaka
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                Live Analytics
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </h1>
              <p className="text-gray-500 text-sm">
                Realtidsöverblick av appaktivitet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              Auto-uppdatera
            </label>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
<ArrowPathIcon className="w-4 h-4 inline mr-1" /> Uppdatera
            </button>
            {lastUpdate && (
              <span className="text-xs text-gray-400">
                Uppdaterad: {lastUpdate.toLocaleTimeString('sv-SE')}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {analytics && (
          <>
            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Online nu</p>
                    <p className="text-4xl font-bold">{analytics.realtime.onlineNow}</p>
                  </div>
                  <UserGroupIcon className="w-10 h-10 text-green-100" />
                </div>
                <p className="text-green-200 text-xs mt-2">Aktiva senaste 15 min</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Matveckor idag</p>
                    <p className="text-4xl font-bold">{analytics.realtime.mealPlansToday}</p>
                  </div>
                  <UtensilsIcon className="w-10 h-10 text-blue-100" />
                </div>
                <p className="text-blue-200 text-xs mt-2">{analytics.weekly.mealPlansWeek} denna vecka</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Nya idag</p>
                    <p className="text-4xl font-bold">{analytics.realtime.newSignupsToday}</p>
                  </div>
                  <SparklesIcon className="w-10 h-10 text-purple-100" />
                </div>
                <p className="text-purple-200 text-xs mt-2">{analytics.weekly.newSignupsWeek} denna vecka</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">Premium</p>
                    <p className="text-4xl font-bold">{analytics.totals.premiumUsers}</p>
                  </div>
                  <StarIcon className="w-10 h-10 text-amber-100" />
                </div>
                <p className="text-amber-200 text-xs mt-2">{analytics.totals.conversionRate}% konvertering</p>
              </div>
            </div>

            {/* Activity Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Hourly Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Aktivitet per timme (24h)</h3>
                <div className="flex items-end gap-1 h-32">
                  {analytics.daily.activityByHour.map((count, hour) => {
                    const maxCount = Math.max(...analytics.daily.activityByHour, 1)
                    const height = (count / maxCount) * 100
                    const isPeak = hour === analytics.daily.peakHour
                    return (
                      <div
                        key={hour}
                        className="flex-1 flex flex-col items-center group"
                      >
                        <div
                          className={`w-full rounded-t transition-all ${
                            isPeak ? 'bg-green-500' : 'bg-gray-200 group-hover:bg-gray-300'
                          }`}
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${hour}:00 - ${count} användare`}
                        ></div>
                        {hour % 4 === 0 && (
                          <span className="text-xs text-gray-400 mt-1">{hour}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  <ClockIcon className="w-4 h-4 inline mr-1" /> Högst aktivitet kl {analytics.daily.peakHour}:00
                </p>
              </div>

              {/* Weekly Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Aktivitet per dag (7 dagar)</h3>
                <div className="flex items-end gap-2 h-32">
                  {analytics.weekly.activityByDay.map((day, index) => {
                    const maxCount = Math.max(...analytics.weekly.activityByDay.map(d => d.count), 1)
                    const height = (day.count / maxCount) * 100
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-blue-200 hover:bg-blue-300 rounded-t transition-all"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${day.name} - ${day.count} användare`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2">{day.name}</span>
                        <span className="text-xs text-gray-400">{day.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Geographic Map */}
            <div className="mb-6">
              <SwedenMap
                data={analytics.regionsMap || {
                  stockholm: analytics.regions?.Stockholm || 0,
                  vastra_gotaland: analytics.regions?.['Västra Götaland'] || 0,
                  skane: analytics.regions?.Skåne || 0,
                  ostergotland: analytics.regions?.Östergötland || 0,
                  uppsala: analytics.regions?.Uppsala || 0,
                  jonkoping: analytics.regions?.Jönköping || 0,
                  halland: analytics.regions?.Halland || 0,
                  orebro: analytics.regions?.Örebro || 0,
                  gavleborg: analytics.regions?.Gävleborg || 0,
                  dalarna: analytics.regions?.Dalarna || 0,
                  vasterbotten: analytics.regions?.Västerbotten || 0,
                  norrbotten: analytics.regions?.Norrbotten || 0
                }}
                onRegionClick={(id, name, count) => {
                  console.log(`Clicked ${name}: ${count} users`)
                }}
              />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversion Funnel */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Konverteringstratt</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Besökare', value: analytics.funnel.visitors, color: 'bg-gray-200' },
                    { label: 'Registrerade', value: analytics.funnel.signups, color: 'bg-blue-200' },
                    { label: 'Skapat matvecka', value: analytics.funnel.activatedMealPlan, color: 'bg-green-200' },
                    { label: 'Premium', value: analytics.funnel.premium, color: 'bg-amber-200' }
                  ].map((step, index) => {
                    const maxValue = analytics.funnel.visitors || 1
                    const width = (step.value / maxValue) * 100
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{step.label}</span>
                          <span className="font-medium">{step.value}</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className={`h-full ${step.color} transition-all`}
                            style={{ width: `${width}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Real-time Activity Feed */}
              <ActivityFeed
                maxItems={20}
                showHeader={true}
                className="lg:col-span-2"
              />
            </div>

            {/* Summary Stats */}
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sammanfattning</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{analytics.totals.totalUsers}</p>
                  <p className="text-sm text-gray-500">Totala användare</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{analytics.totals.premiumUsers}</p>
                  <p className="text-sm text-gray-500">Premium-användare</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{analytics.weekly.newSignupsWeek}</p>
                  <p className="text-sm text-gray-500">Nya denna vecka</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{analytics.weekly.newPremiumThisWeek}</p>
                  <p className="text-sm text-gray-500">Nya premium denna vecka</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

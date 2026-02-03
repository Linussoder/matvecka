'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, ClockIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@/components/admin/Icons'

export default function ApiUsagePage() {
  const [stats, setStats] = useState(null)
  const [slowQueries, setSlowQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    fetchStats()
  }, [dateRange])

  useEffect(() => {
    if (activeTab === 'slow') {
      fetchSlowQueries()
    }
  }, [activeTab])

  async function fetchStats() {
    try {
      setLoading(true)
      const startDate = getStartDate(dateRange)
      const params = startDate ? `?startDate=${startDate}` : ''
      const res = await fetch(`/api/admin/api-usage${params}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSlowQueries() {
    try {
      const res = await fetch('/api/admin/api-usage/slow?threshold=3000')
      const data = await res.json()
      if (data.success) {
        setSlowQueries(data.slowQueries)
      }
    } catch (error) {
      console.error('Error fetching slow queries:', error)
    }
  }

  function getStartDate(range) {
    const now = new Date()
    switch (range) {
      case '24h':
        return new Date(now - 24 * 60 * 60 * 1000).toISOString()
      case '7d':
        return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return null
    }
  }

  function formatCost(cost) {
    return `$${cost.toFixed(2)}`
  }

  function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const tabs = [
    { id: 'overview', label: 'Översikt' },
    { id: 'endpoints', label: 'Per Endpoint' },
    { id: 'cost', label: 'Kostnadsanalys' },
    { id: 'slow', label: 'Långsamma Frågor' },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            API-användning
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Övervaka Claude API-användning, tokens och kostnader
          </p>
        </div>

        {/* Date Range Selector */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="24h">Senaste 24h</option>
          <option value="7d">Senaste 7 dagar</option>
          <option value="30d">Senaste 30 dagar</option>
          <option value="all">All tid</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 mt-2">Laddar statistik...</p>
        </div>
      ) : !stats ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Ingen data ännu</h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
            API-användning börjar loggas när Claude API-anrop görs.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={ChartBarIcon}
                  label="Totalt Anrop"
                  value={stats.totalRequests}
                  color="blue"
                />
                <StatCard
                  icon={ChartBarIcon}
                  label="Totalt Tokens"
                  value={formatNumber(stats.totalInputTokens + stats.totalOutputTokens)}
                  subvalue={`${formatNumber(stats.totalInputTokens)} in / ${formatNumber(stats.totalOutputTokens)} ut`}
                  color="purple"
                />
                <StatCard
                  icon={CurrencyDollarIcon}
                  label="Total Kostnad"
                  value={formatCost(stats.totalCost)}
                  color="emerald"
                />
                <StatCard
                  icon={ClockIcon}
                  label="Snitt Svarstid"
                  value={`${stats.avgResponseTime}ms`}
                  subvalue={stats.errorCount > 0 ? `${stats.errorCount} fel` : undefined}
                  color={stats.errorCount > 0 ? 'red' : 'slate'}
                />
              </div>

              {/* Recent Activity Chart (simple representation) */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Användning per dag</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byDay || {}).slice(0, 7).map(([day, data]) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400 w-24">{day}</span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (data.requests / Math.max(...Object.values(stats.byDay).map(d => d.requests))) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 w-20 text-right">
                        {data.requests} anrop
                      </span>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 w-16 text-right">
                        {formatCost(data.cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Logs */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Senaste anrop</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="pb-2 font-medium">Tid</th>
                        <th className="pb-2 font-medium">Endpoint</th>
                        <th className="pb-2 font-medium text-right">Tokens</th>
                        <th className="pb-2 font-medium text-right">Kostnad</th>
                        <th className="pb-2 font-medium text-right">Svarstid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {(stats.recentLogs || []).map((log, i) => (
                        <tr key={log.id || i}>
                          <td className="py-2 text-slate-600 dark:text-slate-400">
                            {new Date(log.created_at).toLocaleString('sv-SE')}
                          </td>
                          <td className="py-2">
                            <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                              {log.endpoint}
                            </code>
                          </td>
                          <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                            {formatNumber(log.input_tokens + log.output_tokens)}
                          </td>
                          <td className="py-2 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCost(parseFloat(log.cost_usd || 0))}
                          </td>
                          <td className={`py-2 text-right ${log.response_time_ms > 3000 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                            {log.response_time_ms}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Endpoints Tab */}
          {activeTab === 'endpoints' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Användning per Endpoint</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="pb-2 font-medium">Endpoint</th>
                      <th className="pb-2 font-medium text-right">Anrop</th>
                      <th className="pb-2 font-medium text-right">Tokens</th>
                      <th className="pb-2 font-medium text-right">Kostnad</th>
                      <th className="pb-2 font-medium text-right">Snitt Tid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {Object.entries(stats.byEndpoint || {})
                      .sort((a, b) => b[1].requests - a[1].requests)
                      .map(([endpoint, data]) => (
                        <tr key={endpoint}>
                          <td className="py-3">
                            <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                              {endpoint}
                            </code>
                          </td>
                          <td className="py-3 text-right text-slate-900 dark:text-white font-medium">
                            {data.requests}
                          </td>
                          <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                            {formatNumber(data.tokens)}
                          </td>
                          <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCost(data.cost)}
                          </td>
                          <td className={`py-3 text-right ${data.avgTime > 3000 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                            {data.avgTime}ms
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cost Tab */}
          {activeTab === 'cost' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Kostnad</h4>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCost(stats.totalCost)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm text-slate-600 dark:text-slate-400 mb-1">Kostnad/Anrop (snitt)</h4>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {formatCost(stats.totalRequests > 0 ? stats.totalCost / stats.totalRequests : 0)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm text-slate-600 dark:text-slate-400 mb-1">Projekterad Månadskostnad</h4>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCost(dateRange === '24h' ? stats.totalCost * 30 : dateRange === '7d' ? stats.totalCost * 4.3 : stats.totalCost)}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Kostnad per Modell</h3>
                <div className="space-y-4">
                  {Object.entries(stats.byModel || {}).map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between">
                      <div>
                        <code className="text-sm text-slate-900 dark:text-white">{model}</code>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {data.requests} anrop • {formatNumber(data.tokens)} tokens
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCost(data.cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Slow Queries Tab */}
          {activeTab === 'slow' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Långsamma frågor (&gt;3s)</h3>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {slowQueries.length} frågor
                </span>
              </div>
              {slowQueries.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  Inga långsamma frågor hittades.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="pb-2 font-medium">Tid</th>
                        <th className="pb-2 font-medium">Endpoint</th>
                        <th className="pb-2 font-medium text-right">Svarstid</th>
                        <th className="pb-2 font-medium text-right">Tokens</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {slowQueries.map((log, i) => (
                        <tr key={log.id || i}>
                          <td className="py-2 text-slate-600 dark:text-slate-400">
                            {new Date(log.created_at).toLocaleString('sv-SE')}
                          </td>
                          <td className="py-2">
                            <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                              {log.endpoint}
                            </code>
                          </td>
                          <td className="py-2 text-right font-medium text-red-500">
                            {log.response_time_ms}ms
                          </td>
                          <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                            {formatNumber(log.input_tokens + log.output_tokens)}
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              log.status_code === 200
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {log.status_code}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subvalue, color = 'slate' }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    slate: 'bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subvalue && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subvalue}</p>
          )}
        </div>
      </div>
    </div>
  )
}

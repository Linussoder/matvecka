'use client'

import { useState } from 'react'
import { formatCurrency, formatChange } from '@/lib/revenue-analytics'

/**
 * Revenue dashboard with MRR, ARR, LTV, Churn metrics
 */
export default function RevenueDashboard({
  metrics = null,
  trend = [],
  loading = false,
  className = ''
}) {
  const [chartView, setChartView] = useState('mrr') // 'mrr', 'subscribers', 'churn'

  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...trend.map(d => chartView === 'mrr' ? d.mrr : chartView === 'subscribers' ? d.subscribers : d.churnRate || 0),
    1
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">MRR</span>
            <span className="p-1.5 bg-green-100 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(metrics?.mrr || 0)}
          </p>
          {metrics?.mrrChange && (
            <div className={`flex items-center gap-1 text-sm mt-1 ${
              metrics.mrrChange.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.mrrChange.direction === 'up' ? '↑' : '↓'}
              {metrics.mrrChange.formatted}
            </div>
          )}
        </div>

        {/* ARR */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">ARR</span>
            <span className="p-1.5 bg-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(metrics?.arr || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Årlig beräkning</p>
        </div>

        {/* LTV */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">LTV</span>
            <span className="p-1.5 bg-violet-100 rounded-lg">
              <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(metrics?.ltv || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Livstidsvärde per kund</p>
        </div>

        {/* Churn Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Churn</span>
            <span className="p-1.5 bg-red-100 rounded-lg">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : `${metrics?.churnRate || 0}%`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics?.churnedCount || 0} avslutade denna månad
          </p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Trend (12 månader)</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { value: 'mrr', label: 'MRR' },
              { value: 'subscribers', label: 'Prenumeranter' },
              { value: 'churn', label: 'Churn' }
            ].map(view => (
              <button
                key={view.value}
                onClick={() => setChartView(view.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  chartView === view.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : trend.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Ingen trenddata tillgänglig</p>
            </div>
          ) : (
            <div className="h-48 flex items-end gap-2">
              {trend.map((point, index) => {
                const value = chartView === 'mrr' ? point.mrr : chartView === 'subscribers' ? point.subscribers : point.churnRate || 0
                const height = (value / maxValue) * 100

                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        chartView === 'mrr' ? 'bg-green-500 hover:bg-green-600' :
                        chartView === 'subscribers' ? 'bg-blue-500 hover:bg-blue-600' :
                        'bg-red-500 hover:bg-red-600'
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${point.date}: ${chartView === 'mrr' ? formatCurrency(value) : chartView === 'subscribers' ? value : `${value}%`}`}
                    />
                    <span className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {new Date(point.date).toLocaleDateString('sv-SE', { month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Breakdown */}
      {metrics?.revenueBreakdown && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Intäktsfördelning</h3>

          <div className="grid grid-cols-2 gap-6">
            {/* Monthly */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Månadsbetalande</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.revenueBreakdown.monthly.percentage}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.revenueBreakdown.monthly.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{metrics.revenueBreakdown.monthly.count} prenumeranter</span>
                <span>{formatCurrency(metrics.revenueBreakdown.monthly.revenue)}/mån</span>
              </div>
            </div>

            {/* Annual */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Årsbetalande</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.revenueBreakdown.annual.percentage}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.revenueBreakdown.annual.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{metrics.revenueBreakdown.annual.count} prenumeranter</span>
                <span>{formatCurrency(metrics.revenueBreakdown.annual.revenue)}/mån (avg)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{metrics?.totalActive || 0}</p>
          <p className="text-sm text-gray-500">Aktiva prenumeranter</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">+{metrics?.newSubscriptions || 0}</p>
          <p className="text-sm text-gray-500">Nya denna månad</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-red-600">-{metrics?.churnedCount || 0}</p>
          <p className="text-sm text-gray-500">Avslutade denna månad</p>
        </div>
      </div>
    </div>
  )
}

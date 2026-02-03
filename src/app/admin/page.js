'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UsersIcon, DocumentIcon, CubeIcon, ClipboardDocumentListIcon,
  ChevronRightIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon
} from '@/components/admin/Icons'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState({ flyers: [], users: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setRecent(data.recent)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda statistik')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Översikt av Matvecka</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Användare"
          value={stats?.users || 0}
          icon={UsersIcon}
          href="/admin/users"
        />
        <MetricCard
          title="Reklamblad"
          value={stats?.flyers || 0}
          icon={DocumentIcon}
          href="/admin/flyers"
        />
        <MetricCard
          title="Produkter"
          value={stats?.products || 0}
          icon={CubeIcon}
          href="/admin/products"
        />
        <MetricCard
          title="Matplaner"
          value={stats?.mealPlans || 0}
          icon={ClipboardDocumentListIcon}
        />
      </div>

      {/* Activity Panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Flyers */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-medium text-slate-900 dark:text-white">Senaste reklamblad</h2>
            <Link
              href="/admin/flyers"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              Visa alla
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {recent.flyers.length > 0 ? (
              recent.flyers.map(flyer => (
                <div key={flyer.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{flyer.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{flyer.store}</p>
                  </div>
                  <StatusBadge status={flyer.status} />
                </div>
              ))
            ) : (
              <EmptyState text="Inga reklamblad ännu" />
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-medium text-slate-900 dark:text-white">Senaste användare</h2>
            <Link
              href="/admin/users"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              Visa alla
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {recent.users.length > 0 ? (
              recent.users.map(user => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="block px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <p className="font-medium text-slate-900 dark:text-white truncate">{user.email}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(user.created_at)}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyState text="Inga användare ännu" />
            )}
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <SecondaryMetric label="Reklamblad-sidor" value={stats?.flyerPages || 0} />
        <SecondaryMetric label="Produkt-hotspots" value={stats?.hotspots || 0} />
        <SecondaryMetric label="Inköpslistor" value={stats?.shoppingLists || 0} />
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, href }) {
  const content = (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 ${href ? 'hover:border-slate-300 dark:hover:border-slate-600 transition-colors' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
        {href && <ChevronRightIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
      </div>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value.toLocaleString('sv-SE')}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

function SecondaryMetric({ label, value }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700/50">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{value.toLocaleString('sv-SE')}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    ready: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    pending: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  }

  const labels = {
    completed: 'Klar',
    ready: 'Redo',
    pending: 'Väntar',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-md ${styles[status] || styles.pending}`}>
      {labels[status] || 'Väntar'}
    </span>
  )
}

function EmptyState({ text }) {
  return (
    <p className="px-5 py-8 text-sm text-slate-400 dark:text-slate-500 text-center">{text}</p>
  )
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Idag'
  if (diffDays === 1) return 'Igår'
  if (diffDays < 7) return `${diffDays} dagar sedan`

  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

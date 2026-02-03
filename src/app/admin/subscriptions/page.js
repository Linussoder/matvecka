'use client'

import { useState, useEffect } from 'react'

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  async function fetchSubscriptions() {
    try {
      const response = await fetch('/api/admin/subscriptions')
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        setStats(data.stats)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda prenumerationer')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(userId, action) {
    setActionLoading(`${userId}-${action}`)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        fetchSubscriptions()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Något gick fel' })
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user => {
    if (search && !user.email?.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    if (filter === 'premium') {
      return user.subscription?.plan === 'premium' && ['active', 'trialing'].includes(user.subscription?.status)
    }
    if (filter === 'trialing') {
      return user.subscription?.status === 'trialing'
    }
    if (filter === 'cancelled') {
      return user.subscription?.cancel_at_period_end
    }
    if (filter === 'free') {
      return !user.subscription || user.subscription.plan === 'free'
    }

    return true
  })

  function getStatusBadge(subscription) {
    if (!subscription || subscription.plan === 'free') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          Gratis
        </span>
      )
    }

    if (subscription.cancel_at_period_end) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400">
          Avbruten
        </span>
      )
    }

    if (subscription.status === 'trialing') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400">
          Provperiod
        </span>
      )
    }

    if (subscription.status === 'active') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
          Premium
        </span>
      )
    }

    if (subscription.status === 'past_due') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400">
          Betalning misslyckad
        </span>
      )
    }

    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
        {subscription.status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prenumerationer</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Hantera användarprenumerationer och användning
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Totalt</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-2xl font-bold text-green-600">{stats.premium}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Premium</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.trialing}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Provperiod</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-2xl font-bold text-orange-600">{stats.cancelled}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avbrutna</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-2xl font-bold text-gray-600">{stats.free}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gratis</p>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Alla
          </button>
          <button
            onClick={() => setFilter('premium')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'premium'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Premium
          </button>
          <button
            onClick={() => setFilter('trialing')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'trialing'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Provperiod
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'cancelled'
                ? 'bg-orange-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Avbrutna
          </button>
          <button
            onClick={() => setFilter('free')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'free'
                ? 'bg-gray-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Gratis
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Sök e-post..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Användare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Period slutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Användning
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Registrerad {new Date(user.created_at).toLocaleDateString('sv-SE')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.subscription)}
                    {user.subscription?.stripe_subscription_id && (
                      <div className="text-xs text-gray-400 mt-1">Via Stripe</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.subscription?.current_period_end
                      ? new Date(user.subscription.current_period_end).toLocaleDateString('sv-SE')
                      : '-'
                    }
                    {user.subscription?.trial_end && new Date(user.subscription.trial_end) > new Date() && (
                      <div className="text-xs text-purple-500">
                        Provperiod till {new Date(user.subscription.trial_end).toLocaleDateString('sv-SE')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.usage.meal_plans_generated} matplaner
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.usage.recipes_regenerated} receptbyten
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Grant Premium */}
                      {(!user.subscription || user.subscription.plan === 'free') && (
                        <button
                          onClick={() => handleAction(user.id, 'grant_premium')}
                          disabled={actionLoading === `${user.id}-grant_premium`}
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === `${user.id}-grant_premium` ? '...' : 'Ge Premium'}
                        </button>
                      )}

                      {/* Revoke Premium */}
                      {user.subscription?.plan === 'premium' && !user.subscription?.stripe_subscription_id && (
                        <button
                          onClick={() => handleAction(user.id, 'revoke_premium')}
                          disabled={actionLoading === `${user.id}-revoke_premium`}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === `${user.id}-revoke_premium` ? '...' : 'Ta bort Premium'}
                        </button>
                      )}

                      {/* Cancel Stripe subscription */}
                      {user.subscription?.stripe_subscription_id && !user.subscription?.cancel_at_period_end && (
                        <button
                          onClick={() => handleAction(user.id, 'cancel_stripe')}
                          disabled={actionLoading === `${user.id}-cancel_stripe`}
                          className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === `${user.id}-cancel_stripe` ? '...' : 'Avbryt'}
                        </button>
                      )}

                      {/* Reset Usage */}
                      <button
                        onClick={() => handleAction(user.id, 'reset_usage')}
                        disabled={actionLoading === `${user.id}-reset_usage`}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        title="Återställ månadens användning"
                      >
                        {actionLoading === `${user.id}-reset_usage` ? '...' : 'Nollställ'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
            {search ? 'Inga användare matchar sökningen' : 'Inga användare ännu'}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Åtgärder</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium text-green-600">Ge Premium</span> - Ger användaren 1 månads premium utan Stripe-betalning (admin override)
          </div>
          <div>
            <span className="font-medium text-red-600">Ta bort Premium</span> - Tar bort manuellt given premium (fungerar inte på Stripe-prenumerationer)
          </div>
          <div>
            <span className="font-medium text-orange-600">Avbryt</span> - Avbryter Stripe-prenumeration vid periodens slut
          </div>
          <div>
            <span className="font-medium text-gray-600">Nollställ</span> - Nollställer användarens månatliga användning (matplaner, receptbyten)
          </div>
        </div>
      </div>
    </div>
  )
}

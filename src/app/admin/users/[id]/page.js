'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

// Utensils/Plate icon for meal plans
const UtensilsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12 10.5v2.25" />
  </svg>
)

// Heart icon for favorites
const HeartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
)

export default function AdminUserDetailPage({ params }) {
  const { id } = use(params)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchUser()
  }, [id])

  async function fetchUser() {
    try {
      const response = await fetch(`/api/admin/users/${id}`)
      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Kunde inte ladda användardata')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
        <Link href="/admin/users" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          ← Tillbaka till användare
        </Link>
      </div>
    )
  }

  const { user, preferences, stats, mealPlans, favorites, activities } = data

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back link */}
      <Link href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
        ← Tillbaka till användare
      </Link>

      {/* User Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-300">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.email}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.email_confirmed
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
              }`}>
                {user.email_confirmed ? 'Verifierad' : 'Ej verifierad'}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {user.provider === 'google' ? 'Google' : 'E-post'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Registrerad {new Date(user.created_at).toLocaleDateString('sv-SE')} •
              Senaste inloggning {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString('sv-SE') : 'Aldrig'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.mealPlans}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Matplaner</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.shoppingLists}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Inköpslistor</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.favorites}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Favoriter</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['overview', 'mealplans', 'activity'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab === 'overview' && 'Översikt'}
            {tab === 'mealplans' && 'Matplaner'}
            {tab === 'activity' && 'Aktivitet'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-medium text-gray-900 dark:text-white mb-4">Inställningar</h2>
            {preferences ? (
              <div className="space-y-3">
                {preferences.household_size && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hushållsstorlek</p>
                    <p className="text-gray-900 dark:text-white">{preferences.household_size} personer</p>
                  </div>
                )}
                {preferences.dietary_restrictions?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kostpreferenser</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preferences.dietary_restrictions.map(r => (
                        <span key={r} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {preferences.budget && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                    <p className="text-gray-900 dark:text-white">{preferences.budget} kr/vecka</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Inga inställningar sparade</p>
            )}
          </div>

          {/* Favorites */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-medium text-gray-900 dark:text-white mb-4">Favoritrecept</h2>
            {favorites.length > 0 ? (
              <div className="space-y-2">
                {favorites.slice(0, 5).map(fav => (
                  <div key={fav.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                    <span className="text-sm text-gray-900 dark:text-white">{fav.recipe_data?.name || 'Recept'}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(fav.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Inga favoriter sparade</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mealplans' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-medium text-gray-900 dark:text-white">Matplaner ({mealPlans.length})</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {mealPlans.length > 0 ? (
              mealPlans.map(mp => (
                <div key={mp.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Matplan {new Date(mp.created_at).toLocaleDateString('sv-SE')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {mp.recipes?.[0]?.count || 0} recept • {mp.preferences?.servings || '-'} portioner
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    mp.status === 'completed' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                    'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                  }`}>
                    {mp.status === 'completed' ? 'Klar' : 'Aktiv'}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Inga matplaner skapade</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-medium text-gray-900 dark:text-white">Aktivitetslogg</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activities.length > 0 ? (
              activities.map((activity, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    activity.type === 'meal_plan' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' :
                    activity.type === 'favorite' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {activity.type === 'meal_plan' && <UtensilsIcon className="w-4 h-4" />}
                    {activity.type === 'favorite' && <HeartIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activity.details}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.date).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Ingen aktivitet registrerad</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

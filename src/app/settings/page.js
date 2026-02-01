'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Settings state
  const [fullName, setFullName] = useState('')
  const [defaultServings, setDefaultServings] = useState(4)
  const [maxBudget, setMaxBudget] = useState(50)
  const [preferredCity, setPreferredCity] = useState('Stockholm')
  const [hasExistingPrefs, setHasExistingPrefs] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)
      setFullName(session.user.user_metadata?.full_name || '')

      // Load user preferences from database
      const { data: prefs, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (prefs && !error) {
        setDefaultServings(prefs.default_servings || 4)
        setMaxBudget(prefs.max_budget_per_serving || 50)
        setPreferredCity(prefs.preferred_city || 'Stockholm')
        setHasExistingPrefs(true)
      }

      setLoading(false)
    }

    loadUser()
  }, [supabase])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Update user metadata (name)
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (userError) throw userError

      // Update or insert preferences in database
      if (hasExistingPrefs) {
        // UPDATE existing record
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .update({
            default_servings: defaultServings,
            max_budget_per_serving: maxBudget,
            preferred_city: preferredCity,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (prefsError) throw prefsError
      } else {
        // INSERT new record
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            default_servings: defaultServings,
            max_budget_per_serving: maxBudget,
            preferred_city: preferredCity
          })

        if (prefsError) throw prefsError
        setHasExistingPrefs(true)
      }

      setMessage({ type: 'success', text: 'Inställningar sparade!' })
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: error.message })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Inställningar</h1>
            <p className="text-gray-600 mt-2">Hantera ditt konto och preferenser</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Namn
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Ditt namn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-postadress
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    E-postadressen kan inte ändras
                  </p>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Matplanering</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard antal portioner
                  </label>
                  <select
                    value={defaultServings}
                    onChange={(e) => setDefaultServings(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value={1}>1 portion</option>
                    <option value={2}>2 portioner</option>
                    <option value={3}>3 portioner</option>
                    <option value={4}>4 portioner</option>
                    <option value={5}>5 portioner</option>
                    <option value={6}>6 portioner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max kostnad per portion (kr)
                  </label>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(parseInt(e.target.value))}
                    min={20}
                    max={200}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Föredragen stad
                  </label>
                  <select
                    value={preferredCity}
                    onChange={(e) => setPreferredCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="Stockholm">Stockholm</option>
                    <option value="Göteborg">Göteborg</option>
                    <option value="Malmö">Malmö</option>
                    <option value="Uppsala">Uppsala</option>
                    <option value="Helsingborg">Helsingborg</option>
                    <option value="Örebro">Örebro</option>
                    <option value="Linköping">Linköping</option>
                    <option value="Västerås">Västerås</option>
                    <option value="Norrköping">Norrköping</option>
                    <option value="Jönköping">Jönköping</option>
                    <option value="Lund">Lund</option>
                    <option value="Umeå">Umeå</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Sparar...' : 'Spara inställningar'}
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Farlig zon</h2>
            <p className="text-gray-600 mb-4">
              Ta bort ditt konto permanent. Denna åtgärd kan inte ångras.
            </p>
            <button
              type="button"
              className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Ta bort konto
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useTheme } from '@/contexts/ThemeContext'
import FamilyMemberForm from '@/components/FamilyMemberForm'
import FamilyMemberCard from '@/components/FamilyMemberCard'
import ReferralDashboard from '@/components/ReferralDashboard'

// Constants
const CITIES = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Helsingborg', 'Örebro', 'Linköping', 'Västerås', 'Norrköping', 'Jönköping', 'Lund', 'Umeå']
const ALLERGIES = ['Nötter', 'Jordnötter', 'Skaldjur', 'Fisk', 'Ägg', 'Mjölk', 'Soja', 'Vete', 'Sesam', 'Selleri', 'Senap', 'Lupin']
const INTOLERANCES = ['Laktos', 'Gluten', 'Fruktosmalabsorption', 'Histamin']
const KITCHEN_EQUIPMENT = ['Ugn', 'Spis', 'Mikrovågsugn', 'Airfryer', 'Slow cooker', 'Instant Pot', 'Grill', 'Sous vide', 'Matberedare', 'Stavmixer', 'Våffeljärn', 'Wok']

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isDark, setTheme } = useTheme()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [calculatedData, setCalculatedData] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Profile state
  const [profile, setProfile] = useState({
    full_name: '',
    phone_number: '',
    preferred_city: 'Stockholm',
    // Body & Health
    weight_kg: '',
    height_cm: '',
    birth_date: '',
    gender: '',
    activity_level: 'moderate',
    health_goal: 'maintain',
    // Dietary
    allergies: [],
    intolerances: [],
    diet_type: 'none',
    dislikes: '',
    // Kitchen
    kitchen_equipment: [],
    cooking_skill: 'beginner',
    weekday_cooking_time: 30,
    weekend_cooking_time: 60,
    // Meal planning
    default_servings: 4,
    max_budget_per_serving: 50,
    // Notifications
    email_notifications: true,
    push_notifications: true,
    meal_prep_reminders: true,
    weekly_summary: true,
    // App
    dark_mode: false,
    language: 'sv',
    units: 'metric'
  })

  // Family state
  const {
    familyMembers,
    isPremium,
    addMember,
    updateMember,
    removeMember
  } = useHousehold()
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [familyLoading, setFamilyLoading] = useState(false)

  const supabase = createClient()

  // Read tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (['profile', 'health', 'diet', 'kitchen', 'notifications', 'mealplan', 'family', 'referral'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Load user and profile
  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)

      // Load profile from API
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.profile && Object.keys(data.profile).length > 0) {
            setProfile(prev => ({
              ...prev,
              ...data.profile,
              full_name: data.profile.full_name || session.user.user_metadata?.full_name || '',
              dislikes: Array.isArray(data.profile.dislikes) ? data.profile.dislikes.join(', ') : ''
            }))
            // Sync theme with saved preference
            if (data.profile.dark_mode !== undefined) {
              setTheme(data.profile.dark_mode)
            }
          } else {
            // Set name from user metadata if no profile exists
            setProfile(prev => ({
              ...prev,
              full_name: session.user.user_metadata?.full_name || ''
            }))
          }
          setCalculatedData(data.calculated || {})
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }

      setLoading(false)
    }

    loadData()
  }, [supabase])

  // Save profile
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Update auth user name
      await supabase.auth.updateUser({
        data: { full_name: profile.full_name }
      })

      // Parse dislikes string to array
      const dislikesArray = profile.dislikes
        ? profile.dislikes.split(',').map(s => s.trim()).filter(Boolean)
        : []

      // Save to profile API
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          dislikes: dislikesArray
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      // Refetch to get calculated values
      const profileResponse = await fetch('/api/user/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setCalculatedData(profileData.calculated || {})
      }

      setMessage({ type: 'success', text: 'Inställningar sparade!' })
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: error.message })
    }

    setSaving(false)
  }

  // Handle change password
  async function handleChangePassword() {
    if (!user?.email) {
      setMessage({ type: 'error', text: 'Ingen e-postadress hittades' })
      return
    }

    setChangingPassword(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      setMessage({ type: 'success', text: `E-post för lösenordsåterställning skickad till ${user.email}!` })
    } catch (error) {
      console.error('Password reset error:', error)
      setMessage({ type: 'error', text: error.message || 'Kunde inte skicka e-post' })
    } finally {
      setChangingPassword(false)
    }
  }

  // Handle export data
  async function handleExportData() {
    try {
      const response = await fetch('/api/user/profile?action=export', {
        method: 'DELETE' // Using DELETE with action=export
      })
      const data = await response.json()

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matvecka-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      setShowExportModal(false)
      setMessage({ type: 'success', text: 'Data exporterad!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Kunde inte exportera data' })
    }
  }

  // Handle delete account
  async function handleDeleteAccount() {
    try {
      const response = await fetch('/api/user/profile?action=delete', {
        method: 'DELETE'
      })
      if (response.ok) {
        router.push('/')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Kunde inte ta bort kontot' })
    }
  }

  // Toggle array value
  function toggleArrayValue(field, value) {
    setProfile(prev => {
      const arr = prev[field] || []
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) }
      }
      return { ...prev, [field]: [...arr, value] }
    })
  }

  // Family handlers
  const handleAddMember = async (memberData) => {
    setFamilyLoading(true)
    const result = await addMember(memberData)
    setFamilyLoading(false)

    if (result.success) {
      setShowFamilyForm(false)
      setMessage({ type: 'success', text: `${memberData.name} har lagts till i hushållet` })
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const handleUpdateMember = async (memberData) => {
    if (!editingMember) return
    setFamilyLoading(true)
    const result = await updateMember(editingMember.id, memberData)
    setFamilyLoading(false)

    if (result.success) {
      setEditingMember(null)
      setMessage({ type: 'success', text: 'Ändringar sparade' })
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const handleDeleteMember = async (memberId) => {
    const result = await removeMember(memberId)
    if (result.success) {
      setMessage({ type: 'success', text: 'Familjemedlem borttagen' })
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  // SVG icons for tabs
  const tabIcons = {
    profile: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    health: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    diet: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    kitchen: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    mealplan: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    notifications: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    family: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    referral: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  }

  const tabs = [
    { id: 'profile', label: 'Konto' },
    { id: 'health', label: 'Hälsa' },
    { id: 'diet', label: 'Kost' },
    { id: 'kitchen', label: 'Kök' },
    { id: 'mealplan', label: 'Veckomeny' },
    { id: 'notifications', label: 'Notiser' },
    { id: 'family', label: 'Hushåll', premium: true },
    { id: 'referral', label: 'Värva' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inställningar</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Hantera ditt konto och preferenser</p>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 overflow-x-auto">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMessage(null)
                    }}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {tabIcons[tab.id]}
                    <span>{tab.label}</span>
                    {tab.premium && !isPremium && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                        Premium
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <span>{message.type === 'success' ? '✓' : '!'}</span>
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto text-current opacity-50 hover:opacity-100"
              >
                ×
              </button>
            </div>
          )}

          {/* Profile/Account Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profilinformation</h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Namn</label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ditt namn"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Telefonnummer</label>
                      <input
                        type="tel"
                        value={profile.phone_number || ''}
                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="+46 70 123 45 67"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">E-postadress</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Föredragen stad</label>
                      <select
                        value={profile.preferred_city}
                        onChange={(e) => setProfile({ ...profile, preferred_city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                      >
                        {CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Säkerhet</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Lösenord</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ändra ditt lösenord via e-post</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {changingPassword ? 'Skickar...' : 'Ändra lösenord'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* App Preferences */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appinställningar</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between opacity-50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          Språk
                          <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-full">Kommer snart</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Välj appens språk</p>
                      </div>
                      <select
                        value={profile.language}
                        disabled
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      >
                        <option value="sv">Svenska</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between opacity-50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          Enheter
                          <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-full">Kommer snart</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Metriskt eller imperial</p>
                      </div>
                      <select
                        value={profile.units}
                        disabled
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      >
                        <option value="metric">Metriskt (kg, cm)</option>
                        <option value="imperial">Imperial (lbs, in)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Mörkt läge</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Använd mörkt tema</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDark}
                          onChange={(e) => {
                            setTheme(e.target.checked)
                            setProfile({ ...profile, dark_mode: e.target.checked })
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    {saving ? 'Sparar...' : 'Spara ändringar'}
                  </button>
                </div>
              </form>

              {/* GDPR / Danger Zone */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-red-200">
                <h2 className="text-lg font-semibold text-red-600 mb-4">Datainställningar</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Exportera min data</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ladda ner all din data (GDPR)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowExportModal(true)}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Exportera
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-700">Ta bort konto</p>
                      <p className="text-sm text-red-600">Permanent borttagning av alla uppgifter</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kroppsdata</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Används för att beräkna ditt dagliga kaloribehov och ge personliga rekommendationer.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Vikt (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.weight_kg || ''}
                      onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="70"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Längd (cm)</label>
                    <input
                      type="number"
                      value={profile.height_cm || ''}
                      onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="175"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Födelsedatum</label>
                    <input
                      type="date"
                      value={profile.birth_date || ''}
                      onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Kön</label>
                    <select
                      value={profile.gender || ''}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                    >
                      <option value="">Välj...</option>
                      <option value="male">Man</option>
                      <option value="female">Kvinna</option>
                      <option value="other">Annat</option>
                      <option value="prefer_not_to_say">Vill ej uppge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Aktivitetsnivå</label>
                    <select
                      value={profile.activity_level}
                      onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                    >
                      <option value="sedentary">Stillasittande (lite/ingen träning)</option>
                      <option value="light">Lätt aktiv (1-3 dagar/vecka)</option>
                      <option value="moderate">Måttligt aktiv (3-5 dagar/vecka)</option>
                      <option value="active">Aktiv (6-7 dagar/vecka)</option>
                      <option value="very_active">Mycket aktiv (2x dagligen)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Hälsomål</label>
                    <select
                      value={profile.health_goal}
                      onChange={(e) => setProfile({ ...profile, health_goal: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                    >
                      <option value="lose_weight">Gå ner i vikt</option>
                      <option value="maintain">Behålla vikt</option>
                      <option value="gain_muscle">Bygga muskler</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Calculated Values */}
              {calculatedData.dailyCalorieTarget && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Dina beräknade värden</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{calculatedData.age}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ålder</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{calculatedData.bmr}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">BMR (kcal)</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{calculatedData.tdee}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">TDEE (kcal)</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-amber-600">{calculatedData.dailyCalorieTarget}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dagsmål (kcal)</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    BMR = Basalmetabolism (kalorier i vila). TDEE = Totalt dagligt energibehov. Dagsmål justeras baserat på ditt hälsomål.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            </form>
          )}

          {/* Diet Tab */}
          {activeTab === 'diet' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mina allergier</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Dessa ingredienser undviks alltid i dina recept.</p>

                <div className="flex flex-wrap gap-2">
                  {ALLERGIES.map(allergy => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleArrayValue('allergies', allergy)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        profile.allergies?.includes(allergy)
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mina intoleranser</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ingredienser du är känslig mot.</p>

                <div className="flex flex-wrap gap-2">
                  {INTOLERANCES.map(intolerance => (
                    <button
                      key={intolerance}
                      type="button"
                      onClick={() => toggleArrayValue('intolerances', intolerance)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        profile.intolerances?.includes(intolerance)
                          ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      {intolerance}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kosttyp</h2>

                <select
                  value={profile.diet_type}
                  onChange={(e) => setProfile({ ...profile, diet_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                >
                  <option value="none">Ingen begränsning (blandkost)</option>
                  <option value="vegetarian">Vegetarisk</option>
                  <option value="vegan">Vegansk</option>
                  <option value="pescatarian">Pescetariansk (fisk)</option>
                  <option value="keto">Keto</option>
                  <option value="low_carb">Lågkolhydrat</option>
                  <option value="gluten_free">Glutenfri</option>
                  <option value="dairy_free">Mjölkfri</option>
                </select>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Saker jag ogillar</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ingredienser AI:n försöker undvika (separera med komma).</p>

                <input
                  type="text"
                  value={profile.dislikes || ''}
                  onChange={(e) => setProfile({ ...profile, dislikes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="t.ex. oliver, svamp, koriander"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            </form>
          )}

          {/* Kitchen Tab */}
          {activeTab === 'kitchen' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Min köksutrustning</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Välj den utrustning du har tillgänglig.</p>

                <div className="flex flex-wrap gap-2">
                  {KITCHEN_EQUIPMENT.map(equipment => (
                    <button
                      key={equipment}
                      type="button"
                      onClick={() => toggleArrayValue('kitchen_equipment', equipment)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        profile.kitchen_equipment?.includes(equipment)
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      {equipment}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Matlagningsnivå</h2>

                <select
                  value={profile.cooking_skill}
                  onChange={(e) => setProfile({ ...profile, cooking_skill: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                >
                  <option value="beginner">Nybörjare - enkla recept</option>
                  <option value="intermediate">Medel - varierade tekniker</option>
                  <option value="advanced">Avancerad - komplexa recept</option>
                </select>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tillgänglig tid för matlagning</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Vardagar (minuter)</label>
                    <select
                      value={profile.weekday_cooking_time}
                      onChange={(e) => setProfile({ ...profile, weekday_cooking_time: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                    >
                      <option value={15}>15 min - snabba rätter</option>
                      <option value={30}>30 min - standard</option>
                      <option value={45}>45 min - mer tid</option>
                      <option value={60}>60+ min - gott om tid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Helger (minuter)</label>
                    <select
                      value={profile.weekend_cooking_time}
                      onChange={(e) => setProfile({ ...profile, weekend_cooking_time: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                    >
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90+ min - tid för projekt</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            </form>
          )}

          {/* Meal Plan Tab */}
          {activeTab === 'mealplan' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Standardinställningar för veckomenyer</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Standard antal portioner</label>
                    <select
                      value={profile.default_servings}
                      onChange={(e) => setProfile({ ...profile, default_servings: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'portion' : 'portioner'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Max kostnad per portion (kr)</label>
                    <input
                      type="number"
                      value={profile.max_budget_per_serving}
                      onChange={(e) => setProfile({ ...profile, max_budget_per_serving: parseInt(e.target.value) })}
                      min={20}
                      max={200}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Coming Soon Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <p className="font-medium text-amber-800">Notifikationer kommer snart!</p>
                    <p className="text-sm text-amber-700">
                      Vi arbetar på att implementera notifikationer. Du kan redan nu välja dina preferenser så aktiveras de när funktionen är redo.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifikationsinställningar</h2>

                  <div className="space-y-4 opacity-60">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">E-postnotifikationer</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Få e-post om viktiga uppdateringar</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={profile.email_notifications}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Push-notifikationer</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Påminnelser i webbläsaren/appen</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={profile.push_notifications}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Meal prep-påminnelser</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Påminnelse dagen före för att förbereda</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={profile.meal_prep_reminders}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Veckosammanfattning</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">E-post med veckans statistik</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={profile.weekly_summary}
                          disabled
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-400"></div>
                      </label>
                    </div>
                  </div>
                </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
              </form>
            </div>
          )}

          {/* Family Tab */}
          {activeTab === 'family' && (
            <div className="space-y-6">
              {!isPremium ? (
                /* Premium upsell */
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">👨‍👩‍👧‍👦</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Hushållshantering
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                    Med Premium kan du lägga till familjemedlemmar med individuella kostpreferenser,
                    allergier och portionsstorlekar. AI:n anpassar sedan recepten så att hela familjen kan äta samma mat.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 max-w-sm mx-auto text-left">
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Upp till 10 familjemedlemmar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Individuella allergier och intoleranser</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Automatisk portionsberäkning</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Kombinerade kostbegränsningar</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Uppgradera till Premium
                  </Link>
                </div>
              ) : (
                /* Family management */
                <>
                  {/* Add/Edit Form */}
                  {(showFamilyForm || editingMember) && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {editingMember ? `Redigera ${editingMember.name}` : 'Lägg till familjemedlem'}
                      </h2>
                      <FamilyMemberForm
                        member={editingMember}
                        onSubmit={editingMember ? handleUpdateMember : handleAddMember}
                        onCancel={() => {
                          setShowFamilyForm(false)
                          setEditingMember(null)
                        }}
                        isLoading={familyLoading}
                      />
                    </div>
                  )}

                  {/* Family Members List */}
                  {!showFamilyForm && !editingMember && (
                    <>
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ditt hushåll</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {familyMembers.length === 0
                                ? 'Inga familjemedlemmar tillagda ännu'
                                : `${familyMembers.length} ${familyMembers.length === 1 ? 'person' : 'personer'}`
                              }
                            </p>
                          </div>
                          <button
                            onClick={() => setShowFamilyForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Lägg till
                          </button>
                        </div>

                        {familyMembers.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-2xl">👤</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-1">Börja med att lägga till din första familjemedlem</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Du kan lägga till allergier, kostpreferenser och portionsstorlekar för varje person.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {familyMembers.map(member => (
                              <FamilyMemberCard
                                key={member.id}
                                member={member}
                                onEdit={setEditingMember}
                                onDelete={handleDeleteMember}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tips */}
                      {familyMembers.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-medium text-green-800 mb-2">Hur det fungerar</h3>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Gå till &quot;Skapa veckomeny&quot; och aktivera &quot;Planera för mitt hushåll&quot;</li>
                            <li>• Portionerna beräknas automatiskt baserat på varje persons ålder och preferenser</li>
                            <li>• Allergier och intoleranser undviks alltid i recepten</li>
                            <li>• Om någon är vegetarian/vegan anpassas alla måltider</li>
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Referral Tab */}
          {activeTab === 'referral' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Värva vänner</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Bjud in dina vänner till Matvecka och få gratis Premium-dagar!
                </p>
                <ReferralDashboard />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Exportera din data</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Ladda ner all din data som en JSON-fil. Detta inkluderar din profil, veckomenyer, favoriter och hushållsdata.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleExportData}
                className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Ladda ner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Ta bort konto?</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Detta tar bort permanent alla dina data inklusive veckomenyer, favoriter och inställningar. Denna åtgärd kan inte ångras.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Ta bort konto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

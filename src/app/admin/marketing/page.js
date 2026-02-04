'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Icons
const ChartBarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

const EnvelopeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)

const CurrencyDollarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const BellIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const TagIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
)

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

const MegaphoneIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
  </svg>
)

const SparklesIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
)

const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

// Tab configuration
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { id: 'social', label: 'Social', icon: CalendarIcon },
  { id: 'email', label: 'Email', icon: EnvelopeIcon },
  { id: 'ads', label: 'Ads', icon: CurrencyDollarIcon },
  { id: 'push', label: 'Push', icon: BellIcon },
  { id: 'promo', label: 'Kampanjkoder', icon: TagIcon },
  { id: 'calendar', label: 'Kalender', icon: CalendarIcon },
  { id: 'influencers', label: 'Influencers', icon: UsersIcon },
  { id: 'ai-tools', label: 'AI Tools', icon: SparklesIcon },
]

function MarketingContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'dashboard')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Fetch dashboard stats
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats()
    }
  }, [activeTab])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/automations/stats')
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

  const demoStats = stats || {
    activeCampaigns: 3,
    postsThisWeek: 12,
    emailsSent: 847,
    adSpend: 2450,
    avgEngagement: 4.7,
    aiCostSavings: 3200,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <MegaphoneIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing Hub</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Social, Email, Ads & Automations</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
              <PlusIcon className="w-5 h-5" />
              Ny kampanj
            </button>
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
                      ? 'bg-gray-100 dark:bg-slate-800 text-green-600 dark:text-green-400 border-b-2 border-green-500'
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
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Aktiva kampanjer</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{demoStats.activeCampaigns}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <MegaphoneIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Inlägg denna vecka</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{demoStats.postsThisWeek}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Email skickade (7d)</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{demoStats.emailsSent}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <EnvelopeIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Ad Spend (7d)</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{demoStats.adSpend} kr</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Snitt engagemang</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{demoStats.avgEngagement}%</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">AI-besparingar</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{demoStats.aiCostSavings} kr</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Snabbåtgärder</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('social')}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <CalendarIcon className="w-8 h-8 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Skapa inlägg</span>
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <EnvelopeIcon className="w-8 h-8 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Ny email-kampanj</span>
                </button>
                <button
                  onClick={() => setActiveTab('ads')}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <CurrencyDollarIcon className="w-8 h-8 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Skapa annons</span>
                </button>
                <button
                  onClick={() => setActiveTab('ai-tools')}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <SparklesIcon className="w-8 h-8 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">AI-generera</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Media</h2>
              <p className="text-gray-500 dark:text-slate-400">
                Hantera automatisk publicering, schemaläggning och statistik för sociala medier.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
                  <h3 className="font-semibold">Instagram</h3>
                  <p className="text-sm opacity-90 mt-1">12 schemalagda inlägg</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                  <h3 className="font-semibold">Facebook</h3>
                  <p className="text-sm opacity-90 mt-1">8 schemalagda inlägg</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-800 to-black rounded-lg text-white">
                  <h3 className="font-semibold">TikTok</h3>
                  <p className="text-sm opacity-90 mt-1">5 schemalagda inlägg</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Marketing</h2>
              <p className="text-gray-500 dark:text-slate-400">
                Skapa och hantera email-mallar, kampanjer och automations.
              </p>
              <div className="mt-6 flex gap-4">
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                  Ny kampanj
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                  Hantera mallar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Annonsering</h2>
              <p className="text-gray-500 dark:text-slate-400">
                Hantera Google Ads, Meta Ads och TikTok Ads med AI-optimering.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Google Ads</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">1,200 kr</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Spend denna vecka</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Meta Ads</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">850 kr</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Spend denna vecka</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">TikTok Ads</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">400 kr</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Spend denna vecka</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Push Tab */}
        {activeTab === 'push' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Push-notifikationer</h2>
              <p className="text-gray-500 dark:text-slate-400">
                Skicka push-notifikationer till användare via appen.
              </p>
              <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Ny notifikation
              </button>
            </div>
          </div>
        )}

        {/* Promo Tab */}
        {activeTab === 'promo' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kampanjkoder</h2>
              <p className="text-gray-500 dark:text-slate-400">
                Skapa och hantera rabattkoder och kampanjer.
              </p>
              <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Ny kampanjkod
              </button>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Innehållskalender</h2>
              <p className="text-gray-500 dark:text-slate-400">
                Planera och schemalägg allt innehåll på ett ställe.
              </p>
              <div className="mt-6 text-center py-12 text-gray-500 dark:text-slate-400">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p>Kalendervy kommer snart</p>
              </div>
            </div>
          </div>
        )}

        {/* Influencers Tab */}
        {activeTab === 'influencers' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Influencer-samarbeten</h2>
              <p className="text-gray-500 dark:text-slate-400">
                Hantera relationer och kampanjer med influencers.
              </p>
              <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Lägg till influencer
              </button>
            </div>
          </div>
        )}

        {/* AI Tools Tab */}
        {activeTab === 'ai-tools' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <SparklesIcon className="w-8 h-8" />
                <h2 className="text-xl font-bold">AI Marketing Tools</h2>
              </div>
              <p className="text-purple-100">Kraftfulla AI-verktyg för content-skapande och analys</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Innehållsgenerator</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  Generera texter och bilder för sociala medier med AI.
                </p>
                <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                  Generera innehåll
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Trend Monitor</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  Bevaka trender och få AI-rekommendationer.
                </p>
                <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Se trender
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Video Script Generator</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  Skapa videomanus för TikTok, Reels och YouTube.
                </p>
                <button className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
                  Skapa manus
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Budget Optimizer</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  AI-optimerad budgetfördelning över plattformar.
                </p>
                <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Optimera budget
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Competitor Tracker</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  Analysera konkurrenters sociala medier-aktivitet.
                </p>
                <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                  Se konkurrenter
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Recept → Post</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  Konvertera recept till engagerande inlägg.
                </p>
                <button className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  Konvertera recept
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MarketingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MarketingContent />
    </Suspense>
  )
}

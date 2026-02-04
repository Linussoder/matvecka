'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Icons
const BookOpenIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
)

const ChartBarIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
)

const CheckBadgeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>
)

const BeakerIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
  </svg>
)

const CalendarIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
)

const SparklesIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
)

const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
)

const XMarkIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)

const PencilSquareIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
)

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
)

const PlusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const ArrowsRightLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
)

const EyeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

// Tab definitions
const tabs = [
  { id: 'hantering', label: 'Hantering', icon: BookOpenIcon },
  { id: 'kvalitet', label: 'Kvalitet', icon: ChartBarIcon },
  { id: 'verifierade', label: 'Verifierade', icon: CheckBadgeIcon },
  { id: 'ingredienser', label: 'Ingredienser', icon: BeakerIcon },
  { id: 'sasong', label: 'Säsong', icon: CalendarIcon },
]

function RecipesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentTab = searchParams.get('tab') || 'hantering'

  const setTab = (tabId) => {
    router.push(`/admin/recipes?tab=${tabId}`)
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recepthantering</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Granska recept, hantera kvalitet, ingredienser och säsongsplanering
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 flex-wrap border-b border-gray-200 dark:border-slate-700 pb-4">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {currentTab === 'hantering' && <HanteringTab />}
      {currentTab === 'kvalitet' && <KvalitetTab />}
      {currentTab === 'verifierade' && <VerifieradeTab />}
      {currentTab === 'ingredienser' && <IngrediensTab />}
      {currentTab === 'sasong' && <SasongTab />}
    </div>
  )
}

export default function AdminRecipesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RecipesContent />
    </Suspense>
  )
}

function LoadingSpinner() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ============================================
// HANTERING TAB - Recipe Review Queue
// ============================================
function HanteringTab() {
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState([])
  const [filter, setFilter] = useState('pending')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRecipes()
  }, [filter])

  async function fetchRecipes() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/recipes?status=${filter}`)
      const data = await response.json()
      if (data.success) {
        setRecipes(data.recipes || [])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Kunde inte ladda recept')
    } finally {
      setLoading(false)
    }
  }

  async function handleReviewAction(id, action, notes = '') {
    try {
      const response = await fetch('/api/admin/recipes/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, notes }),
      })
      const data = await response.json()
      if (data.success) {
        fetchRecipes()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte utföra åtgärd')
    }
  }

  const filters = [
    { id: 'pending', label: 'Väntar' },
    { id: 'approved', label: 'Godkända' },
    { id: 'rejected', label: 'Avvisade' },
    { id: 'needs_revision', label: 'Behöver ändras' },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f.id
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recipe cards */}
      <div className="space-y-4">
        {recipes.length > 0 ? (
          recipes.map(recipe => (
            <RecipeReviewCard
              key={recipe.id}
              recipe={recipe}
              onAction={handleReviewAction}
            />
          ))
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 text-center">
            <SparklesIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Inga recept i kön just nu</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RecipeReviewCard({ recipe, onAction }) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const recipeData = recipe.recipe_data || {}

  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400',
    approved: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    rejected: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    needs_revision: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white text-lg">
                {recipeData.name || 'Namnlöst recept'}
              </h3>
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[recipe.status]}`}>
                {recipe.status}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                {recipe.source === 'ai_generated' ? 'AI' : recipe.source === 'imported' ? 'Importerad' : 'Användare'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {recipeData.description || 'Ingen beskrivning'}
            </p>
          </div>
          {recipe.quality_score !== null && (
            <div className="ml-4 text-center">
              <div className={`text-2xl font-bold ${
                recipe.quality_score >= 70 ? 'text-green-600' :
                recipe.quality_score >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {recipe.quality_score}
              </div>
              <div className="text-xs text-gray-500">Kvalitet</div>
            </div>
          )}
        </div>

        {/* Recipe details */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tid:</span>
            <span className="ml-2 text-gray-900 dark:text-white">
              {recipeData.prep_time || '-'} + {recipeData.cooking_time || '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Portioner:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{recipeData.servings || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Svårighet:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{recipeData.difficulty || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Ingredienser:</span>
            <span className="ml-2 text-gray-900 dark:text-white">
              {recipeData.ingredients?.length || 0} st
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {recipe.status === 'pending' && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
          {showNotes ? (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lägg till anteckning (valfritt)..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onAction(recipe.id, 'approve', notes)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  Godkänn
                </button>
                <button
                  onClick={() => onAction(recipe.id, 'reject', notes)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Avvisa
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onAction(recipe.id, 'approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Godkänn
              </button>
              <button
                onClick={() => onAction(recipe.id, 'reject')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Avvisa
              </button>
              <button
                onClick={() => setShowNotes(true)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Med anteckning
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// KVALITET TAB - Quality Dashboard
// ============================================
function KvalitetTab() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [topRecipes, setTopRecipes] = useState([])
  const [recentFeedback, setRecentFeedback] = useState([])
  const [subTab, setSubTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/recipes/quality?view=overview')
      const data = await response.json()
      if (response.ok) {
        setOverview(data.overview)
        setTopRecipes(data.topRecipes || [])
        setRecentFeedback(data.recentFeedback || [])
      }
    } catch (err) {
      console.error('Error fetching quality data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard title="Lagade recept" value={overview?.totalRecipesCooked || 0} color="green" />
        <MetricCard title="Feedback" value={overview?.totalFeedback || 0} color="blue" />
        <MetricCard title="Unika användare" value={overview?.uniqueUsers || 0} color="purple" />
        <MetricCard title="Snitt kvalitet" value={overview?.avgQualityScore || 0} suffix="/100" color="orange" />
        <MetricCard title="Snitt smak" value={overview?.avgTasteRating?.toFixed(1) || 0} suffix="/5" color="yellow" />
      </div>

      {/* Sub-tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <div className="flex gap-1 p-1">
            {['overview', 'top', 'feedback'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  subTab === tab
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {tab === 'overview' && 'Översikt'}
                {tab === 'top' && 'Bästa recept'}
                {tab === 'feedback' && 'Senaste feedback'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {subTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Högst rankade recept</h3>
                {topRecipes.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Inga recept rankade än</p>
                ) : (
                  <div className="space-y-3">
                    {topRecipes.slice(0, 5).map((recipe, i) => (
                      <div key={recipe.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                        <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{recipe.recipe_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Lagat {recipe.times_cooked}x</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            recipe.overall_quality_score >= 70 ? 'text-green-600' :
                            recipe.overall_quality_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {Math.round(recipe.overall_quality_score)}
                          </span>
                          <span className="text-xs text-gray-500">/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Senaste feedback</h3>
                {recentFeedback.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Ingen feedback än</p>
                ) : (
                  <div className="space-y-3">
                    {recentFeedback.slice(0, 5).map((fb) => (
                      <div key={fb.id} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-yellow-500">{'★'.repeat(fb.taste_rating || 0)}</span>
                          {fb.would_make_again !== null && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              fb.would_make_again ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                            }`}>
                              {fb.would_make_again ? 'Skulle laga igen' : 'Skulle inte laga igen'}
                            </span>
                          )}
                        </div>
                        {fb.what_to_improve && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{fb.what_to_improve}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(fb.created_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {subTab === 'top' && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Alla rankade recept</h3>
              {topRecipes.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Inga recept rankade än</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                        <th className="pb-3 font-medium">#</th>
                        <th className="pb-3 font-medium">Recept</th>
                        <th className="pb-3 font-medium">Lagat</th>
                        <th className="pb-3 font-medium">Användare</th>
                        <th className="pb-3 font-medium">Smak</th>
                        <th className="pb-3 font-medium">Poäng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRecipes.map((recipe, i) => (
                        <tr key={recipe.id} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
                          <td className="py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                          <td className="py-3 font-medium text-gray-900 dark:text-white">{recipe.recipe_name}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">{recipe.times_cooked}x</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">{recipe.unique_users}</td>
                          <td className="py-3 text-yellow-500">{'★'.repeat(Math.round(recipe.avg_taste_rating || 0))}</td>
                          <td className="py-3">
                            <span className={`font-bold ${
                              recipe.overall_quality_score >= 70 ? 'text-green-600' :
                              recipe.overall_quality_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {Math.round(recipe.overall_quality_score)}
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

          {subTab === 'feedback' && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">All feedback</h3>
              {recentFeedback.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Ingen feedback än</p>
              ) : (
                <div className="space-y-4">
                  {recentFeedback.map((fb) => (
                    <div key={fb.id} className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {fb.recipe_cooking_log?.recipe_data?.name || 'Okänt recept'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(fb.created_at).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {fb.would_make_again !== null && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              fb.would_make_again ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                            }`}>
                              {fb.would_make_again ? 'Skulle laga igen' : 'Nej'}
                            </span>
                          )}
                        </div>
                      </div>
                      {(fb.what_worked || fb.what_to_improve) && (
                        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                          {fb.what_worked && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="text-green-600 font-medium">Bra: </span>{fb.what_worked}
                            </p>
                          )}
                          {fb.what_to_improve && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="text-red-600 font-medium">Förbättra: </span>{fb.what_to_improve}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, suffix = '', color }) {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        <ChartBarIcon className="w-5 h-5" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{suffix}</span>}
      </p>
    </div>
  )
}

// ============================================
// VERIFIERADE TAB - Verified Recipes
// ============================================
function VerifieradeTab() {
  const [recipes, setRecipes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ cuisine: '', meal: '', search: '' })
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  useEffect(() => {
    fetchRecipes()
  }, [page, filters])

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        stats: 'true',
        ...(filters.cuisine && { cuisine: filters.cuisine }),
        ...(filters.meal && { meal: filters.meal }),
        ...(filters.search && { search: filters.search })
      })

      const res = await fetch(`/api/admin/verified-recipes?${params}`)
      const data = await res.json()

      if (data.success) {
        setRecipes(data.recipes || [])
        setTotalPages(data.totalPages || 1)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
    }
    setLoading(false)
  }

  const toggleFewShot = async (id, currentValue) => {
    try {
      await fetch('/api/admin/verified-recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, use_in_few_shot: !currentValue })
      })
      fetchRecipes()
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const deleteRecipe = async (id) => {
    if (!confirm('Är du säker på att du vill ta bort detta recept?')) return
    try {
      await fetch(`/api/admin/verified-recipes?id=${id}`, { method: 'DELETE' })
      fetchRecipes()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Totalt verifierade</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalVerifiedRecipes}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Few-shot exempel</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalFewShotExamples}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Kök-kategorier</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{Object.keys(stats.cuisineDistribution || {}).length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Mest använt</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {stats.topUsedExamples?.[0]?.verified_recipes?.name || '-'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Sök recept..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        />
        <select
          value={filters.cuisine}
          onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          <option value="">Alla kök</option>
          <option value="Swedish">Svenska</option>
          <option value="Italian">Italienskt</option>
          <option value="Asian">Asiatiskt</option>
          <option value="Mexican">Mexikanskt</option>
        </select>
        <select
          value={filters.meal}
          onChange={(e) => setFilters({ ...filters, meal: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          <option value="">Alla måltider</option>
          <option value="breakfast">Frukost</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Middag</option>
        </select>
      </div>

      {/* Recipe List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kök</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Måltid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kvalitet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Few-shot</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {recipes.map(recipe => (
                <tr key={recipe.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{recipe.name}</p>
                    {recipe.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{recipe.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{recipe.cuisine_type || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{recipe.meal_type || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${recipe.quality_score || 0}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{recipe.quality_score || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleFewShot(recipe.id, recipe.use_in_few_shot)}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        recipe.use_in_few_shot
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {recipe.use_in_few_shot ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRecipe(recipe)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteRecipe(recipe.id)}
                        className="p-1.5 text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {recipes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Inga verifierade recept hittades
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300"
            >
              Föregående
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Sida {page} av {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300"
            >
              Nästa
            </button>
          </div>
        )}
      </div>

      {/* View Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRecipe.name}</h2>
              <button onClick={() => setSelectedRecipe(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <pre className="bg-gray-100 dark:bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {JSON.stringify(selectedRecipe.recipe_data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// INGREDIENSER TAB - Ingredients Database
// ============================================
function IngrediensTab() {
  const [ingredients, setIngredients] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchIngredients()
    } else if (selectedCategory) {
      fetchByCategory()
    }
  }, [searchQuery, selectedCategory])

  const fetchData = async () => {
    setLoading(true)
    try {
      const catRes = await fetch('/api/ingredients?action=categories')
      const catData = await catRes.json()
      if (catData.success) setCategories(catData.categories)

      const statsRes = await fetch('/api/ingredients?action=stats')
      const statsData = await statsRes.json()
      if (statsData.success) setStats(statsData.stats)

      const ingRes = await fetch('/api/ingredients?action=by_category&category=Kött')
      const ingData = await ingRes.json()
      if (ingData.success) setIngredients(ingData.ingredients)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const searchIngredients = async () => {
    try {
      const res = await fetch(`/api/ingredients?action=search&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.success) setIngredients(data.ingredients)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const fetchByCategory = async () => {
    try {
      const res = await fetch(`/api/ingredients?action=by_category&category=${encodeURIComponent(selectedCategory)}`)
      const data = await res.json()
      if (data.success) setIngredients(data.ingredients)
    } catch (error) {
      console.error('Category fetch failed:', error)
    }
  }

  const selectIngredient = async (ingredient) => {
    setSelectedIngredient(ingredient)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Totalt ingredienser</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalIngredients}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Vegetariska</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.vegetarianCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Veganska</p>
            <p className="text-3xl font-bold text-green-600">{stats.veganCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Verifierade substitut</p>
            <p className="text-3xl font-bold text-blue-600">{stats.verifiedSubstitutes}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Ingredient List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 space-y-3">
              <input
                type="text"
                placeholder="Sök ingrediens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
              />
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setSearchQuery('') }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Välj kategori</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
              {ingredients.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">Inga ingredienser hittades</div>
              ) : (
                ingredients.map(ing => (
                  <button
                    key={ing.id}
                    onClick={() => selectIngredient(ing)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                      selectedIngredient?.id === ing.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{ing.name_sv}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ing.category}</p>
                    <div className="flex gap-1 mt-1">
                      {ing.is_vegetarian && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">V</span>}
                      {ing.is_vegan && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">VG</span>}
                      {ing.is_gluten_free && <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">GF</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="lg:col-span-2">
          {selectedIngredient ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedIngredient.name_sv}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedIngredient.name_en || 'Ingen engelsk översättning'}</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Nutrition */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Näringsvärden per 100g</h3>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedIngredient.calories || '-'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedIngredient.protein || '-'}g</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedIngredient.carbs || '-'}g</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Kolhydrater</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedIngredient.fat || '-'}g</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fett</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedIngredient.fiber || '-'}g</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fiber</p>
                    </div>
                  </div>
                </div>

                {/* Dietary Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Kostinformation</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedIngredient.is_vegetarian
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {selectedIngredient.is_vegetarian ? '✓' : '✗'} Vegetarisk
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedIngredient.is_vegan
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {selectedIngredient.is_vegan ? '✓' : '✗'} Vegansk
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedIngredient.is_gluten_free
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {selectedIngredient.is_gluten_free ? '✓' : '✗'} Glutenfri
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
              <BeakerIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Välj en ingrediens för att se detaljer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// SÄSONG TAB - Seasonal Recipes & Substitutions
// ============================================
function SasongTab() {
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState('seasons')
  const [seasonalRecipes, setSeasonalRecipes] = useState([])
  const [substitutions, setSubstitutions] = useState([])
  const [showSeasonForm, setShowSeasonForm] = useState(false)
  const [showSubstitutionForm, setShowSubstitutionForm] = useState(false)
  const [editingSeason, setEditingSeason] = useState(null)
  const [editingSubstitution, setEditingSubstitution] = useState(null)

  useEffect(() => {
    fetchData()
  }, [subTab])

  async function fetchData() {
    setLoading(true)
    try {
      if (subTab === 'seasons') {
        const response = await fetch('/api/admin/recipes/seasons')
        const data = await response.json()
        if (data.success) {
          setSeasonalRecipes(data.recipes || [])
        }
      } else {
        const response = await fetch('/api/admin/recipes/substitutions')
        const data = await response.json()
        if (data.success) {
          setSubstitutions(data.substitutions || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSeason(item) {
    try {
      const method = item.id ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/recipes/seasons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      const data = await response.json()
      if (data.success) {
        setShowSeasonForm(false)
        setEditingSeason(null)
        fetchData()
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDeleteSeason(id) {
    if (!confirm('Är du säker på att du vill ta bort detta säsongsrecept?')) return
    try {
      await fetch('/api/admin/recipes/seasons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      fetchData()
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  async function handleSaveSubstitution(item) {
    try {
      const method = item.id ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/recipes/substitutions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      const data = await response.json()
      if (data.success) {
        setShowSubstitutionForm(false)
        setEditingSubstitution(null)
        fetchData()
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDeleteSubstitution(id) {
    if (!confirm('Är du säker på att du vill ta bort denna ersättning?')) return
    try {
      await fetch('/api/admin/recipes/substitutions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      fetchData()
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  const seasonLabels = { spring: 'Vår', summer: 'Sommar', fall: 'Höst', winter: 'Vinter' }
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

  const categoryLabels = { dairy: 'Mejeri', meat: 'Kött', gluten: 'Gluten', allergy: 'Allergi', vegan: 'Veganskt', budget: 'Budget', seasonal: 'Säsong' }
  const categoryColors = {
    dairy: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
    meat: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    gluten: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
    allergy: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400',
    vegan: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    budget: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400',
    seasonal: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400',
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSubTab('seasons')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            subTab === 'seasons'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <CalendarIcon className="w-4 h-4 inline mr-2" />
          Säsongsrecept
        </button>
        <button
          onClick={() => setSubTab('substitutions')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            subTab === 'substitutions'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <ArrowsRightLeftIcon className="w-4 h-4 inline mr-2" />
          Ersättningar
        </button>
        <div className="flex-1" />
        {subTab === 'seasons' && (
          <button
            onClick={() => { setEditingSeason({ is_featured: false, seasons: [], months: [], seasonal_tags: [] }); setShowSeasonForm(true) }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Lägg till
          </button>
        )}
        {subTab === 'substitutions' && (
          <button
            onClick={() => { setEditingSubstitution({ is_active: true, category: 'dairy', substitution_ratio: 1 }); setShowSubstitutionForm(true) }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Lägg till
          </button>
        )}
      </div>

      {/* Seasons Content */}
      {subTab === 'seasons' && (
        <div className="space-y-4">
          {seasonalRecipes.length > 0 ? (
            seasonalRecipes.map(recipe => (
              <div key={recipe.id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{recipe.recipe_name}</h3>
                      {recipe.is_featured && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-full">Utvald</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {recipe.seasons?.map(season => (
                        <span key={season} className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded">
                          {seasonLabels[season] || season}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recipe.months?.map(month => (
                        <span key={month} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded">
                          {monthLabels[month - 1]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingSeason(recipe); setShowSeasonForm(true) }} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteSeason(recipe.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Inga säsongsrecept konfigurerade ännu</p>
            </div>
          )}
        </div>
      )}

      {/* Substitutions Content */}
      {subTab === 'substitutions' && (
        <div className="space-y-4">
          {substitutions.length > 0 ? (
            substitutions.map(sub => (
              <div key={sub.id} className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 ${!sub.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-medium text-gray-900 dark:text-white">{sub.original_ingredient}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Original</div>
                    </div>
                    <ArrowsRightLeftIcon className="w-5 h-5 text-gray-400" />
                    <div className="text-center">
                      <div className="font-medium text-gray-900 dark:text-white">{sub.substitute_ingredient}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Ersättning</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[sub.category] || 'bg-gray-100 text-gray-600'}`}>
                      {categoryLabels[sub.category] || sub.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${sub.is_active ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                      {sub.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <button onClick={() => { setEditingSubstitution(sub); setShowSubstitutionForm(true) }} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteSubstitution(sub.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 text-center">
              <ArrowsRightLeftIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Inga ersättningar konfigurerade ännu</p>
            </div>
          )}
        </div>
      )}

      {/* Season Form Modal */}
      {showSeasonForm && editingSeason && (
        <SeasonFormModal
          item={editingSeason}
          onSave={handleSaveSeason}
          onClose={() => { setShowSeasonForm(false); setEditingSeason(null) }}
        />
      )}

      {/* Substitution Form Modal */}
      {showSubstitutionForm && editingSubstitution && (
        <SubstitutionFormModal
          item={editingSubstitution}
          onSave={handleSaveSubstitution}
          onClose={() => { setShowSubstitutionForm(false); setEditingSubstitution(null) }}
        />
      )}
    </div>
  )
}

// Season Form Modal Component
function SeasonFormModal({ item, onSave, onClose }) {
  const [formData, setFormData] = useState({
    recipe_name: '',
    recipe_hash: '',
    seasons: [],
    months: [],
    seasonal_tags: [],
    is_featured: false,
    ...item
  })
  const [tagInput, setTagInput] = useState('')

  const allSeasons = [
    { id: 'spring', label: 'Vår' },
    { id: 'summer', label: 'Sommar' },
    { id: 'fall', label: 'Höst' },
    { id: 'winter', label: 'Vinter' },
  ]

  const allMonths = [
    { id: 1, label: 'Jan' }, { id: 2, label: 'Feb' }, { id: 3, label: 'Mar' },
    { id: 4, label: 'Apr' }, { id: 5, label: 'Maj' }, { id: 6, label: 'Jun' },
    { id: 7, label: 'Jul' }, { id: 8, label: 'Aug' }, { id: 9, label: 'Sep' },
    { id: 10, label: 'Okt' }, { id: 11, label: 'Nov' }, { id: 12, label: 'Dec' },
  ]

  function toggleSeason(seasonId) {
    const seasons = formData.seasons || []
    if (seasons.includes(seasonId)) {
      setFormData({ ...formData, seasons: seasons.filter(s => s !== seasonId) })
    } else {
      setFormData({ ...formData, seasons: [...seasons, seasonId] })
    }
  }

  function toggleMonth(monthId) {
    const months = formData.months || []
    if (months.includes(monthId)) {
      setFormData({ ...formData, months: months.filter(m => m !== monthId) })
    } else {
      setFormData({ ...formData, months: [...months, monthId] })
    }
  }

  function addTag() {
    if (tagInput.trim() && !formData.seasonal_tags?.includes(tagInput.trim())) {
      setFormData({ ...formData, seasonal_tags: [...(formData.seasonal_tags || []), tagInput.trim()] })
      setTagInput('')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const dataToSave = { ...formData, recipe_hash: formData.recipe_hash || formData.recipe_name.toLowerCase().replace(/\s+/g, '-') }
    onSave(dataToSave)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{item.id ? 'Redigera säsongsrecept' : 'Nytt säsongsrecept'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receptnamn *</label>
            <input
              type="text"
              value={formData.recipe_name}
              onChange={(e) => setFormData({ ...formData, recipe_name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Säsonger</label>
            <div className="flex flex-wrap gap-2">
              {allSeasons.map(season => (
                <button
                  key={season.id}
                  type="button"
                  onClick={() => toggleSeason(season.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    formData.seasons?.includes(season.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {season.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Månader</label>
            <div className="grid grid-cols-6 gap-2">
              {allMonths.map(month => (
                <button
                  key={month.id}
                  type="button"
                  onClick={() => toggleMonth(month.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    formData.months?.includes(month.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taggar</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="t.ex. jul, midsommar"
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
              />
              <button type="button" onClick={addTag} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                Lägg till
              </button>
            </div>
            {formData.seasonal_tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.seasonal_tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded flex items-center gap-1">
                    #{tag}
                    <button type="button" onClick={() => setFormData({ ...formData, seasonal_tags: formData.seasonal_tags.filter(t => t !== tag) })}>
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Utvalt recept</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Avbryt</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">{item.id ? 'Spara' : 'Skapa'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Substitution Form Modal Component
function SubstitutionFormModal({ item, onSave, onClose }) {
  const [formData, setFormData] = useState({
    original_ingredient: '',
    substitute_ingredient: '',
    category: 'dairy',
    substitution_ratio: 1,
    notes: '',
    is_active: true,
    ...item
  })

  const categories = [
    { id: 'dairy', label: 'Mejeri' },
    { id: 'meat', label: 'Kött' },
    { id: 'gluten', label: 'Gluten' },
    { id: 'allergy', label: 'Allergi' },
    { id: 'vegan', label: 'Veganskt' },
    { id: 'budget', label: 'Budget' },
    { id: 'seasonal', label: 'Säsong' },
  ]

  function handleSubmit(e) {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{item.id ? 'Redigera ersättning' : 'Ny ersättning'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original ingrediens *</label>
              <input
                type="text"
                value={formData.original_ingredient}
                onChange={(e) => setFormData({ ...formData, original_ingredient: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="t.ex. mjölk"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ersättning *</label>
              <input
                type="text"
                value={formData.substitute_ingredient}
                onChange={(e) => setFormData({ ...formData, substitute_ingredient: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="t.ex. havremjölk"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Förhållande</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={formData.substitution_ratio}
                onChange={(e) => setFormData({ ...formData, substitution_ratio: parseFloat(e.target.value) || 1 })}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anteckningar</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="Valfri information..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Aktiv</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Avbryt</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">{item.id ? 'Spara' : 'Skapa'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

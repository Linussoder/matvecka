'use client'

import { useState, useEffect } from 'react'
import { SparklesIcon, ArrowsRightLeftIcon, CalendarIcon, BeakerIcon, CheckIcon, XMarkIcon, PencilSquareIcon, TrashIcon, PlusIcon } from '@/components/admin/Icons'

export default function AdminRecipesPage() {
  const [activeTab, setActiveTab] = useState('review')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  // Review queue state
  const [recipes, setRecipes] = useState([])
  const [reviewFilter, setReviewFilter] = useState('pending')

  // Substitutions state
  const [substitutions, setSubstitutions] = useState([])
  const [showSubstitutionForm, setShowSubstitutionForm] = useState(false)
  const [editingSubstitution, setEditingSubstitution] = useState(null)

  // Seasons state
  const [seasonalRecipes, setSeasonalRecipes] = useState([])
  const [showSeasonForm, setShowSeasonForm] = useState(false)
  const [editingSeason, setEditingSeason] = useState(null)

  useEffect(() => {
    fetchData()
  }, [activeTab, reviewFilter])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'review') {
        const response = await fetch(`/api/admin/recipes?status=${reviewFilter}`)
        const data = await response.json()
        if (data.success) {
          setRecipes(data.recipes || [])
          setNeedsSetup(data.needsSetup)
        } else {
          setError(data.error)
        }
      } else if (activeTab === 'substitutions') {
        const response = await fetch('/api/admin/recipes/substitutions')
        const data = await response.json()
        if (data.success) {
          setSubstitutions(data.substitutions || [])
          setNeedsSetup(data.needsSetup)
        } else {
          setError(data.error)
        }
      } else if (activeTab === 'seasons') {
        const response = await fetch('/api/admin/recipes/seasons')
        const data = await response.json()
        if (data.success) {
          setSeasonalRecipes(data.recipes || [])
          setNeedsSetup(data.needsSetup)
        } else {
          setError(data.error)
        }
      }
    } catch (err) {
      setError('Kunde inte ladda data')
    } finally {
      setLoading(false)
    }
  }

  // Review actions
  async function handleReviewAction(id, action, notes = '') {
    try {
      const response = await fetch('/api/admin/recipes/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, notes }),
      })
      const data = await response.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte utföra åtgärd')
    }
  }

  // Substitution CRUD
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
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDeleteSubstitution(id) {
    if (!confirm('Är du säker på att du vill ta bort denna ersättning?')) return
    try {
      const response = await fetch('/api/admin/recipes/substitutions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  // Season CRUD
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
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte spara')
    }
  }

  async function handleDeleteSeason(id) {
    if (!confirm('Är du säker på att du vill ta bort detta säsongsrecept?')) return
    try {
      const response = await fetch('/api/admin/recipes/seasons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      alert('Kunde inte ta bort')
    }
  }

  const tabs = [
    { id: 'review', label: 'Granskningskö', Icon: SparklesIcon },
    { id: 'substitutions', label: 'Ersättningar', Icon: ArrowsRightLeftIcon },
    { id: 'seasons', label: 'Säsongsrecept', Icon: CalendarIcon },
    { id: 'nutrition', label: 'Näringsvärden', Icon: BeakerIcon },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (needsSetup) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Databas behöver konfigureras
          </h2>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            Recepttabellerna finns inte ännu. Kör migrationsfilen <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">20250203_content_recipe_management.sql</code> i Supabase.
          </p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recepthantering</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Granska recept, hantera ersättningar och säsongsplanering
          </p>
        </div>
        {activeTab === 'substitutions' && (
          <button
            onClick={() => {
              setEditingSubstitution({ is_active: true, category: 'dairy', substitution_ratio: 1 })
              setShowSubstitutionForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Lägg till ersättning
          </button>
        )}
        {activeTab === 'seasons' && (
          <button
            onClick={() => {
              setEditingSeason({ is_featured: false, seasons: [], months: [], seasonal_tags: [] })
              setShowSeasonForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Lägg till säsongsrecept
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => {
          const TabIcon = tab.Icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'review' && (
        <ReviewQueueTab
          recipes={recipes}
          filter={reviewFilter}
          onFilterChange={setReviewFilter}
          onAction={handleReviewAction}
        />
      )}

      {activeTab === 'substitutions' && (
        <SubstitutionsTab
          substitutions={substitutions}
          onEdit={(item) => {
            setEditingSubstitution(item)
            setShowSubstitutionForm(true)
          }}
          onDelete={handleDeleteSubstitution}
        />
      )}

      {activeTab === 'seasons' && (
        <SeasonsTab
          recipes={seasonalRecipes}
          onEdit={(item) => {
            setEditingSeason(item)
            setShowSeasonForm(true)
          }}
          onDelete={handleDeleteSeason}
        />
      )}

      {activeTab === 'nutrition' && (
        <NutritionTab />
      )}

      {/* Substitution Form Modal */}
      {showSubstitutionForm && editingSubstitution && (
        <SubstitutionFormModal
          item={editingSubstitution}
          onSave={handleSaveSubstitution}
          onClose={() => {
            setShowSubstitutionForm(false)
            setEditingSubstitution(null)
          }}
        />
      )}

      {/* Season Form Modal */}
      {showSeasonForm && editingSeason && (
        <SeasonFormModal
          item={editingSeason}
          onSave={handleSaveSeason}
          onClose={() => {
            setShowSeasonForm(false)
            setEditingSeason(null)
          }}
        />
      )}
    </div>
  )
}

// Review Queue Tab Component
function ReviewQueueTab({ recipes, filter, onFilterChange, onAction }) {
  const filters = [
    { id: 'pending', label: 'Väntar' },
    { id: 'approved', label: 'Godkända' },
    { id: 'rejected', label: 'Avvisade' },
    { id: 'needs_revision', label: 'Behöver ändras' },
  ]

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
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
              onAction={onAction}
            />
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <SparklesIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Inga recept i kön just nu
            </p>
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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

        {/* Nutrition summary */}
        {recipeData.nutrition && (
          <div className="mt-3 flex gap-4 text-xs">
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
              {recipeData.nutrition.calories} kcal
            </span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
              P: {recipeData.nutrition.protein}g
            </span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
              K: {recipeData.nutrition.carbs}g
            </span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
              F: {recipeData.nutrition.fat}g
            </span>
          </div>
        )}

        {/* Flags */}
        {recipe.flags && recipe.flags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recipe.flags.map((flag, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded">
                {flag}
              </span>
            ))}
          </div>
        )}

        {/* Reviewer notes */}
        {recipe.reviewer_notes && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Anteckning:</strong> {recipe.reviewer_notes}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {recipe.status === 'pending' && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700">
          {showNotes ? (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lägg till anteckning (valfritt)..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
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
                  onClick={() => onAction(recipe.id, 'needs_revision', notes)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Behöver ändras
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
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

// Substitutions Tab Component
function SubstitutionsTab({ substitutions, onEdit, onDelete }) {
  const categoryLabels = {
    dairy: 'Mejeri',
    meat: 'Kött',
    gluten: 'Gluten',
    allergy: 'Allergi',
    vegan: 'Veganskt',
    budget: 'Budget',
    seasonal: 'Säsong',
  }

  const categoryColors = {
    dairy: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
    meat: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    gluten: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
    allergy: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400',
    vegan: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
    budget: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400',
    seasonal: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400',
  }

  return (
    <div className="space-y-4">
      {substitutions.length > 0 ? (
        substitutions.map(sub => (
          <div
            key={sub.id}
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${
              !sub.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">{sub.original_ingredient}</div>
                  <div className="text-xs text-gray-500">Original</div>
                </div>
                <ArrowsRightLeftIcon className="w-5 h-5 text-gray-400" />
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">{sub.substitute_ingredient}</div>
                  <div className="text-xs text-gray-500">Ersättning</div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[sub.category] || 'bg-gray-100 text-gray-600'}`}>
                  {categoryLabels[sub.category] || sub.category}
                </span>
                {sub.substitution_ratio !== 1 && (
                  <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                    {sub.substitution_ratio}x
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  sub.is_active
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {sub.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
                <button
                  onClick={() => onEdit(sub)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(sub.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            {sub.notes && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{sub.notes}</p>
            )}
          </div>
        ))
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <ArrowsRightLeftIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Inga ersättningar konfigurerade ännu</p>
        </div>
      )}
    </div>
  )
}

// Seasons Tab Component
function SeasonsTab({ recipes, onEdit, onDelete }) {
  const seasonLabels = { spring: 'Vår', summer: 'Sommar', fall: 'Höst', winter: 'Vinter' }
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

  return (
    <div className="space-y-4">
      {recipes.length > 0 ? (
        recipes.map(recipe => (
          <div
            key={recipe.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{recipe.recipe_name}</h3>
                  {recipe.is_featured && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-full">
                      Utvald
                    </span>
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
                    <span key={month} className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                      {monthLabels[month - 1]}
                    </span>
                  ))}
                </div>
                {recipe.seasonal_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {recipe.seasonal_tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(recipe)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(recipe.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Inga säsongsrecept konfigurerade ännu</p>
        </div>
      )}
    </div>
  )
}

// Nutrition Tab Component
function NutritionTab() {
  const [verifying, setVerifying] = useState(false)
  const [recipeInput, setRecipeInput] = useState('')
  const [result, setResult] = useState(null)

  async function handleVerify() {
    if (!recipeInput.trim()) return
    setVerifying(true)
    try {
      const response = await fetch('/api/admin/recipes/nutrition/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_identifier: recipeInput }),
      })
      const data = await response.json()
      if (data.success) {
        setResult(data.verification)
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kunde inte verifiera')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Verifiera näringsvärden</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={recipeInput}
            onChange={(e) => setRecipeInput(e.target.value)}
            placeholder="Ange receptnamn eller ID..."
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <BeakerIcon className="w-5 h-5" />
            {verifying ? 'Verifierar...' : 'Verifiera'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Verifieringsresultat</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Original</p>
                <div className="space-y-1 text-sm">
                  <div>Kalorier: {result.original_nutrition?.calories || '-'}</div>
                  <div>Protein: {result.original_nutrition?.protein || '-'}g</div>
                  <div>Kolhydrater: {result.original_nutrition?.carbs || '-'}g</div>
                  <div>Fett: {result.original_nutrition?.fat || '-'}g</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Beräknat</p>
                <div className="space-y-1 text-sm">
                  <div>Kalorier: {result.calculated_nutrition?.calories || '-'}</div>
                  <div>Protein: {result.calculated_nutrition?.protein || '-'}g</div>
                  <div>Kolhydrater: {result.calculated_nutrition?.carbs || '-'}g</div>
                  <div>Fett: {result.calculated_nutrition?.fat || '-'}g</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Om näringsverifiering</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Verktyget jämför AI-genererade näringsvärden med beräknade värden baserat på ingredienserna.
          Stora avvikelser kan indikera fel i receptet eller näringsberäkningen.
        </p>
      </div>
    </div>
  )
}

// Substitution Form Modal
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
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {item.id ? 'Redigera ersättning' : 'Ny ersättning'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Original ingrediens *
              </label>
              <input
                type="text"
                value={formData.original_ingredient}
                onChange={(e) => setFormData({ ...formData, original_ingredient: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="t.ex. mjölk"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ersättning *
              </label>
              <input
                type="text"
                value={formData.substitute_ingredient}
                onChange={(e) => setFormData({ ...formData, substitute_ingredient: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="t.ex. havremjölk"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Förhållande
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={formData.substitution_ratio}
                onChange={(e) => setFormData({ ...formData, substitution_ratio: parseFloat(e.target.value) || 1 })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Anteckningar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="Valfri information om ersättningen..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Aktiv</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {item.id ? 'Spara' : 'Skapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Season Form Modal
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
    { id: 1, label: 'Januari' },
    { id: 2, label: 'Februari' },
    { id: 3, label: 'Mars' },
    { id: 4, label: 'April' },
    { id: 5, label: 'Maj' },
    { id: 6, label: 'Juni' },
    { id: 7, label: 'Juli' },
    { id: 8, label: 'Augusti' },
    { id: 9, label: 'September' },
    { id: 10, label: 'Oktober' },
    { id: 11, label: 'November' },
    { id: 12, label: 'December' },
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
      setFormData({
        ...formData,
        seasonal_tags: [...(formData.seasonal_tags || []), tagInput.trim()]
      })
      setTagInput('')
    }
  }

  function removeTag(tag) {
    setFormData({
      ...formData,
      seasonal_tags: formData.seasonal_tags.filter(t => t !== tag)
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Generate hash from recipe name if not provided
    const dataToSave = {
      ...formData,
      recipe_hash: formData.recipe_hash || formData.recipe_name.toLowerCase().replace(/\s+/g, '-')
    }
    onSave(dataToSave)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {item.id ? 'Redigera säsongsrecept' : 'Nytt säsongsrecept'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Receptnamn *
            </label>
            <input
              type="text"
              value={formData.recipe_name}
              onChange={(e) => setFormData({ ...formData, recipe_name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Säsonger
            </label>
            <div className="flex flex-wrap gap-2">
              {allSeasons.map(season => (
                <button
                  key={season.id}
                  type="button"
                  onClick={() => toggleSeason(season.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    formData.seasons?.includes(season.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {season.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Månader
            </label>
            <div className="grid grid-cols-4 gap-2">
              {allMonths.map(month => (
                <button
                  key={month.id}
                  type="button"
                  onClick={() => toggleMonth(month.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    formData.months?.includes(month.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taggar
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="t.ex. jul, midsommar, grillning"
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Lägg till
              </button>
            </div>
            {formData.seasonal_tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.seasonal_tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded flex items-center gap-1"
                  >
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-purple-900">
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
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Utvalt recept</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {item.id ? 'Spara' : 'Skapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

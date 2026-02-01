'use client'

import { useState } from 'react'
import { useFavorites } from '@/lib/FavoritesContext'
import Link from 'next/link'
import FavoriteButton from '@/components/FavoriteButton'

export default function FavoritesPage() {
  const { favorites, loading, user, markAsMade, updateFavorite } = useFavorites()
  const [expandedRecipe, setExpandedRecipe] = useState(null)
  const [filter, setFilter] = useState('all') // all, recent, top-rated

  // Filter and sort favorites
  const filteredFavorites = [...favorites].sort((a, b) => {
    if (filter === 'recent') {
      return new Date(b.created_at) - new Date(a.created_at)
    }
    if (filter === 'top-rated') {
      return (b.rating || 0) - (a.rating || 0)
    }
    if (filter === 'most-made') {
      return (b.times_made || 0) - (a.times_made || 0)
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Dina favoritrecept
            </h1>
            <p className="text-gray-500 mb-6">
              Logga in för att spara och se dina favoritrecept.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/login"
                className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Logga in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Skapa konto
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 border">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Mina favoriter
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {favorites.length} {favorites.length === 1 ? 'recept' : 'recept'} sparade
              </p>
            </div>

            {/* Filter */}
            {favorites.length > 0 && (
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'Alla' },
                  { id: 'recent', label: 'Senaste' },
                  { id: 'top-rated', label: 'Högst betyg' },
                  { id: 'most-made', label: 'Mest lagade' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      filter === f.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Empty State */}
        {favorites.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Inga sparade recept ännu
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Klicka på hjärtat på recept du gillar för att spara dem här.
            </p>
            <Link
              href="/meal-planner"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
            >
              Skapa en matplan
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Favorites Grid */}
        {favorites.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFavorites.map((favorite) => (
              <RecipeCard
                key={favorite.id}
                favorite={favorite}
                isExpanded={expandedRecipe === favorite.id}
                onExpand={() => setExpandedRecipe(
                  expandedRecipe === favorite.id ? null : favorite.id
                )}
                onMarkAsMade={() => markAsMade(favorite.recipe_id)}
                onRate={(rating) => updateFavorite(favorite.recipe_id, { rating })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Recipe Card Component
function RecipeCard({ favorite, isExpanded, onExpand, onMarkAsMade, onRate }) {
  const recipe = favorite.recipe
  if (!recipe) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2">
              {recipe.title || recipe.name}
            </h3>
            {recipe.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>
          <FavoriteButton recipe={recipe} variant="icon" />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          {recipe.prep_time && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.prep_time + (recipe.cook_time || 0)} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              {recipe.servings} port
            </span>
          )}
          {favorite.times_made > 0 && (
            <span className="text-green-600">
              Lagat {favorite.times_made}x
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onRate(star)}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <svg
                className={`w-5 h-5 ${
                  star <= (favorite.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-2">
            {favorite.rating ? `${favorite.rating}/5` : 'Betygsätt'}
          </span>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={onExpand}
        className="w-full px-4 py-2 bg-gray-50 border-t text-sm text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1"
      >
        {isExpanded ? 'Dölj recept' : 'Visa recept'}
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t bg-gray-50">
          {/* Ingredients */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Ingredienser</h4>
            <ul className="space-y-1">
              {(recipe.ingredients || []).map((ing, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ing}`.trim()}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Instruktioner</h4>
            <ol className="space-y-2">
              {(recipe.instructions || []).map((step, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{typeof step === 'string' ? step : step.instruction || step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={onMarkAsMade}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              ✓ Markera som lagad
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

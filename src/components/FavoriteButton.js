'use client'

import { useState } from 'react'
import { useFavorites } from '@/lib/FavoritesContext'

/**
 * FavoriteButton - Works with both regular recipes and meal plan recipes
 *
 * For regular recipes: pass recipe with recipe.id
 * For meal plan recipes: pass mealPlanRecipeId and recipeData props
 */
export default function FavoriteButton({
  recipe,
  mealPlanRecipeId,
  recipeData,
  variant = 'default',
  className = ''
}) {
  const {
    isFavorite,
    toggleFavorite,
    isMealPlanFavorite,
    toggleMealPlanFavorite,
    user
  } = useFavorites()
  const [isLoading, setIsLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Determine if this is a meal plan recipe or regular recipe
  const isMealPlanRecipe = !!mealPlanRecipeId
  const isFav = isMealPlanRecipe
    ? isMealPlanFavorite(mealPlanRecipeId)
    : isFavorite(recipe?.id)

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2000)
      return
    }

    setIsLoading(true)
    if (isMealPlanRecipe) {
      await toggleMealPlanFavorite(mealPlanRecipeId, recipeData || recipe)
    } else {
      await toggleFavorite(recipe.id)
    }
    setIsLoading(false)
  }

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`p-1.5 rounded-full transition-all ${
            isFav
              ? 'text-red-500 hover:text-red-600'
              : 'text-gray-400 hover:text-red-400'
          } ${isLoading ? 'opacity-50' : ''} ${className}`}
          aria-label={isFav ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isLoading ? 'animate-pulse' : ''} ${
              isFav ? 'fill-current' : ''
            }`}
            fill={isFav ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

        {/* Login tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap z-50">
            Logga in för att spara favoriter
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    )
  }

  // Default button variant
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          isFav
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${isLoading ? 'opacity-50' : ''} ${className}`}
      >
        <svg
          className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`}
          fill={isFav ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
        <span className="text-sm font-medium">
          {isFav ? 'Sparad' : 'Spara'}
        </span>
      </button>

      {/* Login tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap z-50">
          Logga in för att spara favoriter
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

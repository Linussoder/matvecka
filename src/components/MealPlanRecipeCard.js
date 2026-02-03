'use client'

import { useState, useRef } from 'react'
import FavoriteButton from '@/components/FavoriteButton'
import { useFavorites } from '@/lib/FavoritesContext'

const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

export default function MealPlanRecipeCard({ recipe, day, mealPlanRecipeId, mealPlanId, onRecipeSwitch, isPremium = false }) {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false)
  const [showFavoritesPicker, setShowFavoritesPicker] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState(null)
  const { favorites, user } = useFavorites()

  // Nutrition state
  const [nutrition, setNutrition] = useState(null)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [nutritionError, setNutritionError] = useState(null)
  const hasFetchedNutrition = useRef(false)

  const handleToggle = async (e) => {
    // Only fetch nutrition when opening and haven't fetched yet
    if (e.target.open && !hasFetchedNutrition.current && !nutrition) {
      hasFetchedNutrition.current = true
      fetchNutrition()
    }
  }

  const fetchNutrition = async () => {
    setNutritionLoading(true)
    setNutritionError(null)

    try {
      const response = await fetch('/api/nutrition/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe })
      })

      const data = await response.json()

      if (data.success && data.nutrition) {
        setNutrition(data.nutrition)
      } else {
        setNutritionError('Kunde inte beräkna näringsvärden')
      }
    } catch (err) {
      console.error('Error fetching nutrition:', err)
      setNutritionError('Ett fel uppstod')
    } finally {
      setNutritionLoading(false)
    }
  }

  const handleRegenerateRecipe = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRegenerating(true)
    setError(null)

    try {
      console.log('Regenerating recipe:', { mealPlanId, mealPlanRecipeId, dayNumber: day })

      const response = await fetch('/api/meal-plan/regenerate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealPlanId,
          mealPlanRecipeId,
          dayNumber: day
        })
      })

      const data = await response.json()
      console.log('Regenerate response:', data)

      if (response.ok && data.success) {
        // Success - reload page to show new recipe
        window.location.reload()
        return // Don't run cleanup since we're reloading
      } else {
        setError(data.error || 'Kunde inte skapa nytt recept')
        console.error('Error response:', data)
      }
    } catch (error) {
      console.error('Error regenerating recipe:', error)
      setError('Ett fel uppstod. Försök igen.')
    }

    // Only cleanup state if we didn't reload
    setIsRegenerating(false)
    setShowSwitchMenu(false)
  }

  const handleSwitchToFavorite = async (favorite) => {
    setIsSwitching(true)
    setError(null)

    // Validate favorite has recipe data
    if (!favorite?.recipe) {
      setError('Receptdata saknas')
      setIsSwitching(false)
      return
    }

    try {
      console.log('Switching to favorite:', { mealPlanId, mealPlanRecipeId, recipe: favorite.recipe?.name })

      const response = await fetch('/api/meal-plan/switch-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealPlanId,
          mealPlanRecipeId,
          newRecipeData: favorite.recipe
        })
      })

      const data = await response.json()
      console.log('Switch response:', data)

      if (response.ok && data.success) {
        // Success - reload page to show new recipe
        window.location.reload()
        return // Don't run finally cleanup since we're reloading
      } else {
        setError(data.error || 'Kunde inte byta recept')
        console.error('Error response:', data)
      }
    } catch (error) {
      console.error('Error switching recipe:', error)
      setError('Ett fel uppstod. Försök igen.')
    }

    // Only cleanup state if we didn't reload
    setIsSwitching(false)
    setShowFavoritesPicker(false)
    setShowSwitchMenu(false)
  }

  return (
    <details className="bg-white rounded-xl shadow-sm overflow-hidden group" onToggle={handleToggle}>
      <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {dayNames[day - 1]}
              </span>
              <span className="text-gray-500 text-sm">Dag {day}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{recipe.name}</h3>
            <p className="text-gray-600 mt-1">{recipe.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <FavoriteButton
              mealPlanRecipeId={mealPlanRecipeId}
              recipeData={recipe}
              variant="icon"
            />
            <div className="text-gray-400 group-open:rotate-180 transition-transform">
              ▼
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
          <span className="flex items-center gap-1">
            {recipe.prepTime || recipe.prep_time} + {recipe.cookTime || recipe.cook_time}
          </span>
          <span className="flex items-center gap-1">
            {recipe.servings} portioner
          </span>
          <span className="flex items-center gap-1 text-green-600 font-semibold">
            {recipe.estimatedCost || 'N/A'} kr
          </span>
          <span className="flex items-center gap-1">
            {recipe.difficulty}
          </span>
        </div>
      </summary>

      <div className="px-6 pb-6 pt-0 border-t border-gray-200">
        {/* Nutrition Info */}
        <div className="mt-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Näringsvärde per portion:</h4>
          {!isPremium ? (
            /* Premium gate - show sample preview */
            <div className="rounded-lg overflow-hidden border border-gray-200">
              {/* Example banner */}
              <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-700 font-medium">Exempelbild</span>
                <span className="text-xs text-gray-500">– Premium-funktion</span>
              </div>
              {/* Sample nutrition data - visible so users can see what they'd get */}
              <div className="bg-gray-50 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none pointer-events-none">
                  <div><p className="text-gray-500 text-xs">Kalorier</p><p className="font-semibold text-gray-900 text-base">485 <span className="text-gray-500 font-normal text-xs">kcal</span></p></div>
                  <div><p className="text-gray-500 text-xs">Protein</p><p className="font-semibold text-gray-900 text-base">32 <span className="text-gray-500 font-normal text-xs">g</span></p></div>
                  <div><p className="text-gray-500 text-xs">Kolhydrater</p><p className="font-semibold text-gray-900 text-base">45 <span className="text-gray-500 font-normal text-xs">g</span></p></div>
                  <div><p className="text-gray-500 text-xs">Fett</p><p className="font-semibold text-gray-900 text-base">18 <span className="text-gray-500 font-normal text-xs">g</span></p></div>
                </div>
              </div>
            </div>
          ) : nutritionLoading ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600 text-sm">Beräknar näringsvärden...</span>
              </div>
            </div>
          ) : nutritionError ? (
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-red-600 text-sm">{nutritionError}</p>
              <button
                onClick={fetchNutrition}
                className="text-red-700 text-sm font-medium mt-2 hover:underline"
              >
                Försök igen
              </button>
            </div>
          ) : nutrition ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NutritionStat label="Kalorier" value={nutrition.perServing?.calories || 0} unit="kcal" />
                <NutritionStat label="Protein" value={nutrition.perServing?.protein || 0} unit="g" />
                <NutritionStat label="Kolhydrater" value={nutrition.perServing?.carbohydrates || 0} unit="g" />
                <NutritionStat label="Fett" value={nutrition.perServing?.fat || 0} unit="g" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200">
                <NutritionStat label="Fiber" value={nutrition.perServing?.fiber || 0} unit="g" />
                <NutritionStat label="Socker" value={nutrition.perServing?.sugar || 0} unit="g" />
                <NutritionStat label="Mättat fett" value={nutrition.perServing?.saturatedFat || 0} unit="g" />
                <NutritionStat label="Natrium" value={nutrition.perServing?.sodium || 0} unit="mg" />
              </div>
              {nutrition.confidenceScore && (
                <p className="text-xs text-gray-400 mt-3">
                  Säkerhet: {Math.round(nutrition.confidenceScore * 100)}%
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">Klicka för att visa näringsvärden</p>
            </div>
          )}
        </div>

        {/* Switch Recipe Button */}
        {user && (
          <div className="mb-6">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}
            <div className="relative inline-block">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowSwitchMenu(!showSwitchMenu)
                  setError(null)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Byt recept
              </button>

              {/* Switch Menu Dropdown */}
              {showSwitchMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
                  <button
                    onClick={handleRegenerateRecipe}
                    disabled={isRegenerating}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 disabled:opacity-50"
                  >
                    {isRegenerating ? (
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Skapa nytt recept</p>
                      <p className="text-xs text-gray-500">Få ett nytt slumpmässigt recept</p>
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowFavoritesPicker(true)
                      setShowSwitchMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Välj från favoriter</p>
                      <p className="text-xs text-gray-500">{favorites.length} sparade recept</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Favorites Picker Modal */}
        {showFavoritesPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => !isSwitching && setShowFavoritesPicker(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Välj ett favoritrecept</h3>
                <button
                  onClick={() => setShowFavoritesPicker(false)}
                  disabled={isSwitching}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {isSwitching ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-600">Byter recept...</p>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">Du har inga sparade favoriter ännu</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {favorites.map((fav) => (
                      <button
                        key={fav.id}
                        onClick={() => handleSwitchToFavorite(fav)}
                        disabled={isSwitching}
                        className="w-full p-4 text-left bg-gray-50 hover:bg-green-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <p className="font-medium text-gray-900">{fav.recipe?.title || fav.recipe?.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          {fav.recipe?.servings && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {fav.recipe.servings} port
                            </span>
                          )}
                          {fav.rating && (
                            <span className="text-yellow-500">
                              {'★'.repeat(fav.rating)}{'☆'.repeat(5 - fav.rating)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Ingredienser:</h4>
          <ul className="space-y-2">
            {recipe.ingredients?.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-600 mt-1">•</span>
                <span>
                  {ing.amount} {ing.unit} {ing.name}
                  {ing.notes && <span className="text-gray-500 text-sm"> ({ing.notes})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Instruktioner:</h4>
          <ol className="space-y-3">
            {recipe.instructions?.map((step, i) => (
              <li key={i} className="flex gap-3 text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </span>
                <span className="flex-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        {recipe.tips && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Tips:</strong> {recipe.tips}
            </p>
          </div>
        )}
      </div>
    </details>
  )
}

function NutritionStat({ label, value, unit }) {
  const displayValue = typeof value === 'number'
    ? (value < 10 ? value.toFixed(1) : Math.round(value))
    : value

  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="font-semibold text-gray-900 text-base">
        {displayValue}
        <span className="text-gray-500 font-normal text-xs ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

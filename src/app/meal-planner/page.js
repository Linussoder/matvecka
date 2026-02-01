'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MealPlannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mealPlan, setMealPlan] = useState(null)
  const [error, setError] = useState(null)
  const [preferences, setPreferences] = useState({
    servings: 4,
    maxCostPerServing: 60,
    diet: 'none',
    excludedIngredients: ''
  })

  async function generateMealPlan() {
    setLoading(true)
    setError(null)
    setMealPlan(null)

    try {
      const response = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meal plan')
      }

      setMealPlan(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Smart Matplanering</h1>
          <p className="text-gray-600 mb-8">
            Skapa en veckas matplan baserat på veckans bästa erbjudanden
          </p>

          {/* Preferences Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Dina preferenser</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Servings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antal portioner per måltid
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={preferences.servings}
                  onChange={(e) => setPreferences({...preferences, servings: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max kostnad per portion (kr)
                </label>
                <input
                  type="number"
                  min="20"
                  max="150"
                  step="5"
                  value={preferences.maxCostPerServing}
                  onChange={(e) => setPreferences({...preferences, maxCostPerServing: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Diet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kosthållning
                </label>
                <select
                  value={preferences.diet}
                  onChange={(e) => setPreferences({...preferences, diet: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="none">Ingen begränsning</option>
                  <option value="vegetarian">Vegetariskt</option>
                  <option value="vegan">Veganskt</option>
                  <option value="pescatarian">Pescetarianskt</option>
                  <option value="keto">Keto</option>
                  <option value="low-carb">Låg kolhydrater</option>
                </select>
              </div>

              {/* Excluded ingredients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Undvik ingredienser (kommaseparerat)
                </label>
                <input
                  type="text"
                  placeholder="t.ex. mjölk, nötter, skaldjur"
                  value={preferences.excludedIngredients}
                  onChange={(e) => setPreferences({...preferences, excludedIngredients: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={generateMealPlan}
              disabled={loading}
              className="mt-6 w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Skapar matplan...' : 'Skapa 7-dagars matplan'}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="animate-pulse text-6xl mb-4">...</div>
              <p className="text-lg text-gray-600">Skapar din personliga matplan...</p>
              <p className="text-sm text-gray-500 mt-2">Detta tar cirka 20-30 sekunder</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-800">
                <strong>Fel:</strong> {error}
              </p>
            </div>
          )}

          {/* Meal Plan Results */}
          {mealPlan && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Matplan skapad!
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Antal recept:</span>
                    <span className="font-semibold ml-2">{mealPlan.recipes?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Total kostnad:</span>
                    <span className="font-semibold ml-2">{mealPlan.totalCost} kr</span>
                  </div>
                  <div>
                    <span className="text-green-700">Snitt per portion:</span>
                    <span className="font-semibold ml-2">{mealPlan.avgCostPerServing} kr</span>
                  </div>
                </div>
              </div>

              {/* Recipes */}
              <div className="space-y-4">
                {mealPlan.recipes?.map((recipe, index) => (
                  <RecipeCard key={index} recipe={recipe} day={index + 1} />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push(`/shopping-list/${mealPlan.mealPlanId}`)}
                  className="flex-1 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Visa inköpslista
                </button>
                <button
                  onClick={() => {
                    if (confirm('Vill du skapa en ny matplan?')) {
                      setMealPlan(null)
                    }
                  }}
                  className="px-8 py-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Skapa ny plan
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function RecipeCard({ recipe, day }) {
  const [expanded, setExpanded] = useState(false)

  const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
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
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
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

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-green-600 hover:text-green-700 font-medium text-sm"
        >
          {expanded ? 'Dölj recept' : 'Visa recept'}
        </button>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
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
            <div>
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
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Tips:</strong> {recipe.tips}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

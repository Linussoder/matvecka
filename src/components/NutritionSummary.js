'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * NutritionSummary - Shows nutrition overview for a meal plan
 * Auto-calculates and caches nutrition data on first view
 *
 * Usage:
 * <NutritionSummary mealPlan={mealPlan} isPremium={true} />
 * <NutritionSummary mealPlanId={6} isPremium={false} />
 */
export default function NutritionSummary({ mealPlan, mealPlanId, goals, compact = false, isPremium = false }) {
  const [nutrition, setNutrition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  // Default daily goals
  const defaultGoals = {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    fiber: 25
  }

  const activeGoals = goals || defaultGoals

  const calculateNutrition = useCallback(async (id) => {
    setCalculating(true)
    setProgress({ current: 0, total: 0 })

    try {
      // Fetch recipes for this meal plan
      const recipesResponse = await fetch(`/api/nutrition/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealPlanId: id,
          calculateAll: true
        })
      })

      const recipesData = await recipesResponse.json()

      if (recipesData.success && recipesData.nutrition) {
        setNutrition(recipesData.nutrition)
      }
    } catch (error) {
      console.error('Error calculating nutrition:', error)
    } finally {
      setCalculating(false)
    }
  }, [])

  useEffect(() => {
    async function fetchNutrition() {
      const id = mealPlanId || mealPlan?.id
      if (!id) {
        setLoading(false)
        return
      }

      try {
        // First try to get existing nutrition data
        const response = await fetch(`/api/nutrition/calculate?mealPlanId=${id}`)
        const data = await response.json()

        if (data.success && data.nutrition) {
          setNutrition(data.nutrition)
          setLoading(false)
        } else {
          // No nutrition data exists, trigger auto-calculation
          setLoading(false)
          await calculateNutrition(id)
        }
      } catch (error) {
        console.error('Error fetching nutrition:', error)
        setLoading(false)
      }
    }

    fetchNutrition()
  }, [mealPlan, mealPlanId, calculateNutrition])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Premium gate - show sample preview for free users
  if (!isPremium) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Example banner at top */}
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-700 font-medium">Exempelbild</span>
          <span className="text-sm text-gray-500">– så här ser det ut med Premium</span>
        </div>

        {/* Sample preview - visible so users can see what they'd get */}
        <div className="p-6">
          {/* Sample nutrition UI */}
          <div className="select-none pointer-events-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Dagligt genomsnitt</h3>
                <p className="text-sm text-gray-500">Baserat på veckomenyn</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-100 text-green-700">
                <span className="text-sm font-medium">85</span>
                <span className="text-xs ml-1 opacity-75">Utmärkt</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Kalorier</span>
                  <span className="text-sm font-semibold text-gray-900">1850 <span className="font-normal text-gray-500">/ 2000kcal</span></span>
                </div>
                <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Protein</span>
                  <span className="text-sm font-semibold text-gray-900">48 <span className="font-normal text-gray-500">/ 50g</span></span>
                </div>
                <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '96%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Kolhydrater</span>
                  <span className="text-sm font-semibold text-gray-900">220 <span className="font-normal text-gray-500">/ 250g</span></span>
                </div>
                <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Fett</span>
                  <span className="text-sm font-semibold text-gray-900">58 <span className="font-normal text-gray-500">/ 65g</span></span>
                </div>
                <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '89%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Fiber</span>
                  <span className="text-sm font-semibold text-gray-900">22 <span className="font-normal text-gray-500">/ 25g</span></span>
                </div>
                <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (calculating) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center py-4">
          <div className="w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h4 className="font-medium text-gray-900 mb-1">Beräknar näringsvärden...</h4>
          <p className="text-sm text-gray-500">
            Analyserar receptens ingredienser med AI
          </p>
          {progress.total > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {progress.current} av {progress.total} recept
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!nutrition) {
    const id = mealPlanId || mealPlan?.id
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-600 text-sm mb-3">
          Näringsinformation har inte beräknats ännu
        </p>
        <button
          onClick={() => calculateNutrition(id)}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Beräkna näringsvärden
        </button>
      </div>
    )
  }

  const avgCalories = nutrition.avg_calories_per_day || 0
  const avgProtein = Math.round((nutrition.total_protein || 0) / 7)
  const avgCarbs = Math.round((nutrition.total_carbs || 0) / 7)
  const avgFat = Math.round((nutrition.total_fat || 0) / 7)
  const avgFiber = Math.round((nutrition.total_fiber || 0) / 7)

  if (compact) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Näring / dag</h4>
          <NutritionScore score={nutrition.nutrition_score} />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <CompactStat value={avgCalories} label="kcal" />
          <CompactStat value={avgProtein} label="protein" unit="g" />
          <CompactStat value={avgCarbs} label="kolh" unit="g" />
          <CompactStat value={avgFat} label="fett" unit="g" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Dagligt genomsnitt</h3>
          <p className="text-sm text-gray-500">Baserat på {mealPlan?.name || 'veckomenyn'}</p>
        </div>
        <NutritionScore score={nutrition.nutrition_score} />
      </div>

      <div className="space-y-4">
        <NutritionProgress
          label="Kalorier"
          value={avgCalories}
          target={activeGoals.calories}
          unit="kcal"
        />
        <NutritionProgress
          label="Protein"
          value={avgProtein}
          target={activeGoals.protein}
          unit="g"
        />
        <NutritionProgress
          label="Kolhydrater"
          value={avgCarbs}
          target={activeGoals.carbs}
          unit="g"
        />
        <NutritionProgress
          label="Fett"
          value={avgFat}
          target={activeGoals.fat}
          unit="g"
        />
        <NutritionProgress
          label="Fiber"
          value={avgFiber}
          target={activeGoals.fiber}
          unit="g"
        />
      </div>

      {/* Warnings */}
      {nutrition.warnings && nutrition.warnings.length > 0 && (
        <div className="mt-6 space-y-2">
          {nutrition.warnings.map((warning, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
            >
              <span>⚠️</span>
              <span className="text-yellow-800">{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Weekly totals */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Veckans totala intag</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-gray-600">
            <strong>{nutrition.total_calories?.toLocaleString()}</strong> kcal
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">
            <strong>{Math.round(nutrition.total_protein || 0)}</strong>g protein
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">
            <strong>{Math.round(nutrition.total_carbs || 0)}</strong>g kolh
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">
            <strong>{Math.round(nutrition.total_fat || 0)}</strong>g fett
          </span>
        </div>
      </div>
    </div>
  )
}

function NutritionProgress({ label, value, target, unit }) {
  const percentage = Math.min(100, Math.round((value / target) * 100))
  const isOnTarget = percentage >= 80 && percentage <= 120

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {value} <span className="font-normal text-gray-500">/ {target}{unit}</span>
          </span>
          {isOnTarget && (
            <span className="text-green-500 text-sm">✓</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-green-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  )
}

function NutritionScore({ score }) {
  if (!score && score !== 0) return null

  let color = 'bg-gray-100 text-gray-700'
  let label = 'Okänt'

  if (score >= 80) {
    color = 'bg-green-100 text-green-700'
    label = 'Utmärkt'
  } else if (score >= 60) {
    color = 'bg-yellow-100 text-yellow-700'
    label = 'Bra'
  } else if (score >= 40) {
    color = 'bg-orange-100 text-orange-700'
    label = 'Okej'
  } else {
    color = 'bg-red-100 text-red-700'
    label = 'Låg'
  }

  return (
    <div className={`px-3 py-1 rounded-full ${color}`}>
      <span className="text-sm font-medium">{score}</span>
      <span className="text-xs ml-1 opacity-75">{label}</span>
    </div>
  )
}

function CompactStat({ value, label, unit = '' }) {
  return (
    <div>
      <p className="font-semibold text-gray-900">
        {value}{unit}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

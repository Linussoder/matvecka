'use client'

import { useState } from 'react'

/**
 * NutritionBadge - Displays nutrition info in compact or expanded format
 *
 * Usage:
 * <NutritionBadge nutrition={recipe.nutrition} size="compact" />
 * <NutritionBadge nutrition={recipe.nutrition} size="expanded" />
 */
export default function NutritionBadge({ nutrition, size = 'compact', showDetails = false }) {
  const [expanded, setExpanded] = useState(false)

  if (!nutrition) {
    return null
  }

  // Handle both flat and nested nutrition data structures
  const data = nutrition.perServing || nutrition

  const calories = data.calories || 0
  const protein = data.protein || 0
  const carbs = data.carbohydrates || data.carbs || 0
  const fat = data.fat || 0
  const fiber = data.fiber || 0

  if (size === 'compact') {
    return (
      <div
        className="inline-flex items-center gap-2 text-xs bg-gray-100 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => setExpanded(!expanded)}
        title="Klicka för mer info"
      >
        <span className="font-semibold text-orange-600">{calories} kcal</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600">
          P {Math.round(protein)}g • K {Math.round(carbs)}g • F {Math.round(fat)}g
        </span>
      </div>
    )
  }

  if (size === 'mini') {
    return (
      <span className="text-xs text-gray-500">
        {calories} kcal
      </span>
    )
  }

  // Expanded size
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 text-sm">Näringsvärde per portion</h4>
        {nutrition.confidenceScore && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            nutrition.confidenceScore >= 0.8
              ? 'bg-green-100 text-green-700'
              : nutrition.confidenceScore >= 0.5
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600'
          }`}>
            {nutrition.confidenceScore >= 0.8 ? 'Hög' : nutrition.confidenceScore >= 0.5 ? 'Medium' : 'Låg'} säkerhet
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NutritionItem
          label="Kalorier"
          value={calories}
          unit="kcal"
          color="orange"
          icon="🔥"
        />
        <NutritionItem
          label="Protein"
          value={protein}
          unit="g"
          color="red"
          icon="💪"
        />
        <NutritionItem
          label="Kolhydrater"
          value={carbs}
          unit="g"
          color="yellow"
          icon="🌾"
        />
        <NutritionItem
          label="Fett"
          value={fat}
          unit="g"
          color="blue"
          icon="🥑"
        />
        {showDetails && (
          <>
            <NutritionItem
              label="Fiber"
              value={fiber}
              unit="g"
              color="green"
              icon="🥬"
            />
            <NutritionItem
              label="Socker"
              value={data.sugar || 0}
              unit="g"
              color="pink"
              icon="🍬"
            />
          </>
        )}
      </div>
    </div>
  )
}

function NutritionItem({ label, value, unit, color, icon }) {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    pink: 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">
          {typeof value === 'number' ? (value < 10 ? value.toFixed(1) : Math.round(value)) : value}
          <span className="text-gray-500 font-normal text-xs ml-0.5">{unit}</span>
        </p>
      </div>
    </div>
  )
}

// Utility component for inline badge in lists
export function NutritionBadgeInline({ calories, protein, carbs, fat }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className="font-medium text-orange-600">{calories || 0} kcal</span>
      <span>•</span>
      <span>P {protein || 0}g</span>
      <span>•</span>
      <span>K {carbs || 0}g</span>
      <span>•</span>
      <span>F {fat || 0}g</span>
    </div>
  )
}

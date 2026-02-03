'use client'

import { useState, useEffect } from 'react'

// Preset serving options
const SERVING_PRESETS = [
  { value: 0.5, label: '2 port' },
  { value: 0.75, label: '3 port' },
  { value: 1.0, label: '4 port' },
  { value: 1.25, label: '5 port' },
  { value: 1.5, label: '6 port' },
  { value: 2.0, label: '8 port' },
]

const PREMIUM_PRESETS = [
  { value: 0.25, label: '1 port' },
  { value: 0.5, label: '2 port' },
  { value: 0.75, label: '3 port' },
  { value: 1.0, label: '4 port' },
  { value: 1.25, label: '5 port' },
  { value: 1.5, label: '6 port' },
  { value: 2.0, label: '8 port' },
  { value: 2.5, label: '10 port' },
  { value: 3.0, label: '12 port' },
  { value: 5.0, label: '20 port' },
]

export default function ServingScaler({
  mealPlanId,
  currentMultiplier = 1.0,
  baseServings = 4,
  isPremium = false,
  onScaleChange,
  compact = false
}) {
  const [multiplier, setMultiplier] = useState(currentMultiplier)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState(null)

  const presets = isPremium ? PREMIUM_PRESETS : SERVING_PRESETS
  const minMultiplier = isPremium ? 0.25 : 0.5
  const maxMultiplier = isPremium ? 5.0 : 2.0

  // Calculate actual servings from multiplier
  const actualServings = Math.round(baseServings * multiplier)

  useEffect(() => {
    setMultiplier(currentMultiplier)
  }, [currentMultiplier])

  const handleMultiplierChange = async (newMultiplier) => {
    // Clamp to valid range
    const clampedMultiplier = Math.max(minMultiplier, Math.min(maxMultiplier, newMultiplier))

    setMultiplier(clampedMultiplier)
    setError(null)

    // Update via API if mealPlanId is provided
    if (mealPlanId) {
      setIsUpdating(true)
      try {
        const response = await fetch(`/api/shopping-list/${mealPlanId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ servingMultiplier: clampedMultiplier })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update')
        }

        // Notify parent component
        if (onScaleChange) {
          onScaleChange(clampedMultiplier)
        }
      } catch (err) {
        console.error('Failed to update serving multiplier:', err)
        setError('Kunde inte spara')
        // Revert on error
        setMultiplier(currentMultiplier)
      } finally {
        setIsUpdating(false)
      }
    } else if (onScaleChange) {
      // No API call, just notify parent
      onScaleChange(clampedMultiplier)
    }
  }

  const increment = () => {
    const currentIndex = presets.findIndex(p => p.value >= multiplier)
    if (currentIndex < presets.length - 1) {
      handleMultiplierChange(presets[currentIndex + 1].value)
    }
  }

  const decrement = () => {
    const currentIndex = presets.findIndex(p => p.value >= multiplier)
    if (currentIndex > 0) {
      handleMultiplierChange(presets[currentIndex - 1].value)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={decrement}
          disabled={isUpdating || multiplier <= minMultiplier}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
        >
          -
        </button>
        <span className="min-w-[60px] text-center font-medium">
          {actualServings} port
        </span>
        <button
          onClick={increment}
          disabled={isUpdating || multiplier >= maxMultiplier}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
        >
          +
        </button>
        {isUpdating && (
          <span className="text-xs text-gray-500">Sparar...</span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Skala portioner</h3>
        {!isPremium && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Premium: 1-20 portioner
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={decrement}
          disabled={isUpdating || multiplier <= minMultiplier}
          className="w-10 h-10 rounded-full bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl font-medium text-orange-600"
        >
          -
        </button>

        <div className="flex-1 text-center">
          <div className="text-3xl font-bold text-gray-900">{actualServings}</div>
          <div className="text-sm text-gray-500">portioner</div>
        </div>

        <button
          onClick={increment}
          disabled={isUpdating || multiplier >= maxMultiplier}
          className="w-10 h-10 rounded-full bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl font-medium text-orange-600"
        >
          +
        </button>
      </div>

      {/* Quick preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.slice(0, 6).map(preset => (
          <button
            key={preset.value}
            onClick={() => handleMultiplierChange(preset.value)}
            disabled={isUpdating}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              Math.abs(multiplier - preset.value) < 0.01
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Status messages */}
      {isUpdating && (
        <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uppdaterar inköpslistan...
        </div>
      )}

      {error && (
        <div className="mt-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {multiplier !== 1.0 && !isUpdating && (
        <div className="mt-3 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
          Inköpslistan är skalad till {actualServings} portioner (x{multiplier.toFixed(2)})
        </div>
      )}
    </div>
  )
}

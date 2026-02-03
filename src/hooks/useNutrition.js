'use client'

import { useState, useCallback } from 'react'

/**
 * useNutrition - Hook for nutrition calculations and data management
 *
 * Usage:
 * const { calculateNutrition, loading, error } = useNutrition()
 * const nutrition = await calculateNutrition(recipe)
 */
export function useNutrition() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Calculate nutrition for a single recipe
   */
  const calculateNutrition = useCallback(async (recipe, options = {}) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/nutrition/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe,
          mealPlanId: options.mealPlanId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate nutrition')
      }

      return data.nutrition
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Calculate nutrition for multiple recipes in batch
   */
  const calculateBatch = useCallback(async (recipes, mealPlanId = null) => {
    setLoading(true)
    setError(null)

    const results = []

    for (const recipe of recipes) {
      try {
        const nutrition = await calculateNutrition(recipe, { mealPlanId })
        results.push({ recipe, nutrition, error: null })
      } catch (err) {
        results.push({ recipe, nutrition: null, error: err.message })
      }
    }

    setLoading(false)
    return results
  }, [calculateNutrition])

  /**
   * Get meal plan nutrition summary
   */
  const getMealPlanNutrition = useCallback(async (mealPlanId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/nutrition/calculate?mealPlanId=${mealPlanId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch nutrition')
      }

      return data.nutrition
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    calculateNutrition,
    calculateBatch,
    getMealPlanNutrition,
    loading,
    error
  }
}

/**
 * Utility functions for nutrition calculations
 */

/**
 * Calculate percentage of daily value
 */
export function calculateDailyValue(value, target) {
  if (!target || target === 0) return 0
  return Math.round((value / target) * 100)
}

/**
 * Get color based on percentage
 */
export function getProgressColor(percentage) {
  if (percentage >= 90 && percentage <= 110) return 'green'
  if (percentage >= 70 && percentage <= 130) return 'yellow'
  return 'red'
}

/**
 * Format nutrition value for display
 */
export function formatNutritionValue(value, decimals = 0) {
  if (typeof value !== 'number') return '0'
  if (value < 10 && decimals === 0) {
    return value.toFixed(1)
  }
  return Math.round(value).toLocaleString('sv-SE')
}

/**
 * Calculate macro percentages
 */
export function calculateMacroPercentages(protein, carbs, fat) {
  const proteinCals = (protein || 0) * 4
  const carbsCals = (carbs || 0) * 4
  const fatCals = (fat || 0) * 9
  const totalCals = proteinCals + carbsCals + fatCals

  if (totalCals === 0) {
    return { protein: 0, carbs: 0, fat: 0 }
  }

  return {
    protein: Math.round((proteinCals / totalCals) * 100),
    carbs: Math.round((carbsCals / totalCals) * 100),
    fat: Math.round((fatCals / totalCals) * 100)
  }
}

/**
 * Get nutrition score description
 */
export function getNutritionScoreLabel(score) {
  if (score >= 80) return { label: 'Utmärkt', color: 'green' }
  if (score >= 60) return { label: 'Bra', color: 'yellow' }
  if (score >= 40) return { label: 'Okej', color: 'orange' }
  return { label: 'Behöver förbättras', color: 'red' }
}

/**
 * Default nutrition goals
 */
export const DEFAULT_GOALS = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65,
  fiber: 25,
  sugar: 50,
  sodium: 2300
}

/**
 * Preset nutrition profiles
 */
export const NUTRITION_PRESETS = {
  maintain: {
    name: 'Bibehåll vikt',
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    fiber: 25
  },
  lose_weight: {
    name: 'Gå ner i vikt',
    calories: 1600,
    protein: 60,
    carbs: 150,
    fat: 55,
    fiber: 30
  },
  build_muscle: {
    name: 'Bygg muskler',
    calories: 2500,
    protein: 100,
    carbs: 300,
    fat: 80,
    fiber: 30
  },
  keto: {
    name: 'Keto',
    calories: 1800,
    protein: 75,
    carbs: 30,
    fat: 140,
    fiber: 20
  }
}

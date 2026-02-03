'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const supabase = createClient()

  // Check for user session
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Load favorites when user changes
  useEffect(() => {
    async function loadFavorites() {
      if (!user) {
        setFavorites([])
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await supabase
        .from('recipe_favorites')
        .select(`
          *,
          recipe:recipes(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading favorites:', error)
      } else {
        // For meal plan recipes, use the stored recipe_data
        const processedData = (data || []).map(fav => ({
          ...fav,
          // Use recipe from join if available, otherwise use stored recipe_data
          recipe: fav.recipe || fav.recipe_data
        }))
        setFavorites(processedData)
      }
      setLoading(false)
    }

    loadFavorites()
  }, [user, supabase])

  // Add regular recipe to favorites
  const addFavorite = useCallback(async (recipeId) => {
    if (!user) return false

    const { data, error } = await supabase
      .from('recipe_favorites')
      .insert({
        user_id: user.id,
        recipe_id: recipeId
      })
      .select(`
        *,
        recipe:recipes(*)
      `)
      .single()

    if (error) {
      console.error('Error adding favorite:', error)
      return false
    }

    setFavorites(prev => [data, ...prev])
    return true
  }, [user, supabase])

  // Add meal plan recipe to favorites
  const addMealPlanFavorite = useCallback(async (mealPlanRecipeId, recipeData) => {
    if (!user) return false

    const { data, error } = await supabase
      .from('recipe_favorites')
      .insert({
        user_id: user.id,
        meal_plan_recipe_id: mealPlanRecipeId,
        recipe_data: recipeData
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error adding meal plan favorite:', error)
      return false
    }

    // Add the recipe data to the favorite object
    setFavorites(prev => [{ ...data, recipe: recipeData }, ...prev])
    return true
  }, [user, supabase])

  // Add imported/created recipe (Premium feature for URL import)
  const addImportedRecipe = useCallback(async (recipeData) => {
    if (!user) return false

    // Allow source to be specified in recipeData, default to 'imported'
    const source = recipeData.source || 'imported'

    const { data, error } = await supabase
      .from('recipe_favorites')
      .insert({
        user_id: user.id,
        recipe_data: recipeData,
        source: source,
        source_url: recipeData.source_url || null
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error adding imported recipe:', error)
      return false
    }

    // Add the recipe data to the favorite object
    setFavorites(prev => [{ ...data, recipe: recipeData }, ...prev])
    return true
  }, [user, supabase])

  // Remove regular recipe from favorites
  const removeFavorite = useCallback(async (recipeId) => {
    if (!user) return false

    const { error } = await supabase
      .from('recipe_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)

    if (error) {
      console.error('Error removing favorite:', error)
      return false
    }

    setFavorites(prev => prev.filter(f => f.recipe_id !== recipeId))
    return true
  }, [user, supabase])

  // Remove meal plan recipe from favorites
  const removeMealPlanFavorite = useCallback(async (mealPlanRecipeId) => {
    if (!user) return false

    const { error } = await supabase
      .from('recipe_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('meal_plan_recipe_id', mealPlanRecipeId)

    if (error) {
      console.error('Error removing meal plan favorite:', error)
      return false
    }

    setFavorites(prev => prev.filter(f => f.meal_plan_recipe_id !== mealPlanRecipeId))
    return true
  }, [user, supabase])

  // Toggle favorite for regular recipe
  const toggleFavorite = useCallback(async (recipeId) => {
    const isFav = favorites.some(f => f.recipe_id === recipeId)
    if (isFav) {
      return removeFavorite(recipeId)
    } else {
      return addFavorite(recipeId)
    }
  }, [favorites, addFavorite, removeFavorite])

  // Toggle favorite for meal plan recipe
  const toggleMealPlanFavorite = useCallback(async (mealPlanRecipeId, recipeData) => {
    const isFav = favorites.some(f => f.meal_plan_recipe_id === mealPlanRecipeId)
    if (isFav) {
      return removeMealPlanFavorite(mealPlanRecipeId)
    } else {
      return addMealPlanFavorite(mealPlanRecipeId, recipeData)
    }
  }, [favorites, addMealPlanFavorite, removeMealPlanFavorite])

  // Check if regular recipe is favorited
  const isFavorite = useCallback((recipeId) => {
    return favorites.some(f => f.recipe_id === recipeId)
  }, [favorites])

  // Check if meal plan recipe is favorited
  const isMealPlanFavorite = useCallback((mealPlanRecipeId) => {
    return favorites.some(f => f.meal_plan_recipe_id === mealPlanRecipeId)
  }, [favorites])

  // Mark recipe as made (works for both types)
  const markAsMade = useCallback(async (recipeId, isMealPlanRecipe = false) => {
    if (!user) return false

    const favorite = isMealPlanRecipe
      ? favorites.find(f => f.meal_plan_recipe_id === recipeId)
      : favorites.find(f => f.recipe_id === recipeId)

    if (!favorite) return false

    const newTimesMade = (favorite.times_made || 0) + 1
    const idField = isMealPlanRecipe ? 'meal_plan_recipe_id' : 'recipe_id'

    const { error } = await supabase
      .from('recipe_favorites')
      .update({
        times_made: newTimesMade,
        last_made_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq(idField, recipeId)

    if (error) {
      console.error('Error marking as made:', error)
      return false
    }

    setFavorites(prev => prev.map(f => {
      const matches = isMealPlanRecipe
        ? f.meal_plan_recipe_id === recipeId
        : f.recipe_id === recipeId
      return matches
        ? { ...f, times_made: newTimesMade, last_made_at: new Date().toISOString() }
        : f
    }))
    return true
  }, [user, favorites, supabase])

  // Update favorite (rating, notes) - works for both types
  const updateFavorite = useCallback(async (recipeId, updates, isMealPlanRecipe = false) => {
    if (!user) return false

    const idField = isMealPlanRecipe ? 'meal_plan_recipe_id' : 'recipe_id'

    const { error } = await supabase
      .from('recipe_favorites')
      .update(updates)
      .eq('user_id', user.id)
      .eq(idField, recipeId)

    if (error) {
      console.error('Error updating favorite:', error)
      return false
    }

    setFavorites(prev => prev.map(f => {
      const matches = isMealPlanRecipe
        ? f.meal_plan_recipe_id === recipeId
        : f.recipe_id === recipeId
      return matches ? { ...f, ...updates } : f
    }))
    return true
  }, [user, supabase])

  const value = {
    favorites,
    loading,
    user,
    // Regular recipe functions
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    // Meal plan recipe functions
    addMealPlanFavorite,
    removeMealPlanFavorite,
    toggleMealPlanFavorite,
    isMealPlanFavorite,
    // Imported recipe functions
    addImportedRecipe,
    // Shared functions
    markAsMade,
    updateFavorite
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

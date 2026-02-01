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
        setFavorites(data || [])
      }
      setLoading(false)
    }

    loadFavorites()
  }, [user, supabase])

  // Add to favorites
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

  // Remove from favorites
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

  // Toggle favorite
  const toggleFavorite = useCallback(async (recipeId) => {
    const isFav = favorites.some(f => f.recipe_id === recipeId)
    if (isFav) {
      return removeFavorite(recipeId)
    } else {
      return addFavorite(recipeId)
    }
  }, [favorites, addFavorite, removeFavorite])

  // Check if recipe is favorited
  const isFavorite = useCallback((recipeId) => {
    return favorites.some(f => f.recipe_id === recipeId)
  }, [favorites])

  // Mark recipe as made
  const markAsMade = useCallback(async (recipeId) => {
    if (!user) return false

    const favorite = favorites.find(f => f.recipe_id === recipeId)
    if (!favorite) return false

    const newTimesMade = (favorite.times_made || 0) + 1

    const { error } = await supabase
      .from('recipe_favorites')
      .update({
        times_made: newTimesMade,
        last_made_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)

    if (error) {
      console.error('Error marking as made:', error)
      return false
    }

    setFavorites(prev => prev.map(f =>
      f.recipe_id === recipeId
        ? { ...f, times_made: newTimesMade, last_made_at: new Date().toISOString() }
        : f
    ))
    return true
  }, [user, favorites, supabase])

  // Update favorite (rating, notes)
  const updateFavorite = useCallback(async (recipeId, updates) => {
    if (!user) return false

    const { error } = await supabase
      .from('recipe_favorites')
      .update(updates)
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)

    if (error) {
      console.error('Error updating favorite:', error)
      return false
    }

    setFavorites(prev => prev.map(f =>
      f.recipe_id === recipeId ? { ...f, ...updates } : f
    ))
    return true
  }, [user, supabase])

  const value = {
    favorites,
    loading,
    user,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
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

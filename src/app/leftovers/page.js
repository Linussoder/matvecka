'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function LeftoversPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [pantryItems, setPantryItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [savedRecipes, setSavedRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState({})
  const [error, setError] = useState(null)
  const [requiresPremium, setRequiresPremium] = useState(false)

  // Check auth
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
    }
    checkUser()
  }, [supabase, router])

  // Fetch pantry items
  const fetchPantryItems = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch('/api/pantry')
      const data = await response.json()

      if (!response.ok) {
        if (data.requiresPremium) {
          setRequiresPremium(true)
          return
        }
        throw new Error(data.error)
      }

      setPantryItems(data.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchPantryItems()
  }, [user, fetchPantryItems])

  // Toggle selection
  const toggleSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      }
      return [...prev, itemId]
    })
  }

  // Get suggestions
  const handleGetSuggestions = async () => {
    if (selectedItems.length === 0) {
      setError('Välj minst en ingrediens')
      return
    }

    setGenerating(true)
    setError(null)
    setSuggestions([])

    try {
      const selectedIngredients = pantryItems.filter(item =>
        selectedItems.includes(item.id)
      )

      const response = await fetch('/api/leftovers/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: selectedIngredients
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresPremium) {
          setRequiresPremium(true)
          return
        }
        throw new Error(data.error)
      }

      setSuggestions(data.suggestions || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // Select all
  const selectAll = () => {
    setSelectedItems(pantryItems.map(item => item.id))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([])
  }

  // Save recipe to favorites
  const handleSaveRecipe = async (recipe, index) => {
    setSaving(prev => ({ ...prev, [index]: true }))
    try {
      const response = await fetch('/api/recipes/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setSavedRecipes(prev => [...prev, index])
    } catch (err) {
      setError('Kunde inte spara receptet')
    } finally {
      setSaving(prev => ({ ...prev, [index]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Laddar...</p>
        </div>
      </div>
    )
  }

  if (requiresPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Receptförslag
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Få AI-genererade receptförslag baserat på ingredienserna du har hemma.
              Sluta släng mat och spara pengar!
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Premium-funktion inkluderar:</h3>
              <ul className="text-left space-y-3">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Välj ingredienser från ditt skafferi</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">AI genererar 3 receptförslag</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Spara recept som favoriter</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="inline-block px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:scale-105"
            >
              Uppgradera till Premium
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Vad ska du laga?</h1>
          <p className="text-green-100">Välj ingredienser och få receptförslag</p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Ingredient Selection */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Välj ingredienser</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedItems.length} av {pantryItems.length} valda
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                    >
                      Välj alla
                    </button>
                    {selectedItems.length > 0 && (
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        Rensa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {pantryItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Skafferiet är tomt</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Lägg till ingredienser i ditt skafferi först
                  </p>
                  <Link
                    href="/pantry"
                    className="inline-block px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                  >
                    Gå till skafferiet
                  </Link>
                </div>
              ) : (
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {pantryItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          selectedItems.includes(item.id)
                            ? 'bg-green-100 dark:bg-green-900/40 border-2 border-green-500'
                            : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {item.ingredient_name}
                        </div>
                        {item.quantity && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.quantity} {item.unit}
                          </div>
                        )}
                        {item.expiryStatus === 'expiring_soon' && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-xs rounded">
                            Går ut snart
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {pantryItems.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleGetSuggestions}
                    disabled={generating || selectedItems.length === 0}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Genererar förslag...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Hitta recept
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Suggestions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receptförslag</h2>

            {suggestions.length === 0 && !generating && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Inga förslag ännu</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Välj ingredienser och klicka på "Hitta recept" för att få AI-genererade förslag
                </p>
              </div>
            )}

            {generating && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">AI tänker...</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hittar recept baserat på dina ingredienser</p>
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-4">
                {suggestions.map((recipe, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-5 bg-gradient-to-r from-green-600 to-green-700 text-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{recipe.name}</h3>
                          <p className="text-green-100 text-sm mt-1">{recipe.description}</p>
                        </div>
                        <button
                          onClick={() => handleSaveRecipe(recipe, index)}
                          disabled={saving[index] || savedRecipes.includes(index)}
                          className={`p-2 rounded-lg transition-colors ${
                            savedRecipes.includes(index)
                              ? 'bg-white/30 text-white'
                              : 'bg-white/20 hover:bg-white/30 text-white'
                          }`}
                          title={savedRecipes.includes(index) ? 'Sparat' : 'Spara recept'}
                        >
                          {saving[index] ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : savedRecipes.includes(index) ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="flex gap-3 mt-3">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {recipe.prepTime}
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {recipe.servings} port
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          {recipe.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Uses from pantry */}
                      {recipe.usesIngredients && recipe.usesIngredients.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Använder från ditt skafferi:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {recipe.usesIngredients.map((ing, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-sm rounded-full"
                              >
                                ✓ {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional ingredients needed */}
                      {recipe.additionalIngredients && recipe.additionalIngredients.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Du behöver också:
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {recipe.additionalIngredients.join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Ingredients */}
                      <details className="mb-4">
                        <summary className="cursor-pointer font-medium text-gray-900 dark:text-white hover:text-green-600">
                          Alla ingredienser ({recipe.ingredients?.length || 0})
                        </summary>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 pl-4">
                          {recipe.ingredients?.map((ing, i) => (
                            <li key={i}>
                              {ing.amount} {ing.unit} {ing.name}
                            </li>
                          ))}
                        </ul>
                      </details>

                      {/* Instructions */}
                      <details>
                        <summary className="cursor-pointer font-medium text-gray-900 dark:text-white hover:text-green-600">
                          Instruktioner ({recipe.instructions?.length || 0} steg)
                        </summary>
                        <ol className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400 pl-4">
                          {recipe.instructions?.map((step, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="font-medium text-green-600">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SharedMealPlanPage({ params }) {
  const [share, setShare] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(null)
  const [expandedRecipe, setExpandedRecipe] = useState(null)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  useEffect(() => {
    // Handle async params in Next.js 15
    const getToken = async () => {
      const resolvedParams = await params
      setToken(resolvedParams.token)
    }
    getToken()
  }, [params])

  useEffect(() => {
    if (!token) return

    const fetchShare = async () => {
      try {
        const res = await fetch(`/api/share/${token}?type=meal_plan`)
        const data = await res.json()

        if (data.success) {
          setShare(data.share)
        } else {
          setError(data.error || 'Kunde inte ladda matplanen')
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError(`Något gick fel: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchShare()
  }, [token])

  const handleLockedFeature = (featureName) => {
    setShowSignupPrompt(true)
    setTimeout(() => setShowSignupPrompt(false), 3000)
  }

  if (loading) {
    return <LoadingPage />
  }

  if (error) {
    return <NotFoundPage message={error} />
  }

  if (!share) {
    return <NotFoundPage />
  }

  const mealPlan = share.meal_plan_data
  const recipes = mealPlan.recipes || []
  const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Signup prompt toast */}
      {showSignupPrompt && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Skapa ett gratis konto för att använda denna funktion</span>
            <Link href="/signup" className="ml-2 bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
              Registrera
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Matvecka</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
            >
              Logga in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Skapa konto
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Shared badge */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Delad matplan</span>
        </div>

        {/* Header card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {mealPlan.name || 'Veckans matplan'}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{recipes.length} dagar</span>
            </div>
            {mealPlan.servings && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{mealPlan.servings} portioner</span>
              </div>
            )}
            {mealPlan.total_cost && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>~{Math.round(mealPlan.total_cost)} kr totalt</span>
              </div>
            )}
          </div>

          {/* Teaser action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleLockedFeature('inköpslista')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-xl cursor-not-allowed relative group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Visa inköpslista
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>

            <button
              onClick={() => handleLockedFeature('PDF')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-xl cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ladda ner PDF
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>

            <button
              onClick={() => handleLockedFeature('spara')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-xl cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Spara matplan
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recipes by day */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Klicka på ett recept för att se ingredienser och instruktioner
          </p>

          {recipes.map((recipe, index) => {
            const recipeData = recipe.recipe_data || recipe
            const isExpanded = expandedRecipe === index

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300"
              >
                {/* Recipe header - clickable */}
                <div
                  className="flex flex-col md:flex-row cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => setExpandedRecipe(isExpanded ? null : index)}
                >
                  {/* Day indicator */}
                  <div className="md:w-32 bg-green-500 p-4 flex md:flex-col items-center justify-center text-white">
                    <span className="text-sm opacity-80">Dag {index + 1}</span>
                    <span className="font-semibold ml-2 md:ml-0 md:mt-1">
                      {dayNames[index % 7]}
                    </span>
                  </div>

                  {/* Recipe info */}
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {recipeData.name || recipeData.title}
                        </h3>
                        {recipeData.description && !isExpanded && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                            {recipeData.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {(recipeData.prep_time || recipeData.prepTime) && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {recipeData.prep_time || recipeData.prepTime}
                            </span>
                          )}
                          {(recipeData.estimated_cost || recipeData.estimatedCost) && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ~{recipeData.estimated_cost || recipeData.estimatedCost} kr
                            </span>
                          )}
                          {recipeData.ingredients && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              {recipeData.ingredients.length} ingredienser
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Expand icon */}
                      <div className={`ml-4 p-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50 animate-fade-in">
                    {/* Description */}
                    {recipeData.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {recipeData.description}
                      </p>
                    )}

                    {/* Ingredients */}
                    {recipeData.ingredients && recipeData.ingredients.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          </span>
                          Ingredienser
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {recipeData.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-start gap-2 bg-white dark:bg-gray-700/50 p-3 rounded-lg">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {typeof ing === 'string'
                                  ? ing
                                  : `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ing}`.trim()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    {recipeData.instructions && recipeData.instructions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                          </span>
                          Instruktioner
                        </h4>
                        <ol className="space-y-3">
                          {recipeData.instructions.map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-gray-700 dark:text-gray-300 pt-0.5">
                                {typeof step === 'string' ? step : step.instruction || step}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Tips */}
                    {recipeData.tips && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span><strong>Tips:</strong> {recipeData.tips}</span>
                        </p>
                      </div>
                    )}

                    {/* Nutrition Information */}
                    <NutritionPreview
                      nutrition={recipeData.nutrition}
                      onLockedClick={() => handleLockedFeature('näringsvärden')}
                    />

                    {/* Recipe action buttons (locked) */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLockedFeature('favoritmarkera'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 text-gray-400 text-sm rounded-lg cursor-not-allowed border border-gray-200 dark:border-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Spara favorit
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLockedFeature('inköpslista'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 text-gray-400 text-sm rounded-lg cursor-not-allowed border border-gray-200 dark:border-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Lägg till i inköpslista
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Shopping list preview */}
        {share.include_shopping_list && mealPlan.shopping_list && mealPlan.shopping_list.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Inköpslista (förhandsvisning)
            </h2>
            <div className="grid md:grid-cols-2 gap-2">
              {mealPlan.shopping_list.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {typeof item === 'string' ? item : `${item.amount || ''} ${item.unit || ''} ${item.name}`.trim()}
                  </span>
                </div>
              ))}
            </div>
            {mealPlan.shopping_list.length > 10 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handleLockedFeature('full inköpslista')}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Visa alla {mealPlan.shopping_list.length} varor - Skapa konto
                </button>
              </div>
            )}
          </div>
        )}

        {/* Value proposition */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 md:p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Gilla den här matplanen?</h2>
          <p className="text-green-100 mb-6">
            Med ett Matvecka-konto kan du spara matplanen, redigera recept, generera inköpslistor och mycket mer!
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Smarta inköpslistor</h3>
                <p className="text-green-100 text-sm">Automatiskt genererade listor baserade på dina recept</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Spara favoriter</h3>
                <p className="text-green-100 text-sm">Samla dina favoritrecept på ett ställe</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">AI-genererade recept</h3>
                <p className="text-green-100 text-sm">Få nya receptidéer baserade på dina preferenser</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Spara pengar</h3>
                <p className="text-green-100 text-sm">Se priser och hitta bästa erbjudandena</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Skapa gratis konto
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
            >
              Se Premium-fördelar
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2026 Matvecka. Alla rättigheter förbehållna.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

function NutritionPreview({ nutrition, onLockedClick }) {
  // Use actual nutrition data if available, otherwise show example data
  const hasRealData = nutrition && (nutrition.calories || nutrition.perServing?.calories)
  const data = hasRealData
    ? (nutrition.perServing || nutrition)
    : {
        calories: 485,
        protein: 32,
        carbohydrates: 45,
        fat: 18,
        fiber: 6
      }

  return (
    <div className="bg-white dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
          <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          </span>
          Näringsvärde per portion
          {!hasRealData && (
            <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              Exempel
            </span>
          )}
        </h4>
        <button
          onClick={(e) => { e.stopPropagation(); onLockedClick(); }}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Premium
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Calories */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Kalorier</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {Math.round(data.calories || 0)}
              <span className="text-gray-500 dark:text-gray-400 font-normal text-xs ml-0.5">kcal</span>
            </p>
          </div>
        </div>
        {/* Protein */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {Math.round(data.protein || 0)}
              <span className="text-gray-500 dark:text-gray-400 font-normal text-xs ml-0.5">g</span>
            </p>
          </div>
        </div>
        {/* Carbohydrates */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Kolhydrater</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {Math.round(data.carbohydrates || data.carbs || 0)}
              <span className="text-gray-500 dark:text-gray-400 font-normal text-xs ml-0.5">g</span>
            </p>
          </div>
        </div>
        {/* Fat */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fett</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {Math.round(data.fat || 0)}
              <span className="text-gray-500 dark:text-gray-400 font-normal text-xs ml-0.5">g</span>
            </p>
          </div>
        </div>
      </div>

      {/* Locked detailed nutrition */}
      <button
        onClick={(e) => { e.stopPropagation(); onLockedClick(); }}
        className="w-full mt-3 py-2 bg-gray-100 dark:bg-gray-600/50 text-gray-400 dark:text-gray-500 text-xs rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Visa detaljerad näringsinformation (fiber, socker, vitaminer...)
      </button>
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Laddar matplan...</p>
      </div>
    </div>
  )
}

function NotFoundPage({ message }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Matplanen hittades inte</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || 'Länken kan vara felaktig eller matplanen har tagits bort.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Gå till startsidan
        </Link>
      </div>
    </div>
  )
}

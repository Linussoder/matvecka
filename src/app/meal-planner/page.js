'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { useShoppingList } from '@/contexts/ShoppingListContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import NutritionSummary from '@/components/NutritionSummary'
import TemplateSelector from '@/components/TemplateSelector'

export default function MealPlannerPage() {
  const router = useRouter()
  const supabase = createClient()
  const { items: shoppingListItems } = useShoppingList()
  const { familyMembers, isPremium: isHouseholdPremium, totalServings, combinedRestrictions } = useHousehold()
  const [user, setUser] = useState(null)
  const [useHouseholdMembers, setUseHouseholdMembers] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mealPlan, setMealPlan] = useState(null)
  const [error, setError] = useState(null)
  const [limitReached, setLimitReached] = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)
  const [preferences, setPreferences] = useState({
    servings: 4,
    days: 7,
    maxCostPerServing: 50,
    diet: 'none',
    proteinType: 'any',
    familyFriendly: false,
    cuisineStyle: 'mixed',
    cookingTime: 'medium',
    skillLevel: 'easy',
    excludedIngredients: '',
    preferredIngredients: '',
    selectedStores: ['ICA', 'Coop', 'Willys'],
    productMode: 'shopping-list' // 'shopping-list' | 'store-only' | 'store-plus' | 'free-generate'
  })

  const availableStores = ['ICA', 'Coop', 'Willys']

  const toggleStore = (store) => {
    setPreferences(prev => {
      const stores = prev.selectedStores.includes(store)
        ? prev.selectedStores.filter(s => s !== store)
        : [...prev.selectedStores, store]
      return { ...prev, selectedStores: stores }
    })
  }

  // Check auth status and subscription
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setCheckingAuth(false)

      // Fetch subscription status if logged in
      if (session?.user) {
        try {
          const response = await fetch('/api/user/subscription')
          if (response.ok) {
            const data = await response.json()
            setSubscriptionInfo(data)
            // Check if limit reached
            const remaining = data.remaining?.mealPlans
            if (remaining !== 'Obegränsat' && remaining <= 0) {
              setLimitReached(true)
            }
          }
        } catch (err) {
          console.log('Could not fetch subscription')
        }
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user && showLoginPrompt) {
          setShowLoginPrompt(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, showLoginPrompt])

  // Warn user before leaving page during generation
  useEffect(() => {
    if (!loading) return

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Din veckomeny håller på att skapas. Är du säker på att du vill lämna?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [loading])

  function handleCreateClick() {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    generateMealPlan()
  }

  async function generateMealPlan() {
    setLoading(true)
    setError(null)
    setMealPlan(null)

    try {
      // Pass shopping list items for shopping-list mode
      // If using household members, override servings and include family data
      const effectiveServings = useHouseholdMembers && familyMembers.length > 0
        ? Math.ceil(totalServings)
        : preferences.servings

      const requestBody = {
        ...preferences,
        servings: effectiveServings,
        userId: user?.id,
        shoppingListItems: preferences.productMode === 'shopping-list' ? shoppingListItems : [],
        // Family-aware generation
        useHousehold: useHouseholdMembers && familyMembers.length > 0,
        familyMembers: useHouseholdMembers ? familyMembers : [],
        householdRestrictions: useHouseholdMembers ? combinedRestrictions : null
      }

      const response = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle limit reached error
        if (data.limitReached) {
          setLimitReached(true)
          setSubscriptionInfo(prev => ({
            ...prev,
            remaining: { ...prev?.remaining, mealPlans: 0 }
          }))
          return
        }
        throw new Error(data.error || 'Failed to generate meal plan')
      }

      // Update remaining count after successful generation
      setSubscriptionInfo(prev => {
        if (!prev || prev.plan === 'premium') return prev
        const current = prev.remaining?.mealPlans
        if (typeof current === 'number') {
          return {
            ...prev,
            remaining: { ...prev.remaining, mealPlans: current - 1 }
          }
        }
        return prev
      })

      setMealPlan(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Header */}
      {!mealPlan && !loading && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="container mx-auto px-4 py-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Skapa din veckomeny</h1>
            <p className="text-green-100 text-lg">
              Fyll i dina preferenser så skapar vi en personlig veckomeny
            </p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">

          {/* Limit Reached Banner */}
          {limitReached && !mealPlan && !loading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 -mt-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Månadsgränsen nådd</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Du har skapat {subscriptionInfo?.limits?.mealPlansPerMonth || 3} veckomenyer denna månad.
                    Uppgradera till Premium för obegränsade veckomenyer.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                >
                  Se Premium →
                </Link>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Obegränsade veckomenyer
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    PDF-export
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Näringsspårning
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    7 dagars provperiod
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Form */}
          {!mealPlan && !loading && (
            <div className={`space-y-6 -mt-6 ${limitReached ? 'opacity-50 pointer-events-none' : ''}`}>

              {/* Template or New Choice */}
              {user && !showTemplates && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Har du en sparad mall?</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Återanvänd en tidigare veckomeny snabbt</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="px-5 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-200 dark:border-green-800"
                    >
                      Välj från mall →
                    </button>
                  </div>
                </div>
              )}

              {/* Template Selector */}
              {user && showTemplates && (
                <TemplateSelector
                  onClose={() => setShowTemplates(false)}
                />
              )}

              {/* Basic Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Grundinställningar</h2>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Antal portioner
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={preferences.servings}
                      onChange={(e) => setPreferences({...preferences, servings: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per måltid</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Antal dagar
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={preferences.days}
                      onChange={(e) => setPreferences({...preferences, days: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1-14 dagar</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Budget per portion (kr)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="200"
                      step="5"
                      value={preferences.maxCostPerServing}
                      onChange={(e) => setPreferences({...preferences, maxCostPerServing: parseInt(e.target.value) || 20})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">20-200 kr</p>
                  </div>
                </div>
              </div>

              {/* Family Section - Premium Feature */}
              {isHouseholdPremium && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hushåll</h2>
                    </div>
                    <Link
                      href="/settings?tab=family"
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Hantera →
                    </Link>
                  </div>

                  {familyMembers.length > 0 ? (
                    <>
                      <label className="flex items-center gap-3 cursor-pointer mb-4">
                        <input
                          type="checkbox"
                          checked={useHouseholdMembers}
                          onChange={(e) => setUseHouseholdMembers(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Planera för mitt hushåll</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Portioner och kostbegränsningar hämtas automatiskt</p>
                        </div>
                      </label>

                      {useHouseholdMembers && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
                          {/* Family members inline */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {familyMembers.map(member => (
                              <div
                                key={member.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-full border border-green-200 dark:border-green-700 text-sm"
                              >
                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                                <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                  {member.portion_size === 'small' ? '½' : member.portion_size === 'large' ? '1.5' : '1'}×
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Summary stats */}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-green-700 dark:text-green-400">
                              {Math.ceil(totalServings)} portioner
                            </span>
                            {combinedRestrictions.diet_type && combinedRestrictions.diet_type !== 'none' && (
                              <span className="text-green-600 dark:text-green-500">
                                {combinedRestrictions.diet_type === 'vegetarian' ? 'Vegetariskt' :
                                 combinedRestrictions.diet_type === 'vegan' ? 'Veganskt' :
                                 combinedRestrictions.diet_type === 'pescatarian' ? 'Pescetarianskt' : ''}
                              </span>
                            )}
                            {(combinedRestrictions.allergies?.length > 0 || combinedRestrictions.intolerances?.length > 0) && (
                              <span className="text-amber-600 dark:text-amber-500">
                                {(combinedRestrictions.allergies?.length || 0) + (combinedRestrictions.intolerances?.length || 0)} begränsningar
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Lägg till familjemedlemmar för att få personligt anpassade portioner och kostbegränsningar.
                      </p>
                      <Link
                        href="/settings?tab=family"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Lägg till familjemedlemmar
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Family Section - Disabled for free users */}
              {!isHouseholdPremium && user && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 opacity-50 pointer-events-none select-none">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hushåll</h2>
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">Premium</span>
                    </div>
                    <span className="text-sm text-gray-400 dark:text-gray-500">Hantera →</span>
                  </div>

                  <label className="flex items-center gap-3 cursor-not-allowed mb-4">
                    <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"></div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Planera för mitt hushåll</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Portioner och kostbegränsningar hämtas automatiskt</p>
                    </div>
                  </label>

                  {/* Example family members preview */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-500 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">Erik</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">1×</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-500 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">Anna</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">1×</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-500 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">Lisa</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">½×</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-gray-500 dark:text-gray-400">3 portioner</span>
                      <span className="text-gray-400 dark:text-gray-500">Laktosfritt</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Store & Product Mode Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Butiker & Produkter</h2>
                </div>

                {/* Store Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Välj butiker
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {availableStores.map(store => (
                      <label
                        key={store}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                          preferences.selectedStores.includes(store)
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.selectedStores.includes(store)}
                          onChange={() => toggleStore(store)}
                          className="sr-only"
                        />
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                          preferences.selectedStores.includes(store)
                            ? 'bg-green-600 border-green-600'
                            : 'border-gray-300'
                        }`}>
                          {preferences.selectedStores.includes(store) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm font-medium">{store}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Product Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Produktläge
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      preferences.productMode === 'shopping-list'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="productMode"
                        value="shopping-list"
                        checked={preferences.productMode === 'shopping-list'}
                        onChange={(e) => setPreferences({...preferences, productMode: e.target.value})}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Använd endast min inköpslista</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Recept baseras på produkterna i din sparade inköpslista</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      preferences.productMode === 'store-only'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="productMode"
                        value="store-only"
                        checked={preferences.productMode === 'store-only'}
                        onChange={(e) => setPreferences({...preferences, productMode: e.target.value})}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Använd butiksprodukter</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Recept baseras på veckans erbjudanden från valda butiker</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      preferences.productMode === 'store-plus'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="productMode"
                        value="store-plus"
                        checked={preferences.productMode === 'store-plus'}
                        onChange={(e) => setPreferences({...preferences, productMode: e.target.value})}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Kombinera med andra ingredienser</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Butiksprodukter som bas, men tillåt andra vanliga ingredienser</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      preferences.productMode === 'free-generate'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="productMode"
                        value="free-generate"
                        checked={preferences.productMode === 'free-generate'}
                        onChange={(e) => setPreferences({...preferences, productMode: e.target.value})}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Generera fritt (utan produkter)</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Recept baseras endast på dina preferenser, inte butikserbjudanden</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Diet & Style */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kost & Stil</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kosthållning
                    </label>
                    <select
                      value={preferences.diet}
                      onChange={(e) => setPreferences({...preferences, diet: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="none">Ingen begränsning</option>
                      <option value="vegetarian">Vegetariskt</option>
                      <option value="vegan">Veganskt</option>
                      <option value="pescatarian">Pescetarianskt (fisk)</option>
                      <option value="high-protein">Högt protein</option>
                      <option value="keto">Keto</option>
                      <option value="low-carb">Låg kolhydrat</option>
                      <option value="low-fat">Fettsnålt</option>
                      <option value="gluten-free">Glutenfritt</option>
                      <option value="dairy-free">Laktosfritt</option>
                      <option value="fodmap">Låg FODMAP</option>
                      <option value="diabetic-friendly">Diabetesvänligt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Huvudprotein
                    </label>
                    <select
                      value={preferences.proteinType}
                      onChange={(e) => setPreferences({...preferences, proteinType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="any">Blandat (alla proteinkällor)</option>
                      <option value="meat">Kött (nöt, fläsk, lamm)</option>
                      <option value="poultry">Fågel (kyckling, kalkon)</option>
                      <option value="fish">Fisk & skaldjur</option>
                      <option value="plant-based">Växtbaserat protein</option>
                      <option value="eggs">Ägg som huvudprotein</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Matstil
                    </label>
                    <select
                      value={preferences.cuisineStyle}
                      onChange={(e) => setPreferences({...preferences, cuisineStyle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="mixed">Blandat</option>
                      <option value="swedish">Svensk husmanskost</option>
                      <option value="mediterranean">Medelhavet</option>
                      <option value="asian">Asiatiskt</option>
                      <option value="mexican">Mexikanskt</option>
                      <option value="italian">Italienskt</option>
                      <option value="indian">Indiskt</option>
                      <option value="american">Amerikanskt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tillagningstid
                    </label>
                    <select
                      value={preferences.cookingTime}
                      onChange={(e) => setPreferences({...preferences, cookingTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="quick">Snabbt (under 30 min)</option>
                      <option value="medium">Normalt (30-60 min)</option>
                      <option value="long">Långkok (60+ min)</option>
                      <option value="any">Spelar ingen roll</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Svårighetsgrad
                    </label>
                    <select
                      value={preferences.skillLevel}
                      onChange={(e) => setPreferences({...preferences, skillLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="easy">Enkla recept</option>
                      <option value="medium">Medel</option>
                      <option value="advanced">Avancerade</option>
                      <option value="any">Blandad svårighet</option>
                    </select>
                  </div>
                </div>

                {/* Family-friendly checkbox */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.familyFriendly}
                      onChange={(e) => setPreferences({...preferences, familyFriendly: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Barnvänliga recept</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Undvik starka kryddor och exotiska ingredienser</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Ingredients */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ingredienser</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Undvik dessa ingredienser
                    </label>
                    <input
                      type="text"
                      placeholder="t.ex. nötter, skaldjur, selleri, paprika"
                      value={preferences.excludedIngredients}
                      onChange={(e) => setPreferences({...preferences, excludedIngredients: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separera med komma</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ingredienser jag vill ha med
                    </label>
                    <input
                      type="text"
                      placeholder="t.ex. kyckling, pasta, potatis"
                      value={preferences.preferredIngredients}
                      onChange={(e) => setPreferences({...preferences, preferredIngredients: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separera med komma (valfritt)</p>
                  </div>
                </div>
              </div>

              {/* Summary & Generate */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sammanfattning</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                      {useHouseholdMembers && familyMembers.length > 0 ? Math.ceil(totalServings) : preferences.servings}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {useHouseholdMembers && familyMembers.length > 0 ? `portioner (${familyMembers.length} pers)` : 'portioner'}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500">{preferences.days}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">dagar</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500">{preferences.maxCostPerServing}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">kr/portion</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                      ~{(useHouseholdMembers && familyMembers.length > 0 ? Math.ceil(totalServings) : preferences.servings) * preferences.days * preferences.maxCostPerServing}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">kr totalt</div>
                  </div>
                </div>

                <button
                  onClick={handleCreateClick}
                  disabled={checkingAuth}
                  className="w-full py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transition-all hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Skapa veckomeny
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>

                {!user && !checkingAuth && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Du behöver vara inloggad för att skapa en veckomeny
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Jämför priser</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Från ICA, Coop & Willys</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Automatisk inköpslista</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Sorterad efter kategori</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Spara favoriter</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Kom ihåg recept du gillar</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-green-200 dark:border-green-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Skapar din veckomeny...</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Detta tar ungefär 30-60 sekunder</p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
                  Vänligen stanna kvar på denna sida tills din veckomeny är klar.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Något gick fel</h3>
              <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Försök igen
              </button>
            </div>
          )}

          {/* Meal Plan Results */}
          {mealPlan && (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>

                <div className="relative">
                  <div className="flex justify-center mb-3">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Din veckomeny är klar!</h2>

                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="bg-white/20 px-5 py-2 rounded-lg">
                      <div className="text-xl font-bold">{mealPlan.recipes?.length || 0}</div>
                      <div className="text-xs text-green-100">recept</div>
                    </div>
                    <div className="bg-white/20 px-5 py-2 rounded-lg">
                      <div className="text-xl font-bold">{mealPlan.totalCost} kr</div>
                      <div className="text-xs text-green-100">totalt</div>
                    </div>
                    <div className="bg-white/20 px-5 py-2 rounded-lg">
                      <div className="text-xl font-bold">{mealPlan.avgCostPerServing} kr</div>
                      <div className="text-xs text-green-100">per portion</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push(`/shopping-list/${mealPlan.mealPlanId}`)}
                  className="flex-1 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Visa inköpslista
                </button>
                <button
                  onClick={() => router.push(`/meal-plan/${mealPlan.mealPlanId}`)}
                  className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Visa veckomenyn
                </button>
              </div>

              {/* Nutrition Summary */}
              <NutritionSummary mealPlanId={mealPlan.mealPlanId} />

              {/* Recipes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Veckans recept</h3>
                {mealPlan.recipes?.map((recipe, index) => (
                  <RecipeCard key={index} recipe={recipe} day={index + 1} />
                ))}
              </div>

              {/* Create New */}
              <div className="text-center pt-4">
                <button
                  onClick={() => setMealPlan(null)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  ← Skapa en ny veckomeny
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Logga in för att fortsätta</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Skapa ett gratis konto för att spara dina veckomenyer och få tillgång till alla funktioner.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/signup"
                className="block w-full py-3 bg-green-600 text-white text-center font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                Skapa konto gratis
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              >
                Jag har redan ett konto
              </Link>
            </div>

            <button
              onClick={() => setShowLoginPrompt(false)}
              className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Avbryt
            </button>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Dina preferenser sparas och kommer finnas kvar när du loggar in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RecipeCard({ recipe, day }) {
  const [expanded, setExpanded] = useState(false)
  const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all ${expanded ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}>
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex flex-col items-center justify-center text-white shadow-md">
            <span className="text-xs opacity-80">Dag</span>
            <span className="text-xl font-bold">{day}</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{dayNames[day - 1]}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">{recipe.name}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {recipe.prepTime || recipe.prep_time}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {recipe.servings} port
              </span>
              <span className="text-green-600 dark:text-green-500 font-medium">{recipe.estimatedCost || 'N/A'} kr</span>
            </div>
          </div>
          <svg className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{recipe.description}</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                Ingredienser
              </h4>
              <ul className="space-y-1 text-sm">
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    {ing.amount} {ing.unit} {ing.name}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Instruktioner
              </h4>
              <ol className="space-y-2 text-sm">
                {recipe.instructions?.map((step, i) => (
                  <li key={i} className="flex gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {recipe.tips && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300"><strong>Tips:</strong> {recipe.tips}</p>
            </div>
          )}

          {/* Nutrition Information */}
          {recipe.nutrition && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Näringsvärden per portion
              </h4>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                  <p className="text-lg font-bold text-green-600 dark:text-green-500">{recipe.nutrition.calories}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{recipe.nutrition.protein}g</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">protein</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{recipe.nutrition.carbs}g</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kolhydrater</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                  <p className="text-lg font-bold text-red-500 dark:text-red-400">{recipe.nutrition.fat}g</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">fett</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{recipe.nutrition.fiber}g</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">fiber</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

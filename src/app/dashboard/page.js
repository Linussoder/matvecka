'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useFavorites } from '@/lib/FavoritesContext'
import { useShoppingList } from '@/contexts/ShoppingListContext'
import { useSubscription } from '@/lib/useApi'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import UpgradeBanner from '@/components/UpgradeBanner'

// Lazy load the RecipeDetailModal (heavy component with lots of UI)
const RecipeDetailModal = dynamic(() => import('@/components/RecipeDetailModal'), {
  loading: () => null,
  ssr: false
})

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const { favorites, loading: favoritesLoading, markAsMade, updateFavorite } = useFavorites()

  // Use SWR for subscription data with caching and automatic revalidation
  const { data: subscriptionData } = useSubscription()

  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState(tabParam || 'overview')
  // Track which tabs have been visited for lazy loading
  const [visitedTabs, setVisitedTabs] = useState(new Set([tabParam || 'overview']))
  const [stats, setStats] = useState({
    totalPlans: 0,
    plansThisMonth: 0,
    monthlyLimit: 3,
    isPremium: false,
    totalSaved: 0
  })
  const [allPlans, setAllPlans] = useState([])
  const [shoppingLists, setShoppingLists] = useState([])
  const [quickShoppingList, setQuickShoppingList] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Load quick shopping list from localStorage
  useEffect(() => {
    const savedList = localStorage.getItem('quickShoppingList')
    if (savedList) {
      try {
        setQuickShoppingList(JSON.parse(savedList))
      } catch (e) {
        console.error('Error parsing quick shopping list:', e)
      }
    }
  }, [])

  // Function to toggle item checked state
  const toggleQuickListItem = (itemId) => {
    const updatedList = quickShoppingList.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )
    setQuickShoppingList(updatedList)
    localStorage.setItem('quickShoppingList', JSON.stringify(updatedList))
  }

  // Function to remove item from quick list
  const removeQuickListItem = (itemId) => {
    const updatedList = quickShoppingList.filter(item => item.id !== itemId)
    setQuickShoppingList(updatedList)
    localStorage.setItem('quickShoppingList', JSON.stringify(updatedList))
  }

  // Function to clear all quick list items
  const clearQuickShoppingList = () => {
    setQuickShoppingList([])
    localStorage.removeItem('quickShoppingList')
  }

  // Update active tab when URL changes
  useEffect(() => {
    if (tabParam && ['overview', 'plans', 'lists', 'mina-recept'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
    // Legacy support: redirect old 'favorites' tab to 'mina-recept'
    if (tabParam === 'favorites') {
      router.replace('/dashboard?tab=mina-recept', { scroll: false })
    }
  }, [tabParam, router])

  // Change tab and update URL
  function handleTabChange(tab) {
    setActiveTab(tab)
    // Mark tab as visited for lazy loading (content stays mounted after first visit)
    setVisitedTabs(prev => new Set([...prev, tab]))
    router.push(`/dashboard?tab=${tab}`, { scroll: false })
  }

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)

      // Fetch all data in parallel - filtered by current user
      const userId = session.user.id
      const [
        { count: totalPlans },
        { data: plans },
        { data: lists }
      ] = await Promise.all([
        // Total plans count for this user
        supabase
          .from('meal_plans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        // All plans for this user
        supabase
          .from('meal_plans')
          .select(`*, meal_plan_recipes(count)`)
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        // Shopping lists for this user
        supabase
          .from('shopping_lists')
          .select(`*, meal_plans (id, name, week_start_date, total_cost, servings)`)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      // Get monthly usage from SWR-cached subscription data
      const plansThisMonth = subscriptionData?.usage?.mealPlansGenerated || 0
      const monthlyLimit = subscriptionData?.limits?.mealPlansPerMonth || 3
      const isPremium = subscriptionData?.plan === 'premium'

      setStats({
        totalPlans: totalPlans || 0,
        plansThisMonth,
        monthlyLimit,
        isPremium,
        totalSaved: (totalPlans || 0) * 127
      })

      setAllPlans(plans || [])
      setShoppingLists(lists || [])
      setLoading(false)
    }

    loadDashboard()
  }, [supabase, subscriptionData])

  // Update stats when subscription data changes (SWR cache hit)
  useEffect(() => {
    if (subscriptionData) {
      setStats(prev => ({
        ...prev,
        plansThisMonth: subscriptionData.usage?.mealPlansGenerated || 0,
        monthlyLimit: subscriptionData.limits?.mealPlansPerMonth || 3,
        isPremium: subscriptionData.plan === 'premium'
      }))
    }
  }, [subscriptionData])

  function getUserDisplayName() {
    if (!user) return ''
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.email) return user.email.split('@')[0]
    return 'Användare'
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    })
  }

  function formatDateLong(dateString) {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function countItems(items) {
    if (!items) return 0
    return Array.isArray(items) ? items.length : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="container mx-auto px-4 py-8 md:py-12">
          {/* Welcome Skeleton */}
          <div className="mb-8">
            <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Hej, {getUserDisplayName()}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Välkommen till din dashboard
          </p>
        </div>

        {/* Upgrade Banner for free users */}
        <UpgradeBanner type="inline" />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPlans}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-base">Veckomenyer</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 md:p-6 group relative">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.plansThisMonth}/{stats.isPremium ? '∞' : stats.monthlyLimit}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-base">Veckomenyer denna månad</p>
              </div>
            </div>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {stats.isPremium
                ? 'Du har obegränsat med veckomenyer som Premium-medlem'
                : `Du kan skapa ${stats.monthlyLimit} veckomenyer per månad på gratisplanen`
              }
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-500">{stats.totalSaved} kr</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-base">Sparat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm overflow-x-auto">
          <button
            onClick={() => handleTabChange('overview')}
            className={`flex-1 px-3 md:px-4 py-2.5 rounded-lg font-medium transition-all text-sm md:text-base whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Översikt
          </button>
          <button
            onClick={() => handleTabChange('plans')}
            className={`flex-1 px-3 md:px-4 py-2.5 rounded-lg font-medium transition-all text-sm md:text-base whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Veckomenyer
            {allPlans.length > 0 && (
              <span className={`ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'plans' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
              }`}>
                {allPlans.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('lists')}
            className={`flex-1 px-3 md:px-4 py-2.5 rounded-lg font-medium transition-all text-sm md:text-base whitespace-nowrap ${
              activeTab === 'lists'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Inköpslistor
            {shoppingLists.length > 0 && (
              <span className={`ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'lists' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
              }`}>
                {shoppingLists.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('mina-recept')}
            className={`flex-1 px-3 md:px-4 py-2.5 rounded-lg font-medium transition-all text-sm md:text-base whitespace-nowrap ${
              activeTab === 'mina-recept'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Mina recept
            {favorites.length > 0 && (
              <span className={`ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'mina-recept' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
              }`}>
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content - Lazy loaded, stays mounted after first visit */}
        {visitedTabs.has('overview') && (
          <div className={`space-y-6 ${activeTab !== 'overview' ? 'hidden' : ''}`}>
            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <Link
                href="/meal-planner"
                className="bg-green-600 text-white rounded-xl p-6 hover:bg-green-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Skapa ny veckomeny</h3>
                    <p className="text-green-100 mt-1">
                      Få en 7-dagars plan med smarta recept
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/products"
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Veckans erbjudanden</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Se de senaste priserna
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {visitedTabs.has('plans') && (
          <div className={activeTab !== 'plans' ? 'hidden' : ''}>
            {allPlans.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Inga sparade veckomenyer än
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Skapa din första smarta veckoplan!
                </p>
                <Link
                  href="/meal-planner"
                  className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                >
                  Skapa Veckomeny
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {allPlans.map((plan) => {
                  const recipeCount = plan.meal_plan_recipes?.[0]?.count || 0
                  return (
                    <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {plan.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              Skapad {formatDateLong(plan.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                              {plan.total_cost} kr
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Total kostnad</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <span className="flex items-center gap-1">
                            Vecka {new Date(plan.week_start_date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            {recipeCount} recept
                          </span>
                          <span className="flex items-center gap-1">
                            {plan.servings} portioner
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <Link
                            href={`/meal-plan/${plan.id}`}
                            className="flex-1 px-4 py-2 bg-green-600 text-white text-center font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Visa Recept
                          </Link>
                          <Link
                            href={`/shopping-list/${plan.id}`}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Inköpslista
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {visitedTabs.has('lists') && (
          <div className={`space-y-6 ${activeTab !== 'lists' ? 'hidden' : ''}`}>
            {/* Quick Shopping List from Favorites */}
            {quickShoppingList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-green-200">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Snabb Inköpslista</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Ingredienser från dina favoriter</p>
                    </div>
                  </div>
                  <button
                    onClick={clearQuickShoppingList}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Rensa alla
                  </button>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {quickShoppingList.map((item) => (
                      <li
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          item.checked ? 'bg-gray-50 opacity-60' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <button
                          onClick={() => toggleQuickListItem(item.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            item.checked
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {item.checked && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1">
                          <span className={`font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {item.name}
                          </span>
                          {item.amount && (
                            <span className="text-gray-500 ml-2">{item.amount}</span>
                          )}
                          {item.recipe && (
                            <span className="text-xs text-green-600 ml-2">({item.recipe})</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeQuickListItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      {quickShoppingList.filter(i => i.checked).length} av {quickShoppingList.length} avbockade
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Meal Plan Shopping Lists */}
            {shoppingLists.length === 0 && quickShoppingList.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Inga inköpslistor ännu
                </h2>
                <p className="text-gray-600 mb-6">
                  Skapa en veckomeny för att få din första inköpslista
                </p>
                <Link
                  href="/meal-planner"
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Skapa veckomeny
                </Link>
              </div>
            ) : shoppingLists.length > 0 && (
              <div className="grid gap-4">
                {shoppingLists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/shopping-list/${list.meal_plan_id}`}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {list.meal_plans?.name || 'Inköpslista'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Skapad {formatDate(list.created_at)}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                            <span>{countItems(list.items)} varor</span>
                            <span>{list.meal_plans?.servings || 4} portioner</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {list.total_cost?.toFixed(0) || '—'} kr
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Uppskattad kostnad</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {visitedTabs.has('mina-recept') && (
          <div className={activeTab !== 'mina-recept' ? 'hidden' : ''}>
            <MinaReceptTab
              favorites={favorites}
              favoritesLoading={favoritesLoading}
              updateFavorite={updateFavorite}
              markAsMade={markAsMade}
              isPremium={stats.isPremium}
              allPlans={allPlans}
            />
          </div>
        )}
      </main>
    </div>
  )
}

// ============================================
// Mina Recept Tab - With Sub-tabs and Import
// ============================================
function MinaReceptTab({ favorites, favoritesLoading, updateFavorite, markAsMade, isPremium, allPlans }) {
  const [subTab, setSubTab] = useState('importera')
  const [filter, setFilter] = useState('all')
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesText, setNotesText] = useState('')
  const [selectedFavorite, setSelectedFavorite] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const { addIngredients } = useShoppingList()
  const { addImportedRecipe, toggleMealPlanFavorite, isMealPlanFavorite } = useFavorites()
  const supabase = createClient()

  // Import form state
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)

  // Manual recipe creation form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    servings: 4,
    prepTime: '',
    cookTime: '',
    ingredients: '',
    instructions: ''
  })
  const [creating, setCreating] = useState(false)

  // State for all meal plan recipes (for Genererade tab)
  const [mealPlanRecipes, setMealPlanRecipes] = useState([])
  const [loadingMealPlanRecipes, setLoadingMealPlanRecipes] = useState(true)

  // Fetch all meal plan recipes when component mounts or plans change
  useEffect(() => {
    async function fetchMealPlanRecipes() {
      if (!allPlans || allPlans.length === 0) {
        setMealPlanRecipes([])
        setLoadingMealPlanRecipes(false)
        return
      }

      setLoadingMealPlanRecipes(true)
      const planIds = allPlans.map(p => p.id)

      const { data, error } = await supabase
        .from('meal_plan_recipes')
        .select('*, meal_plans(id, name, week_start_date)')
        .in('meal_plan_id', planIds)
        .order('day_number', { ascending: true })

      if (error) {
        console.error('Error fetching meal plan recipes:', error)
      } else {
        setMealPlanRecipes(data || [])
      }
      setLoadingMealPlanRecipes(false)
    }

    fetchMealPlanRecipes()
  }, [allPlans, supabase])

  // Filter favorites by type
  // Skapade = imported recipes (from URL or manually created)
  const skapadeRecipes = favorites.filter(f => f.source === 'imported' || f.source === 'created' || f.source_url)
  // Favoriter = ALL favorited recipes (both regular and meal plan favorites)
  const allFavorites = favorites.filter(f => !f.source || (f.source !== 'imported' && f.source !== 'created'))

  // Helper to get favorite data for a meal plan recipe (for Genererade tab)
  const getFavoriteForMealPlanRecipe = (mealPlanRecipeId) => {
    return favorites.find(f => f.meal_plan_recipe_id === mealPlanRecipeId)
  }

  // Get current sub-tab's recipes
  const getCurrentRecipes = () => {
    let recipes = []
    switch (subTab) {
      case 'importera':
        // Importera tab shows import tools, not recipes
        return []
      case 'skapade':
        recipes = skapadeRecipes
        break
      case 'genererade':
        // All recipes from meal plans (not favorites, actual recipes)
        recipes = mealPlanRecipes.map(r => ({
          ...r,
          recipe: r.recipe_data,
          _isMealPlanRecipe: true,
          _mealPlanName: r.meal_plans?.name,
          _mealPlanDate: r.meal_plans?.week_start_date
        }))
        break
      case 'favoriter':
        // All favorited recipes (including meal plan favorites)
        recipes = allFavorites
        break
      default:
        recipes = favorites
    }

    // Apply filter/sort
    return [...recipes].sort((a, b) => {
      if (filter === 'recent') return new Date(b.created_at) - new Date(a.created_at)
      if (filter === 'top-rated') return (b.rating || 0) - (a.rating || 0)
      if (filter === 'most-made') return (b.times_made || 0) - (a.times_made || 0)
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }

  const currentRecipes = getCurrentRecipes()
  const isLoadingTab = subTab === 'genererade' ? loadingMealPlanRecipes : favoritesLoading

  // Handle manual recipe creation
  async function handleCreateRecipe(e) {
    e.preventDefault()
    if (!createForm.name.trim()) return

    setCreating(true)
    setImportError(null)
    setImportSuccess(null)

    try {
      // Parse ingredients (one per line)
      const ingredientLines = createForm.ingredients.split('\n').filter(line => line.trim())
      const ingredients = ingredientLines.map(line => {
        const match = line.match(/^([\d.,/]+)?\s*([a-zA-ZåäöÅÄÖ]+)?\s+(.+)$/i)
        if (match) {
          return { amount: match[1] || '', unit: match[2] || '', name: match[3] }
        }
        return { name: line.trim(), amount: '', unit: '' }
      })

      // Parse instructions (one per line or numbered)
      const instructionLines = createForm.instructions.split('\n').filter(line => line.trim())
      const instructions = instructionLines.map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())

      const recipeData = {
        name: createForm.name.trim(),
        title: createForm.name.trim(),
        description: createForm.description.trim(),
        servings: parseInt(createForm.servings) || 4,
        prep_time: createForm.prepTime.trim(),
        cook_time: createForm.cookTime.trim(),
        ingredients,
        instructions,
        source: 'created'
      }

      // Save using the imported recipe function but with source='created'
      const saved = await addImportedRecipe({ ...recipeData, source: 'created' })
      if (saved) {
        setImportSuccess(`"${recipeData.name}" har skapats!`)
        setCreateForm({
          name: '',
          description: '',
          servings: 4,
          prepTime: '',
          cookTime: '',
          ingredients: '',
          instructions: ''
        })
        setShowCreateForm(false)
        setSubTab('skapade') // Switch to skapade tab to see the new recipe
      } else {
        throw new Error('Kunde inte spara receptet')
      }
    } catch (error) {
      setImportError(error.message)
    } finally {
      setCreating(false)
    }
  }

  // Handle recipe import
  async function handleImport(e) {
    e.preventDefault()
    if (!importUrl.trim()) return

    setImporting(true)
    setImportError(null)
    setImportSuccess(null)

    try {
      const res = await fetch('/api/recipe/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.upgradePath) {
          window.location.href = data.upgradePath
          return
        }
        throw new Error(data.error || 'Kunde inte importera receptet')
      }

      // Save to favorites
      const saved = await addImportedRecipe(data.recipe)
      if (saved) {
        setImportSuccess(`"${data.recipe.name}" har importerats!`)
        setImportUrl('')
      } else {
        throw new Error('Kunde inte spara receptet')
      }
    } catch (error) {
      setImportError(error.message)
    } finally {
      setImporting(false)
    }
  }

  const handleSaveNotes = async (favorite) => {
    const isMealPlanRecipe = !!favorite.meal_plan_recipe_id
    const recipeId = isMealPlanRecipe ? favorite.meal_plan_recipe_id : favorite.recipe_id
    await updateFavorite(recipeId, { notes: notesText }, isMealPlanRecipe)
    setEditingNotes(null)
    setNotesText('')
  }

  const handleOpenRecipe = (favorite) => {
    setSelectedFavorite(favorite)
    setShowModal(true)
  }

  const handleAddToShoppingList = async (ingredients, recipeName) => {
    try {
      if (!ingredients || ingredients.length === 0) {
        console.error('No ingredients to add to shopping list')
        return false
      }
      const success = addIngredients(ingredients, recipeName)
      if (!success) return false
      try {
        await fetch('/api/shopping-list/quick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: ingredients, recipeName: recipeName })
        })
      } catch (dbError) {
        console.log('Database save failed, using context only:', dbError)
      }
      return true
    } catch (error) {
      console.error('Error adding to shopping list:', error)
      return false
    }
  }

  if (isLoadingTab) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Mina recept</h2>
            <p className="text-white/80">Alla dina sparade och importerade recept</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{skapadeRecipes.length}</div>
              <div className="text-white/80 text-sm">Skapade</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{mealPlanRecipes.length}</div>
              <div className="text-white/80 text-sm">Genererade</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{allFavorites.length}</div>
              <div className="text-white/80 text-sm">Favoriter</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit overflow-x-auto">
        {[
          { id: 'importera', label: 'Importera', icon: 'import' },
          { id: 'skapade', label: 'Skapade', count: skapadeRecipes.length },
          { id: 'genererade', label: 'Genererade', count: mealPlanRecipes.length },
          { id: 'favoriter', label: 'Favoriter', count: allFavorites.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
              subTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon && (
              tab.icon === 'import' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              ) : (
                <span>{tab.icon}</span>
              )
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                subTab === tab.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Importera Tab - URL import and manual creation */}
      {subTab === 'importera' && (
        <div className="space-y-6">
          {/* URL Import Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Importera från URL</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Klistra in en länk och låt AI extrahera receptet</p>
              </div>
              {!isPremium && (
                <span className="ml-auto px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Premium</span>
              )}
            </div>

            {isPremium ? (
              <form onSubmit={handleImport}>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://koket.se/recept/..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={importing}
                  />
                  <button
                    type="submit"
                    disabled={importing || !importUrl.trim()}
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {importing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Importerar...
                      </span>
                    ) : (
                      'Importera'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Uppgradera till Premium för att importera recept automatiskt från valfri webbsida.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
                >
                  Se Premium
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* Manual Recipe Creation Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Skapa eget recept</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Fyll i formuläret för att lägga till ett eget recept</p>
              </div>
            </div>

            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors font-medium"
              >
                + Lägg till nytt recept
              </button>
            ) : (
              <form onSubmit={handleCreateRecipe} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receptnamn *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="T.ex. Mormors köttbullar"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beskrivning</label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="En kort beskrivning av receptet"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portioner</label>
                    <input
                      type="number"
                      value={createForm.servings}
                      onChange={(e) => setCreateForm({ ...createForm, servings: e.target.value })}
                      min="1"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Förberedelsetid</label>
                    <input
                      type="text"
                      value={createForm.prepTime}
                      onChange={(e) => setCreateForm({ ...createForm, prepTime: e.target.value })}
                      placeholder="T.ex. 20 min"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tillagningstid</label>
                    <input
                      type="text"
                      value={createForm.cookTime}
                      onChange={(e) => setCreateForm({ ...createForm, cookTime: e.target.value })}
                      placeholder="T.ex. 30 min"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ingredienser *</label>
                  <textarea
                    value={createForm.ingredients}
                    onChange={(e) => setCreateForm({ ...createForm, ingredients: e.target.value })}
                    placeholder="Skriv en ingrediens per rad, t.ex:&#10;500g köttfärs&#10;1 st lök&#10;2 dl grädde"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instruktioner *</label>
                  <textarea
                    value={createForm.instructions}
                    onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                    placeholder="Skriv en instruktion per rad, t.ex:&#10;1. Blanda köttfärs med kryddor&#10;2. Forma till bullar&#10;3. Stek i smör"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={5}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setCreateForm({
                        name: '',
                        description: '',
                        servings: 4,
                        prepTime: '',
                        cookTime: '',
                        ingredients: '',
                        instructions: ''
                      })
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !createForm.name.trim() || !createForm.ingredients.trim() || !createForm.instructions.trim()}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sparar...
                      </span>
                    ) : (
                      'Spara recept'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Success/Error Messages */}
          {importError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center justify-between">
              <span>{importSuccess}</span>
              <button
                onClick={() => setSubTab('skapade')}
                className="text-green-700 font-medium hover:underline"
              >
                Visa i Skapade →
              </button>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Tips</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                  Alla recept du importerar eller skapar sparas under fliken "Skapade".
                  Därifrån kan du betygsätta, lägga till anteckningar och lägga till ingredienser i din inköpslista.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter - Show when there are recipes (not on importera tab) */}
      {subTab !== 'importera' && currentRecipes.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'Alla', icon: 'list' },
            { id: 'recent', label: 'Senaste', icon: 'clock' },
            { id: 'top-rated', label: 'Högst betyg', icon: 'star' },
            { id: 'most-made', label: 'Mest lagade', icon: 'chef' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                filter === f.id
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.icon === 'list' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
              {f.icon === 'clock' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {f.icon === 'star' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              )}
              {f.icon === 'chef' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty States - Only show for tabs that display recipes */}
      {subTab !== 'importera' && currentRecipes.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {subTab === 'skapade' ? (
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            ) : subTab === 'genererade' ? (
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {subTab === 'skapade' && 'Inga skapade recept ännu'}
            {subTab === 'genererade' && 'Inga genererade recept ännu'}
            {subTab === 'favoriter' && 'Inga favoriter sparade'}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {subTab === 'skapade' && 'Gå till "Importera" för att lägga till recept från URL eller skapa egna recept.'}
            {subTab === 'genererade' && 'Skapa en veckomeny för att få AI-genererade recept här.'}
            {subTab === 'favoriter' && 'Klicka på hjärtat på recept du gillar för att spara dem här.'}
          </p>
          {subTab === 'skapade' && (
            <button
              onClick={() => setSubTab('importera')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
            >
              Lägg till recept
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          {subTab === 'genererade' && (
            <Link
              href="/meal-planner"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
            >
              Skapa en veckomeny
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* Recipe Cards Grid - Not on importera tab */}
      {subTab !== 'importera' && currentRecipes.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {currentRecipes.map((favorite) => {
            const recipe = favorite.recipe || favorite.recipe_data
            if (!recipe) return null

            return (
              <div
                key={favorite.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                {/* Card Header - Clickable */}
                <div
                  className="relative cursor-pointer"
                  onClick={() => handleOpenRecipe(favorite)}
                >
                  <div className="absolute inset-0 bg-green-600 hover:bg-green-700 transition-colors" />
                  <div className="relative p-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="h-14">
                          <h3 className="font-bold text-xl line-clamp-2 drop-shadow-sm">
                            {recipe.title || recipe.name}
                          </h3>
                        </div>
                        <div className="h-10 mt-1">
                          {recipe.description && (
                            <p className="text-white/80 text-sm line-clamp-2">
                              {recipe.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {subTab === 'skapade' ? (
                          favorite.source_url ? (
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                          )
                        ) : subTab === 'genererade' ? (
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </div>
                        )}
                        {favorite.times_made > 0 && (
                          <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium">
                            {favorite.times_made}x lagat
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge row - fixed height for alignment */}
                    <div className="mt-2 h-6 flex items-center">
                      {/* Source badge for imported recipes */}
                      {subTab === 'skapade' && favorite.source_url && (
                        <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {recipe.source_domain || new URL(favorite.source_url).hostname}
                        </span>
                      )}

                      {/* Meal plan badge for generated recipes */}
                      {subTab === 'genererade' && favorite._mealPlanName && (
                        <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {favorite._mealPlanName}
                        </span>
                      )}
                    </div>

                    {/* Meta pills */}
                    <div className="flex flex-wrap gap-2 mt-2 h-8 items-center">
                      {(recipe.prep_time || recipe.prepTime) && (
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {recipe.prep_time || recipe.prepTime}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {recipe.servings} port
                        </span>
                      )}
                      <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center gap-1 ml-auto">
                        Klicka för detaljer →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card content - unified layout for all tabs */}
                {(() => {
                  // For genererade tab, get linked favorite data if exists
                  const linkedFavorite = subTab === 'genererade'
                    ? getFavoriteForMealPlanRecipe(favorite.id)
                    : favorite
                  const isFavorited = subTab === 'genererade'
                    ? isMealPlanFavorite(favorite.id)
                    : true
                  const isEditingLinked = editingNotes === (linkedFavorite?.id || favorite.id)

                  return (
                    <>
                      {/* Action bar - consistent across all tabs */}
                      <div className="px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Tab-specific info */}
                            {subTab === 'genererade' && (
                              <>
                                {favorite.day_number !== undefined && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                    Dag {favorite.day_number + 1}
                                  </span>
                                )}
                                {favorite.meal_type && (
                                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 capitalize">
                                    {favorite.meal_type}
                                  </span>
                                )}
                              </>
                            )}
                            {subTab === 'skapade' && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                {favorite.source_url ? 'Importerat recept' : 'Eget recept'}
                              </span>
                            )}
                            {subTab === 'favoriter' && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                {favorite.meal_plan_recipe_id ? 'Från veckomeny' : 'Sparat recept'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Favorite button - same position for all tabs */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (subTab === 'genererade') {
                                  toggleMealPlanFavorite(favorite.id, favorite.recipe_data || recipe)
                                } else if (favorite.meal_plan_recipe_id) {
                                  toggleMealPlanFavorite(favorite.meal_plan_recipe_id, favorite.recipe_data || recipe)
                                } else {
                                  // For skapade/favoriter without meal_plan_recipe_id, show as filled (already saved)
                                }
                              }}
                              className={`p-2 rounded-full transition-all ${
                                isFavorited
                                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400'
                              }`}
                              title={isFavorited ? 'Sparad som favorit' : 'Lägg till i favoriter'}
                            >
                              <svg
                                className="w-5 h-5"
                                fill={isFavorited ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            </button>
                            {/* Link to meal plan - only for genererade */}
                            {subTab === 'genererade' && favorite.meal_plan_id && (
                              <Link
                                href={`/meal-plan/${favorite.meal_plan_id}`}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Visa veckomeny →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rating & Review Section - show for all tabs */}
                      {/* For genererade: only show if favorited, otherwise show prompt */}
                      {subTab === 'genererade' && !isFavorited ? (
                        <div className="p-5">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                            <p className="text-gray-500 text-sm mb-3">
                              Spara receptet som favorit för att betygsätta och skriva en recension
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleMealPlanFavorite(favorite.id, favorite.recipe_data || recipe)
                              }}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              Spara som favorit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ditt betyg:</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => {
                                      if (subTab === 'genererade' && linkedFavorite) {
                                        updateFavorite(linkedFavorite.meal_plan_recipe_id, { rating: star }, true)
                                      } else {
                                        const isMealPlanRecipe = !!favorite.meal_plan_recipe_id
                                        const recipeId = isMealPlanRecipe ? favorite.meal_plan_recipe_id : favorite.recipe_id
                                        updateFavorite(recipeId, { rating: star }, isMealPlanRecipe)
                                      }
                                    }}
                                    className="p-1 hover:scale-125 transition-transform"
                                  >
                                    <span className={`text-2xl ${star <= ((linkedFavorite?.rating || favorite.rating) || 0) ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'}`}>
                                      ★
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Notes/Review Section */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  Din recension
                                </span>
                                {!isEditingLinked && (
                                  <button
                                    onClick={() => {
                                      setEditingNotes(linkedFavorite?.id || favorite.id)
                                      setNotesText((linkedFavorite?.notes || favorite.notes) || '')
                                    }}
                                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                                  >
                                    {(linkedFavorite?.notes || favorite.notes) ? 'Redigera' : '+ Lägg till'}
                                  </button>
                                )}
                              </div>

                              {isEditingLinked ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={notesText}
                                    onChange={(e) => setNotesText(e.target.value)}
                                    placeholder="Hur var receptet? Tips till nästa gång? Dela dina tankar..."
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                    rows={3}
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => {
                                        setEditingNotes(null)
                                        setNotesText('')
                                      }}
                                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                      Avbryt
                                    </button>
                                    <button
                                      onClick={() => handleSaveNotes(linkedFavorite || favorite)}
                                      className="px-4 py-1.5 text-sm bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                                    >
                                      Spara
                                    </button>
                                  </div>
                                </div>
                              ) : (linkedFavorite?.notes || favorite.notes) ? (
                                <p className="text-gray-600 text-sm italic">"{linkedFavorite?.notes || favorite.notes}"</p>
                              ) : (
                                <p className="text-gray-400 text-sm">Ingen recension ännu. Dela dina tankar om receptet!</p>
                              )}
                            </div>
                          </div>

                          {/* Times Made Counter */}
                          <div className="px-5 pb-5">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Antal gånger lagat</span>
                                  <p className="text-xs text-gray-500 mt-0.5">Håll koll på hur ofta du lagar receptet</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const timesMade = (linkedFavorite?.times_made || favorite.times_made) || 0
                                      if (timesMade > 0) {
                                        if (subTab === 'genererade' && linkedFavorite) {
                                          updateFavorite(linkedFavorite.meal_plan_recipe_id, { times_made: timesMade - 1 }, true)
                                        } else {
                                          const isMealPlanRecipe = !!favorite.meal_plan_recipe_id
                                          const recipeId = isMealPlanRecipe ? favorite.meal_plan_recipe_id : favorite.recipe_id
                                          updateFavorite(recipeId, { times_made: timesMade - 1 }, isMealPlanRecipe)
                                        }
                                      }
                                    }}
                                    disabled={((linkedFavorite?.times_made || favorite.times_made) || 0) === 0}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                                      ((linkedFavorite?.times_made || favorite.times_made) || 0) > 0
                                        ? 'bg-white text-gray-700 hover:bg-gray-200 shadow-sm'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    −
                                  </button>
                                  <span className="text-2xl font-bold text-gray-900 w-8 text-center">
                                    {(linkedFavorite?.times_made || favorite.times_made) || 0}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (subTab === 'genererade' && linkedFavorite) {
                                        markAsMade(linkedFavorite.meal_plan_recipe_id, true)
                                      } else {
                                        const isMealPlanRecipe = !!favorite.meal_plan_recipe_id
                                        const recipeId = isMealPlanRecipe ? favorite.meal_plan_recipe_id : favorite.recipe_id
                                        markAsMade(recipeId, isMealPlanRecipe)
                                      }
                                    }}
                                    className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold hover:bg-green-700 transition-all shadow-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}

      {/* Help improve callout - Not on importera tab */}
      {subTab !== 'importera' && currentRecipes.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Hjälp oss bli bättre!</h3>
              <p className="text-gray-600 text-sm">
                Dina betyg och recensioner hjälper oss att skapa ännu bättre recept.
                Ju mer feedback du ger, desto bättre blir dina framtida veckomenyer!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedFavorite?.recipe || selectedFavorite?.recipe_data}
        favorite={selectedFavorite}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedFavorite(null)
        }}
        onAddToShoppingList={handleAddToShoppingList}
      />
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useShoppingList } from '@/contexts/ShoppingListContext'
import PdfDownloadButton from '@/components/PdfDownloadButton'
import ServingScaler from '@/components/ServingScaler'

const categoryConfig = {
  'Kött': { color: 'bg-red-50 border-red-200' },
  'Fisk': { color: 'bg-blue-50 border-blue-200' },
  'Grönsaker': { color: 'bg-green-50 border-green-200' },
  'Frukt': { color: 'bg-pink-50 border-pink-200' },
  'Mejeri': { color: 'bg-yellow-50 border-yellow-200' },
  'Spannmål': { color: 'bg-orange-50 border-orange-200' },
  'Dryck': { color: 'bg-cyan-50 border-cyan-200' },
  'Övrigt': { color: 'bg-gray-50 border-gray-200' },
}

export default function ShoppingListPage() {
  const params = useParams()
  const id = params.id

  const [mealPlan, setMealPlan] = useState(null)
  const [shoppingList, setShoppingList] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkedItems, setCheckedItems] = useState({})
  const [addedToGlobalList, setAddedToGlobalList] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [servingMultiplier, setServingMultiplier] = useState(1.0)
  const { addIngredients, openDrawer } = useShoppingList()

  // Callback for when serving scale changes
  const handleScaleChange = useCallback(async (newMultiplier) => {
    setServingMultiplier(newMultiplier)
    // Refetch shopping list to get scaled quantities
    try {
      const response = await fetch(`/api/shopping-list/${id}`)
      const data = await response.json()
      if (response.ok) {
        setShoppingList(data.shoppingList)
      }
    } catch (err) {
      console.error('Failed to refresh shopping list:', err)
    }
  }, [id])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/shopping-list/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load shopping list')
        }

        setMealPlan(data.mealPlan)
        setShoppingList(data.shoppingList)
        setRecipes(data.recipes)
        setServingMultiplier(data.servingMultiplier || 1.0)

        // Fetch subscription status
        try {
          const subResponse = await fetch('/api/user/subscription')
          if (subResponse.ok) {
            const subData = await subResponse.json()
            setIsPremium(subData.plan === 'premium')
          }
        } catch (subErr) {
          console.log('Could not fetch subscription status')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const toggleItem = (itemName) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  const handleAddAllToGlobalList = () => {
    // Convert shopping list items to ingredient format for addIngredients
    const ingredients = shoppingList.map(item => ({
      name: item.name,
      amount: formatAmount(item.totalAmount),
      unit: item.unit || ''
    }))

    addIngredients(ingredients, mealPlan?.name || 'Veckomeny')
    setAddedToGlobalList(true)
    openDrawer()
    setTimeout(() => setAddedToGlobalList(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar inköpslista...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <span className="text-6xl block mb-4">😕</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Kunde inte ladda inköpslistan</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/my-plans"
              className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              ← Tillbaka till mina planer
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Group by category
  const groupedItems = shoppingList.reduce((acc, item) => {
    const category = item.category || 'Övrigt'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {})

  const categoryOrder = ['Kött', 'Fisk', 'Grönsaker', 'Frukt', 'Mejeri', 'Spannmål', 'Dryck', 'Övrigt']
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a)
    const indexB = categoryOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  const totalItems = shoppingList.length
  const checkedCount = Object.values(checkedItems).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8 md:py-12 print:hidden">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Inköpslista</h1>
          <p className="text-green-100 mb-6">
            {mealPlan?.name} • Vecka {mealPlan?.week_start_date && new Date(mealPlan.week_start_date).toLocaleDateString('sv-SE')}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <div className="text-left">
                <p className="font-bold">{totalItems} varor</p>
                <p className="text-xs text-green-200">Att handla</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <div className="text-left">
                <p className="font-bold">{recipes.length} recept</p>
                <p className="text-xs text-green-200">I planen</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-left">
                <p className="font-bold">{mealPlan?.servings || 4} portioner</p>
                <p className="text-xs text-green-200">Per måltid</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="font-bold">{mealPlan?.total_cost} kr</p>
                <p className="text-xs text-green-200">Total kostnad</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 print:py-0">
        {/* Breadcrumb */}
        <nav className="mb-6 print:hidden">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-green-600 transition-colors">Hem</Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href={`/meal-plan/${id}`} className="hover:text-green-600 transition-colors">Veckomeny</Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900 font-medium">Inköpslista</li>
          </ol>
        </nav>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6 print:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Handlingsprogress</span>
            <span className="text-sm text-gray-500">{checkedCount} av {totalItems} varor</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
          {checkedCount === totalItems && totalItems > 0 && (
            <p className="text-center text-green-600 font-medium mt-2 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Allt avbockat!
            </p>
          )}
        </div>

        {/* Serving Scaler */}
        <div className="mb-6 print:hidden">
          <ServingScaler
            mealPlanId={id}
            currentMultiplier={servingMultiplier}
            baseServings={mealPlan?.servings || 4}
            isPremium={isPremium}
            onScaleChange={handleScaleChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Skriv ut
          </button>
          <button
            onClick={handleAddAllToGlobalList}
            className={`inline-flex items-center gap-2 px-5 py-2.5 font-medium rounded-lg transition-colors ${
              addedToGlobalList
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {addedToGlobalList ? 'Tillagd i kundvagnen!' : 'Lägg till i kundvagn'}
          </button>
          <button
            onClick={() => {
              const text = generateTextList(shoppingList, sortedCategories, groupedItems)
              navigator.clipboard.writeText(text)
              alert('Inköpslista kopierad!')
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Kopiera lista
          </button>
          <PdfDownloadButton
            type="shopping-list"
            id={id}
            label="Ladda ner PDF"
            isPremium={isPremium}
          />
          {checkedCount > 0 && (
            <button
              onClick={() => setCheckedItems({})}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-gray-500 hover:text-gray-700 font-medium"
            >
              Rensa avbockningar
            </button>
          )}
        </div>

        {/* Shopping List Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sortedCategories.map(category => {
            const config = categoryConfig[category] || categoryConfig['Övrigt']
            return (
              <div
                key={category}
                className={`rounded-xl border-2 p-5 ${config.color} print:border print:border-gray-300 print:bg-white`}
              >
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {category}
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {groupedItems[category].length} varor
                  </span>
                </h3>
                <ul className="space-y-2">
                  {groupedItems[category].map((item, index) => {
                    const isChecked = checkedItems[item.name]
                    return (
                      <li
                        key={index}
                        onClick={() => toggleItem(item.name)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all print:cursor-default ${
                          isChecked
                            ? 'bg-green-100 opacity-60'
                            : 'hover:bg-white/50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors print:border-gray-400 ${
                          isChecked
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`flex-1 ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.name}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatAmount(item.totalAmount)} {item.unit}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Total Cost Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 print:shadow-none print:border print:border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Totalt antal varor</p>
              <p className="text-3xl font-bold text-gray-900">{totalItems} st</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Uppskattad kostnad</p>
              <p className="text-3xl font-bold text-green-600">{mealPlan?.total_cost} kr</p>
            </div>
          </div>
        </div>

        {/* Recipes in this plan */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 print:hidden">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recept i denna plan</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/meal-plan/${id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-bold">
                  {recipe.day_number}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{recipe.recipe_data.name}</p>
                  <p className="text-sm text-gray-500">Dag {recipe.day_number}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Redo för nästa vecka?
            </h2>
            <p className="text-green-100 mb-6 max-w-xl mx-auto">
              Skapa en ny veckomeny baserad på veckans färska erbjudanden
            </p>
            <Link
              href="/meal-planner"
              className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
            >
              Skapa ny veckomeny →
            </Link>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function formatAmount(amount) {
  if (amount < 10) return amount.toFixed(1)
  if (amount < 100) return Math.round(amount)
  return Math.round(amount / 10) * 10
}

function generateTextList(shoppingList, sortedCategories, groupedItems) {
  let text = 'INKÖPSLISTA - Matvecka\n'
  text += '═'.repeat(40) + '\n\n'

  sortedCategories.forEach(category => {
    text += `■ ${category.toUpperCase()}\n`
    text += '─'.repeat(40) + '\n'

    groupedItems[category].forEach(item => {
      text += `☐ ${item.name} - ${formatAmount(item.totalAmount)} ${item.unit}\n`
    })
    text += '\n'
  })

  return text
}

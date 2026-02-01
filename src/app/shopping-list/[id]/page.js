'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ShoppingListPage() {
  const params = useParams()
  const id = params.id

  const [mealPlan, setMealPlan] = useState(null)
  const [shoppingList, setShoppingList] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all data from API
        const response = await fetch(`/api/shopping-list/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load shopping list')
        }

        setMealPlan(data.mealPlan)
        setShoppingList(data.shoppingList)
        setRecipes(data.recipes)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">...</div>
          <p className="text-gray-600">Laddar inköpslista...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800">Fel: {error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden when printing */}
      <header className="bg-white border-b print:hidden">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            Matvecka
          </Link>
          <nav className="flex gap-6">
            <Link href="/meal-planner" className="text-gray-600 hover:text-green-600">
              Ny Matplan
            </Link>
            <Link href="/my-plans" className="text-gray-600 hover:text-green-600">
              Mina Planer
            </Link>
            <Link href="/products" className="text-gray-600 hover:text-green-600">
              Erbjudanden
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 print:py-0">
        <div className="max-w-4xl mx-auto">
          {/* Back Button - Hidden when printing */}
          <Link
            href={`/meal-plan/${id}`}
            className="text-green-600 hover:text-green-700 mb-4 inline-flex items-center gap-2 print:hidden"
          >
            ← Tillbaka till matplan
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Inköpslista</h1>
            <p className="text-gray-600">
              {mealPlan?.name} • Vecka {mealPlan?.week_start_date && new Date(mealPlan.week_start_date).toLocaleDateString('sv-SE')}
            </p>
          </div>

          {/* Summary Cards - Hidden when printing */}
          <div className="grid md:grid-cols-3 gap-4 mb-8 print:hidden">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {shoppingList.length}
              </div>
              <div className="text-gray-600 text-sm">Produkter</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {recipes.length}
              </div>
              <div className="text-gray-600 text-sm">Recept</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {mealPlan?.total_cost} kr
              </div>
              <div className="text-gray-600 text-sm">Total kostnad</div>
            </div>
          </div>

          {/* Action Buttons - Hidden when printing */}
          <div className="flex gap-4 mb-8 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              Skriv ut
            </button>
            <button
              onClick={() => {
                const text = generateTextList(shoppingList, sortedCategories, groupedItems)
                navigator.clipboard.writeText(text)
                alert('Inköpslista kopierad!')
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2"
            >
              Kopiera lista
            </button>
            <Link
              href="/my-plans"
              className="px-6 py-3 text-green-600 hover:text-green-700 font-medium border border-green-600 rounded-lg"
            >
              Mina Planer
            </Link>
          </div>

          {/* Shopping List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none">
            <div className="p-6 border-b print:border-b-2 print:border-black">
              <h2 className="text-2xl font-bold">Inköpslista</h2>
              <p className="text-gray-600 text-sm mt-1">
                {new Date().toLocaleDateString('sv-SE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="divide-y print:divide-y-2 print:divide-gray-300">
              {sortedCategories.map(category => (
                <div key={category} className="p-6 print:p-4 print:break-inside-avoid">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {groupedItems[category].map((item, index) => (
                      <ShoppingItem key={index} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t print:bg-white">
              <div className="flex justify-between items-center">
                <div className="text-gray-600">
                  Totalt antal produkter: <strong>{shoppingList.length}</strong>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  Total kostnad: {mealPlan?.total_cost} kr
                </div>
              </div>
            </div>
          </div>

          {/* Recipes Used - Hidden when printing */}
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 print:hidden">
            <h3 className="text-xl font-semibold mb-4">Recept i denna plan</h3>
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center gap-3 text-gray-700">
                  <span className="text-green-600 font-medium">Dag {recipe.day_number}:</span>
                  <span>{recipe.recipe_data.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 2cm;
            size: A4;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:border-b-2 {
            border-bottom-width: 2px !important;
          }
          .print\\:border-black {
            border-color: black !important;
          }
          .print\\:divide-y-2 > * + * {
            border-top-width: 2px !important;
          }
          .print\\:divide-gray-300 > * + * {
            border-color: #d1d5db !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  )
}

function ShoppingItem({ item }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors print:hover:bg-white">
      <input
        type="checkbox"
        className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 print:hidden"
      />
      <div className="flex-1 print:ml-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-gray-900">
            {item.name}
          </span>
          <span className="text-gray-600">
            {formatAmount(item.totalAmount)} {item.unit}
          </span>
        </div>
        {item.usedInDays && item.usedInDays.length > 0 && (
          <div className="text-xs text-gray-500 mt-1 print:hidden">
            Används dag: {item.usedInDays.join(', ')}
          </div>
        )}
      </div>
    </label>
  )
}

function formatAmount(amount) {
  if (amount < 10) return amount.toFixed(1)
  if (amount < 100) return Math.round(amount)
  return Math.round(amount / 10) * 10
}

function getCategoryIcon(category) {
  const icons = {
    'Kött': '🥩',
    'Fisk': '🐟',
    'Grönsaker': '🥬',
    'Frukt': '🍎',
    'Mejeri': '🥛',
    'Spannmål': '🌾',
    'Dryck': '🥤',
    'Övrigt': '📦'
  }
  return icons[category] || '📦'
}

function generateTextList(shoppingList, sortedCategories, groupedItems) {
  let text = 'INKÖPSLISTA - Matvecka\n'
  text += '═'.repeat(40) + '\n\n'

  sortedCategories.forEach(category => {
    text += `${getCategoryIcon(category)} ${category.toUpperCase()}\n`
    text += '─'.repeat(40) + '\n'

    groupedItems[category].forEach(item => {
      text += `☐ ${item.name} - ${formatAmount(item.totalAmount)} ${item.unit}\n`
    })
    text += '\n'
  })

  return text
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import ProductsNav from '@/components/ProductsNav'
import { useShoppingList } from '@/contexts/ShoppingListContext'

const stores = ['Alla', 'ICA', 'Coop', 'Willys']

const storeColors = {
  'ICA': 'bg-red-500',
  'Coop': 'bg-green-600',
  'City Gross': 'bg-blue-600',
  'Willys': 'bg-orange-500',
  'Hemköp': 'bg-red-600',
}

export default function FlyersPage() {
  const supabase = createClient()
  const [flyers, setFlyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState('Alla')
  const [selectedFlyer, setSelectedFlyer] = useState(null)

  // Load flyers from database
  useEffect(() => {
    async function loadFlyers() {
      setLoading(true)
      const { data, error } = await supabase
        .from('flyers')
        .select(`
          *,
          pages:flyer_pages(
            *,
            hotspots:flyer_hotspots(
              *,
              product:products(*)
            )
          )
        `)
        .in('status', ['completed', 'ready'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading flyers:', error)
      }

      // Show flyers that have a PDF or at least one page with an image
      const flyersWithContent = (data || []).filter(f =>
        f.pdf_url || f.pages?.some(p => p.image_url && !p.image_url.includes('.pdf'))
      )

      setFlyers(flyersWithContent)
      setLoading(false)
    }
    loadFlyers()
  }, [supabase])

  const filteredFlyers = selectedStore === 'Alla'
    ? flyers
    : flyers.filter(f => f.store === selectedStore)

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <ProductsNav />

      <div className="container mx-auto px-4 py-8">
        {/* Store Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {stores.map((store) => (
            <button
              key={store}
              onClick={() => setSelectedStore(store)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedStore === store
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {store}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                <div className="aspect-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Flyers Grid */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFlyers.map((flyer) => (
              <FlyerCard
                key={flyer.id}
                flyer={flyer}
                onSelect={() => setSelectedFlyer(flyer)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {!loading && filteredFlyers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">Inga reklamblad hittades</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Ladda upp reklamblad i admin-panelen</p>
          </div>
        )}

        {/* CTA Section */}
        {!loading && filteredFlyers.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Vill du spara ännu mer?
              </h2>
              <p className="text-green-100 mb-6 max-w-xl mx-auto">
                Skapa en veckomeny baserad på veckans bästa erbjudanden
              </p>
              <Link
                href="/meal-planner"
                className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
              >
                Skapa veckomeny gratis →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Flyer Viewer Modal */}
      {selectedFlyer && (
        <InteractiveFlyerViewer
          flyer={selectedFlyer}
          onClose={() => setSelectedFlyer(null)}
        />
      )}
    </div>
  )
}

function FlyerCard({ flyer, onSelect, formatDate }) {
  const firstPage = flyer.pages?.sort((a, b) => a.page_number - b.page_number)[0]
  const productCount = flyer.pages?.reduce(
    (sum, page) => sum + (page.hotspots?.length || 0),
    0
  ) || 0
  const hasPdf = !!flyer.pdf_url

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 overflow-hidden group cursor-pointer"
      onClick={onSelect}
    >
      {/* Flyer Preview */}
      <div className="aspect-3/4 relative bg-gray-100 dark:bg-gray-700">
        {hasPdf ? (
          // Show original PDF as preview using browser's native rendering
          <object
            data={`${flyer.pdf_url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            type="application/pdf"
            className="w-full h-full pointer-events-none"
          >
            {/* Fallback if object doesn't render */}
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700">
              <span className="text-4xl text-gray-400 dark:text-gray-500">{flyer.store?.[0]}</span>
            </div>
          </object>
        ) : firstPage?.image_url ? (
          <img
            src={firstPage.image_url}
            alt={flyer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <span className="text-4xl">{flyer.store?.[0]}</span>
          </div>
        )}

        {/* Store badge */}
        <div className={`absolute top-3 left-3 ${storeColors[flyer.store] || 'bg-gray-500'} text-white text-sm font-semibold px-3 py-1 rounded-full shadow`}>
          {flyer.store}
        </div>

        {/* Product count badge */}
        {productCount > 0 && (
          <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
            {productCount} produkter
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="px-5 py-2.5 bg-white rounded-lg text-sm font-semibold shadow-lg text-gray-900">
            Öppna reklamblad
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{flyer.name}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{flyer.page_count || flyer.pages?.length} s</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(flyer.valid_from)} – {formatDate(flyer.valid_to)}
        </p>
      </div>
    </div>
  )
}

function InteractiveFlyerViewer({ flyer, onClose }) {
  const { addItem, isInList, getQuantity, items, updateQuantity } = useShoppingList()
  const [currentPage, setCurrentPage] = useState(0)

  const pages = flyer.pages?.sort((a, b) => a.page_number - b.page_number) || []
  const currentPageData = pages[currentPage]

  // Get products for current page from hotspots
  const products = currentPageData?.hotspots
    ?.map(h => h.product)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'sv')) || []

  // Get total product count across all pages
  const totalProducts = pages.reduce(
    (sum, p) => sum + (p.hotspots?.filter(h => h.product)?.length || 0),
    0
  )

  const goToPage = useCallback((index) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPage(index)
    }
  }, [pages.length])

  const handleAddToList = (product) => {
    if (product) {
      addItem(product)
    }
  }

  const handleIncrement = (product, e) => {
    e.stopPropagation()
    addItem(product, 1)
  }

  const handleDecrement = (product, e) => {
    e.stopPropagation()
    const item = items.find(i => i.productId === product.id)
    if (item) {
      updateQuantity(item.id, item.quantity - 1)
    }
  }

  // Always show products for current selected page
  const displayProducts = products

  // Group products by category
  const productsByCategory = displayProducts.reduce((acc, product) => {
    const category = product.category || 'Övrigt'
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {})

  const categoryOrder = ['Kött', 'Fisk', 'Mejeri', 'Grönsaker', 'Frukt', 'Fryst', 'Skafferi', 'Bröd', 'Dryck', 'Snacks', 'Hygien', 'Övrigt']
  const sortedCategories = Object.keys(productsByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${storeColors[flyer.store] || 'bg-gray-500'}`} />
          <h2 className="font-semibold text-gray-900 dark:text-white">{flyer.name}</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {pages.length} sidor
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Content - Flyer + Product List */}
      <div className="flex-1 overflow-hidden flex">
        {/* Flyer Page Image */}
        <div className="flex-1 bg-gray-900 overflow-hidden flex items-center justify-center p-4">
          {currentPageData?.image_url ? (
            <img
              src={currentPageData.image_url}
              alt={`${flyer.name} - Sida ${currentPage + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-gray-400 dark:text-gray-500 text-center">
              <p>Ingen bild tillgänglig för sida {currentPage + 1}</p>
              <p className="text-sm mt-1">Sidan kan behöva konverteras på nytt</p>
            </div>
          )}
        </div>

        {/* Product Sidebar */}
        <div className="w-80 lg:w-96 bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Produkter på sida {currentPage + 1}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {products.length} erbjudanden • {totalProducts} totalt
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {displayProducts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Inga produkter på denna sida</p>
                <p className="text-sm mt-1">Prova en annan sida</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {sortedCategories.map(category => (
                  <div key={category}>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {category}
                      </span>
                    </div>
                    {productsByCategory[category].map(product => {
                      const inList = isInList(product.id)
                      const quantity = getQuantity(product.id)
                      return (
                        <div
                          key={product.id}
                          className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                            inList ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {product.name}
                            </p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-lg font-bold text-green-600 dark:text-green-500">
                                {product.price} kr
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                /{product.unit || 'st'}
                              </span>
                              {product.original_price && product.original_price > product.price && (
                                <>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                    {product.original_price} kr
                                  </span>
                                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                    -{Math.round((1 - product.price / product.original_price) * 100)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quantity controls */}
                          {inList ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleDecrement(product, e)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">
                                {quantity}
                              </span>
                              <button
                                onClick={(e) => handleIncrement(product, e)}
                                className="w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToList(product)}
                              className="shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-500 flex items-center justify-center transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Navigation - Click dots to select page and sync product sidebar */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-3 flex items-center justify-center gap-4 shrink-0">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-1.5 items-center">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentPage
                  ? 'w-6 bg-green-600'
                  : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              title={`Sida ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === pages.length - 1}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

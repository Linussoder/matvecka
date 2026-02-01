'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import ProductsNav from '@/components/ProductsNav'
import { useShoppingList } from '@/contexts/ShoppingListContext'

const stores = ['Alla', 'ICA', 'Coop', 'City Gross', 'Willys', 'Lidl']

const storeColors = {
  'ICA': 'bg-red-500',
  'Coop': 'bg-green-600',
  'City Gross': 'bg-blue-600',
  'Willys': 'bg-orange-500',
  'Lidl': 'bg-yellow-500',
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

      // Only show flyers that have at least one page with an image
      const flyersWithPages = (data || []).filter(f =>
        f.pages?.some(p => p.image_url && !p.image_url.includes('.pdf'))
      )

      setFlyers(flyersWithPages)
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
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
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
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
            <p className="text-gray-500">Inga reklamblad hittades</p>
            <p className="text-sm text-gray-400 mt-1">Ladda upp reklamblad i admin-panelen</p>
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
                Skapa en matplan baserad på veckans bästa erbjudanden
              </p>
              <Link
                href="/meal-planner"
                className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
              >
                Skapa matplan gratis →
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

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden group cursor-pointer"
      onClick={onSelect}
    >
      {/* Flyer Preview */}
      <div className="aspect-[3/4] relative bg-gray-100">
        {firstPage?.image_url ? (
          <img
            src={firstPage.image_url}
            alt={flyer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
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
          <h3 className="font-semibold text-gray-900 text-sm truncate">{flyer.name}</h3>
          <span className="text-xs text-gray-400">{flyer.page_count || flyer.pages?.length} s</span>
        </div>
        <p className="text-xs text-gray-500">
          {formatDate(flyer.valid_from)} – {formatDate(flyer.valid_to)}
        </p>
      </div>
    </div>
  )
}

function InteractiveFlyerViewer({ flyer, onClose }) {
  const { addItem, isInList } = useShoppingList()
  const [currentPage, setCurrentPage] = useState(0)
  const [hoveredHotspot, setHoveredHotspot] = useState(null)

  const pages = flyer.pages?.sort((a, b) => a.page_number - b.page_number) || []
  const currentPageData = pages[currentPage]
  const hotspots = currentPageData?.hotspots || []

  const goToPage = (index) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPage(index)
      setHoveredHotspot(null)
    }
  }

  const handleAddToList = (product) => {
    if (product) {
      addItem(product)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${storeColors[flyer.store] || 'bg-gray-500'}`} />
          <h2 className="font-semibold text-gray-900">{flyer.name}</h2>
          <span className="text-sm text-gray-500">
            Sida {currentPage + 1} av {pages.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Klicka på produkter för att lägga till i inköpslistan
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Flyer Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        <div className="relative max-h-full max-w-full">
          {currentPageData?.image_url && (
            <img
              src={currentPageData.image_url}
              alt={`${flyer.name} - Sida ${currentPage + 1}`}
              className="max-h-[calc(100vh-180px)] max-w-full object-contain"
              style={{ display: 'block' }}
            />
          )}

          {/* Hotspots overlay - positioned relative to the image */}
          <div className="absolute inset-0">
            {hotspots.map((hotspot) => {
              const product = hotspot.product
              if (!product) return null

              const inList = isInList(product.id)

              return (
                <div
                  key={hotspot.id}
                  className="absolute cursor-pointer transition-all"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`,
                  }}
                  onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                  onMouseLeave={() => setHoveredHotspot(null)}
                  onClick={() => handleAddToList(product)}
                >
                  {/* Hotspot highlight */}
                  <div className={`absolute inset-0 border-2 rounded transition-all ${
                    hoveredHotspot === hotspot.id
                      ? 'border-green-500 bg-green-500/30'
                      : inList
                      ? 'border-green-400 bg-green-400/20'
                      : 'border-transparent hover:border-green-400/50 hover:bg-green-400/10'
                  }`} />

                  {/* Added badge */}
                  {inList && hoveredHotspot !== hotspot.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shadow">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Product tooltip */}
                  {hoveredHotspot === hotspot.id && (
                    <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 pointer-events-none">
                      <div className="bg-white rounded-lg shadow-xl border p-3">
                        <p className="font-medium text-gray-900 text-sm leading-tight">
                          {product.name}
                        </p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-bold text-green-600">
                            {product.price} kr
                          </span>
                          <span className="text-sm text-gray-400">
                            /{product.unit || 'st'}
                          </span>
                        </div>
                        {product.original_price && product.original_price > product.price && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-400 line-through">
                              {product.original_price} kr
                            </span>
                            <span className="text-sm font-medium text-red-600">
                              -{Math.round((1 - product.price / product.original_price) * 100)}%
                            </span>
                          </div>
                        )}
                        <div className={`mt-2 py-1.5 text-center text-sm font-medium rounded ${
                          inList
                            ? 'bg-green-100 text-green-700'
                            : 'bg-green-600 text-white'
                        }`}>
                          {inList ? '✓ I inköpslistan' : 'Klicka för att lägga till'}
                        </div>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                        <div className="w-3 h-3 bg-white border-r border-b transform rotate-45 shadow" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="bg-white border-t px-4 py-3 flex items-center justify-center gap-4 shrink-0">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page dots */}
        <div className="flex gap-1.5">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentPage
                  ? 'w-6 bg-green-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === pages.length - 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

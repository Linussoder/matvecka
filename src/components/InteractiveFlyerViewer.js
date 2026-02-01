'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useShoppingList } from '@/contexts/ShoppingListContext'
import Image from 'next/image'

export default function InteractiveFlyerViewer({ flyerId }) {
  const supabase = createClient()
  const { addItem, isInList } = useShoppingList()

  const [flyer, setFlyer] = useState(null)
  const [pages, setPages] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hotspots, setHotspots] = useState([])
  const [hoveredHotspot, setHoveredHotspot] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load flyer data
  useEffect(() => {
    if (!flyerId) return

    async function loadFlyer() {
      setLoading(true)
      try {
        // Fetch flyer with pages
        const { data: flyerData } = await supabase
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
          .eq('id', flyerId)
          .single()

        if (flyerData) {
          setFlyer(flyerData)
          // Sort pages by page_number
          const sortedPages = (flyerData.pages || []).sort(
            (a, b) => a.page_number - b.page_number
          )
          setPages(sortedPages)

          // Set hotspots for current page
          if (sortedPages.length > 0) {
            setHotspots(sortedPages[0].hotspots || [])
          }
        }
      } catch (error) {
        console.error('Error loading flyer:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFlyer()
  }, [flyerId, supabase])

  // Update hotspots when page changes
  useEffect(() => {
    if (pages[currentPage]) {
      setHotspots(pages[currentPage].hotspots || [])
    }
  }, [currentPage, pages])

  const goToPage = (pageIndex) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPage(pageIndex)
      setHoveredHotspot(null)
    }
  }

  const handleAddToList = (product) => {
    addItem(product)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Laddar reklamblad...</p>
        </div>
      </div>
    )
  }

  if (!flyer || pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
        <p className="text-gray-500">Inga sidor att visa</p>
      </div>
    )
  }

  const currentPageData = pages[currentPage]

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${
            flyer.store === 'ICA' ? 'bg-red-500' :
            flyer.store === 'Coop' ? 'bg-green-500' :
            flyer.store === 'City Gross' ? 'bg-blue-500' :
            flyer.store === 'Willys' ? 'bg-orange-500' :
            'bg-gray-500'
          }`} />
          <h2 className="font-semibold text-gray-900">{flyer.name}</h2>
        </div>
        <span className="text-sm text-gray-500">
          Sida {currentPage + 1} av {pages.length}
        </span>
      </div>

      {/* Flyer Image with Hotspots */}
      <div className="relative bg-gray-100">
        <div className="relative aspect-[3/4] max-h-[70vh] mx-auto">
          {currentPageData?.image_url && (
            <Image
              src={currentPageData.image_url}
              alt={`${flyer.name} - Sida ${currentPage + 1}`}
              fill
              className="object-contain"
              unoptimized
            />
          )}

          {/* Hotspots overlay */}
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
                <div className={`absolute inset-0 border-2 rounded-md transition-all ${
                  hoveredHotspot === hotspot.id
                    ? 'border-green-500 bg-green-500/20'
                    : inList
                    ? 'border-green-400/50 bg-green-400/10'
                    : 'border-transparent hover:border-green-400/30'
                }`} />

                {/* Product tooltip */}
                {hoveredHotspot === hotspot.id && (
                  <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48">
                    <div className="bg-white rounded-lg shadow-xl border p-3">
                      <p className="font-medium text-gray-900 text-sm leading-tight">
                        {product.name}
                      </p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold text-green-600">
                          {product.price} kr
                        </span>
                        <span className="text-xs text-gray-400">
                          /{product.unit || 'st'}
                        </span>
                      </div>
                      {product.original_price && product.original_price > product.price && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 line-through">
                            {product.original_price} kr
                          </span>
                          <span className="text-xs font-medium text-red-600">
                            -{Math.round((1 - product.price / product.original_price) * 100)}%
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToList(product)
                        }}
                        className={`w-full mt-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          inList
                            ? 'bg-green-100 text-green-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {inList ? 'I inköpslistan' : 'Lägg till'}
                      </button>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                      <div className="w-3 h-3 bg-white border-r border-b transform rotate-45" />
                    </div>
                  </div>
                )}

                {/* Add indicator badge */}
                {inList && hoveredHotspot !== hotspot.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Page Navigation */}
      <div className="bg-gray-50 border-t px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          {/* Previous button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page indicators */}
          <div className="flex gap-1.5">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentPage
                    ? 'bg-green-600 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pages.length - 1}
            className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Products count */}
        <p className="text-center text-xs text-gray-500 mt-2">
          {hotspots.length} produkter på denna sida
        </p>
      </div>
    </div>
  )
}

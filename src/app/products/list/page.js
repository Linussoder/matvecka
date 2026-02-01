'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import Link from 'next/link'
import ProductsNav from '@/components/ProductsNav'
import AddToListButton from '@/components/AddToListButton'

// Categories
const categories = [
  { id: 'kött', name: 'Kött & Fågel' },
  { id: 'fisk', name: 'Fisk & Skaldjur' },
  { id: 'grönsaker', name: 'Grönsaker' },
  { id: 'frukt', name: 'Frukt & Bär' },
  { id: 'mejeri', name: 'Mejeri & Ägg' },
  { id: 'bröd', name: 'Bröd & Bageri' },
  { id: 'skafferi', name: 'Skafferi' },
  { id: 'fryst', name: 'Fryst' },
  { id: 'dryck', name: 'Dryck' },
  { id: 'snacks', name: 'Snacks & Godis' },
]

const categoryImages = {
  'kött': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'fisk': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
  'grönsaker': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
  'frukt': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80',
  'mejeri': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80',
  'bröd': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  'skafferi': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
  'fryst': 'https://images.unsplash.com/photo-1594997756045-f188d785cf65?w=400&q=80',
  'dryck': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
  'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&q=80'
}

export default function ProductsListPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [sortBy, setSortBy] = useState('price-asc')

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const supabase = createClient()

        const { data: productsData, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .order('price', { ascending: true })
          .limit(200)

        if (fetchError) throw fetchError

        setProducts(productsData || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory) {
      result = result.filter(p =>
        p.category?.toLowerCase() === selectedCategory
      )
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'sv'))
        break
    }

    return result
  }, [products, searchQuery, selectedCategory, sortBy])

  const hasActiveFilters = searchQuery || selectedCategory

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50">
      {/* Shared Navigation */}
      <ProductsNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:sticky lg:top-32">
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Sök</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök produkt..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Sortera</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="price-asc">Pris: Lägst först</option>
                  <option value="price-desc">Pris: Högst först</option>
                  <option value="name">Namn A–Ö</option>
                </select>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Kategorier</label>
                <nav className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedCategory
                        ? 'bg-green-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Alla kategorier
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter(p =>
                      p.category?.toLowerCase() === cat.id
                    ).length
                    if (count === 0) return null
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between ${
                          selectedCategory === cat.id
                            ? 'bg-green-600 text-white font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className={selectedCategory === cat.id ? 'text-green-200' : 'text-gray-400'}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                  className="w-full mt-4 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Rensa filter
                </button>
              )}
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Results info */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredProducts.length}</span> produkter
                {selectedCategory && ` i ${categories.find(c => c.id === selectedCategory)?.name}`}
              </p>

              {hasActiveFilters && (
                <div className="flex gap-2">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="hover:text-green-900">×</button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {categories.find(c => c.id === selectedCategory)?.name}
                      <button onClick={() => setSelectedCategory(null)} className="hover:text-green-900">×</button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse shadow-sm">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-100 rounded mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500">Ett fel uppstod: {error}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <p className="text-xl font-semibold text-gray-900 mb-2">Inga produkter hittades</p>
                <p className="text-gray-500 mb-4">Prova att ändra dina filter</p>
                <button
                  onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Visa alla produkter
                </button>
              </div>
            )}

            {/* Products */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* CTA Section */}
            {!loading && filteredProducts.length > 0 && (
              <div className="mt-16 bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
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
          </main>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product }) {
  const imageUrl = product.image_url || categoryImages[product.category?.toLowerCase()] || categoryImages.default

  return (
    <div className="group flex flex-col h-full">
      <div className="relative aspect-square bg-gray-50 rounded-md overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />

        {/* Store badge */}
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 bg-white/90 text-xs font-medium text-gray-700 rounded">
            {product.store || 'ICA'}
          </span>
        </div>

        {/* Add to list button - shows on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <AddToListButton product={product} variant="icon" />
        </div>

        {/* Discount badge */}
        {product.original_price && product.original_price > product.price && (
          <div className="absolute bottom-2 left-2">
            <span className="px-1.5 py-0.5 bg-red-600 text-xs font-medium text-white rounded">
              -{Math.round((1 - product.price / product.original_price) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 pt-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          {product.category || 'Övrigt'}
        </p>
        <h3 className="text-sm text-gray-900 font-medium leading-tight line-clamp-2 h-10 mt-0.5">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-gray-900">
              {product.price} kr
            </span>
            <span className="text-sm text-gray-400">
              /{product.unit || 'st'}
            </span>
          </div>
          <AddToListButton product={product} variant="small" />
        </div>
      </div>
    </div>
  )
}

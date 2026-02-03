'use client'

import { useState, useEffect } from 'react'
import { CurrencyDollarIcon, FireIcon } from '@/components/admin/Icons'

const storeColors = {
  'ICA': 'bg-red-500',
  'Coop': 'bg-green-600',
  'Willys': 'bg-red-600',
  'Hemköp': 'bg-green-500',
  'Lidl': 'bg-blue-600',
  'City Gross': 'bg-orange-500'
}

export default function PricesPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState('all')
  const [sortBy, setSortBy] = useState('savings')
  const [deals, setDeals] = useState([])

  useEffect(() => {
    loadProducts()
    loadTopDeals()
  }, [])

  async function loadProducts() {
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      if (data.success) {
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTopDeals() {
    try {
      const res = await fetch('/api/admin/prices/top-deals')
      const data = await res.json()
      if (data.success) {
        setDeals(data.deals || [])
      }
    } catch (error) {
      console.error('Failed to load deals:', error)
    }
  }

  // Group products by name for comparison
  const groupedProducts = products.reduce((acc, product) => {
    const key = product.name?.toLowerCase().trim()
    if (!key) return acc
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(product)
    return acc
  }, {})

  // Find products with multiple store prices for comparison
  const comparableProducts = Object.entries(groupedProducts)
    .filter(([_, items]) => items.length > 1)
    .map(([name, items]) => {
      const prices = items.map(i => i.price).filter(Boolean)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const savings = maxPrice - minPrice
      const savingsPercent = ((savings / maxPrice) * 100).toFixed(0)
      return {
        name: items[0].name,
        stores: items,
        minPrice,
        maxPrice,
        savings,
        savingsPercent,
        bestStore: items.find(i => i.price === minPrice)?.store
      }
    })
    .sort((a, b) => sortBy === 'savings' ? b.savings - a.savings : b.savingsPercent - a.savingsPercent)

  const filteredProducts = comparableProducts.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedStore !== 'all' && !p.stores.some(s => s.store === selectedStore)) return false
    return true
  })

  const stores = [...new Set(products.map(p => p.store).filter(Boolean))]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <CurrencyDollarIcon className="w-6 h-6 text-white" />
          </div>
          Price Intelligence
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Jämför priser mellan butiker och hitta bästa erbjudanden
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt produkter</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Jämförbara</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{comparableProducts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Butiker</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stores.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Största prisdiffer</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-500">
            {comparableProducts.length > 0 ? `${Math.max(...comparableProducts.map(p => p.savings))} kr` : '-'}
          </p>
        </div>
      </div>

      {/* Top Deals of the Week */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FireIcon className="w-5 h-5" />
          Veckans bästa deals
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {(deals.length > 0 ? deals : comparableProducts.slice(0, 5)).map((deal, i) => (
            <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-white font-medium truncate">{deal.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-white">{deal.minPrice} kr</span>
                <span className="text-green-200 text-sm line-through">{deal.maxPrice} kr</span>
              </div>
              <p className="text-green-200 text-sm mt-1">Spara {deal.savings} kr hos {deal.bestStore}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök produkt..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Alla butiker</option>
          {stores.map(store => (
            <option key={store} value={store}>{store}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="savings">Högst besparing (kr)</option>
          <option value="percent">Högst besparing (%)</option>
        </select>
      </div>

      {/* Price Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Prisjämförelse</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
              <CurrencyDollarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Inga jämförbara produkter hittades</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Produkt</th>
                  {stores.map(store => (
                    <th key={store} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {store}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Besparing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.slice(0, 50).map((product, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    </td>
                    {stores.map(store => {
                      const storeProduct = product.stores.find(s => s.store === store)
                      const isBest = storeProduct?.price === product.minPrice
                      return (
                        <td key={store} className="px-4 py-4 text-center">
                          {storeProduct ? (
                            <span className={`font-semibold ${isBest ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}`}>
                              {storeProduct.price} kr
                              {isBest && <span className="ml-1">✓</span>}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                        {product.savings} kr ({product.savingsPercent}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Store Price Overview */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        {stores.map(store => {
          const storeProducts = products.filter(p => p.store === store)
          const avgPrice = storeProducts.length > 0
            ? (storeProducts.reduce((sum, p) => sum + (p.price || 0), 0) / storeProducts.length).toFixed(0)
            : 0
          const cheapestCount = comparableProducts.filter(p => p.bestStore === store).length

          return (
            <div key={store} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-4 h-4 rounded-full ${storeColors[store] || 'bg-gray-500'}`}></span>
                <h3 className="font-semibold text-gray-900 dark:text-white">{store}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Produkter</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{storeProducts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Snittpris</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{avgPrice} kr</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Billigast på</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-500">{cheapestCount} produkter</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

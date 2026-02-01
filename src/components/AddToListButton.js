'use client'

import { useShoppingList } from '@/contexts/ShoppingListContext'

export default function AddToListButton({ product, variant = 'icon' }) {
  const { addItem, isInList, getQuantity, updateQuantity } = useShoppingList()
  const inList = isInList(product.id)
  const quantity = getQuantity(product.id)

  const handleAdd = (e) => {
    e.stopPropagation()
    addItem(product)
  }

  const handleIncrement = (e) => {
    e.stopPropagation()
    if (inList) {
      // Find the item to get its id (not productId)
      updateQuantity(`${product.id}-`, quantity + 1)
    } else {
      addItem(product)
    }
  }

  const handleDecrement = (e) => {
    e.stopPropagation()
    if (quantity > 0) {
      updateQuantity(`${product.id}-`, quantity - 1)
    }
  }

  // Icon variant - simple add button
  if (variant === 'icon') {
    return (
      <button
        onClick={handleAdd}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          inList
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-white text-gray-600 shadow-md hover:bg-green-600 hover:text-white'
        }`}
      >
        {inList ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    )
  }

  // Full variant - with quantity controls
  if (variant === 'full') {
    if (!inList) {
      return (
        <button
          onClick={handleAdd}
          className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Lägg till
        </button>
      )
    }

    return (
      <div className="flex items-center justify-between bg-green-50 rounded-lg p-1">
        <button
          onClick={handleDecrement}
          className="w-8 h-8 rounded-md bg-white text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
        >
          −
        </button>
        <span className="text-sm font-semibold text-green-700">{quantity} st</span>
        <button
          onClick={handleIncrement}
          className="w-8 h-8 rounded-md bg-white text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
        >
          +
        </button>
      </div>
    )
  }

  // Small variant - compact button
  if (variant === 'small') {
    return (
      <button
        onClick={handleAdd}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
          inList
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-green-600 hover:text-white'
        }`}
      >
        {inList ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    )
  }

  return null
}

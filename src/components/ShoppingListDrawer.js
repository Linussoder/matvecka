'use client'

import { useEffect, useRef } from 'react'
import { useShoppingList } from '@/contexts/ShoppingListContext'
import Link from 'next/link'

export default function ShoppingListDrawer() {
  const {
    items,
    itemCount,
    totalPrice,
    isOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    toggleChecked,
    clearChecked
  } = useShoppingList()

  const drawerRef = useRef(null)

  // Close on escape
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') closeDrawer()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeDrawer])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        closeDrawer()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, closeDrawer])

  if (!isOpen) return null

  const uncheckedItems = items.filter(item => !item.checked)
  const checkedItems = items.filter(item => item.checked)

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slideIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Inköpslista</h2>
            <p className="text-sm text-gray-500">{itemCount} varor</p>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-1">Din lista är tom</p>
              <p className="text-gray-500 text-sm mb-4">Lägg till produkter från erbjudanden</p>
              <Link
                href="/products/list"
                onClick={closeDrawer}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Bläddra erbjudanden
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Unchecked items */}
              {uncheckedItems.length > 0 && (
                <div className="space-y-2">
                  {uncheckedItems.map(item => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                      onToggle={() => toggleChecked(item.id)}
                      onRemove={() => removeItem(item.id)}
                      onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                    />
                  ))}
                </div>
              )}

              {/* Checked items */}
              {checkedItems.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-500">Avbockade ({checkedItems.length})</p>
                    <button
                      onClick={clearChecked}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Ta bort alla
                    </button>
                  </div>
                  <div className="space-y-2 opacity-60">
                    {checkedItems.map(item => (
                      <ShoppingListItem
                        key={item.id}
                        item={item}
                        onToggle={() => toggleChecked(item.id)}
                        onRemove={() => removeItem(item.id)}
                        onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Uppskattad kostnad</span>
              <span className="text-xl font-bold text-gray-900">{totalPrice.toFixed(0)} kr</span>
            </div>
            <Link
              href="/shopping-list"
              onClick={closeDrawer}
              className="block w-full py-3 bg-green-600 text-white text-center font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Visa fullständig lista
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

function ShoppingListItem({ item, onToggle, onRemove, onUpdateQuantity }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          item.checked
            ? 'bg-green-600 border-green-600'
            : 'border-gray-300 hover:border-green-600'
        }`}
      >
        {item.checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{item.store}</span>
          <span>•</span>
          <span>{item.price} kr/{item.unit}</span>
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(item.quantity - 1)}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
        >
          -
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
        >
          +
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

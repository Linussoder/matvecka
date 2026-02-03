'use client'

import { useState } from 'react'
import { useShoppingList } from '@/contexts/ShoppingListContext'

export default function FloatingCart() {
  const {
    items,
    isOpen,
    setIsOpen,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    toggleChecked,
    clearList,
    clearChecked,
    checkedCount
  } = useShoppingList()

  const [showCopied, setShowCopied] = useState(false)

  if (totalItems === 0 && !isOpen) return null

  const handleShare = async () => {
    const listText = items
      .map(item => {
        if (item.source === 'recipe') {
          const amount = item.amount ? `${item.amount} ${item.unit || ''}`.trim() : ''
          return `${item.checked ? '✓' : '○'} ${item.name}${amount ? ` (${amount})` : ''}`
        }
        return `${item.checked ? '✓' : '○'} ${item.name} (${item.quantity}st) - ${item.price * item.quantity} kr`
      })
      .join('\n')

    const fullText = `Min inköpslista från Matvecka:\n\n${listText}${totalPrice > 0 ? `\n\nTotalt: ${totalPrice.toFixed(0)} kr` : ''}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Min inköpslista', text: fullText })
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(fullText)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-medium">{totalItems} varor</span>
          <span className="text-gray-400">•</span>
          <span>{totalPrice.toFixed(0)} kr</span>
        </button>
      )}

      {/* Slide-out Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Inköpslista</h2>
                <p className="text-sm text-gray-500">{totalItems} varor • {totalPrice.toFixed(0)} kr</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>Din lista är tom</p>
                  <p className="text-sm mt-1">Klicka på produkter för att lägga till dem</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        item.checked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleChecked(item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          item.checked
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {item.checked && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${item.checked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.source === 'recipe' ? (
                            <>
                              {item.amount && `${item.amount} `}{item.unit}
                              {item.recipeName && <span className="text-green-600 ml-1">({item.recipeName})</span>}
                            </>
                          ) : (
                            <>{item.price} kr/{item.unit || 'st'}</>
                          )}
                        </p>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      {item.source !== 'recipe' && (
                        <div className="text-right w-16">
                          <p className="text-sm font-medium text-gray-900">
                            {(item.price * item.quantity).toFixed(0)} kr
                          </p>
                        </div>
                      )}

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-4 space-y-3">
                {/* Total */}
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-gray-900">Totalt</span>
                  <span className="text-gray-900">{totalPrice.toFixed(0)} kr</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {showCopied ? 'Kopierad!' : 'Dela lista'}
                  </button>

                  {checkedCount > 0 && (
                    <button
                      onClick={clearChecked}
                      className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                    >
                      Ta bort avprickade
                    </button>
                  )}
                </div>

                {/* Clear all */}
                <button
                  onClick={clearList}
                  className="w-full text-sm text-gray-500 hover:text-red-600"
                >
                  Rensa hela listan
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

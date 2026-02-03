'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import ShareRecipeModal from './ShareRecipeModal'

export default function RecipeDetailModal({ recipe, favorite, isOpen, onClose, onAddToShoppingList }) {
  const [addingToList, setAddingToList] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  if (!isOpen || !recipe) return null

  const handleAddToShoppingList = async () => {
    setAddingToList(true)
    try {
      // Get ingredients from recipe
      const ingredients = recipe.ingredients || []

      if (ingredients.length === 0) {
        console.warn('No ingredients to add')
        return
      }

      // Call the callback if provided
      if (onAddToShoppingList) {
        const success = await onAddToShoppingList(ingredients, recipe.name || recipe.title)
        if (success !== false) {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        }
      }
    } catch (error) {
      console.error('Error adding to shopping list:', error)
    } finally {
      setAddingToList(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-2xl font-bold mb-2">
                  {recipe.title || recipe.name}
                </h2>
                {recipe.description && (
                  <p className="text-green-100 text-sm">{recipe.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3 mt-4">
              {(recipe.prep_time || recipe.prepTime) && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recipe.prep_time || recipe.prepTime}
                </span>
              )}
              {(recipe.cook_time || recipe.cookTime) && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  {recipe.cook_time || recipe.cookTime}
                </span>
              )}
              {recipe.servings && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {recipe.servings} portioner
                </span>
              )}
              {(recipe.estimatedCost || recipe.estimated_cost) && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recipe.estimatedCost || recipe.estimated_cost} kr
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Rating if favorite */}
            {favorite && favorite.rating && (
              <div className="flex items-center gap-1 mb-4">
                <span className="text-sm text-gray-600 mr-2">Ditt betyg:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xl ${star <= favorite.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}

            {/* Notes if favorite */}
            {favorite && favorite.notes && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-1">Din recension:</p>
                <p className="text-gray-600 italic">"{favorite.notes}"</p>
              </div>
            )}

            {/* Ingredients */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </span>
                Ingredienser
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(recipe.ingredients || []).map((ing, i) => (
                  <div key={i} className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">
                      {typeof ing === 'string'
                        ? ing
                        : `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ing}`.trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </span>
                  Instruktioner
                </h3>
                <ol className="space-y-3">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        {typeof step === 'string' ? step : step.instruction || step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tips */}
            {recipe.tips && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <svg className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span><strong>Tips:</strong> {recipe.tips}</span>
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t p-4 bg-gray-50">
            {showSuccess && (
              <div className="mb-3 p-3 bg-green-100 text-green-700 rounded-lg text-sm text-center">
                ✓ Ingredienser har lagts till i din inköpslista!
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleAddToShoppingList}
                disabled={addingToList}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addingToList ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Lägger till...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Lägg till i inköpslista
                  </>
                )}
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-3 bg-blue-100 text-blue-700 font-medium rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                title="Dela recept"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareRecipeModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        recipe={recipe}
        type="recipe"
      />
    </div>
  )
}

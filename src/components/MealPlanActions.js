'use client'

import { useState } from 'react'
import Link from 'next/link'
import SaveAsTemplateModal from './SaveAsTemplateModal'
import PdfDownloadButton from './PdfDownloadButton'
import ShareRecipeModal from './ShareRecipeModal'

export default function MealPlanActions({
  mealPlanId,
  mealPlanName,
  recipes = [],
  isPremium = false,
  totalCost = 0,
  servings = 4
}) {
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateSaved, setTemplateSaved] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const handleTemplateSaved = (template) => {
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 3000)
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href={`/shopping-list/${mealPlanId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all hover:scale-105 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Visa inköpslista
        </Link>

        <button
          onClick={() => setShowTemplateModal(true)}
          disabled={templateSaved}
          className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all border ${
            templateSaved
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {templateSaved ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mall sparad!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Spara som mall
            </>
          )}
        </button>

        <PdfDownloadButton
          type="meal-plan"
          id={mealPlanId}
          label="Ladda ner PDF"
          isPremium={isPremium}
          size="lg"
        />

        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all border border-blue-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Dela
        </button>
      </div>

      <SaveAsTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        mealPlanId={mealPlanId}
        mealPlanName={mealPlanName}
        recipes={recipes}
        onSave={handleTemplateSaved}
      />

      <ShareRecipeModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="meal_plan"
        mealPlanId={mealPlanId}
        mealPlanData={{
          name: mealPlanName,
          recipes: recipes,
          total_cost: totalCost,
          servings: servings
        }}
      />
    </>
  )
}

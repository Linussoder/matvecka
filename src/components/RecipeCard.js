'use client'

import Image from 'next/image'
import FavoriteButton from '@/components/FavoriteButton'

export default function RecipeCard({ recipe }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
      {recipe.image_url && (
        <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
          />
          {/* Favorite button overlay */}
          <div className="absolute top-3 right-3">
            <FavoriteButton recipe={recipe} variant="icon" />
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            {recipe.name}
          </h3>
          {!recipe.image_url && (
            <FavoriteButton recipe={recipe} variant="icon" />
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.prep_time} min
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {recipe.servings} port.
          </span>
          <span className="font-semibold text-green-600">
            {recipe.cost_per_serving} kr/port.
          </span>
        </div>

        <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
          Visa recept
        </button>
      </div>
    </div>
  )
}

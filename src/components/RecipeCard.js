'use client'

import Image from 'next/image'
import FavoriteButton from '@/components/FavoriteButton'

export default function RecipeCard({ recipe }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
      {recipe.image_url && (
        <div className="relative h-48 bg-gray-200">
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
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            {recipe.name}
          </h3>
          {!recipe.image_url && (
            <FavoriteButton recipe={recipe} variant="icon" />
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            ⏱ {recipe.prep_time} min
          </span>
          <span className="flex items-center gap-1">
            👥 {recipe.servings} port.
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

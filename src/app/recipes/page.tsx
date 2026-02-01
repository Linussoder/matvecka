import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface Recipe {
  id: string
  name: string
  description: string
  image_url: string | null
  prep_time: number
  servings: number
  cost_per_serving: number
  created_at: string
}

export default async function RecipesPage() {
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Receptförslag</h1>
        <p className="text-gray-600 mb-8">
          Baserat på veckans bästa erbjudanden
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes?.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </main>
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
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
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          {recipe.name}
        </h3>
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

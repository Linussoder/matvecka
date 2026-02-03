import { createClient } from '@supabase/supabase-js'
import RecipeCard from '@/components/RecipeCard'

interface Recipe {
  id: number
  name: string
  description: string
  image_url: string | null
  prep_time: number
  servings: number
  cost_per_serving: number
  created_at: string
}

export default async function RecipesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Receptförslag</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Baserat på veckans bästa erbjudanden
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes?.map((recipe: Recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </main>
    </div>
  )
}

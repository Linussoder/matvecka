import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default async function MealPlanDetailPage({ params }) {
  const { id } = await params

  // Create client inside function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Fetch meal plan
  const { data: mealPlan, error: planError } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('id', id)
    .single()

  // Fetch recipes
  const { data: recipes, error: recipesError } = await supabase
    .from('meal_plan_recipes')
    .select('*')
    .eq('meal_plan_id', id)
    .order('day_number')

  if (planError || recipesError || !mealPlan) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800">Kunde inte ladda matplan</p>
          </div>
        </div>
      </div>
    )
  }

  const avgCostPerServing = mealPlan.total_cost / (recipes?.length || 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            Matvecka
          </Link>
          <nav className="flex gap-6">
            <Link href="/meal-planner" className="text-gray-600 hover:text-green-600">
              Ny Matplan
            </Link>
            <Link href="/my-plans" className="text-gray-600 hover:text-green-600">
              Mina Planer
            </Link>
            <Link href="/products" className="text-gray-600 hover:text-green-600">
              Erbjudanden
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/my-plans"
            className="text-green-600 hover:text-green-700 mb-4 inline-flex items-center gap-2"
          >
            ← Tillbaka till mina planer
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{mealPlan.name}</h1>
            <p className="text-gray-600">
              Vecka {new Date(mealPlan.week_start_date).toLocaleDateString('sv-SE')} • {recipes?.length || 0} recept
            </p>
          </div>

          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-700">Antal recept:</span>
                <span className="font-semibold ml-2">{recipes?.length || 0}</span>
              </div>
              <div>
                <span className="text-green-700">Total kostnad:</span>
                <span className="font-semibold ml-2">{mealPlan.total_cost} kr</span>
              </div>
              <div>
                <span className="text-green-700">Snitt per portion:</span>
                <span className="font-semibold ml-2">{avgCostPerServing.toFixed(2)} kr</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mb-8">
            <Link
              href={`/shopping-list/${id}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Visa Inköpslista
            </Link>
          </div>

          {/* Recipes */}
          <div className="space-y-4">
            {recipes?.map((recipeWrapper) => (
              <RecipeCard
                key={recipeWrapper.id}
                recipe={recipeWrapper.recipe_data}
                day={recipeWrapper.day_number}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function RecipeCard({ recipe, day }) {
  const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

  return (
    <details className="bg-white rounded-xl shadow-sm overflow-hidden group">
      <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {dayNames[day - 1]}
              </span>
              <span className="text-gray-500 text-sm">Dag {day}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{recipe.name}</h3>
            <p className="text-gray-600 mt-1">{recipe.description}</p>
          </div>
          <div className="text-gray-400 group-open:rotate-180 transition-transform ml-4">
            ▼
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
          <span className="flex items-center gap-1">
            {recipe.prepTime || recipe.prep_time} + {recipe.cookTime || recipe.cook_time}
          </span>
          <span className="flex items-center gap-1">
            {recipe.servings} portioner
          </span>
          <span className="flex items-center gap-1 text-green-600 font-semibold">
            {recipe.estimatedCost || 'N/A'} kr
          </span>
          <span className="flex items-center gap-1">
            {recipe.difficulty}
          </span>
        </div>
      </summary>

      <div className="px-6 pb-6 pt-0 border-t border-gray-200">
        {/* Ingredients */}
        <div className="mb-6 mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">Ingredienser:</h4>
          <ul className="space-y-2">
            {recipe.ingredients?.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-600 mt-1">•</span>
                <span>
                  {ing.amount} {ing.unit} {ing.name}
                  {ing.notes && <span className="text-gray-500 text-sm"> ({ing.notes})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Instruktioner:</h4>
          <ol className="space-y-3">
            {recipe.instructions?.map((step, i) => (
              <li key={i} className="flex gap-3 text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </span>
                <span className="flex-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        {recipe.tips && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Tips:</strong> {recipe.tips}
            </p>
          </div>
        )}
      </div>
    </details>
  )
}

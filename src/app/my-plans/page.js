import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const revalidate = 0 // Always fetch fresh data

export default async function MyMealPlansPage() {
  // Create client inside function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Fetch all meal plans
  const { data: mealPlans, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      meal_plan_recipes(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Mina Matplaner</h1>
          <p className="text-gray-600 mb-8">
            Dina sparade veckoplanerer och inköpslistor
          </p>

          {/* Meal Plans List */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-800">Kunde inte ladda matplaner</p>
            </div>
          ) : mealPlans && mealPlans.length > 0 ? (
            <div className="space-y-4">
              {mealPlans.map((plan) => (
                <MealPlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Inga sparade matplaner än
              </h3>
              <p className="text-gray-600 mb-6">
                Skapa din första smarta veckoplan!
              </p>
              <Link
                href="/meal-planner"
                className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
              >
                Skapa Matplan
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function MealPlanCard({ plan }) {
  const recipeCount = plan.meal_plan_recipes?.[0]?.count || 0

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {plan.name}
            </h3>
            <p className="text-gray-600 text-sm">
              Skapad {new Date(plan.created_at).toLocaleDateString('sv-SE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {plan.total_cost} kr
            </div>
            <div className="text-xs text-gray-500">Total kostnad</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            Vecka {new Date(plan.week_start_date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            {recipeCount} recept
          </span>
          <span className="flex items-center gap-1">
            {plan.servings} portioner
          </span>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/meal-plan/${plan.id}`}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-center font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Visa Recept
          </Link>
          <Link
            href={`/shopping-list/${plan.id}`}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Inköpslista
          </Link>
        </div>
      </div>
    </div>
  )
}

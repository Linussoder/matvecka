import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import MealPlanRecipeCard from '@/components/MealPlanRecipeCard'
import NutritionSummary from '@/components/NutritionSummary'
import MealPlanActions from '@/components/MealPlanActions'
import { getUserSubscription } from '@/lib/subscription'

export default async function MealPlanDetailPage({ params }) {
  const { id } = await params
  const cookieStore = await cookies()

  // Create authenticated server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Get subscription status
  const { plan } = user ? await getUserSubscription(user.id) : { plan: 'free' }
  const isPremium = plan === 'premium'

  // Fetch meal plan - only if user owns it
  const query = supabase
    .from('meal_plans')
    .select('*')
    .eq('id', id)

  // If user is logged in, verify ownership
  if (user) {
    query.eq('user_id', user.id)
  }

  const { data: mealPlan, error: planError } = await query.single()

  // Fetch recipes
  const { data: recipes, error: recipesError } = await supabase
    .from('meal_plan_recipes')
    .select('*')
    .eq('meal_plan_id', id)
    .order('day_number')

  if (planError || recipesError || !mealPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <span className="text-6xl block mb-4">😕</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Veckomenyn hittades inte</h1>
            <p className="text-gray-600 mb-6">Den här veckomenyn kan ha tagits bort eller så finns den inte.</p>
            <Link
              href="/meal-plan"
              className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              ← Tillbaka till veckomenyer
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const avgCostPerServing = mealPlan.total_cost / (recipes?.length || 1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-green-600 transition-colors">Hem</Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href="/meal-plan" className="hover:text-green-600 transition-colors">Veckomenyer</Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">{mealPlan.name}</li>
          </ol>
        </nav>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{mealPlan.name}</h1>
                <p className="text-gray-600">
                  Vecka {new Date(mealPlan.week_start_date).toLocaleDateString('sv-SE')} • {recipes?.length || 0} recept • {mealPlan.servings} portioner
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{mealPlan.total_cost?.toFixed(0) || '—'} kr</div>
                <div className="text-sm text-gray-500">Total kostnad</div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{recipes?.length || 0}</div>
              <div className="text-gray-600 text-sm">Recept</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{mealPlan.total_cost?.toFixed(0) || '—'} kr</div>
              <div className="text-gray-600 text-sm">Total kostnad</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{avgCostPerServing.toFixed(0)} kr</div>
              <div className="text-gray-600 text-sm">Per portion</div>
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="mb-8">
            <NutritionSummary mealPlanId={id} mealPlan={mealPlan} isPremium={isPremium} />
          </div>

          {/* Action Buttons */}
          <MealPlanActions
            mealPlanId={id}
            mealPlanName={mealPlan.name}
            recipes={recipes || []}
            isPremium={isPremium}
          />

          {/* Section Title */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Veckans recept</h2>
            <p className="text-gray-600 text-sm">Klicka på ett recept för att se ingredienser och instruktioner</p>
          </div>

          {/* Recipes */}
          <div className="space-y-4">
            {recipes?.map((recipeWrapper) => (
              <MealPlanRecipeCard
                key={recipeWrapper.id}
                recipe={recipeWrapper.recipe_data}
                day={recipeWrapper.day_number}
                mealPlanRecipeId={recipeWrapper.id}
                mealPlanId={id}
                isPremium={isPremium}
              />
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-12 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Gillade du denna veckomeny?
              </h2>
              <p className="text-green-100 mb-6 max-w-xl mx-auto">
                Skapa en ny veckomeny för nästa vecka med ännu fler sparmöjligheter
              </p>
              <Link
                href="/meal-planner"
                className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
              >
                Skapa ny veckomeny →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

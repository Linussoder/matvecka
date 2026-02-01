'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ recentPlans: [], totalSaved: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: plans } = await supabase
          .from('meal_plans')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3)

        const { count } = await supabase
          .from('meal_plans')
          .select('*', { count: 'exact', head: true })

        setStats({
          recentPlans: plans || [],
          totalSaved: (count || 0) * 127
        })
      }

      setLoading(false)
    }
    checkUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (user) {
    return <LoggedInHome user={user} stats={stats} />
  }

  return <GuestHome />
}

// ============================================
// LOGGED IN USER - Personalized Homepage
// ============================================
function LoggedInHome({ user, stats }) {
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'där'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Välkommen tillbaka, {userName}!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Vad vill du göra idag?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Link
            href="/meal-planner"
            className="group bg-green-600 text-white rounded-2xl p-8 hover:bg-green-700 transition-all hover:scale-[1.02] shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🍽️</span>
              <div>
                <h2 className="text-2xl font-bold">Skapa ny matplan</h2>
                <p className="text-green-100">Få 7 dagar med smarta recept</p>
              </div>
            </div>
            <div className="flex items-center text-green-100 group-hover:text-white">
              <span>Kom igång</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>

          <Link
            href="/products"
            className="group bg-white rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-[1.02] shadow-lg border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🏷️</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Veckans erbjudanden</h2>
                <p className="text-gray-600">Se de senaste priserna</p>
              </div>
            </div>
            <div className="flex items-center text-green-600">
              <span>Utforska</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.recentPlans.length > 0 ? stats.totalSaved : 0} kr
            </div>
            <div className="text-gray-600 text-sm">Uppskattad besparing</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.recentPlans.length}
            </div>
            <div className="text-gray-600 text-sm">Matplaner skapade</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.recentPlans.length * 7}
            </div>
            <div className="text-gray-600 text-sm">Recept skapade</div>
          </div>
        </div>

        {/* Recent Plans */}
        {stats.recentPlans.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Senaste matplaner</h2>
              <Link href="/my-plans" className="text-green-600 hover:text-green-700 text-sm">
                Visa alla →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {stats.recentPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/meal-plan/${plan.id}`}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📋</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{plan.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(plan.created_at).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{plan.servings} portioner</span>
                    <span className="font-semibold text-green-600">{plan.total_cost?.toFixed(0) || '—'} kr</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.recentPlans.length === 0 && (
          <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl p-12 shadow-sm">
            <span className="text-6xl mb-4 block">🌟</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Dags att skapa din första matplan!
            </h2>
            <p className="text-gray-600 mb-6">
              Vi hjälper dig att planera veckans måltider baserat på de bästa erbjudandena.
            </p>
            <Link
              href="/meal-planner"
              className="inline-block px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Skapa din första matplan →
            </Link>
          </div>
        )}

        {/* Features reminder */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <FeatureCard
            icon="📊"
            title="Jämför priser"
            description="Vi kollar ICA, Coop och City Gross åt dig"
          />
          <FeatureCard
            icon="👨‍🍳"
            title="Smarta recept"
            description="Anpassade recept baserade på veckans deals"
          />
          <FeatureCard
            icon="📝"
            title="Färdig inköpslista"
            description="Skriv ut eller skicka till din e-post"
          />
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2026 Matvecka. Alla rättigheter förbehållna.</p>
        </div>
      </footer>
    </div>
  )
}

// ============================================
// GUEST USER - Marketing Homepage
// ============================================
function GuestHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Spara tid och pengar på<br />veckohandlingen
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Matvecka skapar smarta matplaner baserade på veckans bästa erbjudanden
          från ICA, Coop och City Gross.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            Kom igång gratis →
          </Link>

          <Link
            href="/products"
            className="px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow border border-gray-200"
          >
            Se erbjudanden
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Gratis för 2 matplaner per vecka. Uppgradera för 99 kr/månad.
        </p>

        {/* Demo Preview Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-2">Nyfiken på hur det fungerar?</p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            Se en exempelplan
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <FeatureCard
            icon="📊"
            title="Jämför priser"
            description="Se direkt var veckans bästa erbjudanden finns"
          />
          <FeatureCard
            icon="👨‍🍳"
            title="Smarta recept"
            description="Skräddarsydda recept från veckans billigaste varor"
          />
          <FeatureCard
            icon="📝"
            title="Inköpslista"
            description="Få en färdig lista att ta med till butiken"
          />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          <StatCard number="892 kr" label="Genomsnittlig månadsbesparing" />
          <StatCard number="45 min" label="Sparad tid per vecka" />
          <StatCard number="4.8★" label="Betyg från användare" />
        </div>

        {/* How it works */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Så fungerar det</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Välj dina preferenser</h3>
              <p className="text-gray-600 text-sm">Antal portioner, budget och eventuella kostpreferenser</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Matvecka skapar din plan</h3>
              <p className="text-gray-600 text-sm">7 dagar med recept baserade på veckans bästa priser</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Handla smart</h3>
              <p className="text-gray-600 text-sm">Skriv ut inköpslistan och spara pengar i butiken</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 bg-green-600 rounded-2xl p-12 max-w-4xl mx-auto text-white">
          <h2 className="text-3xl font-bold mb-4">Redo att börja spara?</h2>
          <p className="text-green-100 mb-8 max-w-xl mx-auto">
            Skapa ett gratis konto och få din första personliga matplan på under en minut.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Skapa konto gratis →
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2026 Matvecka. Alla rättigheter förbehållna.</p>
        </div>
      </footer>
    </div>
  )
}

// ============================================
// Shared Components
// ============================================
function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-green-600 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  )
}

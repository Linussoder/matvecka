'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import SiteBanner from '@/components/SiteBanner'

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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <SiteBanner type="banner" />
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Välkommen tillbaka, {userName}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Skapa ny veckomeny</h2>
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
            className="group bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-[1.02] shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Veckans erbjudanden</h2>
                <p className="text-gray-600 dark:text-gray-400">Se de senaste priserna</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.recentPlans.length > 0 ? stats.totalSaved : 0} kr
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Uppskattad besparing</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.recentPlans.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Veckomenyer skapade</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.recentPlans.length * 7}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Recept skapade</div>
          </div>
        </div>

        {/* Recent Plans */}
        {stats.recentPlans.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Senaste veckomenyer</h2>
              <Link href="/my-plans" className="text-green-600 hover:text-green-700 text-sm">
                Visa alla →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {stats.recentPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/meal-plan/${plan.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{plan.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(plan.created_at).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{plan.servings} portioner</span>
                    <span className="font-semibold text-green-600">{plan.total_cost?.toFixed(0) || '—'} kr</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.recentPlans.length === 0 && (
          <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Dags att skapa din första veckomeny!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vi hjälper dig att planera veckans måltider baserat på de bästa erbjudandena.
            </p>
            <Link
              href="/meal-planner"
              className="inline-block px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Skapa din första veckomeny →
            </Link>
          </div>
        )}

        {/* Features reminder */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <FeatureCard
            icon={<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            title="Jämför priser"
            description="Vi kollar ICA, Coop och Willys åt dig"
          />
          <FeatureCard
            icon={<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            title="Smarta recept"
            description="Anpassade recept baserade på veckans deals"
          />
          <FeatureCard
            icon={<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            title="Färdig inköpslista"
            description="Skriv ut eller skicka till din e-post"
          />
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <SiteBanner type="banner" />
      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Spara tid och pengar på{' '}
            <span className="relative text-green-600">
              veckohandlingen
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0,5 Q50,0 100,5 T200,5" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Matvecka skapar smarta veckomenyer baserade på veckans bästa erbjudanden.
            Du får recept och inköpslista – vi gör jobbet åt dig.
          </p>

          {/* Two Equal CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Kom igång gratis →
            </Link>

            <Link
              href="/demo"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-lg font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center gap-2 group"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Se ett exempel
              <svg
                className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            ✓ Gratis för 2 veckomenyer per vecka &nbsp;•&nbsp; ✓ Ingen bindningstid
          </p>
        </div>

        {/* Social Proof Bar */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm mb-4">Hämtar priser från</p>
          <div className="flex justify-center items-center gap-8 opacity-60 dark:opacity-80">
            <span className="text-2xl font-bold text-red-600">ICA</span>
            <span className="text-2xl font-bold text-green-700">Coop</span>
            <span className="text-2xl font-bold text-orange-500">Willys</span>
          </div>
        </div>

        {/* Demo Preview Card - Eye Catching! */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Link href="/demo" className="block group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-1">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="font-semibold">Exempelplan - Vecka 5</p>
                    <p className="text-green-100 text-sm">7 dagar • 4 portioner • 847 kr totalt</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm">
                  <span>Klicka för att utforska</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day, i) => (
                    <div key={day} className="text-center">
                      <p className="text-xs text-gray-400 mb-1">{day}</p>
                      <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg flex items-center justify-center text-2xl border border-green-200 dark:border-green-700">
                        {['🍝', '🐟', '🍝', '🍛', '🍟', '🌮', '🍗'][i]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sample recipes preview */}
                <div className="space-y-2">
                  {[
                    { day: 'Måndag', name: 'Krämig kycklingpasta', time: '30 min', price: '112 kr' },
                    { day: 'Tisdag', name: 'Ugnsbakad lax med potatismos', time: '45 min', price: '145 kr' },
                    { day: 'Onsdag', name: 'Klassisk köttfärssås', time: '40 min', price: '89 kr' },
                  ].map((recipe, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{recipe.day}</p>
                          <p className="font-medium text-gray-800 dark:text-white">{recipe.name}</p>
                          <p className="text-xs text-gray-400">{recipe.time}</p>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">{recipe.price}</span>
                    </div>
                  ))}
                </div>

                {/* See more hint */}
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium group-hover:gap-2 transition-all">
                    Se alla 7 recept + inköpslista
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <FeatureCard
            icon={<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            title="Jämför priser"
            description="Vi kollar ICA, Coop och Willys åt dig och hittar veckans bästa deals"
          />
          <FeatureCard
            icon={<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            title="Smarta recept"
            description="Skräddarsydda recept som passar din budget och dina preferenser"
          />
          <FeatureCard
            icon={<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            title="Färdig inköpslista"
            description="Allt du behöver, sorterat efter kategori. Skriv ut eller använd i mobilen"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 max-w-4xl mx-auto">
          <StatCard number="892 kr" label="Snittbesparing/månad" />
          <StatCard number="45 min" label="Sparad tid/vecka" />
          <StatCard number="4.8★" label="Användaromdöme" />
          <StatCard number="10k+" label="Veckomenyer skapade" />
        </div>

        {/* How it works */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Så enkelt fungerar det
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Från val till färdig inköpslista på under en minut
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto -mt-8 mb-4 font-bold shadow-lg">
                1
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">Välj preferenser</h3>
              <p className="text-gray-600 dark:text-gray-400">Antal portioner, budget och kostpreferenser</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto -mt-8 mb-4 font-bold shadow-lg">
                2
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">Få din veckomeny</h3>
              <p className="text-gray-600 dark:text-gray-400">7 recept baserade på veckans bästa priser</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto -mt-8 mb-4 font-bold shadow-lg">
                3
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">Handla smart</h3>
              <p className="text-gray-600 dark:text-gray-400">Använd inköpslistan och spara pengar</p>
            </div>
          </div>
        </div>

        {/* Testimonials - Two cards */}
        <div className="mt-24 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Vad våra användare säger
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">Anna L.</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Stockholm</span>
                  </div>
                  <span className="text-yellow-500">★★★★★</span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "Innan Matvecka spenderade jag timmar varje vecka på att planera maten och
                leta erbjudanden. Nu tar det 2 minuter och jag sparar ungefär 800 kr i månaden!"
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">Erik M.</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Göteborg</span>
                  </div>
                  <span className="text-yellow-500">★★★★★</span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "Som student är det perfekt! Jag får variation i maten utan att behöva tänka,
                och inköpslistan gör att jag inte köper onödiga saker längre."
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Vanliga frågor
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="Är Matvecka gratis?"
              answer="Ja! Du kan skapa upp till 2 veckomenyer per vecka helt gratis. Vill du ha fler eller extra funktioner finns premium-versionen."
            />
            <FAQItem
              question="Vilka butiker stöds?"
              answer="Just nu hämtar vi erbjudanden från ICA, Coop och Willys. Fler butiker kommer snart!"
            />
            <FAQItem
              question="Kan jag anpassa recepten?"
              answer="Absolut! Du kan ange allergier, kostpreferenser (vegetarisk, vegan etc.) och vilka råvaror du vill undvika."
            />
            <FAQItem
              question="Hur fungerar inköpslistan?"
              answer="När din veckomeny är klar får du en automatisk inköpslista med allt du behöver, sorterad efter kategori. Du kan bocka av varor direkt i appen."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-24 bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-8 md:p-16 max-w-5xl mx-auto text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Redo att börja spara?
            </h2>
            <p className="text-green-100 mb-8 max-w-xl mx-auto text-lg">
              Gå med tusentals svenskar som redan sparar tid och pengar varje vecka.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-10 py-5 bg-white text-green-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
              >
                Skapa konto gratis →
              </Link>
              <Link
                href="/demo"
                className="px-10 py-5 bg-green-500/30 text-white text-lg font-semibold rounded-xl hover:bg-green-500/50 transition-all border border-white/30 flex items-center justify-center gap-2"
              >
                <span>👀</span>
                Se demo först
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-bold text-gray-900 dark:text-white">Matvecka</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/demo" className="hover:text-gray-700 dark:hover:text-white">Demo</Link>
              <Link href="/products" className="hover:text-gray-700 dark:hover:text-white">Erbjudanden</Link>
              <Link href="/terms" className="hover:text-gray-700 dark:hover:text-white">Villkor</Link>
              <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-white">Integritet</Link>
            </div>
            <p className="text-gray-400 text-sm">© 2026 Matvecka</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// FAQ Accordion Item Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 animate-fadeIn">
          {answer}
        </div>
      )}
    </div>
  )
}

// ============================================
// Shared Components
// ============================================
function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

function StatCard({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-green-600 mb-2">{number}</div>
      <div className="text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  )
}

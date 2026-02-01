import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-green-600">
            🛒 Matvecka
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/recipes"
              className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
            >
              Recept
            </Link>
            <Link
              href="/products"
              className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
            >
              Erbjudanden
            </Link>
            <Link
              href="/meal-planner"
              className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
            >
              Matplanering
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
            >
              Logga in
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
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
            href="/stores"
            className="px-8 py-4 bg-white text-green-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow border border-gray-200"
          >
            Se butiker
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Gratis för 2 recept per vecka. Uppgradera för 99 kr/månad.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <FeatureCard
            icon="📊"
            title="Jämför priser"
            description="Se direkt var veckans bästa erbjudanden finns"
          />
          <FeatureCard
            icon="🍽️"
            title="Smarta recept"
            description="AI skapar recept från veckans billigaste varor"
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
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2026 Matvecka. Alla rättigheter förbehållna.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-green-600 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  )
}

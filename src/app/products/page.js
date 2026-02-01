import Link from 'next/link'

export default function ProductsHubPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Veckans erbjudanden
          </h1>
          <p className="text-gray-500">
            Se erbjudanden från ICA, Coop och City Gross
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Option 1: Reklamblad */}
          <Link
            href="/products/flyers"
            className="group block bg-white border border-gray-200 rounded-lg p-8 hover:border-gray-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                  Se alla reklamblad
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Bläddra i butikernas veckoblad som PDF. Perfekt om du vill se hela sortimentet.
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    ICA
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Coop
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    City Gross
                  </span>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Option 2: Product List */}
          <Link
            href="/products/list"
            className="group block bg-white border border-gray-200 rounded-lg p-8 hover:border-gray-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                  Se lista på alla erbjudanden
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Sök och filtrera bland alla produkter. Sortera efter pris eller kategori.
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Sökbar</span>
                  <span>•</span>
                  <span>Filtrera kategori</span>
                  <span>•</span>
                  <span>Sortera pris</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Erbjudanden uppdateras varje vecka
          </p>
        </div>
      </div>
    </div>
  )
}

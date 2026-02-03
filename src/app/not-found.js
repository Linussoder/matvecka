import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🥕</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sidan hittades inte
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Oj! Den här sidan verkar ha försvunnit som den sista biten av din favoriträtt.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Till startsidan
          </Link>
          <Link
            href="/meal-planner"
            className="px-6 py-3 bg-white text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            Skapa veckomeny
          </Link>
        </div>
      </div>
    </div>
  )
}

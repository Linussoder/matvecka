'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Du är offline
        </h1>
        <p className="text-gray-500 mb-8">
          Det verkar som att du inte har någon internetanslutning just nu.
          Kontrollera din anslutning och försök igen.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Försök igen
          </button>

          <p className="text-sm text-gray-400">
            Vissa funktioner kräver internetanslutning för att fungera.
          </p>
        </div>

        {/* Saved Content Hint */}
        <div className="mt-12 p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-900 mb-2">
            💡 Tips
          </h2>
          <p className="text-sm text-gray-500">
            Din inköpslista sparas lokalt och fungerar även offline.
            Öppna appen igen när du har internet för att se nya erbjudanden.
          </p>
        </div>
      </div>
    </div>
  )
}

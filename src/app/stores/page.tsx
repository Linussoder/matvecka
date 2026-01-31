import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Store {
  id: string
  name: string
  city: string
  chain: string
}

export default async function StoresPage() {
  // Fetch stores from Supabase
  const { data: stores, error } = await supabase
    .from('stores')
    .select('*')
    .order('city')

  if (error) {
    console.error('Error fetching stores:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-600">
            🛒 Matvecka
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Våra Butiker
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Vi jämför priser från dessa butiker för att ge dig bästa deals
        </p>

        {/* Stores Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores && stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Kunde inte ladda butiker. Försök igen senare.
          </div>
        )}
      </main>
    </div>
  )
}

function StoreCard({ store }: { store: Store }) {
  const chainColors: Record<string, string> = {
    'ICA': 'bg-red-100 text-red-700',
    'Coop': 'bg-green-100 text-green-700',
    'City Gross': 'bg-blue-100 text-blue-700'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {store.name}
          </h3>
          <p className="text-gray-600">{store.city}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${chainColors[store.chain] || 'bg-gray-100 text-gray-700'}`}>
          {store.chain}
        </span>
      </div>

      <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
        Se erbjudanden
      </button>
    </div>
  )
}

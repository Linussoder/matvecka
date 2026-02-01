import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  // Create client inside function (using anon key for public data)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let latestWeek: any = null
  let products: any[] | null = null
  let error: string | null = null

  try {
    // Get most recent week
    const { data: weekData, error: weekError } = await supabase
      .from('weeks')
      .select('id, start_date, end_date, store_id, stores(name, chain, city)')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (weekError) {
      console.error('Week fetch error:', weekError)
      error = 'Kunde inte hämta veckodata: ' + weekError.message
    } else if (!weekData) {
      // No weeks in database yet
      error = null // Not an error, just no data
    } else {
      latestWeek = weekData
    }

    // Get products from that week
    if (latestWeek) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('week_id', latestWeek.id)
        .order('price', { ascending: true })
        .limit(50)

      if (productError) {
        console.error('Product fetch error:', productError)
        error = 'Kunde inte hämta produkter: ' + productError.message
      } else {
        products = productData
      }
    }

  } catch (err: any) {
    console.error('Page error:', err)
    error = 'Ett fel uppstod: ' + err.message
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              <strong>Fel:</strong> {error}
            </p>
          </div>
        )}

        {/* Week Info */}
        {latestWeek && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              <strong>Veckans erbjudanden:</strong> {formatDate(latestWeek.start_date)} - {formatDate(latestWeek.end_date)}
              {latestWeek.stores?.[0] && (
                <> från <strong>{latestWeek.stores[0].name}</strong> ({latestWeek.stores[0].city})</>
              )}
            </p>
          </div>
        )}

        <h1 className="text-4xl font-bold mb-2">Veckans bästa deals</h1>
        <p className="text-gray-600 mb-8">
          Sorterat efter pris - bästa erbjudandena först
        </p>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg mb-4">
              Inga produkter hittades. Kör scraper för att ladda erbjudanden.
            </p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Debug info:</p>
              <p>Latest week: {latestWeek ? 'Found' : 'Not found'}</p>
              <p>Products count: {products?.length || 0}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function ProductCard({ product }: { product: any }) {
  const categoryColors: Record<string, string> = {
    'kött': 'bg-red-100 text-red-700',
    'fisk': 'bg-blue-100 text-blue-700',
    'grönsaker': 'bg-green-100 text-green-700',
    'frukt': 'bg-yellow-100 text-yellow-700',
    'mejeri': 'bg-purple-100 text-purple-700',
    'spannmål': 'bg-orange-100 text-orange-700',
    'dryck': 'bg-cyan-100 text-cyan-700',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      {product.image_url && (
        <div className="relative h-40 bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-green-600">
              {product.price}
            </span>
            <span className="text-gray-500 text-sm ml-1">
              kr/{product.unit}
            </span>
          </div>

          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[product.category] || 'bg-gray-100 text-gray-700'}`}>
            {product.category}
          </span>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric'
  })
}

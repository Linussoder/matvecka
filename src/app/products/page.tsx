import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 3600 // Revalidate every hour

export default async function ProductsPage() {
  // Get most recent week
  const { data: latestWeek } = await supabase
    .from('weeks')
    .select('id, start_date, end_date, store_id, stores(name, chain, city)')
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  // Get products from that week
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('week_id', latestWeek?.id)
    .order('price', { ascending: true })
    .limit(50) // Show top 50 deals

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            Matvecka
          </Link>
          <nav className="flex gap-6">
            <Link href="/stores" className="text-gray-600 hover:text-green-600">
              Butiker
            </Link>
            <Link href="/recipes" className="text-gray-600 hover:text-green-600">
              Recept
            </Link>
            <Link href="/products" className="text-green-600 font-medium">
              Erbjudanden
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
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
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Inga produkter hittades. Kör scraper för att ladda erbjudanden.
            </p>
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

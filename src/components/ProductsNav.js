'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ProductsNav() {
  const pathname = usePathname()

  const isFlyers = pathname === '/products/flyers' || pathname === '/products'
  const isList = pathname === '/products/list'

  return (
    <div className="border-b bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Title */}
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Veckans erbjudanden
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              Gäller vecka 5: 26 jan – 1 feb
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Link
              href="/products/flyers"
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isFlyers
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span className="hidden sm:inline">Reklamblad</span>
              <span className="sm:hidden">PDF</span>
            </Link>

            <Link
              href="/products/list"
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isList
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Produktlista</span>
              <span className="sm:hidden">Lista</span>
            </Link>
          </div>
        </div>

        {/* Helper text for first-time users */}
        <div className="pb-3 -mt-1">
          <p className="text-xs text-gray-400">
            {isFlyers
              ? 'Bläddra i butikernas veckoblad'
              : 'Sök och filtrera bland alla produkter'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

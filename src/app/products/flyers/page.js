'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProductsNav from '@/components/ProductsNav'

// Store flyers data
const storeFlyers = [
  {
    id: 'ica',
    store: 'ICA',
    name: 'ICA',
    color: 'bg-red-500',
    validFrom: '2026-01-26',
    validTo: '2026-02-01',
    pdfUrl: '/ica.pdf',
    pages: 14,
  },
  {
    id: 'coop',
    store: 'Coop',
    name: 'Coop',
    color: 'bg-green-600',
    validFrom: '2026-01-26',
    validTo: '2026-02-01',
    pdfUrl: '/coop.pdf',
    pages: 16,
  },
  {
    id: 'city-gross',
    store: 'City Gross',
    name: 'City Gross',
    color: 'bg-blue-600',
    validFrom: '2026-01-26',
    validTo: '2026-02-01',
    pdfUrl: '/citygross.pdf',
    pages: 20,
  },
  {
    id: 'willys',
    store: 'Willys',
    name: 'Willys',
    color: 'bg-orange-500',
    validFrom: '2026-01-26',
    validTo: '2026-02-01',
    pdfUrl: '/willys.pdf',
    pages: 24,
  },
]

const stores = ['Alla', 'ICA', 'Coop', 'City Gross', 'Willys']

export default function FlyersPage() {
  const [selectedStore, setSelectedStore] = useState('Alla')
  const [viewingPdf, setViewingPdf] = useState(null)

  const filteredFlyers = selectedStore === 'Alla'
    ? storeFlyers
    : storeFlyers.filter(f => f.store === selectedStore)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50">
      {/* Shared Navigation */}
      <ProductsNav />

      <div className="container mx-auto px-4 py-8">
        {/* Store Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {stores.map((store) => (
            <button
              key={store}
              onClick={() => setSelectedStore(store)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedStore === store
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {store}
            </button>
          ))}
        </div>

        {/* Flyers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFlyers.map((flyer) => (
            <FlyerCard
              key={flyer.id}
              flyer={flyer}
              onView={() => setViewingPdf(flyer)}
              formatDate={formatDate}
            />
          ))}
        </div>

        {filteredFlyers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">Inga reklamblad hittades</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Vill du spara ännu mer?
            </h2>
            <p className="text-green-100 mb-6 max-w-xl mx-auto">
              Skapa en matplan baserad på veckans bästa erbjudanden
            </p>
            <Link
              href="/meal-planner"
              className="inline-block px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
            >
              Skapa matplan gratis →
            </Link>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <PdfViewer
          flyer={viewingPdf}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
  )
}

function FlyerCard({ flyer, onView, formatDate }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden group">
      {/* PDF Preview */}
      <div
        className="aspect-4/5 relative cursor-pointer bg-gray-50"
        onClick={onView}
      >
        <iframe
          src={`${flyer.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          className="w-full h-full pointer-events-none"
          title={`${flyer.name} preview`}
        />

        {/* Store badge */}
        <div className={`absolute top-3 left-3 ${flyer.color} text-white text-sm font-semibold px-3 py-1 rounded-full shadow`}>
          {flyer.name}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="px-5 py-2.5 bg-white rounded-lg text-sm font-semibold shadow-lg text-gray-900">
            Öppna reklamblad
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{flyer.name}</h3>
          <span className="text-xs text-gray-400">{flyer.pages} s</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {formatDate(flyer.validFrom)} – {formatDate(flyer.validTo)}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Visa
          </button>
          <a
            href={flyer.pdfUrl}
            download
            className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ladda ner
          </a>
        </div>
      </div>
    </div>
  )
}

function PdfViewer({ flyer, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${flyer.color}`}></span>
          <h2 className="font-semibold text-gray-900">{flyer.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={flyer.pdfUrl}
            download
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Ladda ner
          </a>
          <a
            href={flyer.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Öppna i ny flik
          </a>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg ml-2 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF Embed */}
      <div className="flex-1 bg-gray-900">
        <iframe
          src={`${flyer.pdfUrl}#toolbar=0`}
          className="w-full h-full"
          title={flyer.name}
        />
      </div>
    </div>
  )
}

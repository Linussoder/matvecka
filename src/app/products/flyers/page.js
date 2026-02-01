'use client'

import { useState } from 'react'
import Link from 'next/link'

// Store flyers data - update this weekly with new PDFs
const storeFlyers = [
  {
    id: 'ica',
    store: 'ICA',
    name: 'ICA',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    borderColor: 'border-red-100',
    bgColor: 'bg-red-50',
    validFrom: '2026-01-27',
    validTo: '2026-02-02',
    pdfUrl: '/ica.pdf',
    pages: 12,
  },
  {
    id: 'coop',
    store: 'Coop',
    name: 'Coop',
    color: 'bg-green-600',
    textColor: 'text-green-600',
    borderColor: 'border-green-100',
    bgColor: 'bg-green-50',
    validFrom: '2026-01-27',
    validTo: '2026-02-02',
    pdfUrl: '/coop.pdf',
    pages: 16,
  },
  {
    id: 'city-gross',
    store: 'City Gross',
    name: 'City Gross',
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-100',
    bgColor: 'bg-blue-50',
    validFrom: '2026-01-27',
    validTo: '2026-02-02',
    pdfUrl: '/citygross.pdf',
    pages: 20,
  },
  {
    id: 'willys',
    store: 'Willys',
    name: 'Willys',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-100',
    bgColor: 'bg-orange-50',
    validFrom: '2026-01-27',
    validTo: '2026-02-02',
    pdfUrl: '/willys.pdf',
    pages: 14,
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

  // Get current week number
  const getWeekNumber = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now - start
    const oneWeek = 604800000
    return Math.ceil((diff / oneWeek) + 1)
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50">
      {/* Hero Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-700">Hem</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/products" className="hover:text-gray-700">Erbjudanden</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900">Reklamblad</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {/* Week badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Vecka {getWeekNumber()} - Nya erbjudanden!
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Veckans reklamblad
              </h1>
              <p className="text-gray-600 text-lg">
                Bläddra i butikernas aktuella veckoblad
              </p>
            </div>

            {/* Store logos */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400">Från</span>
              <div className="flex items-center gap-4 opacity-70">
                <span className="text-lg font-bold text-red-600">ICA</span>
                <span className="text-lg font-bold text-green-700">Coop</span>
                <span className="text-lg font-bold text-blue-600">City Gross</span>
                <span className="text-lg font-bold text-orange-500">Willys</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Store Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {stores.map((store) => (
            <button
              key={store}
              onClick={() => setSelectedStore(store)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedStore === store
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/25 scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
              }`}
            >
              {store}
            </button>
          ))}
        </div>

        {/* Flyers Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              📄
            </div>
            <p className="text-gray-500 text-lg">Inga reklamblad hittades för {selectedStore}</p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🔄
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Uppdateras varje vecka</h3>
            <p className="text-gray-600 text-sm">Nya reklamblad laddas upp varje måndag</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📱
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fungerar på mobilen</h3>
            <p className="text-gray-600 text-sm">Bläddra i reklambladen direkt i din webbläsare</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
              ⬇️
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Ladda ner PDF</h3>
            <p className="text-gray-600 text-sm">Spara reklambladen för att läsa offline</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-linear-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Vill du spara ännu mer?
            </h2>
            <p className="text-green-100 mb-6 max-w-xl mx-auto">
              Låt oss skapa en smart matplan baserad på veckans bästa erbjudanden
            </p>
            <Link
              href="/meal-planner"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
            >
              Skapa matplan gratis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
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

// Flyer Card Component
function FlyerCard({ flyer, onView, formatDate }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden border border-gray-100 group">
      {/* PDF Preview */}
      <div
        className="aspect-4/5 relative cursor-pointer bg-gray-50"
        onClick={onView}
      >
        {/* PDF iframe preview */}
        <iframe
          src={`${flyer.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          className="w-full h-full pointer-events-none"
          title={`${flyer.name} preview`}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Store badge */}
        <div className={`absolute top-3 left-3 ${flyer.color} text-white text-sm font-semibold px-3 py-1 rounded-full shadow-lg`}>
          {flyer.name}
        </div>

        {/* Pages badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
          {flyer.pages} sidor
        </div>

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="px-6 py-3 bg-white rounded-xl text-gray-900 font-semibold shadow-xl flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Öppna reklamblad
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{flyer.name}</h3>
            <p className="text-sm text-gray-500">
              {formatDate(flyer.validFrom)} – {formatDate(flyer.validTo)}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${flyer.color}`} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visa
          </button>
          <a
            href={flyer.pdfUrl}
            download
            className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

// PDF Viewer Modal
function PdfViewer({ flyer, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 ${flyer.color} rounded-xl flex items-center justify-center`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{flyer.name}</h2>
            <p className="text-sm text-gray-500">{flyer.pages} sidor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={flyer.pdfUrl}
            download
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Ladda ner
          </a>
          <a
            href={flyer.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Öppna i ny flik
          </a>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF Embed */}
      <div className="flex-1">
        <iframe
          src={`${flyer.pdfUrl}#toolbar=0`}
          className="w-full h-full"
          title={flyer.name}
        />
      </div>
    </div>
  )
}

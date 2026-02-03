'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'

// PDF.js will be loaded dynamically on the client side
let pdfjsLib = null

export default function AdminFlyersPage() {
  const supabase = createClient()
  const fileInputRef = useRef(null)

  const [flyers, setFlyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [processingPage, setProcessingPage] = useState(null)
  const [results, setResults] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [cleaningUp, setCleaningUp] = useState(false)

  // Form state for new flyer
  const [newFlyer, setNewFlyer] = useState({
    store: 'ICA',
    name: '',
    validFrom: '',
    validTo: ''
  })

  // Load PDF.js dynamically on client side
  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window !== 'undefined' && !pdfjsLib) {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        pdfjsLib = pdfjs
      }
    }
    loadPdfJs()
  }, [])

  // Get PDF loading options with cmap support for better font rendering
  const getPdfLoadingOptions = (data) => ({
    data,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/standard_fonts/',
    useSystemFonts: true,
    disableFontFace: false,
  })

  // Load all flyers
  useEffect(() => {
    loadFlyers()
  }, [])

  const loadFlyers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('flyers')
      .select(`
        *,
        week:weeks(*),
        pages:flyer_pages(
          *,
          hotspots:flyer_hotspots(count)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    setFlyers(data || [])
    setLoading(false)
  }

  // Convert PDF page to image using canvas
  const renderPageToImage = async (pdf, pageNumber) => {
    const page = await pdf.getPage(pageNumber)

    // Helper to check if canvas has actual content
    const checkHasContent = (ctx, w, h) => {
      try {
        const sampleSize = Math.min(200, w, h)
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
        // Check multiple points across the image
        let nonWhitePixels = 0
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i]
          const g = imageData.data[i + 1]
          const b = imageData.data[i + 2]
          // Count pixels that aren't white or very light gray
          if (r < 245 || g < 245 || b < 245) {
            nonWhitePixels++
          }
        }
        // Need at least 1% non-white pixels to consider it has content
        return nonWhitePixels > (sampleSize * sampleSize * 0.01)
      } catch {
        return true // Assume content if we can't check
      }
    }

    // Try rendering with different approaches
    const renderAttempts = [
      { scale: 2, intent: 'display' },
      { scale: 1.5, intent: 'display' },
      { scale: 2, intent: 'print' },
      { scale: 1, intent: 'display' },
    ]

    for (const attempt of renderAttempts) {
      const viewport = page.getViewport({ scale: attempt.scale })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { alpha: false })
      canvas.width = viewport.width
      canvas.height = viewport.height

      // Fill with white background
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, canvas.width, canvas.height)

      try {
        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          intent: attempt.intent,
          background: 'white',
        })

        await Promise.race([
          renderTask.promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Render timeout')), 30000)
          )
        ])

        // Check if we got actual content
        if (checkHasContent(context, canvas.width, canvas.height)) {
          console.log(`Page ${pageNumber} rendered successfully with scale=${attempt.scale}, intent=${attempt.intent}`)
          return canvas.toDataURL('image/png')
        }

        console.warn(`Page ${pageNumber} appears blank with scale=${attempt.scale}, trying next approach...`)
      } catch (renderError) {
        console.warn(`Render attempt failed for page ${pageNumber}:`, renderError.message)
      }
    }

    // All attempts failed - return error image
    console.error(`All render attempts failed for page ${pageNumber}`)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 800
    canvas.height = 1100
    context.fillStyle = '#FEE2E2'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#DC2626'
    context.font = '24px sans-serif'
    context.textAlign = 'center'
    context.fillText('PDF rendering failed', canvas.width / 2, canvas.height / 2)
    context.fillText('Try a different PDF or browser', canvas.width / 2, canvas.height / 2 + 40)
    return canvas.toDataURL('image/png')
  }

  // Handle file upload - tries server-side rendering first (more robust), falls back to client-side
  const handleUpload = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setResults([{ success: false, message: 'Endast PDF-filer accepteras' }])
      return
    }

    setUploading(true)
    setResults([])

    try {
      // Auto-fill name from filename if empty
      const fileName = file.name.replace('.pdf', '').replace(/[-_]/g, ' ')
      const detectedStore = detectStore(fileName)

      // Get current week dates
      const now = new Date()
      const dayOfWeek = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      const defaultValidFrom = monday.toISOString().split('T')[0]
      const defaultValidTo = sunday.toISOString().split('T')[0]

      // Try server-side PDF rendering first (more robust for complex PDFs)
      setUploadProgress('Konverterar PDF på servern...')
      let renderedPages = null
      let useServerRendering = true

      try {
        const renderFormData = new FormData()
        renderFormData.append('pdf', file)

        const renderResponse = await fetch('/api/flyers/render-pdf', {
          method: 'POST',
          body: renderFormData,
        })

        const renderData = await renderResponse.json()

        if (renderData.success && renderData.pages?.length > 0) {
          renderedPages = renderData.pages
          console.log(`Server rendered ${renderedPages.length} pages successfully`)
        } else {
          throw new Error(renderData.error || 'Server rendering failed')
        }
      } catch (serverError) {
        console.warn('Server-side rendering failed, falling back to client-side:', serverError.message)
        useServerRendering = false
      }

      // Fall back to client-side rendering if server failed
      let numPages = renderedPages?.length || 0
      let pdf = null

      if (!useServerRendering) {
        setUploadProgress('Använder webbläsarrendering...')
        if (!pdfjsLib) {
          const pdfjs = await import('pdfjs-dist')
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
          pdfjsLib = pdfjs
        }

        const arrayBuffer = await file.arrayBuffer()
        pdf = await pdfjsLib.getDocument(getPdfLoadingOptions(arrayBuffer)).promise
        numPages = pdf.numPages
      }

      // Create flyer record
      setUploadProgress('Skapar reklamblad...')
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('store', newFlyer.store || detectedStore)
      formData.append('name', newFlyer.name || fileName)
      formData.append('validFrom', newFlyer.validFrom || defaultValidFrom)
      formData.append('validTo', newFlyer.validTo || defaultValidTo)
      formData.append('pageCount', numPages.toString())

      const uploadResponse = await fetch('/api/flyers/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Kunde inte skapa reklamblad')
      }

      const flyerId = uploadData.flyer.id

      // Upload each page
      for (let i = 1; i <= numPages; i++) {
        setUploadProgress(`Laddar upp sida ${i} av ${numPages}...`)

        let imageDataUrl
        if (useServerRendering && renderedPages) {
          // Use server-rendered image
          imageDataUrl = renderedPages[i - 1].image
        } else {
          // Use client-side rendering
          imageDataUrl = await renderPageToImage(pdf, i)
        }

        // Upload page image
        const pageFormData = new FormData()
        pageFormData.append('image', imageDataUrl)
        pageFormData.append('flyerId', flyerId)
        pageFormData.append('pageNumber', i.toString())

        await fetch('/api/flyers/upload-page', {
          method: 'POST',
          body: pageFormData,
        })
      }

      const renderMethod = useServerRendering ? 'server' : 'browser'
      setResults([{
        success: true,
        message: `${uploadData.flyer.name} uppladdat! ${numPages} sidor konverterade (${renderMethod}).`
      }])

      // Reset form
      setNewFlyer({ store: 'ICA', name: '', validFrom: '', validTo: '' })

      // Refresh flyers list
      await loadFlyers()

    } catch (error) {
      console.error('Upload error:', error)
      setResults([{ success: false, message: error.message }])
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  const detectStore = (filename) => {
    const lower = filename.toLowerCase()
    if (lower.includes('ica')) return 'ICA'
    if (lower.includes('coop')) return 'Coop'
    if (lower.includes('willys')) return 'Willys'
    if (lower.includes('hemköp')) return 'Hemköp'
    return 'ICA'
  }

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }

  // Process page with AI (with retry for rate limits)
  const processPage = async (pageId, imageUrl, pageNumber, retryCount = 0) => {
    setProcessingPage(pageId)

    try {
      const response = await fetch('/api/flyers/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flyerPageId: pageId, imageUrl, pageNumber }),
      })

      const data = await response.json()

      // Check for rate limit error
      if (data.error && data.error.includes('rate_limit') && retryCount < 3) {
        const waitTime = (retryCount + 1) * 60000 // Wait 1, 2, 3 minutes
        setResults(prev => [...prev, {
          success: false,
          message: `Sida ${pageNumber}: Rate limit - väntar ${(retryCount + 1)} minut(er)...`,
        }])
        await new Promise(r => setTimeout(r, waitTime))
        return processPage(pageId, imageUrl, pageNumber, retryCount + 1)
      }

      if (data.success) {
        setResults(prev => [...prev, {
          success: true,
          message: `Sida ${pageNumber}: Extraherade ${data.extractedCount} produkter, sparade ${data.savedCount}`,
        }])
        await loadFlyers()
      } else {
        setResults(prev => [...prev, {
          success: false,
          message: `Sida ${pageNumber}: ${data.error || 'Okänt fel'}`,
        }])
      }
    } catch (error) {
      setResults(prev => [...prev, {
        success: false,
        message: error.message,
      }])
    } finally {
      setProcessingPage(null)
    }
  }

  // Process all pages in a flyer (with longer delays to avoid rate limits)
  const processAllPages = async (flyer) => {
    // Fetch fresh page data to ensure we have all pages
    const { data: freshPages } = await supabase
      .from('flyer_pages')
      .select('*')
      .eq('flyer_id', flyer.id)
      .order('page_number', { ascending: true })

    const unprocessedPages = freshPages?.filter(p => !p.processed) || []

    if (unprocessedPages.length === 0) {
      setResults([{ success: true, message: 'Alla sidor är redan bearbetade!' }])
      return
    }

    setResults([{ success: true, message: `Startar bearbetning av ${unprocessedPages.length} sidor...` }])

    for (let i = 0; i < unprocessedPages.length; i++) {
      const page = unprocessedPages[i]
      setResults(prev => [...prev, {
        success: true,
        message: `Bearbetar sida ${page.page_number} (${i + 1}/${unprocessedPages.length})...`,
      }])
      await processPage(page.id, page.image_url, page.page_number)

      // Wait 10 seconds between pages to avoid rate limits
      if (i < unprocessedPages.length - 1) {
        setResults(prev => [...prev, {
          success: true,
          message: `Väntar 10 sekunder innan nästa sida...`,
        }])
        await new Promise(r => setTimeout(r, 10000))
      }
    }

    await supabase
      .from('flyers')
      .update({ status: 'completed' })
      .eq('id', flyer.id)

    setResults(prev => [...prev, {
      success: true,
      message: `✓ Alla ${unprocessedPages.length} sidor bearbetade!`,
    }])

    await loadFlyers()
  }

  // Delete flyer (via API with service role)
  const deleteFlyer = async (flyerId) => {
    if (!confirm('Är du säker på att du vill ta bort detta reklamblad och alla tillhörande sidor?')) return

    try {
      const response = await fetch('/api/flyers/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flyerId }),
      })

      const data = await response.json()

      if (!data.success) {
        alert(`Kunde inte ta bort: ${data.error}`)
        return
      }

      setFlyers(flyers.filter(f => f.id !== flyerId))
    } catch (error) {
      console.error('Error deleting flyer:', error)
      alert(`Kunde inte ta bort: ${error.message}`)
    }
  }

  // Clean up ALL flyer data to start fresh
  const cleanupAllData = async () => {
    if (!confirm('VARNING: Detta tar bort ALLA reklamblad, sidor, hotspots och AI-extraherade produkter. Vill du fortsätta?')) return

    setCleaningUp(true)
    setResults([{ success: true, message: 'Rensar all data...' }])

    try {
      const response = await fetch('/api/flyers/cleanup', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setResults([{
          success: true,
          message: `Rensning klar! Tog bort: ${data.deleted.flyers} reklamblad, ${data.deleted.pages} sidor, ${data.deleted.hotspots} hotspots, ${data.deleted.products} produkter, ${data.deleted.storageFiles} bilder.`,
        }])
        await loadFlyers()
      } else {
        setResults([{ success: false, message: `Fel: ${data.error}` }])
      }
    } catch (error) {
      setResults([{ success: false, message: error.message }])
    } finally {
      setCleaningUp(false)
    }
  }

  // Re-extract products (clear hotspots and reprocess)
  const reextractFlyer = async (flyer, deleteProducts = false) => {
    const confirmMsg = deleteProducts
      ? 'Detta tar bort alla hotspots OCH produkter för att extrahera på nytt. Fortsätt?'
      : 'Detta tar bort alla hotspots för att extrahera produkter på nytt. Fortsätt?'

    if (!confirm(confirmMsg)) return

    setResults([{ success: true, message: 'Rensar befintliga hotspots...' }])

    try {
      const response = await fetch('/api/flyers/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flyerId: flyer.id, deleteProducts }),
      })

      const data = await response.json()

      if (!data.success) {
        setResults([{ success: false, message: `Kunde inte rensa: ${data.error}` }])
        return
      }

      setResults([{
        success: true,
        message: `Rensade ${data.deletedHotspots} sidor. Klicka på "Extrahera produkter" för att köra om.`
      }])

      await loadFlyers()
    } catch (error) {
      setResults([{ success: false, message: error.message }])
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reklamblad Admin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ladda upp reklamblad och extrahera produkter automatiskt med AI
            </p>
          </div>
          <button
            onClick={cleanupAllData}
            disabled={cleaningUp}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {cleaningUp ? 'Rensar...' : 'Rensa all data'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="font-medium text-gray-900 dark:text-white mb-4">Ladda upp reklamblad</h2>

          {/* Optional metadata fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Butik</label>
              <select
                value={newFlyer.store}
                onChange={(e) => setNewFlyer({ ...newFlyer, store: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              >
                <option value="ICA">ICA</option>
                <option value="Coop">Coop</option>
                <option value="Willys">Willys</option>
                <option value="Hemköp">Hemköp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Namn (valfritt)</label>
              <input
                type="text"
                value={newFlyer.name}
                onChange={(e) => setNewFlyer({ ...newFlyer, name: e.target.value })}
                placeholder="T.ex. ICA Maxi Höganäs"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Gäller från</label>
              <input
                type="date"
                value={newFlyer.validFrom}
                onChange={(e) => setNewFlyer({ ...newFlyer, validFrom: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Gäller till</label>
              <input
                type="date"
                value={newFlyer.validTo}
                onChange={(e) => setNewFlyer({ ...newFlyer, validTo: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading ? (
              <div>
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-900 dark:text-white font-medium">{uploadProgress}</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-gray-900 dark:text-white font-medium">Dra och släpp PDF här</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">eller klicka för att välja fil</p>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-900 dark:text-white">Resultat</h2>
              <button
                onClick={() => setResults([])}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Rensa
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-md text-sm ${
                    result.success ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}
                >
                  {result.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Laddar reklamblad...</p>
          </div>
        )}

        {/* Flyers List */}
        {!loading && (
          <div className="space-y-4">
            <h2 className="font-medium text-gray-900 dark:text-white">Uppladdade reklamblad ({flyers.length})</h2>

            {flyers.map(flyer => (
              <div key={flyer.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Flyer Header */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      flyer.store === 'ICA' ? 'bg-red-500' :
                      flyer.store === 'Coop' ? 'bg-green-500' :
                      flyer.store === 'City Gross' ? 'bg-blue-500' :
                      flyer.store === 'Willys' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{flyer.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {flyer.pages?.length || 0} sidor •
                        {flyer.pages?.reduce((sum, p) => sum + (p.hotspots?.[0]?.count || 0), 0) || 0} produkter •
                        {flyer.valid_from && new Date(flyer.valid_from).toLocaleDateString('sv-SE')} - {flyer.valid_to && new Date(flyer.valid_to).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      flyer.status === 'completed' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                      flyer.status === 'ready' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' :
                      'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {flyer.status === 'completed' ? 'Klar' :
                       flyer.status === 'ready' ? 'Redo' : 'Väntar'}
                    </span>
                    {flyer.pages?.some(p => !p.processed) && flyer.status === 'ready' && (
                      <button
                        onClick={() => processAllPages(flyer)}
                        disabled={processingPage}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {processingPage ? 'Bearbetar...' : 'Extrahera produkter'}
                      </button>
                    )}
                    {flyer.status === 'completed' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => reextractFlyer(flyer, false)}
                          disabled={processingPage}
                          className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-l-md hover:bg-orange-600 disabled:opacity-50"
                          title="Behåll produkter, uppdatera bara hotspot-positioner"
                        >
                          Extrahera om
                        </button>
                        <button
                          onClick={() => reextractFlyer(flyer, true)}
                          disabled={processingPage}
                          className="px-2 py-1.5 text-sm bg-red-500 text-white rounded-r-md hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                          title="Ta bort produkter OCH hotspots, skapa allt nytt med nya bilder"
                        >
                          <span>+</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => deleteFlyer(flyer.id)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Pages */}
                {flyer.pages?.length > 0 && (
                  <div className="p-4">
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {flyer.pages.sort((a, b) => a.page_number - b.page_number).map(page => (
                        <div key={page.id} className="relative group">
                          <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded overflow-hidden border border-gray-200 dark:border-gray-600">
                            {page.image_url && !page.image_url.includes('.pdf') ? (
                              <img
                                src={page.image_url}
                                alt={`Sida ${page.page_number}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <span className="text-2xl">{page.page_number}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-1 text-xs text-center">
                            <p className="font-medium text-gray-700 dark:text-gray-300">Sida {page.page_number}</p>
                            <p className="text-gray-400 dark:text-gray-500">
                              {page.hotspots?.[0]?.count || 0} prod
                            </p>
                          </div>

                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                            page.processed ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />

                          {!page.processed && flyer.status === 'ready' && (
                            <button
                              onClick={() => processPage(page.id, page.image_url, page.page_number)}
                              disabled={processingPage === page.id}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
                            >
                              <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium text-gray-900 dark:text-white">
                                {processingPage === page.id ? '...' : 'Extrahera'}
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!flyer.pages || flyer.pages.length === 0) && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">Inga sidor</p>
                  </div>
                )}
              </div>
            ))}

            {flyers.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                <p>Inga reklamblad uppladdade ännu</p>
                <p className="text-sm mt-1">Dra och släpp en PDF ovan för att börja</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

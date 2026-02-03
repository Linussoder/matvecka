import sharp from 'sharp'

export const maxDuration = 300 // 5 minutes max for PDF processing

export async function POST(request) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf')

    if (!pdfFile) {
      return Response.json({ error: 'No PDF file provided' }, { status: 400 })
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
    console.log(`Processing PDF with Sharp: ${pdfFile.name}, size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB`)

    // Get PDF info using sharp
    const metadata = await sharp(pdfBuffer, {
      density: 200,  // DPI for PDF rendering
      pages: -1,     // Load all pages info
    }).metadata()

    const numPages = metadata.pages || 1
    console.log(`PDF has ${numPages} pages`)

    const pages = []

    // Render each page
    for (let i = 0; i < numPages; i++) {
      console.log(`Rendering page ${i + 1}/${numPages}...`)

      try {
        // Extract specific page from PDF
        const pageBuffer = await sharp(pdfBuffer, {
          density: 200,  // Good quality DPI
          page: i,       // Page index (0-based)
        })
          .png()
          .toBuffer()

        const base64 = pageBuffer.toString('base64')
        pages.push({
          pageNumber: i + 1,
          image: `data:image/png;base64,${base64}`,
        })

        console.log(`Page ${i + 1} rendered successfully (${(pageBuffer.length / 1024).toFixed(0)}KB)`)
      } catch (pageError) {
        console.error(`Error rendering page ${i + 1}:`, pageError.message)
        // Continue with other pages
      }
    }

    if (pages.length === 0) {
      throw new Error('No pages could be rendered')
    }

    console.log(`Successfully rendered ${pages.length} pages using Sharp`)

    return Response.json({
      success: true,
      pages,
      totalPages: pages.length,
      method: 'sharp-libvips',
    })

  } catch (error) {
    console.error('PDF rendering error:', error)
    return Response.json({
      error: error.message,
      hint: 'Sharp PDF support requires poppler or similar backend installed on the system'
    }, { status: 500 })
  }
}

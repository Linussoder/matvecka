import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf')
    const storeName = formData.get('store') || 'Okänd'
    const flyerName = formData.get('name') || storeName
    const validFrom = formData.get('validFrom')
    const validTo = formData.get('validTo')
    const pageCount = parseInt(formData.get('pageCount') || '1')

    if (!file) {
      return Response.json({ error: 'Ingen PDF-fil uppladdad' }, { status: 400 })
    }

    // Read PDF buffer
    const arrayBuffer = await file.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // Upload PDF to Supabase Storage
    const pdfFileName = `pdfs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { error: pdfUploadError } = await supabase.storage
      .from('flyer-images')
      .upload(pdfFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (pdfUploadError) {
      console.error('Error uploading PDF:', pdfUploadError)
      return Response.json({
        error: `Kunde inte ladda upp PDF: ${pdfUploadError.message || pdfUploadError.error || JSON.stringify(pdfUploadError)}`
      }, { status: 500 })
    }

    // Get PDF public URL
    const { data: { publicUrl: pdfUrl } } = supabase.storage
      .from('flyer-images')
      .getPublicUrl(pdfFileName)

    // Find or create week
    const week = await findOrCreateWeek(validFrom, validTo)

    // Create flyer record
    const { data: flyer, error: flyerError } = await supabase
      .from('flyers')
      .insert({
        week_id: week?.id,
        name: flyerName,
        store: storeName,
        valid_from: validFrom,
        valid_to: validTo,
        status: 'pending_images',
        page_count: pageCount,
        pdf_url: pdfUrl
      })
      .select()
      .single()

    if (flyerError) {
      console.error('Error creating flyer:', flyerError)
      return Response.json({
        error: `Kunde inte skapa reklamblad: ${flyerError.message || flyerError.details || JSON.stringify(flyerError)}`
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      flyer,
      pdfUrl,
      message: `PDF uppladdat! Konvertera nu sidorna till bilder.`
    })

  } catch (error) {
    console.error('Error processing PDF:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function findOrCreateWeek(validFrom, validTo) {
  if (!validFrom || !validTo) {
    // Get or create current week
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    validFrom = monday.toISOString().split('T')[0]
    validTo = sunday.toISOString().split('T')[0]
  }

  // Try to find existing week
  const { data: existingWeek } = await supabase
    .from('weeks')
    .select('*')
    .lte('start_date', validFrom)
    .gte('end_date', validTo)
    .single()

  if (existingWeek) {
    return existingWeek
  }

  // Create new week
  const { data: newWeek, error } = await supabase
    .from('weeks')
    .insert({
      start_date: validFrom,
      end_date: validTo
    })
    .select()
    .single()

  if (error) {
    // Try to find any recent week
    const { data: anyWeek } = await supabase
      .from('weeks')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    return anyWeek
  }

  return newWeek
}

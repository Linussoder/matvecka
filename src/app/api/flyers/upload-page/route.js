import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') // base64 or blob
    const flyerId = formData.get('flyerId')
    const pageNumber = parseInt(formData.get('pageNumber') || '1')

    if (!image || !flyerId) {
      return Response.json({ error: 'Bild och flyerId krävs' }, { status: 400 })
    }

    let imageBuffer

    // Handle both base64 string and blob
    if (typeof image === 'string') {
      // Remove data URL prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
      imageBuffer = Buffer.from(base64Data, 'base64')
    } else {
      const arrayBuffer = await image.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    }

    // Upload image to Supabase Storage
    const fileName = `${flyerId}/page-${pageNumber}.png`
    const { error: uploadError } = await supabase.storage
      .from('flyer-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return Response.json({ error: 'Kunde inte ladda upp bild' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('flyer-images')
      .getPublicUrl(fileName)

    // Check if page already exists
    const { data: existingPage } = await supabase
      .from('flyer_pages')
      .select('id')
      .eq('flyer_id', flyerId)
      .eq('page_number', pageNumber)
      .single()

    let pageData

    if (existingPage) {
      // Update existing page
      const { data, error } = await supabase
        .from('flyer_pages')
        .update({
          image_url: publicUrl,
          processed: false
        })
        .eq('id', existingPage.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating page:', error)
        return Response.json({ error: 'Kunde inte uppdatera sida' }, { status: 500 })
      }
      pageData = data
    } else {
      // Create new page record
      const { data, error } = await supabase
        .from('flyer_pages')
        .insert({
          flyer_id: flyerId,
          page_number: pageNumber,
          image_url: publicUrl,
          processed: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating page:', error)
        return Response.json({ error: 'Kunde inte skapa sida' }, { status: 500 })
      }
      pageData = data
    }

    // Update flyer status if this is the first page
    if (pageNumber === 1) {
      await supabase
        .from('flyers')
        .update({ status: 'ready' })
        .eq('id', flyerId)
    }

    return Response.json({
      success: true,
      page: pageData,
      imageUrl: publicUrl
    })

  } catch (error) {
    console.error('Error uploading page:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

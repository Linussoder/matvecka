import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request) {
  try {
    const { flyerId } = await request.json()

    if (!flyerId) {
      return Response.json({ error: 'flyerId krävs' }, { status: 400 })
    }

    // Get all page IDs for this flyer
    const { data: pages } = await supabase
      .from('flyer_pages')
      .select('id')
      .eq('flyer_id', flyerId)

    const pageIds = pages?.map(p => p.id) || []

    // Delete hotspots for all pages
    if (pageIds.length > 0) {
      const { error: hotspotError } = await supabase
        .from('flyer_hotspots')
        .delete()
        .in('flyer_page_id', pageIds)

      if (hotspotError) {
        console.error('Error deleting hotspots:', hotspotError)
      }
    }

    // Delete all pages
    const { error: pagesError } = await supabase
      .from('flyer_pages')
      .delete()
      .eq('flyer_id', flyerId)

    if (pagesError) {
      console.error('Error deleting pages:', pagesError)
    }

    // Delete the flyer
    const { error: flyerError } = await supabase
      .from('flyers')
      .delete()
      .eq('id', flyerId)

    if (flyerError) {
      console.error('Error deleting flyer:', flyerError)
      return Response.json({ error: flyerError.message }, { status: 500 })
    }

    return Response.json({ success: true })

  } catch (error) {
    console.error('Error in delete:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

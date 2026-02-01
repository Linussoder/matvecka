import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { flyerId, deleteProducts } = await request.json()

    if (!flyerId) {
      return Response.json({ error: 'flyerId krävs' }, { status: 400 })
    }

    // Get all pages for this flyer
    const { data: pages } = await supabase
      .from('flyer_pages')
      .select('id')
      .eq('flyer_id', flyerId)

    const pageIds = pages?.map(p => p.id) || []

    if (pageIds.length === 0) {
      return Response.json({ error: 'Inga sidor hittades' }, { status: 404 })
    }

    // Get product IDs from hotspots before deleting (if we need to delete products too)
    let productIds = []
    if (deleteProducts) {
      const { data: hotspots } = await supabase
        .from('flyer_hotspots')
        .select('product_id')
        .in('flyer_page_id', pageIds)

      productIds = [...new Set(hotspots?.map(h => h.product_id) || [])]
    }

    // Delete all hotspots for this flyer's pages
    const { error: hotspotError } = await supabase
      .from('flyer_hotspots')
      .delete()
      .in('flyer_page_id', pageIds)

    if (hotspotError) {
      console.error('Error deleting hotspots:', hotspotError)
      return Response.json({ error: 'Kunde inte ta bort hotspots' }, { status: 500 })
    }

    // Delete products if requested
    if (deleteProducts && productIds.length > 0) {
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .in('id', productIds)
        .eq('source', 'ai_extracted') // Only delete AI-extracted products

      if (productError) {
        console.error('Error deleting products:', productError)
      }
    }

    // Mark all pages as unprocessed
    const { error: pageError } = await supabase
      .from('flyer_pages')
      .update({ processed: false })
      .eq('flyer_id', flyerId)

    if (pageError) {
      console.error('Error updating pages:', pageError)
    }

    // Update flyer status
    await supabase
      .from('flyers')
      .update({ status: 'ready' })
      .eq('id', flyerId)

    return Response.json({
      success: true,
      deletedHotspots: pageIds.length,
      deletedProducts: deleteProducts ? productIds.length : 0
    })

  } catch (error) {
    console.error('Error in reprocess:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

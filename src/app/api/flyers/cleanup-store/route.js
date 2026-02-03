import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { store } = await request.json()

    if (!store) {
      return Response.json({ error: 'Store parameter required' }, { status: 400 })
    }

    console.log(`Cleaning up data for store: ${store}`)

    // Get flyers for this store
    const { data: flyers } = await supabase
      .from('flyers')
      .select('id')
      .eq('store', store)

    const flyerIds = flyers?.map(f => f.id) || []
    console.log(`Found ${flyerIds.length} flyers for ${store}`)

    let deletedHotspots = 0
    let deletedPages = 0
    let deletedProducts = 0
    let deletedFlyers = 0

    if (flyerIds.length > 0) {
      // Get page IDs for these flyers
      const { data: pages } = await supabase
        .from('flyer_pages')
        .select('id')
        .in('flyer_id', flyerIds)

      const pageIds = pages?.map(p => p.id) || []

      // Delete hotspots for these pages
      if (pageIds.length > 0) {
        const { data: deletedH } = await supabase
          .from('flyer_hotspots')
          .delete()
          .in('flyer_page_id', pageIds)
          .select()
        deletedHotspots = deletedH?.length || 0
      }

      // Delete pages
      const { data: deletedP } = await supabase
        .from('flyer_pages')
        .delete()
        .in('flyer_id', flyerIds)
        .select()
      deletedPages = deletedP?.length || 0

      // Delete flyers
      const { data: deletedF } = await supabase
        .from('flyers')
        .delete()
        .in('id', flyerIds)
        .select()
      deletedFlyers = deletedF?.length || 0
    }

    // Delete products for this store (AI-extracted ones)
    const { data: deletedProd } = await supabase
      .from('products')
      .delete()
      .eq('store', store)
      .eq('source', 'ai_extracted')
      .select()
    deletedProducts = deletedProd?.length || 0

    // Clean up storage files for these flyers
    for (const flyerId of flyerIds) {
      try {
        // List and delete page images
        const { data: pageFiles } = await supabase.storage
          .from('flyer-images')
          .list(flyerId)

        if (pageFiles?.length > 0) {
          const filePaths = pageFiles.map(f => `${flyerId}/${f.name}`)
          await supabase.storage.from('flyer-images').remove(filePaths)
        }

        // List and delete product images
        const { data: productFiles } = await supabase.storage
          .from('flyer-images')
          .list(`products/${flyerId}`)

        if (productFiles?.length > 0) {
          const productPaths = productFiles.map(f => `products/${flyerId}/${f.name}`)
          await supabase.storage.from('flyer-images').remove(productPaths)
        }
      } catch (storageError) {
        console.error('Storage cleanup error:', storageError)
      }
    }

    return Response.json({
      success: true,
      store,
      deleted: {
        flyers: deletedFlyers,
        pages: deletedPages,
        hotspots: deletedHotspots,
        products: deletedProducts
      }
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

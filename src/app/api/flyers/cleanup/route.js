import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const results = {
      hotspots: 0,
      pages: 0,
      flyers: 0,
      products: 0,
      storageFiles: 0,
    }

    // 1. Delete all flyer hotspots
    const { data: deletedHotspots, error: hotspotsError } = await supabase
      .from('flyer_hotspots')
      .delete()
      .neq('id', 0) // Delete all
      .select('id')

    if (hotspotsError) {
      console.error('Error deleting hotspots:', hotspotsError)
    } else {
      results.hotspots = deletedHotspots?.length || 0
    }

    // 2. Delete all flyer pages
    const { data: deletedPages, error: pagesError } = await supabase
      .from('flyer_pages')
      .delete()
      .neq('id', 0)
      .select('id')

    if (pagesError) {
      console.error('Error deleting pages:', pagesError)
    } else {
      results.pages = deletedPages?.length || 0
    }

    // 3. Delete all flyers
    const { data: deletedFlyers, error: flyersError } = await supabase
      .from('flyers')
      .delete()
      .neq('id', 0)
      .select('id')

    if (flyersError) {
      console.error('Error deleting flyers:', flyersError)
    } else {
      results.flyers = deletedFlyers?.length || 0
    }

    // 4. Delete AI-extracted products
    const { data: deletedProducts, error: productsError } = await supabase
      .from('products')
      .delete()
      .eq('source', 'ai_extracted')
      .select('id')

    if (productsError) {
      console.error('Error deleting AI-extracted products:', productsError)
    } else {
      results.products = deletedProducts?.length || 0
    }

    // 5. Clean up storage - delete flyer images and product images
    try {
      // List and delete flyer page images
      const { data: flyerFiles } = await supabase.storage
        .from('flyer-images')
        .list('pages', { limit: 1000 })

      if (flyerFiles && flyerFiles.length > 0) {
        const filePaths = flyerFiles.map(f => `pages/${f.name}`)
        await supabase.storage.from('flyer-images').remove(filePaths)
        results.storageFiles += flyerFiles.length
      }

      // List and delete product images
      const { data: productFolders } = await supabase.storage
        .from('flyer-images')
        .list('products', { limit: 1000 })

      if (productFolders && productFolders.length > 0) {
        for (const folder of productFolders) {
          const { data: productFiles } = await supabase.storage
            .from('flyer-images')
            .list(`products/${folder.name}`, { limit: 1000 })

          if (productFiles && productFiles.length > 0) {
            const filePaths = productFiles.map(f => `products/${folder.name}/${f.name}`)
            await supabase.storage.from('flyer-images').remove(filePaths)
            results.storageFiles += productFiles.length
          }
        }
      }
    } catch (storageError) {
      console.error('Error cleaning storage:', storageError)
    }

    console.log('Cleanup completed:', results)

    return Response.json({
      success: true,
      message: 'All flyer data has been deleted',
      deleted: results,
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

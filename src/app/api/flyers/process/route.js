import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Crop product image with generous margins to capture full product
// Expands crop area by 20% in each direction to ensure product is centered
async function cropProductImage(pageImageBuffer, product, flyerId, productId) {
  try {
    const metadata = await sharp(pageImageBuffer).metadata()
    const imgWidth = metadata.width
    const imgHeight = metadata.height

    // Expand crop area by 20% in each direction for a more generous crop
    // This ensures we capture the full product even if hotspot is slightly off
    const expandPercent = 0.20
    const cropX = Math.max(0, product.x - (product.width * expandPercent))
    const cropY = Math.max(0, product.y - (product.height * expandPercent))
    const cropWidth = Math.min(100 - cropX, product.width * (1 + expandPercent * 2))
    const cropHeight = Math.min(100 - cropY, product.height * (1 + expandPercent * 2))

    // Convert percentages to pixels
    const left = Math.round((cropX / 100) * imgWidth)
    const top = Math.round((cropY / 100) * imgHeight)
    const width = Math.round((cropWidth / 100) * imgWidth)
    const height = Math.round((cropHeight / 100) * imgHeight)

    // Ensure values are within bounds
    const safeLeft = Math.max(0, Math.min(left, imgWidth - 10))
    const safeTop = Math.max(0, Math.min(top, imgHeight - 10))
    const safeWidth = Math.min(Math.max(width, 50), imgWidth - safeLeft)
    const safeHeight = Math.min(Math.max(height, 50), imgHeight - safeTop)

    if (safeWidth < 30 || safeHeight < 30) {
      console.log('Crop area too small, skipping')
      return null
    }

    const croppedBuffer = await sharp(pageImageBuffer)
      .extract({
        left: safeLeft,
        top: safeTop,
        width: safeWidth,
        height: safeHeight
      })
      .resize(400, 400, { fit: 'cover', position: 'top' })  // Cover with focus on top (product image)
      .png()
      .toBuffer()

    const fileName = `products/${flyerId}/${productId}.png`
    const { error: uploadError } = await supabase.storage
      .from('flyer-images')
      .upload(fileName, croppedBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading cropped image:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('flyer-images')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error cropping product image:', error)
    return null
  }
}

// Extract products with direct bounding box coordinates (no grid assumption)
async function extractProductsWithBoundingBoxes(fileBuffer, mediaType, store) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: fileBuffer.toString('base64'),
            },
          },
          {
            type: 'text',
            text: `Analysera detta ${store} reklamblad och identifiera ALLA produkter med erbjudanden.

För VARJE produkt, ange dessa fält (alla är obligatoriska):
- name: Produktnamn på svenska
- price: Pris i kronor (endast nummer, t.ex. 29.90 eller 49)
- original_price: Ordinarie pris om det visas (annars null)
- unit: Enhet (st, kg, l, förp, etc.)
- category: En av: Kött, Fisk, Mejeri, Grönsaker, Frukt, Fryst, Skafferi, Bröd, Dryck, Snacks, Hygien, Övrigt
- x: Vänster kant av produktrutan i PROCENT av bildens bredd (0-100)
- y: ÖVRE kant där PRODUKTBILDEN börjar i PROCENT av bildens höjd (0-100)
- width: Produktrutans bredd i PROCENT (typiskt 15-35)
- height: Produktrutans TOTALA höjd i PROCENT (typiskt 20-35)

KRITISKT för koordinaterna:
- y ska peka på TOPPEN där produktbilden/förpackningen BÖRJAR (inte pristexten!)
- Produktbilder är vanligtvis OVANFÖR pristexten i reklamblad
- Inkludera HELA produktrutan från produktbild överst till pris nederst
- Mät från bildens absoluta övre vänstra hörn (0,0)
- height ska inkludera både produktbild OCH pristext

Svara ENDAST med en JSON-array (ingen annan text):
[
  {"name": "Kycklingfilé", "price": 89.90, "original_price": 129, "unit": "kg", "category": "Kött", "x": 0, "y": 10, "width": 25, "height": 28},
  {"name": "Mjölk", "price": 15, "original_price": null, "unit": "l", "category": "Mejeri", "x": 25, "y": 10, "width": 25, "height": 28}
]`
          }
        ],
      }
    ],
  })

  const content = response.content[0].text
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  const products = JSON.parse(jsonStr)

  // Validate and normalize coordinates
  // Apply Y-offset correction: shift UP by 15% of height to compensate for AI
  // tendency to detect from middle/price area instead of top of product image
  return products.map(p => {
    const rawY = p.y || 0
    const height = Math.max(5, Math.min(50, p.height || 25))
    const yOffset = height * 0.15  // Shift up by 15% of height
    const adjustedY = Math.max(0, rawY - yOffset)

    return {
      ...p,
      x: Math.max(0, Math.min(100, p.x || 0)),
      y: adjustedY,
      width: Math.max(5, Math.min(50, p.width || 20)),
      height: height,
      unit: p.unit || 'st',
      category: p.category || 'Övrigt',
      confidence: 0.85,
    }
  })
}

export async function POST(request) {
  try {
    const { flyerPageId, imageUrl, pageNumber } = await request.json()

    // Get flyer page info
    const { data: pageData } = await supabase
      .from('flyer_pages')
      .select(`
        *,
        flyer:flyers(*)
      `)
      .eq('id', flyerPageId)
      .single()

    const store = pageData?.flyer?.store || 'ICA'
    const weekId = pageData?.flyer?.week_id
    const flyerId = pageData?.flyer?.id

    const pageImageUrl = pageData?.image_url || imageUrl

    // Fetch the page image
    const fileResponse = await fetch(pageImageUrl)
    let fileBuffer = Buffer.from(await fileResponse.arrayBuffer())

    // Detect image format and compress if needed
    // Claude API has 5MB limit, but base64 encoding adds ~33% overhead
    // So we need to keep the raw file under ~3.5MB to be safe
    let mediaType = 'image/png' // Default since our pages are stored as PNG
    const MAX_SIZE = 3.5 * 1024 * 1024 // 3.5MB to account for base64 overhead

    if (fileBuffer.length > MAX_SIZE) {
      console.log(`Image too large (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB), compressing...`)
      fileBuffer = await sharp(fileBuffer)
        .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer()
      mediaType = 'image/jpeg' // Now it's JPEG after compression
      console.log(`Compressed to ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB`)

      // If still too large, compress more aggressively
      if (fileBuffer.length > MAX_SIZE) {
        console.log('Still too large, compressing more...')
        fileBuffer = await sharp(fileBuffer)
          .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 60 })
          .toBuffer()
        console.log(`Compressed to ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB`)
      }
    }

    let products = []

    // DIRECT BOUNDING BOX DETECTION (single-pass, more accurate)
    console.log('Extracting products with direct bounding boxes...')

    try {
      products = await extractProductsWithBoundingBoxes(fileBuffer, mediaType, store)
      console.log(`Found ${products.length} products with bounding box detection`)
    } catch (extractError) {
      console.error('Product extraction failed:', extractError)
      return Response.json({ error: 'Failed to extract products: ' + extractError.message }, { status: 500 })
    }

    // Save products and hotspots to database
    const savedProducts = []
    const skippedDuplicates = []

    for (const product of products) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id, image_url')
        .eq('name', product.name)
        .eq('store', store)
        .single()

      let productData = existingProduct
      let isNewProduct = false

      if (!existingProduct) {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            week_id: weekId,
            name: product.name,
            price: product.price,
            original_price: product.original_price,
            unit: product.unit || 'st',
            category: product.category || 'Övrigt',
            store: store,
            source: 'ai_extracted',
          })
          .select()
          .single()

        if (productError) {
          console.error('Error saving product:', productError)
          continue
        }

        productData = newProduct
        isNewProduct = true
      } else {
        if (existingProduct && product.price) {
          await supabase
            .from('products')
            .update({
              price: product.price,
              original_price: product.original_price,
            })
            .eq('id', existingProduct.id)
        }
        skippedDuplicates.push(product.name)
      }

      // Crop and upload product image
      if (isNewProduct || !productData.image_url) {
        const productImageUrl = await cropProductImage(fileBuffer, product, flyerId, productData.id)

        if (productImageUrl) {
          await supabase
            .from('products')
            .update({ image_url: productImageUrl })
            .eq('id', productData.id)

          productData.image_url = productImageUrl
        }
      }

      // Create hotspot
      const { data: existingHotspot } = await supabase
        .from('flyer_hotspots')
        .select('id')
        .eq('flyer_page_id', flyerPageId)
        .eq('product_id', productData.id)
        .single()

      if (!existingHotspot) {
        const { data: hotspotData, error: hotspotError } = await supabase
          .from('flyer_hotspots')
          .insert({
            flyer_page_id: flyerPageId,
            product_id: productData.id,
            x: product.x,
            y: product.y,
            width: product.width,
            height: product.height,
            confidence: product.confidence || 0.8,
          })
          .select()
          .single()

        if (!hotspotError) {
          savedProducts.push({
            product: productData,
            hotspot: hotspotData,
            isNew: isNewProduct,
          })
        }
      }
    }

    console.log(`Skipped ${skippedDuplicates.length} duplicates`)

    // Mark page as processed
    await supabase
      .from('flyer_pages')
      .update({ processed: true })
      .eq('id', flyerPageId)

    return Response.json({
      success: true,
      extractedCount: products.length,
      savedCount: savedProducts.length,
      products: savedProducts,
      method: 'grid-based',
    })

  } catch (error) {
    console.error('Error processing flyer:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

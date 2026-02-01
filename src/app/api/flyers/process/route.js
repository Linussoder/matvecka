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

// Crop product image from the CENTER of a grid cell
async function cropProductImage(pageImageBuffer, product, flyerId, productId) {
  try {
    const metadata = await sharp(pageImageBuffer).metadata()
    const imgWidth = metadata.width
    const imgHeight = metadata.height

    // Calculate center of the hotspot
    const centerX = product.x + (product.width / 2)
    const centerY = product.y + (product.height / 2)

    // Crop a square region from the center (70% of cell size for product image)
    const cropSize = Math.min(product.width, product.height) * 0.7
    const cropX = centerX - (cropSize / 2)
    const cropY = centerY - (cropSize / 2)

    // Convert percentages to pixels
    const left = Math.round((cropX / 100) * imgWidth)
    const top = Math.round((cropY / 100) * imgHeight)
    const width = Math.round((cropSize / 100) * imgWidth)
    const height = Math.round((cropSize / 100) * imgHeight)

    // Ensure values are within bounds
    const safeLeft = Math.max(0, Math.min(left, imgWidth - 1))
    const safeTop = Math.max(0, Math.min(top, imgHeight - 1))
    const safeWidth = Math.min(width, imgWidth - safeLeft)
    const safeHeight = Math.min(height, imgHeight - safeTop)

    if (safeWidth < 10 || safeHeight < 10) {
      return null
    }

    const croppedBuffer = await sharp(pageImageBuffer)
      .extract({
        left: safeLeft,
        top: safeTop,
        width: safeWidth,
        height: safeHeight
      })
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
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

// STEP 1: Analyze the flyer's grid structure
async function analyzeGridStructure(fileBuffer, mediaType, store) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
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
            text: `Analysera layouten för detta ${store} reklamblad.

Räkna antalet KOLUMNER och RADER av produktrutor i reklamet.

VIKTIGT:
- Varje produkt har typiskt en bild + pristext i en ruta
- Räkna endast synliga produktrutor (inte tomma ytor eller banners)
- Ignorera sidhuvud/sidfot/logotyper

Svara ENDAST med JSON:
{
  "columns": <antal kolumner, typiskt 2-5>,
  "rows": <antal rader, typiskt 2-6>,
  "hasHeader": <true om det finns header/banner högst upp>,
  "headerHeight": <uppskattad höjd i % om header finns, annars 0>,
  "hasFooter": <true om det finns footer längst ner>,
  "footerHeight": <uppskattad höjd i % om footer finns, annars 0>,
  "notes": "<eventuella observationer om layouten>"
}`
          }
        ],
      }
    ],
  })

  const content = response.content[0].text
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonStr)
}

// STEP 2: Identify products in each grid cell
async function identifyProductsInGrid(fileBuffer, mediaType, store, gridInfo) {
  const { columns, rows, hasHeader, headerHeight, hasFooter, footerHeight } = gridInfo

  // Calculate usable area
  const startY = hasHeader ? headerHeight : 0
  const endY = hasFooter ? (100 - footerHeight) : 100
  const usableHeight = endY - startY

  // Calculate cell dimensions
  const cellWidth = 100 / columns
  const cellHeight = usableHeight / rows

  // Build cell reference for AI
  let cellReference = 'Grid-celler (rad, kolumn):\n'
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cellX = col * cellWidth
      const cellY = startY + (row * cellHeight)
      cellReference += `[${row + 1},${col + 1}]: x=${cellX.toFixed(0)}%-${(cellX + cellWidth).toFixed(0)}%, y=${cellY.toFixed(0)}%-${(cellY + cellHeight).toFixed(0)}%\n`
    }
  }

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
            text: `Detta ${store} reklamblad har ${columns} kolumner och ${rows} rader med produkter.

${cellReference}

För VARJE cell som innehåller en produkt, identifiera:
- row: Radnummer (1-${rows})
- col: Kolumnnummer (1-${columns})
- name: Produktnamn på svenska
- price: Pris i kronor (endast siffror, t.ex. 29.90)
- original_price: Ordinarie pris om det visas (annars null)
- unit: Enhet (st, kg, l, förp, etc.)
- category: Kategori (Kött, Fisk, Mejeri, Grönsaker, Frukt, Fryst, Skafferi, Bröd, Dryck, Snacks, Hygien, Övrigt)

VIKTIGT:
- En produkt per cell
- Hoppa över tomma celler eller celler utan produkt
- Ignorera icke-matprodukter

Svara ENDAST med JSON-array:
[
  {"row": 1, "col": 1, "name": "Kycklingfilé", "price": 89.90, "original_price": 129, "unit": "kg", "category": "Kött"},
  {"row": 1, "col": 2, "name": "Mjölk", "price": 15, "original_price": null, "unit": "l", "category": "Mejeri"}
]`
          }
        ],
      }
    ],
  })

  const content = response.content[0].text
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const products = JSON.parse(jsonStr)

  // Convert grid positions to hotspot coordinates
  return products.map(p => {
    const cellX = (p.col - 1) * cellWidth
    const cellY = startY + ((p.row - 1) * cellHeight)

    // Add small padding (2%) to avoid edge overlap
    const padding = 1

    return {
      name: p.name,
      price: p.price,
      original_price: p.original_price,
      unit: p.unit || 'st',
      category: p.category || 'Övrigt',
      x: cellX + padding,
      y: cellY + padding,
      width: cellWidth - (padding * 2),
      height: cellHeight - (padding * 2),
      confidence: 0.9,
      gridPosition: { row: p.row, col: p.col }
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

    // Compress image if too large (Claude API limit is 5MB)
    const MAX_SIZE = 4 * 1024 * 1024 // 4MB to be safe
    if (fileBuffer.length > MAX_SIZE) {
      console.log(`Image too large (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB), compressing...`)
      fileBuffer = await sharp(fileBuffer)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()
      console.log(`Compressed to ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB`)
    }

    const mediaType = 'image/jpeg'

    let products = []

    // GRID-BASED DETECTION (Two-pass approach)
    console.log('STEP 1: Analyzing grid structure...')

    try {
      const gridInfo = await analyzeGridStructure(fileBuffer, mediaType, store)
      console.log(`Grid detected: ${gridInfo.columns} columns x ${gridInfo.rows} rows`)
      console.log(`Header: ${gridInfo.hasHeader ? gridInfo.headerHeight + '%' : 'none'}, Footer: ${gridInfo.hasFooter ? gridInfo.footerHeight + '%' : 'none'}`)

      console.log('STEP 2: Identifying products in grid cells...')
      products = await identifyProductsInGrid(fileBuffer, mediaType, store, gridInfo)
      console.log(`Found ${products.length} products using grid-based detection`)

    } catch (gridError) {
      console.error('Grid-based detection failed, using fallback:', gridError)

      // FALLBACK: Simple AI extraction
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
                text: `Analysera detta ${store} reklamblad och extrahera ALLA produkter.

För varje produkt, ange:
1. name: Produktnamn (svenska)
2. price: Pris i kronor (nummer)
3. original_price: Ordinarie pris om visat (annars null)
4. unit: Enhet (st, kg, l, förp)
5. category: Kategori (Kött, Fisk, Mejeri, Grönsaker, Frukt, Fryst, Skafferi, Bröd, Dryck, Snacks, Hygien, Övrigt)
6. x: Vänster kant i procent (0-100)
7. y: Övre kant i procent (0-100)
8. width: Bredd i procent (typiskt 20-35)
9. height: Höjd i procent (typiskt 15-25)

Svara ENDAST med JSON-array:
[{"name": "Kycklingfilé", "price": 89.90, "original_price": 129, "unit": "kg", "category": "Kött", "x": 0, "y": 10, "width": 25, "height": 20}]`
              }
            ],
          }
        ],
      })

      try {
        const content = response.content[0].text
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        products = JSON.parse(jsonStr).map(p => ({
          ...p,
          unit: p.unit || 'st',
          category: p.category || 'Övrigt',
          confidence: 0.7,
        }))
      } catch (parseError) {
        console.error('Failed to parse fallback AI response:', parseError)
        return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
      }
    }

    // Validate coordinates
    products = products.map(p => ({
      ...p,
      x: Math.max(0, Math.min(100 - (p.width || 20), p.x || 0)),
      y: Math.max(0, Math.min(100 - (p.height || 18), p.y || 0)),
      width: Math.max(5, Math.min(50, p.width || 22)),
      height: Math.max(5, Math.min(40, p.height || 18)),
    }))

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

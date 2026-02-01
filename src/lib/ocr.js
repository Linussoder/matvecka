import vision from '@google-cloud/vision'

// Price patterns common in Swedish grocery flyers
const PRICE_PATTERNS = [
  /(\d{1,3})[,.](\d{2})\s*(kr)?/i,     // 49,90 or 49.90 or 49,90 kr
  /(\d{1,3}):-/,                        // 49:-
  /(\d{1,3})\s*kr/i,                    // 49 kr
  /(\d{1,3})\/(\w+)/,                   // 49/kg, 49/st
]

// Initialize Google Cloud Vision client
function getVisionClient() {
  // Check if we have credentials
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    // Parse JSON credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
    return new vision.ImageAnnotatorClient({ credentials })
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use file path (set by Google Cloud SDK)
    return new vision.ImageAnnotatorClient()
  } else {
    console.warn('No Google Cloud credentials found. OCR will be disabled.')
    return null
  }
}

/**
 * Detect prices and their positions in an image using Google Cloud Vision OCR
 * @param {Buffer} imageBuffer - The image buffer to process
 * @returns {Promise<Array>} Array of detected prices with positions
 */
export async function detectPricesWithOCR(imageBuffer) {
  const client = getVisionClient()

  if (!client) {
    console.log('Google Cloud Vision not configured - using AI-only fallback')
    return []
  }

  try {
    console.log('Running Google Cloud Vision OCR...')

    // Call Google Cloud Vision API
    const [result] = await client.textDetection({
      image: { content: imageBuffer.toString('base64') }
    })

    const detections = result.textAnnotations || []

    if (detections.length === 0) {
      console.log('No text detected by OCR')
      return []
    }

    // First detection is the full text, skip it
    const words = detections.slice(1)

    // Get image dimensions from the full text bounding box
    const fullTextBounds = detections[0]?.boundingPoly?.vertices || []
    const imageWidth = Math.max(...fullTextBounds.map(v => v.x || 0)) || 1000
    const imageHeight = Math.max(...fullTextBounds.map(v => v.y || 0)) || 1400

    console.log(`OCR found ${words.length} text elements`)

    // Find all price-like text with positions
    const detectedPrices = []

    for (const word of words) {
      const text = word.description?.trim() || ''
      const vertices = word.boundingPoly?.vertices || []

      if (vertices.length < 4) continue

      // Check if this looks like a price
      for (const pattern of PRICE_PATTERNS) {
        const match = text.match(pattern)
        if (match) {
          // Calculate bounding box
          const minX = Math.min(...vertices.map(v => v.x || 0))
          const maxX = Math.max(...vertices.map(v => v.x || 0))
          const minY = Math.min(...vertices.map(v => v.y || 0))
          const maxY = Math.max(...vertices.map(v => v.y || 0))

          // Convert to percentages
          const x = (minX / imageWidth) * 100
          const y = (minY / imageHeight) * 100
          const width = ((maxX - minX) / imageWidth) * 100
          const height = ((maxY - minY) / imageHeight) * 100

          // Parse the price value
          let priceValue = 0
          if (match[2] && match[2].match(/\d/)) {
            // Has decimal (49,90 or 49.90)
            priceValue = parseFloat(`${match[1]}.${match[2]}`)
          } else {
            priceValue = parseInt(match[1])
          }

          // Only include reasonable prices (5-999 kr)
          if (priceValue >= 5 && priceValue <= 999) {
            detectedPrices.push({
              text: text,
              price: priceValue,
              confidence: 0.95, // Google Vision is very accurate
              // Position of the price text
              priceX: x,
              priceY: y,
              priceWidth: width,
              priceHeight: height,
              // Hotspot covers the product area (above and around the price)
              hotspotX: Math.max(0, x - 3),
              hotspotY: Math.max(0, y - 15), // Product image is above price
              hotspotWidth: Math.min(28, width + 15),
              hotspotHeight: 18,
            })
          }
          break
        }
      }
    }

    // Remove duplicates (same price at very similar positions)
    const uniquePrices = []
    for (const price of detectedPrices) {
      const isDuplicate = uniquePrices.some(existing => {
        const xDiff = Math.abs(existing.priceX - price.priceX)
        const yDiff = Math.abs(existing.priceY - price.priceY)
        return xDiff < 5 && yDiff < 5 && existing.price === price.price
      })
      if (!isDuplicate) {
        uniquePrices.push(price)
      }
    }

    // Sort by position (top-to-bottom, left-to-right)
    uniquePrices.sort((a, b) => {
      const rowDiff = Math.floor(a.priceY / 12) - Math.floor(b.priceY / 12)
      if (rowDiff !== 0) return rowDiff
      return a.priceX - b.priceX
    })

    console.log(`OCR found ${uniquePrices.length} prices`)
    return uniquePrices

  } catch (error) {
    console.error('Google Cloud Vision Error:', error.message)
    return []
  }
}

/**
 * Format detected prices for AI prompt
 */
export function formatPricesForPrompt(prices) {
  if (prices.length === 0) return ''

  return prices.map((p, i) =>
    `Position ${i + 1}: Pris ${p.price} kr vid x=${Math.round(p.priceX)}%, y=${Math.round(p.priceY)}%`
  ).join('\n')
}

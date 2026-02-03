import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// Cache configuration from the codebase
const CACHE_CONFIG = [
  { key: 'products', description: 'Produktdata från reklamblad', swrDuration: '1h' },
  { key: 'flyers', description: 'Aktiva reklamblad', swrDuration: '30min' },
  { key: 'user-preferences', description: 'Användarpreferenser', swrDuration: '5min' },
  { key: 'meal-plans', description: 'Genererade matplaner', swrDuration: 'session' },
  { key: 'analytics', description: 'Statistik och rapporter', swrDuration: '15min' },
  { key: 'segments', description: 'Användarsegment', swrDuration: '1h' },
]

// GET - Get cache status
export async function GET() {
  try {
    // In Next.js, we don't have direct access to SWR cache state from server
    // Return cache configuration and estimated state

    return NextResponse.json({
      success: true,
      caches: CACHE_CONFIG.map(c => ({
        ...c,
        status: 'active',
        canPurge: true
      })),
      note: 'Cache status is estimated. Actual browser/client caches are managed client-side.'
    })
  } catch (error) {
    console.error('Cache status error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta cachestatus' },
      { status: 500 }
    )
  }
}

// DELETE - Purge specific cache or all caches
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const cacheKey = searchParams.get('key')

    if (cacheKey === 'all') {
      // Purge all known paths
      const paths = [
        '/',
        '/admin',
        '/admin/products',
        '/admin/flyers',
        '/admin/analytics',
        '/admin/users',
      ]

      for (const path of paths) {
        try {
          revalidatePath(path)
        } catch (e) {
          // Path might not exist, continue
        }
      }

      return NextResponse.json({
        success: true,
        message: 'All server-side caches purged',
        purgedPaths: paths
      })
    }

    if (cacheKey) {
      // Purge specific cache by revalidating related paths
      const pathMap = {
        'products': '/admin/products',
        'flyers': '/admin/flyers',
        'analytics': '/admin/analytics',
        'segments': '/admin/segments',
        'user-preferences': '/admin/users',
        'meal-plans': '/'
      }

      const path = pathMap[cacheKey]
      if (path) {
        revalidatePath(path)
        return NextResponse.json({
          success: true,
          message: `Cache '${cacheKey}' purged`,
          purgedPath: path
        })
      }

      // Try to revalidate by tag if path not found
      try {
        revalidateTag(cacheKey)
        return NextResponse.json({
          success: true,
          message: `Cache tag '${cacheKey}' revalidated`
        })
      } catch (e) {
        return NextResponse.json({
          success: false,
          message: `Unknown cache key: ${cacheKey}`
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Ange cache-nyckel att rensa (key=products eller key=all)'
    }, { status: 400 })
  } catch (error) {
    console.error('Cache purge error:', error)
    return NextResponse.json(
      { error: 'Kunde inte rensa cache' },
      { status: 500 }
    )
  }
}

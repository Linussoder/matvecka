import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all products with original prices (deals)
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .not('original_price', 'is', null)
      .gt('original_price', 0)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ success: true, deals: [] })
    }

    // Calculate savings and sort by biggest discount
    const deals = products
      .filter(p => p.original_price && p.price && p.original_price > p.price)
      .map(p => ({
        ...p,
        savings: p.original_price - p.price,
        savingsPercent: Math.round((1 - p.price / p.original_price) * 100),
        minPrice: p.price,
        maxPrice: p.original_price,
        bestStore: p.store
      }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 10)

    return NextResponse.json({ success: true, deals })
  } catch (error) {
    console.error('Failed to fetch top deals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

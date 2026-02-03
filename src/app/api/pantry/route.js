import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canPerformAction } from '@/lib/subscription'

// GET - List all pantry items
export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check premium status
    const { allowed, reason, upgradePath } = await canPerformAction(user.id, 'use_pantry')
    if (!allowed) {
      return NextResponse.json(
        { error: reason, requiresPremium: true, upgradePath },
        { status: 403 }
      )
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const expiringSoon = searchParams.get('expiring_soon') === 'true'

    // Build query
    let query = supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (location) {
      query = query.eq('location', location)
    }
    if (expiringSoon) {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      query = query.lte('expiry_date', threeDaysFromNow.toISOString().split('T')[0])
    }

    const { data: items, error } = await query

    if (error) throw error

    // Calculate expiry status for each item
    const today = new Date()
    const itemsWithStatus = items.map(item => {
      let expiryStatus = 'ok'
      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date)
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
        if (daysUntilExpiry < 0) {
          expiryStatus = 'expired'
        } else if (daysUntilExpiry <= 3) {
          expiryStatus = 'expiring_soon'
        }
      }
      return { ...item, expiryStatus }
    })

    return NextResponse.json({
      success: true,
      items: itemsWithStatus,
      count: itemsWithStatus.length
    })

  } catch (error) {
    console.error('Pantry fetch error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST - Add new pantry item
export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check premium status
    const { allowed, reason, upgradePath } = await canPerformAction(user.id, 'use_pantry')
    if (!allowed) {
      return NextResponse.json(
        { error: reason, requiresPremium: true, upgradePath },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ingredient_name, quantity, unit, category, expiry_date, location } = body

    if (!ingredient_name || !ingredient_name.trim()) {
      return NextResponse.json(
        { error: 'Ingredient name is required' },
        { status: 400 }
      )
    }

    const { data: item, error } = await supabase
      .from('pantry_items')
      .insert({
        user_id: user.id,
        ingredient_name: ingredient_name.trim(),
        quantity: quantity || null,
        unit: unit || null,
        category: category || 'other',
        expiry_date: expiry_date || null,
        location: location || 'pantry'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      item
    })

  } catch (error) {
    console.error('Pantry add error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

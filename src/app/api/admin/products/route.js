import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const store = searchParams.get('store')
    const search = searchParams.get('search')

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (store && store !== 'Alla') {
      query = query.eq('store', store)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: products, count, error } = await query.range(from, to)

    if (error) {
      throw error
    }

    // Get unique stores
    const { data: stores } = await supabase
      .from('products')
      .select('store')
      .not('store', 'is', null)

    const uniqueStores = [...new Set(stores?.map(s => s.store) || [])]

    return NextResponse.json({
      success: true,
      products,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      stores: uniqueStores,
    })
  } catch (error) {
    console.error('Admin products error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta produkter' },
      { status: 500 }
    )
  }
}

// Update a product
export async function PATCH(request) {
  try {
    const { id, ...updates } = await request.json()

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Kunde inte uppdatera produkt' },
      { status: 500 }
    )
  }
}

// Delete a product
export async function DELETE(request) {
  try {
    const { id } = await request.json()

    // First delete associated hotspots
    await supabase
      .from('flyer_hotspots')
      .delete()
      .eq('product_id', id)

    // Then delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort produkt' },
      { status: 500 }
    )
  }
}

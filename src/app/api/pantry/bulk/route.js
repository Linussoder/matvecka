import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canPerformAction } from '@/lib/subscription'

// POST - Add multiple pantry items at once (from shopping list)
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

    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    // Prepare items for insert
    const pantryItems = items.map(item => ({
      user_id: user.id,
      ingredient_name: item.name || item.ingredient_name,
      quantity: item.quantity || item.totalAmount || null,
      unit: item.unit || null,
      category: item.category || categorizeIngredient(item.name || item.ingredient_name),
      expiry_date: item.expiry_date || null,
      location: item.location || 'pantry'
    })).filter(item => item.ingredient_name && item.ingredient_name.trim())

    if (pantryItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items to add' },
        { status: 400 }
      )
    }

    const { data: insertedItems, error } = await supabase
      .from('pantry_items')
      .insert(pantryItems)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      items: insertedItems,
      count: insertedItems.length
    })

  } catch (error) {
    console.error('Pantry bulk add error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove multiple pantry items
export async function DELETE(request) {
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

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      deletedCount: ids.length
    })

  } catch (error) {
    console.error('Pantry bulk delete error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Helper function to categorize ingredients
function categorizeIngredient(name) {
  if (!name) return 'other'
  const nameLower = name.toLowerCase()

  if (nameLower.match(/kyckling|kött|biff|fläsk|lamm|kalv|korv|färs|bacon|skinka/)) return 'meat'
  if (nameLower.match(/fisk|lax|torsk|räk|musslor|sill|tonfisk|skaldjur/)) return 'meat'
  if (nameLower.match(/tomat|gurka|sallad|paprika|lök|morot|potatis|broccoli|spenat|zucchini|aubergine|svamp|vitlök/)) return 'produce'
  if (nameLower.match(/äpple|banan|apelsin|päron|druv|melon|bär|citron|lime|frukt/)) return 'produce'
  if (nameLower.match(/mjölk|yoghurt|ost|smör|grädde|fil|ägg|créme|kvarg/)) return 'dairy'
  if (nameLower.match(/bröd|pasta|ris|müsli|flingor|havre|mjöl|couscous|quinoa|nudl/)) return 'grains'
  if (nameLower.match(/salt|peppar|krydd|örter|basilika|oregano|timjan|curry|kanel|vanilj/)) return 'spices'
  if (nameLower.match(/fryst|glass|frysta/)) return 'frozen'
  if (nameLower.match(/konserv|burk|krossade tomater|bönor|linser/)) return 'canned'

  return 'other'
}

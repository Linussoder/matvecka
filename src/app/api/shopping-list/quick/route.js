import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Get quick shopping list items
export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get quick shopping list for this user
    const { data: shoppingList, error } = await supabase
      .from('quick_shopping_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ items: [] })
      }
      throw error
    }

    return NextResponse.json({ items: shoppingList || [] })

  } catch (error) {
    console.error('Error fetching quick shopping list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 }
    )
  }
}

// Add items to quick shopping list
export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { items, recipeName } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid items' },
        { status: 400 }
      )
    }

    // Try to insert items into quick_shopping_items table
    // If table doesn't exist, fall back to using shopping_lists table
    const itemsToInsert = items.map(item => ({
      user_id: user.id,
      name: typeof item === 'string' ? item : item.name,
      amount: typeof item === 'string' ? null : `${item.amount || ''} ${item.unit || ''}`.trim() || null,
      recipe_name: recipeName || null,
      checked: false,
      created_at: new Date().toISOString()
    }))

    // Try inserting to quick_shopping_items first
    const { data, error } = await supabase
      .from('quick_shopping_items')
      .insert(itemsToInsert)
      .select()

    if (error) {
      // If table doesn't exist, create a fallback using shopping_lists
      if (error.code === '42P01') {
        // Table doesn't exist - use shopping_lists with null meal_plan_id
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // Get or create quick shopping list for user
        let { data: existingList } = await supabaseAdmin
          .from('shopping_lists')
          .select('*')
          .is('meal_plan_id', null)
          .eq('user_id', user.id)
          .single()

        if (!existingList) {
          // Create new quick list
          const { data: newList, error: createError } = await supabaseAdmin
            .from('shopping_lists')
            .insert({
              user_id: user.id,
              meal_plan_id: null,
              items: items.map(item => ({
                name: typeof item === 'string' ? item : item.name,
                totalAmount: typeof item === 'string' ? '' : `${item.amount || ''} ${item.unit || ''}`.trim(),
                unit: typeof item === 'string' ? '' : item.unit || '',
                recipe: recipeName || '',
                category: 'Övrigt',
                checked: false
              })),
              total_cost: '0'
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating quick list:', createError)
            throw createError
          }
          existingList = newList
        } else {
          // Append to existing list
          const existingItems = existingList.items || []
          const newItems = items.map(item => ({
            name: typeof item === 'string' ? item : item.name,
            totalAmount: typeof item === 'string' ? '' : `${item.amount || ''} ${item.unit || ''}`.trim(),
            unit: typeof item === 'string' ? '' : item.unit || '',
            recipe: recipeName || '',
            category: 'Övrigt',
            checked: false
          }))

          const { error: updateError } = await supabaseAdmin
            .from('shopping_lists')
            .update({
              items: [...existingItems, ...newItems],
              updated_at: new Date().toISOString()
            })
            .eq('id', existingList.id)

          if (updateError) {
            console.error('Error updating quick list:', updateError)
            throw updateError
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Items added to shopping list',
          count: items.length
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Items added to shopping list',
      count: items.length,
      items: data
    })

  } catch (error) {
    console.error('Error adding to shopping list:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add items' },
      { status: 500 }
    )
  }
}

// Clear or delete items from quick shopping list
export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { itemId, clearAll } = await request.json()

    if (clearAll) {
      // Delete all items for this user
      const { error } = await supabase
        .from('quick_shopping_items')
        .delete()
        .eq('user_id', user.id)

      if (error && error.code !== '42P01') throw error
    } else if (itemId) {
      // Delete specific item
      const { error } = await supabase
        .from('quick_shopping_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error && error.code !== '42P01') throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting from shopping list:', error)
    return NextResponse.json(
      { error: 'Failed to delete items' },
      { status: 500 }
    )
  }
}

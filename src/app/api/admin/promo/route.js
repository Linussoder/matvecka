import { NextResponse } from 'next/server'
import {
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoStats,
  generatePromoCode
} from '@/lib/promo'

// GET - List all promo codes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('stats') === 'true'

    const { codes, error } = await getAllPromoCodes()

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    let stats = null
    if (includeStats) {
      const statsResult = await getPromoStats()
      stats = statsResult.stats
    }

    return NextResponse.json({ codes, stats })
  } catch (error) {
    console.error('Admin promo GET error:', error)
    return NextResponse.json(
      { error: 'Något gick fel' },
      { status: 500 }
    )
  }
}

// POST - Create a new promo code
export async function POST(request) {
  try {
    const body = await request.json()

    // Auto-generate code if not provided
    if (!body.code) {
      body.code = generatePromoCode()
    }

    const result = await createPromoCode(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      promo: result.promo
    })
  } catch (error) {
    console.error('Admin promo POST error:', error)
    return NextResponse.json(
      { error: 'Något gick fel' },
      { status: 500 }
    )
  }
}

// PATCH - Update a promo code
export async function PATCH(request) {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID saknas' },
        { status: 400 }
      )
    }

    const result = await updatePromoCode(id, updates)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      promo: result.promo
    })
  } catch (error) {
    console.error('Admin promo PATCH error:', error)
    return NextResponse.json(
      { error: 'Något gick fel' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a promo code
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID saknas' },
        { status: 400 }
      )
    }

    const result = await deletePromoCode(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin promo DELETE error:', error)
    return NextResponse.json(
      { error: 'Något gick fel' },
      { status: 500 }
    )
  }
}

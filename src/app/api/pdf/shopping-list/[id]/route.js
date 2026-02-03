import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getUserSubscription } from '@/lib/subscription'
import puppeteer from 'puppeteer'

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies()
    const { id } = await params

    // Create authenticated Supabase client
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Du måste vara inloggad' }, { status: 401 })
    }

    // Check if user has premium access
    const { plan } = await getUserSubscription(user.id)
    if (plan !== 'premium') {
      return NextResponse.json(
        { error: 'PDF-export kräver Premium-prenumeration', upgradePath: '/pricing' },
        { status: 403 }
      )
    }

    // Fetch meal plan with ownership check (id is meal_plan_id)
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (planError || !mealPlan) {
      return NextResponse.json({ error: 'Veckomenyn hittades inte' }, { status: 404 })
    }

    // Fetch shopping list
    const { data: shoppingList } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('meal_plan_id', id)
      .single()

    if (!shoppingList) {
      return NextResponse.json({ error: 'Inköpslistan hittades inte' }, { status: 404 })
    }

    // Generate HTML for PDF
    const html = generateShoppingListHTML(mealPlan, shoppingList)

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    })

    await browser.close()

    // Return PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="inkopslista-${mealPlan.name.replace(/[^a-zA-Z0-9åäöÅÄÖ]/g, '-')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Kunde inte generera PDF' }, { status: 500 })
  }
}

function generateShoppingListHTML(mealPlan, shoppingList) {
  const items = shoppingList.items || []

  // Group items by category
  const grouped = {}
  items.forEach(item => {
    const category = item.category || 'Övrigt'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(item)
  })

  // Sort categories
  const categoryOrder = ['Mejeri', 'Kött & Fisk', 'Frukt & Grönt', 'Skafferi', 'Bröd', 'Frys', 'Övrigt']
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a)
    const bIndex = categoryOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const categoryHTML = sortedCategories.map(category => {
    const categoryItems = grouped[category]
    const itemsHTML = categoryItems.map(item => `
      <div class="item">
        <div class="checkbox"></div>
        <div class="item-content">
          <span class="item-name">${item.name}</span>
          ${item.amount ? `<span class="item-amount">${item.amount}</span>` : ''}
        </div>
      </div>
    `).join('')

    return `
      <div class="category">
        <h3>${getCategoryEmoji(category)} ${category}</h3>
        <div class="items">
          ${itemsHTML}
        </div>
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1f2937;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #16a34a;
        }
        .header h1 {
          font-size: 28px;
          color: #16a34a;
          margin-bottom: 5px;
        }
        .header h2 {
          font-size: 18px;
          color: #374151;
          font-weight: normal;
        }
        .header .meta {
          font-size: 14px;
          color: #6b7280;
          margin-top: 10px;
        }
        .stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 15px;
        }
        .stat {
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #16a34a;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }
        .category {
          margin-bottom: 25px;
        }
        .category h3 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid #e5e7eb;
        }
        .items {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 20px;
        }
        .item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .item-content {
          display: flex;
          justify-content: space-between;
          flex: 1;
          min-width: 0;
        }
        .item-name {
          font-size: 14px;
          color: #1f2937;
        }
        .item-amount {
          font-size: 13px;
          color: #6b7280;
          margin-left: 10px;
          flex-shrink: 0;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
        .tips {
          margin-top: 30px;
          padding: 15px;
          background: #f0fdf4;
          border-radius: 8px;
          border: 1px solid #bbf7d0;
        }
        .tips h4 {
          font-size: 14px;
          color: #16a34a;
          margin-bottom: 8px;
        }
        .tips p {
          font-size: 12px;
          color: #166534;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Inköpslista</h1>
        <h2>${mealPlan.name}</h2>
        <div class="meta">
          ${mealPlan.servings} portioner • Vecka ${new Date(mealPlan.week_start_date).toLocaleDateString('sv-SE')}
        </div>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${items.length}</div>
            <div class="stat-label">Varor</div>
          </div>
          <div class="stat">
            <div class="stat-value">${shoppingList.total_cost?.toFixed(0) || mealPlan.total_cost?.toFixed(0) || '—'} kr</div>
            <div class="stat-label">Uppskattad kostnad</div>
          </div>
        </div>
      </div>

      ${categoryHTML}

      <div class="tips">
        <h4>Tips för smartare inköp</h4>
        <p>Kolla kylen innan du handlar, jämför kilopris, och välj säsongens grönsaker för bästa pris och kvalitet.</p>
      </div>

      <div class="footer">
        Genererad av Matvecka • ${new Date().toLocaleDateString('sv-SE')}
      </div>
    </body>
    </html>
  `
}

function getCategoryEmoji(category) {
  const emojis = {
    'Mejeri': '🥛',
    'Kött & Fisk': '🥩',
    'Frukt & Grönt': '🥬',
    'Skafferi': '🥫',
    'Bröd': '🍞',
    'Frys': '❄️',
    'Övrigt': '📦',
  }
  return emojis[category] || '📦'
}

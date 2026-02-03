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

    // Fetch meal plan with ownership check
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (planError || !mealPlan) {
      return NextResponse.json({ error: 'Veckomenyn hittades inte' }, { status: 404 })
    }

    // Fetch recipes
    const { data: recipes } = await supabase
      .from('meal_plan_recipes')
      .select('*')
      .eq('meal_plan_id', id)
      .order('day_number')

    // Generate HTML for PDF
    const html = generateMealPlanHTML(mealPlan, recipes || [])

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
        'Content-Disposition': `attachment; filename="veckomeny-${mealPlan.name.replace(/[^a-zA-Z0-9åäöÅÄÖ]/g, '-')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Kunde inte generera PDF' }, { status: 500 })
  }
}

function generateMealPlanHTML(mealPlan, recipes) {
  const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

  const recipeCards = recipes.map((r, index) => {
    const recipe = r.recipe_data
    const dayName = dayNames[r.day_number - 1] || `Dag ${r.day_number}`

    return `
      <div class="recipe-card">
        <div class="day-badge">${dayName}</div>
        <h3>${recipe.title || recipe.name}</h3>
        ${recipe.description ? `<p class="description">${recipe.description}</p>` : ''}
        <div class="meta">
          ${recipe.prep_time || recipe.prepTime ? `<span>⏱️ ${recipe.prep_time || recipe.prepTime}</span>` : ''}
          ${recipe.servings ? `<span>👥 ${recipe.servings} port</span>` : ''}
          ${recipe.estimated_cost ? `<span>💰 ${recipe.estimated_cost} kr</span>` : ''}
        </div>

        <div class="section">
          <h4>Ingredienser</h4>
          <ul>
            ${(recipe.ingredients || []).map(i => {
              const name = typeof i === 'string' ? i : i.name || i.ingredient
              const amount = typeof i === 'string' ? '' : (i.amount || i.quantity || '')
              return `<li>${amount ? amount + ' ' : ''}${name}</li>`
            }).join('')}
          </ul>
        </div>

        <div class="section">
          <h4>Instruktioner</h4>
          <ol>
            ${(recipe.instructions || []).map(step => {
              const text = typeof step === 'string' ? step : step.instruction || step.step
              return `<li>${text}</li>`
            }).join('')}
          </ol>
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
          margin-bottom: 10px;
        }
        .header .meta {
          font-size: 14px;
          color: #6b7280;
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
        .recipe-card {
          page-break-inside: avoid;
          margin-bottom: 25px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fafafa;
        }
        .day-badge {
          display: inline-block;
          background: #16a34a;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .recipe-card h3 {
          font-size: 20px;
          color: #111827;
          margin-bottom: 8px;
        }
        .recipe-card .description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .recipe-card .meta {
          display: flex;
          gap: 20px;
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 15px;
        }
        .section {
          margin-top: 15px;
        }
        .section h4 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
        }
        ul, ol {
          margin-left: 20px;
        }
        li {
          font-size: 13px;
          margin-bottom: 4px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${mealPlan.name}</h1>
        <div class="meta">
          Vecka ${new Date(mealPlan.week_start_date).toLocaleDateString('sv-SE')} • ${mealPlan.servings} portioner
        </div>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${recipes.length}</div>
            <div class="stat-label">Recept</div>
          </div>
          <div class="stat">
            <div class="stat-value">${mealPlan.total_cost?.toFixed(0) || '—'} kr</div>
            <div class="stat-label">Total kostnad</div>
          </div>
        </div>
      </div>

      ${recipeCards}

      <div class="footer">
        Genererad av Matvecka • ${new Date().toLocaleDateString('sv-SE')}
      </div>
    </body>
    </html>
  `
}

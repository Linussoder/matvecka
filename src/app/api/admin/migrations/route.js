import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET - Fetch migration status from Supabase
export async function GET() {
  try {
    // Try to query the Supabase migrations table
    // This table tracks which migrations have been applied
    const { data: migrations, error } = await supabase
      .rpc('get_migrations')

    if (error) {
      // Fall back to listing known migration files
      // In production, you'd want to compare against actually applied migrations
      const knownMigrations = [
        { name: 'flyers_schema.sql', applied: true },
        { name: 'favorites_schema.sql', applied: true },
        { name: 'meal_plans_preferences.sql', applied: true },
        { name: 'subscription_tables.sql', applied: true },
        { name: 'household_profiles.sql', applied: true },
        { name: '20250202_add_source_to_favorites.sql', applied: true },
        { name: 'extended_user_profile.sql', applied: true },
        { name: '20240215_admin_enhancements.sql', applied: true },
        { name: 'new_features.sql', applied: true },
        { name: '20240216_social_posts.sql', applied: true },
        { name: 'referral_system.sql', applied: true },
        { name: '20250203_realtime_analytics.sql', applied: true },
        { name: '20250203_onboarding.sql', applied: true },
        { name: '20250203_promo_codes.sql', applied: true },
        { name: '20250203_recipe_sharing.sql', applied: true },
        { name: '20250203_content_recipe_management.sql', applied: true },
        { name: '20250203_api_deployment_features.sql', applied: false, pending: true },
      ]

      return NextResponse.json({
        success: true,
        migrations: knownMigrations,
        source: 'local_list',
        note: 'Unable to query migrations table directly. Showing local migration files.'
      })
    }

    return NextResponse.json({
      success: true,
      migrations: migrations || [],
      source: 'supabase'
    })
  } catch (error) {
    console.error('Migrations fetch error:', error)

    // Return list of known migration files as fallback
    return NextResponse.json({
      success: true,
      migrations: [
        { name: 'Unable to fetch migrations', applied: false }
      ],
      error: error.message
    })
  }
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateStores() {
  const updates = [
    { name: 'ICA Maxi Vällingby', city: 'Stockholm' },
    { name: 'ICA Maxi Täby', city: 'Stockholm' },
    { name: 'Coop Forum Västra Hamnen', city: 'Malmö' },
  ];

  for (const update of updates) {
    const { error } = await supabase
      .from('stores')
      .update({ city: update.city })
      .eq('name', update.name);

    if (error) {
      console.error(`Failed to update ${update.name}:`, error.message);
    } else {
      console.log(`Updated ${update.name} -> city: ${update.city}`);
    }
  }
}

updateStores();

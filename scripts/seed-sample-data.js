require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const sampleProducts = [
  { name: 'Kycklingfilé 900g Kronfågel', price: 79, unit: 'kg', category: 'kött', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Nötfärs 800g Scan', price: 59, unit: 'kg', category: 'kött', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Fläskytterfilé 1kg', price: 69, unit: 'kg', category: 'kött', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Laxfilé 400g Fiskeriet', price: 89, unit: 'kg', category: 'fisk', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Räkor Handskalade 200g', price: 49, unit: 'st', category: 'fisk', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Mellanmjölk 1.5L Arla', price: 15, unit: 'st', category: 'mejeri', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Ägg 12-pack Frigående', price: 35, unit: 'st', category: 'mejeri', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Smör Normalsaltat 500g Bregott', price: 45, unit: 'st', category: 'mejeri', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Ost Präst 28% 500g', price: 55, unit: 'kg', category: 'mejeri', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Yoghurt Naturell 1kg Arla', price: 25, unit: 'st', category: 'mejeri', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Bananer 1kg Chiquita', price: 22, unit: 'kg', category: 'frukt', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Äpplen Royal Gala 1kg', price: 29, unit: 'kg', category: 'frukt', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Apelsiner 1kg', price: 25, unit: 'kg', category: 'frukt', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Jordgubbar 400g', price: 35, unit: 'st', category: 'frukt', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Gurka 1st', price: 15, unit: 'st', category: 'grönsaker', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Tomater Kvist 500g', price: 25, unit: 'st', category: 'grönsaker', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Paprika Mix 3-pack', price: 29, unit: 'st', category: 'grönsaker', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Morötter 1kg', price: 12, unit: 'kg', category: 'grönsaker', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Potatis 2kg', price: 25, unit: 'kg', category: 'grönsaker', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Lök Gul 1kg', price: 15, unit: 'kg', category: 'grönsaker', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Pasta Penne 500g Barilla', price: 18, unit: 'st', category: 'spannmål', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Ris Jasmin 1kg', price: 29, unit: 'kg', category: 'spannmål', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Bröd Skogaholm Originalrost', price: 25, unit: 'st', category: 'spannmål', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Havregryn 1kg AXA', price: 22, unit: 'kg', category: 'spannmål', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Coca-Cola 1.5L', price: 19, unit: 'st', category: 'dryck', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Apelsinjuice 1L Bravo', price: 22, unit: 'st', category: 'dryck', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Kaffe Mellanrost 450g Gevalia', price: 45, unit: 'st', category: 'dryck', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Te Earl Grey Twinings', price: 35, unit: 'st', category: 'dryck', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Krossade Tomater 400g Mutti', price: 15, unit: 'st', category: 'övrigt', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
  { name: 'Olivolja Extra Virgin 500ml', price: 65, unit: 'st', category: 'övrigt', image_url: 'https://handlaprivatkund.ica.se/images-v3/bf7a00ca-390e-4769-865f-dc369586872e/9e02c287-d751-433b-8e1f-9bd07bd60b9e/300x300.jpg' },
];

async function seedData() {
  console.log('🌱 Seeding sample data...\n');

  // Get current week dates
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];

  console.log(`📅 Creating week: ${startDate} - ${endDate}`);

  // Create week entry
  const { data: week, error: weekError } = await supabase
    .from('weeks')
    .insert({
      store_id: 1, // Assuming store_id 1 exists
      start_date: startDate,
      end_date: endDate
    })
    .select()
    .single();

  if (weekError) {
    console.error('❌ Failed to create week:', weekError.message);
    return;
  }

  console.log(`✅ Created week ID: ${week.id}\n`);

  // Add products
  const productsWithWeek = sampleProducts.map(p => ({
    ...p,
    week_id: week.id,
    url: `https://handla.ica.se/stores/1004084/products/${p.name.toLowerCase().replace(/\s+/g, '-')}`
  }));

  const { data: products, error: productError } = await supabase
    .from('products')
    .insert(productsWithWeek)
    .select();

  if (productError) {
    console.error('❌ Failed to insert products:', productError.message);
    return;
  }

  console.log(`✅ Inserted ${products.length} products\n`);

  // Show summary
  console.log('📊 Summary by category:');
  const categories = {};
  products.forEach(p => {
    categories[p.category] = (categories[p.category] || 0) + 1;
  });
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} products`);
  });

  console.log('\n🎉 Seeding complete!');
}

seedData();

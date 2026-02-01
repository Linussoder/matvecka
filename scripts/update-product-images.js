// Script to update product images in Supabase based on product names
// Run with: node scripts/update-product-images.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Image mappings - Swedish food items to Unsplash images
const imageMap = {
  // Vegetables - Grönsaker
  'morot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
  'morötter': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
  'potatis': 'https://images.unsplash.com/photo-1518977676601-b53f82ber659?w=400&q=80',
  'tomat': 'https://images.unsplash.com/photo-1546470427-227c7369a9b5?w=400&q=80',
  'tomater': 'https://images.unsplash.com/photo-1546470427-227c7369a9b5?w=400&q=80',
  'gurka': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80',
  'sallad': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&q=80',
  'lök': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
  'vitlök': 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2f6b?w=400&q=80',
  'paprika': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80',
  'broccoli': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80',
  'blomkål': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&q=80',
  'spenat': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
  'zucchini': 'https://images.unsplash.com/photo-1563252722-6434563a985d?w=400&q=80',
  'aubergine': 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400&q=80',
  'svamp': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'champinjon': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'purjolök': 'https://images.unsplash.com/photo-1580391564590-aeca65c5e2d3?w=400&q=80',
  'selleri': 'https://images.unsplash.com/photo-1580391564590-aeca65c5e2d3?w=400&q=80',
  'majs': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
  'ärtor': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
  'bönor': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
  'rödbetor': 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=400&q=80',
  'kål': 'https://images.unsplash.com/photo-1598030343246-eec71cb44231?w=400&q=80',
  'vitkål': 'https://images.unsplash.com/photo-1598030343246-eec71cb44231?w=400&q=80',
  'rödkål': 'https://images.unsplash.com/photo-1594282486756-576b93e19008?w=400&q=80',

  // Fruits - Frukt
  'äpple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
  'äpplen': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
  'banan': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
  'bananer': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
  'apelsin': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
  'apelsiner': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
  'citron': 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=400&q=80',
  'päron': 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400&q=80',
  'vindruvor': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80',
  'jordgubbar': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
  'blåbär': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80',
  'hallon': 'https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=400&q=80',
  'vattenmelon': 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400&q=80',
  'melon': 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=400&q=80',
  'ananas': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
  'kiwi': 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&q=80',
  'avokado': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80',

  // Meat - Kött
  'kyckling': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
  'kycklingfilé': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
  'kycklingbröst': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
  'köttfärs': 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&q=80',
  'nötfärs': 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&q=80',
  'fläskfärs': 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&q=80',
  'blandfärs': 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&q=80',
  'fläsk': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80',
  'fläskkotlett': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80',
  'fläskfilé': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80',
  'bacon': 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=400&q=80',
  'skinka': 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=400&q=80',
  'korv': 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80',
  'prinskorv': 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80',
  'falukorv': 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80',
  'nötkött': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'biff': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'entrecote': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'lamm': 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80',
  'fågel': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80',
  'kalkon': 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&q=80',

  // Fish - Fisk
  'lax': 'https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?w=400&q=80',
  'laxfilé': 'https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?w=400&q=80',
  'torsk': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
  'torskfilé': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
  'sej': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
  'sill': 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=400&q=80',
  'makrill': 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=400&q=80',
  'räkor': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80',
  'räka': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80',
  'tonfisk': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
  'fisk': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
  'fiskpinnar': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',

  // Dairy - Mejeri
  'mjölk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  'filmjölk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  'yoghurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  'ost': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
  'smör': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
  'grädde': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  'gräddfil': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  'crème fraiche': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  'ägg': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80',
  'cottage cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
  'kvarg': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  'fetaost': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
  'mozzarella': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
  'parmesan': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',

  // Bread & Bakery - Bröd
  'bröd': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  'limpa': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  'knäckebröd': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  'fralla': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80',
  'bulle': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&q=80',
  'kanelbulle': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&q=80',

  // Pantry - Skafferi
  'ris': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
  'pasta': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
  'spaghetti': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
  'makaroner': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
  'penne': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
  'nudlar': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
  'mjöl': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
  'socker': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=80',
  'salt': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&q=80',
  'olivolja': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
  'olja': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
  'krossade tomater': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'tomatpuré': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'kokosmjölk': 'https://images.unsplash.com/photo-1550411294-098dc0067e26?w=400&q=80',
  'linser': 'https://images.unsplash.com/photo-1585996837411-85e82ef0b619?w=400&q=80',
  'kikärtor': 'https://images.unsplash.com/photo-1515543904379-3d757abe528a?w=400&q=80',

  // Drinks - Dryck
  'juice': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
  'apelsinjuice': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
  'läsk': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  'coca cola': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  'cola': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  'vatten': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80',
  'mineralvatten': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80',
  'kaffe': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80',
  'te': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  'öl': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80',
  'vin': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80',

  // Frozen - Fryst
  'glass': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80',
  'frysta grönsaker': 'https://images.unsplash.com/photo-1594997756045-f188d785cf65?w=400&q=80',
  'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'pommes': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
  'pommes frites': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',

  // Snacks
  'chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
  'choklad': 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80',
  'godis': 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&q=80',
  'nötter': 'https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?w=400&q=80',
  'mandlar': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80',
  'popcorn': 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80',
}

// Category fallback images
const categoryImages = {
  'kött': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'fisk': 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
  'grönsaker': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
  'frukt': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80',
  'mejeri': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80',
  'bröd': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  'skafferi': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
  'fryst': 'https://images.unsplash.com/photo-1594997756045-f188d785cf65?w=400&q=80',
  'dryck': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
  'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80',
}

function findImageForProduct(productName, category) {
  const nameLower = productName.toLowerCase()

  // Check for exact or partial match in imageMap
  for (const [key, url] of Object.entries(imageMap)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return url
    }
  }

  // Fallback to category image
  if (category && categoryImages[category.toLowerCase()]) {
    return categoryImages[category.toLowerCase()]
  }

  // Default food image
  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&q=80'
}

async function updateProductImages() {
  console.log('Fetching products from Supabase...')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, image_url')

  if (error) {
    console.error('Error fetching products:', error)
    return
  }

  console.log(`Found ${products.length} products`)

  let updated = 0
  let skipped = 0

  for (const product of products) {
    // Update all products with appropriate images

    const newImageUrl = findImageForProduct(product.name, product.category)

    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: newImageUrl })
      .eq('id', product.id)

    if (updateError) {
      console.error(`Error updating ${product.name}:`, updateError)
    } else {
      console.log(`✓ Updated: ${product.name} -> ${newImageUrl.substring(0, 50)}...`)
      updated++
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`)
}

updateProductImages()

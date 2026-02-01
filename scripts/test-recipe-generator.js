require('dotenv').config({ path: '.env.local' });
const RecipeGenerator = require('../lib/ai/recipe-generator');

// Sample products (simulating scraped deals)
const sampleProducts = [
  { name: 'Kycklingfilé 900g', price: 79, unit: 'kg', category: 'kött' },
  { name: 'Nötfärs 800g', price: 59, unit: 'kg', category: 'kött' },
  { name: 'Laxfilé 400g', price: 89, unit: 'st', category: 'fisk' },
  { name: 'Potatis 2kg', price: 25, unit: 'kg', category: 'grönsaker' },
  { name: 'Morötter 1kg', price: 12, unit: 'kg', category: 'grönsaker' },
  { name: 'Lök Gul 1kg', price: 15, unit: 'kg', category: 'grönsaker' },
  { name: 'Pasta Penne 500g', price: 18, unit: 'st', category: 'spannmål' },
  { name: 'Krossade Tomater 400g', price: 15, unit: 'st', category: 'övrigt' },
  { name: 'Grädde 3dl', price: 22, unit: 'st', category: 'mejeri' },
  { name: 'Ost Präst 500g', price: 55, unit: 'st', category: 'mejeri' },
];

async function testGenerateRecipes() {
  console.log('🍳 Testing Recipe Generation...\n');
  console.log('📦 Using products:', sampleProducts.map(p => p.name).join(', '));
  console.log('\n---\n');

  try {
    const recipes = await RecipeGenerator.generateRecipes(sampleProducts, {
      count: 2,
      servings: 4
    });

    console.log(`✅ Generated ${recipes.length} recipes:\n`);

    recipes.forEach((recipe, i) => {
      console.log(`\n📗 Recipe ${i + 1}: ${recipe.name}`);
      console.log(`   ${recipe.description}`);
      console.log(`   ⏱️  Prep: ${recipe.prepTime}, Cook: ${recipe.cookTime}`);
      console.log(`   👥 Servings: ${recipe.servings}`);
      console.log(`   💰 Estimated cost: ${recipe.estimatedCost} kr`);
      console.log(`   📊 Difficulty: ${recipe.difficulty}`);
      console.log(`\n   Ingredients:`);
      recipe.ingredients.forEach(ing => {
        const dealTag = ing.fromDeals ? ' ⭐' : '';
        console.log(`   - ${ing.amount} ${ing.unit} ${ing.name}${dealTag}`);
      });
      console.log(`\n   Instructions:`);
      recipe.instructions.forEach((step, j) => {
        console.log(`   ${j + 1}. ${step}`);
      });
      if (recipe.tips) {
        console.log(`\n   💡 Tips: ${recipe.tips}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testSingleRecipe() {
  console.log('\n\n🥘 Testing Single Recipe Generation...\n');

  const ingredients = ['kyckling', 'potatis', 'grädde', 'lök'];
  console.log('📦 Ingredients:', ingredients.join(', '));
  console.log('\n---\n');

  try {
    const recipe = await RecipeGenerator.generateSingleRecipe(ingredients, {
      servings: 4,
      difficulty: 'Lätt'
    });

    console.log(`✅ Generated recipe: ${recipe.name}`);
    console.log(`   ${recipe.description}`);
    console.log(JSON.stringify(recipe, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testGenerateRecipes();
  await testSingleRecipe();
  console.log('\n\n🎉 Tests complete!');
}

runTests();

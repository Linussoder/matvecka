const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class RecipeGenerator {
  /**
   * Generate recipes based on available products/ingredients
   * @param {Array} products - Array of product objects with name, price, category
   * @param {Object} options - Generation options
   * @param {number} options.count - Number of recipes to generate (default: 3)
   * @param {string} options.cuisine - Preferred cuisine type (optional)
   * @param {number} options.maxBudget - Maximum budget per recipe (optional)
   * @param {number} options.servings - Number of servings (default: 4)
   * @returns {Promise<Array>} Array of recipe objects
   */
  static async generateRecipes(products, options = {}) {
    const { count = 3, cuisine, maxBudget, servings = 4 } = options;

    const productList = products
      .map(p => `- ${p.name}: ${p.price} kr/${p.unit}`)
      .join('\n');

    const prompt = `Du är en svensk kock som skapar recept baserade på veckans erbjudanden.

Här är veckans erbjudanden:
${productList}

Skapa ${count} recept för ${servings} portioner.
${cuisine ? `Fokusera på ${cuisine} mat.` : ''}
${maxBudget ? `Håll ingredienskostnaden under ${maxBudget} kr per recept.` : ''}

Svara ENDAST med valid JSON i detta format (ingen markdown, inga code blocks):
{
  "recipes": [
    {
      "name": "Receptnamn",
      "description": "Kort beskrivning",
      "servings": ${servings},
      "prepTime": "15 min",
      "cookTime": "30 min",
      "difficulty": "Lätt|Medel|Svår",
      "estimatedCost": 85,
      "ingredients": [
        { "name": "Ingrediens", "amount": "500", "unit": "g", "fromDeals": true }
      ],
      "instructions": [
        "Steg 1...",
        "Steg 2..."
      ],
      "tips": "Valfritt tips"
    }
  ]
}

Använd så många produkter från erbjudandena som möjligt. Markera "fromDeals": true för ingredienser från listan.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;

    try {
      const parsed = JSON.parse(responseText);
      return parsed.recipes;
    } catch (error) {
      console.error('Failed to parse recipe JSON:', error);
      console.error('Response was:', responseText);
      throw new Error('Failed to parse recipe response');
    }
  }

  /**
   * Generate a single recipe from specific ingredients
   * @param {Array<string>} ingredients - List of ingredient names
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Recipe object
   */
  static async generateSingleRecipe(ingredients, options = {}) {
    const { servings = 4, difficulty = 'Medel' } = options;

    const prompt = `Du är en svensk kock. Skapa ETT recept med dessa ingredienser:
${ingredients.join(', ')}

Receptet ska vara för ${servings} portioner och ha svårighetsgrad: ${difficulty}.

Svara ENDAST med valid JSON (ingen markdown):
{
  "name": "Receptnamn",
  "description": "Kort beskrivning",
  "servings": ${servings},
  "prepTime": "15 min",
  "cookTime": "30 min",
  "difficulty": "${difficulty}",
  "ingredients": [
    { "name": "Ingrediens", "amount": "500", "unit": "g" }
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "tips": "Valfritt tips"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;

    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse recipe JSON:', error);
      throw new Error('Failed to parse recipe response');
    }
  }

  /**
   * Generate a weekly meal plan based on products
   * @param {Array} products - Available products
   * @param {Object} options - Planning options
   * @returns {Promise<Object>} Meal plan object
   */
  static async generateMealPlan(products, options = {}) {
    const { days = 7, mealsPerDay = 2, servings = 4 } = options;

    const productList = products
      .slice(0, 20) // Limit to top 20 products
      .map(p => `- ${p.name}: ${p.price} kr`)
      .join('\n');

    const prompt = `Du är en svensk måltidsplanerare. Skapa en veckomeny baserad på dessa erbjudanden:

${productList}

Skapa en plan för ${days} dagar med ${mealsPerDay} måltider per dag (lunch och middag).
Varje måltid för ${servings} portioner.

Svara ENDAST med valid JSON:
{
  "mealPlan": {
    "monday": {
      "lunch": { "name": "Receptnamn", "mainIngredients": ["ingrediens1", "ingrediens2"] },
      "dinner": { "name": "Receptnamn", "mainIngredients": ["ingrediens1", "ingrediens2"] }
    },
    "tuesday": { ... },
    ...
  },
  "shoppingList": [
    { "name": "Produkt", "amount": "1 kg", "estimatedPrice": 50, "fromDeals": true }
  ],
  "totalEstimatedCost": 500,
  "tips": "Tips för veckan"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;

    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse meal plan JSON:', error);
      throw new Error('Failed to parse meal plan response');
    }
  }
}

module.exports = RecipeGenerator;

require('dotenv').config({ path: '.env.local' });
const ICAScraper = require('../lib/scrapers/ica-scraper');
const ProductsDB = require('../lib/db/products');

async function scrapeSingleCity() {
  const scraper = new ICAScraper();

  // Configuration
  const city = 'Helsingborg'; // Change this as needed
  const storeId = 1; // Update with your actual store ID from database

  console.log('🛒 Starting ICA Scraping Job...\n');

  try {
    await scraper.init();

    // Get current week dates
    const today = new Date();
    const startDate = getMonday(today);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    console.log(`📅 Week: ${formatDate(startDate)} - ${formatDate(endDate)}\n`);

    // Create week entry
    const week = await ProductsDB.createWeek(
      storeId,
      formatDate(startDate),
      formatDate(endDate)
    );

    console.log(`Created week ID: ${week.id}\n`);

    // Scrape products
    const products = await scraper.scrapeStoreInCity(city);

    if (products.length === 0) {
      throw new Error('No products found');
    }

    // Save to database
    await ProductsDB.saveProducts(week.id, products);

    console.log(`\n✅ Successfully saved ${products.length} products to database`);

  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

scrapeSingleCity();

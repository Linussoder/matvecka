const ICAScraper = require('./ica-scraper');

// List of cities/stores to scrape
const STORES_TO_SCRAPE = [
  { city: 'Helsingborg', name: 'Maxi ICA Stormarknad Helsingborg' },
  // Add more cities as needed:
  // { city: 'Stockholm', name: 'ICA Kvantum Stockholm' },
  // { city: 'Göteborg', name: 'Maxi ICA Stormarknad Göteborg' },
];

async function scrapeAllStores() {
  const scraper = new ICAScraper();
  const allProducts = [];

  try {
    await scraper.init();

    for (const store of STORES_TO_SCRAPE) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Scraping: ${store.name} (${store.city})`);
      console.log('='.repeat(50));

      try {
        const products = await scraper.scrapeStoreInCity(store.city);

        // Add store info to each product
        const productsWithStore = products.map(product => ({
          ...product,
          store_name: store.name,
          store_city: store.city,
          scraped_at: new Date().toISOString()
        }));

        allProducts.push(...productsWithStore);
        console.log(`Added ${products.length} products from ${store.name}`);

      } catch (error) {
        console.error(`Failed to scrape ${store.name}:`, error.message);
      }
    }

    // Save all products to JSON
    const fs = require('fs');
    const outputFile = 'all-ica-products.json';
    fs.writeFileSync(outputFile, JSON.stringify(allProducts, null, 2));
    console.log(`\nSaved ${allProducts.length} total products to ${outputFile}`);

    return allProducts;

  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  } finally {
    await scraper.close();
  }
}

// Run if called directly
if (require.main === module) {
  scrapeAllStores()
    .then(products => {
      console.log(`\nScraping complete! Total products: ${products.length}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { scrapeAllStores };

const ICAScraper = require('./ica-scraper');

async function testMultipleCities() {
  const scraper = new ICAScraper();
  const cities = ['Helsingborg', 'Stockholm', 'Göteborg', 'Malmö'];
  const results = {};

  try {
    await scraper.init();

    for (const city of cities) {
      console.log(`\n\n${'═'.repeat(40)}`);
      console.log(`Testing: ${city}`);
      console.log('═'.repeat(40) + '\n');

      try {
        const allProducts = await scraper.scrapeStoreInCity(city);
        // Limit to first 5 products for testing
        const products = allProducts.slice(0, 5);
        results[city] = {
          success: true,
          count: products.length,
          totalFound: allProducts.length,
          sample: products.slice(0, 3)
        };
        console.log(`✅ ${city}: ${products.length} products (of ${allProducts.length} found)`);

        // Show sample products
        if (products.length > 0) {
          console.log('\n   Sample products:');
          products.slice(0, 3).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name} - ${p.price} kr`);
          });
        }

      } catch (error) {
        results[city] = {
          success: false,
          error: error.message
        };
        console.log(`❌ ${city}: Failed - ${error.message}`);
      }

      // Wait between cities to avoid rate limiting
      console.log('\n   Waiting 3 seconds before next city...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Summary
    console.log('\n\n' + '═'.repeat(40));
    console.log('SUMMARY');
    console.log('═'.repeat(40));

    for (const [city, result] of Object.entries(results)) {
      if (result.success) {
        console.log(`✅ ${city}: ${result.count} products`);
      } else {
        console.log(`❌ ${city}: ${result.error}`);
      }
    }

    // Save results
    const fs = require('fs');
    fs.writeFileSync('multi-city-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to multi-city-results.json');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await scraper.close();
  }
}

testMultipleCities();

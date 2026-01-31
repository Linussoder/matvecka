const ICAScraper = require('./ica-scraper');

async function testScraper() {
  const scraper = new ICAScraper();

  try {
    await scraper.init();

    // Test with Helsingborg
    const city = 'Helsingborg';
    console.log(`\n🎯 Testing scraper with city: ${city}\n`);

    const products = await scraper.scrapeStoreInCity(city);

    console.log('\n📊 Scraped Products:');
    console.log('==================');

    // Show first 10 products
    products.slice(0, 10).forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Price: ${product.price} kr/${product.unit}`);
      console.log(`   Category: ${product.category}`);
      if (product.image_url) {
        console.log(`   Image: ${product.image_url.substring(0, 50)}...`);
      }
    });

    console.log(`\n✅ Total products: ${products.length}`);

    // Save to JSON for inspection
    const fs = require('fs');
    fs.writeFileSync('scraped-products.json', JSON.stringify(products, null, 2));
    console.log('💾 Saved all products to scraped-products.json');

    // Keep browser open for 10 seconds so you can see the page
    console.log('\n⏸️  Browser will stay open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await scraper.close();
  }
}

testScraper();

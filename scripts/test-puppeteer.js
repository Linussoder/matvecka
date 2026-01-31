const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('🚀 Starting Puppeteer test...');

  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true in production
    args: ['--no-sandbox']
  });

  // Create new page
  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to ICA
  console.log('📡 Navigating to ICA...');
  await page.goto('https://www.ica.se/handla/erbjudanden/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Take screenshot
  await page.screenshot({ path: 'ica-screenshot.png' });
  console.log('📸 Screenshot saved as ica-screenshot.png');

  // Get page title
  const title = await page.title();
  console.log('📄 Page title:', title);

  // Close browser
  await browser.close();
  console.log('✅ Test complete!');
}

testPuppeteer().catch(err => {
  console.error('❌ Error:', err);
});

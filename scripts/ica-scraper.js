const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class ICAScraper {
  constructor() {
    this.baseUrl = 'https://www.ica.se';
    this.offersUrl = 'https://www.ica.se/handla/erbjudanden/';
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Initializing ICA Scraper...');

    this.browser = await puppeteer.launch({
      headless: false, // Set to true in production, false for debugging
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      defaultViewport: {
        width: 1280,
        height: 800
      }
    });

    this.page = await this.browser.newPage();

    // Set user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('✅ Browser initialized');
  }

  // Helper: delay function (replaces deprecated waitForTimeout)
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async handleCookieConsent() {
    console.log('🍪 Checking for cookie consent...');

    try {
      // Wait for cookie popup (max 5 seconds)
      await this.page.waitForSelector('button', { timeout: 5000 });

      // Look for "Godkänn kakor" button
      const cookieButton = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cookieBtn = buttons.find(btn =>
          btn.textContent.includes('Godkänn kakor') ||
          btn.textContent.includes('Godkann kakor')
        );
        return cookieBtn ? true : false;
      });

      if (cookieButton) {
        // Click the button by text content
        await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const cookieBtn = buttons.find(btn =>
            btn.textContent.includes('Godkänn kakor') ||
            btn.textContent.includes('Godkann kakor')
          );
          if (cookieBtn) cookieBtn.click();
        });

        console.log('✅ Cookie consent accepted');
        await this.delay(2000); // Wait for popup to close
      } else {
        console.log('ℹ️  No cookie consent popup found');
      }

    } catch (error) {
      console.log('ℹ️  Cookie consent handling skipped (timeout or not found)');
    }
  }

  async selectStore(city) {
    console.log(`📍 Selecting store in ${city}...`);

    try {
      // First, check if we need to click "Hitta butik efter ort" to reset store selection
      // This button should be clicked to show the city list
      const buttonClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));

        // First try to find "Hitta butik efter ort" button
        let storeBtn = buttons.find(btn =>
          btn.textContent.includes('Hitta butik efter ort')
        );

        // If not found, try "Byt butik" (change store) button
        if (!storeBtn) {
          storeBtn = buttons.find(btn =>
            btn.textContent.includes('Byt butik') ||
            btn.textContent.includes('Ändra butik')
          );
        }

        if (storeBtn) {
          storeBtn.click();
          return { clicked: true, text: storeBtn.textContent.trim() };
        }
        return { clicked: false };
      });

      if (buttonClicked.clicked) {
        console.log(`   Step 1: Clicked "${buttonClicked.text}"`);
      } else {
        console.log('   Step 1: Looking for store selection button...');
      }

      await this.delay(2000);

      // Now click "Hitta butik efter ort" if we clicked a different button before
      const hittaClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const storeBtn = buttons.find(btn =>
          btn.textContent.includes('Hitta butik efter ort')
        );
        if (storeBtn) {
          storeBtn.click();
          return true;
        }
        return false;
      });

      if (hittaClicked) {
        console.log('   Step 1b: Clicked "Hitta butik efter ort"');
        await this.delay(2000);
      }

      // Take screenshot to see city list
      await this.page.screenshot({ path: 'step1-city-list.png' });
      console.log('   📸 Screenshot saved to step1-city-list.png');

      // Step 2: Scroll down to find the city in the alphabetical list
      // Cities starting with H are further down
      await this.page.evaluate(() => {
        window.scrollBy(0, 500);
      });
      await this.delay(1000);

      // Step 3: Find and click on the city link (red text)
      // Look for links/buttons with the city name
      const cityClicked = await this.page.evaluate((searchCity) => {
        // Look for all links and buttons - cities are shown as red links
        const allLinks = document.querySelectorAll('a, button, span');

        for (const el of allLinks) {
          const text = el.textContent?.trim();
          // Exact match for city name
          if (text && text.toLowerCase() === searchCity.toLowerCase()) {
            el.click();
            return { found: true, text: text };
          }
        }

        return { found: false };
      }, city);

      if (cityClicked.found) {
        console.log(`   Step 2: Clicked city "${cityClicked.text}" (red link)`);
      } else {
        // Try scrolling more and searching again
        console.log(`   Scrolling more to find "${city}"...`);
        await this.page.evaluate(() => {
          window.scrollBy(0, 800);
        });
        await this.delay(1000);

        const cityClickedRetry = await this.page.evaluate((searchCity) => {
          const allLinks = document.querySelectorAll('a, button, span');
          for (const el of allLinks) {
            const text = el.textContent?.trim();
            if (text && text.toLowerCase() === searchCity.toLowerCase()) {
              el.click();
              return { found: true, text: text };
            }
          }
          return { found: false };
        }, city);

        if (cityClickedRetry.found) {
          console.log(`   Step 2: Clicked city "${cityClickedRetry.text}" (red link)`);
        } else {
          console.log(`   ⚠️ Could not find "${city}" in city list`);
        }
      }

      // Wait for new page with stores to load
      await this.delay(3000);

      // Take screenshot of stores page
      await this.page.screenshot({ path: 'step2-stores-page.png' });
      console.log('   📸 Screenshot saved to step2-stores-page.png');

      // Step 3: Find the store card for "Maxi ICA Stormarknad" and click its "Välj butik" button
      // The store is displayed as a card with grey text, and a red "Välj butik" button
      const storeSelected = await this.page.evaluate(() => {
        // Find all potential store cards/containers
        const allContainers = document.querySelectorAll('div, article, li, section');

        for (const container of allContainers) {
          const text = container.textContent || '';

          // Check if this container has "Maxi ICA Stormarknad"
          if (text.includes('Maxi ICA Stormarknad')) {
            // Look for the "Välj butik" button inside this container
            const buttons = container.querySelectorAll('button, a');
            for (const btn of buttons) {
              const btnText = btn.textContent?.trim().toLowerCase();
              if (btnText === 'välj butik' || btnText?.includes('välj butik')) {
                btn.click();
                return { found: true, store: 'Maxi ICA Stormarknad', button: btn.textContent?.trim() };
              }
            }
          }
        }

        // Fallback: try ICA Kvantum or other stores
        for (const container of allContainers) {
          const text = container.textContent || '';
          if (text.includes('ICA Kvantum') || text.includes('ICA Supermarket')) {
            const buttons = container.querySelectorAll('button, a');
            for (const btn of buttons) {
              const btnText = btn.textContent?.trim().toLowerCase();
              if (btnText === 'välj butik' || btnText?.includes('välj butik')) {
                btn.click();
                return { found: true, store: text.substring(0, 40), button: btn.textContent?.trim() };
              }
            }
          }
        }

        // Last fallback: just click the first "Välj butik" button
        const allButtons = document.querySelectorAll('button, a');
        for (const btn of allButtons) {
          const btnText = btn.textContent?.trim().toLowerCase();
          if (btnText === 'välj butik' || btnText?.includes('välj butik')) {
            btn.click();
            return { found: true, store: 'First available', button: btn.textContent?.trim() };
          }
        }

        return { found: false };
      });

      if (storeSelected.found) {
        console.log(`   Step 3: Found store "${storeSelected.store}", clicked "${storeSelected.button}"`);
      } else {
        console.log('   ⚠️ Could not find store with "Välj butik" button');
      }

      await this.delay(3000);

      // Step 4: Click on "Erbjudanden" to see weekly offers
      const offersClicked = await this.page.evaluate(() => {
        const allLinks = document.querySelectorAll('a, button, span, div');

        for (const el of allLinks) {
          const text = el.textContent?.trim();
          if (text === 'Erbjudanden' || text === 'erbjudanden') {
            el.click();
            return { found: true, text: text };
          }
        }

        return { found: false };
      });

      if (offersClicked.found) {
        console.log(`   Step 4: Clicked "${offersClicked.text}"`);
      } else {
        console.log('   ⚠️ Could not find "Erbjudanden" link');
      }

      await this.delay(3000);

      // Take final screenshot and log URL
      const currentUrl = this.page.url();
      console.log(`   Current URL: ${currentUrl}`);
      await this.page.screenshot({ path: 'store-selected.png' });
      console.log('   📸 Screenshot saved to store-selected.png');

      console.log('✅ Store selection complete');

    } catch (error) {
      console.error('❌ Error selecting store:', error.message);
      throw new Error(`Failed to select store in ${city}: ${error.message}`);
    }
  }

  async scrapeProducts() {
    console.log('📦 Scraping products...');

    try {
      // Wait for products to load - using promotions page selectors
      await this.page.waitForSelector('[data-retailer-anchor="fop"], [class*="product"]', {
        timeout: 15000
      });

      // Scroll to load lazy-loaded images
      await this.autoScroll();

      // Get page HTML
      const html = await this.page.content();

      // Save for debugging
      const fs = require('fs');
      fs.writeFileSync('debug-ica-products.html', html);
      console.log('💾 Saved HTML to debug-ica-products.html');

      // Parse with Cheerio
      const $ = cheerio.load(html);
      const products = [];

      // Promotions page uses data-retailer-anchor="fop" for offer items
      const selectors = [
        '[data-retailer-anchor="fop"]',     // Offer cards on promotions page
        '.promotion-container',              // Promotion containers
        '[class*="product-card"]',
        '.bg-white.rounded-md.shadow-sm',
        'article'
      ];

      let productElements = null;
      for (const selector of selectors) {
        productElements = $(selector);
        if (productElements.length > 0) {
          console.log(`   Found ${productElements.length} products using selector: ${selector}`);
          break;
        }
      }

      if (!productElements || productElements.length === 0) {
        throw new Error('No product elements found. Website structure may have changed.');
      }

      // Extract product data
      productElements.each((index, element) => {
        try {
          const $el = $(element);

          // For promotions page, look for offer-specific elements
          const $priceWrapper = $el.find('[data-test="fop-price-wrapper"]').first();
          const $offerText = $el.find('[data-test="fop-offer-text"]').first();
          const $link = $el.find('a').first();

          // Try to get name from various sources
          let name = $el.find('[data-test="fop-product-name"]').text().trim();
          if (!name) {
            name = $el.find('h2, h3, h4, [class*="name"], [class*="title"]').first().text().trim();
          }
          if (!name) {
            // Try getting text from links
            name = $link.attr('title') || $link.text().trim();
          }

          // Get price from offer elements
          let priceText = $priceWrapper.text().trim() || $offerText.text().trim();
          if (!priceText) {
            priceText = $el.find('[class*="price"]').text().trim();
          }
          let categoriesRaw = null;

          // Fallback: try text-based extraction
          if (!name) {
            name = this.extractText($el, [
              'h2', 'h3', 'h4',
              '[class*="title"]',
              '[class*="name"]',
              '.product-link'
            ]);
          }

          // Fallback for price - try multiple selectors
          if (!priceText || priceText === '0') {
            priceText = this.extractText($el, [
              '[class*="price"]',
              '[class*="Price"]',
              '[class*="pris"]',
              'span[class*="amount"]',
              '.text-lg.font-bold',
              '.font-bold'
            ]);
          }

          // If still no price, try to find price patterns in element text
          if (!priceText || priceText === '0') {
            const fullText = $el.text();

            // Try "X för Y kr" format first (e.g., "4 för 50 kr", "2 för 69 kr")
            const multiPriceMatch = fullText.match(/(\d+)\s*för\s*(\d+)[,.]?(\d*)\s*kr/i);
            if (multiPriceMatch) {
              const quantity = parseInt(multiPriceMatch[1]);
              const totalPrice = parseFloat(multiPriceMatch[2] + (multiPriceMatch[3] ? '.' + multiPriceMatch[3] : ''));
              // Store as "quantity för price" format for now
              priceText = `${quantity} för ${totalPrice}`;
            } else {
              // Try regular "XX:-" or "XX kr" format
              const priceMatch = fullText.match(/(\d+)[,.]?(\d*)\s*(?::-|kr)/i);
              if (priceMatch) {
                priceText = priceMatch[1] + (priceMatch[2] ? '.' + priceMatch[2] : '');
              }
            }
          }

          const price = this.parsePrice(priceText);

          // Try to find image
          const image = this.extractImage($el);

          // Parse categories from data attribute
          let category = 'övrigt';
          if (categoriesRaw) {
            try {
              const cats = JSON.parse(categoriesRaw);
              category = cats[0] || 'övrigt';
            } catch (e) {
              category = this.categorizeProduct(name || '');
            }
          } else if (name) {
            category = this.categorizeProduct(name);
          }

          // Extract unit from name (e.g., "Majskorn 340g ICA")
          const unit = this.parseUnitFromName(name || '');

          // Only add if we have name
          if (name) {
            const product = {
              name: name,
              price: price || 0,
              unit: unit,
              image_url: image,
              category: category,
              url: $link.attr('href') ? 'https://handla.ica.se' + $link.attr('href') : null
            };

            products.push(product);
          }

        } catch (err) {
          // Skip this product if extraction fails
          console.log(`   ⚠️  Skipped product ${index}: ${err.message}`);
        }
      });

      console.log(`✅ Successfully scraped ${products.length} products`);
      return products;

    } catch (error) {
      console.error('❌ Error scraping products:', error.message);
      throw error;
    }
  }

  // Helper: Extract text from multiple possible selectors
  extractText($element, selectors) {
    for (const selector of selectors) {
      const text = $element.find(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }

  // Helper: Extract image from element
  extractImage($element) {
    const img = $element.find('img').first();
    if (img.length === 0) return null;

    // Try multiple attributes
    return img.attr('src') ||
           img.attr('data-src') ||
           img.attr('data-lazy-src') ||
           null;
  }

  // Helper: Auto-scroll to load all products
  async autoScroll() {
    await this.page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    console.log('   Scrolled to load all products');
    await this.delay(2000);
  }

  parsePrice(priceText) {
    if (!priceText) return null;

    // Handle "X för Y" format (e.g., "4 för 50", "2 för 69")
    const multiMatch = priceText.match(/(\d+)\s*för\s*(\d+)[,.]?(\d*)/i);
    if (multiMatch) {
      const quantity = parseInt(multiMatch[1]);
      const totalPrice = parseFloat(multiMatch[2] + (multiMatch[3] ? '.' + multiMatch[3] : ''));
      // Return per-unit price
      return Math.round((totalPrice / quantity) * 100) / 100;
    }

    // Remove currency symbols and parse
    // Examples: "49:-", "49 kr", "49,50 kr", "49.50"
    const cleaned = priceText
      .replace(/kr|:-|SEK/gi, '')
      .replace(/\s+/g, '')
      .replace(',', '.')
      .trim();

    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  parseUnit(unitText) {
    if (!unitText) return 'st';

    const unit = unitText.toLowerCase().trim();

    // Normalize units
    if (unit.includes('kg')) return 'kg';
    if (unit.includes('hg')) return 'hg';
    if (unit.includes('g') && !unit.includes('kg')) return 'g';
    if (unit.includes('liter') || unit.includes('l')) return 'liter';
    if (unit.includes('ml')) return 'ml';
    if (unit.includes('st') || unit.includes('styck')) return 'st';
    if (unit.includes('förp')) return 'förp';
    if (unit.includes('påse')) return 'påse';

    return 'st'; // default
  }

  // Parse unit from product name (e.g., "Majskorn 340g ICA" -> "g")
  parseUnitFromName(name) {
    if (!name) return 'st';

    const lowerName = name.toLowerCase();

    // Match patterns like "340g", "1.5kg", "500ml", "1l"
    if (lowerName.match(/\d+\s*kg/)) return 'kg';
    if (lowerName.match(/\d+\s*hg/)) return 'hg';
    if (lowerName.match(/\d+\s*g(?!ram)/)) return 'g';
    if (lowerName.match(/\d+\s*ml/)) return 'ml';
    if (lowerName.match(/\d+\s*l(?:iter)?/)) return 'liter';
    if (lowerName.match(/\d+\s*st/)) return 'st';
    if (lowerName.match(/\d+\s*cl/)) return 'cl';

    return 'st';
  }

  categorizeProduct(productName) {
    const name = productName.toLowerCase();

    // Meat & Poultry
    if (name.match(/kyckling|kött|biff|fläsk|lamm|kalv|korv|hamburgare|köttfärs/)) {
      return 'kött';
    }

    // Fish & Seafood
    if (name.match(/fisk|lax|torsk|sill|räka|musslor|skaldjur/)) {
      return 'fisk';
    }

    // Vegetables
    if (name.match(/tomat|gurka|sallad|paprika|lök|morot|potatis|broccoli|blomkål|zucchini|aubergine/)) {
      return 'grönsaker';
    }

    // Fruits
    if (name.match(/äpple|banan|apelsin|päron|druvor|melon|ananas|jordgubbar|blåbär/)) {
      return 'frukt';
    }

    // Dairy
    if (name.match(/mjölk|yoghurt|ost|smör|grädde|fil|ägg/)) {
      return 'mejeri';
    }

    // Bread & Grains
    if (name.match(/bröd|pasta|ris|müsli|flingor|knäckebröd|bagel|tortilla/)) {
      return 'spannmål';
    }

    // Frozen
    if (name.match(/fryst|frozen|glass/)) {
      return 'fryst';
    }

    // Beverages
    if (name.match(/dryck|juice|läsk|vatten|kaffe|te|vin|öl/)) {
      return 'dryck';
    }

    return 'övrigt';
  }

  async scrapeStoreInCity(city) {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call init() first.');
    }

    console.log(`\n🛒 Starting scrape for city: ${city}\n`);

    // Navigate to ICA offers page
    await this.page.goto(this.offersUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Handle cookie consent
    await this.handleCookieConsent();

    // Select store by city
    await this.selectStore(city);

    // Scrape products
    const products = await this.scrapeProducts();

    return products;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 Browser closed');
    }
  }
}

module.exports = ICAScraper;

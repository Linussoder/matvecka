# ICA Scraping Research

## URL Structure
- Main offers page: https://www.ica.se/handla/erbjudanden/
- Store-specific: [Document the pattern]

## HTML Structure (as of [DATE])

### Product Container
- Class: [e.g., "product-card"]
- Parent container: [e.g., "products-grid"]

### Product Name
- Element: [e.g., <h3 class="product-title">]
- Location: [where in the DOM]

### Price
- Element: [e.g., <span class="price">]
- Format: [e.g., "49:-" or "49 kr"]

### Image
- Element: [<img>]
- Attribute: [src or data-src]

### Valid Dates
- Located: [where you find "Gäller: 27/1 - 2/2"]

## Notes
- Is JavaScript required to load products? [Yes/No]
- Are products paginated? [Yes/No]
- Any anti-scraping measures? [CAPTCHA, rate limiting]

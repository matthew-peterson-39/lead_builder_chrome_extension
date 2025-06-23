// Simplified content script
console.log('Lead Builder content script loaded on:', window.location.href);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractLeadData") {
    try {
      console.log('Extracting lead data for:', request.url);
      
      const leadData = extractPageData(request.url);
      console.log('Extracted data:', leadData);
      
      // Send data back to background script
      chrome.runtime.sendMessage({
        action: "saveLeadData",
        data: leadData
      });
      
      sendResponse({ success: true, data: leadData });
      
    } catch (error) {
      console.error('Error extracting lead data:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

// Extract data from the current page
function extractPageData(url) {
  return {
    websiteUrl: url,
    companyName: extractCompanyName(),
    contactEmail: extractEmail(),
    phoneNumber: extractPhone(),
    market: extractMarket(),
    description: extractDescription(),
    extractionMethod: 'advanced'
  };
}

// Extract company name
function extractCompanyName() {
  // Try multiple methods
  let name = '';
  
  // Method 1: Page title
  const title = document.title;
  if (title) {
    name = title.replace(/\s*[\|\-\–]\s*(Home|About|Contact|Welcome).*$/i, '').trim();
  }
  
  // Method 2: Meta property
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName?.content) {
    name = ogSiteName.content;
  }
  
  // Method 3: Logo alt text
  const logo = document.querySelector('img[alt*="logo" i], img[class*="logo" i]');
  if (logo?.alt && !name) {
    name = logo.alt.replace(/logo/i, '').trim();
  }
  
  // Method 4: Domain fallback
  if (!name) {
    name = window.location.hostname.replace(/^www\./, '').split('.')[0];
  }
  
  return name || 'Unknown Company';
}

// Extract email
function extractEmail() {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const pageText = document.body.innerText;
  const emails = pageText.match(emailRegex);
  
  if (emails?.length > 0) {
    // Filter out generic emails
    const filteredEmails = emails.filter(email => 
      !email.includes('example.com') && 
      !email.includes('test') &&
      !email.includes('noreply') &&
      !email.includes('no-reply')
    );
    return filteredEmails[0] || emails[0];
  }
  
  return '';
}

// Extract phone
function extractPhone() {
  const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const pageText = document.body.innerText;
  const phones = pageText.match(phoneRegex);
  return phones?.[0] || '';
}

// Extract market/industry
function extractMarket() {
  const pageText = document.body.innerText.toLowerCase();
  
  const keywords = {
    'technology': ['software', 'app', 'tech', 'digital', 'platform', 'saas', 'ai', 'data'],
    'ecommerce': ['shop', 'store', 'buy', 'cart', 'product', 'retail', 'marketplace'],
    'healthcare': ['health', 'medical', 'doctor', 'clinic', 'hospital', 'wellness'],
    'finance': ['bank', 'finance', 'investment', 'insurance', 'loan', 'credit'],
    'education': ['education', 'school', 'university', 'course', 'learning', 'training'],
    'marketing': ['marketing', 'advertising', 'seo', 'social media', 'brand'],
    'consulting': ['consulting', 'advisory', 'professional services', 'strategy'],
    'manufacturing': ['manufacturing', 'factory', 'production', 'industrial'],
    'real estate': ['real estate', 'property', 'housing', 'rental', 'mortgage'],
    'food': ['restaurant', 'food', 'catering', 'cafe', 'dining', 'culinary']
  };
  
  let bestMatch = 'unknown';
  let maxMatches = 0;
  
  for (const [market, words] of Object.entries(keywords)) {
    const matches = words.filter(word => pageText.includes(word)).length;
    if (matches > maxMatches && matches >= 2) {
      maxMatches = matches;
      bestMatch = market;
    }
  }
  
  return bestMatch;
}

// Extract description
function extractDescription() {
  // Try meta description first
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc?.content) {
    return metaDesc.content.substring(0, 200);
  }
  
  // Try og:description
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc?.content) {
    return ogDesc.content.substring(0, 200);
  }
  
  // Try first paragraph
  const firstP = document.querySelector('p');
  if (firstP?.innerText) {
    return firstP.innerText.substring(0, 200);
  }
  
  // Try h1 + first text
  const h1 = document.querySelector('h1');
  if (h1?.innerText) {
    return h1.innerText.substring(0, 200);
  }
  
  return '';
}

console.log('Lead Builder content script ready');
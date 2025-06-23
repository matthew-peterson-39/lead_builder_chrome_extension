// content.js
console.log('Lead Builder content script loaded on:', window.location.href);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractLeadData") {
    console.log('Extracting lead data for:', request.url);
    
    const leadData = extractPageData(request.url);
    
    // Send data back to background script
    chrome.runtime.sendMessage({
      action: "saveLeadData",
      data: leadData
    });
  }
});

// Function to extract data from the current page
function extractPageData(url) {
  const data = {
    websiteUrl: url,
    companyName: extractCompanyName(),
    contactEmail: extractEmail(),
    phoneNumber: extractPhone(),
    market: extractMarket(),
    description: extractDescription()
  };
  
  console.log('Extracted data:', data);
  return data;
}

// Extract company name from page
function extractCompanyName() {
  // Try multiple methods to find company name
  let name = '';
  
  // Method 1: Page title (remove common suffixes)
  const title = document.title;
  if (title) {
    name = title.replace(/\s*[\|\-\–]\s*(Home|About|Contact|Welcome).*$/i, '').trim();
  }
  
  // Method 2: Meta property
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName && ogSiteName.content) {
    name = ogSiteName.content;
  }
  
  // Method 3: Logo alt text
  const logo = document.querySelector('img[alt*="logo" i], img[class*="logo" i]');
  if (logo && logo.alt && !name) {
    name = logo.alt.replace(/logo/i, '').trim();
  }
  
  // Method 4: Domain name as fallback
  if (!name) {
    name = window.location.hostname.replace(/^www\./, '').split('.')[0];
  }
  
  return name;
}

// Extract email addresses
function extractEmail() {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const pageText = document.body.innerText;
  const emails = pageText.match(emailRegex);
  
  if (emails && emails.length > 0) {
    // Filter out common generic emails
    const filteredEmails = emails.filter(email => 
      !email.includes('example.com') && 
      !email.includes('test') &&
      !email.includes('noreply')
    );
    
    return filteredEmails[0] || emails[0];
  }
  
  return '';
}

// Extract phone numbers
function extractPhone() {
  const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const pageText = document.body.innerText;
  const phones = pageText.match(phoneRegex);
  
  return phones ? phones[0] : '';
}

// Try to determine market/industry
function extractMarket() {
  const pageText = document.body.innerText.toLowerCase();
  const keywords = {
    'bedding': ['bed', 'mattress', 'pillow', 'sheets', 'comforter', 'bedroom'],
    'supplements': ['supplement', 'vitamin', 'nutrition', 'health', 'wellness', 'protein'],
    'technology': ['software', 'app', 'tech', 'digital', 'platform', 'solution'],
    'ecommerce': ['shop', 'store', 'buy', 'cart', 'product', 'retail'],
    'services': ['service', 'consulting', 'agency', 'professional', 'business']
  };
  
  for (const [market, words] of Object.entries(keywords)) {
    const matches = words.filter(word => pageText.includes(word));
    if (matches.length >= 2) {
      return market;
    }
  }
  
  return 'unknown';
}

// Extract page description
function extractDescription() {
  // Try meta description first
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && metaDesc.content) {
    return metaDesc.content.substring(0, 200);
  }
  
  // Try og:description
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && ogDesc.content) {
    return ogDesc.content.substring(0, 200);
  }
  
  // Fallback to first paragraph
  const firstP = document.querySelector('p');
  if (firstP && firstP.innerText) {
    return firstP.innerText.substring(0, 200);
  }
  
  return '';
}
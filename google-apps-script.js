// Google Apps Script - Lead Builder Integration with CSE and PageSpeed API
// This script handles PageSpeed API calls, Google Custom Search, and Google Sheets updates

// Configuration - UPDATE THESE VALUES WITH YOUR OWN
const CONFIG = {
  PAGESPEED_API_KEY: 'YOUR_PAGESPEED_API_KEY_HERE',
  CSE_API_KEY: 'YOUR_CUSTOM_SEARCH_API_KEY_HERE', // Can be same as PageSpeed API key
  CSE_ID: 'YOUR_CUSTOM_SEARCH_ENGINE_ID_HERE',
  SHEET_ID: 'YOUR_GOOGLE_SHEETS_ID_HERE',
  SHEET_NAME: 'Sheet1' // Change to your preferred sheet name
};

/**
 * Main function to handle POST requests from Chrome extension
 */
function doPost(e) {
  try {
    // Parse the request
    const data = JSON.parse(e.postData.contents);
    const url = data.url;
    const timestamp = data.timestamp;
    
    console.log('Processing URL:', url);
    
    // Get PageSpeed data
    const pageSpeedData = getPageSpeedScore(url);
    
    // Add to Google Sheet
    addToSheet(url, pageSpeedData, timestamp);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        url: url,
        pageSpeedData: pageSpeedData
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing request:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * AUTOMATED WORKFLOW: Bulk search and process function
 * This automates your entire lead generation workflow
 * Run this function to automatically search, analyze, and save leads
 */
function runAutomatedSearch() {
  const query = 'site:myshopify.com'; // Update with your search query
  const maxResults = 100;
  
  try {
    console.log(`Starting automated search for: ${query}`);
    
    // Get existing URLs from sheet to avoid duplicates
    const existingUrls = getExistingUrlsFromSheet();
    console.log(`Found ${existingUrls.size} existing URLs in sheet`);
    
    // Get search results (just URLs)
    const searchUrls = getSearchResults(query, maxResults);
    console.log(`Found ${searchUrls.length} search results`);
    
    // Process each URL
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const url of searchUrls) {
      try {
        console.log(`Processing ${processed + skipped + 1}/${searchUrls.length}: ${url}`);
        
        // Extract base URL
        const baseUrl = getBaseUrl(url);
        if (!baseUrl) {
          console.error(`Invalid URL: ${url}`);
          errors++;
          continue;
        }
        
        // Check if base URL already exists in sheet
        if (existingUrls.has(baseUrl)) {
          console.log(`Skipping duplicate: ${baseUrl}`);
          skipped++;
          continue;
        }
        
        // Get PageSpeed data for this URL (only for new URLs)
        const pageSpeedData = getPageSpeedScore(url);
        
        // Add to sheet using base URL
        addToSheetAutomated(baseUrl, pageSpeedData);
        
        // Add to our existing URLs set to avoid processing duplicates in this same run
        existingUrls.add(baseUrl);
        
        processed++;
        
        // Add delay to avoid rate limiting
        Utilities.sleep(2000); // 2 second delay between requests
        
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        errors++;
        
        // Log the error in the sheet
        addErrorToSheet(url, error.toString());
      }
    }
    
    console.log(`Automation complete!`);
    console.log(`- Processed: ${processed} new URLs`);
    console.log(`- Skipped: ${skipped} duplicates`);
    console.log(`- Errors: ${errors}`);
    
  } catch (error) {
    console.error('Error in automated search:', error);
  }
}

/**
 * Get existing URLs from sheet to avoid duplicates
 */
function getExistingUrlsFromSheet() {
  try {
    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      // No data rows (only headers or empty sheet)
      return new Set();
    }
    
    // Get all URLs from column B (URL column)
    const urlRange = sheet.getRange(2, 2, lastRow - 1, 1); // Start from row 2, column 2 (B2)
    const urlValues = urlRange.getValues();
    
    // Convert to Set for fast lookup, filter out empty values
    const existingUrls = new Set();
    urlValues.forEach(row => {
      const url = row[0];
      if (url && url.toString().trim() !== '') {
        existingUrls.add(url.toString().trim());
      }
    });
    
    return existingUrls;
    
  } catch (error) {
    console.error('Error reading existing URLs from sheet:', error);
    return new Set(); // Return empty set on error to allow processing to continue
  }
}

/**
 * Get search results from Google Custom Search API
 */
function getSearchResults(query, maxResults = 50) {
  const allUrls = [];
  const resultsPerPage = 10; // Google CSE returns max 10 per request
  const maxPages = Math.ceil(Math.min(maxResults, 100) / resultsPerPage); // CSE has 100 result limit
  
  for (let page = 0; page < maxPages; page++) {
    const startIndex = (page * resultsPerPage) + 1;
    
    try {
      console.log(`Fetching page ${page + 1} (results ${startIndex}-${startIndex + 9})`);
      
      const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${CONFIG.CSE_API_KEY}&cx=${CONFIG.CSE_ID}&q=${encodeURIComponent(query)}&start=${startIndex}`;
      
      const response = UrlFetchApp.fetch(apiUrl);
      const data = JSON.parse(response.getContentText());
      
      if (data.error) {
        console.error('CSE API Error:', data.error);
        break;
      }
      
      if (data.items && data.items.length > 0) {
        // Extract only the URLs
        const pageUrls = data.items.map(item => item.link);
        
        allUrls.push(...pageUrls);
        console.log(`Added ${pageUrls.length} URLs from page ${page + 1}`);
        
        // If we got fewer than 10 results, we've reached the end
        if (pageUrls.length < resultsPerPage) {
          break;
        }
      } else {
        console.log(`No more results found at page ${page + 1}`);
        break;
      }
      
      // Add delay between API calls to be respectful
      if (page < maxPages - 1) {
        Utilities.sleep(1000); // 1 second delay between search requests
      }
      
    } catch (error) {
      console.error(`Error fetching page ${page + 1}:`, error);
      break;
    }
  }
  
  return allUrls.slice(0, maxResults); // Trim to requested max
}

/**
 * Extract base URL function (Google Apps Script compatible)
 */
function getBaseUrl(url) {
  try {
    // Use regex to extract protocol and hostname since URL constructor isn't available in Apps Script
    const match = url.match(/^(https?:\/\/[^\/]+)/);
    if (match) {
      return match[1];
    } else {
      console.error('Invalid URL format:', url);
      return null;
    }
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

/**
 * Test function for development
 */
function testScript() {
  const testData = {
    url: 'https://example.com',
    timestamp: new Date().toISOString()
  };
  
  const pageSpeedData = getPageSpeedScore(testData.url);
  console.log('PageSpeed Data:', pageSpeedData);
  
  addToSheet(testData.url, pageSpeedData, testData.timestamp);
}

/**
 * Test function for search functionality
 */
function testSearch() {
  const query = 'site:example.com'; // Update with your test query
  const urls = getSearchResults(query, 5); // Test with just 5 results
  
  // Get existing URLs to check for duplicates
  const existingUrls = getExistingUrlsFromSheet();
  
  console.log('Search Results (URLs only):');
  console.log(`Found ${existingUrls.size} existing URLs in sheet`);
  console.log('');
  
  urls.forEach((url, index) => {
    const baseUrl = getBaseUrl(url);
    const isDuplicate = existingUrls.has(baseUrl);
    
    console.log(`${index + 1}. Full URL: ${url}`);
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Status: ${isDuplicate ? 'DUPLICATE (would skip)' : 'NEW (would process)'}`);
    console.log('');
  });
}

/**
 * Get PageSpeed score from Google PageSpeed Insights API
 */
function getPageSpeedScore(url) {
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${CONFIG.PAGESPEED_API_KEY}&strategy=mobile`;
    
    const response = UrlFetchApp.fetch(apiUrl);
    const data = JSON.parse(response.getContentText());
    
    if (data.error) {
      console.error('PageSpeed API Error:', data.error);
      return {
        performanceScore: 'Error',
        firstContentfulPaint: 'Error',
        largestContentfulPaint: 'Error',
        cumulativeLayoutShift: 'Error',
        error: data.error.message
      };
    }
    
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse.audits;
    
    // Extract key metrics
    const performanceScore = Math.round(lighthouse.categories.performance.score * 100);
    const firstContentfulPaint = audits['first-contentful-paint'].displayValue;
    const largestContentfulPaint = audits['largest-contentful-paint'].displayValue;
    const cumulativeLayoutShift = audits['cumulative-layout-shift'].displayValue;
    
    return {
      performanceScore: performanceScore,
      firstContentfulPaint: firstContentfulPaint,
      largestContentfulPaint: largestContentfulPaint,
      cumulativeLayoutShift: cumulativeLayoutShift,
      error: null
    };
    
  } catch (error) {
    console.error('Error fetching PageSpeed data:', error);
    return {
      performanceScore: 'Error',
      firstContentfulPaint: 'Error',
      largestContentfulPaint: 'Error',
      cumulativeLayoutShift: 'Error',
      error: error.toString()
    };
  }
}

/**
 * Add data to Google Sheet (for Chrome extension requests)
 */
function addToSheet(url, pageSpeedData, timestamp) {
  try {
    const sheet = getOrCreateSheet();
    
    // Prepare row data
    const rowData = [
      new Date(timestamp),
      url,
      pageSpeedData.performanceScore,
      pageSpeedData.firstContentfulPaint,
      pageSpeedData.largestContentfulPaint,
      pageSpeedData.cumulativeLayoutShift,
      pageSpeedData.error || ''
    ];
    
    // Add row to sheet
    sheet.appendRow(rowData);
    
    console.log('Data added to sheet successfully');
    
  } catch (error) {
    console.error('Error adding to sheet:', error);
    throw error;
  }
}

/**
 * Add data to Google Sheet (for automated processing)
 */
function addToSheetAutomated(baseUrl, pageSpeedData) {
  try {
    const sheet = getOrCreateSheet();
    
    // Prepare row data
    const rowData = [
      new Date(), // Current timestamp
      baseUrl, // Base URL instead of full URL
      pageSpeedData.performanceScore,
      pageSpeedData.firstContentfulPaint,
      pageSpeedData.largestContentfulPaint,
      pageSpeedData.cumulativeLayoutShift,
      pageSpeedData.error || ''
    ];
    
    // Add row to sheet
    sheet.appendRow(rowData);
    
    console.log('Data added to sheet successfully:', baseUrl);
    
  } catch (error) {
    console.error('Error adding to sheet:', error);
    throw error;
  }
}

/**
 * Add error entries to sheet
 */
function addErrorToSheet(url, errorMessage) {
  try {
    const sheet = getOrCreateSheet();
    const baseUrl = getBaseUrl(url) || url; // Use base URL or fallback to original
    
    const rowData = [
      new Date(),
      baseUrl,
      'Error',
      'Error',
      'Error',
      'Error',
      errorMessage
    ];
    
    sheet.appendRow(rowData);
    
  } catch (error) {
    console.error('Error adding error to sheet:', error);
  }
}

/**
 * Get or create the tracking sheet
 */
function getOrCreateSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      
      // Add headers
      const headers = [
        'Timestamp',
        'URL',
        'Performance Score',
        'First Contentful Paint',
        'Largest Contentful Paint',
        'Cumulative Layout Shift',
        'Error'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      
      // Set column widths
      sheet.setColumnWidth(1, 150); // Timestamp
      sheet.setColumnWidth(2, 300); // URL
      sheet.setColumnWidth(3, 120); // Performance Score
      sheet.setColumnWidth(4, 150); // First Contentful Paint
      sheet.setColumnWidth(5, 150); // Largest Contentful Paint
      sheet.setColumnWidth(6, 150); // Cumulative Layout Shift
      sheet.setColumnWidth(7, 200); // Error
    }
    
    return sheet;
    
  } catch (error) {
    console.error('Error accessing sheet:', error);
    throw error;
  }
}

/**
 * Setup function to initialize and test the script
 */
function setup() {
  console.log('Setting up Lead Builder Google Apps Script...');
  
  // Test sheet access
  try {
    const sheet = getOrCreateSheet();
    console.log('Sheet setup successful. Sheet name:', sheet.getName());
    
    // Test duplicate checking
    const existingUrls = getExistingUrlsFromSheet();
    console.log(`Found ${existingUrls.size} existing URLs in sheet for duplicate checking`);
    
  } catch (error) {
    console.error('Sheet setup failed:', error);
    return;
  }
  
  // Test PageSpeed API (optional)
  try {
    const testResult = getPageSpeedScore('https://google.com');
    console.log('PageSpeed API test successful:', testResult);
  } catch (error) {
    console.error('PageSpeed API test failed:', error);
  }
  
  // Test CSE API
  try {
    const testUrls = getSearchResults('site:example.com test', 2);
    console.log('CSE API test successful. Found URLs:', testUrls.length);
  } catch (error) {
    console.error('CSE API test failed:', error);
  }
  
  console.log('Setup complete!');
}
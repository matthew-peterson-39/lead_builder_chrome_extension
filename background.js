// background.js - Service Worker for Lead Builder Chrome Extension

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addLead",
    title: "Add Lead",
    contexts: ["link"],
    documentUrlPatterns: ["https://www.google.com/*", "https://google.com/*"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addLead") {
    const linkUrl = info.linkUrl;
    if (linkUrl) {
      processLead(linkUrl);
    }
  }
});

// Function to extract base URL
function getBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

// Function to process the lead
async function processLead(fullUrl) {
  try {
    // Extract base URL
    const baseUrl = getBaseUrl(fullUrl);
    
    if (!baseUrl) {
      showNotification('Error', 'Invalid URL provided');
      return;
    }

    // Show processing notification
    showNotification('Processing', `Adding lead: ${baseUrl}`);

    // Get stored Google Apps Script URL
    const result = await chrome.storage.sync.get(['gasUrl']);
    
    if (!result.gasUrl) {
      showNotification('Error', 'Please configure Google Apps Script URL in extension popup');
      return;
    }

    // Send to Google Apps Script
    await sendToGoogleAppsScript(baseUrl, result.gasUrl);
    
  } catch (error) {
    console.error('Error processing lead:', error);
    showNotification('Error', 'Failed to process lead');
  }
}

// Function to send data to Google Apps Script
async function sendToGoogleAppsScript(baseUrl, gasUrl) {
  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: baseUrl,
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const result = await response.json();
      showNotification('Success', `Lead added: ${baseUrl}`);
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending to Google Apps Script:', error);
    showNotification('Error', 'Failed to send data to Google Sheets');
  }
}

// Function to show notifications
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'lasso.png',
    title: title,
    message: message
  });
}
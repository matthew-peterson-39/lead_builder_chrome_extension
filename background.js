// Simplified background script
console.log('Lead Builder background script loaded');

// Import config
importScripts('config.js');

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToLeadTracker",
    title: "Add to Lead Tracker",
    contexts: ["link", "page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addToLeadTracker") {
    const url = info.linkUrl || info.pageUrl || tab.url;
    console.log('Adding URL to lead tracker:', url);
    
    // Check if we can inject content script
    if (!canInjectContentScript(tab.url)) {
      const basicLeadData = createBasicLeadData(url);
      await saveLead(basicLeadData);
      showNotification('Added basic lead data');
      return;
    }
    
    // Send message to content script
    try {
      chrome.tabs.sendMessage(tab.id, {
        action: "extractLeadData",
        url: url
      });
    } catch (error) {
      console.error('Failed to send message to content script:', error);
      const basicLeadData = createBasicLeadData(url);
      await saveLead(basicLeadData);
      showNotification('Added basic lead data');
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveLeadData") {
    console.log('Received lead data:', request.data);
    
    saveLead(request.data).then(() => {
      showNotification(`Added ${request.data.companyName || 'lead'} successfully!`);
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error saving lead:', error);
      showNotification('Error saving lead - saved locally only');
      sendResponse({ success: false, error: error.message });
    });
  }
  return true;
});

// Simplified save function using webhook
async function saveLead(leadData) {
  console.log('Saving lead:', leadData);
  
  try {
    // Always save locally first
    await saveLocally(leadData);
    
    // Try to send to Google Sheets via webhook
    if (CONFIG.WEBHOOK_URL && CONFIG.WEBHOOK_URL !== 'YOUR_APPS_SCRIPT_WEBHOOK_URL_HERE') {
      await sendToWebhook(leadData);
      console.log('✅ Saved to Google Sheets successfully');
    } else {
      console.log('⚠️ Webhook not configured - saved locally only');
    }
    
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    console.log('💾 Saved to local storage as fallback');
  }
}

// Save to local storage
function saveLocally(leadData) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['leads'], (result) => {
      const leads = result.leads || [];
      leads.push({
        ...leadData,
        dateAdded: new Date().toISOString(),
        savedAt: Date.now()
      });
      chrome.storage.local.set({ leads: leads }, () => {
        console.log('Saved locally');
        resolve();
      });
    });
  });
}

// Send to Google Apps Script webhook
async function sendToWebhook(leadData) {
  const response = await fetch(CONFIG.WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(leadData)
  });
  
  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Unknown webhook error');
  }
  
  return result;
}

// Helper functions
function canInjectContentScript(url) {
  const restrictedUrls = ['chrome://', 'chrome-extension://', 'moz-extension://', 'edge://', 'about:', 'file://'];
  return !restrictedUrls.some(restricted => url.startsWith(restricted));
}

function createBasicLeadData(url) {
  try {
    const urlObj = new URL(url);
    return {
      websiteUrl: url,
      companyName: urlObj.hostname.replace(/^www\./, '').split('.')[0] || 'Unknown',
      contactEmail: '',
      phoneNumber: '',
      market: 'unknown',
      description: 'Basic extraction from URL',
      extractionMethod: 'basic'
    };
  } catch (error) {
    return {
      websiteUrl: url,
      companyName: 'Unknown',
      contactEmail: '',
      phoneNumber: '',
      market: 'unknown',
      description: 'Error extracting data',
      extractionMethod: 'basic'
    };
  }
}

function showNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'lasso.png',
    title: 'Lead Builder',
    message: message
  });
}
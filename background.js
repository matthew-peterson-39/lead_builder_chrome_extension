// background.js - Fixed service worker version
console.log('Lead Builder background script loaded');

// Import config and sheets API for service workers
importScripts('config.js', 'sheets-api.js');

const sheetsAPI = new SheetsAPI();

// Create context menu when extension installs
chrome.runtime.onInstalled.addListener(() => {
  console.log('Creating context menu...');
  
  chrome.contextMenus.create({
    id: "addToLeadTracker",
    title: "Add to Lead Tracker",
    contexts: ["link", "page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info);
  
  if (info.menuItemId === "addToLeadTracker") {
    const url = info.linkUrl || info.pageUrl || tab.url;
    console.log('Adding URL to lead tracker:', url);
    
    chrome.tabs.sendMessage(tab.id, {
      action: "extractLeadData",
      url: url
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveLeadData") {
    console.log('Received lead data:', request.data);
    
    saveLead(request.data);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'lasso.png',
      title: 'Lead Builder',
      message: `Added ${request.data.companyName || 'lead'} to tracker!`
    });
  }
});

// Save lead function
async function saveLead(leadData) {
  try {
    // Add timestamp
    leadData.dateAdded = new Date().toISOString();
    
    // Try to save to Google Sheets
    await sheetsAPI.addLead(leadData);
    console.log('Lead saved to Google Sheets:', leadData);
    
    // Also save locally as backup
    chrome.storage.local.get(['leads'], (result) => {
      const leads = result.leads || [];
      leads.push(leadData);
      chrome.storage.local.set({ leads: leads });
    });
    
  } catch (error) {
    console.error('Failed to save to Google Sheets:', error);
    
    // Fallback to local storage only
    chrome.storage.local.get(['leads'], (result) => {
      const leads = result.leads || [];
      leads.push(leadData);
      chrome.storage.local.set({ leads: leads });
    });
  }
}
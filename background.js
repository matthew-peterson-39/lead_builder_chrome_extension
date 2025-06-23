// background.js
console.log('Lead Builder background script loaded');

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
    // Get the URL - either clicked link or current page
    const url = info.linkUrl || info.pageUrl || tab.url;

    console.log('Adding URL to lead tracker:', url);

    // Send message to content script to extract page data
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

    // For now, just save to local storage (we'll add Google Sheets later)
    saveLead(request.data);

    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'lasso.png',
      title: 'Lead Builder',
      message: `Added ${request.data.companyName || 'lead'} to tracker!`
    });
  }
});

// Add this to the top of background.js
importScripts('sheets-api.js');

const sheetsAPI = new SheetsAPI();

async function saveLead(leadData) {
  try {
    // Save to Google Sheets
    await sheetsAPI.addLead(leadData);

    console.log("Lead saved to Google Sheets:", leadData);

    // Also save locally as backup
    chrome.storage.local.get(["leads"], (result) => {
      const leads = result.leads || [];
      leadData.dateAdded = new Date().toISOString();
      leads.push(leadData);
      chrome.storage.local.set({ leads: leads });
    });
  } catch (error) {
    console.error("Failed to save to Google Sheets:", error);

    // Fallback to local storage only
    chrome.storage.local.get(["leads"], (result) => {
      const leads = result.leads || [];
      leadData.dateAdded = new Date().toISOString();
      leads.push(leadData);
      chrome.storage.local.set({ leads: leads });
    });
  }
}
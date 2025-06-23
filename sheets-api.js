// sheets-api.js - Service worker compatible
class SheetsAPI {
  constructor() {
    this.accessToken = null;
    // Use self.CONFIG instead of window.CONFIG in service workers
    const config = self.CONFIG || {};
    this.clientId = config.GOOGLE_CLIENT_ID || '';
    this.spreadsheetId = config.SPREADSHEET_ID || '';
    this.sheetName = config.SHEET_NAME || 'Sheet1';
  }

  // Authenticate with Google
  async authenticate() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.accessToken = token;
          resolve(token);
        }
      });
    });
  }

  // Add a lead to the Google Sheet
  async addLead(leadData) {
    try {
      if (!this.spreadsheetId) {
        throw new Error('Spreadsheet ID not configured. Please check config.js');
      }

      if (!this.accessToken) {
        await this.authenticate();
      }

      const values = [[
        leadData.websiteUrl,
        leadData.companyName,
        leadData.contactEmail,
        leadData.phoneNumber,
        leadData.market,
        leadData.dateAdded,
        'New', // Default status
        '' // Empty notes
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Lead added to Google Sheets:', result);
      return result;

    } catch (error) {
      console.error('Error adding lead to Google Sheets:', error);
      
      // If token expired, try to refresh
      if (error.message.includes('401')) {
        this.accessToken = null;
        return this.addLead(leadData); // Retry once
      }
      
      throw error;
    }
  }

  // Get all leads from the sheet
  async getLeads() {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      );

      const result = await response.json();
      return result.values || [];

    } catch (error) {
      console.error('Error getting leads from Google Sheets:', error);
      throw error;
    }
  }
}

// Make available in service worker context
self.SheetsAPI = SheetsAPI;
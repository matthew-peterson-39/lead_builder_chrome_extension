// sheets-api.js
class SheetsAPI {
  constructor() {
    this.accessToken = null;
    // Use config values
    this.clientId = window.CONFIG?.GOOGLE_CLIENT_ID || '';
    this.spreadsheetId = window.CONFIG?.SPREADSHEET_ID || '';
    this.sheetName = window.CONFIG?.SHEET_NAME || 'Sheet1';
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

  // Rest of your SheetsAPI methods...
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
        'New',
        ''
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.sheetName}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: values })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error adding lead to Google Sheets:', error);
      throw error;
    }
  }
}

window.SheetsAPI = SheetsAPI;
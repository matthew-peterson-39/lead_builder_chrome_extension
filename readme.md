# Lead Builder Chrome Extension + Automation Suite 🎯

A comprehensive lead generation solution that combines a Chrome extension for manual lead capture with automated bulk processing capabilities. This system streamlines lead generation by integrating Google Search, PageSpeed analysis, and automated data collection.

## ⏱️ Massive Time Savings
**Saves approximately 4+ minutes per lead** by automating:
- Manual URL copying from search results
- PageSpeed Insights analysis for each URL
- Data entry into spreadsheets
- Duplicate detection and management

**Plus automated bulk processing saves hours** by running unattended searches and analysis.

## 🚀 Dual Workflow System

### Manual Workflow (Chrome Extension)
- **One-Click Lead Capture**: Right-click any link in Google search results and select "Add Lead"
- **Instant PageSpeed Analysis**: Automatically runs PageSpeed Insights on captured URLs
- **Real-time Notifications**: Get instant feedback when leads are successfully processed

### Automated Workflow (Google Apps Script)
- **Bulk Search Processing**: Automatically search Google with custom queries
- **Smart Duplicate Detection**: Skips URLs already in your database
- **Comprehensive PageSpeed Analysis**: Full Core Web Vitals data collection
- **Error Handling & Logging**: Robust error management and reporting
- **Unattended Operation**: Run large searches without manual intervention

## 📊 Data Collected

For each lead, the system captures:
- **URL**: Clean base domain
- **Performance Score**: Google PageSpeed score (0-100)
- **First Contentful Paint**: Page loading speed metric
- **Largest Contentful Paint**: User experience metric
- **Cumulative Layout Shift**: Visual stability metric
- **Timestamp**: When the lead was captured
- **Error Status**: Any processing issues

## 🏗️ Technical Architecture

```
Manual:   Google Search → Chrome Extension → Google Apps Script → Google Sheets
Auto:     Google Custom Search API → PageSpeed API → Google Sheets
```

## 📦 Installation

### Step 1: Install Chrome Extension

1. **Download the Extension**
   ```bash
   git clone https://github.com/matthew-peterson-39/lead-builder-extension.git
   cd lead-builder-extension
   ```

2. **Configure the Extension**
   - Copy `config.example.js` to `config.js`
   - Update the `WEBHOOK_URL` with your Google Apps Script URL (see setup below)

3. **Load into Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory

### Step 2: Set Up Google APIs

1. **Enable Required APIs**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable these APIs:
     - PageSpeed Insights API
     - Custom Search JSON API
   - Create API credentials (API Key)

2. **Set Up Custom Search Engine**
   - Go to [Google Custom Search](https://cse.google.com/)
   - Create a new search engine
   - Configure search settings (whole web or specific sites)
   - Note your Search Engine ID

### Step 3: Deploy Google Apps Script

1. **Create the Script**
   - Go to [Google Apps Script](https://script.google.com/)
   - Create a new project
   - Copy the content from `google-apps-script.js` (included in this repo)

2. **Configure the Script**
   Update the CONFIG section with your values:
   ```javascript
   const CONFIG = {
     PAGESPEED_API_KEY: 'your-api-key-here',
     CSE_API_KEY: 'your-api-key-here', // Can be same as PageSpeed
     CSE_ID: 'your-custom-search-engine-id',
     SHEET_ID: 'your-google-sheets-id',
     SHEET_NAME: 'Sheet1'
   };
   ```

3. **Deploy as Web App**
   - Click "Deploy" → "New deployment"
   - Choose type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone" (for webhook functionality)
   - Click "Deploy" and copy the Web App URL

### Step 4: Create Google Sheets

1. Create a new Google Sheet
2. Copy the spreadsheet ID from the URL
3. Update your Google Apps Script with this ID
4. The script will automatically create headers and formatting

### Step 5: Configure Chrome Extension

1. Click the extension icon in Chrome
2. Paste your Google Apps Script Web App URL
3. Click "Save Configuration"

## 📖 Usage

### Manual Lead Capture (Chrome Extension)

1. **Search on Google**: Go to [google.com](https://google.com) and search for leads
2. **Right-click any result link**: You'll see "Add Lead" in the context menu
3. **Click "Add Lead"**: The system will:
   - Extract the base URL from the link
   - Run PageSpeed analysis
   - Save all data to your Google Sheet
   - Show success notification

### Automated Bulk Processing (Google Apps Script)

1. **Open Google Apps Script**: Go to your deployed script
2. **Configure Search Query**: Update the query in `runAutomatedSearch()` function
   ```javascript
   const query = 'site:shopify.com supplements'; // Your search terms
   const maxResults = 100; // How many results to process
   ```
3. **Run the Function**: Execute `runAutomatedSearch()` in the Apps Script editor
4. **Monitor Progress**: Check the logs for real-time processing updates

### Example Automated Queries
- `site:shopify.com fitness` - Find Shopify fitness stores
- `"magnesium supplements" -site:amazon.com` - Supplement sites excluding Amazon
- `inurl:contact "health products"` - Health product sites with contact pages

## 🔧 Advanced Features

### Google Apps Script Functions

- **`runAutomatedSearch()`**: Main automation function
- **`testSearch()`**: Test search functionality with small result set
- **`setup()`**: Initialize and test all API connections
- **`testScript()`**: Test PageSpeed analysis on single URL

### Chrome Extension Components

- **Background Script**: Handles context menu and lead processing
- **Content Script**: Visual feedback on Google search pages
- **Popup Interface**: Configuration and settings management

## 🔒 Security & Privacy

- **No Hardcoded Secrets**: All API keys configured by users
- **Minimal Permissions**: Only necessary Chrome permissions requested
- **HTTPS Communication**: All API calls use secure connections
- **Local Storage**: Configuration stored in Chrome's sync storage
- **Rate Limiting**: Built-in delays to respect API limits

## 📁 Project Structure

```
lead-builder-extension/
├── manifest.json              # Chrome extension manifest
├── background.js              # Extension service worker
├── content.js                # Extension content script
├── popup.html                # Extension popup UI
├── popup.js                  # Popup functionality
├── config.example.js         # Configuration template
├── google-apps-script.js     # Server-side automation script
├── lasso.png                 # Extension icon
├── .gitignore               # Git ignore file
├── LICENSE                  # MIT license
└── README.md                # This documentation
```

## 🚀 Getting Started Quick Guide

1. **Clone repository** → Load Chrome extension → Enable APIs
2. **Deploy Google Apps Script** → Configure with your API keys
3. **Test manual workflow** → Right-click on Google search results
4. **Test automated workflow** → Run `runAutomatedSearch()` in Apps Script
5. **Scale up** → Customize search queries and run bulk processing

## 🛠️ Development & Customization

### Customizing Search Queries
```javascript
// In google-apps-script.js, modify the runAutomatedSearch() function:
const query = 'your custom search terms';
const maxResults = 50; // Adjust based on needs
```

### Adding Custom Data Fields
Modify the `addToSheet()` functions to include additional data points from PageSpeed API or other sources.

### Chrome Extension Customization
Update `background.js` to modify context menu behavior or add additional features.

## 🐛 Troubleshooting

### Common Issues

**"Please configure Google Apps Script URL"**
- Solution: Open extension popup and enter your Google Apps Script deployment URL

**"PageSpeed API Error" or "CSE API Error"**
- Check API keys are valid and have proper permissions
- Verify APIs are enabled in Google Cloud Console
- Check API quotas and usage limits

**"Error accessing sheet"**
- Verify Google Sheets ID is correct
- Ensure Google Apps Script has permission to access the sheet
- Check that the sheet exists and is accessible

**No search results from automation**
- Verify Custom Search Engine configuration
- Check search query syntax
- Ensure CSE_ID is correct

### API Limits & Quotas

- **PageSpeed API**: 25,000 queries/day (free tier)
- **Custom Search API**: 100 queries @ 100/day (free tier), 10,000/day (paid)
- **Rate Limiting**: Built-in delays prevent exceeding limits

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Update both Chrome extension and Google Apps Script as needed
4. Test both manual and automated workflows
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

## 📊 Performance Metrics

### Time Savings Per Lead
- **Manual process**: ~4 minutes
- **With Chrome extension**: ~4 seconds
- **With automation**: ~10 seconds per URL (unattended)

### Bulk Processing Capabilities
- Process 100+ URLs automatically
- Handles duplicate detection
- Comprehensive error logging
- Respects API rate limits

## 🙋‍♂️ Support

For questions or issues:
1. Check [Issues](https://github.com/matthew-peterson-39/lead_builder_chrome_extension/issues)
2. Review the troubleshooting section above
3. Create new issue with:
   - Chrome version
   - Error messages
   - Steps to reproduce

---

**Built to scale lead generation from manual research to automated prospecting 🚀**
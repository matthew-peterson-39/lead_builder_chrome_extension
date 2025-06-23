document.addEventListener('DOMContentLoaded', () => {
  loadLeads();
  
  document.getElementById('clearBtn').addEventListener('click', clearLeads);
  document.getElementById('exportBtn').addEventListener('click', exportLeads);
});

function loadLeads() {
  chrome.storage.local.get(['leads'], (result) => {
    const leads = result.leads || [];
    
    document.getElementById('leadCount').textContent = `${leads.length} leads saved`;
    
    const leadsList = document.getElementById('leadsList');
    leadsList.innerHTML = '';
    
    if (leads.length === 0) {
      leadsList.innerHTML = '<p style="text-align: center; color: #666;">No leads yet. Right-click on a page or link to add one!</p>';
      return;
    }
    
    // Show last 5 leads
    const recentLeads = leads.slice(-5).reverse();
    
    recentLeads.forEach(lead => {
      const leadElement = document.createElement('div');
      leadElement.className = 'lead-item';
      
      leadElement.innerHTML = `
        <div class="lead-url">${lead.companyName || 'Unknown Company'}</div>
        <div>${new URL(lead.websiteUrl).hostname}</div>
        <div style="color: #666; margin-top: 5px;">
          ${lead.contactEmail || 'No email'} | ${lead.market || 'Unknown market'}
        </div>
      `;
      
      leadsList.appendChild(leadElement);
    });
    
    if (leads.length > 5) {
      const moreElement = document.createElement('div');
      moreElement.innerHTML = `<p style="text-align: center; color: #666;">... and ${leads.length - 5} more</p>`;
      leadsList.appendChild(moreElement);
    }
  });
}

function clearLeads() {
  if (confirm('Are you sure you want to clear all leads?')) {
    chrome.storage.local.set({ leads: [] }, () => {
      loadLeads();
    });
  }
}

function exportLeads() {
  chrome.storage.local.get(['leads'], (result) => {
    const leads = result.leads || [];
    console.log('All Leads:', leads);
    alert('Leads exported to console (F12 to view)');
  });
}
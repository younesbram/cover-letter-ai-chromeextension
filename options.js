// options.js
document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['resumeText', 'apiKey', 'model'], (items) => {
    document.getElementById('resumeText').value = items.resumeText || '';
    document.getElementById('apiKey').value = items.apiKey || '';
    document.getElementById('modelSelect').value = items.model || 'claude';
  });
});

document.getElementById('save').addEventListener('click', () => {
  const settings = {
    resumeText: document.getElementById('resumeText').value,
    apiKey: document.getElementById('apiKey').value,
    model: document.getElementById('modelSelect').value
  };

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    status.className = 'status success';
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 2000);
  });
});

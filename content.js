// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'copy') {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(message.text)
        .then(() => {
          console.log('Text copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy using modern API:', err);
          fallbackCopyTextToClipboard(message.text);
        });
    } else {
      // Use fallback for non-secure contexts
      fallbackCopyTextToClipboard(message.text);
    }
  }
  else if (message.type === 'error' || message.type === 'success') {
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 5px;
      z-index: 9999;
      color: white;
      font-family: Arial, sans-serif;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    notification.style.background = message.type === 'error' ? '#f44336' : '#4CAF50';
    notification.textContent = message.message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
});

// Fallback function for clipboard
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(textArea);
  
  try {
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    console.log(successful ? 'Text copied (fallback)' : 'Copy failed (fallback)');
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  
  document.body.removeChild(textArea);
}

// Add styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

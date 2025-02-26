// background.js
console.log('Background script loaded');

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Creating context menus');
  chrome.contextMenus.create({
    id: "generateCoverLetter",
    title: "Generate Cover Letter",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "generateLatex",
    title: "Generate LaTeX PDF",
    contexts: ["selection"]
  });
});

async function callAI(jobDescription, resume, model, apiKey) {
  console.log('Calling AI...');
  
  const prompt = `Write a professional cover letter for this job posting:\n\n${jobDescription}\n\nUsing this resume:\n\n${resume}`;
  
  try {
    if (model === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2024-01-01'
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }
      return data.content[0].text;
      
    } else if (model === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Groq API');
      }
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
}

async function generateLatex(text, model, apiKey) {
  const prompt = `Convert this text into a professional LaTeX document. Include necessary packages and proper document structure. Make sure the LaTeX code is clean and compilable:\n\n${text}\n\nRespond ONLY with the LaTeX code, nothing else.`;
  
  try {
    if (model === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2024-01-01'
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.content[0].text;
      
    } else if (model === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('LaTeX generation error:', error);
    throw error;
  }
}

// Handle right-click menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "generateCoverLetter") {
    try {
      const settings = await chrome.storage.sync.get(['resumeText', 'apiKey', 'model']);
      
      if (!settings.resumeText || !settings.apiKey) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'error',
          message: 'Please set your resume and API key in extension options first'
        });
        return;
      }

      // Show loading message
      await chrome.tabs.sendMessage(tab.id, {
        type: 'success',
        message: 'Generating cover letter...'
      });
      
      const coverLetter = await callAI(
        info.selectionText,
        settings.resumeText,
        settings.model || 'claude',
        settings.apiKey
      );

      // Copy to clipboard using content script
      await chrome.tabs.sendMessage(tab.id, {
        type: 'copy',
        text: coverLetter
      });
      
      // Show success notification
      await chrome.tabs.sendMessage(tab.id, {
        type: 'success',
        message: 'Cover letter copied to clipboard!'
      });
      
    } catch (error) {
      console.error('Error:', error);
      await chrome.tabs.sendMessage(tab.id, {
        type: 'error',
        message: error.message || 'Error generating cover letter'
      });
    }
  } 
  else if (info.menuItemId === "generateLatex") {
    try {
      const settings = await chrome.storage.sync.get(['apiKey', 'model']);
      
      if (!settings.apiKey) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'error',
          message: 'Please set your API key in extension options first'
        });
        return;
      }

      // Show processing notification
      await chrome.tabs.sendMessage(tab.id, {
        type: 'success',
        message: 'Generating LaTeX...'
      });

      const latexContent = await generateLatex(
        info.selectionText,
        settings.model || 'claude',
        settings.apiKey
      );

      // Copy LaTeX to clipboard
      await chrome.tabs.sendMessage(tab.id, {
        type: 'copy',
        text: latexContent
      });

      // Show success message
      await chrome.tabs.sendMessage(tab.id, {
        type: 'success',
        message: 'LaTeX code copied to clipboard! You can now paste it into your favorite LaTeX editor.'
      });
      
    } catch (error) {
      console.error('Error:', error);
      await chrome.tabs.sendMessage(tab.id, {
        type: 'error',
        message: error.message || 'Error generating LaTeX'
      });
    }
  }
});

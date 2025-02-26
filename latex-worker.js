importScripts('https://cdnjs.cloudflare.com/ajax/libs/latex.js/0.12.4/latex.min.js');

self.onmessage = async function(e) {
  const { latexContent } = e.data;
  
  try {
    const generator = new latexjs.HtmlGenerator({ hyphenate: false });
    const html = generator.parse(latexContent);
    
    // Convert to PDF using html2pdf
    const pdf = await html2pdf().from(html).outputPdf();
    
    self.postMessage({ success: true, pdf });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

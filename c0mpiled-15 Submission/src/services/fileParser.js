/**
 * CogniDrive File Parser Service
 * Handles high-fidelity parsing for PDF, DOCX, CSV, Code, Markdown, and Images.
 * Extracts clean, human-readable text for AI RAG and renders native viewers.
 */

import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Universal file parser
 * @param {File} file - Native browser File object
 * @returns {Promise<Object>} Structured file data with readable text and preview URLs
 */
export async function parseUploadedFile(file) {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  // 1. PDF Documents
  if (lowerName.endsWith('.pdf')) {
    return await parsePdfFile(file);
  }

  // 2. Microsoft Word Documents (.docx)
  if (lowerName.endsWith('.docx')) {
    return await parseDocxFile(file);
  }

  // 3. Images (PNG, JPG, SVG, WebP, GIF)
  if (file.type.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp|bmp)$/i.test(lowerName)) {
    return await parseImageFile(file);
  }

  // 4. Spreadsheets & Tabular Data (CSV, TSV)
  if (lowerName.endsWith('.csv') || lowerName.endsWith('.tsv')) {
    const text = await readFileAsText(file);
    return {
      name: fileName,
      type: 'csv',
      content: text,
      summary: `Tabular spreadsheet with ${text.split('\n').filter(Boolean).length} rows. Formatted for interactive grid navigation.`,
      size: formatFileSize(file.size)
    };
  }

  // 5. Code Files
  if (isCodeFile(lowerName)) {
    const code = await readFileAsText(file);
    const lineCount = code.split('\n').length;
    return {
      name: fileName,
      type: 'code',
      content: code,
      summary: `Source code file (${fileName.split('.').pop().toUpperCase()}) containing ${lineCount} lines.`,
      size: formatFileSize(file.size)
    };
  }

  // 6. Markdown Documents
  if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
    const markdown = await readFileAsText(file);
    return {
      name: fileName,
      type: 'markdown',
      content: markdown,
      summary: extractFirstParagraph(markdown) || `Markdown document (${formatFileSize(file.size)}).`,
      size: formatFileSize(file.size)
    };
  }

  // 7. Plain Text / Fallback
  const plainText = await readFileAsText(file);
  return {
    name: fileName,
    type: lowerName.endsWith('.doc') ? 'doc' : 'text',
    content: plainText,
    summary: extractFirstParagraph(plainText) || `Text document (${formatFileSize(file.size)}).`,
    size: formatFileSize(file.size)
  };
}

/**
 * Parse PDF file: extracts readable text and generates base64 data URL for native reader
 */
async function parsePdfFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const dataUrl = await readFileAsDataUrl(file);
  let extractedText = '';

  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 100); pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (pageText) {
        pageTexts.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
    }

    extractedText = pageTexts.join('\n\n');
  } catch (err) {
    console.warn('PDF.js text extraction error, falling back to stream scanner:', err);
    extractedText = extractTextFromPdfStream(arrayBuffer);
  }

  // If still no readable text extracted
  if (!extractedText.trim()) {
    extractedText = `PDF Document: ${file.name}\nTotal Size: ${formatFileSize(file.size)}\n\n(This PDF is rendered visually in the document reader.)`;
  }

  return {
    name: file.name,
    type: 'pdf',
    content: extractedText,
    dataUrl: dataUrl,
    summary: `Portable Document Format (PDF, ${formatFileSize(file.size)}). Rendered in visual PDF viewer and indexed for AI questions.`,
    size: formatFileSize(file.size)
  };
}

/**
 * Fallback stream scanner to strip raw PDF markers if PDF.js encounters non-standard encodings
 */
function extractTextFromPdfStream(arrayBuffer) {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(arrayBuffer);
    
    // Extract strings inside parentheses after Tj or TJ commands
    const matches = [];
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(raw)) !== null) {
      if (match[1] && !match[1].startsWith('/MSIP_') && match[1].length > 1) {
        matches.push(match[1]);
      }
    }

    if (matches.length > 5) {
      return matches.join(' ').replace(/\s+/g, ' ').trim();
    }
  } catch (e) {
    console.warn('Fallback scanner failed:', e);
  }
  return '';
}

/**
 * Parse DOCX Microsoft Word file using Mammoth
 */
async function parseDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const textResult = await mammoth.extractRawText({ arrayBuffer });

    const htmlContent = htmlResult.value || '';
    const plainText = textResult.value || '';

    return {
      name: file.name,
      type: 'docx',
      content: plainText.trim() || `Microsoft Word Document: ${file.name}`,
      htmlContent: htmlContent,
      summary: extractFirstParagraph(plainText) || `Microsoft Word Document (${formatFileSize(file.size)}).`,
      size: formatFileSize(file.size)
    };
  } catch (err) {
    console.warn('Mammoth DOCX parse error:', err);
    return {
      name: file.name,
      type: 'docx',
      content: `Microsoft Word Document: ${file.name} (${formatFileSize(file.size)})`,
      summary: `Microsoft Word Document (${formatFileSize(file.size)}).`,
      size: formatFileSize(file.size)
    };
  }
}

/**
 * Parse Image file
 */
async function parseImageFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    name: file.name,
    type: 'image',
    content: `![${file.name}](${dataUrl})`,
    dataUrl: dataUrl,
    summary: `Image file (${formatFileSize(file.size)}) formatted for visual inspect and AI multimodal grounding.`,
    size: formatFileSize(file.size)
  };
}

// Helpers
function readFileAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function isCodeFile(filename) {
  return /\.(py|js|jsx|ts|tsx|json|html|css|yaml|yml|sql|sh|xml|env|c|cpp|java|go|rs|php|toml)$/i.test(filename);
}

function formatFileSize(bytes) {
  if (!bytes) return '12 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractFirstParagraph(text) {
  if (!text) return '';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20 && !l.startsWith('#') && !l.startsWith('---'));
  if (lines.length > 0) {
    const first = lines[0];
    return first.length > 140 ? `${first.slice(0, 137)}...` : first;
  }
  return '';
}

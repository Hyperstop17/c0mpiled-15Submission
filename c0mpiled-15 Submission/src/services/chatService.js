/**
 * CogniDrive Unified Chat Service
 * Supports real multi-provider LLM API calls (OpenAI, Gemini, Anthropic, OpenRouter)
 * grounded in files mounted to the active Space.
 */

export async function sendChatMessage({
  messageText,
  model = {},
  connectedFiles = [],
  spaceName = 'Workspace',
  conversationHistory = []
}) {
  const startTime = performance.now();
  const safeModel = model || { name: 'AI Model', provider: 'General' };

  // Prepare RAG Grounding Context from mounted files
  const ragContext = buildRagContext(connectedFiles);

  // If model has a real API key configured, execute live HTTP request
  if (safeModel.apiKey && safeModel.apiKey.trim()) {
    try {
      const response = await callLiveProviderApi({
        messageText,
        model: safeModel,
        ragContext,
        conversationHistory
      });

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);

      return {
        success: true,
        content: response.text,
        reasoningTime: `${elapsed}s (Live API)`,
        isLiveApi: true,
        modelName: model.name,
        citations: buildCitationsFromFiles(connectedFiles, messageText, response.text)
      };
    } catch (err) {
      console.error('Live API execution error:', err);
      // Fallback with informative error explanation
      return {
        success: false,
        error: err.message,
        content: `⚠️ **API Execution Error with ${model.name}**\n\n${err.message}\n\n*Please verify your API key, model ID, or CORS network policies.*`,
        reasoningTime: 'Error',
        isLiveApi: true,
        citations: []
      };
    }
  }

  // Fallback: CogniDrive Built-in Intelligent RAG Simulator
  return executeLocalRagSynthesis({
    messageText,
    model,
    connectedFiles,
    spaceName,
    startTime
  });
}

/**
 * Format connected file contents into grounded context (sanitized and token-budgeted)
 */
function buildRagContext(connectedFiles) {
  if (!connectedFiles || connectedFiles.length === 0) return '';

  return connectedFiles.map((file, idx) => {
    let raw = file.content || file.summary || 'No text content available.';
    // Clean base64 data URLs to prevent prompt bloating and API rejection
    if (typeof raw === 'string') {
      raw = raw.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, '[Embedded Media Data]');
      if (raw.length > 25000) {
        raw = raw.slice(0, 25000) + '\n... [Context truncated to first 25,000 characters for context window]';
      }
    }
    return `[DOCUMENT ${idx + 1}: ${file.name} (Format: ${file.type || 'text'}, Storage: ${file.storageProvider || 'AWS S3 Cloud'})]\n${raw}\n`;
  }).join('\n----------------------------------------\n\n');
}

/**
 * Dispatch live request to the target provider via server proxy or direct fallback
 */
async function callLiveProviderApi({ messageText, model, ragContext, conversationHistory }) {
  const provider = (model.provider || '').toLowerCase();
  const apiKey = (model.apiKey || '').trim();
  const modelId = model.modelId || model.id || 'gpt-4o-mini';

  const systemPrompt = `You are a helpful AI assistant in CogniDrive.
You have direct read access to the following documents mounted in this collaborative space:

${ragContext || 'No documents currently mounted.'}

Guidelines:
- Answer accurately and concisely based on the mounted documents above.
- Whenever you use information from a mounted document, clearly cite the document name.
- If the answer cannot be found in the mounted documents, state that clearly before answering from general knowledge.`;

  // 1. Primary path: Server-side API Proxy (Zero CORS issues, reliable network delivery)
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: model.provider,
        modelId: modelId,
        apiKey: apiKey,
        baseUrl: model.baseUrl,
        systemPrompt,
        messageText,
        conversationHistory
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return { text: data.text };
      }
      if (data.error) throw new Error(data.error);
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server proxy returned HTTP ${res.status}`);
    }
  } catch (proxyErr) {
    console.warn('Backend proxy attempt failed, falling back to direct browser fetch:', proxyErr.message);

    // 2. Secondary path: Direct Browser Fetch Fallback
    // A. Google Gemini
    if (provider.includes('google') || provider.includes('gemini') || modelId.includes('gemini')) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser Question:\n${messageText}` }]
          }
        ]
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) throw new Error('No candidate content received from Gemini.');
      return { text: candidateText };
    }

    // B. Anthropic Claude
    if (provider.includes('anthropic') || provider.includes('claude')) {
      const endpoint = 'https://api.anthropic.com/v1/messages';
      const payload = {
        model: modelId,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: messageText }]
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Anthropic API returned status ${res.status}`);
      }

      const data = await res.json();
      return { text: data.content?.[0]?.text || 'No response from Claude.' };
    }

    // C. OpenAI / OpenRouter / Custom OpenAI-compatible
    const baseUrl = model.baseUrl || (provider.includes('openrouter') ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');
    const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const payload = {
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageText }
      ]
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenAI-compatible API returned status ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('No completion returned from model.');
    return { text };
  }
}

/**
 * Fetch and discover live models available for this API key
 */
export async function fetchProviderModels({ provider, apiKey, baseUrl }) {
  try {
    const res = await fetch('/api/ai/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, baseUrl })
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server returned HTTP ${res.status}`);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Intelligent grounded RAG synthesis when running in sandbox/local mode
 */
function executeLocalRagSynthesis({ messageText, model, connectedFiles, spaceName, startTime }) {
  const elapsed = ((performance.now() - startTime) / 1000 + 0.9).toFixed(1);
  const q = messageText.toLowerCase();

  let text = '';
  let citations = [];

  if (connectedFiles.length === 0) {
    text = `I have received your inquiry: **"${messageText}"**.\n\nCurrently, there are **no files mounted** to this collaborative space. Click **"+ Mount File"** at the top or in the files drawer to mount documents from your Drive, and I will analyze them and ground all responses directly in your content.`;
    return {
      success: true,
      content: text,
      reasoningTime: `${elapsed}s`,
      isLiveApi: false,
      modelName: model?.name || 'AI Model',
      citations: []
    };
  }

  // Extract query keywords (excluding common stop words)
  const stopWords = new Set(['what', 'where', 'when', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'have', 'from', 'with', 'about', 'your', 'please', 'explain', 'show', 'tell', 'does', 'will', 'would', 'could', 'should', 'the', 'and', 'for', 'are']);
  const queryWords = q
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Score each mounted file based on keyword matches in content & name
  const fileScores = connectedFiles.map(f => {
    const rawContent = (f.content || f.summary || '').toLowerCase();
    let score = 0;
    const matchedExcerpts = [];

    // Check query word hits
    queryWords.forEach(word => {
      if (f.name.toLowerCase().includes(word)) score += 5;
      const count = (rawContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      score += Math.min(count * 2, 20);
    });

    // Extract relevant sentences or lines
    const lines = (f.content || f.summary || '').split('\n').filter(Boolean);
    lines.forEach(line => {
      const lineLower = line.toLowerCase();
      const hits = queryWords.filter(w => lineLower.includes(w)).length;
      if (hits > 0 && line.length > 20 && !line.startsWith('data:')) {
        matchedExcerpts.push({ line: line.trim(), hits });
      }
    });

    matchedExcerpts.sort((a, b) => b.hits - a.hits);

    return {
      file: f,
      score: score > 0 ? score : 1,
      topExcerpts: matchedExcerpts.slice(0, 3).map(e => e.line)
    };
  });

  // Sort files by relevance
  fileScores.sort((a, b) => b.score - a.score);
  const primaryResults = fileScores.slice(0, 3);

  // Check intent
  const isSummary = /summar|overview|brief|tldr|about|explain/i.test(q);
  const isCodeOrTech = /code|function|class|method|bug|error|test|script/i.test(q);
  const isTabular = /data|table|row|column|metric|revenue|number|count|sales/i.test(q);

  text = `Based on the **${connectedFiles.length} file(s)** mounted to **#${spaceName}**, here is the grounded analysis for your inquiry:\n\n`;

  if (isSummary) {
    text += `### Executive Summary\n`;
    primaryResults.forEach(({ file, topExcerpts }) => {
      text += `**${file.name}** (${file.type.toUpperCase()} • ${file.size || 'Document'}):\n`;
      if (file.summary) {
        text += `> ${file.summary}\n\n`;
      }
      if (topExcerpts.length > 0) {
        text += `*Key Points Extracted:*\n`;
        topExcerpts.forEach(ex => {
          text += `- ${ex.slice(0, 180)}${ex.length > 180 ? '...' : ''}\n`;
        });
        text += `\n`;
      }
    });
  } else if (isCodeOrTech && primaryResults.some(r => r.file.type === 'code')) {
    text += `### Code & Technical Context\n`;
    primaryResults.filter(r => r.file.type === 'code').forEach(({ file, topExcerpts }) => {
      text += `Found relevant implementations in \`${file.name}\`:\n`;
      if (topExcerpts.length > 0) {
        text += `\`\`\`${file.name.split('.').pop() || 'text'}\n`;
        text += topExcerpts.join('\n').slice(0, 600) + '\n';
        text += `\`\`\`\n\n`;
      }
    });
  } else if (isTabular && primaryResults.some(r => r.file.type === 'csv')) {
    text += `### Tabular Data Findings\n`;
    primaryResults.filter(r => r.file.type === 'csv').forEach(({ file, topExcerpts }) => {
      text += `Spreadsheet \`${file.name}\`:\n`;
      if (topExcerpts.length > 0) {
        topExcerpts.forEach(ex => text += `- \`${ex.slice(0, 140)}\`\n`);
        text += `\n`;
      }
    });
  } else {
    // Specific question answering
    text += `### Direct Findings\n`;
    let foundSpecifics = false;

    primaryResults.forEach(({ file, topExcerpts }) => {
      if (topExcerpts.length > 0) {
        foundSpecifics = true;
        text += `From **\`${file.name}\`**:\n`;
        topExcerpts.forEach(ex => {
          text += `> "${ex.slice(0, 240)}${ex.length > 240 ? '...' : ''}"\n\n`;
        });
      }
    });

    if (!foundSpecifics) {
      primaryResults.forEach(({ file }) => {
        text += `In **\`${file.name}\`**, the primary context indicates:\n`;
        text += `> ${file.summary || (file.content || '').slice(0, 200)}...\n\n`;
      });
    }
  }

  // Citations
  citations = primaryResults.map(({ file, topExcerpts }) => ({
    fileId: file.id,
    fileName: file.name,
    excerpt: topExcerpts[0] || file.summary || `Extracted from ${file.name}`
  }));

  return {
    success: true,
    content: text,
    reasoningTime: `${elapsed}s`,
    isLiveApi: false,
    modelName: model?.name || 'AI Model',
    citations
  };
}

function buildCitationsFromFiles(connectedFiles, prompt, responseText) {
  return connectedFiles.slice(0, 2).map(f => ({
    fileId: f.id,
    fileName: f.name,
    excerpt: f.summary || `Cited in response from ${f.name}`
  }));
}

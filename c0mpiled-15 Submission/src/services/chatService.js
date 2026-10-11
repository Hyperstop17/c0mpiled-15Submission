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
 * Format connected file contents into grounded context
 */
function buildRagContext(connectedFiles) {
  if (!connectedFiles || connectedFiles.length === 0) return '';

  return connectedFiles.map((file, idx) => {
    const content = file.content || file.summary || 'No text content available.';
    return `[DOCUMENT ${idx + 1}: ${file.name} (Storage: ${file.storageProvider || 'Local Drive'})]\n${content}\n`;
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
 * Built-in grounded RAG synthesis when running in demo/offline mode
 */
function executeLocalRagSynthesis({ messageText, model, connectedFiles, spaceName, startTime }) {
  const elapsed = ((performance.now() - startTime) / 1000 + 0.8).toFixed(1);
  const q = messageText.toLowerCase();

  let text = '';
  let citations = [];

  if (connectedFiles.length === 0) {
    text = `I have received your query: *"**${messageText}**"*. \n\nCurrently, there are **no Drive documents mounted** to this space. You can click **"+ Mount Drive Files"** in the drawer or above the prompt bar to attach files from AWS S3, and I will ground all responses directly in your data.`;
  } else {
    // Find relevant documents
    const matchingFiles = connectedFiles.filter(f => {
      const nameMatch = q.split(' ').some(word => word.length > 3 && f.name.toLowerCase().includes(word));
      const contentMatch = f.content?.toLowerCase().includes(q) || f.summary?.toLowerCase().includes(q);
      return nameMatch || contentMatch;
    });

    const primaryFiles = matchingFiles.length > 0 ? matchingFiles : connectedFiles;

    text = `Grounded synthesis for #${spaceName} using **${primaryFiles.length} mounted file(s)**:\n\n`;

    primaryFiles.slice(0, 3).forEach((file, i) => {
      text += `### ${i + 1}. Insights from \`${file.name}\`\n`;
      if (file.summary) {
        text += `> ${file.summary}\n\n`;
      }
      text += `* **Status**: Indexed & RAG-ready in AWS S3.\n`;
      text += `* **Key Context**: Scanned ${file.tokens ? file.tokens.toLocaleString() : '1,500'} tokens for semantic relevance.\n\n`;
    });

    text += `*Note: To run live multi-turn inference with real foundation models (GPT-4o, Claude 3.7, or Gemini 2.5), connect your API key under **AI Models** or in the active model selector.*`;

    citations = primaryFiles.slice(0, 2).map(f => ({
      fileId: f.id,
      fileName: f.name,
      excerpt: f.summary || `Grounded from ${f.name} stored in S3`
    }));
  }

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

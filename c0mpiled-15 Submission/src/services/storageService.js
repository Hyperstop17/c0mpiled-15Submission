/**
 * CogniDrive Storage Service
 * Handles live file persistence backed by AWS S3 and local workspace cache.
 */

export const AWS_S3_CONFIG = {
  bucket: 'cognidrive-storage-450690783766',
  region: 'us-east-1',
  endpoint: 'https://cognidrive-storage-450690783766.s3.us-east-1.amazonaws.com',
};

/**
 * Check if the live AWS S3 backend is accessible
 */
export async function checkS3Status() {
  try {
    const res = await fetch('/api/s3/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { connected: false, bucket: AWS_S3_CONFIG.bucket, region: AWS_S3_CONFIG.region, error: err.message };
  }
}

export function getCleanUserId(userOrId) {
  if (!userOrId) return 'damien-k';
  if (typeof userOrId === 'object') {
    return (userOrId.id || userOrId.email || 'damien-k').replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  return String(userOrId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

let cloudSyncTimeout = null;

/**
 * Persist user workspace state (files, folders, spaces, models) both locally and in AWS S3 with debouncing
 */
export async function saveUserStateToCloud(userOrId, state) {
  const userId = getCleanUserId(userOrId);
  const localKey = `cognidrive_user_${userId}_state`;

  // 1. Instant local persistence for zero latency
  try {
    localStorage.setItem(localKey, JSON.stringify({
      ...state,
      savedAt: Date.now()
    }));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }

  // 2. Debounced AWS S3 cloud synchronization (800ms throttle to prevent network contention)
  return new Promise((resolve) => {
    if (cloudSyncTimeout) {
      clearTimeout(cloudSyncTimeout);
    }

    cloudSyncTimeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/s3/user-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            state: {
              ...state,
              savedAt: Date.now()
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          resolve(data);
          return;
        }
      } catch (err) {
        console.warn('S3 cloud state sync error:', err);
      }
      resolve({ success: true, localOnly: true });
    }, 800);
  });
}

/**
 * Load user workspace state from AWS S3 or LocalStorage
 */
export async function loadUserStateFromCloud(userOrId) {
  const userId = getCleanUserId(userOrId);
  const localKey = `cognidrive_user_${userId}_state`;

  let localState = null;
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) localState = JSON.parse(raw);
  } catch (e) {
    // ignore
  }

  // Try fetching latest state from AWS S3
  try {
    const res = await fetch(`/api/s3/user-state?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.state) {
        // Cache to local storage
        try {
          localStorage.setItem(localKey, JSON.stringify(data.state));
        } catch (e) {}
        return data.state;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch user state from S3, falling back to local cache:', err);
  }

  return localState;
}

/**
 * Upload a document directly to AWS S3 storage under the user's dedicated path
 * @param {Object} fileData - { name, content, type, folder, author, dataUrl }
 * @param {string|Object} userOrId - Active user or user identifier
 * @returns {Promise<Object>} Formatted file object with live S3 metadata
 */
export async function uploadFileToStorage(fileData, userOrId = 'damien-k') {
  const cleanId = getCleanUserId(userOrId);
  const authorName = (typeof userOrId === 'object' && userOrId.name) ? userOrId.name : (fileData.author || 'Damien K.');
  const timestamp = Date.now();
  const safeName = (fileData.name || 'document.txt').replace(/\s+/g, '_');
  const fileKey = `users/${cleanId}/documents/${timestamp}_${safeName}`;
  const detectedType = fileData.type || detectFileType(fileData.name);
  const contentType = getMimeType(fileData.name);

  let s3Result = null;
  try {
    const res = await fetch('/api/s3/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: fileKey,
        userId: cleanId,
        name: fileData.name,
        content: fileData.content || '',
        contentType: contentType,
        folder: fileData.folder || 'My Uploads',
        author: authorName
      })
    });
    if (res.ok) {
      s3Result = await res.json();
    }
  } catch (err) {
    console.warn('Real S3 upload network error, continuing with local session:', err);
  }

  // Estimate tokens
  const words = (fileData.content || fileData.summary || '').split(/\s+/).length;
  const estimatedTokens = Math.max(850, Math.round(words * 1.3));

  // Build complete file model
  const newFile = {
    id: `f-${timestamp}`,
    userId: cleanId,
    name: fileData.name,
    type: detectedType,
    size: fileData.size || `${Math.round(Math.max(16, (fileData.content?.length || 500) / 1024))} KB`,
    tokens: estimatedTokens,
    status: 'indexed',
    folder: fileData.folder || 'My Uploads',
    updatedAt: 'Just now',
    author: authorName,
    summary: fileData.summary || generateQuickSummary(fileData.content || fileData.name),
    content: fileData.content || '',
    dataUrl: fileData.dataUrl || undefined,
    htmlContent: fileData.htmlContent || undefined,
    tags: fileData.tags || ['AWS S3', 'Uploaded', fileData.folder ? fileData.folder.split(' ')[0] : 'Doc'],
    connectedSpaces: fileData.connectedSpaces || [],
    storageProvider: s3Result?.success ? 'AWS S3 (Live)' : 'AWS S3',
    s3Bucket: AWS_S3_CONFIG.bucket,
    s3Key: fileKey,
    s3Uri: s3Result?.s3Uri || `s3://${AWS_S3_CONFIG.bucket}/${fileKey}`,
    s3Url: s3Result?.s3Url || `${AWS_S3_CONFIG.endpoint}/${fileKey}`,
    isS3Synced: Boolean(s3Result?.success)
  };

  return newFile;
}

/**
 * Comprehensive file extension detection
 */
export function detectFileType(fileName) {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'csv';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (
    lower.endsWith('.py') || lower.endsWith('.js') || lower.endsWith('.jsx') || 
    lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.json') || 
    lower.endsWith('.html') || lower.endsWith('.css') || lower.endsWith('.yaml') || 
    lower.endsWith('.yml') || lower.endsWith('.sql') || lower.endsWith('.sh') || 
    lower.endsWith('.xml') || lower.endsWith('.env') || lower.endsWith('.c') || 
    lower.endsWith('.cpp') || lower.endsWith('.java') || lower.endsWith('.go') || 
    lower.endsWith('.rs') || lower.endsWith('.php') || lower.endsWith('.toml')
  ) return 'code';
  if (
    lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || 
    lower.endsWith('.svg') || lower.endsWith('.gif') || lower.endsWith('.webp') ||
    lower.endsWith('.bmp')
  ) return 'image';
  if (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.rtf')) return 'doc';
  if (lower.endsWith('.txt') || lower.endsWith('.log')) return 'text';
  return 'markdown';
}

function getMimeType(fileName) {
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.html')) return 'text/html';
  if (lower.endsWith('.css')) return 'text/css';
  if (lower.endsWith('.js')) return 'application/javascript';
  if (lower.endsWith('.py')) return 'text/x-python';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain';
}

function generateQuickSummary(text) {
  if (!text) return 'Document uploaded and indexed in AWS S3 for CogniDrive.';
  const snippet = text.slice(0, 160).trim();
  return snippet.length >= 150 ? `${snippet}...` : snippet;
}

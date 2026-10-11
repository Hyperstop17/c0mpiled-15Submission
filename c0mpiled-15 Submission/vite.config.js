import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Configure AWS profile and region for Damien K.
process.env.AWS_PROFILE = process.env.AWS_PROFILE || 'DamienK-aws'
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1'

const BUCKET_NAME = 'cognidrive-storage-450690783766'
const s3Client = new S3Client({ region: 'us-east-1' })

const verificationStore = new Map();

function s3ApiPlugin() {
  return {
    name: 's3-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next()
        }

        const url = new URL(req.url, 'http://localhost:5173')
        const pathname = url.pathname

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          return res.end()
        }

        try {
          // Status check
          if (pathname === '/api/s3/status' && req.method === 'GET') {
            try {
              const result = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, MaxKeys: 5 }))
              return res.end(JSON.stringify({ 
                connected: true, 
                bucket: BUCKET_NAME, 
                region: 'us-east-1',
                keyCount: result.KeyCount || 0 
              }))
            } catch (err) {
              return res.end(JSON.stringify({ 
                connected: false, 
                bucket: BUCKET_NAME, 
                region: 'us-east-1',
                error: err.message 
              }))
            }
          }

          // Send Email Verification Code
          if (pathname === '/api/auth/send-verification' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}')
                const email = (data.email || '').trim().toLowerCase()
                if (!email) {
                  res.statusCode = 400
                  return res.end(JSON.stringify({ success: false, error: 'Email is required' }))
                }
                const code = Math.floor(100000 + Math.random() * 900000).toString()
                verificationStore.set(email, { code, expires: Date.now() + 15 * 60 * 1000 })
                console.log(`[CogniDrive Auth] Generated 6-digit OTP code for ${email}: ${code}`)
                return res.end(JSON.stringify({
                  success: true,
                  email,
                  code, // Provided for instant 1-click verification in demo/hackathon environment
                  message: `Security verification code sent to ${email}`
                }))
              } catch (err) {
                res.statusCode = 500
                return res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          }

          // Verify Email Code
          if (pathname === '/api/auth/verify-code' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}')
                const email = (data.email || '').trim().toLowerCase()
                const code = (data.code || '').trim()

                const record = verificationStore.get(email)
                // Accept matched code OR developer universal demo fallback '123456'
                const isValid = code === '123456' || (record && record.code === code && record.expires > Date.now())

                if (!isValid) {
                  res.statusCode = 400
                  return res.end(JSON.stringify({ success: false, error: 'Invalid or expired verification code' }))
                }

                verificationStore.delete(email)
                return res.end(JSON.stringify({
                  success: true,
                  verified: true,
                  email,
                  verifiedAt: new Date().toISOString()
                }))
              } catch (err) {
                res.statusCode = 500
                return res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          }

          // User State Persistence (GET user-state from AWS S3)
          if (pathname === '/api/s3/user-state' && req.method === 'GET') {
            const rawUserId = url.searchParams.get('userId') || 'damien-k'
            const cleanUserId = rawUserId.replace(/[^a-zA-Z0-9_-]/g, '_')
            const stateKey = `users/${cleanUserId}/state.json`

            try {
              const result = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: stateKey }))
              const content = await result.Body.transformToString()
              return res.end(JSON.stringify({
                success: true,
                userId: cleanUserId,
                state: JSON.parse(content)
              }))
            } catch (err) {
              return res.end(JSON.stringify({
                success: false,
                notFound: true,
                userId: cleanUserId,
                message: 'No remote state saved yet'
              }))
            }
          }

          // User State Persistence (POST user-state to AWS S3)
          if (pathname === '/api/s3/user-state' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const data = JSON.parse(body || '{}')
                const rawUserId = data.userId || 'damien-k'
                const cleanUserId = rawUserId.replace(/[^a-zA-Z0-9_-]/g, '_')
                const stateKey = `users/${cleanUserId}/state.json`

                await s3Client.send(new PutObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: stateKey,
                  Body: JSON.stringify(data.state || {}, null, 2),
                  ContentType: 'application/json'
                }))

                return res.end(JSON.stringify({
                  success: true,
                  userId: cleanUserId,
                  s3Key: stateKey,
                  savedAt: new Date().toISOString()
                }))
              } catch (err) {
                res.statusCode = 500
                return res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          }

          // List S3 files (with optional per-user prefix)
          if (pathname === '/api/s3/files' && req.method === 'GET') {
            try {
              const rawUserId = url.searchParams.get('userId')
              const prefix = rawUserId 
                ? `users/${rawUserId.replace(/[^a-zA-Z0-9_-]/g, '_')}/documents/` 
                : url.searchParams.get('prefix') || undefined

              const result = await s3Client.send(new ListObjectsV2Command({ 
                Bucket: BUCKET_NAME,
                Prefix: prefix
              }))
              return res.end(JSON.stringify({ 
                success: true, 
                bucket: BUCKET_NAME,
                files: (result.Contents || []).map(item => ({
                  key: item.Key,
                  size: item.Size,
                  lastModified: item.LastModified,
                  etag: item.ETag
                }))
              }))
            } catch (err) {
              return res.end(JSON.stringify({ success: false, error: err.message, files: [] }))
            }
          }

          // Upload file to S3
          if (pathname === '/api/s3/upload' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const data = JSON.parse(body)
                const timestamp = Date.now()
                const safeName = (data.name || 'document.txt').replace(/\s+/g, '_')
                const cleanUserId = (data.userId || 'damien-k').replace(/[^a-zA-Z0-9_-]/g, '_')
                const key = data.key || `users/${cleanUserId}/documents/${timestamp}_${safeName}`
                const content = data.content || ''
                const contentType = data.contentType || 'text/plain'

                const putCmd = new PutObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: key,
                  Body: content,
                  ContentType: contentType
                })

                const result = await s3Client.send(putCmd)
                return res.end(JSON.stringify({
                  success: true,
                  key,
                  userId: cleanUserId,
                  s3Bucket: BUCKET_NAME,
                  s3Uri: `s3://${BUCKET_NAME}/${key}`,
                  s3Url: `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${key}`,
                  etag: result.ETag
                }))
              } catch (err) {
                res.statusCode = 500
                return res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          }

          // Get file content from S3
          if (pathname === '/api/s3/file' && req.method === 'GET') {
            const key = url.searchParams.get('key')
            if (!key) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Missing key parameter' }))
            }
            try {
              const result = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
              const content = await result.Body.transformToString()
              return res.end(JSON.stringify({
                success: true,
                key,
                content,
                contentType: result.ContentType
              }))
            } catch (err) {
              res.statusCode = 404
              return res.end(JSON.stringify({ success: false, error: err.message }))
            }
          }

          // Delete file from S3
          if (pathname === '/api/s3/file' && req.method === 'DELETE') {
            const key = url.searchParams.get('key')
            if (!key) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Missing key parameter' }))
            }
            try {
              await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
              return res.end(JSON.stringify({ success: true, key }))
            } catch (err) {
              res.statusCode = 500
              return res.end(JSON.stringify({ success: false, error: err.message }))
            }
          }

          // AI Proxy: Fetch & Auto-Detect Models via API
          if (pathname === '/api/ai/models' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const data = JSON.parse(body || '{}')
                const provider = (data.provider || '').toLowerCase()
                const apiKey = (data.apiKey || '').trim()
                const baseUrl = data.baseUrl

                if (!apiKey) {
                  res.statusCode = 400
                  return res.end(JSON.stringify({ success: false, error: 'API key is required' }))
                }

                // 1. Google Gemini
                if (provider.includes('gemini') || provider.includes('google') || apiKey.startsWith('AIza')) {
                  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
                  const resp = await fetch(url)
                  if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}))
                    throw new Error(err.error?.message || `Gemini returned HTTP ${resp.status}`)
                  }
                  const resJson = await resp.json()
                  const models = (resJson.models || [])
                    .map(m => m.name.replace(/^models\//, ''))
                    .filter(m => m.includes('gemini'))
                  return res.end(JSON.stringify({
                    success: true,
                    provider: 'Google Gemini',
                    models: models.length > 0 ? models : ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
                    recommendedModel: models.find(m => m.includes('2.0-flash')) || 'gemini-2.0-flash'
                  }))
                }

                // 2. Groq
                if (provider.includes('groq') || apiKey.startsWith('gsk_')) {
                  const resp = await fetch('https://api.groq.com/openai/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                  })
                  if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}))
                    throw new Error(err.error?.message || `Groq returned HTTP ${resp.status}`)
                  }
                  const resJson = await resp.json()
                  const models = (resJson.data || []).map(m => m.id).filter(id => !id.includes('whisper'))
                  return res.end(JSON.stringify({
                    success: true,
                    provider: 'Groq',
                    models,
                    recommendedModel: models.find(m => m.includes('llama-3.3-70b')) || models[0] || 'llama-3.3-70b-versatile'
                  }))
                }

                // 3. Anthropic
                if (provider.includes('anthropic') || provider.includes('claude') || apiKey.startsWith('sk-ant-')) {
                  const resp = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-api-key': apiKey,
                      'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                      model: 'claude-3-5-haiku-20241022',
                      max_tokens: 1,
                      messages: [{ role: 'user', content: 'hi' }]
                    })
                  })
                  if (!resp.ok && resp.status === 401) {
                    const err = await resp.json().catch(() => ({}))
                    throw new Error(err.error?.message || 'Invalid Anthropic API Key')
                  }
                  return res.end(JSON.stringify({
                    success: true,
                    provider: 'Anthropic',
                    models: [
                      'claude-3-7-sonnet-20250219',
                      'claude-3-5-sonnet-20241022',
                      'claude-3-5-haiku-20241022',
                      'claude-3-opus-20240229'
                    ],
                    recommendedModel: 'claude-3-7-sonnet-20250219'
                  }))
                }

                // 4. OpenAI / OpenRouter / Custom
                const apiBase = baseUrl ? baseUrl.replace(/\/$/, '') : (provider.includes('openrouter') ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1')
                const resp = await fetch(`${apiBase}/models`, {
                  headers: { 'Authorization': `Bearer ${apiKey}` }
                })
                if (!resp.ok) {
                  const err = await resp.json().catch(() => ({}))
                  throw new Error(err.error?.message || `Provider returned HTTP ${resp.status}`)
                }
                const resJson = await resp.json()
                const allData = resJson.data || []
                let models = allData.map(m => m.id)
                if (!baseUrl && !provider.includes('openrouter')) {
                  models = models.filter(id => id.includes('gpt-') || id.startsWith('o1') || id.startsWith('o3'))
                }
                return res.end(JSON.stringify({
                  success: true,
                  provider: provider.includes('openrouter') ? 'OpenRouter' : 'OpenAI',
                  models: models.length > 0 ? models.slice(0, 30) : ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-4-turbo'],
                  recommendedModel: models.find(m => m === 'gpt-4o') || models.find(m => m === 'gpt-4o-mini') || 'gpt-4o'
                }))
              } catch (err) {
                res.statusCode = 400
                return res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          }

          // AI Proxy: Unified Chat Inference
          if (pathname === '/api/ai/chat' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const data = JSON.parse(body || '{}')
                const provider = (data.provider || '').toLowerCase()
                const apiKey = (data.apiKey || '').trim()
                const modelId = data.modelId || 'gpt-4o-mini'
                const systemPrompt = data.systemPrompt || ''
                const messageText = data.messageText || ''
                const baseUrl = data.baseUrl

                if (!apiKey) {
                  res.statusCode = 400
                  return res.end(JSON.stringify({ success: false, error: 'API key is required' }))
                }

                // A. Google Gemini
                if (provider.includes('gemini') || provider.includes('google') || modelId.includes('gemini')) {
                  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`
                  const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{
                        role: 'user',
                        parts: [{ text: `${systemPrompt}\n\nUser Question:\n${messageText}` }]
                      }]
                    })
                  })
                  if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}))
                    throw new Error(err.error?.message || `Gemini returned HTTP ${resp.status}`)
                  }
                  const resJson = await resp.json()
                  const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.'
                  return res.end(JSON.stringify({ success: true, text }))
                }

                // B. Anthropic Claude
                if (provider.includes('anthropic') || provider.includes('claude')) {
                  const resp = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-api-key': apiKey,
                      'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                      model: modelId,
                      max_tokens: 2000,
                      system: systemPrompt,
                      messages: [{ role: 'user', content: messageText }]
                    })
                  })
                  if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}))
                    throw new Error(err.error?.message || `Anthropic returned HTTP ${resp.status}`)
                  }
                  const resJson = await resp.json()
                  const text = resJson.content?.[0]?.text || 'No response generated.'
                  return res.end(JSON.stringify({ success: true, text }))
                }

                // C. OpenAI / Groq / OpenRouter / Custom OpenAI-compatible
                let apiEndpoint = ''
                if (provider.includes('groq')) {
                  apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions'
                } else if (provider.includes('openrouter')) {
                  apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions'
                } else if (baseUrl) {
                  apiEndpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`
                } else {
                  apiEndpoint = 'https://api.openai.com/v1/chat/completions'
                }

                const resp = await fetch(apiEndpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify({
                    model: modelId,
                    messages: [
                      { role: 'system', content: systemPrompt },
                      { role: 'user', content: messageText }
                    ]
                  })
                })
                if (!resp.ok) {
                  const err = await resp.json().catch(() => ({}))
                  throw new Error(err.error?.message || `Model API returned HTTP ${resp.status}`)
                }
                const resJson = await resp.json()
                const text = resJson.choices?.[0]?.message?.content || 'No completion returned.'
                return res.end(JSON.stringify({ success: true, text }))
              } catch (err) {
                res.statusCode = 500
                return res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          }

          next()
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), s3ApiPlugin()],
})

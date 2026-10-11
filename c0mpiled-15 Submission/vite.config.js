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

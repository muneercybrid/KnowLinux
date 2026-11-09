import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getDb } from './prisma/db.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = new Hono()

// API routes
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/users', async (c) => {
  const users = await getDb().orm.public.User.include('posts').orderBy((user) => user.createdAt.desc()).all()
  return c.json(users)
})

// Calculate absolute path to the public directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, 'public')

// Serve static files
app.use('/*', serveStatic({ root: publicDir }))

// Fallback to index.html for SPA routing
app.get('*', serveStatic({ path: path.join(publicDir, 'index.html') }))

const port = Number(process.env.PORT ?? 8080)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

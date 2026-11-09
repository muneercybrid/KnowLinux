import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getDb } from './prisma/db.js'

const app = new Hono()

// API routes
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/users', async (c) => {
  const users = await getDb().orm.public.User.include('posts').orderBy((user) => user.createdAt.desc()).all()
  return c.json(users)
})

// Serve static files from the bundled public directory
app.use('/*', serveStatic({ root: './dist/public' }))

// Fallback to index.html for SPA routing
app.get('*', serveStatic({ path: './dist/public/index.html' }))

const port = Number(process.env.PORT ?? 8080)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

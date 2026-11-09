import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getDb } from './prisma/db.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = new Hono()

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.get('/api/categories', async (c) => {
  const categories = await getDb().orm.public.Category.all()
  return c.json(categories)
})

app.get('/api/software', async (c) => {
  const software = await getDb().orm.public.Software.all()
  return c.json(software)
})

app.get('/api/distributions', async (c) => {
  const distros = await getDb().orm.public.Distribution.all()
  return c.json(distros)
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, 'public')
app.use('/*', serveStatic({ root: publicDir }))
app.get('*', serveStatic({ path: path.join(publicDir, 'index.html') }))

const port = Number(process.env.PORT ?? 8080)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})

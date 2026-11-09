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

app.get('/api/software/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const db = getDb()
    
    // Get the software
    const software = await db.orm.public.Software.where({ slug }).first()
    if (!software) {
      return c.json({ error: 'Software not found' }, 404)
    }

    // Get the install commands for each distribution
    const installs = await db.orm.public.SoftwareDistribution.where({ softwareId: software.id }).include('distribution').all()
    
    // Format the response for the frontend
    const distributions = installs.map((item: any) => ({
      name: item.distribution.name,
      slug: item.distribution.slug,
      command: item.installCommand
    }))

    return c.json({ ...software, distributions })
  } catch (error) {
    console.error('Error fetching software details:', error)
    return c.json({ error: 'Failed to fetch software details' }, 500)
  }
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

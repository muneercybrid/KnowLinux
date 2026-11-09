import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import bcrypt from 'bcryptjs'
import { Temporal } from 'temporal-polyfill'
import { getDb } from './prisma/db.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = new Hono()

// Helper to get the current user
async function getCurrentUser(c: any) {
  const sessionId = getCookie(c, 'knowlinux_session')
  if (!sessionId) return null
  try {
    const session = await getDb().orm.public.Session.where({ id: sessionId }).include('user').first()
    if (!session) return null
    const now = Temporal.Now.instant()
    if (Temporal.Instant.compare(now, session.expiresAt) > 0) return null
    return session.user
  } catch (e) {
    return null
  }
}

// --- Public API ---
app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.get('/api/search', async (c) => {
  const query = c.req.query('q')
  if (!query || query.trim().length < 2) return c.json({ software: [], commands: [], categories: [] })

  try {
    const db = getDb()
    const q = query.toLowerCase()

    // Temporary JS-based search (to be replaced by PostgreSQL Full-Text Search later)
    const allSoftware = await db.orm.public.Software.all()
    const software = allSoftware.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.description && s.description.toLowerCase().includes(q)) || 
      (s.category && s.category.toLowerCase().includes(q))
    ).slice(0, 10)

    const allCommands = await db.orm.public.Command.all()
    const commands = allCommands.filter(cmd => 
      cmd.name.toLowerCase().includes(q) || 
      (cmd.description && cmd.description.toLowerCase().includes(q)) || 
      (cmd.category && cmd.category.toLowerCase().includes(q))
    ).slice(0, 10)

    const allCategories = await db.orm.public.Category.all()
    const categories = allCategories.filter(cat => 
      cat.name.toLowerCase().includes(q) || 
      (cat.description && cat.description.toLowerCase().includes(q))
    ).slice(0, 5)

    return c.json({ software, commands, categories })
  } catch (error) {
    console.error('Search error:', error)
    return c.json({ error: 'Search failed' }, 500)
  }
})

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
    const software = await db.orm.public.Software.where({ slug }).first()
    if (!software) return c.json({ error: 'Software not found' }, 404)
    const installs = await db.orm.public.SoftwareDistribution.where({ softwareId: software.id }).include('distribution').all()
    const distributions = installs.map((item: any) => ({
      name: item.distribution.name,
      slug: item.distribution.slug,
      command: item.installCommand
    }))
    return c.json({ ...software, distributions })
  } catch (error) {
    return c.json({ error: 'Failed to fetch software details' }, 500)
  }
})

app.get('/api/commands', async (c) => {
  const commands = await getDb().orm.public.Command.all()
  return c.json(commands)
})

app.get('/api/commands/:slug', async (c) => {
  const slug = c.req.param('slug')
  const command = await getDb().orm.public.Command.where({ slug }).first()
  if (!command) return c.json({ error: 'Command not found' }, 404)
  return c.json(command)
})

// --- Authentication ---
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    if (!email || !password) return c.json({ error: 'Email and password required' }, 400)
    const db = getDb()
    const existing = await db.orm.public.User.where({ email }).first()
    if (existing) return c.json({ error: 'Email already in use' }, 400)
    
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.orm.public.User.create({ email, name, passwordHash })
    
    const sessionId = crypto.randomUUID()
    const expiresAt = Temporal.Now.instant().add({ hours: 24 * 7 })
    await db.orm.public.Session.create({ id: sessionId, userId: user.id, expiresAt })
    
    setCookie(c, 'knowlinux_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })
    return c.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err: any) {
    return c.json({ error: err.message || 'Registration failed' }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    if (!email || !password) return c.json({ error: 'Email and password required' }, 400)
    const db = getDb()
    const user = await db.orm.public.User.where({ email }).first()
    if (!user || !user.passwordHash) return c.json({ error: 'Invalid credentials' }, 401)
    
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return c.json({ error: 'Invalid credentials' }, 401)
    
    const sessionId = crypto.randomUUID()
    const expiresAt = Temporal.Now.instant().add({ hours: 24 * 7 })
    await db.orm.public.Session.create({ id: sessionId, userId: user.id, expiresAt })
    
    setCookie(c, 'knowlinux_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })
    return c.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err: any) {
    return c.json({ error: err.message || 'Login failed' }, 500)
  }
})

app.post('/api/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'knowlinux_session')
  if (sessionId) {
    try { await getDb().orm.public.Session.where({ id: sessionId }).delete() } catch (e) {}
    deleteCookie(c, 'knowlinux_session')
  }
  return c.json({ success: true })
})

app.get('/api/auth/me', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ user: null })
  return c.json({ user: { id: user.id, email: user.email, name: user.name } })
})

// --- Workspace API ---
app.get('/api/workspace/commands', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const saved = await getDb().orm.public.SavedCommand.where({ userId: user.id }).all()
  return c.json(saved)
})

app.post('/api/workspace/commands', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const { command, description } = await c.req.json()
  if (!command || !description) return c.json({ error: 'Command and description required' }, 400)
  const saved = await getDb().orm.public.SavedCommand.create({ userId: user.id, command, description })
  return c.json(saved)
})

app.delete('/api/workspace/commands/:id', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const id = parseInt(c.req.param('id'))
  await getDb().orm.public.SavedCommand.where({ id, userId: user.id }).delete()
  return c.json({ success: true })
})

// --- Static Files ---
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, 'public')
app.use('/*', serveStatic({ root: publicDir }))
app.get('*', serveStatic({ path: path.join(publicDir, 'index.html') }))

const port = Number(process.env.PORT ?? 8080)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})

// --- Fix API ---
app.get('/api/fix', async (c) => {
  const query = c.req.query('q')
  if (!query || query.trim().length < 3) return c.json([])
  
  try {
    const db = getDb()
    const q = query.toLowerCase()
    const allCases = await db.orm.public.TroubleshootingCase.all()
    
    const matches = allCases.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.errorSignature.toLowerCase().includes(q)
    )
    
    return c.json(matches)
  } catch (error) {
    return c.json({ error: 'Fix search failed' }, 500)
  }
})

app.get('/api/fix/:slug', async (c) => {
  const slug = c.req.param('slug')
  const fix = await getDb().orm.public.TroubleshootingCase.where({ slug }).first()
  if (!fix) return c.json({ error: 'Fix not found' }, 404)
  return c.json(fix)
})

// --- Categories API ---
app.get('/api/categories/az', async (c) => {
  try {
    const db = getDb()
    const categories = await db.orm.public.Category.all()
    
    // Group by letter
    const grouped = categories.reduce((acc: any, cat: any) => {
      const letter = cat.letter.toUpperCase()
      if (!acc[letter]) acc[letter] = []
      acc[letter].push(cat)
      return acc
    }, {})
    
    return c.json(grouped)
  } catch (error) {
    return c.json({ error: 'Failed to fetch categories' }, 500)
  }
})

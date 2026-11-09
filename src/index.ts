import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import bcrypt from 'bcryptjs'
import { getDb } from './prisma/db.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = new Hono()

// --- Public API ---
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
    console.error('Register Error:', err)
    // Temporarily expose the error for debugging
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
    console.error('Login Error:', err)
    return c.json({ error: err.message || 'Login failed' }, 500)
  }
})

app.post('/api/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'knowlinux_session')
  if (sessionId) {
    try {
      await getDb().orm.public.Session.where({ id: sessionId }).delete()
    } catch (e) {}
    deleteCookie(c, 'knowlinux_session')
  }
  return c.json({ success: true })
})

app.get('/api/auth/me', async (c) => {
  const sessionId = getCookie(c, 'knowlinux_session')
  if (!sessionId) return c.json({ user: null })

  try {
    const session = await getDb().orm.public.Session.where({ id: sessionId }).include('user').first()
    if (!session || new Date(session.expiresAt) < new Date()) {
      deleteCookie(c, 'knowlinux_session')
      return c.json({ user: null })
    }
    return c.json({ user: { id: session.user.id, email: session.user.email, name: session.user.name } })
  } catch (err) {
    return c.json({ user: null })
  }
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

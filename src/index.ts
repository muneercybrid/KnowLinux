import { generateAIResponse } from "./services/ai.js"
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import bcrypt from 'bcryptjs'
import { Temporal } from 'temporal-polyfill'
import { getDb } from './prisma/db.js'
import { fetchAllPackages } from './services/connectors.js'
import { liveSearchRepology, debugRepology } from './services/live-search.js'
import path from 'path'
import { fileURLToPath } from 'url'
import companionApp from './routes/companion.js'
import googleApp from './routes/google-auth.js'

const app = new Hono()

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

// --- Categories ---
app.get('/api/categories/az', async (c) => {
  try {
    const db = getDb()
    const categories = await db.orm.public.Category.all()
    const grouped = categories.reduce((acc: any, cat: any) => {
      const letter = cat.letter ? cat.letter.toUpperCase() : 'OTHER'
      if (!acc[letter]) acc[letter] = []
      acc[letter].push(cat)
      return acc
    }, {})
    return c.json(grouped)
  } catch (error) {
    return c.json({ error: 'Failed to fetch categories' }, 500)
  }
})

app.get('/api/categories', async (c) => {
  const categories = await getDb().orm.public.Category.all()
  return c.json(categories)
})

app.get('/api/categories/:slug', async (c) => {
  const slug = c.req.param('slug')
  try {
    const db = getDb()
    const category = await db.orm.public.Category.where({ slug }).include('children').include('tools').first()
    if (!category) return c.json({ error: 'Category not found' }, 404)
    return c.json(category)
  } catch (error) {
    return c.json({ error: 'Failed to fetch category' }, 500)
  }
})

// --- Tools ---
app.get('/api/tools', async (c) => {
  const tools = await getDb().orm.public.Tool.all()
  return c.json(tools)
})

app.get('/api/tools/:slug', async (c) => {
  const slug = c.req.param('slug')
  try {
    const tool = await getDb().orm.public.Tool.where({ slug }).include('packages').first()
    if (!tool) return c.json({ error: 'Tool not found' }, 404)
    return c.json(tool)
  } catch (error) {
    return c.json({ error: 'Failed to fetch tool' }, 500)
  }
})

// --- Admin Ingestion ---
app.post('/api/admin/ingest/:toolSlug', async (c) => {
  const toolSlug = c.req.param('toolSlug')
  try {
    const db = getDb()
    const tool = await db.orm.public.Tool.where({ slug: toolSlug }).first()
    if (!tool) return c.json({ error: 'Tool not found' }, 404)

    console.log('Starting ingestion for ' + tool.name + '...')
    const packages = await fetchAllPackages(tool.name)
    
    let savedCount = 0
    for (const pkg of packages) {
      await db.orm.public.Package.upsert({
        conflictOn: { toolId: tool.id, distro: pkg.distro, packageName: pkg.packageName },
        update: { version: pkg.version, repo: pkg.repo, source: pkg.source },
        create: { toolId: tool.id, distro: pkg.distro, repo: pkg.repo, packageName: pkg.packageName, version: pkg.version, source: pkg.source }
      })
      savedCount++
    }

    return c.json({ success: true, message: 'Ingested ' + savedCount + ' packages for ' + tool.name })
  } catch (error) {
    console.error('Ingestion error:', error)
    return c.json({ error: 'Ingestion failed' }, 500)
  }
})

app.post('/api/admin/ingest-all', async (c) => {
  try {
    const db = getDb()
    const tools = await db.orm.public.Tool.all()
    let totalPackages = 0
    
    for (const tool of tools) {
      console.log('Ingesting ' + tool.name + '...')
      const packages = await fetchAllPackages(tool.name)
      for (const pkg of packages) {
        await db.orm.public.Package.upsert({
          conflictOn: { toolId: tool.id, distro: pkg.distro, packageName: pkg.packageName },
          update: { version: pkg.version, repo: pkg.repo, source: pkg.source },
          create: { toolId: tool.id, distro: pkg.distro, repo: pkg.repo, packageName: pkg.packageName, version: pkg.version, source: pkg.source }
        })
        totalPackages++
      }
      await new Promise(r => setTimeout(r, 1000))
    }
    return c.json({ success: true, message: 'Ingested ' + totalPackages + ' packages across ' + tools.length + ' tools.' })
  } catch (error) {
    console.error('Bulk Ingestion error:', error)
    return c.json({ error: 'Bulk ingestion failed' }, 500)
  }
})

// --- Search ---
app.get('/api/search', async (c) => {
  const query = c.req.query('q')
  if (!query || query.trim().length < 2) return c.json({ software: [], commands: [], categories: [] })
  try {
    const db = getDb()
    const q = query.toLowerCase()
    const allSoftware = await db.orm.public.Software.all()
    const software = allSoftware.filter(s => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))).slice(0, 10)
    const allCommands = await db.orm.public.Command.all()
    const commands = allCommands.filter(cmd => cmd.name.toLowerCase().includes(q) || (cmd.description && cmd.description.toLowerCase().includes(q))).slice(0, 10)
    const allCategories = await db.orm.public.Category.all()
    const categories = allCategories.filter(cat => cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q))).slice(0, 5)
    return c.json({ software, commands, categories })
  } catch (error) {
    return c.json({ error: 'Search failed' }, 500)
  }
})

// --- Software ---
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

// --- Commands ---
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

// --- Fix ---
app.get('/api/fix', async (c) => {
  const query = c.req.query('q')
  if (!query || query.trim().length < 3) return c.json([])
  try {
    const db = getDb()
    const q = query.toLowerCase()
    const allCases = await db.orm.public.TroubleshootingCase.all()
    const matches = allCases.filter(fix => fix.title.toLowerCase().includes(q) || fix.errorSignature.toLowerCase().includes(q))
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

// --- Auth ---
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
    setCookie(c, 'knowlinux_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60, path: '/' })
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
    setCookie(c, 'knowlinux_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60, path: '/' })
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

// --- Workspace ---
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

// --- Live Search ---
app.get('/api/live-search', async (c) => {
  const q = c.req.query('q')
  if (!q) return c.json([])
  const results = await liveSearchRepology(q)
  return c.json(results)
})

// --- Bulk Ingest ---
app.post('/api/admin/ingest-all', async (c) => {
  try {
    const db = getDb()
    const tools = await db.orm.public.Tool.all()
    let totalPackages = 0
    for (const tool of tools) {
      console.log('Ingesting ' + tool.name + '...')
      const packages = await fetchAllPackages(tool.name)
      for (const pkg of packages) {
        await db.orm.public.Package.upsert({
          conflictOn: { toolId: tool.id, distro: pkg.distro, packageName: pkg.packageName },
          update: { version: pkg.version, repo: pkg.repo, source: pkg.source },
          create: { toolId: tool.id, distro: pkg.distro, repo: pkg.repo, packageName: pkg.packageName, version: pkg.version, source: pkg.source }
        })
        totalPackages++
      }
      await new Promise(r => setTimeout(r, 1000))
    }
    return c.json({ success: true, message: 'Ingested ' + totalPackages + ' packages across ' + tools.length + ' tools.' })
  } catch (error) {
    console.error('Bulk Ingestion error:', error)
    return c.json({ error: 'Bulk ingestion failed' }, 500)
  }
})

// --- Debug Endpoint ---
app.get('/api/debug/repology', async (c) => {
  const q = c.req.query('q')
  if (!q) return c.json({ error: 'Provide ?q=name' })
  const result = await debugRepology(q)
  return c.json(result)
})

// --- Live Search API ---
app.get('/api/live-search', async (c) => {
  const q = c.req.query('q')
  if (!q) return c.json([])
  const results = await liveSearchRepology(q)
  return c.json(results)
})

// --- AI Enrichment API ---
app.post('/api/admin/enrich-tool/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const db = getDb()
    const tool = await db.orm.public.Tool.where({ slug }).first()
    if (!tool) return c.json({ error: 'Tool not found' }, 404)

    const prompt = `Write a comprehensive overview for the Linux tool "${tool.name}". 
    Include what it does, its primary use cases, and 3 bullet points of Pros, and 3 bullet points of Requirements. 
    Keep it under 200 words. Format nicely with basic text.`

    const aiDescription = await generateAIResponse(prompt)
    
    await db.orm.public.Tool.where({ slug }).update({ aiDescription })

    return c.json({ success: true, aiDescription })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// --- AI Fix Assistant ---
app.post('/api/fix/ai', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'You must be logged in to use the AI assistant.' }, 401)

  try {
    const { errorMessage } = await c.req.json()
    if (!errorMessage) return c.json({ error: 'Error message is required' }, 400)

    const systemContext = `You are KnowLinux Fix, an expert Linux engineer. 
    Provide a concise solution. Separate read-only diagnostics from system modifications. 
    Respond ONLY with valid JSON matching this structure exactly. Do not use markdown backticks.
    {
      "diagnostics": ["read_only_cmd_1", "read_only_cmd_2"],
      "fixes": ["fix_cmd_1", "fix_cmd_2"],
      "explanation": "Brief explanation of the cause and fix."
    }`

    const prompt = `Error: "${errorMessage}"`
    
    const aiResponse = await generateAIResponse(prompt, systemContext)
    
    // Try to parse the JSON response from the AI
    let parsedResponse
    try {
      // Extract JSON if the AI wrapped it in markdown
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      parsedResponse = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse)
    } catch (e) {
      // Fallback if AI didn't return perfect JSON
      parsedResponse = {
        diagnostics: [],
        fixes: [],
        explanation: aiResponse
      }
    }

    return c.json(parsedResponse)
  } catch (error: any) {
    return c.json({ error: error.message || 'AI analysis failed' }, 500)
  }
})

app.route('/api/companion', companionApp)

app.route('/api/auth', googleApp)

app.get('/api/debug/env', (c) => c.json({
  hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  nodeEnv: process.env.NODE_ENV,
  googleIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || null
}))

// --- Static Files (MUST BE LAST) ---
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, 'public')
app.use('/*', serveStatic({ root: publicDir }))
app.get('*', serveStatic({ path: path.join(publicDir, 'index.html') }))

const port = Number(process.env.PORT ?? 8080)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})

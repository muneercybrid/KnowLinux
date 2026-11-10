import { Hono } from 'hono'
import { getDb } from '../prisma/db.js'
import { getCurrentUser } from '../lib/auth-helpers.js'
import { Temporal } from 'temporal-polyfill'
import crypto from 'crypto'

const companionApp = new Hono()

companionApp.post('/device-code', async (c) => {
  const db = getDb()
  const code = crypto.randomBytes(3).toString('hex').toUpperCase()
  const deviceCode = crypto.randomUUID()
  const expiresAt = Temporal.Now.instant().add({ minutes: 10 })
  await db.orm.public.DeviceAuthCode.create({ code, deviceCode, expiresAt })
  return c.json({ code, deviceCode, expiresIn: 600, verificationUri: 'https://knowlinux.tech/activate' })
})

companionApp.get('/token', async (c) => {
  const deviceCode = c.req.query('deviceCode')
  if (!deviceCode) return c.json({ error: 'Missing deviceCode' }, 400)
  const db = getDb()
  const authReq = await db.orm.public.DeviceAuthCode.where({ deviceCode }).first()
  if (!authReq) return c.json({ error: 'expired_token' }, 400)
  if (authReq.status === 'pending') return c.json({ error: 'authorization_pending' }, 400)
  const token = crypto.randomUUID()
  const device = await db.orm.public.CompanionDevice.create({
    userId: authReq.userId!,
    token,
    name: 'Linux Machine'
  })
  await db.orm.public.DeviceAuthCode.where({ deviceCode }).delete()
  return c.json({ token, device })
})

companionApp.post('/authorize', async (c) => {
  const { code } = await c.req.json()
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const db = getDb()
  const authReq = await db.orm.public.DeviceAuthCode.where({ code }).first()
  if (!authReq) return c.json({ error: 'Invalid code' }, 400)
  const now = Temporal.Now.instant()
  if (Temporal.Instant.compare(now, authReq.expiresAt) > 0) return c.json({ error: 'Code expired' }, 400)
  await db.orm.public.DeviceAuthCode.where({ code }).update({ status: 'authorized', userId: user.id })
  return c.json({ success: true })
})

export default companionApp

companionApp.post('/sync', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing token' }, 401)
  }
  const token = authHeader.replace('Bearer ', '')

  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ token }).first()
  if (!device) return c.json({ error: 'Invalid token' }, 401)

  const body = await c.req.json()
  const { distro, kernel, hostname, arch, packages } = body

  // Update device with system info
  await db.orm.public.CompanionDevice.where({ id: device.id }).update({
    osInfo: JSON.stringify({ distro, kernel, hostname, arch }),
    lastSeenAt: Temporal.Now.instant()
  })

  // Clear old packages and insert new
  if (Array.isArray(packages) && packages.length > 0) {
    // Delete existing packages for this device
    const existing = await db.orm.public.CompanionPackage.where({ deviceId: device.id }).all()
    for (const pkg of existing) {
      await db.orm.public.CompanionPackage.where({ id: pkg.id }).delete()
    }

    // Insert new packages in batches (Prisma 8 doesn't support createMany)
    const batchSize = 100
    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize)
      await Promise.all(
        batch.map((pkg: any) =>
          db.orm.public.CompanionPackage.create({
            deviceId: device.id,
            name: pkg.name,
            version: pkg.version || null,
            description: pkg.description || null
          })
        )
      )
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} (${Math.min(i + batchSize, packages.length)}/${packages.length})`)
    }
  }

  return c.json({
    success: true,
    deviceId: device.id,
    packagesCount: packages?.length || 0
  })
})

companionApp.get('/devices', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const db = getDb()
  const devices = await db.orm.public.CompanionDevice.where({ userId: user.id }).all()

  return c.json(devices.map((d: any) => ({
    id: d.id,
    name: d.name,
    osInfo: d.osInfo,
    lastSeenAt: d.lastSeenAt,
    createdAt: d.createdAt
  })))
})

companionApp.delete('/devices/:id', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()
  
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)

  await db.orm.public.CompanionDevice.where({ id: deviceId }).delete()
  return c.json({ success: true })
})

companionApp.get('/devices/:id/packages', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()

  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)

  const packages = await db.orm.public.CompanionPackage.where({ deviceId }).all()
  return c.json(packages)
})

// User queues a command from web UI
companionApp.post('/devices/:id/commands', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const deviceId = parseInt(c.req.param('id'))
  const { command } = await c.req.json()
  if (!command) return c.json({ error: 'Command is required' }, 400)

  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)

  const cmd = await db.orm.public.CompanionCommand.create({
    deviceId,
    command
  })
  return c.json(cmd)
})

// User views command history
companionApp.get('/devices/:id/commands', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)

  const commands = await db.orm.public.CompanionCommand.where({ deviceId }).all()
  return c.json(commands)
})

// Agent polls for pending commands (uses device token)
companionApp.get('/pending-commands', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ error: 'Missing token' }, 401)
  const token = authHeader.replace('Bearer ', '')

  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ token }).first()
  if (!device) return c.json({ error: 'Invalid token' }, 401)

  const pending = await db.orm.public.CompanionCommand.where({ deviceId: device.id, status: 'pending' }).all()
  return c.json(pending)
})

// Agent reports execution result
companionApp.post('/commands/:id/result', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ error: 'Missing token' }, 401)
  const token = authHeader.replace('Bearer ', '')

  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ token }).first()
  if (!device) return c.json({ error: 'Invalid token' }, 401)

  const cmdId = parseInt(c.req.param('id'))
  const { output, exitCode } = await c.req.json()

  await db.orm.public.CompanionCommand.where({ id: cmdId, deviceId: device.id }).update({
    status: 'completed',
    output,
    exitCode,
    executedAt: Temporal.Now.instant()
  })
  return c.json({ success: true })
})

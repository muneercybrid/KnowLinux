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

companionApp.post('/sync', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ error: 'Missing token' }, 401)
  const token = authHeader.replace('Bearer ', '')
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ token }).first()
  if (!device) return c.json({ error: 'Invalid token' }, 401)
  const body = await c.req.json()
  const { distro, kernel, hostname, arch, packages } = body
  await db.orm.public.CompanionDevice.where({ id: device.id }).update({
    osInfo: JSON.stringify({ distro, kernel, hostname, arch }),
    lastSeenAt: Temporal.Now.instant()
  })
  if (Array.isArray(packages) && packages.length > 0) {
    const existing = await db.orm.public.CompanionPackage.where({ deviceId: device.id }).all()
    for (const pkg of existing) {
      await db.orm.public.CompanionPackage.where({ id: pkg.id }).delete()
    }
    const batchSize = 100
    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize)
      await Promise.all(
        batch.map((pkg: any) =>
          db.orm.public.CompanionPackage.create({
            deviceId: device.id,
            name: pkg.name,
            version: pkg.version || null,
            description: pkg.description || null,
            type: pkg.type || 'package',
            executablePath: pkg.executablePath || null,
            latestVersion: pkg.latestVersion || null,
            isOutdated: pkg.isOutdated === true
          })
        )
      )
    }
  }
  return c.json({ success: true, deviceId: device.id, packagesCount: packages?.length || 0 })
})

companionApp.get('/devices', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const db = getDb()
  const devices = await db.orm.public.CompanionDevice.where({ userId: user.id }).all()
  return c.json(devices.map((d: any) => ({
    id: d.id, name: d.name, osInfo: d.osInfo, lastSeenAt: d.lastSeenAt, createdAt: d.createdAt
  })))
})

companionApp.get('/devices/:id', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)
  return c.json({
    id: device.id,
    name: device.name,
    osInfo: device.osInfo,
    lastSeenAt: device.lastSeenAt ? String(device.lastSeenAt) : null,
    createdAt: device.createdAt ? String(device.createdAt) : null
  })
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

companionApp.post('/devices/:id/commands', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const deviceId = parseInt(c.req.param('id'))
  const { command, requiresSudo } = await c.req.json()
  if (!command) return c.json({ error: 'Command is required' }, 400)
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)
  const cmd = await db.orm.public.CompanionCommand.create({
    deviceId,
    command,
    requiresSudo: requiresSudo === true,
    status: requiresSudo ? 'awaiting_password' : 'pending'
  })
  return c.json(cmd)
})

companionApp.post('/commands/:id/password', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const cmdId = parseInt(c.req.param('id'))
  const { password } = await c.req.json()
  if (!password) return c.json({ error: 'Password required' }, 400)
  const db = getDb()
  const cmd = await db.orm.public.CompanionCommand.where({ id: cmdId }).include('device').first()
  if (!cmd) return c.json({ error: 'Command not found' }, 404)
  if (cmd.device.userId !== user.id) return c.json({ error: 'Forbidden' }, 403)
  const expiresAt = Temporal.Now.instant().add({ seconds: 60 })
  await db.orm.public.CompanionCommand.where({ id: cmdId }).update({
    sudoPassword: password,
    passwordExpiresAt: expiresAt,
    status: 'pending'
  })
  return c.json({ success: true })
})

companionApp.get('/devices/:id/commands', async (c) => {
  try {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)
  const commands = await db.orm.public.CompanionCommand.where({ deviceId }).all()
  
  // Sanitize: never leak sudoPassword, convert Temporal to string safely
  const safe = commands.map((cmd: any) => ({
    id: cmd.id,
    command: cmd.command,
    status: cmd.status,
    output: cmd.output,
    exitCode: cmd.exitCode,
    requiresSudo: cmd.requiresSudo ?? false,
    cwdBefore: cmd.cwdBefore || null,
    cwdAfter: cmd.cwdAfter || null,
    createdAt: cmd.createdAt ? String(cmd.createdAt) : null,
    executedAt: cmd.executedAt ? String(cmd.executedAt) : null,
  }))
  
  // Sort newest first, safely (no Temporal parsing)
  safe.sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() || 0 : 0
    const bt = b.createdAt ? new Date(b.createdAt).getTime() || 0 : 0
    return bt - at
  })
  
  return c.json(safe)
  } catch (err: any) {
    console.error('[Commands API Error]', err)
    return c.json({ error: err.message || 'Internal error', stack: err.stack }, 500)
  }
})

companionApp.get('/pending-commands', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ error: 'Missing token' }, 401)
  const token = authHeader.replace('Bearer ', '')
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ token }).first()
  if (!device) return c.json({ error: 'Invalid token' }, 401)
  const now = Temporal.Now.instant()
  const pending = await db.orm.public.CompanionCommand.where({ deviceId: device.id, status: 'pending' }).all()
  const valid = []
  for (const cmd of pending) {
    if (cmd.sudoPassword && cmd.passwordExpiresAt) {
      if (Temporal.Instant.compare(now, cmd.passwordExpiresAt) > 0) {
        await db.orm.public.CompanionCommand.where({ id: cmd.id }).update({
          status: 'awaiting_password',
          sudoPassword: null,
          passwordExpiresAt: null
        })
        continue
      }
    }
    valid.push(cmd)
  }
  return c.json(valid)
})

companionApp.post('/commands/:id/result', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ error: 'Missing token' }, 401)
  const token = authHeader.replace('Bearer ', '')
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ token }).first()
  if (!device) return c.json({ error: 'Invalid token' }, 401)
  const cmdId = parseInt(c.req.param('id'))
  const { output, exitCode, cwdBefore, cwdAfter } = await c.req.json()
  await db.orm.public.CompanionCommand.where({ id: cmdId, deviceId: device.id }).update({
    status: 'completed',
    output,
    exitCode,
    cwdBefore: cwdBefore || null,
    cwdAfter: cwdAfter || null,
    sudoPassword: null,
    passwordExpiresAt: null,
    executedAt: Temporal.Now.instant()
  })
  return c.json({ success: true })
})

export default companionApp

companionApp.get('/devices/:id/apps', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)
  const all = await db.orm.public.CompanionPackage.where({ deviceId, type: 'app' }).all()
  return c.json(all)
})

companionApp.get('/devices/:id/tools', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)
  const all = await db.orm.public.CompanionPackage.where({ deviceId, type: 'tool' }).all()
  return c.json(all)
})

companionApp.get('/devices/:id/libraries', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)
  const all = await db.orm.public.CompanionPackage.where({ deviceId, type: 'library' }).all()
  return c.json(all)
})

companionApp.get('/devices/:id/outdated', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const deviceId = parseInt(c.req.param('id'))
  const db = getDb()
  const device = await db.orm.public.CompanionDevice.where({ id: deviceId, userId: user.id }).first()
  if (!device) return c.json({ error: 'Device not found' }, 404)
  const all = await db.orm.public.CompanionPackage.where({ deviceId, isOutdated: true }).all()
  return c.json(all)
})

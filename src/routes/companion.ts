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

  return c.json({
    code,
    deviceCode,
    expiresIn: 600,
    verificationUri: 'https://knowlinux.tech/activate'
  })
})

companionApp.get('/token', async (c) => {
  const deviceCode = c.req.query('deviceCode')
  if (!deviceCode) return c.json({ error: 'Missing deviceCode' }, 400)

  const db = getDb()
  const authReq = await db.orm.public.DeviceAuthCode.where({ deviceCode }).first()

  if (!authReq || authReq.status === 'expired') {
    return c.json({ error: 'expired_token' }, 400)
  }

  if (authReq.status === 'pending') {
    return c.json({ error: 'authorization_pending' }, 400)
  }

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
  if (Temporal.Instant.compare(now, authReq.expiresAt) > 0) {
    return c.json({ error: 'Code expired' }, 400)
  }

  await db.orm.public.DeviceAuthCode.where({ code }).update({
    status: 'authorized',
    userId: user.id
  })

  return c.json({ success: true })
})

export default companionApp

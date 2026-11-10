import { Hono } from 'hono'
import { getDb } from '../prisma/db.js'
import { Temporal } from 'temporal-polyfill'
import crypto from 'crypto'

const companionApp = new Hono()

// 1. CLI requests a new device code
companionApp.post('/device-code', async (c) => {
  const db = getDb()
  const code = crypto.randomBytes(3).toString('hex').toUpperCase() // e.g., A1B2C3
  const deviceCode = crypto.randomUUID()
  const expiresAt = Temporal.Now.instant().add({ minutes: 10 })

  await db.orm.public.DeviceAuthCode.create({
    code,
    deviceCode,
    expiresAt
  })

  return c.json({
    code,
    deviceCode,
    expiresIn: 600,
    verificationUri: 'https://knowlinux.tech/activate'
  })
})

// 2. CLI polls to check if the user authorized it
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

  // Generate permanent device token
  const token = crypto.randomUUID()
  const device = await db.orm.public.CompanionDevice.create({
    userId: authReq.userId!,
    token,
    name: 'Linux Machine' // We can update this later with actual hostname
  })

  // Clean up the auth code
  await db.orm.public.DeviceAuthCode.where({ deviceCode }).delete()

  return c.json({ token, device })
})

// 3. Web frontend authorizes the code
companionApp.post('/authorize', async (c) => {
  const { code } = await c.req.json()
  // In a real app, you get the user from the session cookie here
  const user = await getCurrentUser(c) 
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const db = getDb()
  const authReq = await db.orm.public.DeviceAuthCode.where({ code }).first()

  if (!authReq || Temporal.Instant.compare(Temporal.Now.instant(), authReq.expiresAt) > 0) {
    return c.json({ error: 'Invalid or expired code' }, 400)
  }

  await db.orm.public.DeviceAuthCode.where({ code }).update({
    status: 'authorized',
    userId: user.id
  })

  return c.json({ success: true })
})

export default companionApp

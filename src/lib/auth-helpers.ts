import { getCookie } from 'hono/cookie'
import { Temporal } from 'temporal-polyfill'
import { getDb } from '../prisma/db.js'

export async function getCurrentUser(c: any) {
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

import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { getDb } from '../prisma/db.js'
import { Temporal } from 'temporal-polyfill'
import crypto from 'crypto'

const googleApp = new Hono()

const REDIRECT_URI = process.env.NODE_ENV === 'production'
  ? 'https://knowlinux.tech/api/auth/google/callback'
  : 'http://localhost:8080/api/auth/google/callback'

googleApp.get('/google', async (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return c.json({ error: 'Google OAuth not configured' }, 500)

  const state = crypto.randomBytes(16).toString('hex')
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 600,
    path: '/'
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account'
  })

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

googleApp.get('/google/callback', async (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const { code, state } = c.req.query()
  const savedState = getCookie(c, 'oauth_state')
  deleteCookie(c, 'oauth_state')

  if (!code || !state || state !== savedState) {
    return c.redirect('/login?error=oauth_state')
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    })
    if (!tokenRes.ok) {
      console.error('Token exchange failed:', await tokenRes.text())
      return c.redirect('/login?error=oauth_token')
    }
    const tokens: any = await tokenRes.json()

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    if (!userRes.ok) return c.redirect('/login?error=oauth_user')
    const googleUser: any = await userRes.json()

    const db = getDb()
    let user = await db.orm.public.User.where({ googleId: googleUser.id }).first()

    if (!user) {
      user = await db.orm.public.User.where({ email: googleUser.email }).first()
      if (user) {
        await db.orm.public.User.where({ id: user.id }).update({ googleId: googleUser.id })
      } else {
        user = await db.orm.public.User.create({
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          googleId: googleUser.id
        })
      }
    }

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

    return c.redirect('/workstation')
  } catch (err) {
    console.error('Google OAuth error:', err)
    return c.redirect('/login?error=oauth_failed')
  }
})

export default googleApp

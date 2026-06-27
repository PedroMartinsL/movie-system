import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../db'
import { signAccessToken, signRefreshToken, refreshExpiresAt } from '../jwt'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!
const FRONTEND_URL = process.env.FRONTEND_URL!

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/register', async (req, reply) => {
    const { email, name, password, languages } = req.body as {
      email: string
      name: string
      password: string
      languages?: string[]
    }

    if (!email || !name || !password) {
      return reply.status(400).send({ error: 'email, name e password são obrigatórios' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.status(409).send({ error: 'Email já cadastrado' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, name, passwordHash, languages: languages ?? [] },
    })

    const accessToken = signAccessToken(user.id, user.email, user.role)
    const refreshToken = signRefreshToken()

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiresAt() },
    })

    return reply.status(201).send({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  })

  // POST /auth/login
  app.post('/login', async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string }

    if (!email || !password) {
      return reply.status(400).send({ error: 'email e password são obrigatórios' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }

    const accessToken = signAccessToken(user.id, user.email, user.role)
    const refreshToken = signRefreshToken()

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiresAt() },
    })

    return reply.send({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  })

  // POST /auth/refresh
  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken: string }
    if (!refreshToken) {
      return reply.status(400).send({ error: 'refreshToken é obrigatório' })
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
      return reply.status(401).send({ error: 'Refresh token inválido ou expirado' })
    }

    const accessToken = signAccessToken(stored.user.id, stored.user.email, stored.user.role)
    return reply.send({ accessToken })
  })

  // POST /auth/logout
  app.post('/logout', async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    return reply.send({ message: 'Logout realizado com sucesso' })
  })

  // GET /auth/me — requer X-User-Id injetado pelo gateway
  app.get('/me', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string
    if (!userId) return reply.status(401).send({ error: 'Não autenticado' })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, languages: true, createdAt: true },
    })

    if (!user) return reply.status(404).send({ error: 'Usuário não encontrado' })
    return reply.send({ user })
  })

  // PATCH /auth/profile
  app.patch('/profile', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string
    if (!userId) return reply.status(401).send({ error: 'Não autenticado' })

    const { name, languages } = req.body as { name?: string; languages?: string[] }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(languages && { languages }),
      },
      select: { id: true, email: true, name: true, role: true, languages: true },
    })

    return reply.send({ user })
  })

  // PATCH /auth/password
  app.patch('/password', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string
    if (!userId) return reply.status(401).send({ error: 'Não autenticado' })

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string
      newPassword: string
    }

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({ error: 'currentPassword e newPassword são obrigatórios' })
    }
    if (newPassword.length < 6) {
      return reply.status(400).send({ error: 'Nova senha deve ter pelo menos 6 caracteres' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ error: 'Usuário não encontrado' })

    if (!user.passwordHash) {
      return reply.status(400).send({ error: 'Conta vinculada ao Google não possui senha' })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Senha atual incorreta' })

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

    return reply.send({ message: 'Senha alterada com sucesso' })
  })

  // GET /auth/google — inicia o fluxo OAuth
  app.get('/google', async (req, reply) => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
    })
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  })

  // GET /auth/google/callback — troca code por tokens, upsert user, redireciona ao frontend
  app.get('/google/callback', async (req, reply) => {
    const { code, error } = req.query as { code?: string; error?: string }

    if (error || !code) {
      return reply.redirect(`${FRONTEND_URL}?error=google_auth_failed`)
    }

    try {
      // Troca code por access_token do Google
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
      if (!tokenData.access_token) {
        return reply.redirect(`${FRONTEND_URL}?error=google_token_failed`)
      }

      // Busca informações do usuário no Google
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const googleUser = await userRes.json() as { id: string; email: string; name: string }

      // Upsert: encontra por googleId ou email, cria se não existir
      let user = await prisma.user.findUnique({ where: { googleId: googleUser.id } })

      if (!user) {
        user = await prisma.user.findUnique({ where: { email: googleUser.email } })
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: googleUser.id },
          })
        } else {
          user = await prisma.user.create({
            data: {
              email: googleUser.email,
              name: googleUser.name,
              googleId: googleUser.id,
            },
          })
        }
      }

      const accessToken = signAccessToken(user.id, user.email, user.role)
      const refreshToken = signRefreshToken()

      await prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiresAt() },
      })

      console.log('\n========== GOOGLE OAUTH - JWT GERADO ==========')
      console.log(`Usuário : ${user.email}`)
      console.log(`Role    : ${user.role}`)
      console.log(`Access Token:\n${accessToken}`)
      console.log('================================================\n')

      return reply.redirect(
        `${FRONTEND_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`
      )
    } catch {
      return reply.redirect(`${FRONTEND_URL}?error=google_auth_failed`)
    }
  })
}

import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { redis } from '../redis'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
  sub: string
  email: string
  role: 'ADMIN' | 'NORMAL'
  iss: string
  aud: string
  exp: number
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<JwtPayload | null> {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Token não fornecido', code: 'MISSING_TOKEN' })
    return null
  }

  const token = authHeader.slice(7)

  // Verifica blacklist no Redis
  const blacklisted = await redis.get(`blacklist:${token}`)
  if (blacklisted) {
    reply.status(401).send({ error: 'Token revogado', code: 'TOKEN_REVOKED' })
    return null
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'movie-system',
      audience: 'movie-system-clients',
    }) as JwtPayload

    // Injeta headers para os microsserviços internos
    req.headers['x-user-id'] = payload.sub
    req.headers['x-user-role'] = payload.role
    req.headers['x-user-email'] = payload.email

    return payload
  } catch (err) {
    reply.status(401).send({ error: 'Token inválido ou expirado', code: 'INVALID_TOKEN' })
    return null
  }
}

export async function requireRole(
  req: FastifyRequest,
  reply: FastifyReply,
  role: 'ADMIN' | 'NORMAL'
): Promise<boolean> {
  const payload = await authenticate(req, reply)
  if (!payload) return false

  if (role === 'ADMIN' && payload.role !== 'ADMIN') {
    reply.status(403).send({ error: 'Acesso negado: permissão insuficiente', code: 'FORBIDDEN' })
    return false
  }

  return true
}

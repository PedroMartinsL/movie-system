import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { redis } from '../redis'

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE DE AUTENTICAÇÃO
// Este arquivo NÃO cria o token (quem cria é o auth-service, no login).
// Ele só VALIDA/CONFERE o token que chega em cada requisição.
// O elo entre os dois é este segredo compartilhado (JWT_SECRET):
// o auth-service assina o token com ele; aqui usamos o mesmo pra conferir.
// ═══════════════════════════════════════════════════════════════════════════
const JWT_SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
  sub: string
  email: string
  role: 'ADMIN' | 'NORMAL'
  iss: string
  aud: string
  exp: number
}

// authenticate: confere se o usuário está logado (token válido). É o "confere o RG".
export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<JwtPayload | null> {
  // 1) O token vem no cabeçalho "Authorization: Bearer <token>". Sem ele → barra.
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Token não fornecido', code: 'MISSING_TOKEN' })
    return null
  }

  const token = authHeader.slice(7) // remove o "Bearer " e fica só com o token

  // 2) Blacklist no Redis: se o usuário deu logout, o token está na lista negra.
  //    Mesmo sendo "válido", ele é bloqueado aqui.
  const blacklisted = await redis.get(`blacklist:${token}`)
  if (blacklisted) {
    reply.status(401).send({ error: 'Token revogado', code: 'TOKEN_REVOKED' })
    return null
  }

  try {
    // 3) Confere a ASSINATURA do token com o JWT_SECRET (e se não expirou).
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'movie-system',
      audience: 'movie-system-clients',
    }) as JwtPayload

    // 4) Token OK: guarda quem é o usuário em cabeçalhos internos, para os
    //    microsserviços saberem o id/papel SEM precisar validar o token de novo.
    req.headers['x-user-id'] = payload.sub
    req.headers['x-user-role'] = payload.role
    req.headers['x-user-email'] = payload.email

    return payload
  } catch (err) {
    // Token adulterado ou expirado → barra.
    reply.status(401).send({ error: 'Token inválido ou expirado', code: 'INVALID_TOKEN' })
    return null
  }
}

// requireRole: além de estar logado, exige um papel específico (ex.: ADMIN).
export async function requireRole(
  req: FastifyRequest,
  reply: FastifyReply,
  role: 'ADMIN' | 'NORMAL'
): Promise<boolean> {
  // Primeiro confere se o token é válido (reaproveita a função acima).
  const payload = await authenticate(req, reply)
  if (!payload) return false

  // Depois confere o papel: se a rota é de ADMIN e o usuário não é, bloqueia (403).
  if (role === 'ADMIN' && payload.role !== 'ADMIN') {
    reply.status(403).send({ error: 'Acesso negado: permissão insuficiente', code: 'FORBIDDEN' })
    return false
  }

  return true
}

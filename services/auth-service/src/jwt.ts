import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

export interface JwtPayload {
  sub: string
  iss: string
  aud: string
  exp: number
  iat: number
  role: string
  email: string
}

export function signAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { sub: userId, email, role },
    JWT_SECRET,
    {
      issuer: 'movie-system',
      audience: 'movie-system-clients',
      expiresIn: JWT_EXPIRES_IN as any,
    }
  )
}

export function signRefreshToken(): string {
  return uuidv4()
}

export function refreshExpiresAt(): Date {
  const ms = parseDuration(REFRESH_EXPIRES_IN)
  return new Date(Date.now() + ms)
}

function parseDuration(s: string): number {
  const match = s.match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const n = parseInt(match[1])
  const unit = match[2]
  const map: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
  return n * map[unit]
}

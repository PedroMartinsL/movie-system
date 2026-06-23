import { FastifyInstance } from 'fastify'
import httpProxy from '@fastify/http-proxy'
import { authenticate, requireRole } from '../middleware/jwtAuth'

const AUTH_URL = process.env.AUTH_SERVICE_URL!
const CATALOG_URL = process.env.CATALOG_SERVICE_URL!
const STORAGE_URL = process.env.STORAGE_SERVICE_URL!
const SUBTITLE_URL = process.env.SUBTITLE_SERVICE_URL!
const AI_URL = process.env.AI_SERVICE_URL!
const SUBSCRIPTION_URL = process.env.SUBSCRIPTION_SERVICE_URL!
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL!

// Rotas públicas (sem auth)
const PUBLIC_ROUTES: Array<{ method: string; path: RegExp }> = [
  { method: 'POST', path: /^\/auth\/register$/ },
  { method: 'POST', path: /^\/auth\/login$/ },
  { method: 'POST', path: /^\/auth\/refresh$/ },
  { method: 'POST', path: /^\/auth\/logout$/ },
  { method: 'GET', path: /^\/auth\/google$/ },
  { method: 'GET', path: /^\/auth\/google\/callback(\?.*)?$/ },
  { method: 'GET', path: /^\/storage\/poster\/[^/]+$/ },
  { method: 'GET', path: /^\/storage\/stream\/[^/]+$/ },
  { method: 'GET', path: /^\/catalog\/movies(\?.*)?$/ },
  { method: 'GET', path: /^\/catalog\/movies\/[^/]+$/ },
  { method: 'GET', path: /^\/catalog\/home(\?.*)?$/ },
  { method: 'GET', path: /^\/catalog\/categories(\?.*)?$/ },
  { method: 'GET', path: /^\/subscriptions\/plans(\?.*)?$/ },
]

// Rotas exclusivas de ADMIN
const ADMIN_ROUTES: Array<{ method: string; path: RegExp }> = [
  { method: 'POST', path: /^\/catalog\/movies$/ },
  { method: 'PATCH', path: /^\/catalog\/movies\/[^/]+$/ },
  { method: 'DELETE', path: /^\/catalog\/movies\/[^/]+$/ },
  { method: 'POST', path: /^\/storage\/upload\/video$/ },
  { method: 'POST', path: /^\/storage\/upload\/poster$/ },
  { method: 'GET', path: /^\/ai\/describe(\?.*)?$/ },
  { method: 'GET', path: /^\/ai\/jobs(\?.*)?$/ },
  { method: 'GET', path: /^\/ai\/jobs\/[^/]+$/ },
  { method: 'GET', path: /^\/notifications\/logs(\?.*)?$/ },
]

function isPublic(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some(r => r.method === method && r.path.test(path))
}

function isAdmin(method: string, path: string): boolean {
  return ADMIN_ROUTES.some(r => r.method === method && r.path.test(path))
}

async function authHook(req: any, reply: any) {
  const { method, url } = req

  if (isPublic(method, url)) return

  if (isAdmin(method, url)) {
    const ok = await requireRole(req, reply, 'ADMIN')
    if (!ok) return
  } else {
    const payload = await authenticate(req, reply)
    if (!payload) return
  }
}

export async function registerProxies(app: FastifyInstance) {
  // Aplica middleware de autenticação em todas as rotas
  app.addHook('preHandler', authHook)

  // Proxy: /auth/* → auth-service
  app.register(httpProxy, {
    upstream: AUTH_URL,
    prefix: '/auth',
    rewritePrefix: '/auth',
  })

  // Proxy: /catalog/* → catalog-service
  app.register(httpProxy, {
    upstream: CATALOG_URL,
    prefix: '/catalog',
    rewritePrefix: '/catalog',
  })

  // Proxy: /storage/* → storage-service
  app.register(httpProxy, {
    upstream: STORAGE_URL,
    prefix: '/storage',
    rewritePrefix: '/storage',
  })

  // Proxy: /subtitles/* → subtitle-service
  app.register(httpProxy, {
    upstream: SUBTITLE_URL,
    prefix: '/subtitles',
    rewritePrefix: '/subtitles',
  })

  // Proxy: /ai/* → ai-service
  app.register(httpProxy, {
    upstream: AI_URL,
    prefix: '/ai',
    rewritePrefix: '/ai',
  })

  // Proxy: /subscriptions/* → subscription-service
  app.register(httpProxy, {
    upstream: SUBSCRIPTION_URL,
    prefix: '/subscriptions',
    rewritePrefix: '/subscriptions',
  })

  // Proxy: /notifications/* → notification-service
  app.register(httpProxy, {
    upstream: NOTIFICATION_URL,
    prefix: '/notifications',
    rewritePrefix: '/notifications',
  })
}

import { FastifyInstance } from 'fastify'
import httpProxy from '@fastify/http-proxy'
import { authenticate, requireRole } from '../middleware/jwtAuth'

// ═══════════════════════════════════════════════════════════════════════════
// ENDEREÇOS DOS MICROSSERVIÇOS
// O Gateway não faz o trabalho; ele só encaminha para o serviço certo.
// Cada URL abaixo aponta para um microsserviço (vem do arquivo .env).
// ═══════════════════════════════════════════════════════════════════════════
const AUTH_URL = process.env.AUTH_SERVICE_URL!
const CATALOG_URL = process.env.CATALOG_SERVICE_URL!
const STORAGE_URL = process.env.STORAGE_SERVICE_URL!
const SUBTITLE_URL = process.env.SUBTITLE_SERVICE_URL!
const AI_URL = process.env.AI_SERVICE_URL!
const SUBSCRIPTION_URL = process.env.SUBSCRIPTION_SERVICE_URL!
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL!

// ═══════════════════════════════════════════════════════════════════════════
// NÍVEL 1 — ROTAS PÚBLICAS (qualquer um acessa, SEM precisar de token)
// Ex.: fazer login, registrar, ver o catálogo de filmes.
// ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// NÍVEL 2 — ROTAS SÓ DE ADMIN (precisa de token E de ser ADMIN)
// Ex.: cadastrar/editar/apagar filme, subir vídeo, ver os jobs de IA.
// (Tudo o que não está aqui nem nas públicas exige apenas estar logado.)
// ═══════════════════════════════════════════════════════════════════════════
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

// Verifica se a rota pedida está na lista de públicas
function isPublic(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some(r => r.method === method && r.path.test(path))
}

// Verifica se a rota pedida está na lista de admin
function isAdmin(method: string, path: string): boolean {
  return ADMIN_ROUTES.some(r => r.method === method && r.path.test(path))
}

// ═══════════════════════════════════════════════════════════════════════════
// O "PORTEIRO": roda ANTES de toda requisição e decide se ela pode passar
// ═══════════════════════════════════════════════════════════════════════════
async function authHook(req: any, reply: any) {
  const { method, url } = req

  console.log(`[GATEWAY] ${new Date().toISOString()} ${method} ${url}`)

  // 1) É rota pública? Libera sem pedir nada.
  if (isPublic(method, url)) return

  // 2) É rota de admin? Exige token válido E papel ADMIN.
  if (isAdmin(method, url)) {
    const ok = await requireRole(req, reply, 'ADMIN')
    if (!ok) return
  } else {
    // 3) Qualquer outra rota: basta um token válido (usuário logado).
    const payload = await authenticate(req, reply)
    if (!payload) return
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTAGEM DO GATEWAY: liga o porteiro e define os encaminhamentos (proxy)
// ═══════════════════════════════════════════════════════════════════════════
export async function registerProxies(app: FastifyInstance) {
  // Aplica o "porteiro" (authHook) ANTES de qualquer rota
  app.addHook('preHandler', authHook)

  // Daqui pra baixo: cada prefixo de URL é redirecionado para o seu serviço.
  // Ex.: uma chamada em /ai/jobs é repassada para o ai-service.

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

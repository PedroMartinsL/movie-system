import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth'
import { prisma } from './db'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })

app.get('/health', async () => ({ status: 'ok', service: 'auth-service' }))

app.register(authRoutes, { prefix: '/auth' })

const start = async () => {
  try {
    await prisma.$connect()
    const port = Number(process.env.PORT) || 8001
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`auth-service running on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

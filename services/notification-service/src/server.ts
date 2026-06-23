import Fastify from 'fastify'
import cors from '@fastify/cors'
import { prisma } from './db'
import { startConsumer } from './consumer'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })

app.get('/health', async () => ({ status: 'ok', service: 'notification-service' }))

app.get('/notifications/logs', async (req, reply) => {
  const role = req.headers['x-user-role']
  if (role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' })

  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return reply.send({ logs })
})

const start = async () => {
  try {
    await prisma.$connect()
    await startConsumer()
    const port = Number(process.env.PORT) || 8007
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`notification-service running on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

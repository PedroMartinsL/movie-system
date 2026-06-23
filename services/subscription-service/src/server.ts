import Fastify from 'fastify'
import cors from '@fastify/cors'
import { prisma } from './db'
import { connectRabbitMQ } from './rabbitmq'
import { subscriptionRoutes } from './routes/subscriptions'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })

app.get('/health', async () => ({ status: 'ok', service: 'subscription-service' }))

app.register(subscriptionRoutes, { prefix: '/subscriptions' })

const start = async () => {
  try {
    await prisma.$connect()
    await connectRabbitMQ()
    const port = Number(process.env.PORT) || 8006
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`subscription-service running on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

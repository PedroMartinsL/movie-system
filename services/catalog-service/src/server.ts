import Fastify from 'fastify'
import cors from '@fastify/cors'
import { prisma } from './db'
import { connectRabbitMQ } from './rabbitmq'
import { movieRoutes } from './routes/movies'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })

app.get('/health', async () => ({ status: 'ok', service: 'catalog-service' }))

app.register(movieRoutes, { prefix: '/catalog' })

const start = async () => {
  try {
    await prisma.$connect()
    await connectRabbitMQ()
    const port = Number(process.env.PORT) || 8002
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`catalog-service running on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

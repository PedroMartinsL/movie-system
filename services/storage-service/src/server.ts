import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { prisma } from './db'
import { ensureBuckets } from './minio'
import { connectRabbitMQ } from './rabbitmq'
import { storageRoutes } from './routes/storage'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })
app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 * 1024 } }) // 5GB

app.get('/health', async () => ({ status: 'ok', service: 'storage-service' }))

app.register(storageRoutes, { prefix: '/storage' })

const start = async () => {
  try {
    await prisma.$connect()
    await ensureBuckets()
    await connectRabbitMQ()
    const port = Number(process.env.PORT) || 8003
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`storage-service running on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

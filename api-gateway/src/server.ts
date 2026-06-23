import Fastify from 'fastify'
import cors from '@fastify/cors'
import { redis } from './redis'
import { registerProxies } from './routes/proxy'

const app = Fastify({ logger: true })

app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

app.get('/health', async () => ({ status: 'ok', service: 'api-gateway' }))

app.register(registerProxies)

const start = async () => {
  try {
    await redis.connect()
    const port = Number(process.env.PORT) || 8080
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`api-gateway running on port ${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

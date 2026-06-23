import { FastifyInstance } from 'fastify'
import { prisma } from '../db'
import { publishEvent } from '../rabbitmq'

export async function subscriptionRoutes(app: FastifyInstance) {
  // GET /subscriptions/plans — público
  app.get('/plans', async (_req, reply) => {
    const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceMonthly: 'asc' } })
    return reply.send({ plans })
  })

  // GET /subscriptions/me
  app.get('/me', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string
    if (!userId) return reply.status(401).send({ error: 'Não autenticado' })

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ subscription })
  })

  // POST /subscriptions
  app.post('/', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string
    if (!userId) return reply.status(401).send({ error: 'Não autenticado' })

    const { planId } = req.body as { planId: string }
    if (!planId) return reply.status(400).send({ error: 'planId é obrigatório' })

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) return reply.status(404).send({ error: 'Plano não encontrado' })

    // Cancela assinatura ativa anterior
    await prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    })

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const subscription = await prisma.subscription.create({
      data: { userId, planId, expiresAt },
      include: { plan: true },
    })

    await publishEvent('subscription.created', { userId, planId, planName: plan.name })

    return reply.status(201).send({ subscription })
  })

  // PATCH /subscriptions/:id/cancel
  app.patch('/:id/cancel', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string
    if (!userId) return reply.status(401).send({ error: 'Não autenticado' })

    const { id } = req.params as { id: string }

    const subscription = await prisma.subscription.findUnique({ where: { id } })
    if (!subscription || subscription.userId !== userId) {
      return reply.status(404).send({ error: 'Assinatura não encontrada' })
    }

    await prisma.subscription.update({ where: { id }, data: { status: 'CANCELLED' } })
    return reply.send({ message: 'Assinatura cancelada com sucesso' })
  })
}

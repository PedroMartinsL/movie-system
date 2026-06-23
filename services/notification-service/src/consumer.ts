import amqp from 'amqplib'
import { prisma } from './db'
import { sendEmail } from './mailer'

export async function startConsumer() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672')
  const channel = await conn.createChannel()

  await channel.assertExchange('movie-events', 'topic', { durable: true })

  // Fila para legendas prontas
  await channel.assertQueue('notifications.subtitles.ready', { durable: true })
  await channel.bindQueue('notifications.subtitles.ready', 'movie-events', 'subtitles.ready')

  // Fila para nova assinatura
  await channel.assertQueue('notifications.subscription.created', { durable: true })
  await channel.bindQueue('notifications.subscription.created', 'movie-events', 'subscription.created')

  channel.consume('notifications.subtitles.ready', async (msg) => {
    if (!msg) return
    try {
      const event = JSON.parse(msg.content.toString())
      const { movieId } = event

      const html = `
        <h2>Legendas prontas!</h2>
        <p>As legendas do filme <strong>${movieId}</strong> foram geradas automaticamente pela IA.</p>
        <p>O filme já está disponível para os usuários com legendas em múltiplos idiomas.</p>
      `
      await sendEmail('admin@moviesystem.local', `Legendas prontas — Filme ${movieId}`, html)

      await prisma.notificationLog.create({
        data: { event: 'subtitles.ready', payload: msg.content.toString(), recipient: 'admin@moviesystem.local', status: 'SENT' },
      })

      channel.ack(msg)
    } catch (err) {
      console.error('Erro ao processar subtitles.ready:', err)
      channel.nack(msg, false, false)
    }
  })

  channel.consume('notifications.subscription.created', async (msg) => {
    if (!msg) return
    try {
      const event = JSON.parse(msg.content.toString())
      const { userId, planName } = event

      const html = `
        <h2>Assinatura ativada!</h2>
        <p>Sua assinatura do plano <strong>${planName}</strong> foi ativada com sucesso.</p>
        <p>Aproveite o streaming!</p>
      `
      await sendEmail('user@moviesystem.local', 'Sua assinatura foi ativada!', html)

      await prisma.notificationLog.create({
        data: { event: 'subscription.created', payload: msg.content.toString(), recipient: `user-${userId}`, status: 'SENT' },
      })

      channel.ack(msg)
    } catch (err) {
      console.error('Erro ao processar subscription.created:', err)
      channel.nack(msg, false, false)
    }
  })

  console.log('notification-service consumer started')
}

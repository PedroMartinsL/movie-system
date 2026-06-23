import amqp from 'amqplib'

let channel: amqp.Channel | null = null

export async function connectRabbitMQ() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672')
  channel = await conn.createChannel()
  await channel.assertExchange('movie-events', 'topic', { durable: true })
  console.log('RabbitMQ connected')
}

export async function publishEvent(routingKey: string, payload: object) {
  if (!channel) throw new Error('RabbitMQ not connected')
  channel.publish(
    'movie-events',
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  )
}

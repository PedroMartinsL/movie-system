import { FastifyInstance } from 'fastify'
import { pipeline } from 'stream/promises'
import { prisma } from '../db'
import { minioClient, BUCKET_VIDEOS, BUCKET_POSTERS } from '../minio'
import { publishEvent } from '../rabbitmq'

export async function storageRoutes(app: FastifyInstance) {
  // POST /storage/upload/video (ADMIN)
  app.post('/upload/video', async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado' })

    const movieId = (req.query as any).movieId
    if (!movieId) return reply.status(400).send({ error: 'movieId é obrigatório como query param' })

    const objectName = `${movieId}/video${getExtension(data.filename)}`
    const chunks: Buffer[] = []
    for await (const chunk of data.file) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)

    await minioClient.putObject(BUCKET_VIDEOS, objectName, buffer, buffer.length, {
      'Content-Type': data.mimetype,
    })

    await prisma.fileRecord.upsert({
      where: { movieId_type: { movieId, type: 'VIDEO' } },
      update: { objectName, size: BigInt(buffer.length), mimeType: data.mimetype },
      create: { movieId, type: 'VIDEO', bucketName: BUCKET_VIDEOS, objectName, size: BigInt(buffer.length), mimeType: data.mimetype },
    })

    await publishEvent('video.uploaded', {
      movieId,
      bucketName: BUCKET_VIDEOS,
      objectName,
      timestamp: new Date().toISOString(),
    })

    return reply.status(201).send({ movieId, objectName, message: 'Vídeo enviado com sucesso' })
  })

  // POST /storage/upload/poster (ADMIN)
  app.post('/upload/poster', async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado' })

    const movieId = (req.query as any).movieId
    if (!movieId) return reply.status(400).send({ error: 'movieId é obrigatório como query param' })

    const objectName = `${movieId}/poster${getExtension(data.filename)}`
    const chunks: Buffer[] = []
    for await (const chunk of data.file) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)

    await minioClient.putObject(BUCKET_POSTERS, objectName, buffer, buffer.length, {
      'Content-Type': data.mimetype,
    })

    await prisma.fileRecord.upsert({
      where: { movieId_type: { movieId, type: 'POSTER' } },
      update: { objectName, size: BigInt(buffer.length), mimeType: data.mimetype },
      create: { movieId, type: 'POSTER', bucketName: BUCKET_POSTERS, objectName, size: BigInt(buffer.length), mimeType: data.mimetype },
    })

    return reply.status(201).send({ movieId, objectName, message: 'Poster enviado com sucesso' })
  })

  // GET /storage/stream/:movieId — stream direto do MinIO com suporte a Range
  app.get('/stream/:movieId', async (req, reply) => {
    const { movieId } = req.params as { movieId: string }

    const record = await prisma.fileRecord.findUnique({
      where: { movieId_type: { movieId, type: 'VIDEO' } },
    })

    if (!record) return reply.status(404).send({ error: 'Vídeo não encontrado' })

    const stat = await minioClient.statObject(record.bucketName, record.objectName)
    const fileSize = stat.size
    const contentType = record.mimeType || 'video/mp4'
    const rangeHeader = req.headers['range'] as string | undefined

    if (rangeHeader) {
      const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-')
      const start = parseInt(startStr, 10)
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1
      const chunkSize = end - start + 1

      reply.status(206)
      reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      reply.header('Accept-Ranges', 'bytes')
      reply.header('Content-Length', String(chunkSize))
      reply.header('Content-Type', contentType)

      const stream = await minioClient.getPartialObject(record.bucketName, record.objectName, start, chunkSize)
      return reply.send(stream)
    }

    reply.header('Content-Length', String(fileSize))
    reply.header('Content-Type', contentType)
    reply.header('Accept-Ranges', 'bytes')

    const stream = await minioClient.getObject(record.bucketName, record.objectName)
    return reply.send(stream)
  })

  // GET /storage/poster/:movieId
  app.get('/poster/:movieId', async (req, reply) => {
    const { movieId } = req.params as { movieId: string }

    const record = await prisma.fileRecord.findUnique({
      where: { movieId_type: { movieId, type: 'POSTER' } },
    })

    if (!record) return reply.status(404).send({ error: 'Poster não encontrado' })

    // Bucket de posters é público — URL direta sem presign
    const minioPublicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'
    const url = `${minioPublicUrl}/${record.bucketName}/${record.objectName}`

    const accept = (req.headers['accept'] ?? '') as string
    if (accept.includes('application/json')) {
      return reply.send({ url })
    }
    return reply.redirect(302, url)
  })
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx) : ''
}

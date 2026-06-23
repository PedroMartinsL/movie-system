import { FastifyInstance } from 'fastify'
import { prisma } from '../db'

const STORAGE_URL = process.env.STORAGE_SERVICE_URL || 'http://storage-service:8003'

function buildMovieResponse(movie: any) {
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    year: movie.year,
    genre: movie.genre,
    idioma: movie.idioma,
    status: movie.status,
    featured: movie.featured,
    imgUrl: movie.posterId ? `/storage/poster/${movie.id}` : null,
    videoUrl: movie.videoId ? `/storage/stream/${movie.id}` : null,
    legenda: 'Verificando...',
    createdAt: movie.createdAt,
  }
}

export async function movieRoutes(app: FastifyInstance) {
  // GET /catalog/movies
  app.get('/movies', async (req, reply) => {
    const { search, genre, page = '1', limit = '20' } = req.query as {
      search?: string
      genre?: string
      page?: string
      limit?: string
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where: any = {}
    if (search) where.title = { contains: search, mode: 'insensitive' }
    if (genre) where.genre = genre

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.movie.count({ where }),
    ])

    return reply.send({
      data: movies.map(buildMovieResponse),
      pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) },
    })
  })

  // GET /catalog/home
  app.get('/home', async (_req, reply) => {
    const [featured, recent] = await Promise.all([
      prisma.movie.findMany({ where: { featured: true, status: 'READY' }, take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.movie.findMany({ where: { status: 'READY' }, take: 12, orderBy: { createdAt: 'desc' } }),
    ])

    return reply.send({
      featured: featured.map(buildMovieResponse),
      recent: recent.map(buildMovieResponse),
    })
  })

  // GET /catalog/categories
  app.get('/categories', async (_req, reply) => {
    const genres = ['ACTION', 'DRAMA', 'COMEDY', 'HORROR', 'ROMANCE', 'SCI_FI']
    const labels: Record<string, string> = {
      ACTION: 'Ação',
      DRAMA: 'Drama',
      COMEDY: 'Comédia',
      HORROR: 'Terror',
      ROMANCE: 'Romance',
      SCI_FI: 'Ficção Científica',
    }
    return reply.send({ categories: genres.map(g => ({ id: g, label: labels[g] })) })
  })

  // GET /catalog/movies/:id
  app.get('/movies/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const movie = await prisma.movie.findUnique({ where: { id } })
    if (!movie) return reply.status(404).send({ error: 'Filme não encontrado' })
    return reply.send(buildMovieResponse(movie))
  })

  // POST /catalog/movies (ADMIN)
  app.post('/movies', async (req, reply) => {
    const role = req.headers['x-user-role']
    if (role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' })

    const { title, description, year, genre, idioma, posterId, videoId, featured } = req.body as {
      title: string
      description: string
      year: number
      genre: string
      idioma: string
      posterId?: string
      videoId?: string
      featured?: boolean
    }

    if (!title || !description || !year || !genre || !idioma) {
      return reply.status(400).send({ error: 'title, description, year, genre e idioma são obrigatórios' })
    }

    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        year,
        genre: genre as any,
        idioma,
        posterId,
        videoId,
        featured: featured ?? false,
        status: videoId ? 'PROCESSING' : 'READY',
      },
    })

    return reply.status(201).send(buildMovieResponse(movie))
  })

  // PATCH /catalog/movies/:id (ADMIN)
  app.patch('/movies/:id', async (req, reply) => {
    const role = req.headers['x-user-role']
    if (role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' })

    const { id } = req.params as { id: string }
    const data = req.body as Partial<{
      title: string
      description: string
      year: number
      genre: string
      idioma: string
      posterId: string
      videoId: string
      featured: boolean
      status: string
    }>

    const movie = await prisma.movie.update({
      where: { id },
      data: data as any,
    })

    return reply.send(buildMovieResponse(movie))
  })

  // DELETE /catalog/movies/:id (ADMIN)
  app.delete('/movies/:id', async (req, reply) => {
    const role = req.headers['x-user-role']
    if (role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' })

    const { id } = req.params as { id: string }
    await prisma.movie.delete({ where: { id } })
    return reply.status(204).send()
  })
}

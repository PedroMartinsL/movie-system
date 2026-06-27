import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@moviesystem.com' },
    update: {},
    create: {
      email: 'admin@moviesystem.com',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('Admin criado:', admin.email, '| role:', admin.role)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

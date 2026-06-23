import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  const plans = [
    {
      name: 'Básico',
      description: 'Comece gratuitamente e explore o catálogo',
      priceMonthly: 0,
      features: ['Catálogo completo', 'Qualidade SD', '1 tela simultânea', 'Legendas disponíveis'],
    },
    {
      name: 'Mensal',
      description: 'Acesso completo com renovação mensal',
      priceMonthly: 19.90,
      features: ['Catálogo completo', 'Qualidade HD', '2 telas simultâneas', 'Legendas em múltiplos idiomas', 'Download offline'],
    },
    {
      name: 'Anual',
      description: 'Melhor custo-benefício com cobrança anual',
      priceMonthly: 14.90,
      features: ['Catálogo completo', 'Qualidade 4K', '4 telas simultâneas', 'Legendas em múltiplos idiomas', 'Download offline', 'Suporte prioritário'],
    },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    })
  }

  console.log('Planos criados com sucesso')
  await prisma.$disconnect()
}

seed().catch(console.error)

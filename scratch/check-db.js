const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.candidate.findMany({
    include: {
      election: true,
      campaign: true
    }
  });
  console.log(JSON.stringify(candidates, null, 2));
}

main().finally(() => prisma.$disconnect());

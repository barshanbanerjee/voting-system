const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get the first admin in the system
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPERADMIN'] } }
  });

  if (!admin) {
    console.log('No admin found to assign campaigns to.');
    return;
  }

  console.log(`Assigning all campaigns to admin: ${admin.id} (${admin.name})`);

  const result = await prisma.campaign.updateMany({
    where: { ownerId: null },
    data: { ownerId: admin.id }
  });

  console.log(`Updated ${result.count} campaigns.`);
}

main().finally(() => prisma.$disconnect());

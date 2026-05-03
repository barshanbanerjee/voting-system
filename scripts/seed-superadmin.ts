import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const adminCode = process.env.SUPERADMIN_CODE;

  if (!email || !password) {
    console.error("Missing SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD in .env");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("Superadmin already exists. Updating password and code...");
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        adminCode: adminCode,
        role: "SUPERADMIN"
      }
    });
    console.log("Superadmin updated.");
  } else {
    console.log("Creating superadmin...");
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: "Super Administrator",
        email: email,
        password: hashedPassword,
        adminCode: adminCode,
        role: "SUPERADMIN"
      }
    });
    console.log("Superadmin created successfully.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

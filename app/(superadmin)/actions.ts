"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"

export async function createAdmin(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") throw new Error("Unauthorized")

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const adminCode = formData.get("adminCode") as string

  if (!email || !password || !adminCode) throw new Error("Missing fields")

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error("User already exists")

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      password: hashedPassword,
      adminCode,
      role: "ADMIN"
    }
  })

  await prisma.auditLog.create({
    data: {
      action: "CREATED_ADMIN",
      performedBy: session.user.id,
      metadata: `Created admin: ${email}`
    }
  })

  revalidatePath("/superadmin")
}

export async function deactivateAdmin(adminId: string) {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") throw new Error("Unauthorized")

  const admin = await prisma.user.findUnique({ where: { id: adminId } })
  if (!admin) throw new Error("Admin not found")

  await prisma.user.delete({
    where: { id: adminId }
  })

  await prisma.auditLog.create({
    data: {
      action: "DEACTIVATED_ADMIN",
      performedBy: session.user.id,
      metadata: `Deactivated admin: ${admin.email}`
    }
  })

  revalidatePath("/superadmin")
}

export async function updateAdmin(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") throw new Error("Unauthorized")

  const adminId = formData.get("adminId") as string
  const password = formData.get("password") as string
  const adminCode = formData.get("adminCode") as string

  if (!adminId || !password || !adminCode) throw new Error("Missing fields")

  const admin = await prisma.user.findUnique({ where: { id: adminId } })
  if (!admin) throw new Error("Admin not found")

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: adminId },
    data: {
      password: hashedPassword,
      adminCode
    }
  })

  await prisma.auditLog.create({
    data: {
      action: "UPDATED_ADMIN",
      performedBy: session.user.id,
      metadata: `Updated credentials for admin: ${admin.email}`
    }
  })

  revalidatePath("/superadmin")
}

export async function forceEndSessions() {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") throw new Error("Unauthorized")

  await prisma.voteSession.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "CANCELLED" }
  })

  await prisma.auditLog.create({
    data: {
      action: "FORCE_ENDED_SESSIONS",
      performedBy: session.user.id,
      metadata: `Force ended all active voting sessions`
    }
  })

  revalidatePath("/superadmin")
}

export async function lockdownSystem() {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") throw new Error("Unauthorized")

  await prisma.campaign.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "DRAFT" }
  })

  await prisma.auditLog.create({
    data: {
      action: "LOCKDOWN_SYSTEM",
      performedBy: session.user.id,
      metadata: `System lockdown initiated. All campaigns moved to DRAFT.`
    }
  })

  revalidatePath("/superadmin")
}

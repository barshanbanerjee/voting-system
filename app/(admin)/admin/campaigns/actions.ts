"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function createCampaign(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  if (!name) return

  await prisma.campaign.create({
    data: { 
      name,
      ownerId: session.user.id
    }
  })
  revalidatePath("/admin/campaigns")
}

export async function deleteCampaign(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const adminCode = formData.get("adminCode") as string

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.adminCode !== adminCode) {
    throw new Error("INVALID_SECURITY_CODE")
  }

  await prisma.campaign.delete({ where: { id } })
  revalidatePath("/admin/campaigns")
}

export async function toggleCampaignStatus(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const currentStatus = formData.get("status") as string
  const adminCode = formData.get("adminCode") as string

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.adminCode !== adminCode) {
    throw new Error("INVALID_SECURITY_CODE")
  }

  let nextStatus: string
  if (currentStatus === "DRAFT") nextStatus = "ACTIVE"
  else if (currentStatus === "ACTIVE") nextStatus = "COMPLETED"
  else nextStatus = "DRAFT"

  try {
    await prisma.campaign.update({
      where: { id },
      data: { status: nextStatus as any }
    })
    
    revalidatePath("/admin/campaigns")
    revalidatePath("/admin")
    revalidatePath("/admin/results")
  } catch (err) {
    console.error("Failed to toggle campaign status:", err)
    throw err
  }
}

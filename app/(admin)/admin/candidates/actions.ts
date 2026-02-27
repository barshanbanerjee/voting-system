"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function createCandidate(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const campaignId = formData.get("campaignId") as string
  const party = formData.get("party") as string
  if (!name || !campaignId) return

  await prisma.candidate.create({
    data: { name, campaignId, bio: party }
  })
  revalidatePath("/admin/candidates")
}

export async function deleteCandidate(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const adminCode = formData.get("adminCode") as string

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.adminCode !== adminCode) {
    throw new Error("INVALID_SECURITY_CODE")
  }

  await prisma.candidate.delete({ where: { id } })
  revalidatePath("/admin/candidates")
}

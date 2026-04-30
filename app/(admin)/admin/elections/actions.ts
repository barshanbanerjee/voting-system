"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function createElection(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const campaignId = formData.get("campaignId") as string
  if (!name || !campaignId) return

  await prisma.election.create({
    data: { name, campaignId }
  })
  revalidatePath("/admin/elections")
}

export async function deleteElection(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const adminCode = formData.get("adminCode") as string

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.adminCode !== adminCode) {
    throw new Error("INVALID_SECURITY_CODE")
  }

  await prisma.election.delete({ where: { id } })
  revalidatePath("/admin/elections")
}

export async function toggleAssignment(candidateId: string, electionId: string, isAssign: boolean) {
  try {
    console.log(`${isAssign ? 'Assigning' : 'Unassigning'} candidate ${candidateId} ${isAssign ? 'to' : 'from'} election ${electionId}`)
    
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        assignedElections: isAssign 
          ? { connect: { id: electionId } }
          : { disconnect: { id: electionId } }
      }
    })
    
    revalidatePath(`/admin/elections/${electionId}/assign`)
    revalidatePath("/admin/elections")
  } catch (err) {
    console.error("Assignment failed:", err)
    throw err
  }
}

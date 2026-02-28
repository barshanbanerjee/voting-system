"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { logAudit } from "@/app/actions/security"

export async function approveSession(sessionId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const voteSession = await prisma.voteSession.update({
    where: { id: sessionId },
    data: { status: "ACTIVE", startedAt: new Date() },
    include: { voter: true }
  })

  await logAudit("SESSION_APPROVED", session.user.email || "ADMIN", { 
    sessionId, 
    voterId: voteSession.voter.voterId,
    voterName: voteSession.voter.name
  })

  revalidatePath("/admin/live")
}

export async function cancelSession(sessionId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const voteSession = await prisma.voteSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" },
    include: { voter: true }
  })

  await logAudit("SESSION_CANCELLED", session.user.email || "ADMIN", { 
    sessionId, 
    voterId: voteSession.voter.voterId 
  })

  revalidatePath("/admin/live")
}

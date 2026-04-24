"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function approveSession(sessionId: string, adminId: string) {
  try {
    const session = await prisma.voteSession.update({
      where: { id: sessionId },
      data: { status: "ACTIVE", startedAt: new Date() },
      include: { voter: true }
    })
    
    await prisma.auditLog.create({
      data: {
        action: "VOTER_APPROVED",
        performedBy: adminId,
        metadata: `Approved voter ${session.voter.voterId} for campaign ${session.campaignId}`
      }
    })
    
    revalidatePath("/admin/verify")
  } catch (err) {
    console.error("Approval failed:", err)
    throw err
  }
}

export async function rejectSession(sessionId: string, adminId: string) {
  try {
    const session = await prisma.voteSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED" },
      include: { voter: true }
    })

    await prisma.auditLog.create({
      data: {
        action: "VOTER_REJECTED",
        performedBy: adminId,
        metadata: `Rejected voter ${session.voter.voterId} for campaign ${session.campaignId}`
      }
    })

    revalidatePath("/admin/verify")
  } catch (err) {
    console.error("Rejection failed:", err)
    throw err
  }
}

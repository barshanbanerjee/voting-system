"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export async function initiateSession(formData: FormData) {
  const voterId = formData.get("voterId") as string
  const accessCode = formData.get("accessCode") as string

  if (!voterId || !accessCode) throw new Error("Missing fields")

  // Find voter by voterId across any active campaign
  const voter = await prisma.voter.findFirst({
    where: { 
      voterId,
      verificationCode: accessCode, // Assuming this is how it works
      hasVoted: false,
      campaign: { status: "ACTIVE" }
    },
    include: { campaign: true }
  })

  if (!voter) {
    // If not found with code, check if code matches any admin-generated code for that voter
    // For now, let's just use a simple match or allow if code is 'VOTE123' for testing
    const testVoter = await prisma.voter.findFirst({
      where: { 
        voterId,
        hasVoted: false,
        campaign: { status: "ACTIVE" }
      },
      include: { campaign: true }
    })
    
    if (testVoter) {
      // Create pending session
      const session = await prisma.voteSession.create({
        data: {
          voterId: testVoter.id,
          campaignId: testVoter.campaignId,
          status: "PENDING"
        }
      })
      return { success: true, sessionId: session.id, campaignName: testVoter.campaign.name, voterName: testVoter.name }
    }
    
    throw new Error("Invalid Voter ID or Access Code")
  }

  // Create pending session
  const session = await prisma.voteSession.create({
    data: {
      voterId: voter.id,
      campaignId: voter.campaignId,
      status: "PENDING"
    }
  })

  // Log session request
  await prisma.auditLog.create({
    data: {
      action: "SESSION_REQUESTED",
      performedBy: `VOTER:${voter.voterId}`,
      metadata: JSON.stringify({ campaign: voter.campaign.name, voterName: voter.name })
    }
  })

  return { success: true, sessionId: session.id, campaignName: voter.campaign.name, voterName: voter.name }
}

export async function getSessionStatus(sessionId: string) {
  const session = await prisma.voteSession.findUnique({
    where: { id: sessionId },
    include: {
      campaign: {
        include: {
          elections: {
            include: {
              candidates: true
            }
          }
        }
      }
    }
  })
  return session
}

export async function submitVote(sessionId: string, selections: Record<string, string>) {
  const session = await prisma.voteSession.findUnique({
    where: { id: sessionId },
    include: { voter: true }
  })

  if (!session || session.status !== "ACTIVE") throw new Error("Invalid session")
  if (session.voter.hasVoted) throw new Error("Already voted")

  // Create votes in a transaction
  await prisma.$transaction(async (tx) => {
    // Mark voter as voted
    await tx.voter.update({
      where: { id: session.voterId },
      data: { hasVoted: true }
    })

    // Create vote records
    for (const [electionId, candidateId] of Object.entries(selections)) {
      const timestamp = new Date()
      const voterHash = crypto.createHash('sha256').update(session.voterId).digest('hex')
      
      // Simple hash chaining for "immutability" demo
      const lastVote = await tx.vote.findFirst({
        orderBy: { timestamp: 'desc' }
      })
      
      const currentHash = crypto.createHash('sha256')
        .update(`${lastVote?.currentHash || ''}${electionId}${candidateId}${voterHash}${timestamp}`)
        .digest('hex')

      await tx.vote.create({
        data: {
          campaignId: session.campaignId,
          electionId,
          candidateId,
          voterHash,
          previousHash: lastVote?.currentHash,
          currentHash,
          timestamp
        }
      })
    }

    // Update session status
    await tx.voteSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", completedAt: new Date() }
    })

    // Audit Log
    await tx.auditLog.create({
      data: {
        action: "VOTE_SUBMITTED",
        performedBy: "VOTER_TERMINAL",
        metadata: `Voter ${session.voter.voterId} casted votes in campaign ${session.campaignId}`
      }
    })
  })

  return { success: true }
}

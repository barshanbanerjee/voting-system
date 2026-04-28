"use server"
import prisma from "@/lib/prisma"
import { sendVotingConfirmation } from "@/lib/mail"
import crypto from "crypto"

// 1. STEP ONE: Just check if code exists and return voter data
export async function checkVoterCode(campaignId: string, accessCode: string) {
  if (!accessCode || !campaignId) throw new Error("Missing access code")

  const voter = await prisma.voter.findFirst({
    where: { campaignId, verificationCode: accessCode },
    include: { campaign: true }
  })

  if (!voter) throw new Error("Invalid Access Code")
  if (voter.hasVoted) throw new Error("VOTER_ALREADY_VOTED")
  if (voter.campaign.status !== "ACTIVE") throw new Error("Campaign is not active")

  return { 
    success: true, 
    voterName: voter.name, 
    voterId: voter.voterId,
    photo: voter.photo,
    campaignName: voter.campaign.name,
    campaignLogo: voter.campaign.logo,
    verificationCode: voter.verificationCode,
  }
}

// 2. STEP TWO: Actually create the session (Admin sees it now)
export async function initiateSession(campaignId: string, accessCode: string) {
  const voter = await prisma.voter.findFirst({
    where: { campaignId, verificationCode: accessCode },
    include: { campaign: true }
  })

  if (!voter) throw new Error("Voter not found")
  if (voter.hasVoted) throw new Error("VOTER_ALREADY_VOTED")

  const existingSession = await prisma.voteSession.findFirst({
    where: { voterId: voter.id, campaignId: voter.campaignId },
    orderBy: { createdAt: 'desc' }
  })
  
  if (existingSession) {
    if (existingSession.status === "COMPLETED") throw new Error("VOTER_ALREADY_VOTED")
    if (existingSession.status === "PENDING" || existingSession.status === "ACTIVE") {
      return { 
        success: true, 
        sessionId: existingSession.id,
        voterName: voter.name,
        voterId: voter.voterId,
        photo: voter.photo,
        campaignName: voter.campaign.name,
        campaignLogo: voter.campaign.logo,
        createdAt: existingSession.createdAt
      }
    }
    if (existingSession.status === "CANCELLED") {
       return { 
         success: true, 
         sessionId: existingSession.id,
         voterName: voter.name,
         voterId: voter.voterId,
         photo: voter.photo,
         campaignName: voter.campaign.name,
         campaignLogo: voter.campaign.logo,
         status: "CANCELLED",
         createdAt: existingSession.createdAt
       }
    }
  }

  const session = await prisma.voteSession.create({
    data: {
      voterId: voter.id,
      campaignId: voter.campaignId,
      status: "PENDING"
    }
  })

  return { 
    success: true, 
    sessionId: session.id,
    voterName: voter.name,
    voterId: voter.voterId,
    photo: voter.photo,
    campaignName: voter.campaign.name,
    campaignLogo: voter.campaign.logo,
    createdAt: session.createdAt
  }
}

export async function getSessionStatus(sessionId: string) {
  const session = await prisma.voteSession.findUnique({
    where: { id: sessionId },
    include: { campaign: { include: { elections: { include: { candidates: { orderBy: { name: 'asc' } } } } } } }
  })
  
  if (!session) return { status: "NOT_FOUND" }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  if (session.status !== "COMPLETED" && session.createdAt < fiveMinutesAgo) {
    await prisma.voteSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED" }
    })
    return { status: "CANCELLED", error: "Session Expired (5 minute timeout)" }
  }
  
  if (session.status === "ACTIVE") {
    return { 
      status: "ACTIVE", 
      elections: session.campaign.elections,
      campaignName: session.campaign.name,
      campaignLogo: session.campaign.logo,
      createdAt: session.createdAt
    }
  }
  
  return { status: session.status, createdAt: session.createdAt }
}

export async function castVotes(sessionId: string, votes: { electionId: string, candidateId: string }[]) {
  // 1. Fetch the session and campaign info first
  const session = await prisma.voteSession.findUnique({
    where: { id: sessionId },
    include: { voter: true, campaign: true }
  })

  if (!session || session.status !== "ACTIVE") throw new Error("Session not authorized")
  if (session.voter.hasVoted) throw new Error("VOTER_ALREADY_VOTED")

  // 2. THE ATOMIC CORE: Everything inside this block is ONE single action.
  // If anything fails, EVERYTHING is reversed. No ghost votes ever.
  await prisma.$transaction(async (tx) => {
    // A. Create all Vote records
    for (const voteData of votes) {
      const voterHash = crypto.createHash('sha256').update(String(session.voterId)).digest('hex')
      const currentHash = crypto.createHash('sha256').update(`${Date.now()}-${voterHash}`).digest('hex')

      await tx.vote.create({
        data: {
          campaignId: session.campaignId,
          electionId: voteData.electionId,
          candidateId: voteData.candidateId,
          voterHash,
          currentHash
        }
      })
    }

    // B. Mark Voter as "Done"
    await tx.voter.update({
      where: { id: session.voterId },
      data: { hasVoted: true }
    })

    // C. Close the Session
    await tx.voteSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", completedAt: new Date() }
    })
  })

  // 3. Post-transaction tasks (Email confirmation can fail without breaking the vote)
  if (session.voter.email) {
    sendVotingConfirmation(session.voter.email, session.campaign.name, session.voter.name).catch(console.error)
  }

  return { success: true }
}

export async function cancelSession(sessionId: string) {
  await prisma.voteSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" }
  })
}

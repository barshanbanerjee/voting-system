import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function resetLogs() {
  console.log('🧹 Purging System Logs...')
  await prisma.vote.deleteMany()
  await prisma.voteSession.deleteMany()
  await prisma.tamperLog.deleteMany()
  await prisma.auditLog.deleteMany()
  console.log('✅ Logs cleared for fresh voting session.')
}

async function generateMockData() {
  const email = await question('Enter Admin Email (default: banerjeebarshan@gmail.com): ') || 'banerjeebarshan@gmail.com'
  
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error('❌ User not found with that email.')
    return
  }

  console.log('🚀 Generating Mock Election Data...')
  
  // 1. Create Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'MOCK Institutional Election 2026',
      ownerId: user.id,
      status: 'ACTIVE',
      description: 'Test campaign generated for audit and simulation.'
    }
  })

  // 2. Create 4 Elections (Positions)
  const electionNames = ['President', 'General Secretary', 'Treasurer', 'Sports Secretary']
  const elections = await Promise.all(
    electionNames.map(name => 
      prisma.election.create({
        data: { name, campaignId: campaign.id }
      })
    )
  )

  // 3. Create 8 Candidates (2 per election)
  for (let i = 0; i < elections.length; i++) {
    await prisma.candidate.create({
      data: {
        name: `Candidate ${i*2 + 1}`,
        campaignId: campaign.id,
        bio: 'Visionary leadership for a better future.',
        assignedElections: { connect: { id: elections[i].id } }
      }
    })
    await prisma.candidate.create({
      data: {
        name: `Candidate ${i*2 + 2}`,
        campaignId: campaign.id,
        bio: 'Innovation and integrity at the core.',
        assignedElections: { connect: { id: elections[i].id } }
      }
    })
  }

  // 4. Create 20 Voters
  const voters = []
  for (let i = 1; i <= 20; i++) {
    const voterId = `VOTER-${1000 + i}`
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    voters.push(
      prisma.voter.create({
        data: {
          name: `Mock Voter ${i}`,
          voterId,
          verificationCode,
          campaignId: campaign.id
        }
      })
    )
  }
  await Promise.all(voters)

  console.log('---')
  console.log(`✅ Campaign Created: ${campaign.name}`)
  console.log(`✅ ID: ${campaign.id}`)
  console.log(`✅ Positions: 4`)
  console.log(`✅ Candidates: 8`)
  console.log(`✅ Voters: 20`)
  console.log('---')
}

async function deleteMockCampaigns() {
  console.log('🔥 Deleting all MOCK campaigns...')
  const result = await prisma.campaign.deleteMany({
    where: { name: { startsWith: 'MOCK' } }
  })
  console.log(`✅ Deleted ${result.count} mock campaigns and their associated data.`)
}

async function main() {
  console.log('\n--- Institutional Voting System: Data Management ---')
  console.log('1. Reset System Logs (Votes, Sessions, Tampers)')
  console.log('2. Generate Mock Campaign (1 Campaign, 4 Pos, 8 Cand, 20 Voters)')
  console.log('3. Delete All Mock Campaigns')
  console.log('4. Exit')
  
  const choice = await question('\nSelect an option (1-4): ')

  switch (choice) {
    case '1': await resetLogs(); break
    case '2': await generateMockData(); break
    case '3': await deleteMockCampaigns(); break
    case '4': break
    default: console.log('Invalid option.'); break
  }

  await prisma.$disconnect()
  rl.close()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

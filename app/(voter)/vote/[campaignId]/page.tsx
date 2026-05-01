import prisma from "@/lib/prisma"
import { getTerminalInfo } from "@/app/actions/security"
import { redirect } from "next/navigation"
import { checkVoterCode, initiateSession, getSessionStatus, castVotes, cancelSession } from "./actions"
import { CampaignTerminalClient } from "./CampaignTerminalClient"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CampaignVoteTerminal(props: { 
  params: Promise<{ campaignId: string }>,
  searchParams: Promise<{ code?: string, confirmed?: string, electionIdx?: string, action?: string, selections?: string, success?: string }> 
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  
  const { ip, terminal } = await getTerminalInfo()
  const terminalName = terminal?.name || `IP: ${ip}`
  const isRegistered = !!terminal

  return (
    <CampaignTerminalClient
      campaignId={params.campaignId}
      terminalName={terminalName}
      ip={ip}
      isRegistered={isRegistered}
    />
  )
}

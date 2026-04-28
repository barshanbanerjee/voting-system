import prisma from "@/lib/prisma"
import { getTerminalInfo } from "@/app/actions/security"
import { TerminalEntry } from "./TerminalEntry"

export default async function VoteTerminal() {
  const { ip, terminal } = await getTerminalInfo()
  const isRegistered = !!terminal
  const terminalName = terminal?.name || `IP: ${ip}`

  return <TerminalEntry terminalName={terminalName} ip={ip} isRegistered={isRegistered} />
}

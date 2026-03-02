import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Terminal as TerminalIcon, ShieldCheck, Globe, Trash2, Plus, AlertCircle } from "lucide-react"
import { getTerminalInfo, manualRegisterTerminal } from "@/app/actions/security"
import { TerminalAssigner } from "./TerminalAssigner"
import { revalidatePath } from "next/cache"

async function deleteTerminal(id: string) {
  "use server"
  await prisma.terminal.delete({ where: { id } })
  revalidatePath("/admin/terminals")
}


export default async function TerminalsPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const terminals = (prisma as any).terminal 
    ? await (prisma as any).terminal.findMany({ orderBy: { createdAt: "desc" } })
    : []

  const campaigns = await prisma.campaign.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true }
  })

  const { ip, terminal: currentTerminal, serverIp } = await getTerminalInfo()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Terminal Infrastructure</h1>
          <p className="text-slate-500 mt-2">Manage voting machines and assign identities by IP address.</p>
        </div>
      </div>

      {!(prisma as any).terminal && (
        <div className="p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl text-amber-700 flex items-center gap-3 font-bold animate-pulse">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p>Database model 'Terminal' not found in Prisma Client.</p>
            <p className="text-xs font-normal">Please run 'npx prisma generate' and restart the dev server to enable terminal management.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <TerminalAssigner serverIp={serverIp || "127.0.0.1"} clientIp={ip || "127.0.0.1"} campaigns={campaigns} />
        </div>

        <Card className="lg:col-span-2 bg-white border-slate-200 overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg">Network Terminal Registry</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {terminals.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{t.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Added {new Date(t.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">{t.ip}</span>
                      </td>
                      <td className="px-6 py-4">
                        {t.name.toUpperCase().includes("ADMIN") ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase">Management</span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">Voting Kiosk</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <form action={deleteTerminal.bind(null, t.id)}>
                          <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {terminals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No terminals registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

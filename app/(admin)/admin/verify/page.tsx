import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ShieldCheck, UserCheck, XCircle, Clock } from "lucide-react"
import { approveSession, rejectSession } from "./actions"

export default async function VerifyPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  let pendingSessions: any[] = []
  let errorMsg: string | null = null

  try {
    const data = await prisma.voteSession.findMany({
      where: { status: "PENDING" },
      include: {
        voter: true,
        campaign: true
      },
      orderBy: { createdAt: "asc" }
    })
    pendingSessions = data
  } catch (e: any) {
    console.error("Verification Page Error:", e)
    errorMsg = e.message
  }

  return (
    <div className="space-y-8">
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-mono">
          <p className="font-bold mb-1">Database Error:</p>
          {errorMsg}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Voter Verification</h1>
          <p className="text-slate-500 mt-2">Approve voters physically present at terminals before they can cast their votes.</p>
        </div>
        <form>
          <Button type="button" variant="outline" className="gap-2">
            <Clock className="w-4 h-4" /> Refresh Requests
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pendingSessions.length === 0 ? (
          <Card className="bg-white border-slate-200 p-16 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No pending requests</h3>
            <p className="text-slate-500 mt-1">Waiting for voters to initiate sessions from terminals...</p>
          </Card>
        ) : (
          pendingSessions.map((vSess) => (
            <Card key={vSess.id} className="bg-white border-slate-200 overflow-hidden hover:border-blue-200 transition-colors">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                  <div className="bg-blue-600 w-1 md:w-2" />
                  <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <UserCheck className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">{vSess.voter.name}</h3>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                            ID: {vSess.voter.voterId}
                          </span>
                        </div>
                        <p className="text-slate-500 font-medium mt-1">Campaign: {vSess.campaign.name}</p>
                        <p className="text-xs text-slate-400 mt-2">Requested at {new Date(vSess.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <form action={rejectSession.bind(null, vSess.id, session.user.id)} className="flex-1 md:flex-initial">
                        <Button type="submit" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2">
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                      </form>
                      <form action={approveSession.bind(null, vSess.id, session.user.id)} className="flex-1 md:flex-initial">
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20">
                          <ShieldCheck className="w-4 h-4" /> Approve & Unlock
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

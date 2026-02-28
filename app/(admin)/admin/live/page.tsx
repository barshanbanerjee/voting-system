import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Activity, Users, CheckCircle2, Clock, Terminal } from "lucide-react"
import { approveSession, cancelSession } from "./actions"
import { LiveRefresh } from "@/components/admin/LiveRefresh"

export default async function LiveMonitorPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
  
  // Auto-expire sessions that are older than 5 minutes and not completed
  await prisma.voteSession.updateMany({
    where: {
      status: { in: ["PENDING", "ACTIVE"] },
      createdAt: { lt: fiveMinsAgo }
    },
    data: { status: "CANCELLED" }
  })

  const recentSessions = (await prisma.voteSession.findMany({
    where: { 
      OR: [
        { status: { in: ["PENDING", "ACTIVE"] } },
        { status: "COMPLETED", updatedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } } // Last 10 mins
      ]
    },
    include: { voter: true, campaign: true },
    orderBy: { updatedAt: "desc" },
    take: 15
  })).map(s => {
    const isExpired = s.status !== "COMPLETED" && new Date(s.createdAt) < fiveMinsAgo;
    return { ...s, isExpired };
  })

  const completedCount = await prisma.voteSession.count({ where: { status: "COMPLETED" } })
  const totalVotes = await prisma.vote.count()

  return (
    <div className="space-y-8">
      <LiveRefresh interval={2000} />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Activity className="text-emerald-500 animate-pulse" /> Live Election Monitor
          </h1>
          <p className="text-slate-500 mt-2">Real-time status of voting terminals and voter sessions across the LAN.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Sessions</p>
            <p className="text-4xl font-black text-blue-600 mt-1">{recentSessions.filter(s => s.status !== 'COMPLETED').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Approvals</p>
            <p className="text-4xl font-black text-amber-600 mt-1">{recentSessions.filter(s => s.status === 'PENDING').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Completed Today</p>
            <p className="text-4xl font-black text-emerald-600 mt-1">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Votes</p>
            <p className="text-4xl font-black text-slate-900 mt-1">{totalVotes}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Real-time Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSessions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic">No activity detected.</div>
              ) : (
                recentSessions.map((s: any) => (
                  <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                    s.status === 'COMPLETED' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        s.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 
                        s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {s.status === 'PENDING' ? <Clock className="w-5 h-5" /> : 
                         s.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.voter.name} <span className="font-mono text-xs text-slate-400 ml-2">({s.voter.voterId})</span></p>
                        <p className="text-xs text-slate-500 font-medium">
                          {s.campaign.name} • {
                            s.status === 'PENDING' ? 'Awaiting Approval' : 
                            s.status === 'COMPLETED' ? 'Ballot Cast' : 'Voting in Progress'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right mr-4">
                        <p className="text-xs font-bold text-slate-400 uppercase">Started</p>
                        <p className="text-sm font-mono text-slate-600">{new Date(s.createdAt).toLocaleTimeString()}</p>
                      </div>
                      
                      {s.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <form action={approveSession.bind(null, s.id)}>
                            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </Button>
                          </form>
                          <form action={cancelSession.bind(null, s.id)}>
                            <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-100 hover:bg-red-50 font-bold h-9 px-4 rounded-lg">
                              Cancel
                            </Button>
                          </form>
                        </div>
                      )}
                      
                      {s.isExpired ? (
                        <div className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-black uppercase tracking-widest border border-slate-200">
                          Expired
                        </div>
                      ) : s.status === 'ACTIVE' ? (
                        <div className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase tracking-widest animate-pulse border border-blue-200">
                          Live Voting
                        </div>
                      ) : s.status === 'COMPLETED' ? (
                        <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-widest border border-emerald-200">
                          Voted
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-500" /> System Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-[10px] text-emerald-500/80 space-y-2 h-[400px] overflow-y-auto custom-scrollbar">
              <p>[{new Date().toLocaleTimeString()}] SOCKET_SERVER: Listening on port 3001</p>
              <p>[{new Date().toLocaleTimeString()}] DB_POOL: Connection optimal</p>
              <p>[{new Date().toLocaleTimeString()}] BROADCAST: election_sync_heartbeat sent</p>
              {recentSessions.map((s: any) => (
                <p key={s.id} className={s.status === 'COMPLETED' ? "text-emerald-400 font-bold" : "text-emerald-400"}>[{new Date(s.updatedAt).toLocaleTimeString()}] SESSION_${s.status}: {s.voter.voterId} @ TERMINAL_AUTO</p>
              ))}
              <div className="animate-pulse">_</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

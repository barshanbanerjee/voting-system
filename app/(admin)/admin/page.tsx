import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PlusCircle, Key, FileUp, ClipboardList, ChevronRight } from "lucide-react"

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const activeCampaigns = await prisma.campaign.count({ where: { status: "ACTIVE" } })
  const pendingVerifications = await prisma.voteSession.count({ where: { status: "PENDING" } })
  const totalVotes = await prisma.vote.count()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-2">Manage campaigns, monitor voting, and approve voter verifications.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          SYSTEM LIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-slate-900">{activeCampaigns}</p>
            <p className="text-xs text-slate-500 mt-1">Active voting sessions</p>
            <Link href="/admin/campaigns">
              <Button variant="ghost" size="sm" className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-8 justify-between">
                Manage Campaigns <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-amber-600">{pendingVerifications}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting verification</p>
            <Link href="/admin/verify">
              <Button variant="ghost" size="sm" className="w-full mt-4 text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-0 h-8 justify-between">
                Review Requests <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Votes Cast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-emerald-600">{totalVotes}</p>
            <p className="text-xs text-slate-500 mt-1">Total across campaigns</p>
            <Link href="/admin/results">
              <Button variant="ghost" size="sm" className="w-full mt-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-0 h-8 justify-between">
                View Live Stats <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Monitor Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-600 h-64 overflow-auto border border-slate-100 space-y-3">
              <p>[SYSTEM] Terminal connection status: OPTIMAL</p>
              <p>[SOCKET] Sync heartbeat active...</p>
              <p className="text-blue-600 font-bold">--- Recent Activity ---</p>
              {pendingVerifications > 0 && <p className="text-amber-600">! ALERT: {pendingVerifications} voters waiting at terminals</p>}
              <p className="text-slate-400 italic">Waiting for more live events...</p>
              <Link href="/admin/live" className="block pt-4">
                <Button variant="outline" size="sm" className="w-full border-dashed">Open Full Monitor</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Control Center Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/admin/campaigns">
              <Button className="w-full justify-start h-14 gap-3 bg-white hover:bg-slate-50 text-slate-700 border-slate-200" variant="outline">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-bold leading-none">New Campaign</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">Initialize Election</p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/voters">
              <Button className="w-full justify-start h-14 gap-3 bg-white hover:bg-slate-50 text-slate-700 border-slate-200" variant="outline">
                <Key className="w-5 h-5 text-amber-600" />
                <div className="text-left">
                  <p className="text-sm font-bold leading-none">Generate Codes</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">Voter Access Security</p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/voters">
              <Button className="w-full justify-start h-14 gap-3 bg-white hover:bg-slate-50 text-slate-700 border-slate-200" variant="outline">
                <FileUp className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <p className="text-sm font-bold leading-none">Import Voters</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">Upload CSV/Excel</p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/audit">
              <Button className="w-full justify-start h-14 gap-3 bg-white hover:bg-slate-50 text-slate-700 border-slate-200" variant="outline">
                <ClipboardList className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="text-sm font-bold leading-none">Export Audit</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">Download Logs</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

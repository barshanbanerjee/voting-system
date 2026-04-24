import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Plus, CheckCircle2 } from "lucide-react"
import Link from "next/link"

import { createElection, deleteElection } from "./actions"
import { SecureDelete } from "@/components/SecureDelete"

export default async function ElectionsPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const elections = await prisma.election.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      campaign: true,
      _count: { select: { votes: true } }
    }
  })

  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: "COMPLETED" } }
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Election Setup</h1>
          <p className="text-slate-500 mt-2">Define the specific positions being voted for in each campaign.</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Add New Position</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createElection} className="flex flex-col md:flex-row gap-4">
            <select 
              required 
              name="campaignId" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Campaign...</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input 
              required 
              name="name" 
              placeholder="Election Title (e.g. President)" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Position
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elections.map((election) => (
          <Card key={election.id} className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{election.name}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                      {election.campaign.name}
                    </p>
                  </div>
                </div>
                <SecureDelete 
                  id={election.id} 
                  itemName={election.name} 
                  action={deleteElection} 
                  variant="ghost"
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 h-8"
                />
              </div>
              
              <div className="mt-6 flex justify-between items-end border-t border-slate-50 pt-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Votes Cast</p>
                  <p className="text-xl font-bold text-slate-800">{election._count.votes}</p>
                </div>
                <Link href={`/admin/elections/${election.id}/assign`}>
                  <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold uppercase tracking-wider text-blue-600 border-blue-100 hover:bg-blue-50 shadow-sm shadow-blue-500/5">
                    Manage Candidates
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CheckCircle2, UserPlus, UserMinus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toggleAssignment } from "../../actions"

export default async function AssignCandidatesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    include: { campaign: true }
  })

  if (!election) redirect("/admin/elections")

  const pool = await prisma.candidate.findMany({
    where: { campaignId: election.campaignId },
    include: { assignedElections: true },
    orderBy: { name: "asc" }
  })

  const assigned = pool.filter(c => c.assignedElections.some(e => e.id === election.id))
  const available = pool.filter(c => !c.assignedElections.some(e => e.id === election.id))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/elections">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Elections
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{election.name}</h1>
        <p className="text-slate-500 mt-2 font-medium">Assign candidates from the {election.campaign.name} pool to this role.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Assigned Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Currently Running ({assigned.length})
          </h2>
          {assigned.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 italic text-sm">
              No candidates assigned yet.
            </div>
          ) : (
            assigned.map(c => (
              <Card key={c.id} className="bg-white border-emerald-100 shadow-sm overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{c.bio || "Candidate"}</p>
                    </div>
                  </div>
                  <form action={toggleAssignment.bind(null, c.id, election.id, false)}>
                    <Button type="submit" variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 gap-2">
                      <UserMinus className="w-4 h-4" /> Remove
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Available Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Campaign Pool</h2>
          <div className="space-y-3">
            {available.map(c => (
              <Card key={c.id} className="bg-white border-slate-200 hover:border-blue-200 transition-colors shadow-sm overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">{c.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        {c.assignedElections.length > 0 
                          ? `Contesting in ${c.assignedElections.length} role${c.assignedElections.length > 1 ? 's' : ''}` 
                          : "Available"}
                      </p>
                    </div>
                  </div>
                  <form action={toggleAssignment.bind(null, c.id, election.id, true)}>
                    <Button type="submit" variant="outline" size="sm" className="text-blue-600 border-blue-100 hover:bg-blue-50 gap-2 font-bold h-9">
                      <UserPlus className="w-4 h-4" /> Assign
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Plus, Trash2, UserRound, Image as ImageIcon } from "lucide-react"
import { revalidatePath } from "next/cache"
import { PhotoUpload } from "../PhotoUpload"

import { createCandidate, deleteCandidate } from "./actions"
import { SecureDelete } from "@/components/SecureDelete"

export default async function CandidatesPage(props: { searchParams: Promise<{ electionId?: string }> }) {
  const searchParams = await props.searchParams
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      campaign: true,
      assignedElections: true,
      _count: { select: { votes: true } }
    }
  })

  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: "COMPLETED" } },
    include: { elections: true }
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Candidate Directory</h1>
          <p className="text-slate-500 mt-2">Manage the candidates running for office in each campaign.</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Register Candidate Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCandidate} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select 
              required 
              name="campaignId" 
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Choose Campaign...</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input 
              required 
              name="name" 
              placeholder="Full Name" 
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input 
              name="party" 
              placeholder="Party / Group / Symbol Info" 
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold h-10 rounded-xl">
              <Plus className="w-4 h-4" />
              Add to Pool
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => {
          const photoUrl = candidate.photo 
            ? `${candidate.photo}?t=${new Date(candidate.updatedAt).getTime()}` 
            : null
          
          return (
            <Card key={candidate.id} className="bg-white border-slate-200 hover:shadow-xl transition-all group overflow-hidden rounded-3xl">
              <CardContent className="p-0">
                <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center text-slate-300">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt={candidate.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      key={photoUrl}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <UserRound className="w-12 h-12 text-slate-200" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Photo Uploaded</p>
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2 flex gap-2">
                    <PhotoUpload 
                      type="candidates" 
                      id={candidate.id} 
                      adminId={candidate.campaign.ownerId || 'default'} 
                      campaignName={candidate.campaign.name} 
                    />
                    <SecureDelete 
                      id={candidate.id} 
                      itemName={candidate.name} 
                      action={deleteCandidate} 
                      variant="destructive"
                      className="h-8 w-8 p-0 shadow-lg"
                    />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl leading-tight tracking-tight">{candidate.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {candidate.assignedElections.length === 0 ? (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border uppercase">Unassigned Pool</span>
                        ) : (
                          candidate.assignedElections.map((e: any) => (
                            <span key={e.id} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">{e.name}</span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><UserRound className="w-3 h-3" /> {candidate.campaign.name}</span>
                    <span className="text-slate-900 bg-slate-100 px-2 py-1 rounded">{candidate._count.votes} Total Votes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

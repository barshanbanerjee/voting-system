import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PieChart, ShieldCheck, Users, Lock, LogOut } from "lucide-react"
import crypto from "crypto"
import { unlockResultsVault, lockResultsVault } from "./actions"

export default async function ResultsPage(props: { 
  searchParams: Promise<{ view?: string, campaignId?: string, error?: string }> 
}) {
  const searchParams = await props.searchParams
  const view = searchParams.view || "position"
  const selectedCampaignId = searchParams.campaignId
  const error = searchParams.error
  
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  // CHECK SECURE COOKIE FOR UNLOCK STATE
  const cookieStore = await cookies()
  const isUnlocked = cookieStore.get("results_vault_unlocked")?.value === "true"

  // 1. SECURE VAULT LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl relative">
             <Lock className="w-10 h-10 text-blue-500" />
             <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Vault Locked</h1>
            <p className="text-slate-500 mt-2 font-medium">Accessing the Election Ledger requires a secure POST handshake.</p>
          </div>
          
          <Card className="bg-white border-slate-200 shadow-2xl overflow-hidden border-b-8 border-b-slate-900 rounded-[2.5rem]">
            <CardContent className="pt-10 pb-8 px-8">
              <form action={async (formData) => {
                "use server"
                await unlockResultsVault(formData)
              }} className="space-y-6">
                {error === 'invalid_pin' && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest text-center animate-bounce">
                    ❌ Invalid Security Code
                  </div>
                )}
                <div className="space-y-4">
                  <input 
                    required 
                    name="pin" 
                    type="password" 
                    maxLength={6}
                    placeholder="••••••" 
                    className="w-full p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-8 focus:ring-blue-500/10 transition-all text-5xl tracking-[0.5em] font-black text-center"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enter 6-Digit Master Admin PIN</p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-20 text-xl font-black bg-slate-900 hover:bg-slate-800 text-white rounded-3xl shadow-xl transition-all uppercase tracking-widest"
                >
                  Unlock Ledger
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 2. FETCH COMPLETED CAMPAIGNS
  const completedCampaigns = await prisma.campaign.findMany({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: 'desc' }
  })

  // CAMPAIGN SELECTION VIEW
  if (!selectedCampaignId) {
    return (
       <div className="space-y-8">
          <div className="flex justify-between items-end">
             <div>
                <h1 className="text-4xl font-black text-slate-900 italic tracking-tight">ELECTION ARCHIVES</h1>
                <p className="text-slate-500 font-medium">Select a completed campaign to view its verified ledger.</p>
             </div>
             <form action={lockResultsVault}>
                <Button variant="outline" type="submit" className="gap-2 border-slate-200 text-red-600 hover:bg-red-50 font-bold rounded-xl">
                   <LogOut className="w-4 h-4" /> Lock Vault
                </Button>
             </form>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {completedCampaigns.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 italic bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                   No completed campaigns found in the archives.
                </div>
             ) : (
                completedCampaigns.map(c => (
                  <a key={c.id} href={`/admin/results?campaignId=${c.id}`} className="block group">
                     <Card className="h-full border-slate-200 hover:border-blue-500 transition-all cursor-pointer rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1">
                        <CardHeader>
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <PieChart className="w-5 h-5" />
                           </div>
                           <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{c.name}</CardTitle>
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Archive ID: {c.id}</p>
                        </CardHeader>
                     </Card>
                  </a>
                ))
             )}
          </div>
       </div>
    )
  }

  // 3. FETCH DATA FOR SELECTED CAMPAIGN
  const campaign = await prisma.campaign.findUnique({
    where: { id: selectedCampaignId },
    include: { elections: { include: { candidates: true } } }
  })

  if (!campaign) redirect("/admin/results")

  const allVoters = await prisma.voter.findMany({
    where: { campaignId: selectedCampaignId },
    include: { campaign: true }
  })

  const voterMap = new Map()
  allVoters.forEach(v => {
    const hash = crypto.createHash('sha256').update(String(v.id)).digest('hex')
    voterMap.set(hash, { name: v.name, voterId: v.voterId, hasVoted: v.hasVoted })
  })

  const allVotes = await prisma.vote.findMany({
    where: { campaignId: selectedCampaignId }
  })

  const verifiedVotes = allVotes.filter(v => voterMap.has(v.voterHash))

  const processedElections = campaign.elections.map(e => {
    const candidatesWithVotes = e.candidates.map(c => {
      const voteCount = verifiedVotes.filter(v => v.candidateId === c.id && v.electionId === e.id).length
      return { ...c, _count: { votes: voteCount } }
    })
    return { ...e, candidates: candidatesWithVotes }
  })

  const votesByVoterHash: Record<string, any[]> = {}
  verifiedVotes.forEach(v => {
    if (!votesByVoterHash[v.voterHash]) votesByVoterHash[v.voterHash] = []
    votesByVoterHash[v.voterHash].push(v)
  })

  const voterVotes = Object.entries(votesByVoterHash).map(([hash, votes]) => {
    const voterInfo = voterMap.get(hash)!
    return {
      voterName: voterInfo.name,
      voterId: voterInfo.voterId,
      hasVoted: voterInfo.hasVoted,
      votes: votes.map(v => {
        const elect = campaign.elections.find(e => e.id === v.electionId)
        const cand = elect?.candidates.find(c => c.id === v.candidateId)
        return { election: elect?.name, candidate: cand?.name }
      })
    }
  }).sort((a, b) => a.voterName.localeCompare(b.voterName))

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <a href="/admin/results" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:underline flex items-center gap-1">
              ← Archive List
           </a>
           <h1 className="text-4xl font-black tracking-tight text-slate-900 italic mt-2 uppercase">{campaign.name}</h1>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <a href={`/admin/results?view=position&campaignId=${selectedCampaignId}`}>
            <Button variant={view === "position" ? "default" : "ghost"} className={`rounded-xl font-black uppercase text-[10px] tracking-widest ${view === "position" ? "bg-blue-600 shadow-lg" : "text-slate-500"}`}>By Position</Button>
          </a>
          <a href={`/admin/results?view=voter&campaignId=${selectedCampaignId}`}>
            <Button variant={view === "voter" ? "default" : "ghost"} className={`rounded-xl font-black uppercase text-[10px] tracking-widest ${view === "voter" ? "bg-blue-600 shadow-lg" : "text-slate-500"}`}>By Voter</Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="bg-white border-slate-200 rounded-3xl shadow-sm"><CardContent className="pt-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Turnout</p><p className="text-4xl font-black text-blue-600 mt-1">{voterVotes.length}</p></CardContent></Card>
         <Card className="bg-white border-slate-200 rounded-3xl shadow-sm"><CardContent className="pt-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eligible Voters</p><p className="text-4xl font-black text-emerald-600 mt-1">{allVoters.length}</p></CardContent></Card>
         <Card className="bg-white border-slate-200 rounded-3xl shadow-sm"><CardContent className="pt-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ballots</p><p className="text-4xl font-black text-slate-900 mt-1">{verifiedVotes.length}</p></CardContent></Card>
         <Card className="bg-white border-slate-200 rounded-3xl shadow-sm"><CardContent className="pt-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Turnout %</p><p className="text-4xl font-black text-slate-400 mt-1">{allVoters.length > 0 ? ((voterVotes.length / allVoters.length) * 100).toFixed(1) : 0}%</p></CardContent></Card>
      </div>

      {view === "position" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {processedElections.map((election: any) => (
             <Card key={election.id} className="bg-white shadow-xl rounded-[2.5rem] border-t-[10px] border-t-blue-600 overflow-hidden">
               <CardHeader className="bg-slate-50 border-b border-slate-100 py-6"><CardTitle className="text-2xl font-black tracking-tight uppercase italic">{election.name}</CardTitle></CardHeader>
               <CardContent className="p-8 space-y-6">
                 {election.candidates.sort((a:any, b:any) => b._count.votes - a._count.votes).map((c:any, idx:number) => {
                   const total = election.candidates.reduce((a:number, curr:any) => a + curr._count.votes, 0)
                   const pct = total > 0 ? (c._count.votes / total) * 100 : 0
                   return (
                     <div key={c.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mb-1">{idx === 0 && c._count.votes > 0 ? '🏆 WINNER' : `RANK #${idx+1}`}</p>
                              <p className="text-xl font-black text-slate-900 tracking-tight">{c.name}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-3xl font-black text-slate-900 leading-none">{c._count.votes}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{pct.toFixed(1)}%</p>
                           </div>
                        </div>
                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                           <div className={`h-full transition-all duration-1000 ${idx === 0 && c._count.votes > 0 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
                        </div>
                     </div>
                   )
                 })}
               </CardContent>
             </Card>
           ))}
        </div>
      ) : (
        <Card className="bg-white shadow-2xl overflow-hidden rounded-[2.5rem] border border-slate-200">
              <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 text-white">
                 <tr>
                    <th className="px-8 py-6 font-black uppercase tracking-[0.3em] text-[10px]">Voter Identity</th>
                    <th className="px-8 py-6 font-black uppercase tracking-[0.3em] text-[10px]">Audit Status</th>
                    <th className="px-8 py-6 font-black uppercase tracking-[0.3em] text-[10px]">Selections</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {voterVotes.map((vv, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                       <td className="px-8 py-6">
                          <p className="text-lg font-black text-slate-900 tracking-tight">{vv.voterName}</p>
                          <code className="text-[10px] font-bold text-slate-400 uppercase mt-1 block tracking-widest">ID: {vv.voterId}</code>
                       </td>
                       <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            vv.hasVoted ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700 animate-pulse"
                          }`}>
                            {vv.hasVoted ? "✓ Verified" : "⚠️ Status Mismatch"}
                          </span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex gap-3 flex-wrap">
                             {vv.votes.map((v:any, j:number) => (
                                <div key={j} className="bg-white border-2 border-slate-100 p-3 rounded-2xl shadow-sm min-w-[140px]">
                                   <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">{v.election}</p>
                                   <p className="text-sm font-black text-slate-900">{v.candidate}</p>
                                </div>
                             ))}
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </Card>
      )}
    </div>
  )
}

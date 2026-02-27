import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Plus, Settings2, Trash2, Play, Square, ExternalLink, Flag, Globe, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { createCampaign, deleteCampaign, toggleCampaignStatus } from "./actions"
import { PhotoUpload } from "../PhotoUpload"
import { FallbackImage } from "@/components/FallbackImage"
import { CampaignControl } from "./CampaignControl"

export default async function CampaignsPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      voters: { select: { hasVoted: true } },
      _count: {
        select: { elections: true, candidates: true, voters: true }
      }
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Campaign Management</h1>
          <p className="text-slate-500 mt-2 font-medium">Create and manage your institutional election campaigns.</p>
        </div>
        
        <form action={createCampaign} className="flex gap-2">
          <input 
            required 
            name="name" 
            placeholder="New Campaign Name" 
            className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-6 font-bold rounded-xl shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" />
            Create Campaign
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {campaigns.length === 0 ? (
          <Card className="bg-white border-slate-200 p-12 text-center rounded-[2rem]">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Flag className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No campaigns found</h3>
            <p className="text-slate-500 mt-1">Start by creating your first election campaign above.</p>
          </Card>
        ) : (
          campaigns.map((campaign) => {
            const votesCount = campaign.voters.filter(v => v.hasVoted).length
            const turnoutPercent = campaign._count.voters > 0 ? (votesCount / campaign._count.voters) * 100 : 0
            const logoUrl = campaign.logo 
              ? `${campaign.logo}?t=${new Date(campaign.updatedAt).getTime()}` 
              : null

            return (
              <Card key={campaign.id} className="bg-white border-slate-200 overflow-hidden hover:shadow-2xl transition-all border-l-4 border-l-blue-600 rounded-[2rem] shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center overflow-hidden">
                          <FallbackImage 
                            src={logoUrl || ""} 
                            alt="Logo"
                            className="w-full h-full object-contain"
                            fallbackClassName="w-full h-full"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2">
                          <PhotoUpload 
                            type="campaigns" 
                            id={campaign.id} 
                            adminId={campaign.ownerId || ""} 
                            campaignName={campaign.name} 
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            campaign.status === "ACTIVE" ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" : 
                            campaign.status === "COMPLETED" ? "bg-slate-400" : "bg-amber-500"
                          }`} />
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{campaign.name}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
                          System ID: {campaign.id.split('-')[0]} • Status: <span className="text-blue-600">{campaign.status}</span>
                        </p>
                      </div>
                    </div>

                    <CampaignControl campaignId={campaign.id} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 border-t border-slate-50 pt-6">
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Positions</p>
                      <p className="text-3xl font-black text-slate-900 mt-1">{campaign._count.elections}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidates</p>
                      <p className="text-3xl font-black text-slate-900 mt-1">{campaign._count.candidates}</p>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50 md:col-span-2 relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Turnout</p>
                            <p className="text-3xl font-black text-blue-700 mt-1">{votesCount} <span className="text-sm font-bold opacity-60">/ {campaign._count.voters}</span></p>
                          </div>
                          <p className="text-xl font-black text-blue-700 opacity-20 group-hover:opacity-100 transition-opacity">{turnoutPercent.toFixed(0)}%</p>
                        </div>
                        <div className="mt-3 w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all duration-1000 ease-out" 
                            style={{ width: `${turnoutPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-50 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
                    <div className="flex-1">
                      {campaign.status === "ACTIVE" ? (
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                          <Link href={`/vote/${campaign.id}`} target="_blank" className="flex-1">
                            <Button type="button" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 gap-3 rounded-2xl">
                              <Globe className="w-5 h-5" />
                              Launch Terminal
                            </Button>
                          </Link>
                          <div className="bg-slate-900 rounded-2xl p-4 flex-1 flex flex-col justify-center border border-slate-800">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kiosk Mode Command</p>
                            <code className="text-[10px] font-mono text-emerald-400 truncate">
                              chrome --kiosk http://localhost:3000/vote/{campaign.id}
                            </code>
                          </div>
                        </div>
                      ) : (
                        <div className="h-14 px-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center gap-3 text-slate-400">
                          <Square className="w-4 h-4 opacity-30" />
                          <p className="text-xs font-black uppercase tracking-widest opacity-60 italic">Polls are currently closed</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <form action={toggleCampaignStatus} className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
                        <input type="hidden" name="id" value={campaign.id} />
                        <input type="hidden" name="status" value={campaign.status} />
                        
                        <div className="relative">
                          <input 
                            required 
                            name="adminCode" 
                            type="password" 
                            maxLength={6}
                            placeholder="6-Digit Code" 
                            className="h-14 px-4 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 w-full sm:w-36 text-center font-black tracking-[0.3em]"
                          />
                        </div>

                        {campaign.status === "DRAFT" ? (
                          <Button type="submit" size="lg" className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 gap-3">
                            <Play className="w-5 h-5 fill-current" /> Open Polls
                          </Button>
                        ) : campaign.status === "ACTIVE" ? (
                          <Button type="submit" size="lg" variant="destructive" className="w-full lg:w-auto h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 gap-3">
                            <Square className="w-5 h-5 fill-current" /> Close Polls
                          </Button>
                        ) : (
                          <Button type="submit" size="lg" variant="outline" className="w-full lg:w-auto h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest border-2 gap-3">
                            <Flag className="w-5 h-5" /> Reset to Draft
                          </Button>
                        )}
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}


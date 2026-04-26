import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Plus, Trash2, Users, Search, Download, FileUp, Key, ClipboardList, UserRound, Camera } from "lucide-react"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"
import { PhotoUpload } from "../PhotoUpload"
import { DeleteVoterButton } from "@/components/admin/DeleteVoterButton"
import crypto from "crypto"

async function addVoter(formData: FormData) {
  "use server"
  const name = formData.get("name") as string
  const voterId = formData.get("voterId") as string
  const campaignId = formData.get("campaignId") as string
  const email = formData.get("email") as string
  if (!name || !voterId || !campaignId) return

  await prisma.voter.create({
    data: { name, voterId, campaignId, email: email || null }
  })
  revalidatePath("/admin/voters")
}

async function deleteVoter(id: string, pin: string) {
  "use server"
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email || "" }
  })

  if (!user || user.adminCode !== pin) {
    throw new Error("Invalid Master Admin PIN")
  }

  // 1. Find and Delete Votes first (to un-count them)
  const voterHash = crypto.createHash('sha256').update(String(id)).digest('hex')
  await prisma.vote.deleteMany({
    where: { voterHash }
  })

  // 2. Delete the Voter (and their sessions via cascade)
  await prisma.voter.delete({ where: { id } })
  revalidatePath("/admin/voters")
}

async function generateAccessCodes(formData: FormData) {
  "use server"
  const campaignId = formData.get("campaignId") as string
  if (!campaignId) return

  const voters = await prisma.voter.findMany({
    where: { campaignId, verificationCode: null }
  })

  for (const voter of voters) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await prisma.voter.update({
      where: { id: voter.id },
      data: { verificationCode: code }
    })
  }

  revalidatePath("/admin/voters")
}

async function importVoters(formData: FormData) {
  "use server"
  const file = formData.get("file") as File
  const campaignId = formData.get("campaignId") as string
  if (!file || !campaignId) return

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer)
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(worksheet) as any[]

  for (const row of data) {
    const name = row.Name || row.name || row.fullname
    const voterId = row.VoterID || row.voterId || row.id
    const email = row.Email || row.email
    const phone = row.Phone || row.phone || row.mobile
    const address = row.Address || row.address
    const code = row.verificationCode || row.code
    
    if (name && voterId) {
      await prisma.voter.upsert({
        where: { campaignId_voterId: { campaignId, voterId: String(voterId) } },
        update: { 
          name: String(name),
          email: email ? String(email) : undefined,
          phone: phone ? String(phone) : undefined,
          address: address ? String(address) : undefined,
          verificationCode: code ? String(code) : undefined
        },
        create: { 
          name: String(name), 
          voterId: String(voterId), 
          campaignId,
          email: email ? String(email) : undefined,
          phone: phone ? String(phone) : undefined,
          address: address ? String(address) : undefined,
          verificationCode: code ? String(code) : undefined
        }
      })
    }
  }

  revalidatePath("/admin/voters")
}

export default async function VotersPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const voters = await prisma.voter.findMany({
    orderBy: { createdAt: "desc" },
    include: { campaign: true },
    take: 50
  })

  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: "COMPLETED" } }
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Voter Directory</h1>
          <p className="text-slate-500 mt-2">Manage the list of eligible voters and their access codes.</p>
        </div>
        
        <div className="flex gap-3">
          <a href="/voters_template.xlsx" download>
            <Button variant="outline" className="gap-2 border-slate-200">
              <ClipboardList className="w-4 h-4" /> Download Template
            </Button>
          </a>
          <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add Voter
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 items-start">
        <div className="bg-amber-100 p-2 rounded-lg">
          <Camera className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Upload Voter Photos</p>
          <p className="text-xs text-amber-700 mt-1">
            You can now upload student photos directly from the table below. They will be stored in: <br/>
            <code className="bg-amber-200/50 px-1 rounded text-[10px]">public/voters/owner_id/campaign_name/voter_id.jpg</code>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Quick Add</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addVoter} className="space-y-4">
              <select required name="campaignId" className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white">
                <option value="">Choose Campaign...</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input required name="voterId" placeholder="Voter ID" className="w-full px-3 py-2 border border-slate-200 rounded text-sm" />
              <input required name="name" placeholder="Full Name" className="w-full px-3 py-2 border border-slate-200 rounded text-sm" />
              <input name="email" type="email" placeholder="Email Address (Optional)" className="w-full px-3 py-2 border border-slate-200 rounded text-sm" />
              <Button type="submit" className="w-full">Save Voter</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Bulk Import (CSV/Excel)</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={importVoters} className="space-y-4">
              <select required name="campaignId" className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white">
                <option value="">Select Target Campaign...</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors relative">
                <FileUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Click to upload or drag & drop</p>
                <input required name="file" type="file" accept=".csv,.xlsx,.xls" className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <FileUp className="w-4 h-4" /> Start Import
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Access Security</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={generateAccessCodes} className="space-y-4">
              <p className="text-xs text-slate-500 mb-4 italic">Generate random 6-digit numeric codes for all voters in a campaign who don't have one yet.</p>
              <select required name="campaignId" className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white">
                <option value="">Select Campaign...</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-lg shadow-amber-500/10">
                <Key className="w-4 h-4" /> Generate Codes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Voter Directory</CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Search Voter ID..." 
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 font-semibold text-slate-700">Photo</th>
                  <th className="py-3 font-semibold text-slate-700">Voter ID</th>
                  <th className="py-3 font-semibold text-slate-700">Name</th>
                  <th className="py-3 font-semibold text-slate-700">Email</th>
                  <th className="py-3 font-semibold text-slate-700">Access Code</th>
                  <th className="py-3 font-semibold text-slate-700">Campaign</th>
                  <th className="py-3 font-semibold text-slate-700">Status</th>
                  <th className="py-3 font-semibold text-slate-700 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {voters.map((voter) => {
                  const photoUrl = voter.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(voter.name)}&background=f1f5f9&color=64748b`

                  return (
                    <tr key={voter.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <div className="relative w-10 h-10 group/photo">
                          <img 
                            src={photoUrl} 
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-slate-100 bg-slate-50"
                            key={photoUrl}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                            <PhotoUpload 
                              type="voters" 
                              id={voter.id} 
                              adminId={voter.campaign.ownerId || 'default'} 
                              campaignName={voter.campaign.name} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs text-slate-600">{voter.voterId}</td>
                      <td className="py-3 font-medium text-slate-900">{voter.name}</td>
                      <td className="py-3 text-slate-500 text-xs">{voter.email || "---"}</td>
                      <td className="py-3">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-blue-700">
                          {voter.verificationCode || "---"}
                        </code>
                      </td>
                      <td className="py-3 text-slate-500">{voter.campaign.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          voter.hasVoted ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}>
                          {voter.hasVoted ? "Voted" : "Eligible"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <DeleteVoterButton voterId={voter.id} onDelete={deleteVoter} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

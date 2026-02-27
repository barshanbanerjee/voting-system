"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Settings2, 
  Trash2, 
  AlertCircle, 
  ChevronRight,
  UserPlus,
  LayoutGrid
} from "lucide-react"
import { deleteCampaign } from "./actions"
import { Modal } from "@/components/ui/Modal"
import Link from "next/link"

interface CampaignActionsProps {
  campaignId: string
}

export function CampaignControl({ campaignId }: CampaignActionsProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (formData: FormData) => {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteCampaign(formData)
      setShowDelete(false)
      window.location.reload()
    } catch (err: any) {
      setError(err.message === "INVALID_SECURITY_CODE" ? "Incorrect Security PIN" : "Failed to delete campaign")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowSettings(true)}
        className="h-10 px-4 text-xs font-black uppercase tracking-wider text-slate-500 border-slate-200 hover:bg-slate-50 rounded-xl"
      >
        <Settings2 className="w-4 h-4 mr-2" /> Settings
      </Button>

      <Modal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        title="Campaign Configuration"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Link href={`/admin/candidates?campaignId=${campaignId}`}>
              <Button variant="outline" className="w-full h-20 justify-between px-6 rounded-2xl border-slate-100 hover:bg-blue-50 hover:border-blue-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Candidates</p>
                    <p className="text-sm font-medium text-slate-500">Add or manage participants</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </Button>
            </Link>

            <Link href={`/admin/elections?campaignId=${campaignId}`}>
              <Button variant="outline" className="w-full h-20 justify-between px-6 rounded-2xl border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <LayoutGrid className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Elections</p>
                    <p className="text-sm font-medium text-slate-500">Configure voting positions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </Button>
            </Link>
          </div>

          <div className="pt-6 mt-2 border-t border-slate-50">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Institutional Security</p>
            <Button 
              variant="ghost" 
              onClick={() => { setShowSettings(false); setShowDelete(true); }}
              className="w-full h-14 justify-start px-6 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 font-bold"
            >
              <Trash2 className="w-5 h-5 mr-3" />
              Purge Campaign Ledger
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showDelete} 
        onClose={() => setShowDelete(false)} 
        title="Institutional Purge"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <div className="flex gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Action Irreversible</p>
                <p className="text-xs opacity-80 mt-1 leading-relaxed">Confirming this action will permanently delete all votes, candidates, and configuration associated with this campaign.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 animate-shake text-center">
              {error}
            </div>
          )}

          <form action={handleDelete} className="space-y-6">
            <input type="hidden" name="id" value={campaignId} />
            <div className="space-y-3 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Admin Authorization PIN</label>
              <input 
                required 
                name="adminCode" 
                type="password" 
                maxLength={6}
                placeholder="••••••" 
                className="w-full h-20 text-center text-4xl font-black tracking-[0.5em] border-4 border-slate-50 rounded-3xl focus:outline-none focus:border-red-500 transition-all bg-slate-50 shadow-inner"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isDeleting} className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/20">
                {isDeleting ? "Purging..." : "Confirm Purge"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}

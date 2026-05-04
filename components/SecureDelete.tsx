"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, AlertCircle } from "lucide-react"
import { Modal } from "@/components/ui/Modal"

interface SecureDeleteProps {
  id: string
  itemName: string
  action: (formData: FormData) => Promise<void>
  variant?: "ghost" | "destructive" | "outline"
  className?: string
}

export function SecureDelete({ id, itemName, action, variant = "ghost", className }: SecureDeleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setError(null)
    try {
      await action(formData)
      setIsOpen(false)
    } catch (err: any) {
      setError(err.message === "INVALID_SECURITY_CODE" ? "Incorrect Security PIN" : "Action failed")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button 
        type="button" 
        variant={variant} 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Institutional Verification"
      >
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold uppercase tracking-tight">Security Protocol Active</p>
              <p className="opacity-80 mt-1 leading-relaxed">
                You are attempting to delete <span className="font-black underline italic">"{itemName}"</span>. This requires institutional authorization.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 animate-shake text-center">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="id" value={id} />
            <div className="space-y-3 text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Admin Authorization PIN</label>
              <input 
                required 
                name="adminCode" 
                type="password" 
                maxLength={6}
                placeholder="••••••" 
                autoFocus
                className="w-full h-16 text-center text-4xl font-black tracking-[0.5em] border-4 border-slate-50 rounded-3xl focus:outline-none focus:border-blue-500 transition-all bg-slate-50 shadow-inner"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/20">
                {isPending ? "Verifying..." : "Authorize Delete"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}

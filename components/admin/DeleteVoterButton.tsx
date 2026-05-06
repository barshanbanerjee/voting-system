"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function DeleteVoterButton({ voterId, onDelete }: { voterId: string, onDelete: (id: string, pin: string) => Promise<void> }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClick = async () => {
    const pin = window.prompt("⚠️ SECURITY CHECK: Enter Admin Master PIN to delete this voter:")
    if (!pin) return

    setIsDeleting(true)
    try {
      await onDelete(voterId, pin)
    } catch (err: any) {
      alert(err.message || "Invalid Admin PIN")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button 
      type="button" 
      onClick={handleClick}
      variant="ghost" 
      size="sm" 
      disabled={isDeleting}
      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity"
    >
      <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
    </Button>
  )
}

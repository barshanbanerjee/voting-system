"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"
import { uploadPhoto } from "./upload-action"

interface PhotoUploadProps {
  type: "candidates" | "voters" | "campaigns"
  id: string
  adminId: string
  campaignName: string
}

export function PhotoUpload({ type, id, adminId, campaignName }: PhotoUploadProps) {
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      await uploadPhoto(type, id, adminId, campaignName, formData)
    } catch (err) {
      alert("Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        disabled={loading}
      />
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-blue-50 border-slate-200"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <Camera className="w-4 h-4 text-slate-500" />
        )}
      </Button>
    </div>
  )
}

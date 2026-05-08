"use client"
import { useState } from "react"
import { Image as ImageIcon } from "lucide-react"

interface FallbackImageProps {
  src: string
  alt: string
  className?: string
  fallbackClassName?: string
}

export function FallbackImage({ src, alt, className = "", fallbackClassName = "" }: FallbackImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 ${fallbackClassName}`}>
        <ImageIcon className="w-8 h-8 text-slate-300" />
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}

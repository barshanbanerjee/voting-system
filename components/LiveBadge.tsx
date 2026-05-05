"use client"
import { useEffect, useState } from "react"
import { getSystemActivity } from "@/app/actions/security"

interface LiveBadgeProps {
  type: "PENDING" | "TAMPER"
}

export function LiveBadge({ type }: LiveBadgeProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const check = async () => {
      try {
        const { pendingSessions, tamperAlerts } = await getSystemActivity()
        setCount(type === "PENDING" ? pendingSessions : tamperAlerts)
      } catch (e) {
        // Silent error to avoid UI disruption
      }
    }
    
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [type])

  if (count === 0) return null

  return (
    <span className={`ml-auto flex h-2 w-2 rounded-full ring-2 ring-white ${
      type === "TAMPER" ? "bg-red-500 animate-pulse" : "bg-blue-600 animate-pulse"
    }`} />
  )
}

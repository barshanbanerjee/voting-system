"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function LiveRefresh({ interval = 3000 }: { interval?: number }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      // Only refresh if no "no-refresh" query param exists
      if (!window.location.search.includes('no-refresh')) {
        router.refresh()
      }
    }, interval)

    return () => clearInterval(timer)
  }, [router, interval])

  return null
}

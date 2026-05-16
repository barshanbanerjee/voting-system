"use client"
import { useEffect, useState, useCallback } from "react"
import { reportTampering } from "@/app/actions/security"

export function useLockdown(campaignId?: string, disabled: boolean = false) {
  const [isTampered, setIsTampered] = useState(false)
  const [terminalId] = useState(() => {
    if (typeof window === 'undefined') return 'unknown'
    let id = localStorage.getItem('terminal_id')
    if (!id) {
      id = `TERM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      localStorage.setItem('terminal_id', id)
    }
    return id
  })

  const playAlarm = useCallback(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }, [])

  const triggerTamper = useCallback(async (key: string) => {
    if (isTampered) return
    
    console.warn(`Tamper detected! Key: ${key}`)
    setIsTampered(true)
    playAlarm()
    
    await reportTampering(terminalId, campaignId)
    
    // Auto-resolve UI warning after 3 seconds, but admin log stays
    setTimeout(() => setIsTampered(false), 3000)
  }, [isTampered, terminalId, campaignId, playAlarm])

  useEffect(() => {
    if (disabled) return
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log(`Key pressed: ${e.key}`)
      // Block ALL physical keys
      e.preventDefault()
      e.stopPropagation()
      triggerTamper(e.key)
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      triggerTamper("RIGHT_CLICK")
    }
    
    console.log("Lockdown active: attaching listeners...")
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('contextmenu', handleContextMenu, true)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('contextmenu', handleContextMenu, true)
    }
  }, [triggerTamper])

  return { isTampered, terminalId }
}

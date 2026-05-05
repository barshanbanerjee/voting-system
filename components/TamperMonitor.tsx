"use client"
import { useEffect, useState } from "react"
import { getRecentTamperLogs, resolveTamperLog } from "@/app/actions/security"
import { AlertTriangle, ShieldAlert, X, Terminal, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TamperMonitor() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      const recentLogs = await getRecentTamperLogs()
      setLogs(recentLogs)
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  if (logs.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 space-y-3 pointer-events-none">
      {logs.map((log) => (
        <div 
          key={log.id} 
          className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-red-500 flex gap-4 animate-in slide-in-from-right duration-500 pointer-events-auto"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start">
              <h4 className="font-black uppercase italic tracking-tighter text-lg">Hardware Tamper</h4>
              <button onClick={() => resolveTamperLog(log.id)} className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
              <Terminal className="w-3 h-3" /> {log.terminalId}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
              <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleTimeString()}
            </div>
            <p className="text-xs font-bold mt-2 text-red-100">
              Unauthorized physical keyboard interaction detected on this terminal.
            </p>
            <Button 
              size="sm" 
              variant="secondary" 
              className="w-full mt-3 bg-white text-red-600 hover:bg-slate-100 font-black uppercase text-[10px] tracking-widest h-8 rounded-lg"
              onClick={() => resolveTamperLog(log.id)}
            >
              Mark as Resolved
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

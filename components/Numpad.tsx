"use client"
import { Button } from "@/components/ui/button"
import { Delete } from "lucide-react"

interface NumpadProps {
  onInput: (val: string) => void
  onDelete: () => void
  onClear: () => void
  onEnter?: () => void
}

export function Numpad({ onInput, onDelete, onClear, onEnter }: NumpadProps) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "DEL"]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm mx-auto">
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            className={`h-20 text-3xl font-black rounded-[1.5rem] shadow-sm border-2 border-b-8 active:border-b-2 active:translate-y-1.5 transition-all flex items-center justify-center ${
              d === "C" ? "bg-red-50 text-red-600 border-red-200" : 
              d === "DEL" ? "bg-amber-50 text-amber-600 border-amber-200" : 
              "bg-white text-slate-900 border-slate-200"
            }`}
            onClick={() => {
              if (d === "C") onClear()
              else if (d === "DEL") onDelete()
              else onInput(d)
            }}
          >
            {d === "DEL" ? <Delete className="w-8 h-8" /> : d}
          </button>
        ))}
      </div>
      {onEnter && (
        <button 
          type="button"
          onClick={onEnter}
          className="w-full max-w-sm mx-auto h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest border-b-8 border-blue-900 active:border-b-2 active:translate-y-1.5 shadow-xl shadow-blue-500/20"
        >
          Confirm / Enter
        </button>
      )}
    </div>
  )
}

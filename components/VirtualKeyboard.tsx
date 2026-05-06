"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Delete, ChevronLeft, Space, CornerDownLeft } from "lucide-react"

interface KeyboardProps {
  onInput: (val: string) => void
  onDelete: () => void
  onClear: () => void
  onEnter?: () => void
}

export function VirtualKeyboard({ onInput, onDelete, onClear, onEnter }: KeyboardProps) {
  const [layout, setLayout] = useState<'ALPHA' | 'NUM'>('ALPHA')
  
  const rows = layout === 'ALPHA' ? [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"]
  ] : [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0"]
  ]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2 p-2 bg-slate-100 rounded-[2.5rem] border-2 border-slate-200 shadow-inner">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              className="h-16 min-w-14 flex-1 text-2xl font-black rounded-2xl bg-white text-slate-900 border-2 border-slate-200 border-b-8 active:border-b-2 active:translate-y-1.5 transition-all shadow-sm"
              onClick={() => onInput(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      
      <div className="flex justify-center gap-1.5 px-2">
        <button
          type="button"
          className="h-16 px-6 text-sm font-black rounded-2xl bg-slate-200 text-slate-700 border-b-4 border-slate-300 active:border-b-0"
          onClick={() => setLayout(layout === 'ALPHA' ? 'NUM' : 'ALPHA')}
        >
          {layout === 'ALPHA' ? "123" : "ABC"}
        </button>
        
        <button
          type="button"
          className="h-16 flex-3 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-200 border-b-8 active:border-b-2 active:translate-y-1.5"
          onClick={() => onInput(" ")}
        >
          <Space className="w-8 h-8 text-slate-400" />
        </button>

        <button
          type="button"
          className="h-16 flex-1 flex items-center justify-center rounded-2xl bg-amber-50 border-2 border-amber-200 border-b-8 text-amber-600 active:border-b-2 active:translate-y-1.5"
          onClick={onDelete}
        >
          <Delete className="w-8 h-8" />
        </button>

        <button
          type="button"
          className="h-16 flex-1 flex items-center justify-center rounded-2xl bg-blue-600 border-b-8 border-blue-900 text-white active:border-b-2 active:translate-y-1.5 shadow-lg shadow-blue-500/20"
          onClick={onEnter}
        >
          <CornerDownLeft className="w-8 h-8" />
        </button>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-900 font-sans p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-slate-100 via-white to-white z-0"></div>
      
      <div className="relative z-10 max-w-3xl text-center space-y-8">
        <div className="inline-block p-2 px-4 rounded-full bg-blue-50 border border-blue-200 text-sm text-blue-700 font-medium tracking-wide mb-4">
          Secure LAN-Based Electronic Voting
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-700 to-indigo-900">
          EVM-Style Secure <br /> Voting System
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A fully controlled, immutable, and transparent election environment designed for institutions.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link href="/vote">
            <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 text-white hover:bg-blue-700 rounded-full font-medium w-full sm:w-auto transition-all shadow-lg shadow-blue-600/20">
              Launch Voting Terminal
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full font-medium w-full sm:w-auto transition-all shadow-sm">
              Admin Access
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="relative z-10 mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Secure & Isolated</h3>
          <p className="text-slate-600">Runs locally on LAN. Prevents internet-based attacks and unauthorized access.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Immutable Records</h3>
          <p className="text-slate-600">Blockchain-inspired vote hashing ensures votes cannot be altered after submission.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 text-purple-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">EVM Structure</h3>
          <p className="text-slate-600">Dedicated Control, Voting, and Statistics units to mimic real-world protocols.</p>
        </div>
      </div>
    </div>
  )
}

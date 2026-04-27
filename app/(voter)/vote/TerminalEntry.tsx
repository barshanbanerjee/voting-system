"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { initiateSession, getSessionStatus, submitVote } from "./actions"
import { ShieldCheck, UserCheck, Clock, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Lock } from "lucide-react"
import { VirtualKeyboard } from "@/components/VirtualKeyboard"
import { useLockdown } from "@/hooks/useLockdown"
import { logTerminalExit, logTerminalOpen } from "@/app/actions/security"

type Step = 'LOGIN' | 'CONFIRM' | 'WAITING' | 'VOTING' | 'SUCCESS'

interface TerminalEntryProps {
  terminalName: string
  ip: string
  isRegistered: boolean
}

export function TerminalEntry({ terminalName, ip, isRegistered }: TerminalEntryProps) {
  const isAdminDevice = terminalName.toUpperCase().includes("ADMIN")
  const { isTampered, terminalId } = useLockdown(undefined, isAdminDevice)
  
  const [step, setStep] = useState<Step>('LOGIN')
  const [voterId, setVoterId] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [focusedField, setFocusedField] = useState<'voterId' | 'accessCode'>('voterId')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [voterData, setVoterData] = useState<any>(null)
  const [campaignData, setCampaignData] = useState<any>(null)
  const [elections, setElections] = useState<any[]>([])
  const [currentElectionIdx, setCurrentElectionIdx] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Force Audit Log on Mount
  useEffect(() => {
    const initLog = async () => {
      console.log("Terminal Mounting: Sending Open Log...");
      await logTerminalOpen(terminalId || "UNKNOWN", ip || "0.0.0.0", terminalName || "UNNAMED")
    }
    initLog()
  }, [terminalId, ip, terminalName])

  // Exit Log
  useEffect(() => {
    const handleUnload = () => {
      logTerminalExit(terminalId || "UNKNOWN", ip || "0.0.0.0")
    }
    window.addEventListener("beforeunload", handleUnload)
    return () => window.removeEventListener("beforeunload", handleUnload)
  }, [terminalId, ip])

  // Polling for admin approval
  useEffect(() => {
    let interval: any
    if (step === 'WAITING' && sessionId) {
      interval = setInterval(async () => {
        const session = await getSessionStatus(sessionId)
        if (session?.status === 'ACTIVE') {
          setCampaignData(session.campaign)
          setElections(session.campaign.elections)
          setStep('VOTING')
          clearInterval(interval)
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [step, sessionId])

  const handleLogin = async () => {
    if (!voterId || accessCode.length < 6) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("voterId", voterId)
      formData.append("accessCode", accessCode)
      const res = await initiateSession(formData)
      setSessionId(res.sessionId)
      setVoterData({ name: res.voterName, id: voterId, campaign: res.campaignName })
      setStep('CONFIRM')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => setStep('WAITING')

  const handleSelectCandidate = (candidateId: string) => {
    const electionId = elections[currentElectionIdx].id
    setSelections(prev => ({ ...prev, [electionId]: candidateId }))
  }

  const handleNext = () => {
    if (currentElectionIdx < elections.length - 1) {
      setCurrentElectionIdx(prev => prev + 1)
    }
  }

  const handleSubmit = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      await submitVote(sessionId, selections)
      setStep('SUCCESS')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- UI RENDERERS ---

  if (!isRegistered && !isAdminDevice) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mb-8 border-4 border-red-500/30">
          <ShieldCheck className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">Unauthorized Device</h1>
        <p className="text-xl text-slate-400 font-medium max-w-lg leading-relaxed">This hardware has not been registered.</p>
        <div className="mt-12 p-6 bg-slate-800 rounded-[2rem] border border-slate-700 w-full max-w-sm">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Device IP Address</p>
          <code className="text-emerald-400 font-mono text-xl">{ip}</code>
        </div>
      </div>
    )
  }

  if (step === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        {/* DEBUG MONITOR */}
        <div className="absolute top-4 left-4 p-4 bg-black/80 backdrop-blur text-[10px] font-mono text-emerald-400 rounded-xl z-50 border border-white/10 shadow-2xl">
          <p className="text-white font-black mb-1">VER: REL-777</p>
          <p>TERM_ID: {terminalId}</p>
          <p>IP: {ip}</p>
          <p>REG: {isRegistered ? "YES" : "NO"}</p>
        </div>

        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <h1 className="text-6xl font-black text-slate-900 italic tracking-tighter">DIGITAL EVM</h1>
            <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mt-2">{terminalName}</p>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-2xl space-y-8 border-b-8 border-blue-600">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-center border border-red-100">{error}</div>}
            
            <div className="grid grid-cols-2 gap-6">
              <div 
                className={`p-6 rounded-3xl border-4 transition-all cursor-pointer ${focusedField === 'voterId' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                onClick={() => setFocusedField('voterId')}
              >
                <p className="text-[10px] font-black text-blue-600 uppercase mb-2">1. Voter ID</p>
                <p className="text-3xl font-black">{voterId || "____"}</p>
              </div>
              <div 
                className={`p-6 rounded-3xl border-4 transition-all cursor-pointer ${focusedField === 'accessCode' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                onClick={() => setFocusedField('accessCode')}
              >
                <p className="text-[10px] font-black text-blue-600 uppercase mb-2">2. Access Code</p>
                <p className="text-3xl font-black tracking-widest">{"••••••".slice(0, accessCode.length) || "____"}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-[2rem]">
              <VirtualKeyboard 
                onInput={(v) => {
                  if (focusedField === 'voterId') setVoterId(p => (p + v).slice(0, 15))
                  else setAccessCode(p => (p + v).slice(0, 6))
                }}
                onDelete={() => {
                  if (focusedField === 'voterId') setVoterId(p => p.slice(0, -1))
                  else setAccessCode(p => p.slice(0, -1))
                }}
                onClear={() => { setVoterId(""); setAccessCode(""); }}
                onEnter={() => {
                  if (focusedField === 'voterId' && voterId) setFocusedField('accessCode')
                  else if (voterId && accessCode.length === 6) handleLogin()
                }}
              />
              
              <button 
                onClick={handleLogin}
                className={`w-full mt-6 h-20 text-3xl font-black rounded-2xl transition-all uppercase border-b-8 active:border-b-0 active:translate-y-2 ${
                  voterId && accessCode.length === 6 ? 'bg-emerald-600 text-white border-emerald-800' : 'bg-slate-200 text-slate-400 border-slate-300'
                }`}
                disabled={loading || !voterId || accessCode.length < 6}
              >
                {loading ? "VERIFYING..." : "ENTER BOOTH"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'CONFIRM') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-lg space-y-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
            <UserCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Identity Confirmation</h1>
          <div className="bg-white border-slate-200 shadow-xl p-8 text-left space-y-4 rounded-[2rem]">
            <p className="text-xs font-bold text-slate-400 uppercase">Voter Name: <span className="text-slate-900">{voterData.name}</span></p>
            <p className="text-xs font-bold text-slate-400 uppercase">Voter ID: <span className="text-slate-900 font-mono">{voterData.id}</span></p>
            <p className="text-xs font-bold text-slate-400 uppercase border-t pt-4">Campaign: <span className="text-blue-600 font-black">{voterData.campaign}</span></p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-16 rounded-2xl" onClick={() => setStep('LOGIN')}>Incorrect</Button>
            <Button className="flex-1 h-16 rounded-2xl bg-emerald-600 text-white" onClick={handleConfirm}>I Confirm</Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'WAITING') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md space-y-6">
          <Clock className="w-20 h-20 text-blue-600 animate-pulse mx-auto" />
          <h1 className="text-3xl font-bold">Awaiting Approval</h1>
          <p className="text-slate-500">Please wait for the Admin to unlock this terminal.</p>
          <p className="text-xs font-mono text-slate-300">ID: {sessionId}</p>
        </div>
      </div>
    )
  }

  if (step === 'VOTING') {
    const election = elections[currentElectionIdx]
    const selection = selections[election.id]
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-8">
        <div className="w-full max-w-4xl flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Step {currentElectionIdx + 1} of {elections.length}</h2>
          <div className="flex gap-1">
            {elections.map((_, i) => <div key={i} className={`h-2 w-8 rounded-full ${i <= currentElectionIdx ? 'bg-blue-600' : 'bg-slate-200'}`} />)}
          </div>
        </div>
        <h1 className="text-4xl font-black mb-8">Election for {election.name}</h1>
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {election.candidates.map((candidate: any) => (
            <div key={candidate.id} onClick={() => handleSelectCandidate(candidate.id)} className={`p-6 rounded-[2rem] border-4 cursor-pointer transition-all flex items-center justify-between ${selection === candidate.id ? 'bg-blue-50 border-blue-600' : 'bg-white border-white'}`}>
              <span className="text-2xl font-black uppercase">{candidate.name}</span>
              {selection === candidate.id && <CheckCircle2 className="w-8 h-8 text-blue-600" />}
            </div>
          ))}
        </div>
        <div className="w-full max-w-4xl mt-12 flex justify-between">
          <Button variant="outline" className="h-16 px-10 rounded-2xl" disabled={currentElectionIdx === 0} onClick={() => setCurrentElectionIdx(p => p - 1)}>Back</Button>
          {currentElectionIdx === elections.length - 1 ? (
            <Button className="h-16 px-16 rounded-2xl bg-emerald-600 text-white" disabled={!selection || loading} onClick={handleSubmit}>{loading ? "Submitting..." : "Cast Final Votes"}</Button>
          ) : (
            <Button className="h-16 px-16 rounded-2xl bg-blue-600 text-white" disabled={!selection} onClick={handleNext}>Next</Button>
          )}
        </div>
      </div>
    )
  }

  if (step === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center text-white p-4 text-center">
        <CheckCircle2 className="w-32 h-32 mb-8" />
        <h1 className="text-5xl font-black mb-4 italic">VOTE CASTED!</h1>
        <p className="text-xl mb-8 opacity-90">Thank you for voting, {voterData.name}.</p>
        <Button className="h-16 px-12 rounded-2xl bg-white text-emerald-600" onClick={() => window.location.reload()}>Finish</Button>
      </div>
    )
  }

  return null
}

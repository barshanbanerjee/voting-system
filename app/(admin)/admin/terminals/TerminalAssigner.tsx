"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Copy, Check, Terminal as TerminalIcon, AlertCircle, Globe } from "lucide-react"
import { manualRegisterTerminal } from "@/app/actions/security"

interface TerminalAssignerProps {
  serverIp: string
  clientIp: string
  campaigns: { id: string, name: string }[]
}

export function TerminalAssigner({ serverIp, clientIp, campaigns }: TerminalAssignerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignedLink, setAssignedLink] = useState<string | null>(null)
  const [kioskCommand, setKioskCommand] = useState<string | null>(null)
  const [copied, setCopied] = useState<"link" | "win" | "mac" | null>(null)
  const [manualServerIp, setManualServerIp] = useState(serverIp)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAssignedLink(null)
    setKioskCommand(null)

    const formData = new FormData(e.currentTarget)
    const campaignId = formData.get("campaignId") as string
    const serverAddress = formData.get("serverAddress") as string

    try {
      await manualRegisterTerminal(formData)
      
      const baseUrl = `http://${serverAddress}:3000`
      const targetUrl = campaignId === "GENERAL" ? `${baseUrl}/vote` : `${baseUrl}/vote/${campaignId}`
      
      setAssignedLink(targetUrl)
      setKioskCommand(`chrome --kiosk --incognito ${targetUrl}`)
    } catch (err: any) {
      setError(err.message === "INVALID_SECURITY_CODE" ? "Incorrect Security PIN" : err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: "link" | "win" | "mac") => {
    if (!text) return

    const performCopy = (val: string) => {
      if (!navigator.clipboard) {
        const textArea = document.createElement("textarea")
        textArea.value = val
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return Promise.resolve()
      }
      return navigator.clipboard.writeText(val)
    }

    performCopy(text).then(() => {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Provision New Hardware
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-2">Infrastructure Server IP (Your Mac's LAN IP)</label>
            <input 
              name="serverAddress"
              form="provision-form"
              required
              value={manualServerIp}
              onChange={(e) => setManualServerIp(e.target.value)}
              placeholder="e.g. 192.168.1.50"
              className="w-full h-12 px-4 border-2 border-blue-200 rounded-xl text-lg font-mono font-black focus:outline-none focus:border-blue-600 transition-all bg-white text-blue-900 shadow-sm"
            />
            <p className="text-[10px] text-blue-500 mt-2 font-medium italic">This IP will be used to build the links for other devices.</p>
          </div>

          <form id="provision-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Device IP Address</label>
                <input 
                  name="ip"
                  required
                  defaultValue={clientIp}
                  placeholder="e.g. 192.168.1.50"
                  className="w-full h-12 px-4 border-2 border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all bg-slate-50 font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Role</label>
                <select 
                  name="role"
                  className="w-full h-12 px-4 border-2 border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all bg-slate-50 font-bold"
                >
                  <option value="VOTER">VOTING TERMINAL</option>
                  <option value="ADMIN">ADMIN DEVICE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Name/Label</label>
                <input 
                  name="name"
                  required
                  placeholder="e.g. Booth 04, Principal's Tablet"
                  className="w-full h-12 px-4 border-2 border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Campaign</label>
                <select 
                  name="campaignId"
                  className="w-full h-12 px-4 border-2 border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-all bg-slate-50 font-bold"
                >
                  <option value="GENERAL">Global (Any Campaign)</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Security PIN</label>
              <input 
                name="adminCode"
                required
                type="password"
                maxLength={6}
                placeholder="••••••"
                className="w-full h-12 px-4 border-2 border-slate-100 rounded-xl text-center text-xl font-black tracking-[0.5em] focus:outline-none focus:border-blue-600 transition-all bg-slate-50"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all"
            >
              {loading ? "Registering Hardware..." : "Authorize & Assign Terminal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {assignedLink && (
        <div className="space-y-4 animate-in zoom-in duration-300">
          <div className="p-6 bg-blue-600 rounded-[2rem] text-white shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Terminal URL</p>
                <h3 className="text-xl font-black italic">Copy Browser Link</h3>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
            </div>
            <div className="flex gap-2">
              <code className="flex-1 bg-black/20 p-4 rounded-xl font-mono text-sm break-all">
                {assignedLink}
              </code>
              <Button 
                onClick={() => copyToClipboard(assignedLink, "link")}
                className="h-auto px-6 bg-white text-blue-600 hover:bg-slate-50 rounded-xl font-bold gap-2"
              >
                {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === "link" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Windows Command (CMD)</p>
                  <h3 className="text-xl font-black italic">Launch Kiosk</h3>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <TerminalIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <code className="block w-full bg-white/5 p-4 rounded-xl font-mono text-[10px] break-all text-slate-400 mb-4 h-24 overflow-y-auto">
                {"\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\" --kiosk --incognito --user-data-dir=\"%TEMP%\\voter-session\" --disable-pinch --overscroll-history-navigation=0 " + assignedLink}
              </code>
              <Button 
                onClick={() => copyToClipboard("\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\" --kiosk --incognito --user-data-dir=\"%TEMP%\\voter-session\" --disable-pinch --overscroll-history-navigation=0 " + assignedLink, "win")}
                className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold gap-2 border border-white/10"
              >
                {copied === "win" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === "win" ? "Copied" : "Copy for Windows"}
              </Button>
            </div>

            <div className="p-6 bg-slate-800 rounded-[2rem] text-white shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Mac Command (Terminal)</p>
                  <h3 className="text-xl font-black italic">Launch Kiosk</h3>
                </div>
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <TerminalIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <code className="block w-full bg-white/5 p-4 rounded-xl font-mono text-[10px] break-all text-slate-400 mb-4 h-24 overflow-y-auto">
                {"/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --kiosk --incognito --disable-pinch " + assignedLink}
              </code>
              <Button 
                onClick={() => copyToClipboard("/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --kiosk --incognito --disable-pinch " + assignedLink, "mac")}
                className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold gap-2 border border-white/10"
              >
                {copied === "mac" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === "mac" ? "Copied" : "Copy for Mac"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

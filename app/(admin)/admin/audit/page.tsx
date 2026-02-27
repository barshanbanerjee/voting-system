import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClipboardList, Download, Search, ShieldCheck } from "lucide-react"

export default async function AuditPage() {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/login")
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Audit Logs</h1>
          <p className="text-slate-500 mt-2">Immutable record of every administrative and voting event in the system.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export for Verification
        </Button>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Event Ledger
          </CardTitle>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Search logs..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-700">Timestamp</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Event</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">User/Source</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-400 italic">No audit events recorded yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          log.action.includes('SUBMITTED') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          log.action.includes('DEACTIVATED') ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-[150px]">
                        {log.performedBy}
                      </td>
                      <td className="px-4 py-3 text-slate-50 text-xs bg-slate-900/5 font-mono">
                        {log.metadata || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

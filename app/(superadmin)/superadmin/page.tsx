import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createAdmin, deactivateAdmin, updateAdmin, forceEndSessions, lockdownSystem } from "../actions"

export default async function SuperAdminDashboard() {
  const session = await auth()
  
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/login")
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true, createdAt: true, id: true } })
  const auditLogsCount = await prisma.auditLog.count()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Administration</h1>
        <p className="text-slate-500 mt-2">Manage admins, reset credentials, and access system-level audit logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Total Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-800">{adminCount}</p>
            <p className="text-sm text-slate-500 mb-4">Active administrator accounts</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">Optimal</p>
            <p className="text-sm text-slate-500 mb-4">Database and Socket connected</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{auditLogsCount}</p>
            <p className="text-sm text-slate-500 mb-4">System events recorded</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Admin Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6">
              {admins.length === 0 ? (
                <p className="text-sm text-slate-500">No admin accounts created yet.</p>
              ) : (
                admins.map((admin) => (
                  <details key={admin.id} className="group p-3 bg-slate-50 rounded-lg border border-slate-200 open:bg-white open:shadow-sm transition-all">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <div>
                        <p className="font-medium text-slate-900">{admin.email}</p>
                        <p className="text-sm text-slate-500">Created: {admin.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div className="text-slate-400 text-sm group-open:hidden">Edit ▼</div>
                      <div className="text-slate-400 text-sm hidden group-open:block">Close ▲</div>
                    </summary>
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <form action={updateAdmin} className="space-y-3 mb-4">
                        <input type="hidden" name="adminId" value={admin.id} />
                        <div className="grid grid-cols-2 gap-2">
                          <input required name="password" type="password" placeholder="New Password" className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500" />
                          <input required name="adminCode" type="text" placeholder="New Admin Code" maxLength={6} className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <Button className="w-full" size="sm" type="submit" variant="secondary">Update Credentials</Button>
                      </form>
                      <form action={deactivateAdmin.bind(null, admin.id)}>
                        <Button variant="destructive" size="sm" type="submit" className="w-full">Deactivate Admin</Button>
                      </form>
                    </div>
                  </details>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-800 mb-4">Create New Admin</h3>
              <form action={createAdmin} className="space-y-3">
                <input required name="email" type="email" placeholder="Email" className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500" />
                <input required name="password" type="password" placeholder="Password" className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500" />
                <input required name="adminCode" type="text" placeholder="6-digit Admin Code" maxLength={6} className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500" />
                <Button className="w-full" type="submit">Add Admin</Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-white border-slate-200">
          <CardHeader>
            <CardTitle>Security Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={forceEndSessions}>
              <Button className="w-full justify-start h-12" variant="outline" type="submit">
                Force End All Active Sessions
              </Button>
            </form>
            <form action={lockdownSystem}>
              <Button className="w-full justify-start h-12 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" variant="outline" type="submit">
                Lockdown Entire System
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { auth } from "@/lib/auth"
import LogoutButton from "@/components/LogoutButton"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-white border-b border-red-200 px-6 py-4 flex items-center justify-between shadow-sm shadow-red-500/5">
        <div className="font-bold text-xl tracking-tight text-red-900 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-sm shadow-red-500"></div>
          Superadmin Console
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4 border-r border-red-100 pr-4">
            <span className="text-sm font-semibold text-slate-700">{session?.user?.email}</span>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 mt-1 uppercase tracking-wider">{session?.user?.role}</span>
          </div>
          <LogoutButton />
        </div>
      </nav>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

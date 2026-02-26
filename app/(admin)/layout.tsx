import { auth } from "@/lib/auth"
import LogoutButton from "@/components/LogoutButton"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Flag, 
  Users, 
  UserRound, 
  Activity, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  ClipboardList,
  CheckCircle2,
  Terminal as TerminalIcon
} from "lucide-react"
import { TamperMonitor } from "../../components/TamperMonitor"
import { LiveBadge } from "@/components/LiveBadge"

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Campaigns", href: "/admin/campaigns", icon: Flag },
  { name: "Elections", href: "/admin/elections", icon: CheckCircle2 },
  { name: "Candidates", href: "/admin/candidates", icon: UserRound },
  { name: "Voters", href: "/admin/voters", icon: Users },
  { name: "Live Monitor", href: "/admin/live", icon: Activity },
  { name: "Verification", href: "/admin/verify", icon: ShieldCheck },
  { name: "Results", href: "/admin/results", icon: BarChart3 },
  { name: "Audit Logs", href: "/admin/audit", icon: ClipboardList },
  { name: "Terminals", href: "/admin/terminals", icon: TerminalIcon },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl tracking-tight text-blue-700 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">CU</div>
            Control Unit
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4 border-r border-slate-200 pr-4">
            <span className="text-sm font-semibold text-slate-700">{session?.user?.email}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{session?.user?.role}</span>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors group"
              >
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                <span className="flex-1">{item.name}</span>
                {item.name === "Live Monitor" && <LiveBadge type="PENDING" />}
                {item.name === "Terminals" && <LiveBadge type="TAMPER" />}
              </Link>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
      <TamperMonitor />
    </div>
  )
}

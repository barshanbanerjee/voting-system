"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import os from "os"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function reportTampering(terminalId: string, campaignId?: string) {
  try {
    await prisma.tamperLog.create({
      data: {
        terminalId,
        campaignId: campaignId || null
      }
    })
    revalidatePath("/admin")
    return { success: true }
  } catch (err) {
    console.error("Failed to log tampering:", err)
    return { success: false }
  }
}

export async function getRecentTamperLogs() {
  try {
    if (!prisma.tamperLog) return []
    return await prisma.tamperLog.findMany({
      where: { resolved: false },
      orderBy: { timestamp: "desc" },
      take: 5
    })
  } catch (err) {
    console.error("Error fetching tamper logs:", err)
    return []
  }
}

export async function getServerIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

export async function getTerminalInfo() {
  const headerList = await headers()
  const rawIp = headerList.get("x-forwarded-for") || "127.0.0.1"
  let cleanIp = rawIp.split(',')[0].trim()
  
  // Strip IPv6-mapped IPv4 prefix if present
  if (cleanIp.startsWith("::ffff:")) {
    cleanIp = cleanIp.replace("::ffff:", "")
  } else if (cleanIp === "::1") {
    cleanIp = "127.0.0.1"
  }
  
  if (!(prisma as any).terminal) {
    return { ip: cleanIp, terminal: null }
  }

  const terminal = await (prisma as any).terminal.findUnique({
    where: { ip: cleanIp }
  })
  
  const serverIp = await getServerIp()
  return { ip: cleanIp, terminal, serverIp }
}

export async function manualRegisterTerminal(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const ip = formData.get("ip") as string
  const adminCode = formData.get("adminCode") as string
  const role = formData.get("role") as string

  if (!name || !ip || !adminCode) throw new Error("Missing required fields")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.adminCode !== adminCode) {
    throw new Error("INVALID_SECURITY_CODE")
  }

  const finalName = role === "ADMIN" ? `ADMIN: ${name}` : `VOTING TERMINAL: ${name}`

  if (!(prisma as any).terminal) {
    throw new Error("Prisma client not initialized with Terminal model.")
  }

  await (prisma as any).terminal.upsert({
    where: { ip },
    update: { name: finalName },
    create: { ip, name: finalName }
  })
  
  await logAudit("TERMINAL_REGISTERED", session.user.email || "ADMIN", { ip, name: finalName, role })

  revalidatePath("/admin/terminals")
}

export async function resolveTamperLog(id: string) {
  await prisma.tamperLog.update({
    where: { id },
    data: { resolved: true }
  })
  revalidatePath("/admin")
}

export async function getSystemActivity() {
  if (!(prisma as any).voteSession) return { pendingSessions: 0, tamperAlerts: 0 }
  
  const [pendingSessions, tamperAlerts] = await Promise.all([
    (prisma as any).voteSession.count({ where: { status: "PENDING" } }),
    (prisma as any).tamperLog ? (prisma as any).tamperLog.count({ where: { resolved: false } }) : 0
  ])
  
  return { pendingSessions, tamperAlerts }
}

export async function logAudit(action: string, performedBy: string, metadata?: any) {
  try {
    console.log(`\n>> AUDIT LOG [${new Date().toLocaleTimeString()}]:`, { action, performedBy, metadata });
    await prisma.auditLog.create({
      data: {
        action,
        performedBy,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })
  } catch (err) {
    console.error("Failed to log audit:", err)
  }
}

export async function logTerminalExit(terminalId: string, ip: string) {
  await logAudit("TERMINAL_EXIT", "SYSTEM", { terminalId, ip, event: "Page Unload/Refresh" })
}

export async function logTerminalOpen(terminalId: string, ip: string, name: string) {
  await logAudit("TERMINAL_OPENED", "SYSTEM", { terminalId, ip, name })
}

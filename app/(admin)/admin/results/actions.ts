"use server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function unlockResultsVault(formData: FormData) {
  const pin = formData.get("pin") as string
  if (!pin) return { error: "PIN is required" }

  const session = await auth()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email || "" }
  })

  if (!user || user.adminCode !== pin) {
    // We don't redirect here, we return an error if we use this in a client component,
    // but since we want a simple server-side flow, we can redirect back with an error param
    redirect("/admin/results?error=invalid_pin")
  }

  // Set a secure session cookie that expires in 1 hour
  const cookieStore = await cookies()
  cookieStore.set("results_vault_unlocked", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour
    path: "/admin/results",
  })

  redirect("/admin/results")
}

export async function lockResultsVault() {
  const cookieStore = await cookies()
  cookieStore.delete("results_vault_unlocked")
  redirect("/admin/results")
}

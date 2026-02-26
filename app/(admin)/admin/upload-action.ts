"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

export async function uploadPhoto(
  type: "candidates" | "voters" | "campaigns",
  id: string,
  adminId: string,
  campaignName: string,
  formData: FormData
) {
  try {
    const file = formData.get("file") as File
    if (!file) throw new Error("No file uploaded")

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Sanitize campaign name for folder structure
    const safeCampaignName = campaignName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    
    // Construct directory path
    const uploadDir = path.join(process.cwd(), "public", type, adminId, safeCampaignName)
    
    // Ensure directories exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Get the logical ID/Name for the filename
    let fileName = '';
    let publicPath = '';

    if (type === "voters") {
      const voter = await prisma.voter.findUnique({ where: { id }, select: { voterId: true } })
      fileName = `${voter?.voterId || id}.jpg`.replace(/[^a-z0-9.]/gi, '_')
    } else if (type === "candidates") {
      const candidate = await prisma.candidate.findUnique({ where: { id }, select: { name: true } })
      fileName = `${candidate?.name || id}.jpg`.replace(/[^a-z0-9.]/gi, '_')
    } else {
      fileName = "logo.jpg"
    }

    const filePath = path.join(uploadDir, fileName)
    fs.writeFileSync(filePath, buffer)
    
    // THE "PROPER UPDATE": Write the actual path to the DB
    publicPath = `/${type}/${adminId}/${safeCampaignName}/${fileName}`

    if (type === "candidates") {
      await prisma.candidate.update({
        where: { id },
        data: { photo: publicPath, updatedAt: new Date() }
      })
    } else if (type === "voters") {
      await prisma.voter.update({
        where: { id },
        data: { photo: publicPath, updatedAt: new Date() }
      })
    } else {
      await prisma.campaign.update({
        where: { id },
        data: { logo: publicPath, updatedAt: new Date() }
      })
    }
    
    revalidatePath(type === "candidates" ? "/admin/candidates" : type === "voters" ? "/admin/voters" : "/admin/campaigns")
    return { success: true }
  } catch (err) {
    console.error("Upload failed:", err)
    throw err
  }
}

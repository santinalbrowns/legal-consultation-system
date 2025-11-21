import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
})

const updateLawyerProfileSchema = z.object({
  specialization: z.string().optional(),
  experience: z.number().min(0).optional(),
  bio: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  availability: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        lawyerProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { lawyerProfile, ...userProfile } = body

    // Validate user profile data
    const validatedUserData = updateProfileSchema.parse(userProfile)

    // Handle password change
    if (validatedUserData.currentPassword && validatedUserData.newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const passwordMatch = await bcrypt.compare(
        validatedUserData.currentPassword,
        user.password
      )

      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(validatedUserData.newPassword, 10)
      
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      })
    }

    // Update user profile
    const updateData: any = {}
    if (validatedUserData.name) updateData.name = validatedUserData.name
    if (validatedUserData.phone !== undefined) updateData.phone = validatedUserData.phone

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        lawyerProfile: true,
      },
    })

    // Update lawyer profile if user is a lawyer
    if (session.user.role === "LAWYER" && lawyerProfile) {
      const validatedLawyerData = updateLawyerProfileSchema.parse(lawyerProfile)
      
      const lawyerUpdateData: any = {}
      if (validatedLawyerData.specialization) lawyerUpdateData.specialization = validatedLawyerData.specialization
      if (validatedLawyerData.experience !== undefined) lawyerUpdateData.experience = validatedLawyerData.experience
      if (validatedLawyerData.bio !== undefined) lawyerUpdateData.bio = validatedLawyerData.bio
      if (validatedLawyerData.hourlyRate !== undefined) lawyerUpdateData.hourlyRate = validatedLawyerData.hourlyRate
      if (validatedLawyerData.availability !== undefined) lawyerUpdateData.availability = validatedLawyerData.availability

      await prisma.lawyerProfile.update({
        where: { userId: session.user.id },
        data: lawyerUpdateData,
      })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

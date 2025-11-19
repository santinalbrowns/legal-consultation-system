import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const lawyerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  specialization: z.string(),
  experience: z.number().min(0),
  licenseNumber: z.string(),
  bio: z.string().optional(),
  hourlyRate: z.number().min(0),
  availability: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = lawyerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Check if license number already exists
    const existingLicense = await prisma.lawyerProfile.findUnique({
      where: { licenseNumber: validatedData.licenseNumber },
    })

    if (existingLicense) {
      return NextResponse.json(
        { error: "License number already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create lawyer user with profile
    const lawyer = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: "LAWYER",
        phone: validatedData.phone,
        lawyerProfile: {
          create: {
            specialization: validatedData.specialization,
            experience: validatedData.experience,
            licenseNumber: validatedData.licenseNumber,
            bio: validatedData.bio,
            hourlyRate: validatedData.hourlyRate,
            availability: validatedData.availability,
          },
        },
      },
      include: {
        lawyerProfile: true,
      },
    })

    return NextResponse.json(
      {
        id: lawyer.id,
        email: lawyer.email,
        name: lawyer.name,
        role: lawyer.role,
        lawyerProfile: lawyer.lawyerProfile,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating lawyer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

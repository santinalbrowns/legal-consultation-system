import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const lawyers = await prisma.user.findMany({
      where: { role: "LAWYER" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        lawyerProfile: true,
      },
    })

    return NextResponse.json(lawyers)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

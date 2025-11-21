import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { startTime, endTime } = body

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Start time and end time are required" },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    // Check for conflicting appointments
    const conflicts = await prisma.appointment.findMany({
      where: {
        lawyerId: id,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        OR: [
          {
            // New appointment starts during existing appointment
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } },
            ],
          },
          {
            // New appointment ends during existing appointment
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } },
            ],
          },
          {
            // New appointment completely contains existing appointment
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
      },
    })

    if (conflicts.length > 0) {
      return NextResponse.json({
        available: false,
        conflicts: conflicts.map((c) => ({
          title: c.title,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
      })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error("Error checking availability:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

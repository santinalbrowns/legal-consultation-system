import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const appointmentSchema = z.object({
  lawyerId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = session.user.role

    let appointments
    if (role === "CLIENT") {
      appointments = await prisma.appointment.findMany({
        where: { clientId: session.user.id },
        include: {
          lawyer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { startTime: "desc" },
      })
    } else if (role === "LAWYER") {
      appointments = await prisma.appointment.findMany({
        where: { lawyerId: session.user.id },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { startTime: "desc" },
      })
    }

    return NextResponse.json(appointments)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = appointmentSchema.parse(body)

    const appointment = await prisma.appointment.create({
      data: {
        clientId: session.user.id,
        lawyerId: validatedData.lawyerId,
        title: validatedData.title,
        description: validatedData.description,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
      },
      include: {
        lawyer: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Create notification for lawyer
    await prisma.notification.create({
      data: {
        userId: validatedData.lawyerId,
        title: "New Appointment Request",
        message: `${session.user.name} has requested an appointment: ${validatedData.title}`,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createCaseSchema = z.object({
  appointmentId: z.string(),
  title: z.string(),
  description: z.string(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "LAWYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCaseSchema.parse(body)

    // Verify the appointment exists and belongs to this lawyer
    const appointment = await prisma.appointment.findUnique({
      where: { id: validatedData.appointmentId },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    if (appointment.lawyerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only create cases for your own appointments" },
        { status: 403 }
      )
    }

    // Check if case already exists for this appointment
    const existingCase = await prisma.case.findUnique({
      where: { appointmentId: validatedData.appointmentId },
    })

    if (existingCase) {
      return NextResponse.json(
        { error: "Case already exists for this appointment" },
        { status: 400 }
      )
    }

    // Create the case
    const newCase = await prisma.case.create({
      data: {
        appointmentId: validatedData.appointmentId,
        clientId: appointment.clientId,
        lawyerId: appointment.lawyerId,
        title: validatedData.title,
        description: validatedData.description,
        status: "OPEN",
        progress: 0,
      },
      include: {
        client: {
          select: { name: true, email: true },
        },
        lawyer: {
          select: { name: true, email: true },
        },
      },
    })

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: appointment.clientId,
        title: "New Case Created",
        message: `A case has been created for your appointment: ${validatedData.title}`,
      },
    })

    return NextResponse.json(newCase, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating case:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

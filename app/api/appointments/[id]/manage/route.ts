import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateAppointmentSchema = z.object({
  action: z.enum(["cancel", "reschedule", "confirm", "complete"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateAppointmentSchema.parse(body)

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { name: true } },
        lawyer: { select: { name: true } },
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    // Check permissions
    const isLawyer = session.user.role === "LAWYER" && appointment.lawyerId === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    
    if (!isLawyer && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to manage this appointment" },
        { status: 403 }
      )
    }

    let updatedAppointment
    let notificationMessage = ""

    switch (validatedData.action) {
      case "cancel":
        updatedAppointment = await prisma.appointment.update({
          where: { id },
          data: {
            status: "CANCELLED",
            notes: validatedData.notes || "Appointment cancelled",
          },
        })
        notificationMessage = `Your appointment "${appointment.title}" has been cancelled`
        break

      case "reschedule":
        if (!validatedData.startTime || !validatedData.endTime) {
          return NextResponse.json(
            { error: "Start time and end time are required for rescheduling" },
            { status: 400 }
          )
        }
        updatedAppointment = await prisma.appointment.update({
          where: { id },
          data: {
            startTime: new Date(validatedData.startTime),
            endTime: new Date(validatedData.endTime),
            notes: validatedData.notes || "Appointment rescheduled",
          },
        })
        notificationMessage = `Your appointment "${appointment.title}" has been rescheduled to ${new Date(validatedData.startTime).toLocaleString()}`
        break

      case "confirm":
        updatedAppointment = await prisma.appointment.update({
          where: { id },
          data: {
            status: "CONFIRMED",
            notes: validatedData.notes,
          },
        })
        notificationMessage = `Your appointment "${appointment.title}" has been confirmed`
        break

      case "complete":
        updatedAppointment = await prisma.appointment.update({
          where: { id },
          data: {
            status: "COMPLETED",
            notes: validatedData.notes,
          },
        })
        notificationMessage = `Your appointment "${appointment.title}" has been marked as completed`
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    // Notify the client
    await prisma.notification.create({
      data: {
        userId: appointment.clientId,
        title: "Appointment Update",
        message: notificationMessage,
      },
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error managing appointment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

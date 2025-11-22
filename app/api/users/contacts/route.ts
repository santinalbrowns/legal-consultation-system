import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let contacts = []

    if (session.user.role === "CLIENT") {
      // Get all lawyers the client has appointments with
      const appointments = await prisma.appointment.findMany({
        where: { clientId: session.user.id },
        include: {
          lawyer: {
            select: { id: true, name: true, role: true, lawyerProfile: true },
          },
        },
        distinct: ["lawyerId"],
      })
      contacts = appointments.map((apt) => apt.lawyer)
    } else if (session.user.role === "LAWYER") {
      // Get all clients the lawyer has appointments with
      const appointments = await prisma.appointment.findMany({
        where: { lawyerId: session.user.id },
        include: {
          client: {
            select: { id: true, name: true, role: true },
          },
        },
        distinct: ["clientId"],
      })
      contacts = appointments.map((apt) => apt.client)
    }

    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

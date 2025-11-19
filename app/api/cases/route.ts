import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = session.user.role
    let cases

    if (role === "CLIENT") {
      cases = await prisma.case.findMany({
        where: { clientId: session.user.id },
        include: {
          lawyer: {
            select: { id: true, name: true, email: true },
          },
          updates: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          documents: true,
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      })
    } else if (role === "LAWYER") {
      cases = await prisma.case.findMany({
        where: { lawyerId: session.user.id },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          updates: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          documents: true,
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }

    return NextResponse.json(cases)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

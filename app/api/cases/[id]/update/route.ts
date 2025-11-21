import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateCaseSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]),
  progress: z.number().min(0).max(100),
  updateTitle: z.string(),
  updateDescription: z.string(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "LAWYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCaseSchema.parse(body)

    // Verify the case exists and belongs to this lawyer
    const existingCase = await prisma.case.findUnique({
      where: { id },
    })

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      )
    }

    if (existingCase.lawyerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own cases" },
        { status: 403 }
      )
    }

    // Update the case and create a timeline update
    const [updatedCase, caseUpdate] = await prisma.$transaction([
      prisma.case.update({
        where: { id },
        data: {
          status: validatedData.status,
          progress: validatedData.progress,
        },
        include: {
          client: {
            select: { name: true, email: true },
          },
          lawyer: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.caseUpdate.create({
        data: {
          caseId: id,
          title: validatedData.updateTitle,
          description: validatedData.updateDescription,
        },
      }),
    ])

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: existingCase.clientId,
        title: "Case Update",
        message: `Your case "${existingCase.title}" has been updated: ${validatedData.updateTitle}`,
      },
    })

    return NextResponse.json({ case: updatedCase, update: caseUpdate })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating case:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

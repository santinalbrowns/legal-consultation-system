import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "LAWYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all payments for this lawyer's cases
    const payments = await prisma.payment.findMany({
      where: {
        case: {
          lawyerId: session.user.id,
        },
      },
      include: {
        case: {
          select: {
            title: true,
            client: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate totals
    const totalEarnings = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingEarnings = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)

    const completedCount = payments.filter((p) => p.status === "COMPLETED").length
    const pendingCount = payments.filter((p) => p.status === "PENDING").length

    // Monthly earnings (last 6 months)
    const now = new Date()
    const monthlyEarnings = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthPayments = payments.filter(
        (p) =>
          p.status === "COMPLETED" &&
          p.createdAt >= date &&
          p.createdAt < nextMonth
      )
      
      const earnings = monthPayments.reduce((sum, p) => sum + p.amount, 0)
      
      monthlyEarnings.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        earnings,
        count: monthPayments.length,
      })
    }

    // Recent payments
    const recentPayments = payments.slice(0, 5).map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      date: p.createdAt,
      clientName: p.case.client.name,
      caseTitle: p.case.title,
    }))

    return NextResponse.json({
      summary: {
        totalEarnings,
        pendingEarnings,
        completedCount,
        pendingCount,
        totalPayments: payments.length,
      },
      monthlyEarnings,
      recentPayments,
    })
  } catch (error) {
    console.error("Lawyer earnings report error:", error)
    return NextResponse.json(
      { error: "Failed to generate earnings report" },
      { status: 500 }
    )
  }
}

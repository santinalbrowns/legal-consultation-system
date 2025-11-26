import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all" // all, month, week

    // Calculate date range
    const now = new Date()
    let startDate = new Date(0) // Beginning of time
    
    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get all payments
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        case: {
          include: {
            client: {
              select: { name: true, email: true },
            },
            lawyer: {
              select: { name: true, email: true },
            },
          },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate totals
    const totalRevenue = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingRevenue = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)

    const failedRevenue = payments
      .filter((p) => p.status === "FAILED")
      .reduce((sum, p) => sum + p.amount, 0)

    // Count by status
    const completedCount = payments.filter((p) => p.status === "COMPLETED").length
    const pendingCount = payments.filter((p) => p.status === "PENDING").length
    const failedCount = payments.filter((p) => p.status === "FAILED").length

    // Revenue by lawyer
    const revenueByLawyer = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((acc: any[], payment) => {
        const lawyerName = payment.case.lawyer.name
        const lawyerId = payment.case.lawyerId
        
        const existing = acc.find((item) => item.lawyerId === lawyerId)
        if (existing) {
          existing.revenue += payment.amount
          existing.cases += 1
        } else {
          acc.push({
            lawyerId,
            lawyerName,
            revenue: payment.amount,
            cases: 1,
          })
        }
        return acc
      }, [])
      .sort((a, b) => b.revenue - a.revenue)

    // Revenue by month (last 6 months)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthPayments = payments.filter(
        (p) =>
          p.status === "COMPLETED" &&
          p.createdAt >= date &&
          p.createdAt < nextMonth
      )
      
      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0)
      
      monthlyRevenue.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue,
        count: monthPayments.length,
      })
    }

    // Recent transactions
    const recentTransactions = payments.slice(0, 10).map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      date: p.createdAt,
      clientName: p.case.client.name,
      lawyerName: p.case.lawyer.name,
      caseTitle: p.case.title,
      transactionId: p.transactionId,
    }))

    // Payment methods breakdown
    const paymentMethods = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((acc: any[], payment) => {
        const method = payment.paymentMethod || "Unknown"
        const existing = acc.find((item) => item.method === method)
        if (existing) {
          existing.count += 1
          existing.amount += payment.amount
        } else {
          acc.push({
            method,
            count: 1,
            amount: payment.amount,
          })
        }
        return acc
      }, [])

    return NextResponse.json({
      summary: {
        totalRevenue,
        pendingRevenue,
        failedRevenue,
        completedCount,
        pendingCount,
        failedCount,
        totalTransactions: payments.length,
        averageTransaction: completedCount > 0 ? totalRevenue / completedCount : 0,
      },
      revenueByLawyer,
      monthlyRevenue,
      recentTransactions,
      paymentMethods,
      period,
    })
  } catch (error) {
    console.error("Financial report error:", error)
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 }
    )
  }
}

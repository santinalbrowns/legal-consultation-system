import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "LAWYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lawyerId = session.user.id

    // Get lawyer statistics
    const [
      totalAppointments,
      totalCases,
      appointmentsByStatus,
      casesByStatus,
      recentAppointments,
      recentCases,
      caseProgress,
    ] = await Promise.all([
      prisma.appointment.count({ where: { lawyerId } }),
      prisma.case.count({ where: { lawyerId } }),
      
      prisma.appointment.groupBy({
        by: ["status"],
        where: { lawyerId },
        _count: true,
      }),
      
      prisma.case.groupBy({
        by: ["status"],
        where: { lawyerId },
        _count: true,
      }),
      
      prisma.appointment.findMany({
        where: {
          lawyerId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      }),
      
      prisma.case.findMany({
        where: {
          lawyerId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
          status: true,
          progress: true,
        },
      }),
      
      prisma.case.findMany({
        where: { lawyerId },
        select: {
          title: true,
          progress: true,
          status: true,
        },
      }),
    ])

    // Process appointments by date
    const appointmentsByDate = recentAppointments.reduce((acc: any, apt) => {
      const date = new Date(apt.createdAt).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date]++
      return acc
    }, {})

    // Average case progress
    const avgProgress = caseProgress.length > 0
      ? caseProgress.reduce((sum, c) => sum + c.progress, 0) / caseProgress.length
      : 0

    return NextResponse.json({
      overview: {
        totalAppointments,
        totalCases,
        avgProgress: Math.round(avgProgress),
      },
      appointmentsByStatus: appointmentsByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      casesByStatus: casesByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      appointmentsByDate: Object.entries(appointmentsByDate).map(([date, count]) => ({
        date,
        count,
      })),
      caseProgress: caseProgress.map((c) => ({
        title: c.title,
        progress: c.progress,
        status: c.status,
      })),
    })
  } catch (error) {
    console.error("Error fetching lawyer reports:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

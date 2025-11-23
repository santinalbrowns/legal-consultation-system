import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all data for reports
    const [
      totalUsers,
      totalLawyers,
      totalClients,
      totalAppointments,
      totalCases,
      appointmentsByStatus,
      casesByStatus,
      recentAppointments,
      recentCases,
      lawyerStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "LAWYER" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.appointment.count(),
      prisma.case.count(),
      
      // Appointments by status
      prisma.appointment.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      // Cases by status
      prisma.case.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      // Recent appointments (last 30 days)
      prisma.appointment.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      }),
      
      // Recent cases (last 30 days)
      prisma.case.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      }),
      
      // Lawyer statistics
      prisma.user.findMany({
        where: { role: "LAWYER" },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              lawyerAppointments: true,
              lawyerCases: true,
            },
          },
        },
        take: 10,
        orderBy: {
          lawyerAppointments: {
            _count: "desc",
          },
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

    // Process cases by date
    const casesByDate = recentCases.reduce((acc: any, caseItem) => {
      const date = new Date(caseItem.createdAt).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date]++
      return acc
    }, {})

    return NextResponse.json({
      overview: {
        totalUsers,
        totalLawyers,
        totalClients,
        totalAppointments,
        totalCases,
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
      casesByDate: Object.entries(casesByDate).map(([date, count]) => ({
        date,
        count,
      })),
      topLawyers: lawyerStats.map((lawyer) => ({
        name: lawyer.name,
        appointments: lawyer._count.lawyerAppointments,
        cases: lawyer._count.lawyerCases,
      })),
    })
  } catch (error) {
    console.error("Error fetching admin reports:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

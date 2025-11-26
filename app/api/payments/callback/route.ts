import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log("Payment callback received:", body)

    const { tx_ref, status, amount, meta } = body

    if (!meta?.caseId) {
      return NextResponse.json({ error: "Missing case ID" }, { status: 400 })
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { caseId: meta.caseId },
    })

    const paymentStatus = status === "successful" ? "COMPLETED" : 
                         status === "failed" ? "FAILED" : "PENDING"

    if (existingPayment) {
      // Update existing payment
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: paymentStatus,
          transactionId: tx_ref,
          amount: parseFloat(amount),
        },
      })
    } else {
      // Create new payment
      const caseData = await prisma.case.findUnique({
        where: { id: meta.caseId },
      })

      if (!caseData) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 })
      }

      await prisma.payment.create({
        data: {
          caseId: meta.caseId,
          userId: caseData.clientId,
          amount: parseFloat(amount),
          status: paymentStatus,
          transactionId: tx_ref,
          paymentMethod: "Paychangu",
        },
      })

      // Create notification for client
      await prisma.notification.create({
        data: {
          userId: caseData.clientId,
          title: "Payment Processed",
          message: `Your payment of MWK ${amount} for case "${caseData.title}" has been ${paymentStatus.toLowerCase()}.`,
        },
      })

      // Notify lawyer
      await prisma.notification.create({
        data: {
          userId: caseData.lawyerId,
          title: "Payment Received",
          message: `Payment of MWK ${amount} received for case "${caseData.title}".`,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Payment callback error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  // Handle GET callback (redirect from Paychangu)
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const tx_ref = searchParams.get("tx_ref")

  // Redirect to appropriate page
  return NextResponse.redirect(new URL("/dashboard/client/cases", request.url))
}

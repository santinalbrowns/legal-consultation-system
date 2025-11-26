import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("=== Payment processing API called ===")
    console.log("Body:", JSON.stringify(body, null, 2))

    const { tx_ref, status, amount, caseId } = body

    if (!caseId || !tx_ref) {
      console.error("Missing required fields:", { caseId, tx_ref })
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the case exists and user has access
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
    })

    if (!caseData) {
      console.error("Case not found:", caseId)
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    // Verify user is the client of this case
    if (caseData.clientId !== session.user.id && session.user.role !== "ADMIN") {
      console.error("User not authorized for this case")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Determine payment status
    const paymentStatus =
      status === "successful" ? "COMPLETED" : status === "failed" ? "FAILED" : "PENDING"

    console.log("Processing payment with status:", paymentStatus)

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { caseId: caseId },
    })

    let payment

    if (existingPayment) {
      // Update existing payment
      console.log("Updating existing payment:", existingPayment.id)
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: paymentStatus,
          transactionId: tx_ref,
          amount: amount ? parseFloat(amount) : existingPayment.amount,
          updatedAt: new Date(),
        },
      })
      console.log("Payment updated successfully")
    } else {
      // Create new payment
      console.log("Creating new payment for case:", caseId)
      payment = await prisma.payment.create({
        data: {
          caseId: caseId,
          userId: caseData.clientId,
          amount: amount ? parseFloat(amount) : 0,
          status: paymentStatus,
          transactionId: tx_ref,
          paymentMethod: "Paychangu",
        },
      })
      console.log("Payment created successfully:", payment.id)
    }

    // Create notifications only for successful payments
    if (paymentStatus === "COMPLETED") {
      // Notify client
      await prisma.notification.create({
        data: {
          userId: caseData.clientId,
          title: "Payment Completed",
          message: `Your payment of MWK ${payment.amount} for case "${caseData.title}" has been completed successfully.`,
        },
      })

      // Notify lawyer
      await prisma.notification.create({
        data: {
          userId: caseData.lawyerId,
          title: "Payment Received",
          message: `Payment of MWK ${payment.amount} received for case "${caseData.title}".`,
        },
      })

      console.log("Notifications created")
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
      },
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

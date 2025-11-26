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

    // Determine payment status - handle various status formats
    console.log("Raw status from Paychangu:", status)
    
    let paymentStatus: "COMPLETED" | "FAILED" | "PENDING" = "PENDING"
    
    if (status) {
      const statusLower = status.toLowerCase()
      if (statusLower === "successful" || statusLower === "success" || statusLower === "completed") {
        paymentStatus = "COMPLETED"
      } else if (statusLower === "failed" || statusLower === "failure" || statusLower === "error") {
        paymentStatus = "FAILED"
      }
    }

    console.log("Mapped payment status:", paymentStatus, "from raw status:", status)

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
      // Determine payment amount from multiple sources
      let paymentAmount = amount ? parseFloat(amount) : 0
      
      // If amount is not provided, check existing payment or lawyer's rate
      if (paymentAmount === 0) {
        // Check if there's an existing payment with an amount
        const existingPaymentCheck = await prisma.payment.findUnique({
          where: { caseId: caseId },
        })
        
        if (existingPaymentCheck && existingPaymentCheck.amount > 0) {
          paymentAmount = existingPaymentCheck.amount
          console.log("Using existing payment amount:", paymentAmount)
        } else {
          // Try to get lawyer's hourly rate as default
          const lawyer = await prisma.user.findUnique({
            where: { id: caseData.lawyerId },
            include: { lawyerProfile: true },
          })
          
          if (lawyer?.lawyerProfile?.hourlyRate) {
            paymentAmount = lawyer.lawyerProfile.hourlyRate
            console.log("Using lawyer's hourly rate as payment amount:", paymentAmount)
          }
        }
      }
      
      payment = await prisma.payment.create({
        data: {
          caseId: caseId,
          userId: caseData.clientId,
          amount: paymentAmount,
          status: paymentStatus,
          transactionId: tx_ref,
          paymentMethod: "Paychangu",
        },
      })
      console.log("Payment created successfully:", payment.id, "Amount:", paymentAmount)
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

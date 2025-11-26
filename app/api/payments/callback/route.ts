import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log("=== Payment POST callback received ===")
    console.log("Full body:", JSON.stringify(body, null, 2))

    const { tx_ref, status, amount, meta } = body

    if (!meta?.caseId) {
      console.error("Missing case ID in meta:", meta)
      return NextResponse.json({ error: "Missing case ID" }, { status: 400 })
    }

    console.log("Processing payment for case:", meta.caseId)

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { caseId: meta.caseId },
    })

    const paymentStatus = status === "successful" ? "COMPLETED" : 
                         status === "failed" ? "FAILED" : "PENDING"

    if (existingPayment) {
      // Update existing payment
      console.log("Updating existing payment:", existingPayment.id)
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: paymentStatus,
          transactionId: tx_ref,
          amount: parseFloat(amount),
        },
      })
      console.log("Payment updated successfully to status:", paymentStatus)
    } else {
      // Create new payment
      const caseData = await prisma.case.findUnique({
        where: { id: meta.caseId },
      })

      if (!caseData) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 })
      }

      console.log("Creating new payment for case:", meta.caseId)
      const newPayment = await prisma.payment.create({
        data: {
          caseId: meta.caseId,
          userId: caseData.clientId,
          amount: parseFloat(amount),
          status: paymentStatus,
          transactionId: tx_ref,
          paymentMethod: "Paychangu",
        },
      })
      console.log("Payment created successfully:", newPayment.id, "Status:", paymentStatus)

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
  try {
    // Handle GET callback (redirect from Paychangu after payment)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const tx_ref = searchParams.get("tx_ref")
    const amount = searchParams.get("amount")
    
    console.log("=== Payment GET callback ===")
    console.log("Status:", status, "TX Ref:", tx_ref, "Amount:", amount)
    
    // Redirect to processing page with all parameters
    const processingUrl = new URL("/dashboard/client/cases/payment-processing", request.url)
    processingUrl.searchParams.set("status", status || "unknown")
    processingUrl.searchParams.set("tx_ref", tx_ref || "")
    if (amount) {
      processingUrl.searchParams.set("amount", amount)
    }

    console.log("Redirecting to processing page:", processingUrl.pathname)
    return NextResponse.redirect(processingUrl)
  } catch (error) {
    console.error("GET callback error:", error)
    return NextResponse.redirect(new URL("/dashboard/client/cases", request.url))
  }
}

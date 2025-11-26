import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log("=== Payment POST callback received ===")
    console.log("Full body:", JSON.stringify(body, null, 2))
    console.log("Status:", body.status)
    console.log("Amount:", body.amount)
    console.log("TX Ref:", body.tx_ref)
    console.log("Meta:", body.meta)

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
    
    console.log("Mapped payment status:", paymentStatus)

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
    console.log("All params:", Object.fromEntries(searchParams.entries()))
    console.log("Status:", status, "TX Ref:", tx_ref, "Amount:", amount)
    
    // If Paychangu redirects here, we assume payment was successful
    // Extract case ID from tx_ref and update payment directly
    if (tx_ref) {
      const parts = tx_ref.split("-")
      if (parts.length >= 2 && parts[0] === "CASE") {
        const caseId = parts[1]
        
        try {
          // Get case and payment info
          const caseData = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
              payment: true,
            },
          })
          
          if (caseData) {
            // Get lawyer's hourly rate for amount
            const lawyer = await prisma.user.findUnique({
              where: { id: caseData.lawyerId },
              include: { lawyerProfile: true },
            })
            
            const paymentAmount = amount 
              ? parseFloat(amount) 
              : (caseData.payment?.amount || lawyer?.lawyerProfile?.hourlyRate || 0)
            
            if (caseData.payment) {
              // Update existing payment to COMPLETED
              await prisma.payment.update({
                where: { id: caseData.payment.id },
                data: {
                  status: "COMPLETED",
                  transactionId: tx_ref,
                  amount: paymentAmount,
                  updatedAt: new Date(),
                },
              })
              console.log("Payment updated to COMPLETED for case:", caseId)
            } else {
              // Create new payment as COMPLETED
              await prisma.payment.create({
                data: {
                  caseId: caseId,
                  userId: caseData.clientId,
                  amount: paymentAmount,
                  status: "COMPLETED",
                  transactionId: tx_ref,
                  paymentMethod: "Paychangu",
                },
              })
              console.log("Payment created as COMPLETED for case:", caseId)
            }
            
            // Create notifications
            await prisma.notification.create({
              data: {
                userId: caseData.clientId,
                title: "Payment Completed",
                message: `Your payment of MWK ${paymentAmount} for case "${caseData.title}" has been completed successfully.`,
              },
            })
            
            await prisma.notification.create({
              data: {
                userId: caseData.lawyerId,
                title: "Payment Received",
                message: `Payment of MWK ${paymentAmount} received for case "${caseData.title}".`,
              },
            })
            
            // Redirect to success page
            return NextResponse.redirect(
              new URL(`/dashboard/client/cases?payment=success&caseId=${caseId}`, request.url)
            )
          }
        } catch (error) {
          console.error("Error processing payment in GET callback:", error)
        }
      }
    }
    
    // Fallback: redirect to processing page if we couldn't handle it directly
    const processingUrl = new URL("/dashboard/client/cases/payment-processing", request.url)
    processingUrl.searchParams.set("status", status || "successful")
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

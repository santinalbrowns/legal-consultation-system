"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function PaymentProcessingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("Processing your payment...")

  useEffect(() => {
    const processPayment = async () => {
      // If no status provided, assume successful (Paychangu redirects here on success)
      const paymentStatus = searchParams.get("status") || "successful"
      const tx_ref = searchParams.get("tx_ref")
      let amount = searchParams.get("amount")
      
      console.log("Payment processing page - Status:", paymentStatus, "TX Ref:", tx_ref, "Amount:", amount)

      if (!tx_ref) {
        setStatus("error")
        setMessage("Invalid payment reference")
        setTimeout(() => router.push("/dashboard/client/cases"), 3000)
        return
      }

      // Extract case ID from tx_ref (format: CASE-{caseId}-{timestamp})
      const parts = tx_ref.split("-")
      let caseId = null
      
      if (parts.length >= 2 && parts[0] === "CASE") {
        caseId = parts[1]
      }
      
      // Try to get amount from localStorage if not in URL
      if (!amount && caseId) {
        try {
          const storedData = localStorage.getItem(`payment_${caseId}`)
          if (storedData) {
            const paymentData = JSON.parse(storedData)
            amount = paymentData.amount?.toString()
            console.log("Retrieved amount from localStorage:", amount)
            // Clean up localStorage
            localStorage.removeItem(`payment_${caseId}`)
          }
        } catch (e) {
          console.error("Error reading from localStorage:", e)
        }
      }

      if (!caseId) {
        setStatus("error")
        setMessage("Invalid case reference")
        setTimeout(() => router.push("/dashboard/client/cases"), 3000)
        return
      }

      // Check if payment was cancelled or failed
      if (paymentStatus && (paymentStatus.toLowerCase() === "cancelled" || paymentStatus.toLowerCase() === "canceled")) {
        setStatus("error")
        setMessage("Payment was cancelled")
        setTimeout(() => {
          router.push(`/dashboard/client/cases/${caseId}/payment?payment=cancelled`)
        }, 2000)
        return
      }

      try {
        // Call the payment update API
        const response = await fetch("/api/payments/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tx_ref,
            status: paymentStatus,
            amount,
            caseId,
          }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus("success")
          setMessage("Payment completed successfully!")
          
          // Redirect to cases page with success message after 2 seconds
          setTimeout(() => {
            router.push(`/dashboard/client/cases?payment=success&caseId=${caseId}`)
          }, 2000)
        } else {
          setStatus("error")
          setMessage(data.error || "Payment processing failed")
          setTimeout(() => {
            router.push(`/dashboard/client/cases/${caseId}/payment?payment=failed`)
          }, 3000)
        }
      } catch (error) {
        console.error("Payment processing error:", error)
        setStatus("error")
        setMessage("An error occurred while processing your payment")
        setTimeout(() => {
          router.push(`/dashboard/client/cases/${caseId}/payment?payment=failed`)
        }, 3000)
      }
    }

    processPayment()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === "processing" && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Payment
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-4">
                Please wait while we confirm your payment...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Payment Successful!
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-4">
                Redirecting you to your cases...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-900 mb-2">
                Payment Failed
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-4">
                Redirecting you back...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

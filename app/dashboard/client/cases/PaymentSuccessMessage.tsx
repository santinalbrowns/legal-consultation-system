"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function PaymentSuccessMessage() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)
  const payment = searchParams.get("payment")
  const caseId = searchParams.get("caseId")

  useEffect(() => {
    if (payment === "success") {
      setShow(true)
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => setShow(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [payment])

  if (!show || payment !== "success") return null

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-semibold text-green-900">Payment Successful!</h3>
            <p className="mt-2 text-sm text-green-700">
              Your payment has been processed successfully. The case has been marked as paid.
            </p>
            {caseId && (
              <p className="mt-1 text-sm text-green-600">
                You can now view your case details below.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="flex-shrink-0 ml-4 text-green-600 hover:text-green-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

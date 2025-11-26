"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Script from "next/script"

declare global {
  interface Window {
    PaychanguCheckout: (config: any) => void
  }
}

type Case = {
  id: string
  title: string
  description: string
  status: string
  lawyer: {
    name: string
    lawyerProfile: {
      hourlyRate: number
    } | null
  }
  payment: {
    id: string
    amount: number
    status: string
  } | null
}

type User = {
  email: string
  name: string
}

export default function CasePaymentPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params?.id as string

  const [caseData, setCaseData] = useState<Case | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [amount, setAmount] = useState<number>(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Load case data
    fetch(`/api/cases/${caseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setCaseData(data)
          // Set default amount based on lawyer's hourly rate
          if (data.lawyer?.lawyerProfile?.hourlyRate) {
            setAmount(data.lawyer.lawyerProfile.hourlyRate)
          }
        }
      })
      .catch(() => setError("Failed to load case"))

    // Load user profile
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser(data)
        }
      })
  }, [caseId])

  function makePayment() {
    if (!caseData || !user) {
      setError("Missing required data")
      return
    }

    if (amount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    // Check if Paychangu script is loaded
    if (typeof window.PaychanguCheckout !== "function") {
      setError("Payment system is loading. Please wait a moment and try again.")
      return
    }

    setLoading(true)
    setError("")

    try {
      window.PaychanguCheckout({
          public_key: process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY,
          tx_ref: `CASE-${caseId}-${Date.now()}`,
          amount: amount,
          currency: "MWK",
          callback_url: `${window.location.origin}/api/payments/callback`,
          return_url: `${window.location.origin}/dashboard/client/cases/${caseId}`,
          customer: {
            email: user.email,
            first_name: user.name.split(" ")[0],
            last_name: user.name.split(" ").slice(1).join(" ") || "Client",
          },
          customization: {
            title: "Legal Consultation Payment",
            description: `Payment for case: ${caseData.title}`,
          },
          meta: {
            caseId: caseId,
            userId: user.email,
          },
        })
      setLoading(false)
    } catch (err: any) {
      console.error("Payment error:", err)
      setError("Payment failed: " + err.message)
      setLoading(false)
    }
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://in.paychangu.com/js/popup.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log("Paychangu script loaded")
          setScriptLoaded(true)
        }}
        onError={() => {
          console.error("Failed to load Paychangu script")
          setError("Failed to load payment system. Please refresh the page.")
        }}
      />
      
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Make Payment</h1>
            <Link href={`/dashboard/client/cases`} className="text-gray-700 hover:text-indigo-600">
              ← Back to Cases
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {caseData.status === "CLOSED" && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            ⚠ This case is closed. Payments cannot be made for closed cases.
          </div>
        )}

        {caseData.payment?.status === "COMPLETED" && (
          <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
            ✓ Payment already completed for this case
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Case Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Case Title</p>
              <p className="font-medium">{caseData.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lawyer</p>
              <p className="font-medium">{caseData.lawyer.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Case Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  caseData.status === "CLOSED"
                    ? "bg-gray-100 text-gray-800"
                    : caseData.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {caseData.status.replace("_", " ")}
              </span>
            </div>
            {caseData.lawyer.lawyerProfile && (
              <div>
                <p className="text-sm text-gray-500">Lawyer's Hourly Rate</p>
                <p className="font-medium">MWK {caseData.lawyer.lawyerProfile.hourlyRate}</p>
              </div>
            )}
            {caseData.payment && (
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    caseData.payment.status === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : caseData.payment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {caseData.payment.status}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (MWK) *
            </label>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter amount"
            />
            <p className="text-xs text-gray-500 mt-1">
              Suggested: MWK {caseData.lawyer.lawyerProfile?.hourlyRate || 0} (Lawyer's hourly rate)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-800">Amount:</span>
                <span className="font-medium text-blue-900">MWK {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="text-blue-800 font-medium">Total:</span>
                <span className="font-bold text-blue-900">MWK {amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {!scriptLoaded && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg mb-4 text-sm">
              Loading payment system...
            </div>
          )}

          {/* Required by Paychangu */}
          <div id="wrapper"></div>

          <button
            type="button"
            onClick={makePayment}
            disabled={loading || amount <= 0 || caseData.payment?.status === "COMPLETED" || caseData.status === "CLOSED" || !scriptLoaded}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : caseData.status === "CLOSED" ? "Case Closed - Payment Not Available" : scriptLoaded ? "Pay Now with Paychangu" : "Loading Payment System..."}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Secure payment powered by Paychangu
          </p>
        </div>
      </main>
    </div>
    </>
  )
}

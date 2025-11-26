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
  const [refreshing, setRefreshing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  useEffect(() => {
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get("payment")
    if (status) {
      setPaymentStatus(status)
    }
  }, [])

  const loadCaseData = () => {
    setRefreshing(true)
    fetch(`/api/cases/${caseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setCaseData(data)
          // Set default amount based on lawyer's hourly rate
          if (data.lawyer?.lawyerProfile?.hourlyRate && !amount) {
            setAmount(data.lawyer.lawyerProfile.hourlyRate)
          }
        }
      })
      .catch(() => setError("Failed to load case"))
      .finally(() => setRefreshing(false))
  }

  useEffect(() => {
    loadCaseData()

    // Load user profile
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser(data)
        }
      })
  }, [caseId])

  // Auto-refresh payment status every 5 seconds if payment is pending
  useEffect(() => {
    if (caseData?.payment?.status === "PENDING") {
      const interval = setInterval(() => {
        loadCaseData()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [caseData?.payment?.status])

  // Prevent making payment if already completed or case is closed
  useEffect(() => {
    if (caseData?.payment?.status === "COMPLETED" && !paymentStatus) {
      // Don't redirect if we're showing a status message
      const urlParams = new URLSearchParams(window.location.search)
      if (!urlParams.get("payment")) {
        // Auto redirect after 3 seconds if payment is already completed
        const timer = setTimeout(() => {
          router.push("/dashboard/client/cases")
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [caseData?.payment?.status, paymentStatus, router])

  function makePayment() {
    if (!caseData || !user) {
      setError("Missing required data")
      return
    }

    // Prevent payment if already completed
    if (caseData.payment?.status === "COMPLETED") {
      setError("Payment has already been completed for this case")
      return
    }

    // Prevent payment if case is closed
    if (caseData.status === "CLOSED") {
      setError("Cannot make payment for a closed case")
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

    // Store payment details in localStorage for retrieval after redirect
    const paymentData = {
      caseId: caseId,
      amount: amount,
      timestamp: Date.now(),
    }
    localStorage.setItem(`payment_${caseId}`, JSON.stringify(paymentData))

    try {
      window.PaychanguCheckout({
          public_key: process.env.NEXT_PUBLIC_PAYCHANGU_PUBLIC_KEY,
          tx_ref: `CASE-${caseId}-${Date.now()}`,
          amount: amount,
          currency: "MWK",
          callback_url: `${window.location.origin}/api/payments/callback`,
          return_url: `${window.location.origin}/dashboard/client/cases/${caseId}/payment?payment=cancelled`,
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
            <h1 className="text-2xl font-bold text-indigo-600">
              {caseData.payment?.status === "COMPLETED" ? "Payment Completed" : "Make Payment"}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={loadCaseData}
                disabled={refreshing}
                className="text-gray-700 hover:text-indigo-600 disabled:opacity-50"
                title="Refresh payment status"
              >
                <svg className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Link href={`/dashboard/client/cases`} className="text-gray-700 hover:text-indigo-600">
                ← Back to Cases
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paymentStatus === "cancelled" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Payment was cancelled. You can try again when ready.
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  Payment failed. Please try again or contact support if the issue persists.
                </p>
              </div>
            </div>
          </div>
        )}

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
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-green-900">Payment Completed Successfully!</h3>
                <p className="mt-2 text-sm text-green-700">
                  Your payment of <span className="font-bold">MWK {caseData.payment.amount.toFixed(2)}</span> has been processed successfully.
                </p>
                <p className="mt-1 text-sm text-green-600">
                  This case has been paid for. You can now view the case details.
                </p>
                <div className="mt-4">
                  <Link
                    href="/dashboard/client/cases"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    View All Cases →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {caseData.payment?.status === "PENDING" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Payment is being processed... This page will update automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {caseData.payment?.status === "FAILED" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  Payment failed. Please try again or contact support if the issue persists.
                </p>
              </div>
            </div>
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

        {caseData.payment?.status !== "COMPLETED" && caseData.status !== "CLOSED" && (
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
        )}
      </main>
    </div>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

type EarningsData = {
  summary: {
    totalEarnings: number
    pendingEarnings: number
    completedCount: number
    pendingCount: number
    totalPayments: number
  }
  monthlyEarnings: Array<{
    month: string
    earnings: number
    count: number
  }>
  recentPayments: Array<{
    id: string
    amount: number
    status: string
    date: string
    clientName: string
    caseTitle: string
  }>
}

export default function LawyerEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadEarningsData()
  }, [])

  const loadEarningsData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/reports/lawyer-earnings")
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
      } else {
        setError(result.error || "Failed to load earnings data")
      }
    } catch (err) {
      setError("Failed to load earnings data")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `MWK ${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading earnings...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error || "Failed to load data"}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">My Earnings</h1>
            <Link
              href="/dashboard/lawyer"
              className="text-gray-700 hover:text-indigo-600"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(data.summary.totalEarnings)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {data.summary.completedCount} completed payments
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Earnings</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {formatCurrency(data.summary.pendingEarnings)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {data.summary.pendingCount} pending payments
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Payments</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {data.summary.totalPayments}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              All time
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Payment</h3>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(
                data.summary.completedCount > 0
                  ? data.summary.totalEarnings / data.summary.completedCount
                  : 0
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Per case
            </p>
          </div>
        </div>

        {/* Earnings Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Earnings Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyEarnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#10B981"
                strokeWidth={2}
                name="Earnings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Payments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Case
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  data.recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.caseTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payment.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

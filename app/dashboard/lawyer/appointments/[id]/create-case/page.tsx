"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

type Appointment = {
  id: string
  title: string
  description: string | null
  client: {
    name: string
  }
}

export default function CreateCasePage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params?.id as string
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!appointmentId) return
    
    fetch(`/api/appointments/${appointmentId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setAppointment(data)
        }
      })
      .catch((err) => {
        console.error('Error loading appointment:', err)
        setError("Failed to load appointment")
      })
  }, [appointmentId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      appointmentId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    }

    try {
      const response = await fetch("/api/cases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Case creation error:', result)
        setError(result.error || "Failed to create case")
        return
      }

      router.push("/dashboard/lawyer/appointments")
      router.refresh()
    } catch (error) {
      console.error('Error creating case:', error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/dashboard/lawyer/appointments"
            className="text-indigo-600 hover:underline"
          >
            ← Back to Appointments
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Create Case</h1>
        <p className="text-gray-600 mb-8">
          Create a legal case from appointment with {appointment.client.name}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Appointment Details</h3>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Title:</span> {appointment.title}
          </p>
          {appointment.description && (
            <p className="text-blue-800 text-sm mt-1">
              <span className="font-medium">Description:</span> {appointment.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Title *
            </label>
            <input
              name="title"
              type="text"
              required
              defaultValue={appointment.title}
              placeholder="e.g., Contract Dispute - ABC Corp"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can use the appointment title or create a new one
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Description *
            </label>
            <textarea
              name="description"
              rows={6}
              required
              defaultValue={appointment.description || ""}
              placeholder="Provide detailed information about the case, legal issues involved, and expected outcomes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Case will be created with status "OPEN"</li>
              <li>Client will receive a notification</li>
              <li>You can track progress and add updates</li>
              <li>Documents can be uploaded to the case</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Creating Case..." : "Create Case"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

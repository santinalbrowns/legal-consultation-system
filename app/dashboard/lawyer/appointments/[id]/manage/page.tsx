"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

type Appointment = {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: string
  notes: string | null
  client: {
    name: string
    email: string
  }
}

export default function ManageAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params?.id as string
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [action, setAction] = useState<"reschedule" | "cancel" | "confirm" | "complete">("confirm")

  useEffect(() => {
    if (!appointmentId) return
    
    fetch(`/api/appointments/${appointmentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setAppointment(data)
        }
      })
      .catch(() => setError("Failed to load appointment"))
  }, [appointmentId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data: any = {
      action,
      notes: formData.get("notes") as string,
    }

    if (action === "reschedule") {
      data.startTime = new Date(formData.get("startTime") as string).toISOString()
      data.endTime = new Date(formData.get("endTime") as string).toISOString()
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        setError(error.error || "Failed to update appointment")
        return
      }

      router.push("/dashboard/lawyer/appointments")
      router.refresh()
    } catch (error) {
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

        <h1 className="text-3xl font-bold mb-2">Manage Appointment</h1>
        <p className="text-gray-600 mb-8">
          Update appointment with {appointment.client.name}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Current Appointment</h3>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Title:</span> {appointment.title}
          </p>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Client:</span> {appointment.client.name}
          </p>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Start:</span> {new Date(appointment.startTime).toLocaleString()}
          </p>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">End:</span> {new Date(appointment.endTime).toLocaleString()}
          </p>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Status:</span> {appointment.status}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action *
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="confirm">Confirm Appointment</option>
              <option value="reschedule">Reschedule</option>
              <option value="complete">Mark as Completed</option>
              <option value="cancel">Cancel Appointment</option>
            </select>
          </div>

          {action === "reschedule" && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-4">New Time</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Start Time *
                  </label>
                  <input
                    name="startTime"
                    type="datetime-local"
                    required
                    defaultValue={new Date(appointment.startTime).toISOString().slice(0, 16)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New End Time *
                  </label>
                  <input
                    name="endTime"
                    type="datetime-local"
                    required
                    defaultValue={new Date(appointment.endTime).toISOString().slice(0, 16)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes {action === "cancel" && "*"}
            </label>
            <textarea
              name="notes"
              rows={4}
              required={action === "cancel"}
              placeholder={
                action === "cancel"
                  ? "Please provide a reason for cancellation..."
                  : "Add any additional notes..."
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              {action === "confirm" && (
                <>
                  <li>Appointment status will be set to "CONFIRMED"</li>
                  <li>Client will receive a confirmation notification</li>
                </>
              )}
              {action === "reschedule" && (
                <>
                  <li>Appointment will be moved to the new time</li>
                  <li>Client will be notified of the change</li>
                  <li>System will check for conflicts</li>
                </>
              )}
              {action === "complete" && (
                <>
                  <li>Appointment will be marked as completed</li>
                  <li>Client will be notified</li>
                </>
              )}
              {action === "cancel" && (
                <>
                  <li>Appointment will be cancelled</li>
                  <li>Client will be notified with your reason</li>
                  <li>This action cannot be undone</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 text-white py-2 rounded-lg disabled:opacity-50 ${
                action === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Processing..." : action === "cancel" ? "Cancel Appointment" : "Update Appointment"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

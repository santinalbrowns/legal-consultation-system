"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type Lawyer = {
  id: string
  name: string
  email: string
  lawyerProfile: {
    specialization: string
    experience: number
    hourlyRate: number
  } | null
}

export default function BookAppointmentPage() {
  const router = useRouter()
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [availabilityWarning, setAvailabilityWarning] = useState("")
  const [selectedLawyer, setSelectedLawyer] = useState("")

  useEffect(() => {
    fetch("/api/lawyers")
      .then((res) => res.json())
      .then((data) => setLawyers(data))
  }, [])

  async function checkAvailability(lawyerId: string, startTime: string, endTime: string) {
    try {
      const response = await fetch(`/api/lawyers/${lawyerId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime, endTime }),
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error checking availability:", error)
      return { available: true }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setAvailabilityWarning("")

    const formData = new FormData(e.currentTarget)
    const lawyerId = formData.get("lawyerId") as string
    const startTime = new Date(formData.get("startTime") as string).toISOString()
    const endTime = new Date(formData.get("endTime") as string).toISOString()

    // Check availability first
    const availabilityCheck = await checkAvailability(lawyerId, startTime, endTime)
    
    if (!availabilityCheck.available) {
      setAvailabilityWarning(
        "This lawyer has a conflicting appointment during this time. Please choose a different time slot."
      )
      setLoading(false)
      return
    }

    const data = {
      lawyerId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      startTime,
      endTime,
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to book appointment")
      }

      router.push("/dashboard/client")
      router.refresh()
    } catch (error) {
      setError("Failed to book appointment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Book an Appointment</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {availabilityWarning && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg mb-4 border border-yellow-200">
            <p className="font-medium">⚠️ Time Slot Not Available</p>
            <p className="text-sm mt-1">{availabilityWarning}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Lawyer
            </label>
            <select
              name="lawyerId"
              required
              value={selectedLawyer}
              onChange={(e) => setSelectedLawyer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a lawyer</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.name} - {lawyer.lawyerProfile?.specialization || "General"}
                  {lawyer.lawyerProfile?.hourlyRate && ` ($${lawyer.lawyerProfile.hourlyRate}/hr)`}
                </option>
              ))}
            </select>
            {lawyers.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium mb-1">Lawyer Details:</p>
                {lawyers.map((lawyer) => (
                  <div key={lawyer.id} className="mb-2 p-2 bg-gray-50 rounded">
                    <p className="font-medium">{lawyer.name}</p>
                    {lawyer.lawyerProfile && (
                      <>
                        <p className="text-xs">
                          {lawyer.lawyerProfile.specialization} • {lawyer.lawyerProfile.experience} years exp
                        </p>
                        {lawyer.lawyerProfile.availability && (
                          <p className="text-xs text-indigo-600">
                            Available: {lawyer.lawyerProfile.availability}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              name="title"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                name="startTime"
                type="datetime-local"
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                name="endTime"
                type="datetime-local"
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">💡 Tip:</span> Check the lawyer's availability hours above before selecting a time. 
              The system will verify if the time slot is available.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Booking..." : "Book Appointment"}
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

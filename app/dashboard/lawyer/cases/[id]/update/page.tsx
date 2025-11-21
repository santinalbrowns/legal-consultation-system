"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

type Case = {
  id: string
  title: string
  description: string
  status: string
  progress: number
  client: {
    name: string
  }
}

export default function UpdateCasePage() {
  const router = useRouter()
  const params = useParams()
  const caseId = params?.id as string
  
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!caseId) return
    
    fetch(`/api/cases/${caseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setCaseData(data)
        }
      })
      .catch(() => setError("Failed to load case"))
  }, [caseId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      status: formData.get("status") as string,
      progress: parseInt(formData.get("progress") as string),
      updateTitle: formData.get("updateTitle") as string,
      updateDescription: formData.get("updateDescription") as string,
    }

    try {
      const response = await fetch(`/api/cases/${caseId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        setError(error.error || "Failed to update case")
        return
      }

      router.push("/dashboard/lawyer/cases")
      router.refresh()
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/dashboard/lawyer/cases"
            className="text-indigo-600 hover:underline"
          >
            ← Back to Cases
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Update Case</h1>
        <p className="text-gray-600 mb-8">
          Update progress and add timeline entry for: {caseData.title}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Current Case Info</h3>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Client:</span> {caseData.client.name}
          </p>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Status:</span> {caseData.status.replace("_", " ")}
          </p>
          <p className="text-blue-800 text-sm">
            <span className="font-medium">Progress:</span> {caseData.progress}%
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Status *
              </label>
              <select
                name="status"
                required
                defaultValue={caseData.status}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress (%) *
              </label>
              <input
                name="progress"
                type="number"
                required
                min="0"
                max="100"
                defaultValue={caseData.progress}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Timeline Update</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add an update to inform the client about case progress
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Title *
                </label>
                <input
                  name="updateTitle"
                  type="text"
                  required
                  placeholder="e.g., Documents Reviewed, Court Date Set"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Description *
                </label>
                <textarea
                  name="updateDescription"
                  rows={4}
                  required
                  placeholder="Provide details about this update..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Case status and progress will be updated</li>
              <li>Timeline update will be added to case history</li>
              <li>Client will receive a notification</li>
              <li>Client can view the update in their dashboard</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Case"}
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

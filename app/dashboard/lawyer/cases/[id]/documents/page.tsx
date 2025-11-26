"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type Document = {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  createdAt: string
  uploader: {
    id: string
    name: string
    role: string
  }
}

type Case = {
  id: string
  title: string
}

export default function LawyerCaseDocumentsPage() {
  const params = useParams()
  const caseId = params?.id as string

  const [caseData, setCaseData] = useState<Case | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadCaseData()
    loadDocuments()
  }, [caseId])

  const loadCaseData = async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}`)
      const data = await response.json()
      if (data.error) {
        setError(data.error)
      } else {
        setCaseData(data)
      }
    } catch (err) {
      setError("Failed to load case")
    }
  }

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/${caseId}`)
      const data = await response.json()
      if (!response.ok) {
        setError(data.error)
      } else {
        setDocuments(data)
      }
    } catch (err) {
      setError("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    formData.append("caseId", caseId)

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Upload failed")
      } else {
        setSuccess("Document uploaded successfully!")
        loadDocuments()
        ;(e.target as HTMLFormElement).reset()
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      setError("Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(
        `/api/documents/${caseId}?documentId=${documentId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        setSuccess("Document deleted successfully")
        loadDocuments()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete document")
      }
    } catch (err) {
      setError("Failed to delete document")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("word") || fileType.includes("document")) return "📝"
    if (fileType.includes("image")) return "🖼️"
    return "📎"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Case Documents</h1>
            <Link
              href={`/dashboard/lawyer/cases/${caseId}`}
              className="text-gray-700 hover:text-indigo-600"
            >
              ← Back to Case
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {caseData && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{caseData.title}</h2>
            <p className="text-gray-600">Manage documents for this case</p>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                type="file"
                name="file"
                required
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, Word, Images, Text (Max 10MB)
              </p>
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Documents ({documents.length})</h3>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No documents uploaded yet
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-4xl">{getFileIcon(doc.fileType)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{doc.fileName}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>
                            Uploaded by {doc.uploader.name} ({doc.uploader.role})
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-lg hover:bg-indigo-50"
                      >
                        View
                      </a>
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName}
                        className="text-green-600 hover:text-green-800 px-3 py-1 rounded-lg hover:bg-green-50"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

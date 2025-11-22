import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "LAWYER") {
    redirect("/login")
  }

  const { id } = await params

  const caseData = await prisma.case.findUnique({
    where: { id },
    include: {
      client: {
        select: { name: true, email: true, phone: true },
      },
      lawyer: {
        select: { name: true, email: true },
      },
      appointment: {
        select: {
          title: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
      updates: {
        orderBy: { createdAt: "desc" },
      },
      documents: true,
      payment: true,
    },
  })

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Not Found</h2>
          <p className="text-gray-600 mb-4">The case you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/lawyer/cases"
            className="text-indigo-600 hover:underline"
          >
            Back to Cases
          </Link>
        </div>
      </div>
    )
  }

  if (caseData.lawyerId !== session.user.id) {
    redirect("/dashboard/lawyer/cases")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">LegalConsult</h1>
            <Link href="/dashboard/lawyer/cases" className="text-gray-700 hover:text-indigo-600">
              ← Back to Cases
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{caseData.title}</h2>
            <p className="text-gray-600">{caseData.description}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              caseData.status === "OPEN"
                ? "bg-blue-100 text-blue-800"
                : caseData.status === "IN_PROGRESS"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {caseData.status.replace("_", " ")}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Progress</h3>
            <div className="mb-2">
              <p className="text-3xl font-bold text-indigo-600">{caseData.progress}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${caseData.progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Timeline Updates</h3>
            <p className="text-3xl font-bold text-green-600">{caseData.updates.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Documents</h3>
            <p className="text-3xl font-bold text-blue-600">{caseData.documents.length}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Case Timeline</h3>
                <Link
                  href={`/dashboard/lawyer/cases/${caseData.id}/update`}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                >
                  Add Update
                </Link>
              </div>

              {caseData.updates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No updates yet</p>
              ) : (
                <div className="space-y-4">
                  {caseData.updates.map((update, index) => (
                    <div
                      key={update.id}
                      className="border-l-4 border-indigo-500 pl-4 py-3 bg-gray-50 rounded-r"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{update.title}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{update.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(update.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Related Appointment</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">{caseData.appointment.title}</p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Start Time</p>
                    <p className="font-medium">
                      {new Date(caseData.appointment.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">End Time</p>
                    <p className="font-medium">
                      {new Date(caseData.appointment.endTime).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className="inline-block px-2 py-1 bg-gray-200 rounded text-xs">
                      {caseData.appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Client Information</h3>
                <Link
                  href={`/dashboard/messages?userId=${caseData.client.id}`}
                  className="text-indigo-600 hover:underline text-sm"
                >
                  💬 Message
                </Link>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{caseData.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-sm">{caseData.client.email}</p>
                </div>
                {caseData.client.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{caseData.client.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Payment Information</h3>
              {caseData.payment ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-lg">${caseData.payment.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
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
                  {caseData.payment.paymentMethod && (
                    <div>
                      <p className="text-sm text-gray-500">Method</p>
                      <p className="font-medium">{caseData.payment.paymentMethod}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No payment information</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Case Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(caseData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {new Date(caseData.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Case ID</p>
                  <p className="font-mono text-xs text-gray-600">{caseData.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

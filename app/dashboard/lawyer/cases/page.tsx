import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function LawyerCasesPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "LAWYER") {
    redirect("/login")
  }

  const cases = await prisma.case.findMany({
    where: { lawyerId: session.user.id },
    include: {
      client: {
        select: { name: true, email: true },
      },
      updates: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      documents: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">LegalConsult</h1>
            <Link href="/dashboard/lawyer" className="text-gray-700 hover:text-indigo-600">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Cases</h2>
          <p className="text-gray-600">Manage and track your client cases</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Open</p>
              <p className="text-2xl font-bold text-blue-600">
                {cases.filter((c) => c.status === "OPEN").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {cases.filter((c) => c.status === "IN_PROGRESS").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Closed</p>
              <p className="text-2xl font-bold text-gray-600">
                {cases.filter((c) => c.status === "CLOSED").length}
              </p>
            </div>
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No cases yet</p>
            <p className="text-gray-400 text-sm">
              Create cases from your appointments to start managing them
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {caseItem.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Client: {caseItem.client.name}
                    </p>
                    <p className="text-gray-500 text-sm">{caseItem.description}</p>
                  </div>
                  <span
                    className={`ml-4 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                      caseItem.status === "OPEN"
                        ? "bg-blue-100 text-blue-800"
                        : caseItem.status === "IN_PROGRESS"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {caseItem.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{caseItem.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${caseItem.progress}%` }}
                    />
                  </div>
                </div>

                {caseItem.updates.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Recent Updates</h4>
                    <div className="space-y-2">
                      {caseItem.updates.map((update) => (
                        <div key={update.id} className="border-l-2 border-indigo-500 pl-3 py-1">
                          <p className="font-medium text-sm">{update.title}</p>
                          <p className="text-xs text-gray-600">{update.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(update.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
                  <div>
                    <p className="text-gray-500">Documents</p>
                    <p className="font-medium">{caseItem.documents.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Updates</p>
                    <p className="font-medium">{caseItem.updates.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment</p>
                    <p className="font-medium">{caseItem.payment?.status || "Not Set"}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-3">
                  <Link
                    href={`/dashboard/lawyer/cases/${caseItem.id}/update`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Update Case
                  </Link>
                  <Link
                    href={`/dashboard/lawyer/cases/${caseItem.id}`}
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

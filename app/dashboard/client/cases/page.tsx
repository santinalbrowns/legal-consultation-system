import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function CasesPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/login")
  }

  const cases = await prisma.case.findMany({
    where: { clientId: session.user.id },
    include: {
      lawyer: {
        select: { name: true, email: true },
      },
      updates: {
        orderBy: { createdAt: "desc" },
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
            <Link href="/dashboard/client" className="text-gray-700 hover:text-indigo-600">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Cases</h2>
          <p className="text-gray-600">Track the progress of your legal cases</p>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No cases yet</p>
            <p className="text-gray-400 text-sm">
              Cases are created after your appointments are confirmed
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {caseItem.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Lawyer: {caseItem.lawyer.name}
                    </p>
                    <p className="text-gray-500 text-sm">{caseItem.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Updates</h4>
                    <div className="space-y-3">
                      {caseItem.updates.slice(0, 3).map((update) => (
                        <div key={update.id} className="border-l-2 border-indigo-500 pl-4">
                          <p className="font-medium text-sm">{update.title}</p>
                          <p className="text-sm text-gray-600">{update.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(update.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Documents</p>
                    <p className="font-medium">{caseItem.documents.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Updates</p>
                    <p className="font-medium">{caseItem.updates.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <p className="font-medium">
                      {caseItem.payment?.status || "Not Set"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  Created: {new Date(caseItem.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ManageLawyersPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const lawyers = await prisma.user.findMany({
    where: { role: "LAWYER" },
    include: {
      lawyerProfile: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">LegalConsult Admin</h1>
            <Link href="/dashboard/admin" className="text-gray-700 hover:text-indigo-600">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Manage Lawyers</h2>
            <p className="text-gray-600">Add and manage lawyer profiles</p>
          </div>
          <Link
            href="/dashboard/admin/lawyers/add"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            + Add New Lawyer
          </Link>
        </div>

        {lawyers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No lawyers in the system</p>
            <Link
              href="/dashboard/admin/lawyers/add"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Add First Lawyer
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {lawyers.map((lawyer) => (
              <div key={lawyer.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {lawyer.name}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium">{lawyer.email}</p>
                      </div>
                      {lawyer.phone && (
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p className="font-medium">{lawyer.phone}</p>
                        </div>
                      )}
                      {lawyer.lawyerProfile && (
                        <>
                          <div>
                            <p className="text-gray-500">Specialization</p>
                            <p className="font-medium">{lawyer.lawyerProfile.specialization}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Experience</p>
                            <p className="font-medium">{lawyer.lawyerProfile.experience} years</p>
                          </div>
                          <div>
                            <p className="text-gray-500">License Number</p>
                            <p className="font-medium">{lawyer.lawyerProfile.licenseNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Hourly Rate</p>
                            <p className="font-medium">${lawyer.lawyerProfile.hourlyRate}</p>
                          </div>
                        </>
                      )}
                    </div>
                    {lawyer.lawyerProfile?.bio && (
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm">Bio</p>
                        <p className="text-gray-700">{lawyer.lawyerProfile.bio}</p>
                      </div>
                    )}
                    {lawyer.lawyerProfile?.availability && (
                      <div className="mt-2">
                        <p className="text-gray-500 text-sm">Availability</p>
                        <p className="text-gray-700">{lawyer.lawyerProfile.availability}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  Joined: {new Date(lawyer.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

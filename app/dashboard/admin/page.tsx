import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { signOut } from "@/lib/auth"

async function getAdminStats() {
  const [totalUsers, totalLawyers, totalClients, totalAppointments, totalCases] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "LAWYER" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.appointment.count(),
    prisma.case.count(),
  ])

  return { totalUsers, totalLawyers, totalClients, totalAppointments, totalCases }
}

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const stats = await getAdminStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">LegalConsult Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {session.user.name}</span>
              <form
                action={async () => {
                  "use server"
                  await signOut()
                }}
              >
                <button className="text-red-600 hover:text-red-700">Logout</button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">Manage users, lawyers, and system settings</p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Lawyers</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalLawyers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Clients</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalClients}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Appointments</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.totalAppointments}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Cases</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalCases}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/admin/lawyers"
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Lawyers</h3>
                <p className="text-gray-600">Add, edit, or remove lawyer profiles</p>
              </div>
              <div className="text-4xl">👨‍⚖️</div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/users"
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Users</h3>
                <p className="text-gray-600">View and manage all system users</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/appointments"
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">View Appointments</h3>
                <p className="text-gray-600">Monitor all consultation appointments</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/cases"
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">View Cases</h3>
                <p className="text-gray-600">Monitor all legal cases in the system</p>
              </div>
              <div className="text-4xl">💼</div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}

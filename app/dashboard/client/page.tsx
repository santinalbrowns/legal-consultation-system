import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { signOut } from "@/lib/auth"

async function getClientData(userId: string) {
  const [appointments, cases, notifications] = await Promise.all([
    prisma.appointment.findMany({
      where: { clientId: userId },
      include: { lawyer: { select: { name: true } } },
      orderBy: { startTime: "desc" },
      take: 5,
    }),
    prisma.case.findMany({
      where: { clientId: userId },
      include: { lawyer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  return { appointments, cases, notifications }
}

export default async function ClientDashboard() {
  const session = await auth()

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/login")
  }

  const { appointments, cases, notifications } = await getClientData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">LegalConsult</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {session.user.name}</span>
              <Link href="/dashboard/messages" className="text-indigo-600 hover:text-indigo-700">
                Messages
              </Link>
              <Link href="/dashboard/client/profile" className="text-indigo-600 hover:text-indigo-700">
                Profile
              </Link>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Client Dashboard</h2>
          <p className="text-gray-600">Manage your appointments and cases</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Appointments</h3>
            <p className="text-3xl font-bold text-indigo-600">{appointments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Cases</h3>
            <p className="text-3xl font-bold text-green-600">{cases.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Notifications</h3>
            <p className="text-3xl font-bold text-orange-600">{notifications.length}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Recent Appointments</h3>
              <Link href="/dashboard/client/appointments" className="text-indigo-600 hover:underline">
                View All
              </Link>
            </div>
            {appointments.length === 0 ? (
              <p className="text-gray-500">No appointments yet</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div key={apt.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <p className="font-medium">{apt.title}</p>
                    <p className="text-sm text-gray-600">with {apt.lawyer.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(apt.startTime).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/dashboard/client/book-appointment"
              className="mt-4 block w-full bg-indigo-600 text-white text-center py-2 rounded-lg hover:bg-indigo-700"
            >
              Book New Appointment
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">My Cases</h3>
              <Link href="/dashboard/client/cases" className="text-indigo-600 hover:underline">
                View All
              </Link>
            </div>
            {cases.length === 0 ? (
              <p className="text-gray-500">No cases yet</p>
            ) : (
              <div className="space-y-3">
                {cases.map((caseItem) => (
                  <div key={caseItem.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <p className="font-medium">{caseItem.title}</p>
                    <p className="text-sm text-gray-600">Lawyer: {caseItem.lawyer.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{caseItem.status}</span>
                      <span className="text-xs text-gray-500">{caseItem.progress}% complete</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

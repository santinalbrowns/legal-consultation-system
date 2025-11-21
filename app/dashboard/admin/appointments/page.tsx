import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AdminAppointmentsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const appointments = await prisma.appointment.findMany({
    include: {
      client: {
        select: { name: true, email: true },
      },
      lawyer: {
        select: { name: true, email: true },
      },
    },
    orderBy: { startTime: "desc" },
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">All Appointments</h2>
          <p className="text-gray-600">Monitor all consultation appointments in the system</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {appointments.filter((a) => a.status === "PENDING").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {appointments.filter((a) => a.status === "CONFIRMED").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-blue-600">
                {appointments.filter((a) => a.status === "COMPLETED").length}
              </p>
            </div>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No appointments in the system</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {appointment.title}
                    </h3>
                    {appointment.description && (
                      <p className="text-gray-600 mb-3">{appointment.description}</p>
                    )}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Client</p>
                        <p className="font-medium">{appointment.client.name}</p>
                        <p className="text-gray-400 text-xs">{appointment.client.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Lawyer</p>
                        <p className="font-medium">{appointment.lawyer.name}</p>
                        <p className="text-gray-400 text-xs">{appointment.lawyer.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Start Time</p>
                        <p className="font-medium">
                          {new Date(appointment.startTime).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">End Time</p>
                        <p className="font-medium">
                          {new Date(appointment.endTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`ml-4 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                      appointment.status === "CONFIRMED"
                        ? "bg-green-100 text-green-800"
                        : appointment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : appointment.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>

                {appointment.meetingLink && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Meeting Link:</p>
                    <a
                      href={appointment.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      {appointment.meetingLink}
                    </a>
                  </div>
                )}

                {appointment.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">Notes:</p>
                    <p className="text-gray-700 text-sm">{appointment.notes}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex gap-2">
                  {appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
                    <Link
                      href={`/dashboard/admin/appointments/${appointment.id}/manage`}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      Manage
                    </Link>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Created: {new Date(appointment.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

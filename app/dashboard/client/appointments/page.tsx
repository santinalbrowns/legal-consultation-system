import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AppointmentsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/login")
  }

  const appointments = await prisma.appointment.findMany({
    where: { clientId: session.user.id },
    include: {
      lawyer: {
        select: { name: true, email: true, phone: true },
      },
    },
    orderBy: { startTime: "desc" },
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h2>
            <p className="text-gray-600">View and manage your consultation appointments</p>
          </div>
          <Link
            href="/dashboard/client/book-appointment"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Book New Appointment
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No appointments yet</p>
            <Link
              href="/dashboard/client/book-appointment"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {appointment.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Lawyer: {appointment.lawyer.name}
                    </p>
                    {appointment.description && (
                      <p className="text-gray-500 text-sm">{appointment.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
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

                <div className="grid md:grid-cols-2 gap-4 text-sm">
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
                  <div>
                    <p className="text-gray-500">Lawyer Email</p>
                    <p className="font-medium">{appointment.lawyer.email}</p>
                  </div>
                  {appointment.lawyer.phone && (
                    <div>
                      <p className="text-gray-500">Lawyer Phone</p>
                      <p className="font-medium">{appointment.lawyer.phone}</p>
                    </div>
                  )}
                </div>

                {appointment.meetingLink && (
                  <div className="mt-4 pt-4 border-t">
                    <a
                      href={appointment.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      Join Video Consultation →
                    </a>
                  </div>
                )}

                {appointment.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-500 text-sm mb-1">Notes:</p>
                    <p className="text-gray-700">{appointment.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

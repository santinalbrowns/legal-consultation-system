import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function LawyerAppointmentsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "LAWYER") {
    redirect("/login")
  }

  const appointments = await prisma.appointment.findMany({
    where: { lawyerId: session.user.id },
    include: {
      client: {
        select: { name: true, email: true, phone: true },
      },
      case: {
        select: { id: true, title: true },
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
            <Link href="/dashboard/lawyer" className="text-gray-700 hover:text-indigo-600">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h2>
          <p className="text-gray-600">Manage your client appointments and create cases</p>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No appointments yet</p>
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
                    <p className="text-gray-600 mb-2">
                      Client: {appointment.client.name}
                    </p>
                    {appointment.description && (
                      <p className="text-gray-500 text-sm mb-3">{appointment.description}</p>
                    )}
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
                        <p className="text-gray-500">Client Email</p>
                        <p className="font-medium">{appointment.client.email}</p>
                      </div>
                      {appointment.client.phone && (
                        <div>
                          <p className="text-gray-500">Client Phone</p>
                          <p className="font-medium">{appointment.client.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
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
                    {appointment.case && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                        Has Case
                      </span>
                    )}
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-500 text-sm mb-1">Notes:</p>
                    <p className="text-gray-700">{appointment.notes}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    {appointment.case ? (
                      <p className="text-sm text-gray-600 flex items-center">
                        Case: <span className="font-medium ml-1">{appointment.case.title}</span>
                      </p>
                    ) : appointment.status !== "CANCELLED" ? (
                      <Link
                        href={`/dashboard/lawyer/appointments/${appointment.id}/create-case`}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        Create Case
                      </Link>
                    ) : null}
                    
                    {appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
                      <>
                        <Link
                          href={`/dashboard/lawyer/appointments/${appointment.id}/manage`}
                          className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Manage
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

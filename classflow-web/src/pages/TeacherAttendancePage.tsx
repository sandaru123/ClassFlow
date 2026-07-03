import { useQuery } from '@tanstack/react-query'
import { getMyTeacherAttendance } from '../features/teacher-portal/api'
import {
  formatDateTime,
  getAttendanceStatusBadgeClasses,
  getAttendanceStatusLabel,
} from '../features/teacher-portal/utils'

export function TeacherAttendancePage() {
  const attendanceQuery = useQuery({
    queryKey: ['teacher-portal', 'attendance'],
    queryFn: getMyTeacherAttendance,
  })

  if (attendanceQuery.isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </div>
    )
  }

  if (attendanceQuery.isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Attendance records could not be fetched
        </h1>
      </div>
    )
  }

  const attendance = attendanceQuery.data ?? []

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          My Attendance Records
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Review attendance across your class sessions
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This page shows attendance records related to the class sessions assigned
          to your teacher account.
        </p>
      </div>

      {attendance.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            No attendance records found
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Attendance records for your class sessions will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Class Session</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Marked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((record) => (
                  <tr key={record.attendanceId} className="align-top text-sm text-slate-700">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">{record.studentName}</p>
                      <p className="mt-1 text-slate-500">
                        {record.notes || 'No notes recorded'}
                      </p>
                    </td>
                    <td className="px-6 py-5">{record.classSessionTitle}</td>
                    <td className="px-6 py-5">{record.courseName}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getAttendanceStatusBadgeClasses(
                          record.status,
                        )}`}
                      >
                        {getAttendanceStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5">{formatDateTime(record.markedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

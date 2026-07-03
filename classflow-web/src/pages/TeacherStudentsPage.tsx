import { useQuery } from '@tanstack/react-query'
import { getMyTeacherStudents } from '../features/teacher-portal/api'
import { formatDateTime } from '../features/teacher-portal/utils'

export function TeacherStudentsPage() {
  const studentsQuery = useQuery({
    queryKey: ['teacher-portal', 'students'],
    queryFn: getMyTeacherStudents,
  })

  if (studentsQuery.isLoading) {
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

  if (studentsQuery.isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Your student list could not be fetched
        </h1>
      </div>
    )
  }

  const students = studentsQuery.data ?? []

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          My Students
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Review students in your assigned courses
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This page shows students enrolled in the courses assigned to your teacher
          account.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            No enrolled students found
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Students enrolled in your assigned courses will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={`${student.studentId}-${student.courseId}`} className="align-top text-sm text-slate-700">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">
                        {student.firstName} {student.lastName}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p>{student.email || 'No email provided'}</p>
                      <p className="mt-1 text-slate-500">
                        {student.phoneNumber || 'No phone number'}
                      </p>
                    </td>
                    <td className="px-6 py-5">{student.courseName}</td>
                    <td className="px-6 py-5">{formatDateTime(student.enrolledAt)}</td>
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

import { useQuery } from '@tanstack/react-query'
import { getMyTeacherDocuments } from '../features/teacher-portal/api'
import {
  formatDateTime,
  formatFileSize,
  getDocumentVisibilityBadgeClasses,
  getDocumentVisibilityLabel,
} from '../features/teacher-portal/utils'

export function TeacherDocumentsPage() {
  const documentsQuery = useQuery({
    queryKey: ['teacher-portal', 'documents'],
    queryFn: getMyTeacherDocuments,
  })

  if (documentsQuery.isLoading) {
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

  if (documentsQuery.isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Your document list could not be fetched
        </h1>
      </div>
    )
  }

  const documents = documentsQuery.data ?? []

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          My Documents
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Review documents for your class sessions
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This page shows documents uploaded for the class sessions assigned to your
          teacher account.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            No documents found
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Documents uploaded for your class sessions will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Course / Session</th>
                  <th className="px-6 py-4">File Details</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((document) => (
                  <tr key={document.documentId} className="align-top text-sm text-slate-700">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">{document.title}</p>
                      <p className="mt-1 text-slate-500">
                        {document.description || 'No description provided'}
                      </p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                        {document.originalFileName}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p>{document.courseName}</p>
                      <p className="mt-1 text-slate-500">{document.classSessionTitle}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p>{document.fileType || 'Unknown file type'}</p>
                      <p className="mt-1 text-slate-500">
                        {formatFileSize(document.fileSizeInBytes)}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getDocumentVisibilityBadgeClasses(
                          document.visibilityType,
                        )}`}
                      >
                        {getDocumentVisibilityLabel(document.visibilityType)}
                      </span>
                    </td>
                    <td className="px-6 py-5">{formatDateTime(document.uploadedAt)}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          document.isActive
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-slate-100 text-slate-700 ring-slate-200'
                        }`}
                      >
                        {document.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
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

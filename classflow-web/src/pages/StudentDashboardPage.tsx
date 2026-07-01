import { PlaceholderPage } from '../components/PlaceholderPage'

export function StudentDashboardPage() {
  return (
    <PlaceholderPage
      title="Student Dashboard"
      description="The student portal will highlight the next class, recent documents, payment status, and announcements."
      highlights={[
        'Next class and join action',
        'Recent documents and attendance summary',
        'Pending payments and announcements',
      ]}
    />
  )
}

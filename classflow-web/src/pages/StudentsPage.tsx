import { PlaceholderPage } from '../components/PlaceholderPage'

export function StudentsPage() {
  return (
    <PlaceholderPage
      title="Students"
      description="This page is reserved for searchable student tables, student profile links, and course assignment actions."
      highlights={[
        'Student table with filters',
        'Create and edit student forms',
        'Attendance and payment history access',
      ]}
    />
  )
}

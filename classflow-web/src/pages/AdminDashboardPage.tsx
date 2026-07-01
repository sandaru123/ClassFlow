import { PlaceholderPage } from '../components/PlaceholderPage'

export function AdminDashboardPage() {
  return (
    <PlaceholderPage
      title="Admin Dashboard"
      description="Summary cards, recent activity, and operational shortcuts for students, courses, payments, and class schedules will be added here."
      highlights={[
        'Total students and active courses',
        "Today's classes and pending attendance",
        'Pending payments and monthly income',
      ]}
    />
  )
}

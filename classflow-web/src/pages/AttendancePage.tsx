import { PlaceholderPage } from '../components/PlaceholderPage'

export function AttendancePage() {
  return (
    <PlaceholderPage
      title="Attendance"
      description="Teachers and admins will use this screen to mark attendance records for each class session."
      highlights={[
        'Session-based attendance table',
        'Present, absent, late, and excused states',
        'Attendance summary placeholder',
      ]}
    />
  )
}

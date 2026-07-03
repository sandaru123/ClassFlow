export type TeacherResponse = {
  id: number
  firstName: string
  lastName: string
  email: string | null
  hasLoginAccount: boolean
  phoneNumber: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type CreateTeacherRequest = {
  firstName: string
  lastName: string
  email: string | null
  temporaryPassword: string | null
  createLoginAccount: boolean
  phoneNumber: string | null
  address: string | null
}

export type UpdateTeacherRequest = {
  firstName: string
  lastName: string
  email: string | null
  phoneNumber: string | null
  address: string | null
  isActive: boolean
}

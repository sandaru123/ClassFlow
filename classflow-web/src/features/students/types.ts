export type StudentResponse = {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phoneNumber: string | null
  address: string | null
  dateOfBirth: string | null
  hasLoginAccount: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type CreateStudentRequest = {
  firstName: string
  lastName: string
  email: string | null
  temporaryPassword: string | null
  createLoginAccount: boolean
  phoneNumber: string | null
  address: string | null
  dateOfBirth: string | null
}

export type UpdateStudentRequest = {
  firstName: string
  lastName: string
  email: string | null
  phoneNumber: string | null
  address: string | null
  dateOfBirth: string | null
  isActive: boolean
}

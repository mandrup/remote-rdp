import { vi } from 'vitest'

export const __mockGetAllConnections = vi.fn()
export const __mockUpdateAllConnections = vi.fn()
export const __mockGetAllCredentials = vi.fn()
export const __mockCreateCredential = vi.fn()
export const __mockGetWithPassword = vi.fn()
export const __mockCreateConnection = vi.fn()
export const __mockDeleteConnection = vi.fn()
export const __mockUpdate = vi.fn()
export const __mockUpdateAllCredential = vi.fn()

vi.mock('@/storage', () => ({
  Storage: {
    connection: {
      getAll: __mockGetAllConnections,
      updateAll: __mockUpdateAllConnections,
      create: __mockCreateConnection,
      delete: __mockDeleteConnection,
      updateAllCredential: __mockUpdateAllCredential,
    },
    credential: {
      getAll: __mockGetAllCredentials,
      create: __mockCreateCredential,
      getWithPassword: __mockGetWithPassword,
      update: __mockUpdate,
    }
  }
}))
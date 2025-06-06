import { vi } from 'vitest'

export const __mockStorage = {
  connection: {
    getAll: vi.fn(),
    updateAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    updateAllCredential: vi.fn(),
  },
  credential: {
    getAll: vi.fn(),
    create: vi.fn(),
    getWithPassword: vi.fn(),
    update: vi.fn(),
  }
}

vi.mock('@/storage', () => ({
  Storage: __mockStorage
}))
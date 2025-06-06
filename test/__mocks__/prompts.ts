import { vi } from 'vitest'

export const __mockPrompts = {
  connection: {
    select: vi.fn(),
    hostname: vi.fn(),
    group: vi.fn(),
    exportFile: vi.fn(),
    importFile: vi.fn(),
  },
  credential: {
    select: vi.fn(),
    details: vi.fn(),
    editDetails: vi.fn(),
  },
}

vi.mock('@/prompts', () => ({
  Prompts: __mockPrompts,
}))
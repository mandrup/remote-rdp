import { vi } from 'vitest'

const promptMocks = {
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
  Prompts: promptMocks,
}))

export const __mockPrompts = promptMocks
export const __mockConnectionPrompt = promptMocks.connection.select
export const __mockHostnamePrompt = promptMocks.connection.hostname
export const __mockGroupPrompt = promptMocks.connection.group
export const __mockCredentialPrompt = promptMocks.credential.select
export const __mockExportFilePrompt = promptMocks.connection.exportFile
export const __mockImportFilePrompt = promptMocks.connection.importFile
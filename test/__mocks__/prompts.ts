import { vi } from 'vitest'

export const __mockConnectionPrompt = vi.fn()
export const __mockHostnamePrompt = vi.fn()
export const __mockGroupPrompt = vi.fn()
export const __mockCredentialPrompt = vi.fn()
//export const __mockExportPrompt = vi.fn()
export const __mockExportFilePrompt = vi.fn()
export const __mockImportFilePrompt = vi.fn()
export const __mockEditDetailsPrompt = vi.fn()


vi.mock('@/prompts', () => ({
  Prompts: {
    connection: {
      select: __mockConnectionPrompt,
      hostname: __mockHostnamePrompt,
      group: __mockGroupPrompt,
      exportFile: __mockExportFilePrompt,
      importFile: __mockImportFilePrompt
    },
    credential: {
      select: __mockCredentialPrompt,
      details: __mockCredentialPrompt,
      editDetails: __mockEditDetailsPrompt,
    },
  },
}))
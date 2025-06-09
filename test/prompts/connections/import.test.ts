import { promptForImportFile } from '@/prompts/connections/import'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { standardBeforeEach, mockShowOpenDialog } from '../../test-utils'

const mockUri = {
  fsPath: '/file.json',
  scheme: 'file',
  authority: '',
  path: '/file.json',
  query: '',
  fragment: '',
  toString: () => '/file.json',
  with: () => mockUri,
  toJSON: () => ({}),
}
const mockChosenUri = {
  ...mockUri,
  fsPath: '/chosen.json',
  path: '/chosen.json',
  toString: () => '/chosen.json',
  with: () => mockChosenUri,
  toJSON: () => ({}),
}

describe('promptForImportFile', () => {
  beforeEach(() => {
    standardBeforeEach()
    mockShowOpenDialog.mockResolvedValue([mockUri])
  })

  afterEach(() => {
    mockShowOpenDialog.mockReset()
  })

  it('calls showOpenDialog with options', async () => {
    const filters = { 'JSON files': ['json'] }
    await promptForImportFile(filters)
    expect(mockShowOpenDialog).toHaveBeenCalledWith({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters,
    })
  })

  it('returns first uri when file selected', async () => {
    mockShowOpenDialog.mockResolvedValue([mockChosenUri])
    const result = await promptForImportFile()
    expect(result).toEqual(mockChosenUri)
  })

  it('returns undefined when cancelled', async () => {
    mockShowOpenDialog.mockResolvedValue(undefined)
    const result = await promptForImportFile()
    expect(result).toBeUndefined()
  })
})
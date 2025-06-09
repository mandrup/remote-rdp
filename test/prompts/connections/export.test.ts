import { promptForExportFile } from '@/prompts/connections/export'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { standardBeforeEach, mockShowSaveDialog } from '../../test-utils'

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
const mockDefaultUri = {
  ...mockUri,
  fsPath: '/default.json',
  path: '/default.json',
  toString: () => '/default.json',
  with: () => mockDefaultUri,
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

describe('promptForExportFile', () => {
  beforeEach(() => {
    standardBeforeEach()
    mockShowSaveDialog.mockResolvedValue(mockUri)
  })

  afterEach(() => {
    mockShowSaveDialog.mockReset()
  })

  it('calls showSaveDialog with filters and defaultUri', async () => {
    const filters = { 'JSON files': ['json'] }
    const defaultUri = mockDefaultUri
    await promptForExportFile(defaultUri, filters)
    expect(mockShowSaveDialog).toHaveBeenCalledWith({ filters, defaultUri })
  })

  it('returns selected uri', async () => {
    mockShowSaveDialog.mockResolvedValue(mockChosenUri)
    const result = await promptForExportFile()
    expect(result).toEqual(mockChosenUri)
  })

  it('returns undefined when cancelled', async () => {
    mockShowSaveDialog.mockResolvedValue(undefined)
    const result = await promptForExportFile()
    expect(result).toBeUndefined()
  })
})

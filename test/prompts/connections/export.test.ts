import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { promptForExportFile } from '../../../src/prompts/connections/export'

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

vi.mock('vscode', () => ({
  window: {
    showSaveDialog: vi.fn(),
    showWarningMessage: vi.fn(),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn(),
  },
  Uri: {
    file: (path: string) => ({
      ...mockUri,
      fsPath: path,
      path,
      toString: () => path,
      with: () => mockUri,
      toJSON: () => ({}),
    }),
  },
  TreeItem: class {},
}))

describe('promptForExportFile', () => {
  let mockShowSaveDialog: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockShowSaveDialog = vi.spyOn(vscode.window, 'showSaveDialog').mockResolvedValue(mockUri)
  })

  afterEach(() => {
    if (mockShowSaveDialog && typeof mockShowSaveDialog.mockRestore === 'function') {
      mockShowSaveDialog.mockRestore()
    }
  })

  it('calls showSaveDialog with provided filters and defaultUri', async () => {
    const filters = { 'JSON files': ['json'] }
    const defaultUri = mockDefaultUri
    await promptForExportFile(defaultUri, filters)
    expect(mockShowSaveDialog).toHaveBeenCalledWith({ filters, defaultUri })
  })

  it('returns the selected uri from showSaveDialog', async () => {
    mockShowSaveDialog.mockResolvedValue(mockChosenUri)
    const result = await promptForExportFile()
    expect(result).toEqual(mockChosenUri)
  })

  it('returns undefined if user cancels', async () => {
    mockShowSaveDialog.mockResolvedValue(undefined)
    const result = await promptForExportFile()
    expect(result).toBeUndefined()
  })
})

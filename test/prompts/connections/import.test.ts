import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { promptForImportFile } from '../../../src/prompts/connections/import'

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

vi.mock('vscode', () => ({
  window: {
    showOpenDialog: vi.fn(),
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

describe('promptForImportFile', () => {
  let mockShowOpenDialog: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockShowOpenDialog = vi.spyOn(vscode.window, 'showOpenDialog').mockResolvedValue([mockUri])
  })

  afterEach(() => {
    if (mockShowOpenDialog && typeof mockShowOpenDialog.mockRestore === 'function') {
      mockShowOpenDialog.mockRestore()
    }
  })

  it('calls showOpenDialog with correct options', async () => {
    const filters = { 'JSON files': ['json'] }
    await promptForImportFile(filters)
    expect(mockShowOpenDialog).toHaveBeenCalledWith({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters,
    })
  })

  it('returns the first uri if user selects a file', async () => {
    mockShowOpenDialog.mockResolvedValue([mockChosenUri])
    const result = await promptForImportFile()
    expect(result).toEqual(mockChosenUri)
  })

  it('returns undefined if user cancels', async () => {
    mockShowOpenDialog.mockResolvedValue(undefined)
    const result = await promptForImportFile()
    expect(result).toBeUndefined()
  })
})

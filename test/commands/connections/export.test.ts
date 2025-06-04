import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import exportConnectionsCommand from '../../../src/commands/connections/export'

vi.mock('vscode', () => {
  const fs = { writeFile: vi.fn() }
  return {
    commands: { executeCommand: vi.fn() },
    window: {
      showWarningMessage: vi.fn(),
      showInputBox: vi.fn(),
      showErrorMessage: vi.fn()
    },
    workspace: { fs },
    Uri: { file: (path: string) => ({ path }) }
  }
})

vi.mock('../../../src/storage', () => {
  const mockGetAll = vi.fn()
  return {
    Storage: {
      connection: {
        getAll: mockGetAll,
      },
    },
    __mockGetAll: mockGetAll,
  }
})

vi.mock('../../../src/prompts', () => {
  const mockExportFilePrompt = vi.fn()
  return {
    Prompts: {
      connection: {
        exportFile: mockExportFilePrompt,
      },
    },
    __mockExportFilePrompt: mockExportFilePrompt,
  }
})

vi.mock('../../../src/commands/connections', () => ({
  handleCommandError: vi.fn()
}))

describe('exportConnectionsCommand', () => {
  const context = {} as any
  let __mockExportFilePrompt: any, __mockGetAll: any, mockHandleCommandError: any
  let mockWriteFile: any, mockShowWarningMessage: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // @ts-expect-error: mock property only exists in test
    __mockExportFilePrompt = (await import('../../../src/prompts')).__mockExportFilePrompt
    // @ts-expect-error: mock property only exists in test
    __mockGetAll = (await import('../../../src/storage')).__mockGetAll
    // @ts-expect-error: mock property only exists in test
    mockHandleCommandError = (await import('../../../src/commands/connections')).handleCommandError
    mockWriteFile = (vscode.workspace.fs.writeFile as any)
    mockShowWarningMessage = vi.spyOn(vscode.window, 'showWarningMessage').mockResolvedValue(undefined)
  })

  afterEach(() => {
    if (mockShowWarningMessage && typeof mockShowWarningMessage.mockRestore === 'function') {
      mockShowWarningMessage.mockRestore()
    }
  })

  it('exports connections to file', async () => {
    const uri = { path: '/file.json' }
    const connections = [
      { id: '1', hostname: 'h1', group: 'g1', credentialUsername: 'u1' },
      { id: '2', hostname: 'h2', group: 'g2', credentialUsername: 'u2' }
    ]
    __mockGetAll.mockReturnValue(connections)
    __mockExportFilePrompt.mockResolvedValue(uri)

    await exportConnectionsCommand(context)

    expect(__mockExportFilePrompt).toHaveBeenCalledWith(
      { path: 'connections.json' },
      { 'JSON files': ['json'] }
    )
    expect(mockWriteFile).toHaveBeenCalledWith(
      uri,
      Buffer.from(
        JSON.stringify(
          [
            { id: '1', hostname: 'h1', group: 'g1' },
            { id: '2', hostname: 'h2', group: 'g2' }
          ],
          null,
          2
        )
      )
    )
  })

  it('shows warning if no connections', async () => {
    __mockGetAll.mockReturnValue([])
    await exportConnectionsCommand(context)
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No connections available.')
    expect(__mockExportFilePrompt).not.toHaveBeenCalled()
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('does nothing if export prompt is cancelled', async () => {
    __mockGetAll.mockReturnValue([{ id: '1', hostname: 'h1', group: 'g1' }])
    __mockExportFilePrompt.mockResolvedValue(undefined)
    await exportConnectionsCommand(context)
    expect(mockWriteFile).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockGetAll.mockImplementation(() => { throw error })
    await exportConnectionsCommand(context)
    expect(mockHandleCommandError).toHaveBeenCalledWith('export connection', error)
  })
})
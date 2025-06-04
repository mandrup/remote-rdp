import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import deleteConnectionCommand from '../../../src/commands/connections/delete'
import { COMMAND_IDS } from '../../../src/constants'

vi.mock('vscode', () => ({
  commands: { executeCommand: vi.fn() },
  window: {
    showWarningMessage: vi.fn(),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  TreeItem: class {},
}))

vi.mock('../../../src/storage', () => {
  const mockGetAll = vi.fn()
  const mockUpdateAll = vi.fn()
  return {
    Storage: {
      connection: {
        getAll: mockGetAll,
        updateAll: mockUpdateAll,
      },
    },
    __mockGetAll: mockGetAll,
    __mockUpdateAll: mockUpdateAll,
  }
})

vi.mock('../../../src/prompts', () => {
  const mockSelectPrompt = vi.fn()
  return {
    Prompts: {
      connection: {
        select: mockSelectPrompt,
      },
    },
    __mockSelectPrompt: mockSelectPrompt,
  }
})

vi.mock('../../../src/commands/connections', () => ({
  handleCommandError: vi.fn()
}))

describe('deleteConnectionCommand', () => {
  const context = {} as any
  let __mockGetAll: any, __mockUpdateAll: any, __mockSelectPrompt: any, mockHandleCommandError: any
  let mockExecuteCommand: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // @ts-expect-error: mock property only exists in test
    __mockGetAll = (await import('../../../src/storage')).__mockGetAll
    // @ts-expect-error: mock property only exists in test
    __mockUpdateAll = (await import('../../../src/storage')).__mockUpdateAll
    // @ts-expect-error: mock property only exists in test
    __mockSelectPrompt = (await import('../../../src/prompts')).__mockSelectPrompt
    // @ts-expect-error: mock property only exists in test
    mockHandleCommandError = (await import('../../../src/commands/connections')).handleCommandError
    mockExecuteCommand = vi.spyOn(vscode.commands, 'executeCommand').mockResolvedValue(undefined)
  })

  afterEach(() => {
    if (mockExecuteCommand && typeof mockExecuteCommand.mockRestore === 'function') {
      mockExecuteCommand.mockRestore()
    }
  })

  it('deletes a connection when one is selected', async () => {
    const fakeConnection = { id: '1' }
    const fakeConnections = [fakeConnection, { id: '2' }]
    __mockSelectPrompt.mockResolvedValue(fakeConnection)
    __mockGetAll.mockReturnValue(fakeConnections)
    __mockUpdateAll.mockResolvedValue(undefined)

    await deleteConnectionCommand(context)

    expect(__mockSelectPrompt).toHaveBeenCalledWith(context, undefined)
    expect(__mockGetAll).toHaveBeenCalledWith(context)
    expect(__mockUpdateAll).toHaveBeenCalledWith(context, [{ id: '2' }])
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
  })

  it('does nothing if no connection is selected', async () => {
    __mockSelectPrompt.mockResolvedValue(undefined)
    await deleteConnectionCommand(context)
    expect(__mockGetAll).not.toHaveBeenCalled()
    expect(__mockUpdateAll).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockSelectPrompt.mockRejectedValue(error)
    await deleteConnectionCommand(context)
    expect(mockHandleCommandError).toHaveBeenCalledWith('remove connection', error)
  })
})

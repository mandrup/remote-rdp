import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockExtensionContext, __mockPrompts, __mockStorage, standardBeforeEach } from '../../test-utils'
import * as vscode from 'vscode'

const mockHandleCommandError = vi.hoisted(() => vi.fn())
const mockIsConnectionModelArray = vi.hoisted(() => vi.fn())

vi.mock('@/commands/shared', () => ({
  handleCommandError: mockHandleCommandError,
  refreshConnections: vi.fn().mockImplementation(async () => {
    await (await import('vscode')).commands.executeCommand('remote-rdp:connection:refresh')
  }),
  validatePromptResult: (result: any) => result !== undefined
}))

vi.mock('@/models/connection', () => ({
  isConnectionModelArray: mockIsConnectionModelArray
}))

import importConnectionsCommand from '@/commands/connections/import'

const mockReadFile = vscode.workspace.fs.readFile as any
const mockShowErrorMessage = vscode.window.showErrorMessage as any

describe('importConnectionsCommand', () => {
  const context = createMockExtensionContext()

  beforeEach(() => {
    standardBeforeEach()
    vi.clearAllMocks()
    mockReadFile.mockResolvedValue(Buffer.from('[]'))
  })

  describe('successful import', () => {
    const mockUri = { path: '/file.json' }
    const mockImportedConnections = [
      { id: '1', hostname: 'h1', group: 'g1' },
      { id: '2', hostname: 'h2', group: 'g2' }
    ]
    const mockExistingConnections = [
      { id: '1', hostname: 'old', group: 'g1' },
      { id: '3', hostname: 'h3', group: 'g3' }
    ]

    beforeEach(() => {
      __mockPrompts.connection.importFile.mockResolvedValue(mockUri)
      mockReadFile.mockResolvedValue(Buffer.from(JSON.stringify(mockImportedConnections)))
      mockIsConnectionModelArray.mockReturnValue(true)
      __mockStorage.connection.getAll.mockReturnValue(mockExistingConnections)
      __mockStorage.connection.updateAll.mockResolvedValue(undefined)
    })

    it('imports and merges connections', async () => {
      await importConnectionsCommand(context)
      expect(__mockPrompts.connection.importFile).toHaveBeenCalled()
      expect(mockReadFile).toHaveBeenCalledWith(mockUri)
      expect(__mockStorage.connection.updateAll).toHaveBeenCalledWith(context, [
        { id: '1', hostname: 'h1', group: 'g1', modifiedAt: expect.any(String) },
        { id: '3', hostname: 'h3', group: 'g3' },
        { id: '2', hostname: 'h2', group: 'g2' }
      ])
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('remote-rdp:connection:refresh')
    })
  })

  describe('cancelled file prompt', () => {
    beforeEach(() => {
      __mockPrompts.connection.importFile.mockResolvedValue(undefined)
    })

    it('does nothing', async () => {
      await importConnectionsCommand(context)
      expect(mockReadFile).not.toHaveBeenCalled()
      expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
    })
  })

  describe('invalid file content', () => {
    const mockUri = { path: '/file.json' }

    beforeEach(() => {
      __mockPrompts.connection.importFile.mockResolvedValue(mockUri)
    })

    it('shows error for invalid JSON', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('not json'))
      await importConnectionsCommand(context)
      expect(mockShowErrorMessage).toHaveBeenCalledWith('Invalid JSON file.')
      expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
    })

    it('shows error for invalid connection array', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('[]'))
      mockIsConnectionModelArray.mockReturnValue(false)
      await importConnectionsCommand(context)
      expect(mockShowErrorMessage).toHaveBeenCalledWith('Invalid JSON file.')
      expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('handles errors with handleCommandError', async () => {
      const error = new Error('fail')
      __mockPrompts.connection.importFile.mockRejectedValue(error)
      await importConnectionsCommand(context)
      expect(mockHandleCommandError).toHaveBeenCalledWith('import connection', error)
    })
  })
})
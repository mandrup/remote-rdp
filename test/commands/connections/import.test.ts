let mockHandleCommandError: ReturnType<typeof vi.fn>
vi.mock('@/commands/index', () => ({
  handleCommandError: (...args: any[]) => mockHandleCommandError(...args)
}))

import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import importConnectionsCommand from '@/commands/connections/import'
import * as vscode from 'vscode'
import { __mockImportFilePrompt } from '#mocks/prompts'
import { __mockGetAllConnections, __mockUpdateAllConnections } from '#mocks/storage'

const mockReadFile = vscode.workspace.fs.readFile as any

let mockIsConnectionModelArray: ReturnType<typeof vi.fn>

vi.mock('@/models/connection', () => ({
  isConnectionModelArray: (...args: any[]) => mockIsConnectionModelArray(...args)
}))

describe('importConnectionsCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsConnectionModelArray = vi.fn()
    mockHandleCommandError = vi.fn()
  })

  describe('when importing connections', () => {
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
      __mockImportFilePrompt.mockResolvedValue(mockUri)
      mockReadFile.mockResolvedValue(Buffer.from(JSON.stringify(mockImportedConnections)))
      mockIsConnectionModelArray.mockReturnValue(true)
      __mockGetAllConnections.mockReturnValue(mockExistingConnections)
      __mockUpdateAllConnections.mockResolvedValue(undefined)
    })

    it('imports and merges connections from file', async () => {
      await importConnectionsCommand(context)
      expect(__mockImportFilePrompt).toHaveBeenCalled()
      expect(mockReadFile).toHaveBeenCalledWith(mockUri)
      expect(__mockUpdateAllConnections).toHaveBeenCalledWith(context, [
        { id: '1', hostname: 'h1', group: 'g1' },
        { id: '3', hostname: 'h3', group: 'g3' },
        { id: '2', hostname: 'h2', group: 'g2' }
      ])
      expect(vscode.commands.executeCommand).toHaveBeenCalled()
    })
  })

  describe('when file prompt is cancelled', () => {
    beforeEach(() => {
      __mockImportFilePrompt.mockResolvedValue(undefined)
    })

    it('does nothing', async () => {
      await importConnectionsCommand(context)
      expect(mockReadFile).not.toHaveBeenCalled()
      expect(__mockUpdateAllConnections).not.toHaveBeenCalled()
    })
  })

  describe('when file is invalid', () => {
    const mockUri = { path: '/file.json' }

    beforeEach(() => {
      __mockImportFilePrompt.mockResolvedValue(mockUri)
    })

    it('shows error if file is invalid JSON', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('not json'))
      await importConnectionsCommand(context)
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Invalid JSON file.')
      expect(__mockUpdateAllConnections).not.toHaveBeenCalled()
    })

    it('shows error if file is not a valid connection array', async () => {
      mockReadFile.mockResolvedValue(Buffer.from('[]'))
      mockIsConnectionModelArray.mockReturnValue(false)
      await importConnectionsCommand(context)
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Invalid JSON file.')
      expect(__mockUpdateAllConnections).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('handles errors with handleCommandError', async () => {
      const error = new Error('fail')
      __mockImportFilePrompt.mockRejectedValue(error)
      mockHandleCommandError.mockClear()
      await expect(importConnectionsCommand(context)).resolves.toBeUndefined()
      expect(mockHandleCommandError).toHaveBeenCalledWith('import connection', error)
    })
  })
})
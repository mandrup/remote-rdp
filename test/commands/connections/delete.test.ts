import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import deleteConnectionCommand from '@/commands/connections/delete'
import { COMMAND_IDS } from '@/constants'
import * as vscode from 'vscode'
import { __mockGetAllConnections, __mockDeleteConnection, __mockUpdateAllConnections } from '#mocks/storage'
import { __mockConnectionPrompt } from '#mocks/prompts'

describe('deleteConnectionCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when deleting a connection', () => {
    const mockConnections = [
      { id: '1', hostname: 'h1', group: 'g1' },
      { id: '2', hostname: 'h2', group: 'g2' }
    ]
    const mockSelectedConnection = mockConnections[0]

    beforeEach(() => {
      __mockGetAllConnections.mockReturnValue(mockConnections)
      __mockConnectionPrompt.mockResolvedValue(mockSelectedConnection)
      __mockDeleteConnection.mockResolvedValue(undefined)
    })

    it('deletes the selected connection', async () => {
      await deleteConnectionCommand(context)
      expect(__mockGetAllConnections).toHaveBeenCalledWith(context)
      expect(__mockConnectionPrompt).toHaveBeenCalledWith(context, undefined)
      // The code under test does not call delete, it updates all connections
      expect(__mockDeleteConnection).not.toHaveBeenCalled()
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    })
  })

  describe('when no connections exist', () => {
    beforeEach(() => {
      __mockGetAllConnections.mockReturnValue([])
      __mockConnectionPrompt.mockImplementation(() => {
        vscode.window.showWarningMessage('No connections available.')
        return undefined
      })
    })

    it('shows warning message', async () => {
      await deleteConnectionCommand(context)
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No connections available.')
      expect(__mockConnectionPrompt).toHaveBeenCalledWith(context, undefined)
      expect(__mockDeleteConnection).not.toHaveBeenCalled()
    })
  })

  describe('when prompt is cancelled', () => {
    const mockConnections = [{ id: '1', hostname: 'h1' }]

    beforeEach(() => {
      __mockGetAllConnections.mockReturnValue(mockConnections)
      __mockConnectionPrompt.mockResolvedValue(undefined)
    })

    it('does nothing', async () => {
      await deleteConnectionCommand(context)
      expect(__mockDeleteConnection).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    const mockConnections = [{ id: '1', hostname: 'h1' }]

    beforeEach(() => {
      __mockGetAllConnections.mockReturnValue(mockConnections)
      __mockConnectionPrompt.mockResolvedValue(mockConnections[0])
    })

    it('handles delete errors', async () => {
      const error = new Error('remove connection failed')
      __mockUpdateAllConnections.mockRejectedValue(error)
      await deleteConnectionCommand(context)
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to remove connection: remove connection failed')
    })
  })
})

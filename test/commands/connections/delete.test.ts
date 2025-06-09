import { describe, it, expect, vi, beforeEach } from 'vitest'
import deleteConnectionCommand from '@/commands/connections/delete'
import { COMMAND_IDS } from '@/constants'
import * as vscode from 'vscode'
import { __mockStorage, __mockPrompts, standardBeforeEach } from '../../test-utils'

describe('deleteConnectionCommand', () => {
  const context = {} as any

  beforeEach(standardBeforeEach)

  describe('successful deletion', () => {
    const mockConnections = [
      { id: '1', hostname: 'h1', group: 'g1' },
      { id: '2', hostname: 'h2', group: 'g2' }
    ]
    const mockSelectedConnection = mockConnections[0]

    beforeEach(() => {
      __mockStorage.connection.getAll.mockReturnValue(mockConnections)
      __mockPrompts.connection.select.mockResolvedValue(mockSelectedConnection)
      __mockStorage.connection.delete.mockResolvedValue(undefined)
    })

    it('deletes the selected connection', async () => {
      await deleteConnectionCommand(context)
      expect(__mockStorage.connection.getAll).toHaveBeenCalledWith(context)
      expect(__mockPrompts.connection.select).toHaveBeenCalledWith(context, undefined)
      expect(__mockStorage.connection.delete).not.toHaveBeenCalled()
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    })
  })

  describe('no connections available', () => {
    beforeEach(() => {
      __mockStorage.connection.getAll.mockReturnValue([])
      __mockPrompts.connection.select.mockImplementation(() => {
        vscode.window.showWarningMessage('No connections available.')
        return undefined
      })
    })

    it('shows warning message', async () => {
      await deleteConnectionCommand(context)
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No connections available.')
      expect(__mockPrompts.connection.select).toHaveBeenCalledWith(context, undefined)
      expect(__mockStorage.connection.delete).not.toHaveBeenCalled()
    })
  })

  describe('cancelled prompt', () => {
    const mockConnections = [{ id: '1', hostname: 'h1' }]

    beforeEach(() => {
      __mockStorage.connection.getAll.mockReturnValue(mockConnections)
      __mockPrompts.connection.select.mockResolvedValue(undefined)
    })

    it('does nothing', async () => {
      await deleteConnectionCommand(context)
      expect(__mockStorage.connection.delete).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    const mockConnections = [{ id: '1', hostname: 'h1' }]

    beforeEach(() => {
      __mockStorage.connection.getAll.mockReturnValue(mockConnections)
      __mockPrompts.connection.select.mockResolvedValue(mockConnections[0])
    })

    it('handles delete errors', async () => {
      const error = new Error('remove connection failed')
      __mockStorage.connection.updateAll.mockRejectedValue(error)
      await deleteConnectionCommand(context)
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to remove connection: remove connection failed')
    })
  })
})

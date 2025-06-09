import { describe, it, expect, vi, beforeEach } from 'vitest'
import { standardBeforeEach, __mockStorage, __mockPrompts } from '../../test-utils'
import exportConnectionsCommand from '@/commands/connections/export'
import * as vscode from 'vscode'

const mockWriteFile = vscode.workspace.fs.writeFile as any

describe('exportConnectionsCommand', () => {
  const context = {} as any

  beforeEach(() => {
    standardBeforeEach()
  })

  describe('successful export', () => {
    const mockConnections = [
      { id: '1', hostname: 'h1', group: 'g1' },
      { id: '2', hostname: 'h2', group: 'g2' }
    ]
    const mockUri = { path: '/file.json' }

    beforeEach(() => {
      __mockStorage.connection.getAll.mockReturnValue(mockConnections)
      __mockPrompts.connection.exportFile.mockResolvedValue(mockUri)
      mockWriteFile.mockResolvedValue(undefined)
    })

    it('exports connections to file', async () => {
      await exportConnectionsCommand(context)
      expect(__mockPrompts.connection.exportFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fsPath: 'connections.json',
          scheme: 'file',
          path: 'connections.json'
        }),
        { 'JSON files': ['json'] }
      )
      
      const expectedExportData = mockConnections.map(({ id, hostname, group }) => ({ id, hostname, group }))
      expect(mockWriteFile).toHaveBeenCalledWith(
        mockUri,
        Buffer.from(JSON.stringify(expectedExportData, null, 2))
      )
    })
  })

  describe('no connections available', () => {
    beforeEach(() => {
      __mockStorage.connection.getAll.mockReturnValue([])
      __mockPrompts.connection.exportFile.mockImplementation(() => {
        vscode.window.showWarningMessage('No connections available.')
        return undefined
      })
    })

    it('shows warning message', async () => {
      await exportConnectionsCommand(context)
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No connections available.')
      expect(__mockPrompts.connection.exportFile).not.toHaveBeenCalled()
      expect(mockWriteFile).not.toHaveBeenCalled()
    })
  })

  describe('cancelled export', () => {
    const mockConnections = [{ id: '1', hostname: 'h1' }]

    beforeEach(() => {
      __mockStorage.connection.getAll.mockReturnValue(mockConnections)
      __mockPrompts.connection.exportFile.mockResolvedValue(undefined)
    })

    it('does nothing', async () => {
      await exportConnectionsCommand(context)
      expect(mockWriteFile).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    const mockConnections = [{ id: '1', hostname: 'h1' }]

    beforeEach(() => {
      __mockStorage.connection.getAll.mockReturnValue(mockConnections)
      __mockPrompts.connection.exportFile.mockResolvedValue({ path: '/file.json' })
    })

    it('handles write errors', async () => {
      const error = new Error('write failed')
      mockWriteFile.mockRejectedValue(error)
      await exportConnectionsCommand(context)
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to export connection: write failed')
    })
  })
})
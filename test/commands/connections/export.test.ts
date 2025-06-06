import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import exportConnectionsCommand from '@/commands/connections/export'
import * as vscode from 'vscode'
import { __mockGetAllConnections } from '#mocks/storage'
import { __mockExportFilePrompt } from '#mocks/prompts'

const mockWriteFile = vscode.workspace.fs.writeFile as any

describe('exportConnectionsCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when exporting connections', () => {
    const mockConnections = [
      { id: '1', hostname: 'h1', group: 'g1' },
      { id: '2', hostname: 'h2', group: 'g2' }
    ]
    const mockUri = { path: '/file.json' }

    beforeEach(() => {
      __mockGetAllConnections.mockReturnValue(mockConnections)
      __mockExportFilePrompt.mockResolvedValue(mockUri)
      mockWriteFile.mockResolvedValue(undefined)
    })

    it('exports connections to file', async () => {
      await exportConnectionsCommand(context)
      expect(__mockExportFilePrompt).toHaveBeenCalledWith(
        vscode.Uri.file('connections.json'),
        { 'JSON files': ['json'] }
      )
      expect(mockWriteFile).toHaveBeenCalledWith(
        mockUri,
        Buffer.from(JSON.stringify(mockConnections, null, 2))
      )
    })
  })

  describe('when no connections exist', () => {
    beforeEach(() => {
      __mockGetAllConnections.mockReturnValue([])
      __mockExportFilePrompt.mockImplementation(() => {
        vscode.window.showWarningMessage('No connections available.')
        return undefined
      })
    })

    it('shows warning message', async () => {
      await exportConnectionsCommand(context)
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No connections available.')
      expect(__mockExportFilePrompt).not.toHaveBeenCalled()
      expect(mockWriteFile).not.toHaveBeenCalled()
    })
  })

  describe('when export is cancelled', () => {
    const mockConnections = [{ id: '1', hostname: 'h1' }]

    beforeEach(() => {
      __mockGetAllConnections.mockReturnValue(mockConnections)
      __mockExportFilePrompt.mockResolvedValue(undefined)
    })

    it('does nothing', async () => {
      await exportConnectionsCommand(context)
      expect(mockWriteFile).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    const mockConnections = [{ id: '1', hostname: 'h1' }]

    beforeEach(() => {
      __mockGetAllConnections.mockReturnValue(mockConnections)
      __mockExportFilePrompt.mockResolvedValue({ path: '/file.json' })
    })

    it('handles write errors', async () => {
      const error = new Error('write failed')
      mockWriteFile.mockRejectedValue(error)
      await exportConnectionsCommand(context)
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to export connection: write failed')
    })
  })
})
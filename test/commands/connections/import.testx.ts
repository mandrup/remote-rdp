import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import importConnectionsCommand from '../../../src/commands/connections/import'
import { COMMAND_IDS } from '../../../src/constants'

// --- Mocks ---
vi.mock('vscode', () => {
    const fs = { readFile: vi.fn() }
    return {
        commands: { executeCommand: vi.fn() },
        window: { showErrorMessage: vi.fn(), showInputBox: vi.fn() },
        workspace: { fs },
    }
})

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
    const mockImportFilePrompt = vi.fn()
    return {
        Prompts: {
            connection: {
                importFile: mockImportFilePrompt,
            },
        },
        __mockImportFilePrompt: mockImportFilePrompt,
    }
})

vi.mock('../../../src/models/connection', () => ({
    isConnectionModelArray: vi.fn()
}))

vi.mock('../../../src/commands/connections', () => ({
    handleCommandError: vi.fn()
}))

describe('importConnectionsCommand', () => {
    const context = {} as any
    let __mockImportFilePrompt: any, __mockGetAll: any, __mockUpdateAll: any
    let mockIsConnectionModelArray: any, mockHandleCommandError: any
    let mockReadFile: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockImportFilePrompt = (await import('../../../src/prompts')).__mockImportFilePrompt
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockUpdateAll = (await import('../../../src/storage')).__mockUpdateAll
        mockIsConnectionModelArray = (await import('../../../src/models/connection')).isConnectionModelArray
        // @ts-expect-error: mock property only exists in test
        mockHandleCommandError = (await import('../../../src/commands/connections')).handleCommandError
        mockReadFile = (vscode.workspace.fs.readFile as any)
    })

    it('imports and merges connections from file', async () => {
        const uri = { path: '/file.json' }
        const imported = [
            { id: '1', hostname: 'h1', group: 'g1' },
            { id: '2', hostname: 'h2', group: 'g2' }
        ]
        const existing = [
            { id: '1', hostname: 'old', group: 'g1' },
            { id: '3', hostname: 'h3', group: 'g3' }
        ]
        __mockImportFilePrompt.mockResolvedValue(uri)
        mockReadFile.mockResolvedValue(Buffer.from(JSON.stringify(imported)))
        mockIsConnectionModelArray.mockReturnValue(true)
        __mockGetAll.mockReturnValue(existing)
        __mockUpdateAll.mockResolvedValue(undefined)

        await importConnectionsCommand(context)

        expect(__mockImportFilePrompt).toHaveBeenCalled()
        expect(mockReadFile).toHaveBeenCalledWith(uri)
        expect(__mockUpdateAll).toHaveBeenCalledWith(context, [
            { id: '1', hostname: 'h1', group: 'g1' },
            { id: '3', hostname: 'h3', group: 'g3' },
            { id: '2', hostname: 'h2', group: 'g2' }
        ])
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    })

    it('does nothing if file prompt is cancelled', async () => {
        __mockImportFilePrompt.mockResolvedValue(undefined)
        await importConnectionsCommand(context)
        expect(mockReadFile).not.toHaveBeenCalled()
        expect(__mockUpdateAll).not.toHaveBeenCalled()
    })

    it('shows error if file is invalid JSON', async () => {
        const uri = { path: '/file.json' }
        __mockImportFilePrompt.mockResolvedValue(uri)
        mockReadFile.mockResolvedValue(Buffer.from('not json'))
        await importConnectionsCommand(context)
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Invalid JSON file.')
        expect(__mockUpdateAll).not.toHaveBeenCalled()
    })

    it('shows error if file is not a valid connection array', async () => {
        const uri = { path: '/file.json' }
        __mockImportFilePrompt.mockResolvedValue(uri)
        mockReadFile.mockResolvedValue(Buffer.from('[]'))
        mockIsConnectionModelArray.mockReturnValue(false)
        await importConnectionsCommand(context)
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Invalid JSON file.')
        expect(__mockUpdateAll).not.toHaveBeenCalled()
    })

    it('handles errors with handleCommandError', async () => {
        const error = new Error('fail')
        __mockImportFilePrompt.mockRejectedValue(error)
        await importConnectionsCommand(context)
        expect(mockHandleCommandError).toHaveBeenCalledWith('import connection', error)
    })
})

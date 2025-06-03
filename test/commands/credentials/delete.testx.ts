import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import deleteCredentialCommand from '../../../src/commands/credentials/delete'
import { COMMAND_IDS } from '../../../src/constants'

// --- Mocks ---
vi.mock('vscode', () => ({
    commands: { executeCommand: vi.fn() },
    window: { showErrorMessage: vi.fn(), showInputBox: vi.fn() }
}))

vi.mock('../../../src/storage', () => {
    const mockGetAll = vi.fn()
    const mockDelete = vi.fn()
    const mockClearAllCredential = vi.fn()
    return {
        Storage: {
            connection: {
                getAll: mockGetAll,
                clearAllCredential: mockClearAllCredential,
            },
            credential: {
                delete: mockDelete,
            },
        },
        __mockGetAll: mockGetAll,
        __mockDelete: mockDelete,
        __mockClearAllCredential: mockClearAllCredential,
    }
})

vi.mock('../../../src/prompts', () => {
    const mockEditDetailsPrompt = vi.fn()
    return {
        Prompts: {
            credential: {
                editDetails: mockEditDetailsPrompt,
            },
        },
        __mockEditDetailsPrompt: mockEditDetailsPrompt,
    }
})

vi.mock('../../../src/commands/credentials', () => ({
    handleCommandError: vi.fn()
}))

describe('deleteCredentialCommand', () => {
    const context = {} as any
    let __mockEditDetailsPrompt: any, __mockGetAll: any, __mockDelete: any, __mockClearAllCredential: any, mockHandleCommandError: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockEditDetailsPrompt = (await import('../../../src/prompts')).__mockEditDetailsPrompt
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockDelete = (await import('../../../src/storage')).__mockDelete
        // @ts-expect-error: mock property only exists in test
        __mockClearAllCredential = (await import('../../../src/storage')).__mockClearAllCredential
        // @ts-expect-error: mock property only exists in test
        mockHandleCommandError = (await import('../../../src/commands/credentials')).handleCommandError
    })

    it('deletes credential and clears affected connections', async () => {
        const credential = { username: 'user' }
        const connections = [
            { id: '1', credentialUsername: 'user' },
            { id: '2', credentialUsername: 'other' }
        ]
        __mockEditDetailsPrompt.mockResolvedValue(credential)
        __mockGetAll.mockReturnValue(connections)
        __mockDelete.mockResolvedValue(undefined)
        __mockClearAllCredential.mockResolvedValue(undefined)

        await deleteCredentialCommand(context)

        expect(__mockEditDetailsPrompt).toHaveBeenCalledWith(context, undefined)
        expect(__mockDelete).toHaveBeenCalledWith(context, 'user')
        expect(__mockClearAllCredential).toHaveBeenCalledWith(context, 'user')
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    })

    it('deletes credential and does not clear if no affected connections', async () => {
        const credential = { username: 'user' }
        const connections = [
            { id: '1', credentialUsername: 'other' }
        ]
        __mockEditDetailsPrompt.mockResolvedValue(credential)
        __mockGetAll.mockReturnValue(connections)
        __mockDelete.mockResolvedValue(undefined)

        await deleteCredentialCommand(context)

        expect(__mockEditDetailsPrompt).toHaveBeenCalledWith(context, undefined)
        expect(__mockDelete).toHaveBeenCalledWith(context, 'user')
        expect(__mockClearAllCredential).not.toHaveBeenCalled()
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    })

    it('does nothing if editDetails prompt is cancelled', async () => {
        __mockEditDetailsPrompt.mockResolvedValue(undefined)
        await deleteCredentialCommand(context)
        expect(__mockDelete).not.toHaveBeenCalled()
        expect(__mockClearAllCredential).not.toHaveBeenCalled()
        expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
    })

    it('handles errors with handleCommandError', async () => {
        const error = new Error('fail')
        __mockEditDetailsPrompt.mockRejectedValue(error)
        await deleteCredentialCommand(context)
        expect(mockHandleCommandError).toHaveBeenCalledWith('remove credential', error)
    })
})

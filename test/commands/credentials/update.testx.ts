import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import updateCredentialCommand from '../../../src/commands/credentials/update'
import { COMMAND_IDS } from '../../../src/constants'

// --- Mocks ---
vi.mock('vscode', () => ({
    commands: { executeCommand: vi.fn() },
    window: { showErrorMessage: vi.fn(), showInputBox: vi.fn() }
}))

vi.mock('../../../src/storage', () => {
    const mockUpdate = vi.fn()
    const mockUpdateAllCredential = vi.fn()
    return {
        Storage: {
            credential: {
                update: mockUpdate,
            },
            connection: {
                updateAllCredential: mockUpdateAllCredential,
            },
        },
        __mockUpdate: mockUpdate,
        __mockUpdateAllCredential: mockUpdateAllCredential,
    }
})

vi.mock('../../../src/prompts', () => {
    const mockEditDetailsPrompt = vi.fn()
    const mockDetailsPrompt = vi.fn()
    return {
        Prompts: {
            credential: {
                editDetails: mockEditDetailsPrompt,
                details: mockDetailsPrompt,
            },
        },
        __mockEditDetailsPrompt: mockEditDetailsPrompt,
        __mockDetailsPrompt: mockDetailsPrompt,
    }
})

vi.mock('../../../src/commands/credentials', () => ({
    handleCommandError: vi.fn()
}))

describe('updateCredentialCommand', () => {
    const context = {} as any
    let __mockEditDetailsPrompt: any, __mockDetailsPrompt: any, __mockUpdate: any, __mockUpdateAllCredential: any, mockHandleCommandError: any
    let mockExecuteCommand: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockEditDetailsPrompt = (await import('../../../src/prompts')).__mockEditDetailsPrompt
        // @ts-expect-error: mock property only exists in test
        __mockDetailsPrompt = (await import('../../../src/prompts')).__mockDetailsPrompt
        // @ts-expect-error: mock property only exists in test
        __mockUpdate = (await import('../../../src/storage')).__mockUpdate
        // @ts-expect-error: mock property only exists in test
        __mockUpdateAllCredential = (await import('../../../src/storage')).__mockUpdateAllCredential
        // @ts-expect-error: mock property only exists in test
        mockHandleCommandError = (await import('../../../src/commands/credentials')).handleCommandError
        mockExecuteCommand = vi.spyOn(vscode.commands, 'executeCommand').mockResolvedValue(undefined)
    })

    afterEach(() => {
        if (mockExecuteCommand && typeof mockExecuteCommand.mockRestore === 'function') {
            mockExecuteCommand.mockRestore()
        }
    })

    it('updates credential and connections when prompts succeed', async () => {
        const credential = { id: 'id1', username: 'olduser' }
        const details = { username: 'newuser', password: 'pass' }
        __mockEditDetailsPrompt.mockResolvedValue(credential)
        __mockDetailsPrompt.mockResolvedValue(details)
        __mockUpdate.mockResolvedValue(undefined)
        __mockUpdateAllCredential.mockResolvedValue(undefined)

        await updateCredentialCommand(context)

        expect(__mockEditDetailsPrompt).toHaveBeenCalledWith(context, undefined)
        expect(__mockDetailsPrompt).toHaveBeenCalledWith('olduser')
        expect(__mockUpdate).toHaveBeenCalledWith(context, 'id1', 'newuser', 'pass')
        expect(__mockUpdateAllCredential).toHaveBeenCalledWith(context, 'olduser', 'newuser')
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    })

    it('does nothing if editDetails prompt is cancelled', async () => {
        __mockEditDetailsPrompt.mockResolvedValue(undefined)
        await updateCredentialCommand(context)
        expect(__mockDetailsPrompt).not.toHaveBeenCalled()
        expect(__mockUpdate).not.toHaveBeenCalled()
        expect(__mockUpdateAllCredential).not.toHaveBeenCalled()
        expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
    })

    it('does nothing if details prompt is cancelled', async () => {
        __mockEditDetailsPrompt.mockResolvedValue({ id: 'id1', username: 'olduser' })
        __mockDetailsPrompt.mockResolvedValue(undefined)
        await updateCredentialCommand(context)
        expect(__mockUpdate).not.toHaveBeenCalled()
        expect(__mockUpdateAllCredential).not.toHaveBeenCalled()
        expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
    })

    it('handles errors with handleCommandError', async () => {
        const error = new Error('fail')
        __mockEditDetailsPrompt.mockRejectedValue(error)
        await updateCredentialCommand(context)
        expect(mockHandleCommandError).toHaveBeenCalledWith('update credential', error)
    })
})

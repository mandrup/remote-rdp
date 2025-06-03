import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import createCredentialCommand from '../../../src/commands/credentials/create'
import { COMMAND_IDS } from '../../../src/constants'

// --- Mocks ---
vi.mock('vscode', () => ({
    commands: { executeCommand: vi.fn() },
    window: { showErrorMessage: vi.fn(), showInputBox: vi.fn() }
}))

vi.mock('../../../src/storage', () => {
    const mockCreate = vi.fn()
    return {
        Storage: {
            credential: {
                create: mockCreate,
            },
        },
        __mockCreate: mockCreate,
    }
})

vi.mock('../../../src/prompts', () => {
    const mockDetailsPrompt = vi.fn()
    return {
        Prompts: {
            credential: {
                details: mockDetailsPrompt,
            },
        },
        __mockDetailsPrompt: mockDetailsPrompt,
    }
})

vi.mock('../../../src/commands/credentials', () => ({
    handleCommandError: vi.fn()
}))

describe('createCredentialCommand', () => {
    const context = {} as any
    let __mockDetailsPrompt: any, __mockCreate: any, mockHandleCommandError: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockDetailsPrompt = (await import('../../../src/prompts')).__mockDetailsPrompt
        // @ts-expect-error: mock property only exists in test
        __mockCreate = (await import('../../../src/storage')).__mockCreate
        // @ts-expect-error: mock property only exists in test
        mockHandleCommandError = (await import('../../../src/commands/credentials')).handleCommandError
    })

    it('creates a credential when details prompt succeeds', async () => {
        __mockDetailsPrompt.mockResolvedValue({ username: 'user', password: 'pass' })
        __mockCreate.mockResolvedValue(undefined)

        await createCredentialCommand(context)

        expect(__mockDetailsPrompt).toHaveBeenCalled()
        expect(__mockCreate).toHaveBeenCalledWith(context, 'user', 'pass')
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
    })

    it('does nothing if details prompt is cancelled', async () => {
        __mockDetailsPrompt.mockResolvedValue(undefined)
        await createCredentialCommand(context)
        expect(__mockCreate).not.toHaveBeenCalled()
        expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
    })

    it('handles errors with handleCommandError', async () => {
        const error = new Error('fail')
        __mockDetailsPrompt.mockRejectedValue(error)
        await createCredentialCommand(context)
        expect(mockHandleCommandError).toHaveBeenCalledWith('create credential', error)
    })
})

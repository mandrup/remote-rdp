import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import { COMMAND_IDS } from '../../../src/constants'
import { updateConnectionCommand, updateGroupCredentialsCommand } from '../../../src/commands/connections/update'

// --- Mocks ---
vi.mock('vscode', () => ({
    commands: { executeCommand: vi.fn() },
    window: { showErrorMessage: vi.fn(), showInputBox: vi.fn() }
}))

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
    const mockSelectPrompt = vi.fn()
    const mockHostnamePrompt = vi.fn()
    const mockGroupPrompt = vi.fn()
    const mockCredentialPrompt = vi.fn()
    return {
        Prompts: {
            connection: {
                select: mockSelectPrompt,
                hostname: mockHostnamePrompt,
                group: mockGroupPrompt,
            },
            credential: {
                select: mockCredentialPrompt,
            },
        },
        __mockSelectPrompt: mockSelectPrompt,
        __mockHostnamePrompt: mockHostnamePrompt,
        __mockGroupPrompt: mockGroupPrompt,
        __mockCredentialPrompt: mockCredentialPrompt,
    }
})

vi.mock('../../../src/commands/connections', () => ({
    handleCommandError: vi.fn()
}))

describe('updateConnectionCommand', () => {
    const context = {} as any
    let __mockSelectPrompt: any, __mockHostnamePrompt: any, __mockGroupPrompt: any, __mockCredentialPrompt: any
    let __mockGetAll: any, __mockUpdateAll: any
    let mockHandleCommandError: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockSelectPrompt = (await import('../../../src/prompts')).__mockSelectPrompt
        // @ts-expect-error: mock property only exists in test
        __mockHostnamePrompt = (await import('../../../src/prompts')).__mockHostnamePrompt
        // @ts-expect-error: mock property only exists in test
        __mockGroupPrompt = (await import('../../../src/prompts')).__mockGroupPrompt
        // @ts-expect-error: mock property only exists in test
        __mockCredentialPrompt = (await import('../../../src/prompts')).__mockCredentialPrompt
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockUpdateAll = (await import('../../../src/storage')).__mockUpdateAll
        // @ts-expect-error: mock property only exists in test
        mockHandleCommandError = (await import('../../../src/commands/connections')).handleCommandError
    })

    it('updates a connection when all prompts succeed', async () => {
        const fakeConnection = { id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' }
        const fakeConnections = [fakeConnection, { id: '2' }]
        __mockSelectPrompt.mockResolvedValue(fakeConnection)
        __mockHostnamePrompt.mockResolvedValue('newhost')
        __mockGroupPrompt.mockResolvedValue({ cancelled: false, value: 'newgroup' })
        __mockCredentialPrompt.mockResolvedValue('newuser')
        __mockGetAll.mockReturnValue(fakeConnections)
        __mockUpdateAll.mockResolvedValue(undefined)

        await updateConnectionCommand(context)

        expect(__mockSelectPrompt).toHaveBeenCalledWith(context, undefined)
        expect(__mockHostnamePrompt).toHaveBeenCalledWith('old')
        expect(__mockGroupPrompt).toHaveBeenCalledWith(context, 'g')
        expect(__mockCredentialPrompt).toHaveBeenCalledWith(context, 'u')
        expect(__mockUpdateAll).toHaveBeenCalledWith(context, [
            { ...fakeConnection, hostname: 'newhost', credentialUsername: 'newuser', group: 'newgroup' },
            { id: '2' }
        ])
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
    })

    it('does nothing if connection prompt is cancelled', async () => {
        __mockSelectPrompt.mockResolvedValue(undefined)
        await updateConnectionCommand(context)
        expect(__mockHostnamePrompt).not.toHaveBeenCalled()
        expect(__mockUpdateAll).not.toHaveBeenCalled()
    })

    it('does nothing if hostname prompt is cancelled', async () => {
        __mockSelectPrompt.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
        __mockHostnamePrompt.mockResolvedValue(undefined)
        await updateConnectionCommand(context)
        expect(__mockGroupPrompt).not.toHaveBeenCalled()
        expect(__mockUpdateAll).not.toHaveBeenCalled()
    })

    it('does nothing if group prompt is cancelled', async () => {
        __mockSelectPrompt.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
        __mockHostnamePrompt.mockResolvedValue('newhost')
        __mockGroupPrompt.mockResolvedValue({ cancelled: true })
        await updateConnectionCommand(context)
        expect(__mockCredentialPrompt).not.toHaveBeenCalled()
        expect(__mockUpdateAll).not.toHaveBeenCalled()
    })

    it('does nothing if credential prompt is cancelled', async () => {
        __mockSelectPrompt.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
        __mockHostnamePrompt.mockResolvedValue('newhost')
        __mockGroupPrompt.mockResolvedValue({ cancelled: false, value: 'newgroup' })
        __mockCredentialPrompt.mockResolvedValue(undefined)
        await updateConnectionCommand(context)
        expect(__mockUpdateAll).not.toHaveBeenCalled()
    })

    it('handles errors with handleCommandError', async () => {
        const error = new Error('fail')
        __mockSelectPrompt.mockRejectedValue(error)
        await updateConnectionCommand(context)
        expect(mockHandleCommandError).toHaveBeenCalledWith('update connection', error)
    })
})

describe('updateGroupCredentialsCommand', () => {
    const context = {} as any
    let __mockCredentialPrompt: any, __mockGetAll: any, __mockUpdateAll: any, mockHandleCommandError: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockCredentialPrompt = (await import('../../../src/prompts')).__mockCredentialPrompt
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockUpdateAll = (await import('../../../src/storage')).__mockUpdateAll
        // @ts-expect-error: mock property only exists in test
        mockHandleCommandError = (await import('../../../src/commands/connections')).handleCommandError
    })

    it('updates credentials for all connections in a group', async () => {
        const groupItem = { type: 'group', group: 'g' }
        const fakeConnections = [
            { id: '1', group: 'g', credentialUsername: 'old' },
            { id: '2', group: 'other', credentialUsername: 'old2' }
        ]
        __mockCredentialPrompt.mockResolvedValue('newuser')
        __mockGetAll.mockReturnValue(fakeConnections)
        __mockUpdateAll.mockResolvedValue(undefined)

        await updateGroupCredentialsCommand(context, groupItem as any)

        expect(__mockCredentialPrompt).toHaveBeenCalledWith(context, undefined)
        expect(__mockUpdateAll).toHaveBeenCalledWith(context, [
            { id: '1', group: 'g', credentialUsername: 'newuser' },
            { id: '2', group: 'other', credentialUsername: 'old2' }
        ])
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    })

    it('shows error if item is not a group', async () => {
        const notGroupItem = { type: 'connection' }
        await updateGroupCredentialsCommand(context, notGroupItem as any)
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('This command can only be used on connection groups.')
    })

    it('does nothing if credential prompt is cancelled', async () => {
        const groupItem = { type: 'group', group: 'g' }
        __mockCredentialPrompt.mockResolvedValue(undefined)
        await updateGroupCredentialsCommand(context, groupItem as any)
        expect(__mockUpdateAll).not.toHaveBeenCalled()
    })

    it('handles errors with handleCommandError', async () => {
        const groupItem = { type: 'group', group: 'g' }
        const error = new Error('fail')
        __mockCredentialPrompt.mockRejectedValue(error)
        await updateGroupCredentialsCommand(context, groupItem as any)
        expect(mockHandleCommandError).toHaveBeenCalledWith('update group credentials', error)
    })
})

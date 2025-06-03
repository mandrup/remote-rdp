import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { credentialPrompt, credentialDetailsPrompt, editCredentialDetailsPrompt } from '../../../src/prompts/credentials/credential'

vi.mock('vscode', () => ({
    window: {
        showWarningMessage: vi.fn(),
        showQuickPick: vi.fn(),
        showInputBox: vi.fn(),
    },
    TreeItem: class { },
}))

vi.mock('../../../src/storage', () => {
    const mockGetAll = vi.fn()
    const mockCreate = vi.fn()
    return {
        Storage: {
            credential: {
                getAll: mockGetAll,
                create: mockCreate,
            },
        },
        __mockGetAll: mockGetAll,
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

describe('credentialPrompt', () => {
    const context = {} as any
    let __mockGetAll: any, __mockCreate: any, __mockDetailsPrompt: any, mockShowQuickPick: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockCreate = (await import('../../../src/storage')).__mockCreate
        // @ts-expect-error: mock property only exists in test
        __mockDetailsPrompt = (await import('../../../src/prompts')).__mockDetailsPrompt
        mockShowQuickPick = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined)
    })

    afterEach(() => {
        if (mockShowQuickPick && typeof mockShowQuickPick.mockRestore === 'function') {
            mockShowQuickPick.mockRestore()
        }
    })

    it('returns selected credential username', async () => {
        __mockGetAll.mockResolvedValue([
            { username: 'user1' },
            { username: 'user2' }
        ])
        mockShowQuickPick.mockResolvedValue({ label: 'user2' })
        const result = await credentialPrompt(context)
        expect(result).toBe('user2')
    })

    it('returns undefined if quick pick is cancelled', async () => {
        __mockGetAll.mockResolvedValue([{ username: 'user1' }])
        mockShowQuickPick.mockResolvedValue(undefined)
        const result = await credentialPrompt(context)
        expect(result).toBeUndefined()
    })

    it('creates new credential if selected', async () => {
        __mockGetAll.mockResolvedValue([{ username: 'user1' }])
        mockShowQuickPick.mockResolvedValue({ label: '$(add) Create new credential', isCreateNew: true })
        __mockDetailsPrompt.mockResolvedValue({ username: 'newuser', password: 'pass' })
        __mockCreate.mockResolvedValue(undefined)
        const result = await credentialPrompt(context)
        expect(__mockDetailsPrompt).toHaveBeenCalled()
        expect(__mockCreate).toHaveBeenCalledWith(context, 'newuser', 'pass')
        expect(result).toBe('newuser')
    })

    it('returns undefined if new credential prompt is cancelled', async () => {
        __mockGetAll.mockResolvedValue([{ username: 'user1' }])
        mockShowQuickPick.mockResolvedValue({ label: '$(add) Create new credential', isCreateNew: true })
        __mockDetailsPrompt.mockResolvedValue(undefined)
        const result = await credentialPrompt(context)
        expect(result).toBeUndefined()
    })
})

describe('credentialDetailsPrompt', () => {
    let mockShowInputBox: any
    beforeEach(() => {
        mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue('user')
    })
    afterEach(() => {
        if (mockShowInputBox && typeof mockShowInputBox.mockRestore === 'function') {
            mockShowInputBox.mockRestore()
        }
    })

    it('returns username and password when both are entered', async () => {
        mockShowInputBox
            .mockResolvedValueOnce('user')
            .mockResolvedValueOnce('pass')
        const result = await credentialDetailsPrompt()
        expect(result).toEqual({ username: 'user', password: 'pass' })
    })

    it('returns undefined if username is cancelled', async () => {
        mockShowInputBox.mockResolvedValueOnce(undefined)
        const result = await credentialDetailsPrompt()
        expect(result).toBeUndefined()
    })

    it('returns undefined if password is cancelled', async () => {
        mockShowInputBox.mockResolvedValueOnce('user').mockResolvedValueOnce(undefined)
        const result = await credentialDetailsPrompt()
        expect(result).toBeUndefined()
    })
})

describe('editCredentialDetailsPrompt', () => {
    const context = {} as any
    let __mockGetAll: any, mockShowQuickPick: any, mockShowInputBox: any
    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        mockShowQuickPick = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined)
        mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue(undefined)
    })
    afterEach(() => {
        if (mockShowQuickPick && typeof mockShowQuickPick.mockRestore === 'function') {
            mockShowQuickPick.mockRestore()
        }
        if (mockShowInputBox && typeof mockShowInputBox.mockRestore === 'function') {
            mockShowInputBox.mockRestore()
        }
    })

    it('returns undefined if item.contextValue is emptyCredentials', async () => {
        __mockGetAll.mockResolvedValue([{ id: '1', username: 'user', password: 'pass' }])
        const result = await editCredentialDetailsPrompt(context, { contextValue: 'emptyCredentials' } as any)
        expect(result).toBeUndefined()
    })

    it('returns credential by id if item.id is provided', async () => {
        const creds = [
            { id: '1', username: 'user', password: 'pass' },
            { id: '2', username: 'other', password: 'p2' }
        ]
        __mockGetAll.mockResolvedValue(creds)
        const result = await editCredentialDetailsPrompt(context, { id: '2' } as any)
        expect(result).toEqual(creds[1])
    })

    it('shows warning and returns undefined if no credentials', async () => {
        __mockGetAll.mockResolvedValue([])
        const mockShowWarningMessage = vi.spyOn(vscode.window, 'showWarningMessage').mockResolvedValue(undefined)
        const result = await editCredentialDetailsPrompt(context)
        expect(mockShowWarningMessage).toHaveBeenCalledWith('No credentials available.')
        expect(result).toBeUndefined()
        mockShowWarningMessage.mockRestore()
    })

    it('shows quick pick and returns selected credential', async () => {
        const creds = [
            { id: '1', username: 'user', password: 'pass' },
            { id: '2', username: 'other', password: 'p2' }
        ]
        __mockGetAll.mockResolvedValue(creds)
        mockShowQuickPick.mockResolvedValue({ label: 'other' })
        const result = await editCredentialDetailsPrompt(context)
        expect(result).toEqual(creds[1])
    })

    it('returns undefined if quick pick is cancelled', async () => {
        const creds = [
            { id: '1', username: 'user', password: 'pass' }
        ]
        __mockGetAll.mockResolvedValue(creds)
        mockShowQuickPick.mockResolvedValue(undefined)
        const result = await editCredentialDetailsPrompt(context)
        expect(result).toBeUndefined()
    })
})

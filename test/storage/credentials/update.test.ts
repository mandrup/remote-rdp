import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { updateCredential } from '../../../src/storage/credentials/update'
import { PREFIXES } from '../../../src/constants'

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
    return {
        Storage: {
            credential: {
                getAll: mockGetAll,
            },
        },
        __mockGetAll: mockGetAll,
    }
})

describe('updateCredential', () => {
    const mockUpdate = vi.fn()
    const mockStore = vi.fn()
    let __mockGetAll: any
    let randomUUIDSpy: any
    const now = '2025-06-03T12:00:00.000Z'
    const context = {
        globalState: { update: mockUpdate },
        secrets: { store: mockStore }
    } as any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // Use a valid UUID string to satisfy type checks
        const validUUID = '123e4567-e89b-12d3-a456-426614174000'
        if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
            randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => validUUID)
        } else {
            // @ts-expect-error
            globalThis.crypto = { randomUUID: vi.fn(() => validUUID) }
        }
        vi.spyOn(global, 'Date').mockImplementation(() => ({ toISOString: () => now }) as any)
    })

    afterEach(() => {
        if (randomUUIDSpy && typeof randomUUIDSpy.mockRestore === 'function') {
            randomUUIDSpy.mockRestore()
        }
    })

    it('updates credential and stores new password', async () => {
        const credentials = [
            { id: '1', username: 'old', password: 'p', created_at: 'd', modified_at: undefined },
            { id: '2', username: 'other', password: 'p2', created_at: 'd2', modified_at: undefined }
        ]
        __mockGetAll.mockResolvedValue(credentials)
        await updateCredential(context, '1', 'new', 'newpass')
        expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.credential, [
            { id: '1', username: 'new', created_at: 'd', modified_at: now },
            { id: '2', username: 'other', created_at: 'd2', modified_at: undefined }
        ])
        expect(mockStore).toHaveBeenCalledWith(`${PREFIXES.credential}.secret.1`, 'newpass')
    })

    it('throws if credential id not found', async () => {
        __mockGetAll.mockResolvedValue([{ id: '2', username: 'other', password: 'p2', created_at: 'd2', modified_at: undefined }])
        await expect(updateCredential(context, 'notfound', 'new', 'newpass')).rejects.toThrow('Credential with ID "notfound" not found')
        expect(mockUpdate).not.toHaveBeenCalled()
        expect(mockStore).not.toHaveBeenCalled()
    })

    it('throws if username already exists for another credential', async () => {
        __mockGetAll.mockResolvedValue([
            { id: '1', username: 'old', password: 'p', created_at: 'd', modified_at: undefined },
            { id: '2', username: 'new', password: 'p2', created_at: 'd2', modified_at: undefined }
        ])
        await expect(updateCredential(context, '1', 'new', 'newpass')).rejects.toThrow('Credential for username "new" already exists')
        expect(mockUpdate).not.toHaveBeenCalled()
        expect(mockStore).not.toHaveBeenCalled()
    })
})

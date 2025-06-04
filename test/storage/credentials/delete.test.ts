import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { deleteCredential } from '../../../src/storage/credentials/delete'
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

describe('deleteCredential', () => {
    const mockUpdate = vi.fn()
    const mockDeleteSecret = vi.fn()
    let __mockGetAll: any
    const context = {
        globalState: { update: mockUpdate },
        secrets: { delete: mockDeleteSecret }
    } as any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
    })

    afterEach(() => {
        // No spies to restore
    })

    it('deletes credential and updates storage/secrets', async () => {
        const credentials = [
            { id: '1', username: 'u1', created_at: 'd1', modified_at: 'm1' },
            { id: '2', username: 'u2', created_at: 'd2', modified_at: 'm2' }
        ]
        __mockGetAll.mockResolvedValue(credentials)
        await deleteCredential(context, '1')
        expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.credential, [
            { id: '2', username: 'u2', created_at: 'd2', modified_at: 'm2' }
        ])
        expect(mockDeleteSecret).toHaveBeenCalledWith(`${PREFIXES.credential}.secret.1`)
    })

    it('does nothing if credential id does not exist', async () => {
        __mockGetAll.mockResolvedValue([{ id: '2', username: 'u2', created_at: 'd2', modified_at: 'm2' }])
        await deleteCredential(context, 'notfound')
        expect(mockUpdate).not.toHaveBeenCalled()
        expect(mockDeleteSecret).not.toHaveBeenCalled()
    })
})

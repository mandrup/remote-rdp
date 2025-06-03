import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCredential } from '../../../src/storage/credentials/create'
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

describe('createCredential', () => {
    const mockUpdate = vi.fn()
    const mockStore = vi.fn()
    let __mockGetAll: any
    let randomUUIDSpy: any
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
    })

    afterEach(() => {
        if (randomUUIDSpy && typeof randomUUIDSpy.mockRestore === 'function') {
            randomUUIDSpy.mockRestore()
        }
    })

    it('creates and saves a new credential', async () => {
        // Arrange
        const now = '2025-06-03T12:00:00.000Z'
        vi.spyOn(global, 'Date').mockImplementation(() => ({ toISOString: () => now }) as any)
        __mockGetAll.mockResolvedValue([])
        // Act
        await createCredential(context, 'user', 'pass')

        // Assert
        expect(__mockGetAll).toHaveBeenCalledWith(context)
        expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.credential, [
            { id: '123e4567-e89b-12d3-a456-426614174000', username: 'user', created_at: now }
        ])
        expect(mockStore).toHaveBeenCalledWith(`${PREFIXES.credential}.secret.123e4567-e89b-12d3-a456-426614174000`, 'pass')
    })

    it('throws if credential for username already exists', async () => {
        __mockGetAll.mockResolvedValue([{ username: 'user' }])
        await expect(createCredential(context, 'user', 'pass')).rejects.toThrow('Credential for username "user" already exists')
        expect(mockUpdate).not.toHaveBeenCalled()
        expect(mockStore).not.toHaveBeenCalled()
    })
})

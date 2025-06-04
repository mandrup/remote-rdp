import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAllCredentials,
  getCredentialWithPassword,
  getAllCredentialUsernames
} from '../../../src/storage/credentials/get'

vi.mock('vscode', () => ({
    window: {
        showWarningMessage: vi.fn(),
        showQuickPick: vi.fn(),
        showInputBox: vi.fn(),
    },
    TreeItem: class { },
}))

vi.mock('../../../src/storage', () => {
    const mockGet = vi.fn()
    return {
        Storage: {
            credential: {
                get: mockGet,
            },
        },
        __mockGet: mockGet,
    }
})

describe('getAllCredentials', () => {
    let __mockGet: any
    const mockSecretsGet = vi.fn()
    const context = {
        globalState: { get: undefined },
        secrets: { get: mockSecretsGet }
    } as any
    const now = '2025-06-03T12:00:00.000Z'
    function makeStoredCred(id: string, username: string, created_at = now, modified_at?: string) {
        return { id, username, created_at, modified_at }
    }
    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGet = (await import('../../../src/storage')).__mockGet
        context.globalState.get = __mockGet
    })
    afterEach(() => {})
    it('returns all credentials with passwords', async () => {
        __mockGet.mockReturnValue([
            makeStoredCred('1', 'u1'),
            makeStoredCred('2', 'u2', now, 'm2')
        ])
        mockSecretsGet.mockImplementation(async (key: string) => key.endsWith('1') ? 'p1' : 'p2')
        const creds = await getAllCredentials(context)
        expect(creds).toEqual([
            { id: '1', username: 'u1', password: 'p1', created_at: now, modified_at: undefined },
            { id: '2', username: 'u2', password: 'p2', created_at: now, modified_at: 'm2' }
        ])
    })
    it('returns empty array if nothing stored', async () => {
        __mockGet.mockReturnValue([])
        const creds = await getAllCredentials(context)
        expect(creds).toEqual([])
    })
    it('throws if stored data is invalid', async () => {
        __mockGet.mockReturnValue('bad')
        await expect(getAllCredentials(context)).rejects.toThrow('Invalid credential data in storage')
    })
})

describe('getCredentialWithPassword', () => {
    let spy: any
    let context: any
    beforeEach(async () => {
        vi.clearAllMocks()
        context = { globalState: { get: vi.fn() }, secrets: {} }
        const mod = await import('../../../src/storage/credentials/get')
        spy = vi.spyOn(mod, 'getAllCredentials')
    })
    afterEach(() => {
        if (spy?.mockRestore) { spy.mockRestore() }
    })
    it('returns username and password if found', async () => {
        spy.mockResolvedValue([
            { id: '1', username: 'u1', password: 'p1', created_at: '2025-06-03T12:00:00.000Z' }
        ])
        const result = await getCredentialWithPassword(context, 'u1')
        expect(result).toEqual({ username: 'u1', password: 'p1' })
    })
    it('returns undefined if not found', async () => {
        spy.mockResolvedValue([
            { id: '1', username: 'u1', password: 'p1', created_at: '2025-06-03T12:00:00.000Z' }
        ])
        const result = await getCredentialWithPassword(context, 'u2')
        expect(result).toBeUndefined()
    })
    it('returns undefined if password is missing', async () => {
        spy.mockResolvedValue([
            { id: '1', username: 'u1', password: '', created_at: '2025-06-03T12:00:00.000Z' }
        ])
        const result = await getCredentialWithPassword(context, 'u1')
        expect(result).toBeUndefined() 
    })
})

describe('getAllCredentialUsernames', () => {
    let spy: any
    let context: any
    beforeEach(async () => {
        vi.clearAllMocks()
        context = { globalState: { get: vi.fn() }, secrets: {} }
        const mod = await import('../../../src/storage/credentials/get')
        spy = vi.spyOn(mod, 'getAllCredentials')
    })
    afterEach(() => {
        if (spy?.mockRestore) { spy.mockRestore() }
    })
    it('returns all usernames', async () => {
        spy.mockResolvedValue([
            { id: '1', username: 'u1', password: 'p1', created_at: '2025-06-03T12:00:00.000Z' },
            { id: '2', username: 'u2', password: 'p2', created_at: '2025-06-03T12:00:00.000Z' }
        ])
        const result = await getAllCredentialUsernames(context)
        expect(result).toEqual(['u1', 'u2'])
    })
    it('returns empty array if no credentials', async () => {
        spy.mockResolvedValue([])
        const result = await getAllCredentialUsernames(context)
        expect(result).toEqual([])
    })
})

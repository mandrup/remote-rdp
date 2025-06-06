import '#mocks/vscode'
import '#mocks/storage'
import { getAllCredentials, getCredentialWithPassword, getAllCredentialUsernames } from '@/storage/credentials/get'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const now = '2025-06-03T12:00:00.000Z'
const mockSecretsGet = vi.fn()
const context = {
    globalState: { get: undefined },
    secrets: { get: mockSecretsGet }
} as any
function makeStoredCred(id: string, username: string, created_at = now, modified_at?: string) {
    return { id, username, created_at, modified_at }
}

describe('getAllCredentials', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        context.globalState.get = vi.fn()
    })
    afterEach(() => { })
    it('returns all credentials with passwords', async () => {
        context.globalState.get = vi.fn().mockReturnValue([
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
        context.globalState.get = vi.fn().mockReturnValue([])
        const creds = await getAllCredentials(context)
        expect(creds).toEqual([])
    })
    it('throws if stored data is invalid', async () => {
        context.globalState.get = vi.fn().mockReturnValue('bad')
        await expect(getAllCredentials(context)).rejects.toThrow('Invalid credential data in storage')
    })
})

describe('getCredentialWithPassword', () => {
    let spy: any
    let context: any
    beforeEach(async () => {
        vi.clearAllMocks()
        context = { globalState: { get: vi.fn() }, secrets: {} }
        const mod = await import('@/storage/credentials/get')
        spy = vi.spyOn(mod, 'getAllCredentials')
    })
    afterEach(() => {
        if (spy?.mockRestore) { spy.mockRestore() }
    })
    
    it('returns username and password if found', async () => {
        context.globalState.get = vi.fn().mockReturnValue([
            { id: '1', username: 'u1', password: 'p1', created_at: now }
        ])
        context.secrets.get = vi.fn().mockResolvedValue('p1')
        const result = await getCredentialWithPassword(context, 'u1')
        expect(result).toEqual({ username: 'u1', password: 'p1' })
    })

    it('returns undefined if not found', async () => {
        context.globalState.get = vi.fn().mockReturnValue([])
        const result = await getCredentialWithPassword(context, 'u2')
        expect(result).toBeUndefined()
    })

    it('returns undefined if password is missing', async () => {
        context.globalState.get = vi.fn().mockReturnValue([
            { id: '1', username: 'u1', created_at: now }
        ])
        context.secrets.get = vi.fn().mockResolvedValue(undefined)
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
        const mod = await import('@/storage/credentials/get')
        spy = vi.spyOn(mod, 'getAllCredentials')
    })
    afterEach(() => {
        if (spy?.mockRestore) { spy.mockRestore() }
    })

    it('returns all usernames', async () => {
        context.globalState.get = vi.fn().mockReturnValue([
            { id: '1', username: 'u1', created_at: now },
            { id: '2', username: 'u2', created_at: now }
        ])
        context.secrets.get = vi.fn().mockResolvedValue('irrelevant')
        const result = await getAllCredentialUsernames(context)
        expect(result).toEqual(['u1', 'u2'])
    })

    it('returns empty array if no credentials', async () => {
        context.globalState.get = vi.fn().mockReturnValue([])
        context.secrets.get = vi.fn().mockResolvedValue('irrelevant')
        const result = await getAllCredentialUsernames(context)
        expect(result).toEqual([])
    })
})
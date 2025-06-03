import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createConnection } from '../../../src/storage/connections/create'
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
            connection: {
                getAll: mockGetAll,
            },
        },
        __mockGetAll: mockGetAll,
    }
})

vi.mock('../../../src/models/connection', () => {
    const mockIsConnectionModel = vi.fn(() => true)
    return {
        isConnectionModel: mockIsConnectionModel,
        __mockIsConnectionModel: mockIsConnectionModel,
    }
})

let originalRandomUUID: any

describe('createConnection', () => {
    const context = { globalState: { update: vi.fn() } } as any
    const now = '2025-06-03T12:00:00.000Z'
    let dateSpy: any, __mockGetAll: any, __mockIsConnectionModel: any

    beforeEach(async () => {
        vi.clearAllMocks()
        dateSpy = vi.spyOn(global, 'Date').mockImplementation(() => ({ toISOString: () => now }) as any)
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockIsConnectionModel = (await import('../../../src/models/connection')).__mockIsConnectionModel
        if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
            originalRandomUUID = globalThis.crypto.randomUUID
            globalThis.crypto.randomUUID = vi.fn(() => '123e4567-e89b-12d3-a456-426614174000') as () => `${string}-${string}-${string}-${string}-${string}`
        } else {
            // @ts-ignore
            globalThis.crypto = { randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000') }
        }
    })
    afterEach(() => {
        dateSpy.mockRestore()
        if (originalRandomUUID) {
            globalThis.crypto.randomUUID = originalRandomUUID
        }
    })

    it('creates and saves a new connection', async () => {
        __mockGetAll.mockReturnValue([])
        __mockIsConnectionModel.mockReturnValue(true)
        await createConnection(context, 'host', 'user', 'group')
        expect(__mockIsConnectionModel).toHaveBeenCalledWith({
            id: '123e4567-e89b-12d3-a456-426614174000',
            hostname: 'host',
            credentialUsername: 'user',
            group: 'group',
            created_at: now
        })
        expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                hostname: 'host',
                credentialUsername: 'user',
                group: 'group',
                created_at: now
            }
        ])
    })

    it('throws if connection is invalid', async () => {
        __mockGetAll.mockReturnValue([])
        __mockIsConnectionModel.mockReturnValue(false)
        await expect(createConnection(context, 'host', 'user', 'group')).rejects.toThrow('Invalid connection data')
        expect(context.globalState.update).not.toHaveBeenCalled()
    })

    it('throws if duplicate connection exists', async () => {
        __mockGetAll.mockReturnValue([
            { hostname: 'host', credentialUsername: 'user' }
        ])
        __mockIsConnectionModel.mockReturnValue(true)
        await expect(createConnection(context, 'host', 'user', 'group')).rejects.toThrow('A connection with this hostname and credential already exists')
        expect(context.globalState.update).not.toHaveBeenCalled()
    })
})

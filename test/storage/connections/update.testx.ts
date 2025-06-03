import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { updateConnections, updateConnectionsCredential, clearConnectionsCredential } from '../../../src/storage/connections/update'
import { PREFIXES } from '../../../src/constants'

vi.mock('vscode', () => ({
    window: {
        showWarningMessage: vi.fn(),
        showQuickPick: vi.fn(),
        showInputBox: vi.fn(),
    },
    TreeItem: class { },
}))

vi.mock('../../../src/models/connection', () => {
    const mockIsConnectionModelArray = vi.fn()
    return {
        isConnectionModelArray: mockIsConnectionModelArray,
        __mockIsConnectionModelArray: mockIsConnectionModelArray,
    }
})

vi.mock('../../../src/storage', () => {
    const mockGetAll = vi.fn()
    const mockUpdate = vi.fn()
    const mockGet = vi.fn()
    return {
        Storage: {
            connection: {
                getAll: mockGetAll,
            },
        },
        __mockGetAll: mockGetAll,
        __mockUpdate: mockUpdate,
        __mockGet: mockGet,
    }
})

describe('updateConnections', () => {
    const context = { globalState: { update: vi.fn(), get: vi.fn() } } as any
    let __mockIsConnectionModelArray: any, __mockGetAll: any, __mockUpdate: any, __mockGet: any, mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockIsConnectionModelArray = (await import('../../../src/models/connection')).__mockIsConnectionModelArray
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockUpdate = (await import('../../../src/storage')).__mockUpdate
        // @ts-expect-error: mock property only exists in test
        __mockGet = (await import('../../../src/storage')).__mockGet
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

    it('updates connections if valid', async () => {
        const conns = [{ id: '1', hostname: 'h', created_at: 'd' }]
        __mockIsConnectionModelArray.mockReturnValueOnce(true).mockReturnValueOnce(true)
        context.globalState.get.mockReturnValue(conns)
        await updateConnections(context, conns)
        expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, conns)
    })

    it('throws if input is not a valid connection array', async () => {
        __mockIsConnectionModelArray.mockReturnValueOnce(false)
        await expect(updateConnections(context, [{
            id: '',
            hostname: '',
            created_at: ''
        }])).rejects.toThrow('Invalid connection data array')
        expect(context.globalState.update).not.toHaveBeenCalled()
    })

    it('throws if stored data is invalid after update', async () => {
        const conns = [{ id: '1', hostname: 'h', created_at: 'd' }]
        __mockIsConnectionModelArray.mockReturnValueOnce(true).mockReturnValueOnce(false)
        context.globalState.get.mockReturnValue('bad')
        await expect(updateConnections(context, conns)).rejects.toThrow('Stored connection data is invalid after update')
    })
})

describe('updateConnectionsCredential', () => {
    const context = { globalState: { update: vi.fn(), get: vi.fn() } } as any
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
    it('updates all connections with old username to new username', async () => {
        const conns = [
            { id: '1', hostname: 'h', credentialUsername: 'old', created_at: 'd' },
            { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' }
        ]
        __mockGetAll.mockReturnValue(conns)
        // @ts-expect-error: mock property only exists in test
        const __mockIsConnectionModelArray = (await import('../../../src/models/connection')).__mockIsConnectionModelArray
        __mockIsConnectionModelArray.mockReturnValue(true)
        const updateModule = await import('../../../src/storage/connections/update')
        const spy = vi.spyOn(updateModule, 'updateConnections').mockResolvedValue(undefined)
        await updateConnectionsCredential(context, 'old', 'new')
        expect(spy).toHaveBeenCalledWith(context, [
            { id: '1', hostname: 'h', credentialUsername: 'new', created_at: 'd' },
            { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' }
        ])
        spy.mockRestore()
    })
})

describe('clearConnectionsCredential', () => {
    const context = { globalState: { update: vi.fn(), get: vi.fn() } } as any
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
    it('clears credentialUsername for all matching connections and returns affected count', async () => {
        const conns = [
            { id: '1', hostname: 'h', credentialUsername: 'user', created_at: 'd' },
            { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' },
            { id: '3', hostname: 'h3', credentialUsername: 'user', created_at: 'd' }
        ]
        __mockGetAll.mockReturnValue(conns)
        // @ts-expect-error: mock property only exists in test
        const __mockIsConnectionModelArray = (await import('../../../src/models/connection')).__mockIsConnectionModelArray
        __mockIsConnectionModelArray.mockReturnValue(true)
        const updateModule = await import('../../../src/storage/connections/update')
        const spy = vi.spyOn(updateModule, 'updateConnections').mockResolvedValue(undefined)
        const result = await clearConnectionsCredential(context, 'user')
        expect(spy).toHaveBeenCalledWith(context, [
            { id: '1', hostname: 'h', credentialUsername: undefined, created_at: 'd' },
            { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' },
            { id: '3', hostname: 'h3', credentialUsername: undefined, created_at: 'd' }
        ])
        expect(result).toBe(2)
        spy.mockRestore()
    })
})

import '../../__mocks__/vitest-mocks'
import { mockIsConnectionModelArray, mockGetAll } from '../../__mocks__/vitest-mocks'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { updateConnections, updateConnectionsCredential, clearConnectionsCredential } from '../../../src/storage/connections/update'
import { PREFIXES } from '../../../src/constants'

// --- updateConnections ---
describe('updateConnections', () => {
    const context = { globalState: { update: vi.fn(), get: vi.fn() } } as any
    let mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockShowQuickPick = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined)
        mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue(undefined)
    })

    afterEach(() => {
        if (mockShowQuickPick?.mockRestore) { mockShowQuickPick.mockRestore() }
        if (mockShowInputBox?.mockRestore) { mockShowInputBox.mockRestore() }
    })

    it('updates connections if valid', async () => {
        const conns = [{ id: '1', hostname: 'h', created_at: 'd' }]
        mockIsConnectionModelArray.mockReturnValueOnce(true).mockReturnValueOnce(true)
        context.globalState.get.mockReturnValue(conns)
        await updateConnections(context, conns)
        expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, conns)
    })

    it('throws if input is not a valid connection array', async () => {
        mockIsConnectionModelArray.mockReturnValueOnce(false)
        await expect(updateConnections(context, [{
            id: '',
            hostname: '',
            created_at: ''
        }])).rejects.toThrow('Invalid connection data array')
        expect(context.globalState.update).not.toHaveBeenCalled()
    })

    it('throws if stored data is invalid after update', async () => {
        const conns = [{ id: '1', hostname: 'h', created_at: 'd' }]
        mockIsConnectionModelArray.mockReturnValueOnce(true).mockReturnValueOnce(false)
        context.globalState.get.mockReturnValue('bad')
        await expect(updateConnections(context, conns)).rejects.toThrow('Stored connection data is invalid after update')
    })
})

// --- updateConnectionsCredential ---
describe('updateConnectionsCredential', () => {
    const context = { globalState: { update: vi.fn(), get: vi.fn() } } as any
    let mockShowQuickPick: any, mockShowInputBox: any, spy: any
    beforeEach(() => {
        vi.clearAllMocks()
        mockShowQuickPick = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined)
        mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue(undefined)
        spy = undefined
    })
    afterEach(() => {
        if (mockShowQuickPick?.mockRestore) { mockShowQuickPick.mockRestore() }
        if (mockShowInputBox?.mockRestore) { mockShowInputBox.mockRestore() }
        if (spy?.mockRestore) { spy.mockRestore() }
    })
    it('updates all connections with old username to new username', async () => {
        const conns = [
            { id: '1', hostname: 'h', credentialUsername: 'old', created_at: 'd' },
            { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' }
        ]
        mockGetAll.mockReturnValue(conns)
        mockIsConnectionModelArray.mockReturnValue(true)
        context.globalState.get.mockReturnValue(conns)
        const updateModule = await import('../../../src/storage/connections/update')
        spy = vi.spyOn(updateModule, 'updateConnections').mockResolvedValue(undefined)
        await updateConnectionsCredential(context, 'old', 'new')
        expect(spy).toHaveBeenCalledWith(context, [
            { id: '1', hostname: 'h', credentialUsername: 'new', created_at: 'd' },
            { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' }
        ])
    })
})

// --- clearConnectionsCredential ---
describe('clearConnectionsCredential', () => {
    const context = { globalState: { update: vi.fn(), get: vi.fn() } } as any
    let mockShowQuickPick: any, mockShowInputBox: any, spy: any
    beforeEach(() => {
        vi.clearAllMocks()
        mockShowQuickPick = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined)
        mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue(undefined)
        spy = undefined
    })
    afterEach(() => {
        if (mockShowQuickPick?.mockRestore) { mockShowQuickPick.mockRestore() }
        if (mockShowInputBox?.mockRestore) { mockShowInputBox.mockRestore() }
        if (spy?.mockRestore) { spy.mockRestore() }
    })
    it('clears credentialUsername for all matching connections and returns affected count', async () => {
        const conns = [
            { id: '1', hostname: 'h', credentialUsername: 'user', created_at: 'd' },
            { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' },
            { id: '3', hostname: 'h3', credentialUsername: 'user', created_at: 'd' }
        ]
        mockGetAll.mockReturnValue(conns)
        mockIsConnectionModelArray.mockReturnValue(true)
        context.globalState.get.mockReturnValue(conns)
        const updateModule = await import('../../../src/storage/connections/update')
        spy = vi.spyOn(updateModule, 'updateConnections').mockResolvedValue(undefined)
        const result = await clearConnectionsCredential(context, 'user')
        expect(spy).toHaveBeenCalledWith(context, [
            { id: '1', hostname: 'h', credentialUsername: undefined, created_at: 'd' },
            { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' },
            { id: '3', hostname: 'h3', credentialUsername: undefined, created_at: 'd' }
        ])
        expect(result).toBe(2)
    })
})

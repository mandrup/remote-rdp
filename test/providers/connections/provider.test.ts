import '#mocks/vscode'
import '#mocks/storage'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConnectionsProvider } from '@/providers/connections/provider'
import { __mockGetAllConnections } from '#mocks/storage'
import * as vscode from 'vscode'

describe('ConnectionsProvider', () => {
    const context = { subscriptions: { push: vi.fn() } } as any
    let provider: ConnectionsProvider
    let mockShowErrorMessage: any, mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockShowErrorMessage = vi.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined)
        mockShowQuickPick = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined)
        mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue(undefined)
        provider = new ConnectionsProvider(context)
    })

    afterEach(() => {
        if (mockShowErrorMessage && typeof mockShowErrorMessage.mockRestore === 'function') {
            mockShowErrorMessage.mockRestore()
        }
        if (mockShowQuickPick && typeof mockShowQuickPick.mockRestore === 'function') {
            mockShowQuickPick.mockRestore()
        }
        if (mockShowInputBox && typeof mockShowInputBox.mockRestore === 'function') {
            mockShowInputBox.mockRestore()
        }
    })

    it('returns the same tree item', () => {
        const item = { label: 'test' } as any
        expect(provider.getTreeItem(item)).toBe(item)
    })

    it('returns empty item if no connections', async () => {
        __mockGetAllConnections.mockReturnValue([])
        const children = await provider.getChildren()
        expect(children).toHaveLength(1)
        expect(children[0].type).toBe('empty')
        expect(children[0].label).toBe('No connections saved')
    })

    it('returns ungrouped and grouped items', async () => {
        const connections = [
            { id: '1', hostname: 'a', group: '', credentialUsername: 'u', created_at: 'd' },
            { id: '2', hostname: 'b', group: 'G', credentialUsername: 'u2', created_at: 'd' },
            { id: '3', hostname: 'c', group: 'G', credentialUsername: 'u3', created_at: 'd' },
        ]
        __mockGetAllConnections.mockReturnValue(connections)
        const children = await provider.getChildren()
        // Should have 1 ungrouped and 1 group
        expect(children.some(c => c.type === 'connection')).toBe(true)
        expect(children.some(c => c.type === 'group')).toBe(true)
    })

    it('returns group children sorted by hostname', async () => {
        const group = 'G'
        const connections = [
            { id: '1', hostname: 'b', group, credentialUsername: 'u', created_at: 'd' },
            { id: '2', hostname: 'a', group, credentialUsername: 'u2', created_at: 'd' },
        ]
        __mockGetAllConnections.mockReturnValue(connections)
        await provider.getChildren() // triggers updateGroups
        const groupItem = (await provider.getChildren()).find((c: any) => c.type === 'group')
        const groupChildren = await provider.getChildren(groupItem)
        expect((groupChildren[0] as any).connection?.hostname).toBe('a')
        expect((groupChildren[1] as any).connection?.hostname).toBe('b')
    })

    it('returns [] for non-group element', async () => {
        __mockGetAllConnections.mockReturnValue([{ id: '1', hostname: 'a', group: '', credentialUsername: 'u', created_at: 'd' }])
        const result = await provider.getChildren({ type: 'connection' } as any)
        expect(result).toEqual([])
    })

    it('handles errors and shows error message', async () => {
        __mockGetAllConnections.mockImplementation(() => { throw new Error('fail') })
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const result = await provider.getChildren()
        expect(result).toEqual([])
        expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to load connections.')
        expect(spy).toHaveBeenCalledWith('Failed to get connections:', expect.anything())
        spy.mockRestore()
    })

    it('createConnectionItem returns correct item', () => {
        const conn = { id: '1', hostname: 'h', credentialUsername: 'u', created_at: 'd' }
        const item = provider['createConnectionItem'](conn as any)
        expect(item.label).toBe('h')
        expect(item.type).toBe('connection')
        expect(item.connection).toBe(conn)
        expect(item.contextValue).toBe('connectionItem')
        expect(typeof item.iconPath === 'object' && item.iconPath !== null ? (item.iconPath as any).id : undefined).toBe('remote')
        expect(item.description).toBe('u')
        expect(item.command?.command).toBe('remote-rdp:connection:connect')
        expect(item.command?.arguments?.[0]).toBe(conn)
    })

    it('createGroupItem returns correct item', () => {
        const conns = [
            { id: '1', hostname: 'h', group: 'G', credentialUsername: 'u', created_at: 'd' }
        ]
        const item = provider['createGroupItem']('G', conns as any)
        expect(item.label).toBe('G')
        expect(item.type).toBe('group')
        expect(item.group).toBe('G')
        expect(item.connections).toBe(conns)
        expect(item.contextValue).toBe('connectionGroup')
        expect(typeof item.iconPath === 'object' && item.iconPath !== null ? (item.iconPath as any).id : undefined).toBe('folder')
        expect(item.tooltip).toBe('1 connection(s)')
    })

    it('createEmptyItem returns correct item', () => {
        const item = provider['createEmptyItem']()
        expect(item.label).toBe('No connections saved')
        expect(item.type).toBe('empty')
        expect(item.contextValue).toBe('emptyConnections')
        expect(typeof item.iconPath === 'object' && item.iconPath !== null ? (item.iconPath as any).id : undefined).toBe('info')
    })

    it('updateGroups groups by trimmed group name and Ungrouped', () => {
        const connections = [
            { id: '1', hostname: 'a', group: ' G ', credentialUsername: 'u', created_at: 'd' },
            { id: '2', hostname: 'b', group: '', credentialUsername: 'u2', created_at: 'd' },
            { id: '3', hostname: 'c', credentialUsername: 'u3', created_at: 'd' },
        ]
        provider['updateGroups'](connections as any)
        expect(provider['groups'].has('G')).toBe(true)
        expect(provider['groups'].has('Ungrouped')).toBe(true)
        expect(provider['groups'].get('G')).toHaveLength(1)
        expect(provider['groups'].get('Ungrouped')).toHaveLength(2)
    })
})
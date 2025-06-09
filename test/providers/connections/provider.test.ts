import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { standardBeforeEach, __mockStorage } from '../../test-utils'
import { ConnectionsProvider } from '@/providers/connections/provider'
import * as vscode from 'vscode'

describe('ConnectionsProvider', () => {
    const context = { subscriptions: { push: vi.fn() } } as any
    let provider: ConnectionsProvider
    let mockShowErrorMessage: any, mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(() => {
        standardBeforeEach()
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
        __mockStorage.connection.getAll.mockReturnValue([])
        const children = await provider.getChildren()
        expect(children).toHaveLength(1)
        expect(children[0].type).toBe('empty')
        expect(children[0].label).toBe('No connections saved')
    })

    it('returns ungrouped and grouped items', async () => {
        const connections = [
            { id: '1', hostname: 'a', group: '', credentialId: 'u', createdAt: 'd' },
            { id: '2', hostname: 'b', group: 'G', credentialId: 'u2', createdAt: 'd' },
            { id: '3', hostname: 'c', group: 'G', credentialId: 'u3', createdAt: 'd' },
        ]
        __mockStorage.connection.getAll.mockReturnValue(connections)
        const children = await provider.getChildren()
        expect(children.some(c => c.type === 'connection')).toBe(true)
        expect(children.some(c => c.type === 'group')).toBe(true)
    })

    it('returns group children sorted by hostname', async () => {
        const group = 'G'
        const connections = [
            { id: '1', hostname: 'b', group, credentialId: 'u', createdAt: 'd' },
            { id: '2', hostname: 'a', group, credentialId: 'u2', createdAt: 'd' },
        ]
        __mockStorage.connection.getAll.mockReturnValue(connections)
        await provider.getChildren()
        const groupItem = (await provider.getChildren()).find((c: any) => c.type === 'group')
        const groupChildren = await provider.getChildren(groupItem)
        expect((groupChildren[0] as any).connection?.hostname).toBe('a')
        expect((groupChildren[1] as any).connection?.hostname).toBe('b')
    })

    it('returns [] for non-group element', async () => {
        __mockStorage.connection.getAll.mockReturnValue([{ id: '1', hostname: 'a', group: '', credentialId: 'u', createdAt: 'd' }])
        const result = await provider.getChildren({ type: 'connection' } as any)
        expect(result).toEqual([])
    })

    it('handles errors and shows error message', async () => {
        __mockStorage.connection.getAll.mockImplementation(() => { throw new Error('fail') })
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const result = await provider.getChildren()
        expect(result).toEqual([])
        expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to load connections.')
        expect(spy).toHaveBeenCalledWith('[provider-get connections] Error: fail')
        spy.mockRestore()
    })

    it('createConnectionItem returns correct item', async () => {
        const conn = { id: '1', hostname: 'h', credentialId: 'u', createdAt: 'd' }
        __mockStorage.credential.get = vi.fn().mockResolvedValue({ id: 'u', username: 'u' })
        const item = await provider['createConnectionItem'](conn as any)
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
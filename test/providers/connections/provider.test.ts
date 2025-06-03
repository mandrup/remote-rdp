import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { ConnectionsProvider } from '../../../src/providers/connections/provider'

vi.mock('vscode', () => ({
    window: {
        showWarningMessage: vi.fn(),
        showQuickPick: vi.fn(),
        showInputBox: vi.fn(),
        showErrorMessage: vi.fn(),
    },
    commands: {
        registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    },
    ThemeIcon: class { constructor(public id: string) {} },
    TreeItem: class { label: string; collapsibleState: any; id: string | undefined; type: string | undefined; contextValue: string | undefined; iconPath: any; description: string | undefined; command: any; group?: string; connections?: any[]; tooltip?: string; constructor(label: string, collapsibleState: any) { this.label = label; this.collapsibleState = collapsibleState; } },
    TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
    EventEmitter: class<T> {
        private listeners: Array<(e: T) => any> = [];
        fire(event: T) { this.listeners.forEach(fn => fn(event)); }
        event = (listener: (e: T) => any) => { this.listeners.push(listener); return { dispose: () => {} }; };
        dispose() { this.listeners = []; }
    },
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

describe('ConnectionsProvider', () => {
    const context = { subscriptions: { push: vi.fn() } } as any
    let provider: ConnectionsProvider
    let __mockGetAll: any, mockShowErrorMessage: any, mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
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
        __mockGetAll.mockReturnValue([])
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
        __mockGetAll.mockReturnValue(connections)
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
        __mockGetAll.mockReturnValue(connections)
        await provider.getChildren() // triggers updateGroups
        const groupItem = (await provider.getChildren()).find((c: any) => c.type === 'group')
        const groupChildren = await provider.getChildren(groupItem)
        expect((groupChildren[0] as any).connection?.hostname).toBe('a')
        expect((groupChildren[1] as any).connection?.hostname).toBe('b')
    })

    it('returns [] for non-group element', async () => {
        __mockGetAll.mockReturnValue([{ id: '1', hostname: 'a', group: '', credentialUsername: 'u', created_at: 'd' }])
        const result = await provider.getChildren({ type: 'connection' } as any)
        expect(result).toEqual([])
    })

    it('handles errors and shows error message', async () => {
        __mockGetAll.mockImplementation(() => { throw new Error('fail') })
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

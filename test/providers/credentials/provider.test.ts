import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { CredentialsProvider } from '../../../src/providers/credentials/provider'

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
    TreeItem: class { label: string; collapsibleState: any; id: string | undefined; type: string | undefined; contextValue: string | undefined; iconPath: any; credential?: any; constructor(label: string, collapsibleState: any) { this.label = label; this.collapsibleState = collapsibleState; } },
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
            credential: {
                getAll: mockGetAll,
            },
        },
        __mockGetAll: mockGetAll,
    }
})

describe('CredentialsProvider', () => {
    const context = { subscriptions: { push: vi.fn() } } as any
    let provider: CredentialsProvider
    let __mockGetAll: any, mockShowErrorMessage: any, mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        mockShowErrorMessage = vi.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined)
        mockShowQuickPick = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined)
        mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue(undefined)
        provider = new CredentialsProvider(context)
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

    it('returns empty item if no credentials', async () => {
        __mockGetAll.mockResolvedValue([])
        const children = await provider.getChildren()
        expect(children).toHaveLength(1)
        expect(children[0].type).toBe('empty')
        expect(children[0].label).toBe('No credentials saved')
    })

    it('returns credential items sorted by username', async () => {
        const credentials = [
            { id: '2', username: 'b', password: 'p', created_at: 'd' },
            { id: '1', username: 'a', password: 'p', created_at: 'd' },
        ]
        __mockGetAll.mockResolvedValue(credentials)
        const children = await provider.getChildren()
        expect(children).toHaveLength(2)
        expect(children[0].label).toBe('a')
        expect(children[1].label).toBe('b')
        expect(children[0].type).toBe('credential')
        expect(children[1].type).toBe('credential')
    })

    it('returns [] for non-root element', async () => {
        __mockGetAll.mockResolvedValue([{ id: '1', username: 'a', password: 'p', created_at: 'd' }])
        const result = await provider.getChildren({ type: 'credential' } as any)
        expect(result).toEqual([])
    })

    it('handles errors and shows error message', async () => {
        __mockGetAll.mockImplementation(() => { throw new Error('fail') })
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const result = await provider.getChildren()
        expect(result).toEqual([])
        expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to load credentials.')
        expect(spy).toHaveBeenCalledWith('Failed to get credentials:', expect.anything())
        spy.mockRestore()
    })

    it('createCredentialTreeItem returns correct item', () => {
        const cred = { id: '1', username: 'u', password: 'p', created_at: 'd' }
        const item = provider['createCredentialTreeItem'](cred as any)
        expect(item.label).toBe('u')
        expect(item.type).toBe('credential')
        expect(item.credential).toBe(cred)
        expect(item.contextValue).toBe('credentialItem')
        expect(typeof item.iconPath === 'object' && item.iconPath !== null ? (item.iconPath as any).id : undefined).toBe('key')
    })

    it('createEmptyItem returns correct item', () => {
        const item = provider['createEmptyItem']()
        expect(item.label).toBe('No credentials saved')
        expect(item.type).toBe('empty')
        expect(item.contextValue).toBe('emptyCredentials')
        expect(typeof item.iconPath === 'object' && item.iconPath !== null ? (item.iconPath as any).id : undefined).toBe('info')
    })
})

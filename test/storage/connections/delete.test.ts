import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { deleteConnection } from '../../../src/storage/connections/delete'

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
    const mockUpdateAll = vi.fn()
    return {
        Storage: {
            connection: {
                getAll: mockGetAll,
                updateAll: mockUpdateAll,
            },
        },
        __mockGetAll: mockGetAll,
        __mockUpdateAll: mockUpdateAll,
    }
})

describe('deleteConnection', () => {
    const context = {} as any
    let __mockGetAll: any, __mockUpdateAll: any, mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockUpdateAll = (await import('../../../src/storage')).__mockUpdateAll
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

    it('removes the connection with the given id and updates storage', async () => {
        const connections = [
            { id: '1', hostname: 'h1' },
            { id: '2', hostname: 'h2' }
        ]
        __mockGetAll.mockReturnValue(connections)
        __mockUpdateAll.mockResolvedValue(undefined)
        await deleteConnection(context, '1')
        expect(__mockUpdateAll).toHaveBeenCalledWith(context, [
            { id: '2', hostname: 'h2' }
        ])
    })

    it('does nothing if id does not exist', async () => {
        const connections = [
            { id: '1', hostname: 'h1' }
        ]
        __mockGetAll.mockReturnValue(connections)
        __mockUpdateAll.mockResolvedValue(undefined)
        await deleteConnection(context, 'notfound')
        expect(__mockUpdateAll).toHaveBeenCalledWith(context, [
            { id: '1', hostname: 'h1' }
        ])
    })
})

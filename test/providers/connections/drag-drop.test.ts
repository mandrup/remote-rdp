import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { ConnectionsDragDropController } from '../../../src/providers/connections/drag-drop'
import { MIME_TYPES } from '../../../src/constants'

vi.mock('vscode', () => ({
    window: {
        showWarningMessage: vi.fn(),
        showQuickPick: vi.fn(),
        showInputBox: vi.fn(),
        showErrorMessage: vi.fn(),
    },
    DataTransfer: class {
        private map = new Map()
        get(type: string) { return this.map.get(type) }
        set(type: string, item: any) { this.map.set(type, item) }
    },
    DataTransferItem: class {
        constructor(private value: string) {}
        async asString() { return this.value }
    },
    CancellationToken: class {
        isCancellationRequested = false
    },
    TreeItem: class {},
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

describe('ConnectionsDragDropController', () => {
    const context = {} as any
    let refresh: any, controller: ConnectionsDragDropController
    let __mockGetAll: any, __mockUpdateAll: any, mockShowErrorMessage: any

    beforeEach(async () => {
        vi.clearAllMocks()
        refresh = vi.fn()
        controller = new ConnectionsDragDropController(context, refresh)
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
        // @ts-expect-error: mock property only exists in test
        __mockUpdateAll = (await import('../../../src/storage')).__mockUpdateAll
        mockShowErrorMessage = vi.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined)
    })

    afterEach(() => {
        if (mockShowErrorMessage && typeof mockShowErrorMessage.mockRestore === 'function') {
            mockShowErrorMessage.mockRestore()
        }
    })

    it('returns correct drag/drop mime types', () => {
        expect(controller.dragMimeTypes).toEqual([MIME_TYPES.connection])
        expect(controller.dropMimeTypes).toEqual([MIME_TYPES.connection])
    })

    it('getDragMimeTypes returns connection mime if all are connections', () => {
        const items = [{ type: 'connection' }, { type: 'connection' }]
        expect(controller.getDragMimeTypes(items as any)).toEqual([MIME_TYPES.connection])
    })

    it('getDragMimeTypes returns empty if not all are connections', () => {
        const items = [{ type: 'connection' }, { type: 'group' }]
        expect(controller.getDragMimeTypes(items as any)).toEqual([])
    })

    it('getDropMimeTypes returns connection mime for group', () => {
        expect(controller.getDropMimeTypes({ type: 'group' } as any)).toEqual([MIME_TYPES.connection])
    })

    it('getDropMimeTypes returns empty for non-group', () => {
        expect(controller.getDropMimeTypes({ type: 'connection' } as any)).toEqual([])
    })

    describe('handleDrop', () => {
        let token: any
        let sources: any
        let groupTarget: any
        let connectionItem: any
        beforeEach(() => {
            token = { isCancellationRequested: false }
            sources = new vscode.DataTransfer()
            groupTarget = { type: 'group', group: 'G' }
            connectionItem = { type: 'connection', id: '1', connection: { id: '1', group: 'Old' } }
        })

        it('returns early if cancelled or not group', async () => {
            token.isCancellationRequested = true
            await controller.handleDrop(groupTarget, sources, token)
            expect(__mockGetAll).not.toHaveBeenCalled()
            await controller.handleDrop({ type: 'connection' } as any, sources, {
                isCancellationRequested: false,
                onCancellationRequested: () => ({ dispose: () => {} })
            })
            expect(__mockGetAll).not.toHaveBeenCalled()
        })

        it('returns early if no data for mime type', async () => {
            await controller.handleDrop(groupTarget, sources, token)
            expect(__mockGetAll).not.toHaveBeenCalled()
        })

        it('returns early if dragged items cannot be parsed', async () => {
            sources.set(MIME_TYPES.connection, new vscode.DataTransferItem('not json'))
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
            await controller.handleDrop(groupTarget, sources, token)
            expect(spy).toHaveBeenCalledWith('Failed to parse dragged items:', expect.anything())
            spy.mockRestore()
        })

        it('returns early if no dragged connections', async () => {
            sources.set(MIME_TYPES.connection, new vscode.DataTransferItem(JSON.stringify([{ type: 'group' }])))
            await controller.handleDrop(groupTarget, sources, token)
            expect(__mockGetAll).not.toHaveBeenCalled()
        })

        it('updates connections and calls refresh', async () => {
            sources.set(MIME_TYPES.connection, new vscode.DataTransferItem(JSON.stringify([connectionItem])))
            __mockGetAll.mockReturnValue([{ id: '1', group: 'Old' }, { id: '2', group: 'Other' }])
            __mockUpdateAll.mockResolvedValue(undefined)
            await controller.handleDrop(groupTarget, sources, token)
            expect(__mockGetAll).toHaveBeenCalled()
            expect(__mockUpdateAll).toHaveBeenCalledWith(context, [
                { id: '1', group: 'G' },
                { id: '2', group: 'Other' }
            ])
            expect(refresh).toHaveBeenCalled()
        })

        it('sets group to undefined if target group is Ungrouped', async () => {
            sources.set(MIME_TYPES.connection, new vscode.DataTransferItem(JSON.stringify([connectionItem])))
            __mockGetAll.mockReturnValue([{ id: '1', group: 'Old' }])
            __mockUpdateAll.mockResolvedValue(undefined)
            await controller.handleDrop({ type: 'group', group: 'Ungrouped' } as any, sources, token)
            expect(__mockUpdateAll).toHaveBeenCalledWith(context, [
                { id: '1', group: undefined }
            ])
        })

        it('shows error if updateAll throws', async () => {
            sources.set(MIME_TYPES.connection, new vscode.DataTransferItem(JSON.stringify([connectionItem])))
            __mockGetAll.mockReturnValue([{ id: '1', group: 'Old' }])
            __mockUpdateAll.mockRejectedValue(new Error('fail'))
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
            await controller.handleDrop(groupTarget, sources, token)
            expect(spy).toHaveBeenCalledWith('Failed to update connections:', expect.anything())
            expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to update connection.')
            spy.mockRestore()
        })
    })

    describe('handleDrag', () => {
        let token: any
        let dataTransfer: any
        let connectionItem: any
        beforeEach(() => {
            token = { isCancellationRequested: false }
            dataTransfer = new vscode.DataTransfer()
            connectionItem = { type: 'connection', id: '1', connection: { id: '1', group: 'Old' } }
        })

        it('returns early if cancelled', async () => {
            token.isCancellationRequested = true
            await controller.handleDrag([connectionItem], dataTransfer, token)
            expect(dataTransfer.get(MIME_TYPES.connection)).toBeUndefined()
        })

        it('returns early if no connection items', async () => {
            await controller.handleDrag([{ type: 'group', group: 'G', connections: [] }], dataTransfer, token)
            expect(dataTransfer.get(MIME_TYPES.connection)).toBeUndefined()
        })

        it('sets DataTransfer with connection items', async () => {
            await controller.handleDrag([connectionItem], dataTransfer, token)
            const item = dataTransfer.get(MIME_TYPES.connection)
            expect(item).toBeDefined()
            expect(await item.asString()).toBe(JSON.stringify([connectionItem]))
        })

        it('logs error if set throws', async () => {
            const badDataTransfer = { set: () => { throw new Error('fail') } }
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
            await controller.handleDrag([connectionItem], badDataTransfer as any, token)
            expect(spy).toHaveBeenCalledWith('Failed to handle drag:', expect.anything())
            spy.mockRestore()
        })
    })
})

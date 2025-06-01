/*
import * as assert from 'assert'
import * as vscode from 'vscode'
import { ConnectionsDragDropController } from '../../../providers/connections/drag-drop'
import { MIME_TYPES } from '../../../constants'
import { Storage } from '../../../storage'

function createMockContext(): vscode.ExtensionContext {
    return {
        globalState: { get: () => undefined, update: () => Promise.resolve() },
        workspaceState: { get: () => undefined, update: () => Promise.resolve() },
        subscriptions: [],
    } as any
}

function createMockConnection(id: string, group?: string) {
    return { id, group, hostname: 'host', credentialUsername: 'user' }
}

suite('ConnectionsDragDropController', () => {
    let context: vscode.ExtensionContext
    let refreshCalled: boolean
    let controller: ConnectionsDragDropController
    let originalReadAll: any
    let originalUpdateAll: any

    beforeEach(() => {
        context = createMockContext()
        refreshCalled = false
        controller = new ConnectionsDragDropController(context, () => { refreshCalled = true })
    })

    afterEach(() => {
        if (originalReadAll) {
            Storage.connection.readAll = originalReadAll
        }
        if (originalUpdateAll) {
            Storage.connection.updateAll = originalUpdateAll
        }
        originalReadAll = undefined
        originalUpdateAll = undefined
    })

    test('getDragMimeTypes returns correct mime type for connection items', () => {
        const items = [{ type: 'connection' }, { type: 'connection' }]
        const result = controller.getDragMimeTypes(items as any)
        assert.deepStrictEqual(result, [MIME_TYPES.connection])
    })

    test('getDragMimeTypes returns empty array for non-connection items', () => {
        const items = [{ type: 'group' }]
        const result = controller.getDragMimeTypes(items as any)
        assert.deepStrictEqual(result, [])
    })

    test('getDropMimeTypes returns correct mime type for group target', () => {
        const target = { type: 'group' }
        const result = controller.getDropMimeTypes(target as any)
        assert.deepStrictEqual(result, [MIME_TYPES.connection])
    })

    test('getDropMimeTypes returns empty array for non-group target', () => {
        const target = { type: 'connection' }
        const result = controller.getDropMimeTypes(target as any)
        assert.deepStrictEqual(result, [])
    })

    test('handleDrag sets dataTransfer for connection items', async () => {
        const items = [{ type: 'connection', id: '1', connection: createMockConnection('1') }]
        const dataTransfer = new vscode.DataTransfer()
        const token = { isCancellationRequested: false } as vscode.CancellationToken

        await controller.handleDrag(items as any, dataTransfer, token)
        const dtItem = dataTransfer.get(MIME_TYPES.connection)
        assert.ok(dtItem)
        const parsed = JSON.parse(await dtItem!.asString())
        assert.strictEqual(parsed[0].id, '1')
    })

    test('handleDrag does nothing if token is cancelled', async () => {
        const items = [{ type: 'connection', id: '1', connection: createMockConnection('1') }]
        const dataTransfer = new vscode.DataTransfer()
        const token = { isCancellationRequested: true } as vscode.CancellationToken

        await controller.handleDrag(items as any, dataTransfer, token)
        assert.strictEqual(dataTransfer.get(MIME_TYPES.connection), undefined)
    })

    test('handleDrop updates group for dragged connections', async () => {
        const groupTarget = { type: 'group', group: 'NewGroup' }
        const dragged = [{ type: 'connection', id: '1', connection: createMockConnection('1') }]
        const allConnections = [
            createMockConnection('1', 'OldGroup'),
            createMockConnection('2', 'OtherGroup')
        ]

        originalReadAll = Storage.connection.readAll
        originalUpdateAll = Storage.connection.updateAll
        let updateCalled = false
        let updateArgs: any
        Storage.connection.readAll = () => allConnections
        Storage.connection.updateAll = async (_ctx: any, updated: any) => {
            updateCalled = true
            updateArgs = updated
        }

        const dataTransfer = new vscode.DataTransfer()
        dataTransfer.set(MIME_TYPES.connection, new vscode.DataTransferItem(JSON.stringify(dragged)))
        const token = { isCancellationRequested: false } as vscode.CancellationToken

        await controller.handleDrop(groupTarget as any, dataTransfer, token)

        assert.ok(updateCalled)
        assert.strictEqual(updateArgs[0].group, 'NewGroup')
        assert.strictEqual(updateArgs[1].group, 'OtherGroup')
        assert.ok(refreshCalled)
    })

    test('handleDrop does nothing if not group target', async () => {
        const target = { type: 'connection' }
        const dataTransfer = new vscode.DataTransfer()
        const token = { isCancellationRequested: false } as vscode.CancellationToken

        originalUpdateAll = Storage.connection.updateAll
        let updateCalled = false
        Storage.connection.updateAll = async () => { updateCalled = true }

        await controller.handleDrop(target as any, dataTransfer, token)
        assert.ok(!updateCalled)
    })

    test('handleDrop does nothing if token is cancelled', async () => {
        const target = { type: 'group', group: 'G' }
        const dataTransfer = new vscode.DataTransfer()
        const token = { isCancellationRequested: true } as vscode.CancellationToken

        originalUpdateAll = Storage.connection.updateAll
        let updateCalled = false
        Storage.connection.updateAll = async () => { updateCalled = true }

        await controller.handleDrop(target as any, dataTransfer, token)
        assert.ok(!updateCalled)
    })

    test('handleDrop does nothing if no data for mime type', async () => {
        const target = { type: 'group', group: 'G' }
        const dataTransfer = new vscode.DataTransfer()
        const token = { isCancellationRequested: false } as vscode.CancellationToken

        originalUpdateAll = Storage.connection.updateAll
        let updateCalled = false
        Storage.connection.updateAll = async () => { updateCalled = true }

        await controller.handleDrop(target as any, dataTransfer, token)
        assert.ok(!updateCalled)
    })

    test('handleDrop does nothing if dragged items are not connections', async () => {
        const target = { type: 'group', group: 'G' }
        const dataTransfer = new vscode.DataTransfer()
        dataTransfer.set(MIME_TYPES.connection, new vscode.DataTransferItem(JSON.stringify([{ type: 'group' }])))
        const token = { isCancellationRequested: false } as vscode.CancellationToken

        originalUpdateAll = Storage.connection.updateAll
        let updateCalled = false
        Storage.connection.updateAll = async () => { updateCalled = true }

        await controller.handleDrop(target as any, dataTransfer, token)
        assert.ok(!updateCalled)
    })
})
*/
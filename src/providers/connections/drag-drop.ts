import * as vscode from 'vscode'
import { MIME_TYPES } from '../../constants'
import { Storage } from '../../storage'
import { ConnectionTreeItem, ConnectionItem, ConnectionGroupItem } from './items'

export class ConnectionsDragDropController implements vscode.TreeDragAndDropController<ConnectionTreeItem> {
    readonly dragMimeTypes = [MIME_TYPES.connection]
    readonly dropMimeTypes = [MIME_TYPES.connection]

    constructor(private readonly context: vscode.ExtensionContext, private readonly refresh: () => void) { }

    getDragMimeTypes(source: ConnectionTreeItem[]): string[] {
        return source.every(item => item.type === 'connection') ? [MIME_TYPES.connection] : []
    }

    getDropMimeTypes(target: ConnectionTreeItem): string[] {
        return target.type === 'group' ? [MIME_TYPES.connection] : []
    }

    async handleDrop(
        target: ConnectionTreeItem,
        sources: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        if (token.isCancellationRequested || target.type !== 'group') {
            return
        }

        const targetGroup = (target as ConnectionGroupItem).group
        const data = sources.get(MIME_TYPES.connection)
        if (!data) {
            return
        }

        let draggedItems: ConnectionTreeItem[]
        try {
            draggedItems = JSON.parse(await data.asString())
        } catch (err) {
            console.error('Failed to parse dragged items:', err)
            return
        }

        const draggedConnections = draggedItems
            .filter((item): item is ConnectionItem => item.type === 'connection')
            .map(item => item.connection)

        if (!draggedConnections.length) { return }

        const allConnections = Storage.connection.readAll(this.context)
        const updated = allConnections.map(conn =>
            draggedConnections.some(d => d.id === conn.id)
                ? { ...conn, group: targetGroup === 'Ungrouped' ? undefined : targetGroup }
                : conn
        )

        try {
            await Storage.connection.updateAll(this.context, updated)
            this.refresh()
        } catch (err) {
            console.error('Failed to update connections:', err)
            vscode.window.showErrorMessage('Failed to update connection.')
        }
    }

    async handleDrag(
        source: ConnectionTreeItem[],
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        if (token.isCancellationRequested) {
            return
        }

        const items = source.filter((item): item is ConnectionItem => item.type === 'connection')
        if (!items.length) {
            return
        }

        try {
            dataTransfer.set(MIME_TYPES.connection, new vscode.DataTransferItem(JSON.stringify(items)))
        } catch (err) {
            console.error('Failed to handle drag:', err)
        }
    }
}

import * as vscode from 'vscode'
import BaseProvider from '../base-provider'
import { Storage } from '../../storage'
import { COMMAND_IDS, MIME_TYPES } from '../../constants'
import { ConnectionTreeItem, ConnectionItem, ConnectionGroupItem, EmptyItem } from './items'
import { ConnectionModel } from '../../models/connection'

export class ConnectionsProvider extends BaseProvider<ConnectionTreeItem> implements vscode.TreeDragAndDropController<ConnectionTreeItem> {
    private readonly groups = new Map<string, ConnectionModel[]>()

    readonly dragMimeTypes = [MIME_TYPES.connection]
    readonly dropMimeTypes = [MIME_TYPES.connection]

    constructor(private readonly context: vscode.ExtensionContext) {
        super()

        if (!process.env.VSCODE_TEST) {
            context.subscriptions.push(
                vscode.commands.registerCommand(COMMAND_IDS.connection.refresh, () => this.refresh())
            )
            this.refresh()
        }
    }

    getTreeItem(element: ConnectionTreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: ConnectionTreeItem): Promise<ConnectionTreeItem[]> {
        try {
            const connections = Storage.connection.readAll(this.context)

            if (element) {
                if (element.type === 'group') {
                    return element.connections.map(conn => this.createConnectionItem(conn))
                }
                return []
            }

            if (!connections.length) {
                return [this.createEmptyItem()]
            }

            this.updateGroups(connections)

            const ungrouped = connections
                .filter(conn => !conn.group?.trim())
                .map(conn => this.createConnectionItem(conn))

            const grouped = [...this.groups.entries()]
                .filter(([group]) => group !== 'Ungrouped')
                .map(([group, conns]) => this.createGroupItem(group, conns))

            return [...ungrouped, ...grouped]
        } catch (error) {
            console.error('Failed to get connections:', error)
            vscode.window.showErrorMessage('Failed to load connections.')
            return []
        }
    }

    private createConnectionItem(connection: ConnectionModel): ConnectionItem {
        const item = new vscode.TreeItem(connection.hostname, vscode.TreeItemCollapsibleState.None) as ConnectionItem
        item.id = connection.id
        item.type = 'connection'
        item.connection = connection
        item.contextValue = 'connectionItem'
        item.iconPath = new vscode.ThemeIcon('remote')
        item.description = connection.credentialUsername ?? 'No credential assigned'
        return item
    }

    private createGroupItem(group: string, connections: ConnectionModel[]): ConnectionGroupItem {
        const item = new vscode.TreeItem(group, vscode.TreeItemCollapsibleState.Expanded) as ConnectionGroupItem
        item.type = 'group'
        item.group = group
        item.connections = connections
        item.contextValue = 'connectionGroup'
        item.iconPath = new vscode.ThemeIcon('folder')
        item.tooltip = `${connections.length} connection(s)`
        return item
    }

    private createEmptyItem(): EmptyItem {
        const item = new vscode.TreeItem('No connections saved', vscode.TreeItemCollapsibleState.None) as EmptyItem
        item.id = 'empty'
        item.type = 'empty'
        item.contextValue = 'emptyConnections'
        item.iconPath = new vscode.ThemeIcon('info')
        return item
    }

    private updateGroups(connections: ConnectionModel[]): void {
        this.groups.clear()
        for (const conn of connections) {
            const group = conn.group?.trim() || 'Ungrouped'
            if (!this.groups.has(group)) {
                this.groups.set(group, [])
            }
            this.groups.get(group)!.push(conn)
        }
    }

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

        if (!draggedConnections.length) {
            return
        }

        const allConnections = Storage.connection.readAll(this.context)
        const updated = allConnections.map(conn =>
            draggedConnections.some(d => d.id === conn.id)
                ? { ...conn, group: targetGroup === 'Ungrouped' ? undefined : targetGroup }
                : conn
        )

        try {
            await Storage.connection.updateAll(this.context, updated)
            this.updateGroups(updated)
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
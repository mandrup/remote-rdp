import * as vscode from 'vscode'
import BaseProvider from '../base-provider'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { ConnectionTreeItem, ConnectionItem, ConnectionGroupItem, EmptyItem } from './items'
import { ConnectionModel } from '../../models/connection'
import { 
    createConnectionTreeItem, 
    createGroupTreeItem, 
    createEmptyTreeItem,
    sortConnectionsByHostname,
    groupConnectionsByGroup,
    handleProviderError
} from '../shared'

export class ConnectionsProvider extends BaseProvider<ConnectionTreeItem> implements vscode.TreeDataProvider<ConnectionTreeItem> {
    protected readonly groups = new Map<string, ConnectionModel[]>()

    constructor(protected readonly context: vscode.ExtensionContext) {
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
            const connections = Storage.connection.getAll(this.context)

            if (element) {
                if (element.type === 'group') {
                    const items = await Promise.all(
                        sortConnectionsByHostname(element.connections)
                            .map(conn => this.createConnectionItem(conn))
                    )
                    return items
                }
                return []
            }

            if (!connections.length) {
                return [this.createEmptyItem()]
            }

            return this.organizeConnections(connections)
        } catch (error) {
            return handleProviderError('get connections', error, 'Failed to load connections.')
        }
    }

    protected async createConnectionItem(connection: ConnectionModel): Promise<ConnectionItem> {
        let credentialUsername = 'No credential assigned'
        if (connection.credentialId) {
            const credential = await Storage.credential.get(this.context, connection.credentialId)
            if (credential) {
                credentialUsername = credential.username
            }
        }
        
        const item = createConnectionTreeItem(connection, credentialUsername) as ConnectionItem
        item.type = 'connection'
        item.connection = connection
        return item
    }

    protected createGroupItem(group: string, connections: ConnectionModel[]): ConnectionGroupItem {
        const item = createGroupTreeItem(group, connections) as ConnectionGroupItem
        item.type = 'group'
        item.group = group
        item.connections = connections
        return item
    }

    protected createEmptyItem(): EmptyItem {
        const item = createEmptyTreeItem(
            'No connections saved',
            'emptyConnections'
        ) as EmptyItem
        item.type = 'empty'
        return item
    }

    protected updateGroups(connections: ConnectionModel[]): void {
        this.groups.clear()
        for (const conn of connections) {
            const group = conn.group?.trim() || null
            const groupKey = group || 'Ungrouped'
            if (!this.groups.has(groupKey)) {
                this.groups.set(groupKey, [])
            }
            this.groups.get(groupKey)!.push(conn)
        }
    }

    protected async organizeConnections(connections: ConnectionModel[]): Promise<ConnectionTreeItem[]> {
        const groups = groupConnectionsByGroup(connections)
        
        this.groups.clear()
        groups.forEach((conns, group) => {
            this.groups.set(group, conns)
        })

        const ungrouped = await Promise.all(
            sortConnectionsByHostname(connections.filter(conn => !conn.group?.trim()))
                .map(conn => this.createConnectionItem(conn))
        )

        const grouped = [...groups.entries()]
            .filter(([group]) => group !== 'Ungrouped')
            .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
            .map(([group, conns]) => this.createGroupItem(group, conns))

        return [...ungrouped, ...grouped]
    }
}

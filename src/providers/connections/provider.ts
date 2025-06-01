import * as vscode from 'vscode'
import BaseProvider from '../base-provider'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { ConnectionTreeItem, ConnectionItem, ConnectionGroupItem, EmptyItem } from './items'
import { ConnectionModel } from '../../models/connection'

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
            const connections = Storage.connection.readAll(this.context)

            if (element) {
                if (element.type === 'group') {
                    return element.connections
                        .sort((a, b) => a.hostname.localeCompare(b.hostname))
                        .map(conn => this.createConnectionItem(conn))
                }
                return []
            }

            if (!connections.length) {
                return [this.createEmptyItem()]
            }

            this.updateGroups(connections)

            const ungrouped = connections
                .filter(conn => !conn.group?.trim())
                .sort((a, b) => a.hostname.localeCompare(b.hostname))
                .map(conn => this.createConnectionItem(conn))

            const grouped = [...this.groups.entries()]
                .filter(([group]) => group !== 'Ungrouped')
                .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
                .map(([group, conns]) => this.createGroupItem(group, conns))

            return [...ungrouped, ...grouped]
        } catch (error) {
            console.error('Failed to get connections:', error)
            vscode.window.showErrorMessage('Failed to load connections.')
            return []
        }
    }

    protected createConnectionItem(connection: ConnectionModel): ConnectionItem {
        const item = new vscode.TreeItem(connection.hostname, vscode.TreeItemCollapsibleState.None) as ConnectionItem
        item.id = connection.id
        item.type = 'connection'
        item.connection = connection
        item.contextValue = 'connectionItem'
        item.iconPath = new vscode.ThemeIcon('remote')
        item.description = connection.credentialUsername ?? 'No credential assigned'

        item.command = {
            command: 'remote-rdp:connection:connect',
            title: 'Connect',
            arguments: [connection]
        }
        return item
    }


    protected createGroupItem(group: string, connections: ConnectionModel[]): ConnectionGroupItem {
        const item = new vscode.TreeItem(group, vscode.TreeItemCollapsibleState.Expanded) as ConnectionGroupItem
        item.type = 'group'
        item.group = group
        item.connections = connections
        item.contextValue = 'connectionGroup'
        item.iconPath = new vscode.ThemeIcon('folder')
        item.tooltip = `${connections.length} connection(s)`
        return item
    }

    protected createEmptyItem(): EmptyItem {
        const item = new vscode.TreeItem('No connections saved', vscode.TreeItemCollapsibleState.None) as EmptyItem
        item.id = 'empty'
        item.type = 'empty'
        item.contextValue = 'emptyConnections'
        item.iconPath = new vscode.ThemeIcon('info')
        return item
    }

    protected updateGroups(connections: ConnectionModel[]): void {
        this.groups.clear()
        for (const conn of connections) {
            const group = conn.group?.trim() || 'Ungrouped'
            if (!this.groups.has(group)) {
                this.groups.set(group, [])
            }
            this.groups.get(group)!.push(conn)
        }
    }
}
